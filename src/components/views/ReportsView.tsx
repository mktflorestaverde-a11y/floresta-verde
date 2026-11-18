import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart2,
  Calendar,
  Camera,
  Clock,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Image as ImageIcon,
  KeyRound,
  PieChart,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import {
  CustomerWithMetrics,
  CycleSettings,
  FilterPeriod,
  Order,
  OverviewMetrics,
} from '../../types/crm';
import { formatBRL, formatNumberBR } from '../../utils/crmCalculations';
import { crmStorage } from '../../services/crmStorage';

interface ReportsViewProps {
  metrics: OverviewMetrics;
  customers: CustomerWithMetrics[];
  orders: Order[];
  settings: CycleSettings;
  period: FilterPeriod;
  customLogoUrl?: string | null;
  onOpenLogoModal?: () => void;
  onUpdateSettings: (newSettings: CycleSettings) => void;
  onResetDemo: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onOpenDataGuide: () => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
  onNavigateTab?: (tab: 'usuarios' | any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  customers,
  orders,
  settings,
  period,
  customLogoUrl,
  onOpenLogoModal,
  onUpdateSettings,
  onResetDemo,
  onExportData,
  onImportData,
  onOpenDataGuide,
  isDemoMode = true,
  onToggleDemoMode,
  onNavigateTab,
}) => {
  const isMaster = crmStorage.isUserMaster(crmStorage.getAuthUser());
  const [b2bDays, setB2bDays] = useState(settings.b2bDefaultCycleDays);
  const [b2cDays, setB2cDays] = useState(settings.b2cDefaultCycleDays);
  const [warningThreshold, setWarningThreshold] = useState(settings.warningThresholdPercent);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Calculations for reports
  const paidOrders = orders.filter((o) => o.status === 'pago');
  const b2bOrders = paidOrders.filter((o) => o.customerSegment === 'b2b');
  const b2cOrders = paidOrders.filter((o) => o.customerSegment === 'b2c');

  const b2bRevenue = b2bOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const b2cRevenue = b2cOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalRevenue = b2bRevenue + b2cRevenue;

  const b2bTicket = b2bOrders.length > 0 ? b2bRevenue / b2bOrders.length : 0;
  const b2cTicket = b2cOrders.length > 0 ? b2cRevenue / b2cOrders.length : 0;

  // Overdue revenue at risk
  const overdueCustomers = customers.filter((c) => c.reactivationStatus === 'em_atraso');
  const warningCustomers = customers.filter((c) => c.reactivationStatus === 'atencao');
  const revenueAtRisk = overdueCustomers.reduce((sum, c) => sum + c.averageTicket, 0);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      b2bDefaultCycleDays: Number(b2bDays),
      b2cDefaultCycleDays: Number(b2cDays),
      warningThresholdPercent: Number(warningThreshold),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Revenue At Risk Banner */}
      <div className="bg-gradient-to-r from-[#2f3f1e] to-[#45582f] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#cad7b8]">
            Diagnóstico de Reativação de Clientes
          </span>
          <h2 className="text-2xl font-bold mt-1">
            {formatBRL(revenueAtRisk)} em potencial de recompra em atraso
          </h2>
          <p className="text-xs text-[#dbe5ce] mt-1 max-w-xl">
            {overdueCustomers.length} clientes compradores ultrapassaram o ciclo médio esperado sem um novo pedido. Reativá-los é mais barato do que conquistar novos clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/15 text-center">
            <span className="text-xs text-[#cad7b8] block">Em Atraso</span>
            <span className="text-xl font-bold tabular-nums">{overdueCustomers.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/15 text-center">
            <span className="text-xs text-[#cad7b8] block">Em Atenção</span>
            <span className="text-xl font-bold tabular-nums">{warningCustomers.length}</span>
          </div>
        </div>
      </div>

      {/* Segment Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* B2B Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-4 border-b border-[#f1eee4]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3a4b27]" />
              <h3 className="font-bold text-base text-[#1c2918]">Atacado (B2B)</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#e9f0e1] text-[#364923]">
              {totalRevenue > 0 ? ((b2bRevenue / totalRevenue) * 100).toFixed(1) : 0}% da receita
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#7d8c74] block">Faturamento Realizado</span>
              <span className="text-xl font-bold text-[#1c2918] tabular-nums mt-0.5 block">
                {formatBRL(b2bRevenue)}
              </span>
            </div>

            <div>
              <span className="text-[#7d8c74] block">Ticket Médio por Pedido</span>
              <span className="text-xl font-bold text-[#1c2918] tabular-nums mt-0.5 block">
                {formatBRL(b2bTicket)}
              </span>
            </div>

            <div>
              <span className="text-[#7d8c74] block">Pedidos Concluídos</span>
              <span className="text-base font-semibold text-[#1c2918] tabular-nums mt-0.5 block">
                {b2bOrders.length}
              </span>
            </div>

            <div>
              <span className="text-[#7d8c74] block">Ciclo Médio Padrão</span>
              <span className="text-base font-semibold text-[#1c2918] tabular-nums mt-0.5 block">
                {settings.b2bDefaultCycleDays} dias
              </span>
            </div>
          </div>
        </div>

        {/* B2C Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-4 border-b border-[#f1eee4]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#839e64]" />
              <h3 className="font-bold text-base text-[#1c2918]">Consumidor Final (B2C)</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#e6ebf5] text-[#2c4066]">
              {totalRevenue > 0 ? ((b2cRevenue / totalRevenue) * 100).toFixed(1) : 0}% da receita
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#7d8c74] block">Faturamento Realizado</span>
              <span className="text-xl font-bold text-[#1c2918] tabular-nums mt-0.5 block">
                {formatBRL(b2cRevenue)}
              </span>
            </div>

            <div>
              <span className="text-[#7d8c74] block">Ticket Médio por Pedido</span>
              <span className="text-xl font-bold text-[#1c2918] tabular-nums mt-0.5 block">
                {formatBRL(b2cTicket)}
              </span>
            </div>

            <div>
              <span className="text-[#7d8c74] block">Pedidos Concluídos</span>
              <span className="text-base font-semibold text-[#1c2918] tabular-nums mt-0.5 block">
                {b2cOrders.length}
              </span>
            </div>

            <div>
              <span className="text-[#7d8c74] block">Ciclo Médio Padrão</span>
              <span className="text-base font-semibold text-[#1c2918] tabular-nums mt-0.5 block">
                {settings.b2cDefaultCycleDays} dias
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration & Rules Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cycle Thresholds Settings Form */}
        <div className="bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5 mb-4">
            <Settings className="w-5 h-5 text-[#465b2d]" />
            <h3 className="text-base font-bold text-[#1c2918]">
              Parâmetros de Ciclos de Recompra
            </h3>
          </div>
          <p className="text-xs text-[#738268] mb-5">
            Configure os limites para disparo dos alertas "Em dia", "Atenção" e "Em atraso" para clientes que possuem apenas uma compra ou utilizam a referência padrão do segmento.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Ciclo de Referência B2B Atacado (dias)
              </label>
              <input
                type="number"
                min="5"
                max="365"
                value={b2bDays}
                onChange={(e) => setB2bDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs md:text-sm text-[#1c2918] tabular-nums font-semibold"
              />
              <span className="text-[11px] text-[#7f8e77] mt-0.5 block">
                Padrão recomendado: 45 dias
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Ciclo de Referência B2C Consumidor (dias)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={b2cDays}
                onChange={(e) => setB2cDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-xs md:text-sm text-[#1c2918] tabular-nums font-semibold"
              />
              <span className="text-[11px] text-[#7f8e77] mt-0.5 block">
                Padrão recomendado: 30 dias
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2d3b20] mb-1">
                Gatilho para status "Atenção" (% do ciclo)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(Number(e.target.value))}
                  className="flex-1 accent-[#465b2d]"
                />
                <span className="w-12 text-sm font-bold text-[#1c2918] tabular-nums text-right">
                  {warningThreshold}%
                </span>
              </div>
              <span className="text-[11px] text-[#7f8e77] mt-0.5 block">
                Acima deste percentual do ciclo, o status muda de "Em dia" para "Atenção".
              </span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#495d2f] text-white text-xs font-semibold hover:bg-[#3c4e25] transition-all shadow-xs"
              >
                Salvar Parâmetros
              </button>
              {settingsSaved && (
                <span className="text-xs text-[#2e7d32] font-semibold animate-in fade-in">
                  ✓ Parâmetros atualizados e recalculados!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Data Persistence & Backup Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <ShieldCheck className="w-5 h-5 text-[#465b2d]" />
              <h3 className="text-base font-bold text-[#1c2918]">
                Armazenamento Local & Backup
              </h3>
            </div>
            <p className="text-xs text-[#738268] mb-4 leading-relaxed">
              Todos os seus clientes, pedidos e configurações são salvos automaticamente no <b>localStorage</b> do seu navegador. Não se perdem ao recarregar a página.
            </p>

            {/* Demo mode switch box */}
            <div className={`p-3.5 rounded-2xl border mb-4 flex items-center justify-between gap-3 ${
              isDemoMode ? 'bg-[#fffdf5] border-[#eedab2]' : 'bg-[#eef8eb] border-[#bedfc0]'
            }`}>
              <div>
                <span className="text-xs font-bold text-[#233519] flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`} />
                  {isDemoMode ? 'Modo Demonstração Ativo' : 'Modo Dados Reais Ativo'}
                </span>
                <p className="text-[11px] text-[#6d7e5e] mt-0.5">
                  {isDemoMode
                    ? 'Dados ilustrativos da referência visual. Alterne para dados reais na hora.'
                    : 'Registros reais operacionais isolados da demonstração.'}
                </p>
              </div>

              {onToggleDemoMode && (
                <button
                  type="button"
                  onClick={onToggleDemoMode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    isDemoMode
                      ? 'bg-[#485b2e] hover:bg-[#384824] text-white shadow-xs'
                      : 'bg-white hover:bg-[#e4f1e0] text-[#1e461a] border border-[#a4c99e]'
                  }`}
                >
                  {isDemoMode ? 'Desligar Demo' : 'Ligar Demo'}
                </button>
              )}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={onExportData}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#f7f5ee] border border-[#ded8c9] hover:bg-[#f0ebe0] text-xs font-semibold text-[#2c3a1e] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#4a5f2e]" />
                  <span>Exportar Dados em JSON (Backup Completo)</span>
                </div>
                <span className="text-[11px] text-[#7f8e77]">Salvar arquivo</span>
              </button>

              <label className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#f7f5ee] border border-[#ded8c9] hover:bg-[#f0ebe0] text-xs font-semibold text-[#2c3a1e] transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#4a5f2e]" />
                  <span>Restaurar Backup a partir de Arquivo JSON</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <span className="text-[11px] text-[#7f8e77]">Carregar</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja restaurar todos os dados originais de demonstração da Floresta Verde? Suas alterações serão substituídas pelos exemplos iniciais.')) {
                    onResetDemo();
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#fef2f2] border border-[#fecaca] hover:bg-[#fee2e2] text-xs font-semibold text-[#991b1b] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#b91c1c]" />
                  <span>Restaurar Dados Originais de Demonstração</span>
                </div>
                <span className="text-[11px] text-[#b91c1c]">Reset demo</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f0ece2] flex items-center justify-between text-xs">
            <span className="text-[#7d8c74]">Precisa conectar banco de dados real?</span>
            <button
              type="button"
              onClick={onOpenDataGuide}
              className="text-[#495e2f] font-semibold hover:underline"
            >
              Ver Guia de Integração →
            </button>
          </div>
        </div>

        {/* Brand & Logo Permanent Status Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#eae5d8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#edf3e6] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#465b2d]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1c2918]">
                  Identidade Visual & Logomarca da Floresta Verde
                </h3>
                <p className="text-xs text-[#738268]">
                  Logomarca oficial fixada e permanente. A identidade visual foi padronizada de forma definitiva em todo o ecossistema do CRM e páginas comerciais.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#edf5e5] border border-[#cbdcb9] text-[#344b20] text-xs font-semibold shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#495d2f]" />
              <span>Logomarca Fixada & Protegida</span>
            </div>
          </div>
        </div>

        {/* Master User Management Panel Link Card (Only visible to Master) */}
        {isMaster && (
          <div className="bg-[#344322] text-white rounded-2xl p-6 border border-[#485d2e] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 lg:col-span-2">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#495f32] flex items-center justify-center text-[#d7e7c7] shrink-0 border border-[#5d7740]">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-serif text-white">
                    Painel de Criação & Gestão de Acessos
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/40 text-purple-200 border border-purple-400/40">
                    Apenas Master
                  </span>
                </div>
                <p className="text-xs text-[#c0d4ad] mt-0.5 max-w-xl">
                  Gere novos logins e senhas para colaboradores da equipe comercial e financeiro, redefina senhas e controle autorizações de acesso.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('usuarios')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#f2efe6] text-[#2c3d1b] text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#485b2e]" />
              <span>Abrir Gerador de Acessos →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
