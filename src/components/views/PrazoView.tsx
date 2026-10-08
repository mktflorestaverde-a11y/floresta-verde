import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import {
  Customer,
  CycleSettings,
  Order,
  TermCustomerCalculation,
  TermMetrics,
} from '../../types/crm';
import {
  formatBRL,
  formatDateBR,
  calculateTermCustomersAndMetrics,
} from '../../utils/crmCalculations';

interface PrazoViewProps {
  customers: Customer[];
  orders: Order[];
  settings: CycleSettings;
  onSelectCustomer: (customer: Customer) => void;
  onNewOrderForCustomer: (customer: Customer) => void;
  onMarkBoletoPaid: (orderId: string) => void;
  onOpenDataGuide: () => void;
  isDemoMode?: boolean;
}

type PrazoFilterType =
  | 'all'
  | 'a_vencer'
  | 'vence_hoje_7d'
  | 'vencidos'
  | 'liberados_recompra'
  | 'quitados';

export const PrazoView: React.FC<PrazoViewProps> = ({
  customers,
  orders,
  settings,
  onSelectCustomer,
  onNewOrderForCustomer,
  onMarkBoletoPaid,
  onOpenDataGuide,
  isDemoMode = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<PrazoFilterType>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Calculate all term calculations
  const { termCustomers, metrics } = useMemo(() => {
    return calculateTermCustomersAndMetrics(customers, orders, settings, new Date());
  }, [customers, orders, settings]);

  // Filter list
  const filteredCustomers = useMemo(() => {
    return termCustomers.filter((item) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = item.customer.name.toLowerCase().includes(query);
        const tradeMatch = item.customer.tradeName?.toLowerCase().includes(query) || false;
        const docMatch = item.customer.document?.toLowerCase().includes(query) || false;
        const contactMatch = item.customer.contactPerson?.toLowerCase().includes(query) || false;
        if (!nameMatch && !tradeMatch && !docMatch && !contactMatch) return false;
      }

      // Tab filter
      switch (activeFilter) {
        case 'a_vencer':
          return item.hasOpenBoleto && item.boletoStatus === 'em_dia';
        case 'vence_hoje_7d':
          return (
            item.hasOpenBoleto &&
            item.daysUntilBoletoDue !== null &&
            item.daysUntilBoletoDue >= 0 &&
            item.daysUntilBoletoDue <= 7
          );
        case 'vencidos':
          return item.hasOverdueBoleto || item.boletoStatus === 'vencido';
        case 'liberados_recompra':
          return item.eligibility === 'urgente_recompra' || item.eligibility === 'liberado_recompra';
        case 'quitados':
          return !item.hasOpenBoleto && item.termOrders.length > 0;
        case 'all':
        default:
          return true;
      }
    });
  }, [termCustomers, searchTerm, activeFilter]);

  const handlePayBoleto = (orderId: string, customerName: string) => {
    if (confirm(`Confirmar liquidação do boleto de ${customerName}? O status será marcado como Pago e o crédito liberado imediatamente.`)) {
      onMarkBoletoPaid(orderId);
      setSuccessToast(`Boleto de ${customerName} baixado com sucesso! Cliente liberado para nova compra.`);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const generateWhatsAppMessage = (item: TermCustomerCalculation) => {
    const cust = item.customer;
    const phone = cust.whatsapp || cust.phone;
    if (!phone) return '#';

    const cleanPhone = phone.replace(/\D/g, '');
    const latestOrder = item.latestTermOrder;
    const formattedVal = latestOrder ? formatBRL(latestOrder.totalAmount, true) : '';
    const dueDateStr = item.activeBoletoDueDate ? formatDateBR(item.activeBoletoDueDate) : '';

    let text = '';
    if (item.boletoStatus === 'vencido') {
      text = `Olá, equipe da *${cust.tradeName || cust.name}*! Tudo bem? Aqui é da *Floresta Verde*. Identificamos uma pendência no boleto referente ao pedido no valor de *${formattedVal}*, com vencimento ocorrido em *${dueDateStr}*. Gostaria de uma nova via atualizada para liquidação hoje? Estamos à disposição!`;
    } else if (item.hasOpenBoleto) {
      text = `Olá, equipe da *${cust.tradeName || cust.name}*! Tudo bem? Aqui é da *Floresta Verde*. Lembramos gentilmente que o boleto referente ao seu pedido faturado no valor de *${formattedVal}* tem vencimento programado para *${dueDateStr}*. Segue para conferência. Qualquer dúvida estamos à disposição!`;
    } else {
      text = `Olá, equipe da *${cust.tradeName || cust.name}*! Tudo bem? Aqui é da *Floresta Verde*. Constatamos que sua conta está 100% em dia e com crédito faturado liberado! Como está o giro de estoque dos difusores e essências? Preparamos lançamentos especiais para reposição. Posso enviar o catálogo?`;
    }

    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Success Notification */}
      {successToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Context Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-[#ded8c9] shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-[#1f2d18] flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#4a5f2a]" />
            <span>Gestão de Compras a Prazo & Prazos de Boletos</span>
          </h2>
          <p className="text-xs text-[#6e7e60] mt-0.5">
            Acompanhe o vencimento de boletos de cada cliente e <b>quanto tempo falta para liberarem ou realizarem a próxima compra</b>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#edf3e5] text-[#3b4e25] font-semibold">
            {metrics.openOrdersCount} boletos em aberto
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#fcf8ec] text-[#825c0e] font-semibold">
            Prazo médio: {metrics.averageTermDays} dias
          </span>
        </div>
      </div>

      {/* 1. Metric Cards (5 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total a Receber */}
        <div className="bg-white rounded-2xl p-4 border border-[#e5dfd2] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#667759]">A Receber a Prazo</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <p className="text-lg md:text-xl font-bold text-[#1c2918] tracking-tight">
            {formatBRL(metrics.totalOpenDebt)}
          </p>
          <span className="text-[11px] text-[#718265] mt-1 block">
            {metrics.openOrdersCount} boletos pendentes
          </span>
        </div>

        {/* Vencendo em até 7 dias */}
        <div className="bg-white rounded-2xl p-4 border border-[#e5dfd2] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#667759]">Vence em até 7d</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-lg md:text-xl font-bold text-amber-700 tracking-tight">
            {metrics.dueSoonOrdersCount} boletos
          </p>
          <span className="text-[11px] text-[#718265] mt-1 block">
            Acompanhar liquidação
          </span>
        </div>

        {/* Boletos Vencidos */}
        <div className="bg-white rounded-2xl p-4 border border-[#eed7d7] bg-red-50/20 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-red-700">Vencidos (Em atraso)</span>
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <p className="text-lg md:text-xl font-bold text-red-700 tracking-tight">
            {formatBRL(metrics.overdueDebtAmount)}
          </p>
          <span className="text-[11px] text-red-600 mt-1 block font-medium">
            {metrics.overdueOrdersCount} cliente{metrics.overdueOrdersCount !== 1 ? 's' : ''} bloqueado{metrics.overdueOrdersCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Prontos para Nova Compra */}
        <div className="bg-white rounded-2xl p-4 border border-[#d6e7cb] bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#2f491c]">Prontos para Recompra</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-lg md:text-xl font-bold text-[#274015] tracking-tight">
            {metrics.readyForRepurchaseCount} clientes
          </p>
          <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
            Boleto quitado & ciclo atingido
          </span>
        </div>

        {/* Volume Histórico a Prazo */}
        <div className="bg-white rounded-2xl p-4 border border-[#e5dfd2] shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#667759]">Total Faturado Prazo</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#506836]" />
          </div>
          <p className="text-lg md:text-xl font-bold text-[#1c2918] tracking-tight">
            {formatBRL(metrics.totalHistoricalVolume)}
          </p>
          <span className="text-[11px] text-[#718265] mt-1 block">
            Carteira histórica total
          </span>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#ded8c9]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7d8c72]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, razão social, CNPJ ou comprador..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs text-[#1c2918] placeholder:text-[#9ea894] focus:outline-none focus:ring-1 focus:ring-[#485b2e]"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-[#485b2e] text-white shadow-xs'
                : 'bg-[#faf9f6] text-[#556645] hover:bg-[#ede9dc]'
            }`}
          >
            Todos ({termCustomers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('a_vencer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'a_vencer'
                ? 'bg-[#485b2e] text-white shadow-xs'
                : 'bg-[#faf9f6] text-[#556645] hover:bg-[#ede9dc]'
            }`}
          >
            A Vencer
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('vence_hoje_7d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'vence_hoje_7d'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#fdf7ea] text-amber-800 hover:bg-[#faeed3]'
            }`}
          >
            Vencendo em até 7d
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('vencidos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'vencidos'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Vencidos ({metrics.overdueOrdersCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('liberados_recompra')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'liberados_recompra'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Prontos p/ Comprar ({metrics.readyForRepurchaseCount})
          </button>
        </div>
      </div>

      {/* 3. Main Term Customers Cards & Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#eae5d8] text-center shadow-xs">
          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#edf3e5] flex items-center justify-center mb-1">
              <CalendarClock className="w-6 h-6 text-[#556d3c]" />
            </div>
            <p className="font-bold text-sm text-[#1c2918]">Nenhum cliente a prazo localizado</p>
            <p className="text-xs text-[#738268]">
              {searchTerm
                ? 'Nenhum resultado com o termo pesquisado. Tente limpar os filtros.'
                : 'Não há clientes correspondentes à categoria de filtro selecionada.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredCustomers.map((item) => {
            const cust = item.customer;
            const latestOrder = item.latestTermOrder;
            const waLink = generateWhatsAppMessage(item);

            return (
              <div
                key={cust.id}
                className={`bg-white rounded-2xl border transition-all p-4 shadow-xs hover:shadow-md ${
                  item.hasOverdueBoleto
                    ? 'border-red-300 ring-1 ring-red-200'
                    : item.eligibility === 'urgente_recompra'
                    ? 'border-emerald-300 ring-1 ring-emerald-200'
                    : 'border-[#ded8c9]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Customer Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(cust)}
                        className="text-sm font-bold text-[#1f2d18] hover:text-[#485b2e] hover:underline text-left"
                      >
                        {cust.tradeName || cust.name}
                      </button>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#edf3e5] text-[#3f5228]">
                        {cust.segment.toUpperCase()}
                      </span>

                      {/* Boleto Status Badge */}
                      {item.hasOverdueBoleto ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>BOLETO VENCIDO</span>
                        </span>
                      ) : item.boletoStatus === 'vence_hoje' ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>VENCE HOJE</span>
                        </span>
                      ) : item.hasOpenBoleto ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Vence em {item.daysUntilBoletoDue} dias</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Boleto Quitado</span>
                        </span>
                      )}
                    </div>

                    {/* Secondary details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6e7e60]">
                      {cust.document && <span>CNPJ/CPF: {cust.document}</span>}
                      {cust.contactPerson && (
                        <span>
                          Contato: <b>{cust.contactPerson}</b>
                        </span>
                      )}
                      {(cust.whatsapp || cust.phone) && (
                        <span>Tel: {cust.whatsapp || cust.phone}</span>
                      )}
                      {cust.assignedTo && <span>Vendedor: {cust.assignedTo}</span>}
                    </div>

                    {/* Active Order snippet if any */}
                    {latestOrder && (
                      <div className="mt-2 text-xs bg-[#faf8f4] p-2 rounded-xl border border-[#ece7db] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#5a6e43]" />
                          <span>
                            Último pedido: <b>{formatBRL(latestOrder.totalAmount, true)}</b> ({latestOrder.paymentMethod || 'Boleto'})
                          </span>
                          <span className="text-[11px] text-[#7d8c72]">
                            • Feito em {formatDateBR(latestOrder.date)}
                          </span>
                        </div>

                        {item.activeBoletoDueDate && (
                          <div className="text-[11px] font-medium text-[#40542c]">
                            Vencimento do Boleto: <b>{formatDateBR(item.activeBoletoDueDate)}</b>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Center: "Prazo para comprar" Countdown Box */}
                  <div className="lg:w-80 p-3 rounded-2xl bg-[#f5f8f0] border border-[#d6e3c8] shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#324520] uppercase tracking-wide flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5 text-[#4a5f2a]" />
                        <span>Prazo para Nova Compra</span>
                      </span>
                      {item.predictedNextPurchaseDate && (
                        <span className="text-[10px] text-[#6d7e5d]">
                          Prev: {formatDateBR(item.predictedNextPurchaseDate)}
                        </span>
                      )}
                    </div>

                    {/* Main Timeline Text */}
                    <div
                      className={`text-xs font-semibold p-2 rounded-xl leading-snug ${
                        item.eligibility === 'bloqueado_atraso'
                          ? 'bg-red-100 text-red-900 border border-red-200'
                          : item.eligibility === 'urgente_recompra'
                          ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                          : item.eligibility === 'aguardando_boleto'
                          ? 'bg-amber-100 text-amber-950 border border-amber-200'
                          : 'bg-white text-[#2a3c19] border border-[#d2dfc3]'
                      }`}
                    >
                      {item.purchaseStatusText}
                    </div>

                    {/* Recommendation note */}
                    <p className="text-[11px] text-[#556943] mt-1.5 leading-tight">
                      <b>Ação:</b> {item.recommendedAction}
                    </p>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0">
                    {/* Mark Boleto as Paid (if open) */}
                    {item.hasOpenBoleto && latestOrder && (
                      <button
                        type="button"
                        onClick={() => handlePayBoleto(latestOrder.id, cust.tradeName || cust.name)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#2a3c19] hover:bg-[#1f2d13] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                        title="Marcar boleto como pago e liberar cliente para nova compra"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Dar Baixa (Pago)</span>
                      </button>
                    )}

                    {/* WhatsApp Reminder / Collection */}
                    {(cust.whatsapp || cust.phone) && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors ${
                          item.hasOverdueBoleto
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-[#25d366] hover:bg-[#20ba5a] text-white'
                        }`}
                        title="Abrir WhatsApp com mensagem pré-formatada"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>
                          {item.hasOverdueBoleto ? 'Cobrar no Whats' : 'Lembrar no Whats'}
                        </span>
                      </a>
                    )}

                    {/* New Order Button */}
                    <button
                      type="button"
                      onClick={() => onNewOrderForCustomer(cust)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#485b2e] hover:bg-[#384824] text-white text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
                      title="Registrar novo pedido para este cliente"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Pedido</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
