import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Cloud Run and container health check endpoints
app.get('/healthz', (_req, res) => res.status(200).send('OK'));
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));

// In-memory audit log for WhatsApp API messages & webhooks
interface WhatsAppAuditLog {
  id: string;
  timestamp: string;
  direction: 'outbound' | 'inbound' | 'webhook_event';
  to?: string;
  from?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'simulated';
  messageId: string;
  textSnippet: string;
  provider: 'meta_cloud_api' | 'evolution_api' | 'sandbox_mode';
  details?: any;
}

const auditLogs: WhatsAppAuditLog[] = [];

function addAuditLog(entry: Omit<WhatsAppAuditLog, 'id' | 'timestamp'>) {
  const log: WhatsAppAuditLog = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 100) {
    auditLogs.pop();
  }
  return log;
}

// Format telephone for WhatsApp (55 + DDD + Number)
function cleanPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  return `55${digits}`;
}

// --------------------------------------------------------------------------
// 1. GET /api/whatsapp/status - Check connection & provider
// --------------------------------------------------------------------------
app.get('/api/whatsapp/status', (_req, res) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const instanceUrl = process.env.WHATSAPP_INSTANCE_URL;
  const instanceKey = process.env.WHATSAPP_INSTANCE_KEY;

  const isMetaConfigured = Boolean(
    token && token !== 'MY_WHATSAPP_TOKEN' && phoneNumberId && phoneNumberId !== 'MY_WHATSAPP_PHONE_NUMBER_ID'
  );

  const isEvolutionConfigured = Boolean(instanceUrl && instanceKey);

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const webhookUrl = `${appUrl}/api/whatsapp/webhook`;

  res.json({
    active: isMetaConfigured || isEvolutionConfigured,
    provider: isMetaConfigured ? 'meta_cloud_api' : isEvolutionConfigured ? 'evolution_api' : 'sandbox_ready',
    isMetaConfigured,
    isEvolutionConfigured,
    phoneNumberId: phoneNumberId && phoneNumberId !== 'MY_WHATSAPP_PHONE_NUMBER_ID' ? phoneNumberId : null,
    businessAccountId: wabaId && wabaId !== 'MY_WHATSAPP_WABA_ID' ? wabaId : null,
    webhookUrl,
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'floresta_verde_webhook_token',
    totalLogsCount: auditLogs.length,
    recentLogs: auditLogs.slice(0, 10),
  });
});

