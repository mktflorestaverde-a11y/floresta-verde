import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  Filter,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  XCircle,
} from 'lucide-react';
import { CustomerSegment, Order, OrderStatus } from '../../types/crm';
import { formatBRL, formatDateBR } from '../../utils/crmCalculations';

interface OrdersViewProps {
  orders: Order[];
  onNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onSelectCustomerById?: (customerId: string) => void;
  onOpenExcelOrderImport?: () => void;
  currentSegment?: 'all' | 'b2b' | 'b2c';
  onSelectSegment?: (segment: 'all' | 'b2b' | 'b2c') => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onNewOrder,
  onEditOrder,
  onDeleteOrder,
  onSelectCustomerById,
  onOpenExcelOrderImport,
  currentSegment,
  onSelectSegment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [segmentFilter, setSegmentFilter] = useState<'all' | CustomerSegment>(currentSegment || 'b2b');

  useEffect(() => {
    if (currentSegment) {
      setSegmentFilter(currentSegment);
    }
  }, [currentSegment]);

  const handleSegmentChange = (seg: 'all' | CustomerSegment) => {
    setSegmentFilter(seg);
    onSelectSegment?.(seg);
  };

  const b2bOrders = useMemo(() => orders.filter((o) => o.customerSegment === 'b2b'), [orders]);
  const b2cOrders = useMemo(() => orders.filter((o) => o.customerSegment === 'b2c'), [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (segmentFilter !== 'all' && o.customerSegment !== segmentFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesCustomer = o.customerName.toLowerCase().includes(q);
        const matchesItems = o.itemsSummary.toLowerCase().includes(q);
        const matchesId = o.id.toLowerCase().includes(q);
        return matchesCustomer || matchesItems || matchesId;
      }
      return true;
    });
  }, [orders, statusFilter, segmentFilter, searchTerm]);

  // Aggregate metrics for active filtered view
  const paidOrders = filteredOrders.filter((o) => o.status === 'pago');
  const pendingOrders = filteredOrders.filter((o) => o.status === 'pendente');
  const totalRevenuePaid = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgTicket = paidOrders.length > 0 ? totalRevenuePaid / paidOrders.length : 0;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pago':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]/50">
            <CheckCircle className="w-3 h-3 text-[#2e7d32]" />
            Pago
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]/50">
            <Clock className="w-3 h-3 text-[#b45309]" />
            Pendente
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]/50">
            <XCircle className="w-3 h-3 text-[#b91c1c]" />
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SEGMENT ISOLATION BAR - PEDIDOS B2B x B2C 100% SEPARADOS */}
      <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5b6e49]">
                Divisão de Faturamento
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#edf3e6] text-[#364923] border border-[#cbdaba]">
                Sem Mistura de Dados
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1f2d17] mt-0.5">
              Pedidos & Faturamento por Segmento
            </h2>
          </div>

          <div className="inline-flex p-1 bg-[#ede8dc] rounded-2xl border border-[#ded8c9]">
            <button
              type="button"
              onClick={() => handleSegmentChange('b2b')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                segmentFilter === 'b2b'
                  ? 'bg-[#3b4e26] text-white shadow-xs'
                  : 'text-[#546641] hover:text-[#1c2918]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>B2B • Atacado ({b2bOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSegmentChange('b2c')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                segmentFilter === 'b2c'
                  ? 'bg-[#3b4e26] text-white shadow-xs'
                  : 'text-[#546641] hover:text-[#1c2918]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>B2C • Consumidor ({b2cOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSegmentChange('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                segmentFilter === 'all'
                  ? 'bg-white text-[#202e17] shadow-xs font-bold'
                  : 'text-[#6b7d5a] hover:text-[#1c2918]'
              }`}
            >
              <span>Todos ({orders.length})</span>
            </button>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="mt-3.5 pt-3 border-t border-[#f0ece2] text-xs">
          {segmentFilter === 'b2b' && (
            <div className="flex items-center gap-2 text-[#354820] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#354820] shrink-0" />
              <span>
                <strong>Visualizando Exclusivamente Pedidos B2B (Atacado):</strong> Compras de lojistas e revendas, prazos de pagamento faturados (boletos 14/28/30 dias) e lotes de alta quantidade.
              </span>
            </div>
          )}
          {segmentFilter === 'b2c' && (
            <div className="flex items-center gap-2 text-[#2d401e] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#2d401e] shrink-0" />
              <span>
                <strong>Visualizando Exclusivamente Pedidos B2C (Consumidor Final):</strong> Vendas diretas de e-commerce e varejo (Pix e cartão de crédito).
              </span>
            </div>
          )}
          {segmentFilter === 'all' && (
            <div className="flex items-center gap-2 text-[#566847]">
              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
              <span>
                <strong>Visão Consolidada:</strong> Exibindo simultaneamente todos os pedidos do CRM.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <span className="text-xs font-medium text-[#738268]">Faturamento Pago</span>
          <div className="text-2xl font-bold text-[#1c2918] mt-1 tabular-nums">
            {formatBRL(totalRevenuePaid)}
          </div>
          <span className="text-[11px] text-[#718266] mt-1 block">
            Considera apenas pedidos pagos
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <span className="text-xs font-medium text-[#738268]">Pedidos Pagos</span>
          <div className="text-2xl font-bold text-[#1c2918] mt-1 tabular-nums">
            {paidOrders.length}
          </div>
          <span className="text-[11px] text-[#718266] mt-1 block">
            Impactam as taxas de recompra
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <span className="text-xs font-medium text-[#738268]">Pedidos Pendentes</span>
          <div className="text-2xl font-bold text-[#b45309] mt-1 tabular-nums">
            {pendingOrders.length}
          </div>
          <span className="text-[11px] text-[#718266] mt-1 block">
            Aguardando compensação
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <span className="text-xs font-medium text-[#738268]">Ticket Médio Global</span>
          <div className="text-2xl font-bold text-[#1c2918] mt-1 tabular-nums">
            {formatBRL(avgTicket)}
          </div>
          <span className="text-[11px] text-[#718266] mt-1 block">
            Média por pedido concluído
          </span>
        </div>
      </div>

      {/* Excel Orders Import Guidance Banner */}
      <div className="bg-[#f2f7ec] border border-[#cbe0ba] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#2b3c1b]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-[#b8d4a3] flex items-center justify-center text-[#2d6a4f] shrink-0 shadow-2xs">
            <FileSpreadsheet className="w-5 h-5 text-[#2d6a4f]" />
          </div>
          <div>
            <span className="font-bold text-[#1f2f14] block text-sm">
              Preenchimento Automático do Histórico de Compras
            </span>
            <span className="text-[#516341]">
              Suba a planilha do Excel com os pedidos anteriores para vincular aos clientes já cadastrados e atualizar LTV, recência e ciclos de recompra.
            </span>
          </div>
        </div>
        {onOpenExcelOrderImport && (
          <button
            type="button"
            onClick={onOpenExcelOrderImport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2d6a4f] text-white font-bold text-xs hover:bg-[#1b4332] transition-colors shrink-0 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Planilha de Pedidos</span>
          </button>
        )}
      </div>

      {/* Filter and Action bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d8c73]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, produtos ou código..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-[#faf9f6] border border-[#ded8c9] focus:outline-hidden focus:ring-2 focus:ring-[#556b3c] focus:bg-white text-[#1c2918]"
            />
          </div>

          <div className="flex items-center gap-3">
            {onOpenExcelOrderImport && (
              <button
                type="button"
                onClick={onOpenExcelOrderImport}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#2d6a4f]/30 text-[#1b4332] text-xs md:text-sm font-semibold hover:bg-[#1b4332]/5 transition-all shadow-2xs"
                title="Importar planilha de vendas e histórico de pedidos (.xlsx, .xls, .csv)"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#2d6a4f]" />
                <span>Importar Pedidos (Excel)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewOrder}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#495d2f] text-white text-xs md:text-sm font-semibold hover:bg-[#3c4e25] transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Pedido</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f0ece2] text-xs">
          <span className="text-[#75846a] font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtros:
          </span>

          {/* Segment */}
          <div className="inline-flex p-0.5 bg-[#f0eee6] rounded-lg border border-[#e1ddce]">
            {(['all', 'b2b', 'b2c'] as const).map((seg) => (
              <button
                key={seg}
                type="button"
                onClick={() => setSegmentFilter(seg)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  segmentFilter === seg
                    ? 'bg-white text-[#2d3b20] shadow-2xs font-semibold'
                    : 'text-[#617156] hover:text-[#2d3b20]'
                }`}
              >
                {seg === 'all' ? 'Todos os segmentos' : seg === 'b2b' ? 'B2B' : 'B2C'}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="inline-flex p-0.5 bg-[#f0eee6] rounded-lg border border-[#e1ddce]">
            {[
              { id: 'all', label: 'Todos os status' },
              { id: 'pago', label: 'Pagos' },
              { id: 'pendente', label: 'Pendentes' },
              { id: 'cancelado', label: 'Cancelados' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  statusFilter === st.id
                    ? 'bg-white text-[#2d3b20] shadow-2xs font-semibold'
                    : 'text-[#617156] hover:text-[#2d3b20]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs text-[#7e8d74] tabular-nums">
            {filteredOrders.length} pedidos listados
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-[#f7f5ee] border-b border-[#eae5d8] text-[#637258] text-[11px] md:text-xs">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Data</th>
                <th className="py-3.5 px-4 font-semibold">Cliente</th>
                <th className="py-3.5 px-3 font-semibold">Segmento</th>
                <th className="py-3.5 px-4 font-semibold">Itens / Descrição</th>
                <th className="py-3.5 px-3 font-semibold">Pagamento</th>
                <th className="py-3.5 px-3 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Valor Total</th>
                <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2efe6]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-[#edf3e5] flex items-center justify-center mb-1">
                        <ShoppingBag className="w-6 h-6 text-[#556d3c]" />
                      </div>
                      <p className="font-bold text-sm text-[#1c2918]">Nenhum pedido registrado</p>
                      <p className="text-xs text-[#738268]">
                        {searchTerm || statusFilter !== 'all' || segmentFilter !== 'all'
                          ? 'Nenhum pedido encontrado com os filtros selecionados.'
                          : 'Você está no modo real. Registre pedidos para calcular o faturamento e ciclos de recompra.'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                        {onOpenExcelOrderImport && (
                          <button
                            type="button"
                            onClick={onOpenExcelOrderImport}
                            className="px-4 py-2 rounded-xl bg-white border border-[#2d6a4f]/30 text-[#1b4332] text-xs font-semibold shadow-2xs flex items-center gap-1.5 hover:bg-[#edf3e6]"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2d6a4f]" />
                            <span>Importar Pedidos (Excel)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onNewOrder}
                          className="px-4 py-2 rounded-xl bg-[#485b2e] hover:bg-[#384824] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Registrar Pedido</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  return (
                    <tr key={ord.id} className="hover:bg-[#faf9f4] transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap tabular-nums font-medium text-[#2d3b20]">
                        {formatDateBR(ord.date)}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#1c2918]">
                        <button
                          type="button"
                          onClick={() => onSelectCustomerById?.(ord.customerId)}
                          className="hover:text-[#45582f] hover:underline text-left"
                        >
                          {ord.customerName}
                        </button>
                      </td>

                      <td className="py-3.5 px-3 uppercase text-[11px] font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            ord.customerSegment === 'b2b'
                              ? 'bg-[#e9f0e1] text-[#364923]'
                              : 'bg-[#e6ebf5] text-[#2c4066]'
                          }`}
                        >
                          {ord.customerSegment}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#526344] max-w-xs truncate">
                        {ord.itemsSummary || 'Itens diversos'}
                      </td>

                      <td className="py-3.5 px-3 text-xs text-[#6e7d64]">
                        {ord.paymentMethod || 'Não informado'}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getStatusBadge(ord.status)}
                      </td>

                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-[#1c2918]">
                        {formatBRL(ord.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditOrder(ord)}
                            className="p-1.5 rounded-lg text-[#6d7c64] hover:text-[#1c2918] hover:bg-[#f1eee4] transition-colors"
                            title="Editar pedido"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(ord)}
                            className="p-1.5 rounded-lg text-[#b85b5b] hover:text-[#991b1b] hover:bg-[#fee2e2] transition-colors"
                            title="Excluir pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
