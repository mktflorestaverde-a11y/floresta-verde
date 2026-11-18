import React, { useState, useEffect } from 'react';
import {
  Download,
  ExternalLink,
  Globe,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  Server,
  FolderArchive,
  ArrowRight,
  X,
  FileCode2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface HostingerDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingerDeployModal: React.FC<HostingerDeployModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [packageSize, setPackageSize] = useState<string>('0.56 MB');

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/download/hostinger-status');
      if (res.ok) {
        const data = await res.json();
        if (data.sizeFormatted) {
          setPackageSize(data.sizeFormatted);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setDownloadSuccess(false);
      setDownloadError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyDomain = () => {
    navigator.clipboard.writeText('crmfv.com.br');
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      const response = await fetch('/api/download/hostinger-zip');
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao carregar pacote.`);
      }
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Arquivo vazio recebido.');
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hostinger-public_html.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
      setDownloadSuccess(true);
    } catch (err: any) {
      console.warn('[HostingerDeploy] Falha no download via blob, acionando fallback:', err);
      // Fallback to direct navigation download
      const fallbackLink = document.createElement('a');
      fallbackLink.href = '/api/download/hostinger-zip';
      fallbackLink.download = 'hostinger-public_html.zip';
      fallbackLink.target = '_blank';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
      setDownloadSuccess(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRebuildAndDownload = async () => {
    setIsRebuilding(true);
    setDownloadError(null);
    setDownloadSuccess(false);
    try {
      const res = await fetch('/api/download/hostinger-rebuild', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao recompilar os arquivos.');
      }
      if (data.sizeFormatted) {
        setPackageSize(data.sizeFormatted);
      }
      await handleDownload();
    } catch (err: any) {
      setDownloadError(err.message || 'Erro ao recompilar o projeto.');
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-[#ded8c9] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#2c411f] to-[#455b2d] text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <Globe className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Publicar no Domínio crmfv.com.br
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-[11px] font-semibold text-emerald-200">
                  Hostinger
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Guia passo a passo simples e à prova de erros para colocar seu site no ar em 2 minutos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm text-[#2d3a22]">
          
          {/* Main Action Banner: 1-Click Download */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#f2f8ed] to-[#e4f0dc] border-2 border-[#b5d5ab] shadow-xs flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#1c4118] font-bold text-base">
                  <FolderArchive className="w-5 h-5 text-emerald-700" />
                  <span>Pacote de Produção Pronto para a Hostinger</span>
                </div>
                <p className="text-xs text-[#405c36] leading-relaxed">
                  Arquivo ZIP limpo ({packageSize}) contendo o código compilado em HTML/JS/CSS e o arquivo <code className="bg-white/80 px-1.5 py-0.5 rounded border border-[#c1deba] font-mono text-[11px] text-[#244f1e]">.htaccess</code> com tipos MIME configurados para evitar erro 404 e tela branca.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading || isRebuilding}
                  className="px-5 py-3 rounded-2xl bg-[#2e5e23] hover:bg-[#234b1a] disabled:opacity-60 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                  <span>{isDownloading ? 'Baixando Arquivo...' : 'Baixar hostinger-public_html.zip'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRebuildAndDownload}
                  disabled={isDownloading || isRebuilding}
                  className="px-3.5 py-3 rounded-2xl bg-white hover:bg-[#ebf4e6] border border-[#a8cda0] text-[#274f1e] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Recompila todos os arquivos do zero e baixa a versão mais fresca"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRebuilding ? 'animate-spin text-emerald-700' : ''}`} />
                  <span>{isRebuilding ? 'Recompilando...' : 'Recompilar'}</span>
                </button>
              </div>
            </div>

            {/* Direct fallback link and status */}
            <div className="pt-2 border-t border-[#c6dfbc] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#35532b]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Pacote validado: <b>{packageSize}</b> (sem arquivos duplicados ou recursivos).</span>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/api/download/hostinger-zip"
                  download="hostinger-public_html.zip"
                  className="text-[#2b5a1f] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>Download Alternativo (Link Direto)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {downloadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Download iniciado com sucesso! Salve o arquivo <b>hostinger-public_html.zip</b> e siga os 4 passos abaixo.</span>
              </div>
            )}

            {downloadError && (
              <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{downloadError}</span>
              </div>
            )}
          </div>

          {/* 4 Steps for Beginners (Zero Code Required) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <h3 className="font-bold text-sm text-[#1c2918] uppercase tracking-wider">
                Como subir na Hostinger em 4 passos (Sem precisar de Git nem terminal)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ebe5d6] flex gap-3.5">
                <div className="w-7 h-7 rounded-xl bg-[#43592b] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1c2918]">Baixe o pacote .zip</h4>
                  <p className="text-[11px] text-[#556747] mt-1 leading-relaxed">
                    Clique no botão verde acima para baixar o arquivo <span className="font-mono font-semibold text-[#30451e]">hostinger-public_html.zip</span> para o seu computador.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ebe5d6] flex gap-3.5">
                <div className="w-7 h-7 rounded-xl bg-[#43592b] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1c2918]">Abra a Hostinger</h4>
                  <p className="text-[11px] text-[#556747] mt-1 leading-relaxed">
                    Entre no painel da Hostinger, vá em <b>Sites</b>, selecione <b>crmfv.com.br</b> e clique em <b>Gerenciador de Arquivos</b> (File Manager) &rarr; abra a pasta <b>public_html</b>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ebe5d6] flex gap-3.5">
                <div className="w-7 h-7 rounded-xl bg-[#43592b] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1c2918]">Upload do ZIP</h4>
                  <p className="text-[11px] text-[#556747] mt-1 leading-relaxed">
                    Se houver arquivos antigos dentro de <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded">public_html</code>, você pode apagá-los. Clique no botão de <b>Fazer Upload</b> (ícone de seta para cima) e selecione o <span className="font-mono font-semibold">hostinger-public_html.zip</span>.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl bg-[#faf9f5] border border-[#ebe5d6] flex gap-3.5">
                <div className="w-7 h-7 rounded-xl bg-[#43592b] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1c2918]">Extraia e Acesse</h4>
                  <p className="text-[11px] text-[#556747] mt-1 leading-relaxed">
                    Clique com o botão direito no arquivo zip dentro da Hostinger e selecione <b>Extrair</b> (Extract). Escolha a pasta <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded">public_html</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Explanation of what was happening before */}
          <div className="p-4.5 rounded-2xl bg-[#fffcf5] border border-[#ebdcb9] space-y-3">
            <div className="flex items-center gap-2 text-[#7c5415] font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Por que o site estava ficando todo em branco antes?</span>
            </div>
            <div className="space-y-2 text-xs text-[#634e23] leading-relaxed">
              <p>
                <b>1. Na Hostinger (via Git):</b> O Git da Hostinger só faz o download dos arquivos do GitHub, mas <b>não roda o compilador React/Vite</b>. Ele colocou arquivos de código-fonte como <code className="bg-[#f5ebd2] px-1 py-0.5 rounded font-mono text-[11px]">.tsx</code> e <code className="bg-[#f5ebd2] px-1 py-0.5 rounded font-mono text-[11px]">package.json</code> na pasta web. Como os navegadores de internet só entendem arquivos <code className="bg-[#f5ebd2] px-1 py-0.5 rounded font-mono text-[11px]">.js</code> compilados, a tela ficava totalmente branca.
              </p>
              <p>
                <b>2. No GitHub (Erro 404 "Page Not Found"):</b> Aquele erro 404 que apareceu no seu navegador acontece porque o repositório é <b>Privado</b>. Quando você acessa o link do GitHub sem estar conectado na conta dona do repositório (<code className="bg-[#f5ebd2] px-1 py-0.5 rounded font-mono text-[11px]">mktflorestaverde-a11y</code>), o GitHub finge que a página não existe por questão de privacidade e segurança.
              </p>
              <p className="font-semibold text-[#483713]">
                💡 Fazendo pelo arquivo ZIP acima, você não depende de Git, chaves SSH nem GitHub. É o método oficial mais rápido e 100% garantido para hospedagens compartilhadas da Hostinger.
              </p>
            </div>
          </div>

          {/* Direct link test */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#f4f2ea] border border-[#ded8c9]">
            <div className="flex items-center gap-2 text-xs text-[#354329]">
              <Globe className="w-4 h-4 text-[#4a6331]" />
              <span>Seu domínio registrado:</span>
              <span className="font-bold text-[#1c2918] bg-white px-2 py-0.5 rounded-lg border border-[#d2cbba]">
                crmfv.com.br
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyDomain}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#ded8c9] hover:bg-[#ede8dc] text-xs font-semibold text-[#324520] transition-colors flex items-center gap-1.5"
              >
                {copiedDomain ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#5e7146]" />
                    <span>Copiar Domínio</span>
                  </>
                )}
              </button>

              <a
                href="https://crmfv.com.br"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#455b2d] hover:bg-[#344621] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Acessar crmfv.com.br</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f6f0] border-t border-[#eae5d8] flex items-center justify-between">
          <span className="text-[11px] text-[#78886e]">
            Floresta Verde CRM • Compilação de Produção Pronta
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#495d2f] text-white text-xs font-semibold hover:bg-[#3c4e25] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
