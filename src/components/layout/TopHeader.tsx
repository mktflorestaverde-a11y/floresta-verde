import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Globe,
  Info,
  KeyRound,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  User,
  UserPlus,
  Cloud,
} from 'lucide-react';
import { FilterPeriod, SegmentFilter } from '../../types/crm';
import { ActiveTab } from './Sidebar';
import { CRMAuthUser, crmStorage } from '../../services/crmStorage';
import { subscribeToFirebaseStatus, FirebaseConnectionStatus } from '../../services/firestoreSync';

interface TopHeaderProps {
  activeTab: ActiveTab;
  period: FilterPeriod;
  onSelectPeriod: (p: FilterPeriod) => void;
  segment: SegmentFilter;
  onSelectSegment: (s: SegmentFilter) => void;
  onOpenMobileSidebar: () => void;
  onOpenNewCustomer: () => void;
  onOpenNewOrder: () => void;
  onOpenDataGuide: () => void;
  onOpenLogoModal: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  currentUser: CRMAuthUser | null;
  onLogout: () => void;
  onSelectTab?: (tab: ActiveTab) => void;
  onViewLandingPage?: () => void;
  onOpenHostingerModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  period,
  onSelectPeriod,
  segment,
  onSelectSegment,
  onOpenMobileSidebar,
  onOpenNewCustomer,
  onOpenNewOrder,
  onOpenDataGuide,
  onOpenLogoModal,
  isDemoMode,
  onToggleDemoMode,
  currentUser,
  onLogout,
  onSelectTab,
  onViewLandingPage,
  onOpenHostingerModal,
}) => {
  const isMaster = crmStorage.isUserMaster(currentUser);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const [fbStatus, setFbStatus] = useState<FirebaseConnectionStatus>({
    isConnected: true,
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
    realCustomersCount: 0,
    realOrdersCount: 0,
    usersCount: 0,
  });

  useEffect(() => {
    return subscribeToFirebaseStatus(setFbStatus);
  }, []);

  const userInitials = (currentUser?.name || 'CD')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const periodLabels: Record<FilterPeriod, string> = {
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    '12m': 'Últimos 12 meses',
  };

  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    visao_geral: {
      title: 'Visão geral de clientes',
      subtitle: 'Acompanhe o desempenho comercial da Floresta Verde no atacado e no consumidor final.',
    },
    clientes: {
      title: 'Gestão de Clientes',
      subtitle: 'Histórico de compras, ciclos médios, previsão de recompra e dados cadastrais.',
    },
    funis: {
      title: 'Funis de Vendas',
      subtitle: 'Pipeline comercial B2B (atacado) e jornada de conversão B2C (e-commerce e varejo).',
    },
    prazo: {
      title: 'Vendas a Prazo & Boletos',
      subtitle: 'Controle de clientes com compras faturadas, vencimento de boletos e contagem regressiva para recompra.',
    },
    pedidos: {
      title: 'Pedidos & Faturamento',
      subtitle: 'Histórico de pedidos realizados, pagamentos e faturamento por segmento.',
    },
    relatorios: {
      title: 'Relatórios & Inteligência',
      subtitle: 'Análise de recompra, retenção, clientes a reativar e exportação de dados.',
    },
    whatsapp: {
      title: 'WhatsApp API & Central Comercial',
      subtitle: 'Disparo de mensagens oficiais, catálogos, propostas e boletos com backend API integrado.',
    },
    usuarios: {
      title: 'Gestão de Acessos & Usuários',
      subtitle: 'Painel exclusivo Master para gerar credenciais, cadastrar colaboradores e definir permissões.',
    },
  };

  const currentMeta = titles[activeTab] || titles.visao_geral;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPeriodDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="px-4 md:px-8 pt-5 pb-4">
      {/* Top Banner for Demo / Real Status */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 p-2.5 px-3.5 rounded-2xl border transition-all text-xs font-medium shadow-2xs ${
        isDemoMode
          ? 'bg-[#fffbf0] border-[#ecd9ab] text-[#745511]'
          : 'bg-[#eef8eb] border-[#bedfc0] text-[#1e461a]'
      }">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'
            }`}
          />
          <span className="font-semibold">
            {isDemoMode ? 'Ambiente de Demonstração (Dados Ilustrativos)' : 'Ambiente de Produção (Dados Reais Ativos)'}
          </span>
          <span className="hidden md:inline text-[11px] opacity-75">
            {isDemoMode
              ? '• Exibindo catálogo e métricas simuladas da referência visual'
              : '• Todos os clientes, pedidos e funis refletem registros reais'}
          </span>
        </div>

        {/* DEMO ON/OFF TOGGLE SWITCH BUTTON + FIREBASE CLOUD BADGE */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 border border-[#bedfc0] text-[#1e461a] text-[11px] font-semibold shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                fbStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <Cloud className="w-3.5 h-3.5 text-emerald-700" />
            <span>Firestore: Base Real Ativa ({fbStatus.isConnected ? 'Conectado' : 'Conectando...'})</span>
            {fbStatus.lastSyncedAt && (
              <span className="hidden sm:inline text-emerald-800/60 font-normal">
                ({fbStatus.lastSyncedAt})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleDemoMode}
            className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs ${
              isDemoMode
                ? 'bg-[#485b2e] hover:bg-[#394a23] text-white ring-2 ring-[#485b2e]/20'
                : 'bg-white hover:bg-[#e4f1e0] text-[#1c4118] border border-[#a4c99e]'
            }`}
            title={
              isDemoMode
                ? 'Clique para DESLIGAR o modo demo e usar DADOS REAIS imediatamente'
                : 'Clique para LIGAR o modo demo com dados ilustrativos'
            }
          >
            {isDemoMode ? (
              <>
                <ToggleRight className="w-4 h-4 text-[#cfdfbe]" />
                <span>Desligar Demo (Ir para Real)</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-emerald-600" />
                <span>Ligar Demo (Ilustrativo)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Mobile hamburger + Titles */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden mt-0.5 p-2 rounded-lg bg-white border border-[#e2decfa6] text-[#334321] hover:bg-[#ede9dc] transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1c2918]">
              {currentMeta.title}
            </h1>
            <p className="text-xs md:text-sm text-[#66735e] mt-1 font-normal">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Segment Selector (B2B Atacado vs B2C Consumidor) */}
          <div className="inline-flex p-1 bg-[#eae6dc] rounded-2xl border border-[#ded9cd]/70 shadow-2xs">
            <button
              type="button"
              onClick={() => onSelectSegment('b2b')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                segment === 'b2b'
                  ? 'bg-[#485b2e] text-white shadow-xs'
                  : 'text-[#506041] hover:text-[#1c2918]'
              }`}
              title="Filtrar clientes e faturamento de atacado B2B"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>B2B Atacado</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSegment('b2c')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                segment === 'b2c'
                  ? 'bg-[#485b2e] text-white shadow-xs'
                  : 'text-[#506041] hover:text-[#1c2918]'
              }`}
              title="Filtrar clientes e faturamento de consumidor B2C"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>B2C Varejo</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectSegment('all')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                segment === 'all'
                  ? 'bg-white text-[#2a381d] shadow-xs font-bold'
                  : 'text-[#77876a] hover:text-[#1c2918]'
              }`}
              title="Mostrar dados consolidados de ambos os segmentos"
            >
              Todos
            </button>
          </div>

          {onViewLandingPage && (
            <button
              type="button"
              onClick={onViewLandingPage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#ded8c9] text-xs font-medium text-[#485b2e] hover:bg-[#faf9f6] transition-colors shadow-2xs"
              title="Visualizar a Landing Page pública de atacado"
            >
              <Globe className="w-3.5 h-3.5 text-[#6c8056]" />
              <span className="hidden sm:inline">Site B2B</span>
            </button>
          )}

          {onOpenHostingerModal && (
            <button
              type="button"
              onClick={onOpenHostingerModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#2c431b] to-[#45612c] hover:from-[#354f21] hover:to-[#507234] text-white text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#527732]"
              title="Publicar na Hostinger e configurar domínio crmfv.com.br"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <span>Publicar na Hostinger</span>
            </button>
          )}

          {/* Period Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#ded8c9] text-xs font-medium text-[#2d3a20] hover:bg-[#faf9f6] transition-colors shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-[#5e7146]" />
              <span>{periodLabels[period]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#7c8b6e]" />
            </button>

            {periodDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-[#ded8c9] shadow-lg py-1.5 z-30 animate-in fade-in-50 zoom-in-95 duration-100">
                {(['7d', '30d', '90d', '12m'] as FilterPeriod[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onSelectPeriod(p);
                      setPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                      period === p
                        ? 'bg-[#edf3e5] text-[#33471c] font-semibold'
                        : 'text-[#485739] hover:bg-[#f6f4ee]'
                    }`}
                  >
                    <span>{periodLabels[p]}</span>
                    {period === p && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#485b2e]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action: New Order */}
          <button
            type="button"
            onClick={onOpenNewOrder}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#ded8c9] text-xs font-semibold text-[#324520] hover:bg-[#f3f7ec] transition-colors shadow-2xs"
            title="Registrar novo pedido"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#526a35]" />
            <span>+ Pedido</span>
          </button>

          {/* Quick WhatsApp Web Button */}
          <button
            type="button"
            onClick={() => {
              if (onSelectTab) {
                onSelectTab('whatsapp');
              } else {
                window.open('https://web.whatsapp.com', '_blank');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Abrir WhatsApp Web no Computador"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">WhatsApp API</span>
          </button>

          {/* Quick Action: New Customer */}
          <button
            type="button"
            onClick={onOpenNewCustomer}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#495d2f] text-white text-xs font-semibold hover:bg-[#3c4e25] transition-all shadow-xs"
            title="Cadastrar novo cliente"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Novo Cliente</span>
          </button>

          {/* User Profile & Logout Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-white border border-[#ded8c9] text-xs hover:bg-[#faf9f6] transition-colors shadow-2xs"
              title="Perfil do Usuário Autenticado"
            >
              <div className="w-6 h-6 rounded-full bg-[#485b2e] text-white flex items-center justify-center font-bold text-[10px]">
                {userInitials}
              </div>
              <span className="font-semibold text-[#29381c] hidden sm:inline">
                {currentUser?.name || 'CESARDIRETOR'}
              </span>
              {isMaster && (
                <span title="Perfil Master" className="hidden sm:inline-flex items-center">
                  <Shield className="w-3 h-3 text-purple-700" />
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-[#77866a]" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white border border-[#ded8c9] shadow-xl py-2 z-40 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-[#eee9dc]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#1f2d16]">
                      {currentUser?.name || 'CESARDIRETOR'}
                    </p>
                    {isMaster && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                        MASTER
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#6d7e5e]">
                    {currentUser?.role || (isMaster ? 'Master • Diretoria' : 'Colaborador')}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f0eee4] text-[#33461f]">
                    @{currentUser?.username || 'CESARDIRETOR'}
                  </span>
                </div>

                <div className="py-1">
                  {/* Master Users Management link */}
                  {isMaster && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onSelectTab) onSelectTab('usuarios');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#2b3e1a] hover:bg-[#edf5e4] flex items-center gap-2 border-b border-[#f4f2ea]"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#485b2e]" />
                      <span>Gerenciar Acessos & Usuários</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenDataGuide();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-[#3b4c27] hover:bg-[#f6f4ee] flex items-center gap-2"
                  >
                    <span>Guia de Dados & Integrações</span>
                  </button>

                  {onOpenHostingerModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenHostingerModal();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-[#25451c] hover:bg-[#edf5e3] flex items-center gap-2"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Publicar na Hostinger (crmfv.com.br)</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-[#eee9dc]">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair (Voltar ao Login)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
