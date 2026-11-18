import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  ExternalLink,
  FileSpreadsheet,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  CustomerWithMetrics,
  Order,
  ReactivationStatus,
} from '../../types/crm';
import { formatBRL, formatDateBR } from '../../utils/crmCalculations';

interface CustomerDetailModalProps {
  customer: CustomerWithMetrics | null;
  orders: Order[];
  onClose: () => void;
  onEditCustomer: (customer: CustomerWithMetrics) => void;
  onDeleteCustomer: (customer: CustomerWithMetrics) => void;
  onNewOrderForCustomer: (customer: CustomerWithMetrics) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onOpenExcelOrderImport?: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  orders,
  onClose,
  onEditCustomer,
  onDeleteCustomer,
  onNewOrderForCustomer,
  onEditOrder,
  onDeleteOrder,
  onOpenExcelOrderImport,
}) => {
  if (!customer) return null;

  // Filter orders for this customer
  const customerOrders = orders
    .filter((o) => o.customerId === customer.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isOverdue = customer.reactivationStatus === 'em_atraso';
  const isWarning = customer.reactivationStatus === 'atencao';

  const handleWhatsApp = () => {
    const rawPhone = customer.whatsapp || customer.phone;
    if (!rawPhone) return;
    const digits = rawPhone.replace(/\D/g, '');
    const phoneWithCountry = digits.startsWith('55') ? digits : `55${digits}`;
    const clientName = customer.tradeName || customer.name;
    const text = encodeURIComponent(
      `Olá ${clientName}, tudo bem? Aqui é da equipe comercial da Floresta Verde. Percebemos que seu ciclo habitual de reposição está chegando e gostaríamos de apresentar as novas linhas aromáticas e condições especiais para você!`
    );
    // Opens WhatsApp Web on computer with preloaded client and message
    window.open(`https://web.whatsapp.com/send?phone=${phoneWithCountry}&text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-[#ded8c9] overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-6 bg-[#f8f6f0] border-b border-[#eae5d8] flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#495d2f] text-white flex items-center justify-center font-serif text-2xl font-bold shrink-0 shadow-sm">
              {(customer.tradeName || customer.name).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-[#1c2918]">
                  {customer.tradeName || customer.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    customer.segment === 'b2b'
                      ? 'bg-[#e9f0e1] text-[#364923]'
                      : 'bg-[#e6ebf5] text-[#2c4066]'
                  }`}
                >
                  {customer.segment === 'b2b' ? 'B2B • Atacado' : 'B2C • Consumidor'}
                </span>
                {isOverdue && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]/50">
                    Em atraso ({customer.overdueDays} dias)
                  </span>
                )}
                {isWarning && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]/50">
                    Atenção para contato
                  </span>
                )}
                {!isOverdue && !isWarning && customer.lastOrderDate && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#2e7d32]">
                    Em dia
                  </span>
                )}
              </div>

              {customer.tradeName && customer.tradeName !== customer.name && (
                <p className="text-xs text-[#6e7d64] mt-0.5">Razão Social: {customer.name}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#6e7d64]">
                {customer.document && <span>{customer.document}</span>}
                {customer.contactPerson && <span>· Resp: {customer.contactPerson}</span>}
                {customer.assignedTo && <span>· Atendente: {customer.assignedTo}</span>}
                <span>· Origem: {customer.channelOrigin}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditCustomer(customer)}
              className="p-2 rounded-xl text-[#596a4a] hover:text-[#1c2918] hover:bg-[#ede8dc] transition-colors"
              title="Editar cliente"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteCustomer(customer)}
              className="p-2 rounded-xl text-[#b85b5b] hover:text-[#991b1b] hover:bg-[#fee2e2] transition-colors"
              title="Excluir cliente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#7f8e75] hover:text-[#1c2918] hover:bg-[#ede8dc] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Re-engagement Alert Box if Overdue or Warning */}
          {(isOverdue || isWarning) && (
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isOverdue
                  ? 'bg-[#fff5f5] border-[#fecaca] text-[#991b1b]'
                  : 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-sm">
                    {isOverdue
                      ? `Cliente em atraso há ${customer.overdueDays} dias além do ciclo esperado`
                      : 'Cliente se aproximando do ciclo médio de recompra'}
                  </div>
                  <p className="mt-0.5 opacity-90">
                    {customer.predictedNextOrderDate
                      ? `Próxima compra era estimada para ${formatDateBR(customer.predictedNextOrderDate)}. Faça um contato amigável para garantir a recompra.`
                      : 'Ciclo médio expirado. Sugerimos acionar o WhatsApp abaixo.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25d366] text-white text-xs font-bold hover:bg-[#20ba5a] transition-colors shrink-0 shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar no WhatsApp</span>
              </button>
            </div>
          )}

          {/* Grid of Key Buying Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ece8de]">
              <span className="text-[11px] font-medium text-[#738268] block">Tempo como Cliente</span>
              <span className="text-lg font-bold text-[#1c2918] mt-1 block">
                {customer.timeAsCustomerText || 'Recente'}
              </span>
              <span className="text-[10px] text-[#7d8c74] mt-0.5 block">
                1ª compra: {customer.firstOrderDate ? formatDateBR(customer.firstOrderDate) : 'Nenhuma'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ece8de]">
              <span className="text-[11px] font-medium text-[#738268] block">Dias desde Última Compra</span>
              <span className="text-lg font-bold text-[#1c2918] mt-1 block tabular-nums">
                {customer.daysSinceLastOrder !== null ? `${customer.daysSinceLastOrder} dias` : '-'}
              </span>
              <span className="text-[10px] text-[#7d8c74] mt-0.5 block">
                {customer.lastOrderDate ? formatDateBR(customer.lastOrderDate) : 'Sem data'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ece8de]">
              <span className="text-[11px] font-medium text-[#738268] block">Ciclo Médio de Compra</span>
              <span className="text-lg font-bold text-[#1c2918] mt-1 block tabular-nums">
                {customer.effectiveCycleDays} dias
              </span>
              <span className="text-[10px] text-[#7d8c74] mt-0.5 block">
                {customer.paidOrdersCount >= 2 ? 'Calculado dos pedidos' : 'Ciclo padrão'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ece8de]">
              <span className="text-[11px] font-medium text-[#738268] block">Total Comprado (LTV)</span>
              <span className="text-lg font-bold text-[#394d23] mt-1 block tabular-nums">
                {formatBRL(customer.totalSpent)}
              </span>
              <span className="text-[10px] text-[#7d8c74] mt-0.5 block">
                Ticket Médio: {formatBRL(customer.averageTicket)}
              </span>
            </div>
          </div>

          {/* Contact Details & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-white border border-[#eae5d8] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#738268]">
                Canais de Contato
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#2d3a20]">
                  <Mail className="w-3.5 h-3.5 text-[#5e7146]" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[#2d3a20]">
                  <Phone className="w-3.5 h-3.5 text-[#5e7146]" />
                  <span>{customer.phone}</span>
                </div>
                {customer.whatsapp && (
                  <div className="flex items-center justify-between text-[#2d3a20]">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-3.5 h-3.5 text-[#25d366]" />
                      <span>{customer.whatsapp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      className="text-[11px] font-semibold text-[#25d366] hover:underline"
                    >
                      Abrir conversa
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#eae5d8]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#738268] mb-2">
                Observações de Atendimento
              </h4>
              <p className="text-xs text-[#415133] leading-relaxed italic bg-[#faf9f5] p-3 rounded-xl border border-[#ece8df]">
                {customer.notes || 'Nenhuma observação cadastrada para este cliente.'}
              </p>
            </div>
          </div>

          {/* Orders Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#4a5f2e]" />
                <h3 className="font-bold text-sm text-[#1c2918]">
                  Histórico de Pedidos ({customerOrders.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {onOpenExcelOrderImport && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenExcelOrderImport();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#2d6a4f]/30 text-[#1b4332] text-xs font-semibold hover:bg-[#1b4332]/5 transition-colors shadow-2xs"
                    title="Importar pedidos via planilha Excel (.xlsx, .xls, .csv)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#2d6a4f]" />
                    <span>Importar Planilha</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNewOrderForCustomer(customer)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#495d2f] text-white text-xs font-semibold hover:bg-[#3c4e25] transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Pedido</span>
                </button>
              </div>
            </div>

            <div className="border border-[#eae5d8] rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7f5ee] border-b border-[#eae5d8] text-[#637258] text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Data</th>
                    <th className="py-2.5 px-3 font-semibold">Itens</th>
                    <th className="py-2.5 px-3 font-semibold">Forma de Pagamento</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Valor</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2efe6]">
                  {customerOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#809077]">
                        <p>Nenhum pedido registrado para este cliente ainda.</p>
                        {onOpenExcelOrderImport && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenExcelOrderImport();
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#f0eee6] hover:bg-[#e4e0d4] text-[#2d3a20] text-xs font-semibold transition-colors"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2d6a4f]" />
                            <span>Preencher Histórico pelo Excel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    customerOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#faf9f4] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#2d3a20] tabular-nums whitespace-nowrap">
                          {formatDateBR(ord.date)}
                        </td>
                        <td className="py-3 px-3 text-xs text-[#4c5d3b] max-w-xs truncate">
                          {ord.itemsSummary || 'Itens diversos'}
                        </td>
                        <td className="py-3 px-3 text-[#6a7a60] text-xs">
                          {ord.paymentMethod || '-'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {ord.status === 'pago' ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f5e9] text-[#2e7d32]">
                              Pago
                            </span>
                          ) : ord.status === 'pendente' ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef3c7] text-[#b45309]">
                              Pendente
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#b91c1c]">
                              Cancelado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-[#1c2918] whitespace-nowrap">
                          {formatBRL(ord.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onEditOrder(ord)}
                            className="p-1 text-[#6d7c64] hover:text-[#1c2918] rounded"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(ord)}
                            className="p-1 text-[#b85b5b] hover:text-[#991b1b] rounded ml-1"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