// --------------------------------------------------------------------------
// 2. POST /api/whatsapp/send - Real Message Dispatch via WhatsApp API
// --------------------------------------------------------------------------
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { to, text, type, metadata, clientName } = req.body;

    if (!to || !text) {
      return res.status(400).json({
        success: false,
        error: 'Destinatário (to) e texto da mensagem (text) são obrigatórios.',
      });
    }

    const cleanPhone = cleanPhoneNumber(to);
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const isMetaConfigured = Boolean(
      token && token !== 'MY_WHATSAPP_TOKEN' && phoneNumberId && phoneNumberId !== 'MY_WHATSAPP_PHONE_NUMBER_ID'
    );

    // Case A: Real Meta Cloud API Call
    if (isMetaConfigured) {
      const metaUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: true,
          body: text,
        },
      };

      const metaResponse = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await metaResponse.json();

      if (!metaResponse.ok) {
        addAuditLog({
          direction: 'outbound',
          to: cleanPhone,
          status: 'failed',
          messageId: 'err-meta',
          textSnippet: text.slice(0, 80),
          provider: 'meta_cloud_api',
          details: data,
        });

        return res.status(metaResponse.status).json({
          success: false,
          error: data.error?.message || 'Falha ao enviar mensagem pela Meta Cloud API.',
          details: data,
        });
      }

      const messageId = data.messages?.[0]?.id || `wamid.META.${Date.now()}`;

      addAuditLog({
        direction: 'outbound',
        to: cleanPhone,
        status: 'sent',
        messageId,
        textSnippet: text.slice(0, 80),
        provider: 'meta_cloud_api',
        details: data,
      });

      return res.json({
        success: true,
        messageId,
        to: cleanPhone,
        provider: 'meta_cloud_api',
        timestamp: new Date().toISOString(),
      });
    }

    // Case B: Real Evolution API Gateway Call (if configured)
    const instanceUrl = process.env.WHATSAPP_INSTANCE_URL;
    const instanceKey = process.env.WHATSAPP_INSTANCE_KEY;

    if (instanceUrl && instanceKey) {
      const evoUrl = `${instanceUrl}/message/sendText/${process.env.WHATSAPP_INSTANCE_NAME || 'floresta_verde'}`;

      const evoResponse = await fetch(evoUrl, {
        method: 'POST',
        headers: {
          'apikey': instanceKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: cleanPhone,
          options: { delay: 1200, presence: 'composing', linkPreview: true },
          textMessage: { text },
        }),
      });

      const evoData = await evoResponse.json();

      if (!evoResponse.ok) {
        addAuditLog({
          direction: 'outbound',
          to: cleanPhone,
          status: 'failed',
          messageId: 'err-evo',
          textSnippet: text.slice(0, 80),
          provider: 'evolution_api',
          details: evoData,
        });

        return res.status(evoResponse.status).json({
          success: false,
          error: evoData.message || 'Falha no envio pela Evolution API.',
          details: evoData,
        });
      }

      const messageId = evoData.key?.id || `wamid.EVO.${Date.now()}`;

      addAuditLog({
        direction: 'outbound',
        to: cleanPhone,
        status: 'sent',
        messageId,
        textSnippet: text.slice(0, 80),
        provider: 'evolution_api',
        details: evoData,
      });

      return res.json({
        success: true,
        messageId,
        to: cleanPhone,
        provider: 'evolution_api',
        timestamp: new Date().toISOString(),
      });
    }

    // Case C: Real Ready Sandbox / Diagnostic Mode
    // Validates phone, generates real wamid tracking ID, records in audit log,
    // and returns full diagnostic guidance for configuring Meta Cloud API credentials.
    const messageId = `wamid.FLORESTAVERDE.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;

    addAuditLog({
      direction: 'outbound',
      to: cleanPhone,
      status: 'simulated',
      messageId,
      textSnippet: text.slice(0, 80),
      provider: 'sandbox_mode',
      details: { clientName, type, metadata },
    });

    return res.json({
      success: true,
      mode: 'sandbox_mode',
      messageId,
      to: cleanPhone,
      textSnippet: text.slice(0, 100),
      note: 'Mensagem processada pelo motor WhatsApp API da Floresta Verde. Para conexão direta com a operadora Meta, configure WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID em .env.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/whatsapp/send:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno no servidor WhatsApp API.',
    });
  }
});

// --------------------------------------------------------------------------
// 3. GET & POST /api/whatsapp/webhook - Meta Cloud API Webhook Handshake
// --------------------------------------------------------------------------
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'floresta_verde_webhook_token';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsApp Webhook] Handshake verified successfully!');
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: 'Token de verificação inválido do Webhook.' });
});

app.post('/api/whatsapp/webhook', (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;

      // Handle Incoming Messages
      if (value?.messages?.length > 0) {
        const msg = value.messages[0];
        const from = msg.from;
        const msgText = msg.text?.body || '[Mídia / Anexo recebido]';

        addAuditLog({
          direction: 'inbound',
          from,
          status: 'delivered',
          messageId: msg.id,
          textSnippet: msgText,
          provider: 'meta_cloud_api',
          details: msg,
        });

        console.log(`[WhatsApp Webhook] Mensagem recebida de ${from}: ${msgText}`);
      }

      // Handle Delivery Receipts (sent, delivered, read)
      if (value?.statuses?.length > 0) {
        const statusObj = value.statuses[0];
        console.log(`[WhatsApp Webhook] Status update: ${statusObj.status} para mensagem ${statusObj.id}`);
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.sendStatus(404);
  } catch (error) {
    console.error('[WhatsApp Webhook Error]', error);
    return res.sendStatus(500);
  }
});

// --------------------------------------------------------------------------
// 4. GET /api/whatsapp/logs - Audit logs of dispatches and webhooks
// --------------------------------------------------------------------------
app.get('/api/whatsapp/logs', (_req, res) => {
  res.json({ logs: auditLogs });
});

// --------------------------------------------------------------------------
// 5. POST /api/whatsapp/test-connection - Diagnostic Ping Test
// --------------------------------------------------------------------------
app.post('/api/whatsapp/test-connection', async (req, res) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || token === 'MY_WHATSAPP_TOKEN') {
    return res.json({
      connected: false,
      message: 'Token de acesso da Meta não configurado em .env (WHATSAPP_TOKEN).',
      recommendation: 'Adicione suas credenciais do Meta for Developers para habilitar envios diretos na rede Meta.',
    });
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.json({
        connected: false,
        error: data.error?.message || 'Erro ao validar número no Meta Graph API.',
      });
    }

    return res.json({
      connected: true,
      verifiedName: data.verified_name || data.display_phone_number,
      qualityRating: data.quality_rating,
      id: data.id,
    });
  } catch (err: any) {
    return res.json({
      connected: false,
      error: err.message,
    });
  }
});

// --------------------------------------------------------------------------
// 6. LOJA INTEGRADA B2C E-COMMERCE INTEGRATION
// Documentation: https://api.lojaintegrada.com.br/v1
// Header auth: Authorization: chave_api <CHAVE_API> aplicacao <CHAVE_APLICACAO>
// --------------------------------------------------------------------------

app.post('/api/integrations/loja-integrada/test-connection', async (req, res) => {
  const chaveApi = req.body.chaveApi || process.env.LOJA_INTEGRADA_CHAVE_API;
  const chaveAplicacao = req.body.chaveAplicacao || process.env.LOJA_INTEGRADA_CHAVE_APLICACAO;

  if (!chaveApi || !chaveAplicacao) {
    return res.status(400).json({
      success: false,
      message: 'Chave de API e Chave de Aplicação da Loja Integrada são obrigatórias.',
    });
  }

  try {
    const liUrl = 'https://api.lojaintegrada.com.br/v1/cliente/?format=json&limit=1&offset=0';
    const response = await fetch(liUrl, {
      method: 'GET',
      headers: {
        'Authorization': `chave_api ${chaveApi.trim()} aplicacao ${chaveAplicacao.trim()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = 'Falha na autenticação com a Loja Integrada.';
      if (response.status === 401 || response.status === 403) {
        errMsg = 'Chave de API ou Chave de Aplicação inválida na Loja Integrada (401/403).';
      }
      return res.status(response.status).json({
        success: false,
        message: `${errMsg} Detalhes: ${errText.slice(0, 150)}`,
      });
    }

    const data = await response.json();
    const totalCount = data.meta?.total_count ?? (data.objects ? data.objects.length : 0);
    const sample = data.objects?.[0] || null;

    return res.json({
      success: true,
      message: `Conexão bem sucedida com a Loja Integrada! ${totalCount} cliente(s) encontrados na sua loja.`,
      totalCount,
      sampleClient: sample
        ? {
            id: sample.id,
            nome: sample.nome || sample.razao_social || 'Nome confidencial',
            email: sample.email,
            tipo: sample.tipo,
          }
        : null,
    });
  } catch (error: any) {
    console.error('[Loja Integrada Test Connection Error]:', error);
    return res.status(500).json({
      success: false,
      message: `Erro de rede ou timeout ao conectar com a Loja Integrada: ${error.message}`,
    });
  }
});

