export interface WhatsAppApiStatus {
  active: boolean;
  provider: 'meta_cloud_api' | 'evolution_api' | 'sandbox_ready';
  isMetaConfigured: boolean;
  isEvolutionConfigured: boolean;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  webhookUrl: string;
  verifyToken: string;
  totalLogsCount: number;
  recentLogs: Array<{
    id: string;
    timestamp: string;
    direction: 'outbound' | 'inbound' | 'webhook_event';
    to?: string;
    from?: string;
    status: string;
    messageId: string;
    textSnippet: string;
    provider: string;
  }>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  to?: string;
  timestamp?: string;
  error?: string;
  mode?: string;
  note?: string;
}

export const whatsappApiClient = {
  async getStatus(): Promise<WhatsAppApiStatus> {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) {
        throw new Error(`Status HTTP error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('Could not fetch whatsapp status', err);
      return {
        active: false,
        provider: 'sandbox_ready',
        isMetaConfigured: false,
        isEvolutionConfigured: false,
        phoneNumberId: null,
        businessAccountId: null,
        webhookUrl: '/api/whatsapp/webhook',
        verifyToken: 'floresta_verde_webhook_token',
        totalLogsCount: 0,
        recentLogs: [],
      };
    }
  },

  async sendMessage(params: {
    to: string;
    text: string;
    type?: 'text' | 'catalog_product' | 'commercial_quote' | 'boleto';
    metadata?: any;
    clientName?: string;
  }): Promise<SendMessageResult> {
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Erro ao enviar mensagem pelo servidor WhatsApp API.',
        };
      }

      return data;
    } catch (err: any) {
      console.error('Error calling /api/whatsapp/send', err);
      return {
        success: false,
        error: err.message || 'Falha de comunicação com o servidor da API WhatsApp.',
      };
    }
  },

  async testConnection(): Promise<{ connected: boolean; message?: string; error?: string; verifiedName?: string }> {
    try {
      const res = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
      });
      return await res.json();
    } catch (err: any) {
      return {
        connected: false,
        error: err.message,
      };
    }
  },

  async getLogs(): Promise<any[]> {
    try {
      const res = await fetch('/api/whatsapp/logs');
      const data = await res.json();
      return data.logs || [];
    } catch (err) {
      return [];
    }
  },
};
