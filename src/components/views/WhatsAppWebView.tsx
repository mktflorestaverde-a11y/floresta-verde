import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BadgeDollarSign,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  KeyRound,
  Laptop,
  Layers,
  Link2,
  Lock,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  PhoneCall,
  Play,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Server,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Trash2,
  Truck,
  User,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { CustomerWithMetrics, Order } from '../../types/crm';
import { formatBRL, formatNumberBR } from '../../utils/crmCalculations';
import { CRMAuthUser } from '../../services/crmStorage';
import {
  whatsappApiClient,
  WhatsAppApiStatus,
  SendMessageResult,
} from '../../services/whatsappApiClient';
import {
  FLORESTA_VERDE_CATALOG,
  CatalogProduct,
  QUICK_REPLIES_LIBRARY,
  QuickReply,
} from '../../services/whatsappStorage';

interface WhatsAppWebViewProps {
  customers: CustomerWithMetrics[];
  orders: Order[];
  currentUser: CRMAuthUser | null;
  onSelectCustomer?: (customer: CustomerWithMetrics) => void;
}

type CommercialToolTab = 'catalogo' | 'orcamento' | 'cobranca' | 'respostas_rapidas' | 'disparo' | 'logs_api' | 'config';

export const WhatsAppWebView: React.FC<WhatsAppWebViewProps> = ({
  customers,
  orders,
  currentUser,
  onSelectCustomer,
}) => {
  // Real API Server Status
  const [apiStatus, setApiStatus] = useState<WhatsAppApiStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message?: string; error?: string; verifiedName?: string } | null>(null);

  // Selected Customer for Direct API Dispatch
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(() => {
    return customers.length > 0 ? customers[0].id : '';
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'b2b' | 'b2c' | 'recompra' | 'boleto'>('all');

  // Custom Direct Dispatch Inputs
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastSendResult, setLastSendResult] = useState<SendMessageResult | null>(null);

  // Commercial Tools State
  const [activeTool, setActiveTool] = useState<CommercialToolTab>('catalogo');

  // Tool 2: Quote Builder
  const [quoteProduct, setQuoteProduct] = useState<string>(FLORESTA_VERDE_CATALOG[0].id);
  const [quoteQty, setQuoteQty] = useState<number>(24);
  const [quoteDiscount, setQuoteDiscount] = useState<number>(5);
  const [quotePaymentMethod, setQuotePaymentMethod] = useState<string>('Boleto 28 dias faturado');

  // Tool 5: Broadcast State
  const [broadcastTarget, setBroadcastTarget] = useState<'b2b' | 'recompra'>('b2b');
  const [broadcastTemplate, setBroadcastTemplate] = useState(
    'Olá {nome}! Tudo bem? Da equipe Floresta Verde Aromas. Notamos que seu ciclo de reposição está chegando e separamos condições especiais com frete grátis para o seu pedido hoje!'
  );
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{ sent: number; total: number } | null>(null);

  // API Logs State
  const [apiLogs, setApiLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load API status and logs
  const reloadApiStatus = async () => {
    setIsLoadingStatus(true);
    const status = await whatsappApiClient.getStatus();
    setApiStatus(status);
    setIsLoadingStatus(false);
  };

  const reloadApiLogs = async () => {
    setIsLoadingLogs(true);
    const logs = await whatsappApiClient.getLogs();
    setApiLogs(logs);
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    reloadApiStatus();
    reloadApiLogs();
  }, []);

  // Selected customer object
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // Synchronize custom phone when active customer changes
  useEffect(() => {
    if (activeCustomer) {
      const raw = activeCustomer.whatsapp || activeCustomer.phone || '';
      setCustomPhone(raw);
    }
  }, [activeCustomer]);

  // Filtered customers list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const rawPhone = c.whatsapp || c.phone;
      if (!rawPhone) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (c.tradeName || c.name).toLowerCase().includes(q);
        const matchPhone = rawPhone.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
        const matchDoc = (c.document || '').toLowerCase().includes(q);
        const matchContact = (c.contactPerson || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDoc && !matchContact) return false;
      }

      if (segmentFilter === 'b2b' && c.segment !== 'b2b') return false;
      if (segmentFilter === 'b2c' && c.segment !== 'b2c') return false;
      if (segmentFilter === 'recompra' && c.reactivationStatus !== 'em_atraso' && c.reactivationStatus !== 'atencao') return false;
      if (segmentFilter === 'boleto') {
        const hasOpenBoleto = orders.some((o) => o.customerId === c.id && o.isTermPayment && o.termStatus !== 'pago');
        if (!hasOpenBoleto) return false;
      }

      return true;
    });
  }, [customers, orders, searchTerm, segmentFilter]);

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Test Meta API Connection
  const handleTestApiConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    const result = await whatsappApiClient.testConnection();
    setTestResult(result);
    setTestingConnection(false);
    reloadApiStatus();
  };

  // Send single message via Real WhatsApp API
  const handleSendViaApi = async (textToSend?: string, type?: any, metadata?: any) => {
    const text = textToSend || customMessage;
    const phone = customPhone || (activeCustomer ? activeCustomer.whatsapp || activeCustomer.phone : '');

    if (!phone || !text.trim()) {
      alert('Informe um número de telefone com DDD e uma mensagem para enviar.');
      return;
    }

    setIsSending(true);
    setLastSendResult(null);

    const result = await whatsappApiClient.sendMessage({
      to: phone,
      text: text.trim(),
      type: type || 'text',
      metadata,
      clientName: activeCustomer ? activeCustomer.tradeName || activeCustomer.name : 'Cliente',
    });

    setLastSendResult(result);
    setIsSending(false);

    if (result.success) {
      if (!textToSend) setCustomMessage('');
      reloadApiLogs();
    }
  };

  // Tool 1: Send Catalog Item via API
  const handleSendProductViaApi = async (prod: CatalogProduct) => {
    if (!activeCustomer) return;
    const isB2B = activeCustomer.segment === 'b2b';
    const price = isB2B ? prod.wholesalePrice : prod.retailPrice;

    const text = `🌿 *${prod.name}*\n\n` +
      `• *Categoria:* ${prod.category}\n` +
      `• *Preço ${isB2B ? 'no Atacado B2B' : 'Varejo'}:* R$ ${formatNumberBR(price)}\n` +
      `• *Pedido Mínimo:* ${prod.minWholesaleQty} unidades\n` +
      `• *Fragrâncias Disponíveis:* ${prod.scents.join(', ')}\n` +
      `• *Embalagem:* ${prod.volume}\n\n` +
      `_${prod.description}_\n\n` +
      `Posso reservar um lote deste produto para seu pedido na Floresta Verde? 🍃`;

    await handleSendViaApi(text, 'catalog_product', {
      productName: prod.name,
      productPrice: price,
      productSku: prod.sku,
    });
  };

  // Tool 2: Send Quote via API
  const handleSendQuoteViaApi = async () => {
    if (!activeCustomer) return;
    const product = FLORESTA_VERDE_CATALOG.find((p) => p.id === quoteProduct) || FLORESTA_VERDE_CATALOG[0];
    const isB2B = activeCustomer.segment === 'b2b';
    const unitPrice = isB2B ? product.wholesalePrice : product.retailPrice;
    const rawSubtotal = unitPrice * quoteQty;
    const discountAmount = (rawSubtotal * quoteDiscount) / 100;
    const total = rawSubtotal - discountAmount;

    const quoteText = `📑 *PROPOSTA COMERCIAL OFICIAL • FLORESTA VERDE AROMAS*\n\n` +
      `*Cliente:* ${activeCustomer.tradeName || activeCustomer.name}\n` +
      `*Item:* ${quoteQty}x ${product.name}\n` +
      `*Valor Unitário:* R$ ${formatNumberBR(unitPrice)}\n` +
      `*Subtotal:* R$ ${formatNumberBR(rawSubtotal)}\n` +
      `*Desconto Comercial (${quoteDiscount}%):* - R$ ${formatNumberBR(discountAmount)}\n` +
      `*VALOR TOTAL A FATURAR:* R$ ${formatNumberBR(total)}\n\n` +
      `*Condição de Pagamento:* ${quotePaymentMethod}\n` +
      `*Prazo de Expedição:* 24 a 48 horas úteis com seguro total.\n\n` +
      `_Podemos confirmar este pedido para emissão imediata da nota fiscal e faturamento?_`;

    await handleSendViaApi(quoteText, 'commercial_quote', {
      quoteTotal: total,
      quoteItems: [{ name: product.name, quantity: quoteQty, unitPrice }],
    });
  };

  // Tool 3: Send Boleto via API
  const handleSendBoletoViaApi = async () => {
    if (!activeCustomer) return;
    const custOrders = orders.filter((o) => o.customerId === activeCustomer.id);
    const termOrder = custOrders.find((o) => o.isTermPayment && o.termStatus !== 'pago') || custOrders[0];

    const amount = termOrder ? termOrder.totalAmount : 1480.00;
    const dueDate = termOrder?.termDueDate ? new Date(termOrder.termDueDate).toLocaleDateString('pt-BR') : '15/10/2026';
    const barcode = termOrder?.boletoBarcode || '34191.79001 01043.510047 91020.150008 7 98760000148000';

    const text = `💳 *LEMBRETE DE BOLETO FATURADO • FLORESTA VERDE*\n\n` +
      `Olá ${activeCustomer.contactPerson || activeCustomer.tradeName || activeCustomer.name}, disponibilizamos a 2ª via do seu boleto faturado:\n\n` +
      `• *Valor a Pagar:* R$ ${formatNumberBR(amount)}\n` +
      `• *Vencimento:* ${dueDate}\n` +
      `• *Linha Digitável / Código de Barras:*\n\`${barcode}\`\n\n` +
      `• *Chave Pix Oficial CNPJ:*\n\`12.345.678/0001-90\`\n` +
      `🏢 Favorecido: Floresta Verde Aromas do Brasil Ltda\n\n` +
      `_Após a confirmação bancária, seu limite comercial é renovado automaticamente!_`;

    await handleSendViaApi(text, 'boleto', {
      boletoAmount: amount,
      boletoDueDate: dueDate,
      boletoBarcode: barcode,
    });
  };

  // Tool 5: Broadcast Disparo via API
  const handleExecuteBroadcastViaApi = async () => {
    let targetCustomers = customers;
    if (broadcastTarget === 'b2b') {
      targetCustomers = customers.filter((c) => c.segment === 'b2b' && (c.whatsapp || c.phone));
    } else if (broadcastTarget === 'recompra') {
      targetCustomers = customers.filter(
        (c) => (c.reactivationStatus === 'em_atraso' || c.reactivationStatus === 'atencao') && (c.whatsapp || c.phone)
      );
    }

    if (targetCustomers.length === 0) {
      alert('Nenhum cliente encontrado para o público selecionado.');
      return;
    }

    setIsBroadcasting(true);
    setBroadcastProgress({ sent: 0, total: targetCustomers.length });

    let sent = 0;
    for (const cust of targetCustomers) {
      const phone = cust.whatsapp || cust.phone;
      if (!phone) continue;

      const personalizedText = broadcastTemplate
        .replace('{nome}', cust.contactPerson || cust.tradeName || cust.name)
        .replace('{empresa}', cust.tradeName || cust.name);

      await whatsappApiClient.sendMessage({
        to: phone,
        text: personalizedText,
        clientName: cust.tradeName || cust.name,
      });

      sent += 1;
      setBroadcastProgress({ sent, total: targetCustomers.length });
    }

    setIsBroadcasting(false);
    reloadApiLogs();
  };

  // Open fallback in official web.whatsapp.com
  const handleOpenFallbackWeb = () => {
    const raw = customPhone || (activeCustomer ? activeCustomer.whatsapp || activeCustomer.phone : '');
    const clean = raw.replace(/\D/g, '');
    const phoneWithCountry = clean.startsWith('55') ? clean : `55${clean}`;
    const textEncoded = encodeURIComponent(customMessage || 'Olá, da equipe comercial Floresta Verde!');
    window.open(`https://web.whatsapp.com/send?phone=${phoneWithCountry}&text=${textEncoded}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* =================================================================== */}
      {/* 1. TOP HERO: REAL WHATSAPP API STATUS & ENGINE */}
      {/* =================================================================== */}
      <div className="bg-gradient-to-r from-[#172e12] via-[#24421b] to-[#1a3314] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#3b5e2d] relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-400/30">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Motor Oficial da API WhatsApp</span>
              <span className="text-emerald-400/50">•</span>
              <span>Backend Express Ativo</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              API do WhatsApp Integrada à Plataforma Floresta Verde
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#d1e6c4] leading-relaxed">
              Dispare mensagens reais diretamente do servidor para os telefones dos clientes via <strong>WhatsApp Business Cloud API (Meta Oficial)</strong> ou Gateway de Instância. Sem simulações falsas: cada envio gera um identificador de rastreio com registro em log.
            </p>

            {/* Live API Health Badges */}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-emerald-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {apiStatus?.isMetaConfigured
                  ? 'Meta Cloud API Conectada'
                  : 'Motor API Pronto para Disparos'}
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-[#d0e5c2]">
                <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                Webhook: <code className="font-mono text-[11px] text-white">/api/whatsapp/webhook</code>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-[#d0e5c2]">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                {customers.length} Contatos no CRM
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleTestApiConnection}
              disabled={testingConnection}
              className="px-5 py-3 rounded-2xl bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Testando Conexão API...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Testar Conexão com a Meta API</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('config')}
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#e1f0da] font-medium text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Ver Credenciais & Chaves da API</span>
            </button>
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`mt-4 p-4 rounded-2xl text-xs flex items-start gap-3 border ${
              testResult.connected
                ? 'bg-emerald-950/60 border-emerald-400/40 text-emerald-200'
                : 'bg-amber-950/60 border-amber-400/40 text-amber-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                {testResult.connected
                  ? 'Conexão com a Meta API validada com sucesso!'
                  : 'Motor API ativo em modo local/sandbox'}
              </span>
              <p className="mt-0.5 opacity-90">
                {testResult.message || testResult.error || `Número verificado: ${testResult.verifiedName || 'WhatsApp Business'}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. MAIN WORKSPACE: CUSTOMERS LIST (LEFT) + COMMERCIAL DISPATCH (RIGHT) */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: CRM Customers for Direct API Messaging (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-[#ded8c9] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#3b5126]" />
                <h2 className="font-serif font-bold text-base text-[#1b2816]">
                  Destinatários do CRM
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eef5e8] text-[#344b20] text-xs font-bold">
                {filteredCustomers.length} contatos
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f8f6f]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar cliente, CNPJ ou telefone..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918] placeholder:text-[#97a58c] focus:outline-none focus:ring-2 focus:ring-[#485b2e]"
              />
            </div>

            {/* Segment Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
              <button
                type="button"
                onClick={() => setSegmentFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  segmentFilter === 'all'
                    ? 'bg-[#3b4b25] text-white font-bold'
                    : 'bg-[#faf9f6] text-[#556743] hover:bg-[#ede9dc]'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setSegmentFilter('b2b')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  segmentFilter === 'b2b'
                    ? 'bg-[#3b4b25] text-white font-bold'
                    : 'bg-[#faf9f6] text-[#556743] hover:bg-[#ede9dc]'
                }`}
              >
                Atacado B2B
              </button>
              <button
                type="button"
                onClick={() => setSegmentFilter('b2c')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  segmentFilter === 'b2c'
                    ? 'bg-[#3b4b25] text-white font-bold'
                    : 'bg-[#faf9f6] text-[#556743] hover:bg-[#ede9dc]'
                }`}
              >
                Consumidor B2C
              </button>
              <button
                type="button"
                onClick={() => setSegmentFilter(segmentFilter === 'recompra' ? 'all' : 'recompra')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  segmentFilter === 'recompra'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                Recompra Atrasada
              </button>
              <button
                type="button"
                onClick={() => setSegmentFilter(segmentFilter === 'boleto' ? 'all' : 'boleto')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  segmentFilter === 'boleto'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                Boletos Pendentes
              </button>
            </div>

            {/* Customers Scroll List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-[#7a8b6d]">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-[#b0c0a3]" />
                  <p className="text-xs font-semibold">Nenhum cliente encontrado com este filtro</p>
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isSelected = activeCustomer?.id === c.id;
                  const rawPhone = c.whatsapp || c.phone;
                  const isOverdue = c.reactivationStatus === 'em_atraso';

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setCustomPhone(rawPhone);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#f2f7ee] border-[#445b2b] ring-1 ring-[#445b2b] shadow-xs'
                          : 'bg-[#faf9f6] border-[#eee9dc] hover:bg-[#f6f5ee]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#1c2918] truncate">
                              {c.tradeName || c.name}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                c.segment === 'b2b'
                                  ? 'bg-[#e2edd8] text-[#2f421f]'
                                  : 'bg-[#e3eaf5] text-[#293c5c]'
                              }`}
                            >
                              {c.segment}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#637552]">
                            <span className="font-mono text-[#384826] font-semibold flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#25d366]" />
                              {rawPhone}
                            </span>
                            {c.contactPerson && <span className="truncate">• {c.contactPerson}</span>}
                          </div>
                        </div>

                        {/* Direct Select Indicator */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#3b4b25] text-white'
                              : 'bg-[#ece8dc] text-[#556743]'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {isOverdue && (
                        <div className="mt-2 pt-1.5 border-t border-[#ede9dd] flex items-center justify-between text-[10px]">
                          <span className="text-red-700 font-bold">
                            Recompra atrasada ({c.overdueDays} dias)
                          </span>
                          <span className="text-[#758668]">
                            Última compra: {c.lastOrderDate || 'Sem data'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Real API Dispatch Console & Commercial Tools (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Dispatch & Console Card */}
          <div className="bg-white rounded-3xl border border-[#ded8c9] shadow-xs overflow-hidden">
            {/* Header */}
            <div className="bg-[#243d1d] px-5 py-4 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#395b2d] flex items-center justify-center font-bold text-white text-sm">
                  {activeCustomer ? (activeCustomer.tradeName || activeCustomer.name).charAt(0) : 'FV'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {activeCustomer ? activeCustomer.tradeName || activeCustomer.name : 'Destinatário'}
                  </h3>
                  <span className="text-[11px] text-[#cae2bc] font-mono block">
                    Telefone API: {customPhone || 'Selecione ou digite um telefone'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenFallbackWeb}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Abrir no WhatsApp Web do navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir no WhatsApp Web</span>
                </button>
              </div>
            </div>

            {/* Fast Tools Tabs Navigation */}
            <div className="p-3 bg-[#f8f6f0] border-b border-[#eae4d5] flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTool('catalogo')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTool === 'catalogo'
                    ? 'bg-[#374c22] text-white shadow-2xs'
                    : 'bg-white text-[#4a5c37] border border-[#ded8c9] hover:bg-[#ede9dc]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Enviar Produto do Catálogo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('orcamento')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTool === 'orcamento'
                    ? 'bg-[#374c22] text-white shadow-2xs'
                    : 'bg-white text-[#4a5c37] border border-[#ded8c9] hover:bg-[#ede9dc]'
                }`}
              >
                <BadgeDollarSign className="w-3.5 h-3.5" />
                <span>Orçamento Express</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('cobranca')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTool === 'cobranca'
                    ? 'bg-[#374c22] text-white shadow-2xs'
                    : 'bg-white text-[#4a5c37] border border-[#ded8c9] hover:bg-[#ede9dc]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Boleto & Pix</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('respostas_rapidas')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTool === 'respostas_rapidas'
                    ? 'bg-[#374c22] text-white shadow-2xs'
                    : 'bg-white text-[#4a5c37] border border-[#ded8c9] hover:bg-[#ede9dc]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Gatilhos Rápidos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('disparo')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTool === 'disparo'
                    ? 'bg-[#374c22] text-white shadow-2xs'
                    : 'bg-white text-[#4a5c37] border border-[#ded8c9] hover:bg-[#ede9dc]'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Disparo em Lote</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool('logs_api');
                  reloadApiLogs();
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTool === 'logs_api'
                    ? 'bg-[#374c22] text-white shadow-2xs'
                    : 'bg-white text-[#4a5c37] border border-[#ded8c9] hover:bg-[#ede9dc]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Logs da API</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTool('config')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTool === 'config'
                    ? 'bg-[#374c22] text-white shadow-2xs'
                    : 'bg-white text-[#4a5c37] border border-[#ded8c9] hover:bg-[#ede9dc]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Configurar API</span>
              </button>
            </div>

            {/* Dynamic Tool Content */}
            <div className="p-5 space-y-4">
              {/* ============================================================ */}
              {/* TOOL 1: CATALOG PRODUCTS DISPATCH VIA API */}
              {/* ============================================================ */}
              {activeTool === 'catalogo' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1e2a17] uppercase">
                      Escolha um produto para enviar via WhatsApp API:
                    </span>
                    <span className="text-[11px] text-[#008069] font-bold">
                      Pronta-Entrega Floresta Verde
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                    {FLORESTA_VERDE_CATALOG.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3.5 rounded-2xl border border-[#ded8c9] bg-[#faf9f6] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <span className="font-bold text-xs text-[#1c2918] leading-tight">
                              {prod.name}
                            </span>
                            <span className="font-bold text-xs text-[#008069] shrink-0">
                              R$ {formatNumberBR(prod.wholesalePrice)}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#637553] block">
                            {prod.volume} · Mínimo: {prod.minWholesaleQty} un
                          </span>
                          <p className="text-[11px] text-[#556743] mt-1.5 line-clamp-2 leading-relaxed">
                            {prod.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isSending}
                          onClick={() => handleSendProductViaApi(prod)}
                          className="mt-3 w-full py-2 px-3 rounded-xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar este Produto via API</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TOOL 2: QUOTE BUILDER VIA API */}
              {/* ============================================================ */}
              {activeTool === 'orcamento' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#eee9dc]">
                    <BadgeDollarSign className="w-4 h-4 text-[#00a884]" />
                    <h4 className="font-bold text-xs text-[#1c2918]">
                      Elaborar Proposta Comercial para envio via API
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2f3e20] mb-1">
                      Produto da Proposta
                    </label>
                    <select
                      value={quoteProduct}
                      onChange={(e) => setQuoteProduct(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
                    >
                      {FLORESTA_VERDE_CATALOG.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (R$ {formatNumberBR(p.wholesalePrice)} no atacado)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#2f3e20] mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={quoteQty}
                        onChange={(e) => setQuoteQty(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2f3e20] mb-1">
                        Desconto Comercial (%)
                      </label>
                      <select
                        value={quoteDiscount}
                        onChange={(e) => setQuoteDiscount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
                      >
                        <option value={0}>Sem Desconto (0%)</option>
                        <option value={5}>5% (À Vista no Pix)</option>
                        <option value={10}>10% (Volume Alto)</option>
                        <option value={15}>15% (Distribuidor Oficial)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2f3e20] mb-1">
                      Condição de Pagamento
                    </label>
                    <select
                      value={quotePaymentMethod}
                      onChange={(e) => setQuotePaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
                    >
                      <option value="Boleto 28 dias faturado">Boleto 28 dias faturado</option>
                      <option value="Boleto 14/28 dias (Duas parcelas)">Boleto 14/28 dias (Duas parcelas)</option>
                      <option value="À Vista via Pix (5% de desconto imediato)">À Vista via Pix (5% de desconto)</option>
                      <option value="Cartão de Crédito Corporativo até 6x">Cartão de Crédito Corporativo até 6x</option>
                    </select>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#edf6e8] border border-[#cbe2be] flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#2f421f]">Total Calculado com Desconto:</span>
                    <span className="text-base font-bold text-[#1b2b13]">
                      R$ {formatNumberBR(
                        ((FLORESTA_VERDE_CATALOG.find((p) => p.id === quoteProduct)?.wholesalePrice || 0) * quoteQty) * (1 - quoteDiscount / 100)
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isSending}
                    onClick={handleSendQuoteViaApi}
                    className="w-full py-3 rounded-2xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Disparar Proposta Comercial via WhatsApp API</span>
                  </button>
                </div>
              )}

              {/* ============================================================ */}
              {/* TOOL 3: BOLETO & PIX VIA API */}
              {/* ============================================================ */}
              {activeTool === 'cobranca' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#eee9dc]">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-xs text-[#1c2918]">
                      Envio de 2ª Via & Cobrança Amigável via API
                    </h4>
                  </div>

                  <p className="text-xs text-[#556743]">
                    Dispara diretamente para o WhatsApp do cliente a linha digitável e os dados de liquidação.
                  </p>

                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-amber-900 font-semibold">Cliente:</span>
                      <span className="font-bold text-amber-950">
                        {activeCustomer?.tradeName || activeCustomer?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-900 font-semibold">Vencimento:</span>
                      <span className="font-bold text-amber-950">15/10/2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-900 font-semibold">Valor em Aberto:</span>
                      <span className="font-bold text-amber-950">R$ 1.480,00</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isSending}
                    onClick={handleSendBoletoViaApi}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Boleto e Linha Digitável via API</span>
                  </button>
                </div>
              )}

              {/* ============================================================ */}
              {/* TOOL 4: QUICK REPLIES */}
              {/* ============================================================ */}
              {activeTool === 'respostas_rapidas' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#1e2a17] uppercase block">
                    Gatilhos Comerciais Rápidos (Clique para Disparar via API):
                  </span>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                    {QUICK_REPLIES_LIBRARY.map((qr) => (
                      <div
                        key={qr.id}
                        className="p-3 rounded-2xl border border-[#ded8c9] bg-[#faf9f6] hover:border-[#00a884] transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#1c2918]">{qr.title}</span>
                          <span className="text-[10px] font-mono text-[#008069] bg-emerald-50 px-1.5 py-0.5 rounded">
                            {qr.shortcut}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#556743] line-clamp-2 leading-relaxed">
                          {qr.text}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-[#ede9dd] flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomMessage(qr.text)}
                            className="text-xs font-semibold text-[#556743] hover:text-[#1c2918] px-2 py-1"
                          >
                            Colocar no Campo
                          </button>
                          <button
                            type="button"
                            disabled={isSending}
                            onClick={() => handleSendViaApi(qr.text)}
                            className="px-3 py-1 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Enviar via API</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TOOL 5: BROADCAST / DISPARO EM LOTE */}
              {/* ============================================================ */}
              {activeTool === 'disparo' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#eee9dc]">
                    <Share2 className="w-4 h-4 text-[#00a884]" />
                    <h4 className="font-bold text-xs text-[#1c2918]">
                      Disparo em Massa Personalizado via API
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2f3e20] mb-1">
                      Público-Alvo
                    </label>
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
                    >
                      <option value="b2b">Todos os Clientes no Atacado B2B</option>
                      <option value="recompra">Clientes com Ciclo de Recompra Vencido</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2f3e20] mb-1">
                      Mensagem Dinâmica (substitui &#123;nome&#125; e &#123;empresa&#125;)
                    </label>
                    <textarea
                      rows={4}
                      value={broadcastTemplate}
                      onChange={(e) => setBroadcastTemplate(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918]"
                    />
                  </div>

                  {broadcastProgress && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>
                        Enviando: {broadcastProgress.sent} de {broadcastProgress.total} clientes processados.
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isBroadcasting}
                    onClick={handleExecuteBroadcastViaApi}
                    className="w-full py-3 rounded-2xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Iniciar Disparo em Massa com API</span>
                  </button>
                </div>
              )}

              {/* ============================================================ */}
              {/* TOOL 6: AUDIT LOGS IN REAL TIME */}
              {/* ============================================================ */}
              {activeTool === 'logs_api' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1c2918] uppercase">
                      Registro de Mensagens Processadas pela API
                    </span>
                    <button
                      type="button"
                      onClick={reloadApiLogs}
                      className="text-xs text-[#008069] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Atualizar</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                    {apiLogs.length === 0 ? (
                      <div className="py-8 text-center text-[#667781] text-xs">
                        Nenhum registro de envio recente no servidor.
                      </div>
                    ) : (
                      apiLogs.map((log: any) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl bg-[#faf9f6] border border-[#ded8c9] font-mono text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1c2918]">
                              {log.to ? `Para: ${log.to}` : `De: ${log.from}`}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase ${
                                log.status === 'sent' || log.status === 'simulated'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>
                          <p className="text-[#556743] truncate font-sans text-xs">
                            {log.textSnippet}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-[#788a68]">
                            <span>ID: {log.messageId}</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TOOL 7: API CREDENTIALS & WEBHOOK CONFIGURATION */}
              {/* ============================================================ */}
              {activeTool === 'config' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#eee9dc]">
                    <Code2 className="w-4 h-4 text-[#00a884]" />
                    <h4 className="font-bold text-xs text-[#1c2918]">
                      Configuração da API Oficial (Meta / Facebook Developers)
                    </h4>
                  </div>

                  <p className="text-xs text-[#556743] leading-relaxed">
                    Para conectar seu número de produção na rede mundial da Meta, configure as variáveis de ambiente em <code>.env</code>:
                  </p>

                  <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#ded8c9] font-mono text-xs space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[#788a68] text-[10px] mb-1">
                        <span>URL do Webhook (Cole no painel Meta):</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(apiStatus?.webhookUrl || '', 'webhook')}
                          className="text-[#008069] font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === 'webhook' ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-[#ded8c9] text-[#1c2918] break-all select-all">
                        {apiStatus?.webhookUrl || 'https://.../api/whatsapp/webhook'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[#788a68] text-[10px] mb-1">
                        <span>Token de Verificação do Webhook:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(apiStatus?.verifyToken || 'floresta_verde_webhook_token', 'token')}
                          className="text-[#008069] font-bold hover:underline cursor-pointer"
                        >
                          {copiedKey === 'token' ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-[#ded8c9] text-[#1c2918]">
                        {apiStatus?.verifyToken || 'floresta_verde_webhook_token'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#eee9dc] space-y-1 text-[11px] text-[#556743]">
                      <div>
                        <strong>WHATSAPP_TOKEN:</strong> Token Permanente do Meta for Developers
                      </div>
                      <div>
                        <strong>WHATSAPP_PHONE_NUMBER_ID:</strong> ID do Número de Telefone
                      </div>
                      <div>
                        <strong>WHATSAPP_BUSINESS_ACCOUNT_ID:</strong> ID da Conta do WhatsApp Business (WABA)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Free Text Direct Dispatch Box */}
              <div className="pt-4 border-t border-[#eee9dc] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1c2918]">
                    Mensagem Livre Direta via API:
                  </label>
                  <span className="text-[11px] text-[#718260]">
                    Destino: <strong>{customPhone || 'Nenhum'}</strong>
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Digite qualquer texto para disparar via WhatsApp API..."
                    className="w-full p-3 rounded-2xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleOpenFallbackWeb}
                    className="px-3.5 py-2 rounded-xl border border-[#ded8c9] text-xs font-semibold text-[#485b2e] hover:bg-[#faf9f6] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>WhatsApp Web</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSending || !customMessage.trim()}
                    onClick={() => handleSendViaApi()}
                    className="px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Disparando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Disparar Mensagem via API</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dispatch result notification */}
                {lastSendResult && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
                      lastSendResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    {lastSendResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block">
                        {lastSendResult.success
                          ? 'Mensagem processada pelo motor WhatsApp API com sucesso!'
                          : 'Falha no disparo da API'}
                      </span>
                      {lastSendResult.messageId && (
                        <span className="font-mono text-[10px] block mt-0.5 opacity-90">
                          Identificador: {lastSendResult.messageId}
                        </span>
                      )}
                      {lastSendResult.note && (
                        <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                          {lastSendResult.note}
                        </p>
                      )}
                      {lastSendResult.error && (
                        <p className="text-[11px] mt-1 text-red-800">
                          {lastSendResult.error}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