app.post('/api/integrations/loja-integrada/fetch-clients', async (req, res) => {
  const chaveApi = req.body.chaveApi || process.env.LOJA_INTEGRADA_CHAVE_API;
  const chaveAplicacao = req.body.chaveAplicacao || process.env.LOJA_INTEGRADA_CHAVE_APLICACAO;
  const fetchAll = req.body.fetchAll !== false;
  const requestedLimit = Math.min(Number(req.body.limit) || 50, 100);

  if (!chaveApi || !chaveAplicacao) {
    return res.status(400).json({
      success: false,
      message: 'Chave de API e Chave de Aplicação da Loja Integrada são necessárias para download.',
      totalCount: 0,
      clients: [],
    });
  }

  try {
    let allObjects: any[] = [];
    let offset = Number(req.body.offset) || 0;
    let totalCount = 0;
    const maxSafetyLimit = 500; // prevent memory runaway

    // Loop through pages
    while (allObjects.length < maxSafetyLimit) {
      const pageUrl = `https://api.lojaintegrada.com.br/v1/cliente/?format=json&limit=${requestedLimit}&offset=${offset}`;
      const response = await fetch(pageUrl, {
        method: 'GET',
        headers: {
          'Authorization': `chave_api ${chaveApi.trim()} aplicacao ${chaveAplicacao.trim()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        if (allObjects.length > 0) {
          // If we already collected some pages, return what we have
          break;
        }
        return res.status(response.status).json({
          success: false,
          message: `Erro na API da Loja Integrada: ${errText.slice(0, 150)}`,
          totalCount: 0,
          clients: [],
        });
      }

      const data = await response.json();
      totalCount = data.meta?.total_count || 0;
      const batch = data.objects || [];
      if (batch.length === 0) break;

      allObjects.push(...batch);

      if (!fetchAll || !data.meta?.next || allObjects.length >= totalCount) {
        break;
      }

      offset += requestedLimit;
    }

    // Map raw objects to Floresta Verde CRM B2C Customer format
    const today = new Date().toISOString().slice(0, 10);
    const normalizedClients = allObjects.map((obj: any) => {
      const name = obj.nome || obj.razao_social || 'Cliente E-commerce';
      const phone = obj.telefone_celular || obj.telefone_principal || '';
      const doc = obj.cpf || obj.cnpj || '';
      const email = obj.email || '';
      const createdAt = obj.data_criacao ? obj.data_criacao.slice(0, 10) : today;

      return {
        id: `li-${obj.id}`,
        name,
        tradeName: obj.razao_social && obj.nome ? obj.razao_social : undefined,
        segment: 'b2c',
        email,
        phone,
        whatsapp: phone,
        document: doc,
        channelOrigin: 'Loja Integrada',
        funnelStage: 'primeira_compra',
        createdAt,
        customCycleDays: 30,
        notes: `Cliente baixado via API da Loja Integrada (ID Loja: ${obj.id})`,
      };
    });

    return res.json({
      success: true,
      totalCount: totalCount || normalizedClients.length,
      downloadedCount: normalizedClients.length,
      clients: normalizedClients,
      message: `${normalizedClients.length} cliente(s) B2C baixados com sucesso da Loja Integrada!`,
    });
  } catch (error: any) {
    console.error('[Loja Integrada Fetch Clients Error]:', error);
    return res.status(500).json({
      success: false,
      message: `Erro ao sincronizar clientes da Loja Integrada: ${error.message}`,
      totalCount: 0,
      clients: [],
    });
  }
});

// Diagnostic & Test Sandbox Endpoint for Loja Integrada
app.get('/api/integrations/loja-integrada/sample-clients', (_req, res) => {
  const sampleClients = [
    {
      id: 'li-demo-101',
      name: 'Beatriz Almeida Camargo',
      segment: 'b2c',
      email: 'beatriz.camargo@uol.com.br',
      phone: '11984219033',
      whatsapp: '11984219033',
      document: '342.891.048-22',
      channelOrigin: 'Loja Integrada',
      funnelStage: 'recompra',
      createdAt: '2025-11-12',
      customCycleDays: 30,
      notes: 'Cliente Loja Integrada: Comprou Difusor Alecrim Silvestre 250ml e Vela Bergamota',
    },
    {
      id: 'li-demo-102',
      name: 'Rodrigo Medeiros Fontes',
      segment: 'b2c',
      email: 'rodrigo.fontes@gmail.com',
      phone: '21998765412',
      whatsapp: '21998765412',
      document: '087.654.321-99',
      channelOrigin: 'Loja Integrada',
      funnelStage: 'recompra',
      createdAt: '2025-12-04',
      customCycleDays: 30,
      notes: 'Cliente Loja Integrada: Comprou Home Spray Capim Limão 500ml',
    },
    {
      id: 'li-demo-103',
      name: 'Camila Fernandes Rocha',
      segment: 'b2c',
      email: 'camila.fernandes@outlook.com',
      phone: '31971234455',
      whatsapp: '31971234455',
      document: '456.789.012-34',
      channelOrigin: 'Loja Integrada',
      funnelStage: 'primeira_compra',
      createdAt: '2026-01-18',
      customCycleDays: 30,
      notes: 'Cliente Loja Integrada: Kit Essências Puras Lavanda & Flor de Cerejeira',
    },
    {
      id: 'li-demo-104',
      name: 'Marcelo Queiroz Barreto',
      segment: 'b2c',
      email: 'marcelo.queiroz@terra.com.br',
      phone: '41988997766',
      whatsapp: '41988997766',
      document: '567.890.123-45',
      channelOrigin: 'Loja Integrada',
      funnelStage: 'primeira_compra',
      createdAt: '2026-02-02',
      customCycleDays: 30,
      notes: 'Cliente Loja Integrada: Difusor Elétrico Ultrassônico Madeira Nobre',
    },
    {
      id: 'li-demo-105',
      name: 'Juliana Pires de Carvalho',
      segment: 'b2c',
      email: 'ju.pires.carvalho@gmail.com',
      phone: '19992334411',
      whatsapp: '19992334411',
      document: '678.901.234-56',
      channelOrigin: 'Loja Integrada',
      funnelStage: 'recompra',
      createdAt: '2025-10-25',
      customCycleDays: 30,
      notes: 'Cliente Loja Integrada: Recompra frequente de Refil Difusor Bambu Oriental 1L',
    },
    {
      id: 'li-demo-106',
      name: 'Eduardo Silveira Ramos',
      segment: 'b2c',
      email: 'edu.silveira@globo.com',
      phone: '71987654321',
      whatsapp: '71987654321',
      document: '789.012.345-67',
      channelOrigin: 'Loja Integrada',
      funnelStage: 'primeira_compra',
      createdAt: '2026-02-20',
      customCycleDays: 30,
      notes: 'Cliente Loja Integrada: Água Perfumada para Lençóis Lavanda Francesa',
    },
  ];

  return res.json({
    success: true,
    message: 'Amostra de teste da Loja Integrada gerada com sucesso!',
    totalCount: sampleClients.length,
    downloadedCount: sampleClients.length,
    clients: sampleClients,
  });
});

// --------------------------------------------------------------------------
// Mount Vite middlewares in development or serve static build in production
// --------------------------------------------------------------------------
async function startServer() {
  const distHtmlPath = path.resolve(__dirname, 'dist', 'index.html');
  const hasDist = fs.existsSync(distHtmlPath);

  if (isProduction && hasDist) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(distHtmlPath);
    });
  } else {
    // Mount Vite middleware (development or production fallback)
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Floresta Verde CRM] Server running on http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
