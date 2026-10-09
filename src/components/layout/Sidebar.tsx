import React from 'react';
import {
  BarChart3,
  CalendarClock,
  Camera,
  Filter,
  Globe,
  Home,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  MessageCircle,
  Package,
  Shield,
  ShieldCheck,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { BotanicalSidebarDecoration, LogoFlorestaVerde } from '../brand/LogoFlorestaVerde';
import { CRMAuthUser, crmStorage } from '../../services/crmStorage';

export type ActiveTab = 'visao_geral' | 'clientes' | 'funis' | 'prazo' | 'pedidos' | 'relatorios' | 'whatsapp' | 'usuarios';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  customLogoUrl?: string | null;
  onOpenLogoModal: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  currentUser: CRMAuthUser | null;
  onLogout: () => void;
  onViewLandingPage?: () => void;
  onOpenMediaModal?: () => void;
  onOpenHostingerModal?: () => void;
  counts?: {
    customers: number;
    orders: number;
    prazoOpen?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  customLogoUrl,
  onOpenLogoModal,
  isDemoMode,
  onToggleDemoMode,
  currentUser,
  onLogout,
  onViewLandingPage,
  onOpenMediaModal,
  onOpenHostingerModal,
  counts,
}) => {
  const isMaster = crmStorage.isUserMaster(currentUser);

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isMasterOnly?: boolean;
  }> = [
    { id: 'visao_geral', label: 'Visão geral', icon: Home },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'funis', label: 'Funis', icon: Filter },
    { id: 'prazo', label: 'A Prazo', icon: CalendarClock },
    { id: 'pedidos', label: 'Pedidos', icon: Package },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'whatsapp', label: 'WhatsApp API & Vendas', icon: MessageCircle },
    ...(isMaster
      ? [
          {
            id: 'usuarios' as ActiveTab,
            label: 'Acessos & Usuários',
            icon: KeyRound,
            isMasterOnly: true,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 md:w-68 bg-[#344322] text-[#e0ead4] flex flex-col justify-between py-5 px-4 transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Logo, Navigation, and Demo Switch */}
        <div className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar">
          <div className="flex items-center justify-between px-2 mb-2 lg:mb-3">
            <div className="w-full flex flex-col items-center py-1">
              <LogoFlorestaVerde
                width={138}
                height={154}
                customLogoUrl={customLogoUrl}
                onOpenUploadModal={onOpenLogoModal}
                showUploadTrigger={true}
              />
              <button
                type="button"
                onClick={onOpenLogoModal}
                className="mt-2 text-[11px] font-medium text-[#c0d4af] hover:text-white bg-[#2b381c]/70 hover:bg-[#43552d] px-3 py-1 rounded-full border border-[#485b2e] transition-colors flex items-center gap-1.5"
                title="Clique para colocar ou trocar o arquivo oficial da logo"
              >
                <Camera className="w-3 h-3 text-[#d3e3c2]" />
                <span>{customLogoUrl ? 'Alterar Logo' : 'Colocar Minha Logo'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#cad7b8] hover:text-white hover:bg-[#43552d] transition-colors self-start"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-3 space-y-1 px-1" aria-label="Navegação Principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-[#4b5d32] text-white shadow-xs font-semibold'
                      : 'text-[#d0ddc0] hover:bg-[#3f5129] hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-white' : 'text-[#b9cca8]'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>

                  {item.id === 'clientes' && counts?.customers !== undefined && (
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[#2a371b] text-[#cad7b8]">
                      {counts.customers}
                    </span>
                  )}
                  {item.id === 'pedidos' && counts?.orders !== undefined && (
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[#2a371b] text-[#cad7b8]">
                      {counts.orders}
                    </span>
                  )}
                  {item.id === 'prazo' && counts?.prazoOpen !== undefined && counts.prazoOpen > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-400/40">
                      {counts.prazoOpen}
                    </span>
                  )}
                  {item.id === 'whatsapp' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                      API
                    </span>
                  )}
                  {item.id === 'usuarios' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">
                      Master
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* DEMO MODE SWITCH CARD IN SIDEBAR */}
          <div className="mt-5 mx-1 p-3 rounded-2xl bg-[#28351a]/85 border border-[#44562c]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-[#c9ddb7] uppercase tracking-wider">
                Ambiente
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDemoMode
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isDemoMode ? 'Modo Demo' : 'Modo Real'}
              </span>
            </div>

            <p className="text-[11px] text-[#a4b891] mb-2.5 leading-snug">
              {isDemoMode
                ? 'Exibindo dados ilustrativos. Desligue para operar em modo real na hora.'
                : 'Operando 100% com clientes e pedidos reais cadastrados.'}
            </p>

            <button
              type="button"
              onClick={onToggleDemoMode}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isDemoMode
                  ? 'bg-[#4b5e2f] hover:bg-[#586e38] text-white shadow-xs'
                  : 'bg-[#212b15] hover:bg-[#2e3b1e] text-[#d6e7c6] border border-[#4d6232]'
              }`}
              title={
                isDemoMode
                  ? 'Clique para desligar os dados de demonstração'
                  : 'Clique para reativar o modo de demonstração'
              }
            >
              {isDemoMode ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                  <span>Desligar Demo (Ficar Real)</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-[#a6ba90]" />
                  <span>Ligar Modo Demo</span>
                </>
              )}
            </button>

            {onOpenHostingerModal && (
              <button
                type="button"
                onClick={onOpenHostingerModal}
                className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-[#2f491c] to-[#3f5f24] hover:from-[#3a5a22] hover:to-[#4d722d] text-emerald-200 hover:text-white border border-[#527731] transition-all cursor-pointer shadow-xs"
                title="Publicar na Hostinger e configurar domínio crmfv.com.br"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-300" />
                <span>Subir na Hostinger (crmfv)</span>
              </button>
            )}

            {onViewLandingPage && (
              <button
                type="button"
                onClick={onViewLandingPage}
                className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-[#253218] hover:bg-[#324320] text-[#d6e5c8] hover:text-white border border-[#44562c] transition-all"
                title="Visualizar a Landing Page pública de conversão B2B"
              >
                <Globe className="w-3.5 h-3.5 text-[#a8be95]" />
                <span>Ver Landing Page B2B</span>
              </button>
            )}

            {onOpenMediaModal && (
              <button
                type="button"
                onClick={onOpenMediaModal}
                className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-[#1b2512] hover:bg-[#27351a] text-[#b6cfab] hover:text-white border border-[#374923] transition-all cursor-pointer shadow-2xs"
                title="Ajustar manualmente o tamanho da logo, da escrita do cabeçalho e trocar imagens do banner (Exclusivo da Equipe)"
              >
                <Sliders className="w-3.5 h-3.5 text-[#7ec65c]" />
                <span>Ajustar Logo & Escritos</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom: User Card, Logout & Botanical Decoration */}
        <div className="pt-3 border-t border-[#44562c] space-y-3">
          {/* Authenticated User Card */}
          <div className="p-2.5 rounded-xl bg-[#2b381c]/60 border border-[#3f5028] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#485b2e] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {(currentUser?.name || 'CD')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {currentUser?.name || 'CESARDIRETOR'}
                  </p>
                  {isMaster && (
                    <span title="Perfil Master" className="shrink-0 flex items-center">
                      <Shield className="w-3 h-3 text-purple-300" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#a0b58d] truncate">
                  {currentUser?.role || (isMaster ? 'Master • Diretoria' : 'Colaborador')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-[#b8cca8] hover:text-white hover:bg-[#43552d] transition-colors"
              title="Sair do CRM (Voltar ao Login)"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <BotanicalSidebarDecoration />
        </div>
      </aside>
    </>
  );
};
