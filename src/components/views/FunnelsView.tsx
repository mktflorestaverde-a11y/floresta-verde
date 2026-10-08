import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Database,
  Globe,
  Info,
  Layers,
  MessageSquare,
  MoveRight,
  Plus,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Users,
  Webhook,
} from 'lucide-react';
import {
  B2BFunnelStage,
  Customer,
  CustomerWithMetrics,
  EcommerceMetrics,
  Order,
} from '../../types/crm';
import { formatBRL, formatNumberBR } from '../../utils/crmCalculations';

interface FunnelsViewProps {
  customers: CustomerWithMetrics[];
  orders: Order[];
  ecommerce: EcommerceMetrics;
  onUpdateCustomerStage: (customerId: string, newStage: B2BFunnelStage) => void;
  onSelectCustomer: (customer: CustomerWithMetrics) => void;
  onUpdateEcommerceMetrics: (metrics: Partial<EcommerceMetrics>) => void;
  onNewCustomer: () => void;
  onOpenDataGuide: () => void;
  isDemoMode?: boolean;
}

export const FunnelsView: React.FC<FunnelsViewProps> = ({
  customers,
  orders,
  ecommerce,
  onUpdateCustomerStage,
  onSelectCustomer,
  onUpdateEcommerceMetrics,
  onNewCustomer,
  onOpenDataGuide,
  isDemoMode = false,
}) => {
  const [activeFunnel, setActiveFunnel] = useState<'b2b' | 'b2c'>('b2b');

  // B2B Stages definition
  const b2bStages: Array<{
    id: B2BFunnelStage;
    label: string;
    description: string;
    color: string;
    badgeColor: string;
  }> = [
    {
      id: 'novos_contatos',
      label: 'Novos contatos',
      description: 'Leads recebidos via formulário, feiras ou indicações',
      color: '#4a5f2e',
      badgeColor: 'bg-[#e9f0e1] text-[#364923]',
    },
    {
      id: 'qualificados',
      label: 'Qualificados',
      description: 'CNPJ ativo e fit comercial para atacado confirmado',
      color: '#637d44',
      badgeColor: 'bg-[#e4ede0] text-[#3e5527]',
    },
    {
      id: 'proposta',
      label: 'Proposta',
      description: 'Tabela de preços ou lote piloto sob negociação',
      color: '#839e64',
      badgeColor: 'bg-[#eff4ec] text-[#4f6735]',
    },
    {
      id: 'primeira_compra',
      label: '1ª compra',
      description: 'Primeiro pedido faturado e entregue com sucesso',
      color: '#a3be84',
      badgeColor: 'bg-[#f4f7f0] text-[#556e3b]',
    },
    {
      id: 'recompra',
      label: 'Recompra',
      description: 'Cliente recorrente com 2 ou mais pedidos pagos',
      color: '#b7cf9b',
      badgeColor: 'bg-[#edf5e6] text-[#2f4b1e]',
    },
  ];

  const b2bCustomers = customers.filter((c) => c.segment === 'b2b');
  const lostCustomers = b2bCustomers.filter((c) => c.funnelStage === 'perdido');

  // B2C Funnel calculation based on actual paid customer orders + registered store events
  const b2cCustomers = customers.filter((c) => c.segment === 'b2c');
  const b2cFirstBuyCustomers = b2cCustomers.filter((c) => c.paidOrdersCount >= 1);
  const b2cRepurchaseCustomers = b2cCustomers.filter((c) => c.paidOrdersCount >= 2);

  // Conversion calculations
  const b2cVisitorsDisplay = isDemoMode
    ? (ecommerce.b2cVisitorsCount > 0 ? ecommerce.b2cVisitorsCount : 8500)
    : ecommerce.b2cVisitorsCount;

  const b2cCartDisplay = isDemoMode
    ? (ecommerce.b2cCartCount > 0 ? ecommerce.b2cCartCount : 2890)
    : ecommerce.b2cCartCount;

  const b2c1stBuyCount = isDemoMode
    ? Math.max(1030, b2cFirstBuyCustomers.length * 150)
    : b2cFirstBuyCustomers.length;

  const b2cRecompraCount = isDemoMode
    ? Math.max(360, b2cRepurchaseCustomers.length * 90)
    : b2cRepurchaseCustomers.length;

  const hasTraffic = b2cVisitorsDisplay > 0;
  const b2cCartPerc = hasTraffic
    ? ((b2cCartDisplay / b2cVisitorsDisplay) * 100).toFixed(1)
    : '0.0';
  const b2c1stBuyPerc = hasTraffic
    ? ((b2c1stBuyCount / b2cVisitorsDisplay) * 100).toFixed(1)
    : (b2c1stBuyCount > 0 ? '100.0' : '0.0');
  const b2cRecompraPerc = hasTraffic
    ? ((b2cRecompraCount / b2cVisitorsDisplay) * 100).toFixed(1)
    : (b2c1stBuyCount > 0 ? ((b2cRecompraCount / b2c1stBuyCount) * 100).toFixed(1) : '0.0');

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Segment Toggle */}
      <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center shrink-0">
            {activeFunnel === 'b2b' ? (
              <Building2 className="w-5 h-5 text-[#465b2d]" />
            ) : (
              <Globe className="w-5 h-5 text-[#465b2d]" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1c2918]">
              {activeFunnel === 'b2b' ? 'Pipeline Comercial B2B (Atacado)' : 'Jornada e Funil B2C (E-commerce & Varejo)'}
            </h2>
            <p className="text-xs text-[#738268]">
              {activeFunnel === 'b2b'
                ? 'Arraste ou selecione a etapa para evoluir o contato até a recompra.'
                : 'Mapeamento da conversão de visitantes a compradores fiéis da Floresta Verde.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-[#ede8dc] rounded-2xl border border-[#ded8c9]">
            <button
              type="button"
              onClick={() => setActiveFunnel('b2b')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFunnel === 'b2b'
                  ? 'bg-[#3b4e26] text-white shadow-xs'
                  : 'text-[#546641] hover:text-[#1c2918]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Funil B2B • Atacado</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFunnel('b2c')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFunnel === 'b2c'
                  ? 'bg-[#3b4e26] text-white shadow-xs'
                  : 'text-[#546641] hover:text-[#1c2918]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Funil B2C • Consumidor</span>
            </button>
          </div>

          {activeFunnel === 'b2b' && (
            <button
              type="button"
              onClick={onNewCustomer}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#495d2f] text-white text-xs font-semibold hover:bg-[#3c4e25] transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Contato B2B</span>
            </button>
          )}
        </div>
      </div>

      {/* B2B PIPELINE VIEW */}
      {activeFunnel === 'b2b' && (
        <div className="space-y-6">
          {/* Funnel Pipeline Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {b2bStages.map((stage, idx) => {
              const stageCustomers = b2bCustomers.filter((c) => c.funnelStage === stage.id);
              const stageRevenue = stageCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

              return (
                <div
                  key={stage.id}
                  className="bg-[#fcfbf9] rounded-2xl border border-[#ded8c9] p-3.5 flex flex-col min-h-[480px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                >
                  {/* Column Header */}
                  <div className="pb-3 border-b border-[#ece8df]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <h3 className="font-bold text-sm text-[#1c2918]">{stage.label}</h3>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ebe7dc] text-[#3d4d29] tabular-nums">
                        {stageCustomers.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7a8870] mt-1 leading-snug line-clamp-1">
                      {stage.description}
                    </p>
                    {stageRevenue > 0 && (
                      <div className="mt-1 text-[11px] font-semibold text-[#405626] tabular-nums">
                        {formatBRL(stageRevenue)} faturado
                      </div>
                    )}
                  </div>

                  {/* Customer Cards in this stage */}
                  <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
                    {stageCustomers.length === 0 ? (
                      <div className="h-32 flex items-center justify-center text-center p-3 border border-dashed border-[#e2ddd0] rounded-xl">
                        <p className="text-xs text-[#95a38b]">Nenhum cliente nesta etapa</p>
                      </div>
                    ) : (
                      stageCustomers.map((customer) => {
                        return (
                          <div
                            key={customer.id}
                            onClick={() => onSelectCustomer(customer)}
                            className="bg-white rounded-xl p-3 border border-[#ded8c9] hover:border-[#b8cbaa] hover:shadow-xs transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-bold text-xs text-[#1c2918] group-hover:text-[#42552b] transition-colors leading-tight truncate">
                                {customer.tradeName || customer.name}
                              </h4>
                            </div>

                            {customer.contactPerson && (
                              <p className="text-[11px] text-[#7d8c74] mt-0.5 truncate">
                                Resp: {customer.contactPerson}
                              </p>
                            )}

                            {customer.paidOrdersCount > 0 && (
                              <div className="mt-2 flex items-center justify-between text-[11px] text-[#3d5027]">
                                <span className="font-semibold tabular-nums">
                                  {formatBRL(customer.totalSpent)}
                                </span>
                                <span className="text-[10px] text-[#7f8e76]">
                                  {customer.paidOrdersCount} ped.
                                </span>
                              </div>
                            )}

                            {/* Stage Move Controls */}
                            <div className="mt-2.5 pt-2 border-t border-[#f1eee6] flex items-center justify-between">
                              <select
                                value={customer.funnelStage}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  onUpdateCustomerStage(customer.id, e.target.value as B2BFunnelStage);
                                }}
                                className="text-[11px] font-medium py-1 px-1.5 rounded bg-[#f7f5ee] border border-[#e1dcce] text-[#334421] focus:outline-hidden"
                              >
                                {b2bStages.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                                <option value="perdido">Perdido / Desqualificado</option>
                              </select>

                              {idx < b2bStages.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateCustomerStage(customer.id, b2bStages[idx + 1].id);
                                  }}
                                  className="p-1 rounded-md text-[#596d44] hover:bg-[#edf3e6] transition-colors"
                                  title={`Avançar para ${b2bStages[idx + 1].label}`}
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lost / Disqualified Section */}
          <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#b91c1c]" />
                <h3 className="font-bold text-sm text-[#1c2918]">
                  Contatos Perdidos / Desqualificados ({lostCustomers.length})
                </h3>
              </div>
              <span className="text-xs text-[#7e8d75]">
                Estes contatos não entram no cálculo de compras concluídas
              </span>
            </div>

            {lostCustomers.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {lostCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => onSelectCustomer(cust)}
                    className="p-3 rounded-xl bg-[#faf8f4] border border-[#ded8c9] hover:bg-white cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-[#2c391f]">
                        {cust.tradeName || cust.name}
                      </div>
                      <div className="text-[11px] text-[#7e8d75] mt-0.5">
                        {cust.contactPerson || cust.channelOrigin}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateCustomerStage(cust.id, 'qualificados');
                      }}
                      className="text-[11px] text-[#4c6232] font-semibold hover:underline"
                    >
                      Reativar no funil
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#8f9d86]">
                Nenhum contato desqualificado atualmente.
              </p>
            )}
          </div>
        </div>
      )}

      {/* B2C FUNNEL & STORE INTEGRATION VIEW */}
      {activeFunnel === 'b2c' && (
        <div className="space-y-6">
          {/* B2C Funnel Diagram Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-[#1c2918]">
                  Jornada de Conversão B2C (E-commerce Floresta Verde)
                </h3>
                <p className="text-xs text-[#75846a] mt-0.5">
                  Métricas sincronizadas de visitas, abandono de carrinho e retenção de compradores.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenDataGuide}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#edf3e6] text-[#3f5326] text-xs font-semibold hover:bg-[#e1ebd7] transition-colors"
              >
                <Webhook className="w-3.5 h-3.5" />
                <span>Como integrar com a loja</span>
              </button>
            </div>

            {/* Stages Grid with Funnel Visuals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stage 1: Visitantes */}
              <div className="p-4 rounded-xl bg-[#f7f5ee] border border-[#ded8c9] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6e7e63]">
                    <span>1. Tráfego da Loja</span>
                    <span className="font-bold text-[#354821]">100%</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1c2918] mt-1">Visitantes Únicos</h4>
                  <div className="text-2xl font-bold text-[#1c2918] mt-2 tabular-nums">
                    {formatNumberBR(b2cVisitorsDisplay)}
                  </div>
                  <p className="text-[11px] text-[#7a8870] mt-1">
                    Sessões monitoradas no e-commerce
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#e2ddd1] text-[11px] text-[#6b7b60] flex items-center gap-1">
                  <Database className="w-3 h-3 text-[#495e2f]" />
                  <span>Google Analytics / Pixel</span>
                </div>
              </div>

              {/* Stage 2: Carrinho */}
              <div className="p-4 rounded-xl bg-[#f7f5ee] border border-[#ded8c9] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6e7e63]">
                    <span>2. Intenção</span>
                    <span className="font-bold text-[#354821]">{b2cCartPerc}%</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1c2918] mt-1">Adicionaram ao Carrinho</h4>
                  <div className="text-2xl font-bold text-[#1c2918] mt-2 tabular-nums">
                    {formatNumberBR(b2cCartDisplay)}
                  </div>
                  <p className="text-[11px] text-[#7a8870] mt-1">
                    Usuários que iniciaram checkout
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#e2ddd1] text-[11px] text-[#6b7b60] flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3 text-[#495e2f]" />
                  <span>Webhook de Carrinho</span>
                </div>
              </div>

              {/* Stage 3: 1ª Compra */}
              <div className="p-4 rounded-xl bg-[#f7f5ee] border border-[#ded8c9] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6e7e63]">
                    <span>3. Conversão</span>
                    <span className="font-bold text-[#354821]">{b2c1stBuyPerc}%</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1c2918] mt-1">1ª Compra Realizada</h4>
                  <div className="text-2xl font-bold text-[#1c2918] mt-2 tabular-nums">
                    {formatNumberBR(b2c1stBuyCount)}
                  </div>
                  <p className="text-[11px] text-[#7a8870] mt-1">
                    Novos clientes convertidos
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#e2ddd1] text-[11px] text-[#6b7b60] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#495e2f]" />
                  <span>Pedidos pagos na loja</span>
                </div>
              </div>

              {/* Stage 4: Recompra */}
              <div className="p-4 rounded-xl bg-[#f7f5ee] border border-[#ded8c9] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6e7e63]">
                    <span>4. Fidelização</span>
                    <span className="font-bold text-[#354821]">{b2cRecompraPerc}%</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1c2918] mt-1">Recompra & Lealdade</h4>
                  <div className="text-2xl font-bold text-[#1c2918] mt-2 tabular-nums">
                    {formatNumberBR(b2cRecompraCount)}
                  </div>
                  <p className="text-[11px] text-[#7a8870] mt-1">
                    Compradores recorrentes (2+ pedidos)
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#e2ddd1] text-[11px] text-[#6b7b60] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-[#495e2f]" />
                  <span>Histórico de compras</span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulator & Real-time Integration Configuration */}
          <div className="bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 className="text-base font-bold text-[#1c2918] mb-1">
              Configuração e Eventos do Topo de Funil B2C
            </h3>
            <p className="text-xs text-[#738268] mb-6">
              Em conformidade com a regra de negócio: <i>"Visitas e carrinhos só podem ser contabilizados quando esses eventos tiverem sido registrados ou integrados. Não invente esses números na operação real."</i> Você pode atualizar os números recebidos do seu e-commerce abaixo:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                    Contagem de Visitantes Únicos no Período
                  </label>
                  <input
                    type="number"
                    value={ecommerce.b2cVisitorsCount}
                    onChange={(e) =>
                      onUpdateEcommerceMetrics({
                        b2cVisitorsCount: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-sm text-[#1c2918] tabular-nums font-semibold"
                  />
                  <span className="text-[11px] text-[#7d8c74] mt-0.5 block">
                    Alimentado por Google Analytics 4, Shopify Analytics ou pixel de loja.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                    Contagem de Checkouts / Carrinhos Criados
                  </label>
                  <input
                    type="number"
                    value={ecommerce.b2cCartCount}
                    onChange={(e) =>
                      onUpdateEcommerceMetrics({
                        b2cCartCount: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-sm text-[#1c2918] tabular-nums font-semibold"
                  />
                  <span className="text-[11px] text-[#7d8c74] mt-0.5 block">
                    Alimentado por Webhook de "cart/create" ou "checkout/update".
                  </span>
                </div>
              </div>

              {/* Integration Snippet Box */}
              <div className="bg-[#2d3c1e] text-[#d6e3c9] rounded-xl p-4 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] text-[#9eb686] pb-2 border-b border-[#475e30] mb-3">
                  <span>POST /api/webhooks/ecommerce/cart</span>
                  <span className="text-white">JSON</span>
                </div>
                <pre className="text-[11px] overflow-x-auto leading-relaxed">
{`{
  "event": "cart_created",
  "store": "floresta-verde-aromas",
  "session_id": "sess_891274",
  "items": ["Difusor Alecrim 250ml", "Vela Canela"],
  "total_value": 249.90,
  "timestamp": "${new Date().toISOString()}"
}`}
                </pre>
                <div className="mt-3 pt-2 border-t border-[#475e30] text-[11px] text-[#9eb686]">
                  Qualquer nova chamada webhook incrementa o topo de funil instantaneamente.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
