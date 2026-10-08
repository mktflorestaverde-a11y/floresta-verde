import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Building2,
  Calendar,
  Clock,
  MessageCircle,
  Phone,
  ShoppingBag,
  ShoppingCart,
  Users,
} from 'lucide-react';
import {
  CustomerWithMetrics,
  FilterPeriod,
  FunnelStageData,
  OverviewMetrics,
  PurchaseRhythmPoint,
  RecencyBreakdown,
  SegmentFilter,
} from '../../types/crm';
import { formatBRL, formatNumberBR } from '../../utils/crmCalculations';
import { ActiveTab } from '../layout/Sidebar';

interface OverviewViewProps {
  metrics: OverviewMetrics;
  period: FilterPeriod;
  segment: SegmentFilter;
  b2bFunnel: FunnelStageData[];
  b2cFunnel: FunnelStageData[];
  purchaseRhythm: PurchaseRhythmPoint[];
  recencyBreakdown: RecencyBreakdown;
  reactivationList: CustomerWithMetrics[];
  onSelectCustomer: (customer: CustomerWithMetrics) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenDataGuide: () => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  period,
  segment,
  b2bFunnel,
  b2cFunnel,
  purchaseRhythm,
  recencyBreakdown,
  reactivationList,
  onSelectCustomer,
  onNavigateTab,
  onOpenDataGuide,
  isDemoMode = true,
  onToggleDemoMode,
}) => {
  const [hoveredRhythmPoint, setHoveredRhythmPoint] = useState<PurchaseRhythmPoint | null>(null);

  // Maximum value for the chart Y-axis scale (dynamic for real mode vs demo mode)
  const maxOrdersInPoint = Math.max(
    0,
    ...purchaseRhythm.map((p) => Math.max(p.b2bCount, p.b2cCount))
  );

  const maxBarValue = isDemoMode
    ? Math.max(180, maxOrdersInPoint)
    : (maxOrdersInPoint > 0 ? (maxOrdersInPoint <= 4 ? 4 : Math.ceil(maxOrdersInPoint * 1.25)) : 5);

  const yTicks = isDemoMode
    ? [200, 150, 100, 50, 0]
    : [
        maxBarValue,
        Math.round(maxBarValue * 0.75),
        Math.round(maxBarValue * 0.5),
        Math.round(maxBarValue * 0.25),
        0,
      ];

  return (
    <div className="space-y-6 pb-12">
      {/* Notice header line: Demo / Real indicator */}
      <div className="flex flex-wrap justify-between items-center px-1 gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
            }`}
          />
          <span className="font-semibold text-[#324520]">
            {isDemoMode ? 'Modo Demonstração Ativo' : 'Modo Dados Reais Ativo'}
          </span>
          <span className="text-[#6d7e5d] hidden sm:inline">
            {isDemoMode
              ? '— Valores e pedidos ilustrativos para validação visual.'
              : '— Operando em tempo real com registros próprios cadastrados.'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleDemoMode && (
            <button
              type="button"
              onClick={onToggleDemoMode}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                isDemoMode
                  ? 'bg-[#485b2e] hover:bg-[#394a24] text-white shadow-xs'
                  : 'bg-white hover:bg-[#edf3e6] text-[#2c401b] border border-[#cbd9be]'
              }`}
              title={isDemoMode ? 'Desligar dados de exemplo e usar ambiente real' : 'Reativar dados demonstrativos'}
            >
              <span>{isDemoMode ? 'Desligar Demonstração (Ir para Real)' : 'Ligar Demonstração'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenDataGuide}
            className="text-[12px] text-[#718265] hover:text-[#3e5027] hover:underline transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Como Integrar</span>
          </button>
        </div>
      </div>

      {/* Segment Mode Banner - Zero Conflito B2B x B2C */}
      <div className="bg-white rounded-2xl p-4 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              segment === 'b2b'
                ? 'bg-[#e8efe2] text-[#3d5027]'
                : segment === 'b2c'
                ? 'bg-[#e5ecf5] text-[#273d61]'
                : 'bg-[#f4efe4] text-[#69542a]'
            }`}
          >
            {segment === 'b2b' ? (
              <Building2 className="w-5 h-5" />
            ) : segment === 'b2c' ? (
              <ShoppingBag className="w-5 h-5" />
            ) : (
              <BarChart3 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#687a58]">
                {segment === 'b2b'
                  ? 'Visão Exclusiva B2B'
                  : segment === 'b2c'
                  ? 'Visão Exclusiva B2C'
                  : 'Visão Consolidada Geral'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f1efe8] text-[#4d5f39] border border-[#ded8c9]">
                Dados Isolados
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#1c2918] mt-0.5">
              {segment === 'b2b' &&
                'Exibindo métricas de compras no Atacado, Lojistas de Decoração, Hotéis, Spas e Vendas a Prazo.'}
              {segment === 'b2c' &&
                'Exibindo métricas de Varejo, E-commerce, carrinhos e recompras de clientes pessoas físicas.'}
              {segment === 'all' &&
                'Exibindo faturamento conjunto e métricas combinadas de B2B Atacado e B2C Consumidor.'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] font-medium text-[#7d8c72] block">
            Ciclo de Recompra:
          </span>
          <span className="text-xs font-bold text-[#2d3b1f]">
            {segment === 'b2b'
              ? '45 dias (Atacado)'
              : segment === 'b2c'
              ? '30 dias (Varejo)'
              : '30d (B2C) / 45d (B2B)'}
          </span>
        </div>
      </div>

      {/* 1. Metric Cards (4 cards in a row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Receita */}
        <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#e8efe2] flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-[#465b2d]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-[#738268]">Receita</span>
              <div className="text-2xl md:text-[28px] font-bold tracking-tight text-[#1c2918] mt-0.5 tabular-nums">
                {formatBRL(metrics.revenue)}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[13px] text-[#4d6833] font-medium">
            <ArrowUp className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span className="tabular-nums font-semibold">
              {metrics.revenueChangePercent >= 0 ? `${metrics.revenueChangePercent}%` : `${metrics.revenueChangePercent}%`}
            </span>
            <span className="text-[#7c8b73] font-normal text-xs ml-0.5 truncate">
              em relação ao período anterior
            </span>
          </div>
        </div>

        {/* Card 2: Pedidos */}
        <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#e8efe2] flex items-center justify-center shrink-0">
              <ShoppingCart className="w-6 h-6 text-[#465b2d]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-[#738268]">Pedidos</span>
              <div className="text-2xl md:text-[28px] font-bold tracking-tight text-[#1c2918] mt-0.5 tabular-nums">
                {formatNumberBR(metrics.ordersCount)}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[13px] text-[#4d6833] font-medium">
            <ArrowUp className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span className="tabular-nums font-semibold">
              {metrics.ordersChangePercent >= 0 ? `${metrics.ordersChangePercent}%` : `${metrics.ordersChangePercent}%`}
            </span>
            <span className="text-[#7c8b73] font-normal text-xs ml-0.5 truncate">
              em relação ao período anterior
            </span>
          </div>
        </div>

        {/* Card 3: Taxa de recompra */}
        <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#e8efe2] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-[#465b2d]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-[#738268]">Taxa de recompra</span>
              <div className="text-2xl md:text-[28px] font-bold tracking-tight text-[#1c2918] mt-0.5 tabular-nums">
                {metrics.repurchaseRate.toFixed(1).replace('.', ',')}%
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[13px] text-[#4d6833] font-medium">
            <ArrowUp className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span className="tabular-nums font-semibold">
              {metrics.repurchaseRateChangePP > 0 ? `+${metrics.repurchaseRateChangePP.toFixed(1).replace('.', ',')}` : metrics.repurchaseRateChangePP.toFixed(1).replace('.', ',')} p.p.
            </span>
            <span className="text-[#7c8b73] font-normal text-xs ml-0.5 truncate">
              em relação ao período anterior
            </span>
          </div>
        </div>

        {/* Card 4: Intervalo médio */}
        <div className="bg-white rounded-2xl p-5 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#e8efe2] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-[#465b2d]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-[#738268]">Intervalo médio</span>
              <div className="text-2xl md:text-[28px] font-bold tracking-tight text-[#1c2918] mt-0.5 tabular-nums">
                {metrics.averageIntervalDays !== null
                  ? `${metrics.averageIntervalDays} dias`
                  : 'Sem dados suficientes'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[13px] text-[#4d6833] font-medium">
            <ArrowDown className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span className="tabular-nums font-semibold">
              {metrics.averageIntervalChangeDays !== null
                ? `${Math.abs(metrics.averageIntervalChangeDays)} dias`
                : '0 dias'}
            </span>
            <span className="text-[#7c8b73] font-normal text-xs ml-0.5 truncate">
              em relação ao período anterior
            </span>
          </div>
        </div>
      </div>

      {/* 2. Side-by-side Funnels: Funil B2B and Funil B2C */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil B2B */}
        <div className="bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#465b2d]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1c2918] leading-tight">Funil B2B</h2>
              <p className="text-xs text-[#738268] mt-0.5">
                Da prospecção à recompra no atacado
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {b2bFunnel.map((stage) => {
              return (
                <div key={stage.id} className="flex items-center text-xs md:text-sm">
                  {/* Stage Label */}
                  <span className="w-28 md:w-32 font-medium text-[#2d3a22] shrink-0 truncate">
                    {stage.name}
                  </span>

                  {/* Funnel Bar Container */}
                  <div className="flex-1 mx-3 h-5 md:h-6 bg-[#f1efe8] rounded-full overflow-hidden flex items-center p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${stage.colorClass}`}
                      style={{
                        width: `${Math.max(6, stage.percentage)}%`,
                      }}
                    />
                  </div>

                  {/* Stage Stats */}
                  <div className="w-24 md:w-28 text-right shrink-0 flex items-center justify-end gap-2 tabular-nums">
                    <span className="font-bold text-[#1c2918]">
                      {formatNumberBR(stage.count)}
                    </span>
                    <span className="text-xs text-[#75846a] w-12 text-right">
                      {stage.percentage.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Funil B2C */}
        <div className="bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#465b2d]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1c2918] leading-tight">Funil B2C</h2>
              <p className="text-xs text-[#738268] mt-0.5">
                Da visita à recompra no e-commerce e varejo
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {b2cFunnel.map((stage) => {
              return (
                <div key={stage.id} className="flex items-center text-xs md:text-sm">
                  {/* Stage Label */}
                  <span className="w-28 md:w-32 font-medium text-[#2d3a22] shrink-0 truncate">
                    {stage.name}
                  </span>

                  {/* Funnel Bar Container */}
                  <div className="flex-1 mx-3 h-5 md:h-6 bg-[#f1efe8] rounded-full overflow-hidden flex items-center p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${stage.colorClass}`}
                      style={{
                        width: `${Math.max(6, stage.percentage)}%`,
                      }}
                    />
                  </div>

                  {/* Stage Stats */}
                  <div className="w-24 md:w-28 text-right shrink-0 flex items-center justify-end gap-2 tabular-nums">
                    <span className="font-bold text-[#1c2918]">
                      {formatNumberBR(stage.count)}
                    </span>
                    <span className="text-xs text-[#75846a] w-12 text-right">
                      {stage.percentage.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Ritmo de compra (chart & recency) + Clientes para reativar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Ritmo de compra (7 columns on large screens) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Header + Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-[#465b2d]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1c2918] leading-tight">
                    Ritmo de compra
                  </h2>
                  <p className="text-xs text-[#738268] mt-0.5">
                    Evolução de pedidos por segmento
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-medium text-[#49583b]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3a4b27]" />
                  <span>B2B • Atacado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#839e64]" />
                  <span>B2C • Consumidor</span>
                </div>
              </div>
            </div>

            {/* Custom Bar Chart Canvas */}
            <div className="relative pt-6 pb-2">
              {/* Y-axis gridlines & labels */}
              <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none text-[11px] text-[#97a58e]">
                {yTicks.map((val, idx) => (
                  <div key={`${val}-${idx}`} className="w-full flex items-center gap-2">
                    <span className="w-6 text-right tabular-nums">{val}</span>
                    <div className="flex-1 border-b border-[#ece8df] border-dashed" />
                  </div>
                ))}
              </div>

              {/* Real mode empty banner when no orders exist in period */}
              {!isDemoMode && maxOrdersInPoint === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 pb-6">
                  <div className="bg-[#fcfbf9]/95 border border-[#ded8c9] rounded-xl px-4 py-2 text-xs text-[#526442] shadow-xs text-center max-w-sm">
                    <span className="font-semibold text-[#2c3d19]">Modo Dados Reais:</span> Nenhum pedido faturado neste intervalo. Novos pedidos registrados aparecerão aqui em tempo real.
                  </div>
                </div>
              )}

              {/* Bars Row */}
              <div className="relative pl-8 pr-1 h-44 md:h-52 flex items-end justify-between gap-1.5 sm:gap-2">
                {purchaseRhythm.map((point) => {
                  const b2bHeight = Math.min(100, (point.b2bCount / maxBarValue) * 100);
                  const b2cHeight = Math.min(100, (point.b2cCount / maxBarValue) * 100);

                  return (
                    <div
                      key={point.dateKey}
                      className="group flex-1 flex flex-col items-center h-full justify-end relative cursor-pointer"
                      onMouseEnter={() => setHoveredRhythmPoint(point)}
                      onMouseLeave={() => setHoveredRhythmPoint(null)}
                    >
                      {/* Paired Vertical Bars */}
                      <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full pb-1">
                        {/* B2B Bar */}
                        <div
                          className="w-1.5 sm:w-2.5 bg-[#3a4b27] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${Math.max(4, b2bHeight)}%` }}
                        />
                        {/* B2C Bar */}
                        <div
                          className="w-1.5 sm:w-2.5 bg-[#839e64] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${Math.max(4, b2cHeight)}%` }}
                        />
                      </div>

                      {/* X-axis date label */}
                      <span className="text-[10px] sm:text-[11px] text-[#7d8c73] whitespace-nowrap mt-1 group-hover:text-[#2d3a22] font-medium">
                        {point.displayDate}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Hover Tooltip */}
              {hoveredRhythmPoint && (
                <div className="absolute top-1 right-2 bg-[#2d3c1e] text-white text-xs rounded-xl px-3 py-2 shadow-lg z-20 pointer-events-none animate-in fade-in-50">
                  <div className="font-bold border-b border-[#4d6332] pb-1 mb-1">
                    {hoveredRhythmPoint.displayDate}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#cad7b8]">B2B Atacado:</span>
                    <span className="font-semibold tabular-nums">{hoveredRhythmPoint.b2bCount} pedidos</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#cad7b8]">B2C Consumidor:</span>
                    <span className="font-semibold tabular-nums">{hoveredRhythmPoint.b2cCount} pedidos</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recency Breakdown (3 sections below chart) */}
          <div className="mt-8 pt-5 border-t border-[#ece8df] grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Comprou há 30 dias */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#edf3e6] flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4 text-[#4a6130]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-[#738268] block truncate">
                  Comprou há 30 dias
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-bold text-[#1c2918] tabular-nums">
                    {recencyBreakdown.upTo30DaysPercent}%
                  </span>
                  <div className="flex-1 h-2 bg-[#f0eee6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#465b2d] rounded-full"
                      style={{ width: `${recencyBreakdown.upTo30DaysPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 31 - 60 dias */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#edf3e6] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#637e44]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-[#738268] block truncate">
                  31 – 60 dias
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-bold text-[#1c2918] tabular-nums">
                    {recencyBreakdown.between31And60DaysPercent}%
                  </span>
                  <div className="flex-1 h-2 bg-[#f0eee6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#759054] rounded-full"
                      style={{ width: `${recencyBreakdown.between31And60DaysPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mais de 60 dias */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#edf3e6] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#8ea770]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-[#738268] block truncate">
                  Mais de 60 dias
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-bold text-[#1c2918] tabular-nums">
                    {recencyBreakdown.moreThan60DaysPercent}%
                  </span>
                  <div className="flex-1 h-2 bg-[#f0eee6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#a3be85] rounded-full"
                      style={{ width: `${recencyBreakdown.moreThan60DaysPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Clientes para reativar (5 columns on large screens) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Header + "Ver todos" button */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#465b2d]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1c2918] leading-tight">
                    Clientes para reativar
                  </h2>
                  <p className="text-xs text-[#738268] mt-0.5">
                    Clientes que não compram no período esperado
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('clientes')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#485b2e] hover:text-[#2d3a1f] px-2.5 py-1.5 rounded-lg hover:bg-[#f1f6ec] transition-colors whitespace-nowrap"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ece8df] text-[#78876e]">
                    <th className="py-2.5 px-2 font-medium">Cliente</th>
                    <th className="py-2.5 px-2 font-medium">Segmento</th>
                    <th className="py-2.5 px-2 font-medium">Última compra</th>
                    <th className="py-2.5 px-2 font-medium">Ciclo médio</th>
                    <th className="py-2.5 px-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3f0e8]">
                  {reactivationList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8d9b84]">
                        Nenhum cliente em atraso ou atenção neste segmento!
                      </td>
                    </tr>
                  ) : (
                    reactivationList.slice(0, 5).map((customer) => {
                      const isOverdue = customer.reactivationStatus === 'em_atraso';
                      const isWarning = customer.reactivationStatus === 'atencao';

                      return (
                        <tr
                          key={customer.id}
                          onClick={() => onSelectCustomer(customer)}
                          className="hover:bg-[#f9f8f4] cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-2 font-semibold text-[#1f2d1a] truncate max-w-[120px]">
                            {customer.tradeName || customer.name}
                          </td>
                          <td className="py-3 px-2 uppercase text-[11px] font-bold text-[#566846]">
                            {customer.segment}
                          </td>
                          <td className="py-3 px-2 text-[#4f5f43] tabular-nums whitespace-nowrap">
                            {customer.daysSinceLastOrder !== null
                              ? `há ${customer.daysSinceLastOrder} dias`
                              : '-'}
                          </td>
                          <td className="py-3 px-2 text-[#4f5f43] tabular-nums whitespace-nowrap">
                            {customer.effectiveCycleDays} dias
                          </td>
                          <td className="py-3 px-2 text-right whitespace-nowrap">
                            {isOverdue && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]/50">
                                Em atraso
                              </span>
                            )}
                            {isWarning && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef3c7] text-[#b45309] border border-[#fde68a]/50">
                                Atenção
                              </span>
                            )}
                            {!isOverdue && !isWarning && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f5e9] text-[#2e7d32]">
                                Em dia
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick CTA footer for reactivation */}
          <div className="mt-4 pt-3 border-t border-[#ece8df] flex items-center justify-between text-xs text-[#738268]">
            <span>Reative clientes com mensagens prontas</span>
            <div className="flex items-center gap-2">
              <span className="text-[#3a4b27] font-medium">WhatsApp ou E-mail</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
