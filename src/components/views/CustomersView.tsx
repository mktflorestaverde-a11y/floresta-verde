import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  MessageCircle,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  CustomerSegment,
  CustomerWithMetrics,
  FunnelStage,
  ReactivationStatus,
} from '../../types/crm';
import { formatBRL, formatDateBR } from '../../utils/crmCalculations';

interface CustomersViewProps {
  customers: CustomerWithMetrics[];
  onSelectCustomer: (customer: CustomerWithMetrics) => void;
  onEditCustomer: (customer: CustomerWithMetrics) => void;
  onDeleteCustomer: (customer: CustomerWithMetrics) => void;
  onNewCustomer: () => void;
  onOpenExcelImport?: () => void;
  onNewOrderForCustomer: (customer: CustomerWithMetrics) => void;
  currentSegment?: 'all' | 'b2b' | 'b2c';
  onSelectSegment?: (segment: 'all' | 'b2b' | 'b2c') => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onSelectCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onNewCustomer,
  onOpenExcelImport,
  onNewOrderForCustomer,
  currentSegment,
  onSelectSegment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'b2b' | 'b2c'>(currentSegment || 'b2b');
  const [statusFilter, setStatusFilter] = useState<'all' | ReactivationStatus>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    if (currentSegment) {
      setSegmentFilter(currentSegment);
    }
  }, [currentSegment]);

  const handleSegmentChange = (seg: 'all' | 'b2b' | 'b2c') => {
    setSegmentFilter(seg);
    onSelectSegment?.(seg);
  };

  const b2bCount = useMemo(() => customers.filter((c) => c.segment === 'b2b').length, [customers]);
  const b2cCount = useMemo(() => customers.filter((c) => c.segment === 'b2c').length, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Segment filter
      if (segmentFilter !== 'all' && c.segment !== segmentFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && c.reactivationStatus !== statusFilter) return false;

      // Funnel Stage filter
      if (stageFilter !== 'all' && c.funnelStage !== stageFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesTrade = c.tradeName?.toLowerCase().includes(query);
        const matchesDoc = c.document?.toLowerCase().includes(query);
        const matchesEmail = c.email.toLowerCase().includes(query);
        const matchesPerson = c.contactPerson?.toLowerCase().includes(query);
        const matchesPhone = c.phone.includes(query) || (c.whatsapp && c.whatsapp.includes(query));
        return matchesName || matchesTrade || matchesDoc || matchesEmail || matchesPerson || matchesPhone;
      }

      return true;
    });
  }, [customers, segmentFilter, statusFilter, stageFilter, searchTerm]);

  // Status badge styling helper
  const getStatusBadge = (status: ReactivationStatus) => {
    switch (status) {
      case 'em_atraso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
            Em atraso
          </span>
        );
      case 'atencao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b45309]" />
            Atenção
          </span>
        );
      case 'em_dia':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32]" />
            Em dia
          </span>
        );
      case 'sem_compra':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1efe9] text-[#6a7962]">
            Sem compras
          </span>
        );
    }
  };

  const getStageLabel = (stage: FunnelStage) => {
    const labels: Record<string, string> = {
      novos_contatos: 'Novo contato',
      qualificados: 'Qualificado',
      proposta: 'Proposta',
      primeira_compra: '1ª compra',
      recompra: 'Recompra ativa',
      perdido: 'Perdido',
      visitantes: 'Visitante',
      carrinho: 'Carrinho',
    };
    return labels[stage] || stage;
  };

  const openWhatsApp = (e: React.MouseEvent, phone?: string, name?: string) => {
    e.stopPropagation();
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${name || ''}, tudo bem? Aqui é da Floresta Verde! Estou entrando em contato para saber se podemos te ajudar com reposição dos seus produtos ou novidades da nossa linha aromática.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SEGMENT ISOLATION BAR - B2B x B2C 100% SEPARADOS */}
      <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5b6e49]">
                Divisão de Segmento
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#edf3e6] text-[#364923] border border-[#cbdaba]">
                Bases Isoladas
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1f2d17] mt-0.5">
              Gestão Exclusiva de Clientes
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
              <span>B2B • Atacado ({b2bCount})</span>
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
              <span>B2C • Consumidor ({b2cCount})</span>
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
              <span>Todos ({customers.length})</span>
            </button>
          </div>
        </div>

        {/* Informative Guidance Banner */}
        <div className="mt-3.5 pt-3 border-t border-[#f0ece2] text-xs">
          {segmentFilter === 'b2b' && (
            <div className="flex items-center gap-2 text-[#354820] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#354820] shrink-0" />
              <span>
                <strong>Modo Atacado B2B Selecionado:</strong> Você está visualizando empresas parceiras (Lojas de Decoração, Hotéis, Spas e Revendedoras). Exibindo CNPJ, compras a prazo e ciclo de 45 dias.
              </span>
            </div>
          )}
          {segmentFilter === 'b2c' && (
            <div className="flex items-center gap-2 text-[#2d401e] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#2d401e] shrink-0" />
              <span>
                <strong>Modo Consumidor B2C Selecionado:</strong> Você está visualizando consumidores finais (E-commerce e compras diretas). Exibindo CPF, WhatsApp e ciclo de 30 dias.
              </span>
            </div>
          )}
          {segmentFilter === 'all' && (
            <div className="flex items-center gap-2 text-[#566847]">
              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
              <span>
                <strong>Visão Consolidada:</strong> Exibindo simultaneamente todos os clientes (B2B e B2C).
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Top action & filter bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7d8c73]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CNPJ, e-mail, telefone..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-[#faf9f6] border border-[#ded8c9] focus:outline-hidden focus:ring-2 focus:ring-[#556b3c] focus:bg-white text-[#1c2918] placeholder-[#909e88]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#829279] hover:text-[#2d3a20]"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Add and View switcher */}
          <div className="flex items-center gap-3">
            <div className="inline-flex p-1 bg-[#f1efe8] rounded-xl border border-[#ded8c9]">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-[#2a381d] shadow-2xs font-semibold'
                    : 'text-[#637258] hover:text-[#1c2918]'
                }`}
              >
                Tabela
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#2a381d] shadow-2xs font-semibold'
                    : 'text-[#637258] hover:text-[#1c2918]'
                }`}
              >
                Cartões
              </button>
            </div>

            {onOpenExcelImport && (
              <button
                type="button"
                onClick={onOpenExcelImport}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#2d6a4f]/30 text-[#1b4332] text-xs md:text-sm font-semibold hover:bg-[#1b4332]/5 transition-all shadow-2xs"
                title="Importar lista de clientes a partir de arquivo Excel (.xlsx, .xls, .csv)"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#2d6a4f]" />
                <span>Importar Excel</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewCustomer}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#495d2f] text-white text-xs md:text-sm font-semibold hover:bg-[#3c4e25] transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Cliente</span>
            </button>
          </div>
        </div>

        {/* Filter chips & dropdowns */}
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
                {seg === 'all' ? 'Todos os segmentos' : seg === 'b2b' ? 'B2B Atacado' : 'B2C Consumidor'}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="inline-flex p-0.5 bg-[#f0eee6] rounded-lg border border-[#e1ddce]">
            {[
              { id: 'all', label: 'Todos os status' },
              { id: 'em_atraso', label: 'Em atraso' },
              { id: 'atencao', label: 'Atenção' },
              { id: 'em_dia', label: 'Em dia' },
              { id: 'sem_compra', label: 'Sem compras' },
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
            Mostrando <b>{filteredCustomers.length}</b> de {customers.length} clientes
          </span>
        </div>
      </div>

      {/* Main content: Table or Card Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-[#f7f5ee] border-b border-[#eae5d8] text-[#637258] text-[11px] md:text-xs">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Cliente / Razão Social</th>
                  <th className="py-3.5 px-3 font-semibold">Segmento</th>
                  <th className="py-3.5 px-3 font-semibold">Etapa Funil</th>
                  <th className="py-3.5 px-3 font-semibold">Última compra</th>
                  <th className="py-3.5 px-3 font-semibold">Ciclo Médio</th>
                  <th className="py-3.5 px-3 font-semibold">Status Recompra</th>
                  <th className="py-3.5 px-3 font-semibold text-right">Total Comprado</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2efe6]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-full bg-[#edf3e5] flex items-center justify-center mb-1">
                          <Users className="w-6 h-6 text-[#556d3c]" />
                        </div>
                        <p className="font-bold text-sm text-[#1c2918]">Nenhum cliente encontrado</p>
                        <p className="text-xs text-[#738268]">
                          {searchTerm
                            ? 'Nenhum resultado com o termo pesquisado. Tente limpar os filtros.'
                            : 'Você está no modo real e ainda não possui clientes cadastrados nesta lista.'}
                        </p>
                        <button
                          type="button"
                          onClick={onNewCustomer}
                          className="mt-3 px-4 py-2 rounded-xl bg-[#485b2e] hover:bg-[#384824] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Cadastrar Cliente</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    return (
                      <tr
                        key={cust.id}
                        onClick={() => onSelectCustomer(cust)}
                        className="hover:bg-[#faf9f4] cursor-pointer transition-colors group"
                      >
                        {/* Name & Contact Person */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#1c2918] group-hover:text-[#45582f] transition-colors">
                            {cust.tradeName || cust.name}
                          </div>
                          <div className="text-[11px] text-[#718069] flex items-center gap-2 mt-0.5">
                            {cust.contactPerson && <span>Resp: {cust.contactPerson}</span>}
                            {cust.document && <span>· {cust.document}</span>}
                          </div>
                        </td>

                        {/* Segment */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              cust.segment === 'b2b'
                                ? 'bg-[#e9f0e1] text-[#364923]'
                                : 'bg-[#e6ebf5] text-[#2c4066]'
                            }`}
                          >
                            {cust.segment}
                          </span>
                        </td>

                        {/* Funnel Stage */}
                        <td className="py-3.5 px-3">
                          <span className="text-xs text-[#394a2b] font-medium">
                            {getStageLabel(cust.funnelStage)}
                          </span>
                        </td>

                        {/* Last Purchase */}
                        <td className="py-3.5 px-3 tabular-nums">
                          {cust.lastOrderDate ? (
                            <div>
                              <span className="font-medium text-[#2d3b20]">
                                há {cust.daysSinceLastOrder} dias
                              </span>
                              <div className="text-[11px] text-[#819078]">
                                {formatDateBR(cust.lastOrderDate)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#9aa792] italic">Sem pedidos</span>
                          )}
                        </td>

                        {/* Cycle */}
                        <td className="py-3.5 px-3 tabular-nums">
                          <div className="font-medium text-[#2d3b20]">
                            {cust.effectiveCycleDays} dias
                          </div>
                          <div className="text-[11px] text-[#819078]">
                            {cust.paidOrdersCount >= 2 ? 'Calculado' : 'Ciclo padrão'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">{getStatusBadge(cust.reactivationStatus)}</td>

                        {/* Total Spent */}
                        <td className="py-3.5 px-3 text-right tabular-nums">
                          <div className="font-bold text-[#1c2918]">
                            {formatBRL(cust.totalSpent)}
                          </div>
                          <div className="text-[11px] text-[#819078]">
                            {cust.paidOrdersCount}{' '}
                            {cust.paidOrdersCount === 1 ? 'pedido' : 'pedidos'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* WhatsApp Button */}
                            {cust.whatsapp && (
                              <button
                                type="button"
                                onClick={(e) => openWhatsApp(e, cust.whatsapp, cust.tradeName || cust.name)}
                                className="p-1.5 rounded-lg text-[#25d366] hover:bg-[#e7f9ee] transition-colors"
                                title="Abrir WhatsApp com mensagem de contato"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* + Order */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNewOrderForCustomer(cust);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#edf3e5] text-[#3d5124] hover:bg-[#dfead2] text-xs font-semibold transition-colors"
                              title="Adicionar pedido para este cliente"
                            >
                              + Pedido
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditCustomer(cust);
                              }}
                              className="p-1.5 rounded-lg text-[#6d7c64] hover:text-[#1c2918] hover:bg-[#f1eee4] transition-colors"
                              title="Editar cliente"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomer(cust);
                              }}
                              className="p-1.5 rounded-lg text-[#b85b5b] hover:text-[#991b1b] hover:bg-[#fee2e2] transition-colors"
                              title="Excluir cliente"
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
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#eae5d8] text-center shadow-xs">
          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-[#edf3e5] flex items-center justify-center mb-1">
              <Users className="w-6 h-6 text-[#556d3c]" />
            </div>
            <p className="font-bold text-sm text-[#1c2918]">Nenhum cliente cadastrado</p>
            <p className="text-xs text-[#738268]">
              {searchTerm
                ? 'Nenhum resultado com o filtro selecionado.'
                : 'Você está no modo real. Comece cadastrando seus clientes para ativar o CRM.'}
            </p>
            <button
              type="button"
              onClick={onNewCustomer}
              className="mt-3 px-4 py-2 rounded-xl bg-[#485b2e] hover:bg-[#384824] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Cliente</span>
            </button>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCustomers.map((cust) => {
            return (
              <div
                key={cust.id}
                onClick={() => onSelectCustomer(cust)}
                className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-[#1c2918]">
                        {cust.tradeName || cust.name}
                      </h3>
                      {cust.tradeName && cust.tradeName !== cust.name && (
                        <p className="text-xs text-[#718069] mt-0.5 truncate">{cust.name}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        cust.segment === 'b2b'
                          ? 'bg-[#e9f0e1] text-[#364923]'
                          : 'bg-[#e6ebf5] text-[#2c4066]'
                      }`}
                    >
                      {cust.segment}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-[#526344] font-medium">
                      {getStageLabel(cust.funnelStage)}
                    </span>
                    {getStatusBadge(cust.reactivationStatus)}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#f0ece2] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-[#7d8c74] block">Última compra</span>
                      <span className="font-semibold text-[#1c2918] tabular-nums">
                        {cust.daysSinceLastOrder !== null
                          ? `há ${cust.daysSinceLastOrder} dias`
                          : 'Nunca comprou'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#7d8c74] block">Ciclo Médio</span>
                      <span className="font-semibold text-[#1c2918] tabular-nums">
                        {cust.effectiveCycleDays} dias
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#7d8c74] block">Total Comprado</span>
                      <span className="font-bold text-[#354922] tabular-nums">
                        {formatBRL(cust.totalSpent)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#7d8c74] block">Tempo como cliente</span>
                      <span className="font-semibold text-[#1c2918]">
                        {cust.timeAsCustomerText}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#f0ece2] flex items-center justify-between">
                  <span className="text-xs text-[#7d8c74] truncate">
                    {cust.contactPerson ? `Resp: ${cust.contactPerson}` : cust.email}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {cust.whatsapp && (
                      <button
                        type="button"
                        onClick={(e) => openWhatsApp(e, cust.whatsapp, cust.tradeName || cust.name)}
                        className="p-1.5 rounded-lg text-[#25d366] hover:bg-[#e7f9ee] transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewOrderForCustomer(cust);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#edf3e5] text-[#3d5124] hover:bg-[#dfead2] text-xs font-semibold transition-colors"
                    >
                      + Pedido
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
