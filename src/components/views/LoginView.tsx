import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { LogoFlorestaVerde } from '../brand/LogoFlorestaVerde';
import { CRMAuthUser, crmStorage } from '../../services/crmStorage';

interface LoginViewProps {
  onLoginSuccess: (user: CRMAuthUser) => void;
  customLogoUrl: string | null;
  onOpenLogoModal?: () => void;
  onBackToLanding?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  customLogoUrl,
  onOpenLogoModal,
  onBackToLanding,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Por favor, informe seu usuário de acesso.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = crmStorage.login(username, password, rememberMe);
      setIsLoading(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Credenciais inválidas. Verifique os dados digitados.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ec] flex flex-col justify-between selection:bg-[#cad7b8] selection:text-[#1e291b]">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-[#e6e1d4] bg-white/70 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoFlorestaVerde width={34} height={40} variant="shield" customLogoUrl={customLogoUrl} />
          <div>
            <span className="font-serif text-lg font-bold text-[#2d3b1e] tracking-tight block leading-tight">
              Floresta Verde
            </span>
            <span className="text-[11px] font-medium text-[#687a55] tracking-wide block">
              CRM Comercial & Gestão de Vendas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="text-xs font-semibold text-[#3b4c25] hover:text-[#1c2918] bg-[#eef3e8] hover:bg-[#e2edd8] px-3.5 py-1.5 rounded-lg border border-[#cad7be] transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Site B2B</span>
            </button>
          )}

          {onOpenLogoModal && (
            <button
              type="button"
              onClick={onOpenLogoModal}
              className="text-xs font-medium text-[#52653a] hover:text-[#2d3a1d] bg-[#f0f4ea] hover:bg-[#e4eed9] px-3 py-1.5 rounded-lg border border-[#cad9bc] transition-colors"
              title="Colocar o arquivo original da sua logo"
            >
              Personalizar Logo
            </button>
          )}
        </div>
      </header>

      {/* Main Login Card - Painel Liso e Exclusivo */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#dcd6c5] shadow-xl shadow-[#344322]/5 overflow-hidden">
          {/* Header banner */}
          <div className="bg-[#344322] px-6 pt-8 pb-7 text-center relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`relative transition-transform ${onOpenLogoModal ? 'cursor-pointer group hover:scale-[1.02]' : ''}`}
                onClick={onOpenLogoModal}
                title={onOpenLogoModal ? "Clique para personalizar ou carregar a logo oficial" : undefined}
              >
                <LogoFlorestaVerde
                  width={116}
                  height={132}
                  customLogoUrl={customLogoUrl}
                  showUploadTrigger={false}
                />
              </div>

              <div className="mt-3.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#465a2d] text-[#e0ead4] text-[10px] font-semibold tracking-wider uppercase border border-[#587239]">
                <ShieldCheck className="w-3 h-3 text-[#d3e3c2]" />
                <span>Portal Corporativo Floresta Verde</span>
              </div>

              <h1 className="mt-2 text-xl font-bold text-white tracking-tight font-serif">
                Acesso ao CRM
              </h1>
              <p className="text-xs text-[#cad7b8] mt-1 font-normal max-w-xs">
                Aromas que conectam pessoas e ambientes.
              </p>
            </div>
          </div>

          {/* Form Content - Painel liso apenas com Login e Senha */}
          <div className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <span className="font-semibold text-red-600 mt-0.5">•</span>
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label className="block text-xs font-semibold text-[#324322] mb-1.5">
                  Usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718260]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário"
                    autoComplete="username"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-sm text-[#1e291b] placeholder:text-[#a0a996] focus:outline-none focus:ring-2 focus:ring-[#485b2e] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-[#324322] mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718260]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#faf9f6] border border-[#ded8c9] text-sm text-[#1e291b] placeholder:text-[#a0a996] focus:outline-none focus:ring-2 focus:ring-[#485b2e] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#718260] hover:text-[#2d3a20] transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#526343] font-medium select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#c5bfae] text-[#485b2e] focus:ring-[#485b2e] h-4 w-4"
                  />
                  <span>Lembrar nesta máquina</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#485b2e] hover:bg-[#3b4b25] text-white text-sm font-semibold tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar no CRM</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Master Credential Quick Fill */}
              <div className="pt-2 text-center space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setUsername('cesarDiretor');
                    setPassword('123456');
                    setErrorMessage(null);
                  }}
                  className="text-[11px] text-[#556942] hover:text-[#2d3a1f] underline underline-offset-2 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-[#70845a]" />
                  <span>Preencher Acesso Master (cesarDiretor)</span>
                </button>

                {onBackToLanding && (
                  <div>
                    <button
                      type="button"
                      onClick={onBackToLanding}
                      className="text-xs text-[#6e7f5e] hover:text-[#283818] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar para a Landing Page de Atacado</span>
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#738266]">
        <p>© Floresta Verde • Marca Registrada ® • Todos os direitos reservados</p>
      </footer>
    </div>
  );
};
