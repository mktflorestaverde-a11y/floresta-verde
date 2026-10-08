import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Check,
  Eye,
  Image as ImageIcon,
  Info,
  Maximize2,
  Lock,
  Unlock,
  RefreshCcw,
  Sliders,
  Sparkles,
  Trash2,
  Type,
  Upload,
  Wind,
  X,
  Loader2,
  Menu,
  Monitor,
  Package,
  Smartphone,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { crmStorage, LandingMediaSettings } from '../../services/crmStorage';
import { LogoFlorestaVerde } from '../brand/LogoFlorestaVerde';
import { compressImageFile } from '../../utils/imageOptimizer';
import { WindBlowingLeaves } from '../landing/WindBlowingLeaves';
import {
  FLOATING_MODELS_CONFIG,
  MiniatureProductSVG,
} from '../landing/MiniatureProducts';

interface LandingMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string | null;
  onLogoUpdated: (newLogoUrl: string | null) => void;
  onMediaUpdated?: (newMedia: LandingMediaSettings) => void;
}

export const LandingMediaModal: React.FC<LandingMediaModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onLogoUpdated,
  onMediaUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'logoAndHeader' | 'heroTree' | 'products'>('logoAndHeader');

  // Media states
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl);
  const [treeBgUrl, setTreeBgUrl] = useState<string>('');
  const [diffusersUrl, setDiffusersUrl] = useState<string>('');
  const [spraysUrl, setSpraysUrl] = useState<string>('');
  const [oilsUrl, setOilsUrl] = useState<string>('');
  const [candlesUrl, setCandlesUrl] = useState<string>('');
  const [amenitiesUrl, setAmenitiesUrl] = useState<string>('');
  const [displaysUrl, setDisplaysUrl] = useState<string>('');

  // Manual Sizing Sliders for Logo & Header Typography
  const [logoWidth, setLogoWidth] = useState<number>(44);
  const [logoHeight, setLogoHeight] = useState<number>(50);
  const [lockProportions, setLockProportions] = useState<boolean>(true);
  const [titleFontSize, setTitleFontSize] = useState<number>(22);
  const [subtitleFontSize, setSubtitleFontSize] = useState<number>(11);
  const [headerTitleText, setHeaderTitleText] = useState<string>('Floresta Verde');
  const [headerSubtitleText, setHeaderSubtitleText] = useState<string>('Atacado & Parcerias B2B');
  const [headerPreviewDevice, setHeaderPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Banner appearance fine-tuning (to guarantee identical look on landing page)
  const [bannerBrightness, setBannerBrightness] = useState<number>(85);
  const [bannerOverlayOpacity, setBannerOverlayOpacity] = useState<number>(40);
  const [bannerPreviewMode, setBannerPreviewMode] = useState<'withBanner' | 'purePhoto'>('withBanner');
  const [showFloatingProducts, setShowFloatingProducts] = useState<boolean>(true);

  // Upload & Toast states
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressingMessage, setCompressingMessage] = useState('');
  const [successToast, setSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadTarget, setPendingUploadTarget] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLogoUrl(currentLogoUrl);
      const media = crmStorage.getLandingMedia();
      setTreeBgUrl(media.treeBgUrl || '');
      setDiffusersUrl(media.productDiffusersUrl || '');
      setSpraysUrl(media.productSpraysUrl || '');
      setOilsUrl(media.productOilsUrl || '');
      setCandlesUrl(media.productCandlesUrl || '');
      setAmenitiesUrl(media.productAmenitiesUrl || '');
      setDisplaysUrl(media.productDisplaysUrl || '');

      setLogoWidth(media.logoWidth || 44);
      setLogoHeight(media.logoHeight || 50);
      setTitleFontSize(media.titleFontSize || 22);
      setSubtitleFontSize(media.subtitleFontSize || 11);
      setHeaderTitleText(media.headerTitleText || 'Floresta Verde');
      setHeaderSubtitleText(media.headerSubtitleText || 'Atacado & Parcerias B2B');
      setBannerBrightness(media.bannerBrightness !== undefined ? media.bannerBrightness : 85);
      setBannerOverlayOpacity(media.bannerOverlayOpacity !== undefined ? media.bannerOverlayOpacity : 40);
      setShowFloatingProducts(media.showFloatingProducts !== false);
    }
  }, [isOpen, currentLogoUrl]);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File, target: string) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP ou SVG).');
      return;
    }

    try {
      setIsCompressing(true);
      setCompressingMessage('Otimizando e comprimindo imagem para qualidade máxima e carregamento veloz...');

      let compressedDataUrl = '';

      if (target === 'logo') {
        // High quality PNG with preserved transparent background
        compressedDataUrl = await compressImageFile(file, {
          maxWidth: 500,
          maxHeight: 500,
          quality: 0.9,
          outputFormat: 'image/png',
        });
        setLogoUrl(compressedDataUrl);
      } else if (target === 'heroTree') {
        // Full HD landscape banner optimized
        compressedDataUrl = await compressImageFile(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.84,
          outputFormat: 'image/jpeg',
        });
        setTreeBgUrl(compressedDataUrl);
      } else {
        // Product vitrine images
        compressedDataUrl = await compressImageFile(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.82,
          outputFormat: 'image/jpeg',
        });
        if (target === 'diffusers') setDiffusersUrl(compressedDataUrl);
        else if (target === 'sprays') setSpraysUrl(compressedDataUrl);
        else if (target === 'oils') setOilsUrl(compressedDataUrl);
        else if (target === 'candles') setCandlesUrl(compressedDataUrl);
        else if (target === 'amenities') setAmenitiesUrl(compressedDataUrl);
        else if (target === 'displays') setDisplaysUrl(compressedDataUrl);
      }
    } catch (err) {
      console.error('Erro na compressão:', err);
      alert('Não foi possível processar a imagem. Tente outro arquivo ou use o link direto.');
    } finally {
      setIsCompressing(false);
      setCompressingMessage('');
    }
  };

  const triggerUploadFor = (target: string) => {
    setPendingUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleSaveAll = () => {
    // 1. Save Logo
    if (logoUrl !== currentLogoUrl) {
      if (logoUrl) crmStorage.saveCustomLogo(logoUrl);
      else crmStorage.removeCustomLogo();
      onLogoUpdated(logoUrl);
    }

    // 2. Save Landing Page Media & Sizing
    const mediaPayload: LandingMediaSettings = {
      treeBgUrl: treeBgUrl.trim() || null,
      productDiffusersUrl: diffusersUrl.trim() || null,
      productSpraysUrl: spraysUrl.trim() || null,
      productOilsUrl: oilsUrl.trim() || null,
      productCandlesUrl: candlesUrl.trim() || null,
      productAmenitiesUrl: amenitiesUrl.trim() || null,
      productDisplaysUrl: displaysUrl.trim() || null,
      logoWidth,
      logoHeight,
      titleFontSize,
      subtitleFontSize,
      headerTitleText: headerTitleText.trim() || 'Floresta Verde',
      headerSubtitleText: headerSubtitleText.trim() || 'Atacado & Parcerias B2B',
      bannerBrightness,
      bannerOverlayOpacity,
      showFloatingProducts,
    };

    crmStorage.saveLandingMedia(mediaPayload);
    if (onMediaUpdated) onMediaUpdated(mediaPayload);

    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      onClose();
    }, 750);
  };

  const handleResetSizes = () => {
    setLogoWidth(44);
    setLogoHeight(50);
    setTitleFontSize(22);
    setSubtitleFontSize(11);
    setHeaderTitleText('Floresta Verde');
    setHeaderSubtitleText('Atacado & Parcerias B2B');
  };

  const handleResetBannerAppearance = () => {
    setBannerBrightness(85);
    setBannerOverlayOpacity(40);
  };

  const handleResetToDefaults = () => {
    if (confirm('Deseja restaurar todas as fotos e tamanhos para o padrão oficial da Floresta Verde?')) {
      crmStorage.removeCustomLogo();
      crmStorage.removeLandingMedia();
      onLogoUpdated(null);
      setLogoUrl(null);
      setTreeBgUrl('');
      setDiffusersUrl('');
      setSpraysUrl('');
      setOilsUrl('');
      setCandlesUrl('');
      setAmenitiesUrl('');
      setDisplaysUrl('');
      handleResetSizes();
      handleResetBannerAppearance();
      onClose();
    }
  };

  const activeBannerImage =
    treeBgUrl ||
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2000&q=85';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0d180c] border border-[#274820] rounded-3xl shadow-2xl overflow-hidden text-[#e8eee4]">
        {/* Hidden File Input for Image Uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && pendingUploadTarget) {
              handleFileUpload(file, pendingUploadTarget);
            }
            e.target.value = '';
          }}
        />

        {/* Compressing / Loading Overlay */}
        {isCompressing && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#86d46d] animate-spin" />
            <p className="text-sm font-semibold text-white">{compressingMessage}</p>
            <p className="text-xs text-[#a5c79c]">Garantindo salvamento seguro e visualização instantânea.</p>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#254221] bg-[#122211] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#244220] border border-[#3b6833] flex items-center justify-center text-[#95e07b] shadow-inner">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                  Personalização Visual da Plataforma & Landing Page
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1e3b1c] text-[#8ce073] border border-[#36682f]">
                  Acesso da Equipe
                </span>
              </div>
              <p className="text-xs text-[#a2c299] mt-0.5">
                Ajuste manual da logo, tipografia do cabeçalho e sincronização exata do banner e vitrines.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#92b389] hover:text-white hover:bg-[#203a1d] transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#254221] bg-[#122211] px-6 gap-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('logoAndHeader')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'logoAndHeader'
                ? 'border-[#75c65b] text-white'
                : 'border-transparent text-[#8ca884] hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 text-[#75c65b]" />
            <span>Tamanho da Logo & Escritos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('heroTree')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'heroTree'
                ? 'border-[#75c65b] text-white'
                : 'border-transparent text-[#8ca884] hover:text-white'
            }`}
          >
            <Wind className="w-4 h-4 text-[#75c65b]" />
            <span>Banner Principal & Fundo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'products'
                ? 'border-[#75c65b] text-white'
                : 'border-transparent text-[#8ca884] hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#75c65b]" />
            <span>Fotos dos Produtos (Vitrine)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
          {/* ============================================================ */}
          {/* TAB 1: LOGO & HEADER SIZING (EXCLUSIVE FOR LOGGED-IN STAFF) */}
          {/* ============================================================ */}
          {activeTab === 'logoAndHeader' && (
            <div className="space-y-6">
              {/* Notice of permissions */}
              <div className="p-3.5 rounded-2xl bg-[#182d16] border border-[#2b5026] flex items-center gap-3">
                <Info className="w-4 h-4 text-[#86d46d] shrink-0" />
                <span className="text-xs text-[#c3dec0]">
                  <strong>Controle Restrito:</strong> Os ajustes manuais e a troca de foto da logo abaixo são permitidos
                  <strong> exclusivamente para colaboradores autenticados na Área da Equipe</strong>. Visitantes públicos não visualizam controles nem podem alterar.
                </span>
              </div>

              {/* Live Preview Box with Desktop and Mobile Toggle */}
              <div className="p-5 rounded-2xl bg-[#0b150a] border border-[#274720] shadow-inner space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#86bf6c] uppercase tracking-wider text-[10px]">
                      Pré-visualização do Cabeçalho em Tempo Real:
                    </span>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#142613] border border-[#264421]">
                      <button
                        type="button"
                        onClick={() => setHeaderPreviewDevice('desktop')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                          headerPreviewDevice === 'desktop'
                            ? 'bg-[#295424] text-white shadow-xs'
                            : 'text-[#85a87d] hover:text-white'
                        }`}
                      >
                        <Monitor className="w-3 h-3" />
                        <span>Computador (Desktop)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeaderPreviewDevice('mobile')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                          headerPreviewDevice === 'mobile'
                            ? 'bg-[#295424] text-white shadow-xs'
                            : 'text-[#85a87d] hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>Celular (Mobile)</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetSizes}
                    className="text-[11px] text-[#9fcb8d] hover:text-white underline cursor-pointer"
                  >
                    Restaurar Proporções Padrões
                  </button>
                </div>

                {/* Simulated Header Navbar: DESKTOP MODE */}
                {headerPreviewDevice === 'desktop' ? (
                  <div className="p-4 rounded-xl bg-[#0d170c] border border-[#233b1e] flex items-center justify-between gap-4 overflow-hidden">
                    <div className="flex items-center gap-3.5 shrink-0">
                      <LogoFlorestaVerde
                        width={logoWidth}
                        height={logoHeight}
                        variant="compact"
                        customLogoUrl={logoUrl}
                      />
                      <div className="flex flex-col text-left shrink-0 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span
                            style={{ fontSize: `${titleFontSize}px` }}
                            className="font-serif font-bold tracking-tight text-white leading-none whitespace-nowrap transition-all"
                          >
                            {headerTitleText || 'Floresta Verde'}
                          </span>
                          <span className="text-[9px] font-bold text-[#86bf6c] border border-[#3b662e] px-1 rounded-sm leading-none py-0.5 shrink-0">
                            ®
                          </span>
                        </div>
                        <span
                          style={{ fontSize: `${subtitleFontSize}px` }}
                          className="font-semibold text-[#8ca87e] tracking-widest uppercase block mt-1 whitespace-nowrap transition-all"
                        >
                          {headerSubtitleText || 'Atacado & Parcerias B2B'}
                        </span>
                      </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-4 text-[10.5px] uppercase tracking-wider text-[#79996e] font-semibold">
                      <span>Vitrine</span>
                      <span>Guia Olfativo</span>
                      <span>Calculadora</span>
                      <span>Diferenciais</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block px-3 py-1.5 rounded-lg bg-[#274a21] text-white text-[11px] font-bold whitespace-nowrap">
                        Cadastrar Loja
                      </span>
                      <span className="text-[11px] text-[#78a06d] bg-[#142312] px-2.5 py-1 rounded-lg border border-[#253e20] whitespace-nowrap">
                        Logo: {logoWidth}×{logoHeight}px • Título: {titleFontSize}px • Subtítulo: {subtitleFontSize}px
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Simulated Header Navbar: MOBILE MODE */
                  <div className="max-w-md mx-auto p-3.5 rounded-xl bg-[#0d170c] border border-[#233b1e] flex items-center justify-between gap-2.5 shadow-lg">
                    <div className="flex items-center gap-2.5 shrink-0">
                      <LogoFlorestaVerde
                        width={Math.min(logoWidth, 48)}
                        height={Math.round((Math.min(logoWidth, 48) / Math.max(logoWidth, 1)) * logoHeight)}
                        variant="compact"
                        customLogoUrl={logoUrl}
                      />
                      <div className="flex flex-col text-left shrink-0 whitespace-nowrap">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <span
                            style={{ fontSize: `${Math.min(titleFontSize, 18)}px` }}
                            className="font-serif font-bold tracking-tight text-white leading-none whitespace-nowrap"
                          >
                            {headerTitleText || 'Floresta Verde'}
                          </span>
                          <span className="text-[8px] font-bold text-[#86bf6c] border border-[#3b662e] px-1 rounded-sm leading-none py-0.5 shrink-0">
                            ®
                          </span>
                        </div>
                        <span
                          style={{ fontSize: `${Math.min(subtitleFontSize, 9.5)}px` }}
                          className="font-semibold text-[#8ca87e] tracking-widest uppercase block mt-0.5 whitespace-nowrap"
                        >
                          {headerSubtitleText || 'Atacado & Parcerias B2B'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-[#274a21] text-white text-[10.5px] font-bold whitespace-nowrap">
                        Revender
                      </span>
                      <div className="p-1.5 rounded-lg bg-[#142312] border border-[#284422] text-[#b8d6af]">
                        <Menu className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}
                {headerPreviewDevice === 'mobile' && (
                  <div className="text-center text-[11px] text-[#9fcb8d]">
                    📱 <strong>Ajuste Mobile Proporcional:</strong> Logo reescalonada para ~{Math.min(logoWidth, 48)}×{Math.round((Math.min(logoWidth, 48) / Math.max(logoWidth, 1)) * logoHeight)}px e título para {Math.min(titleFontSize, 18)}px para encaixe perfeito em qualquer smartphone sem cortar textos.
                  </div>
                )}
              </div>

              {/* Sliders: Logo & Typography */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Tamanho da Logo */}
                <div className="p-5 rounded-2xl bg-[#142613] border border-[#294a24] space-y-4">
                  <div className="flex items-center justify-between text-white font-bold text-xs uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#75c65b]" />
                      <span>Dimensão da Logo (Manual)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLockProportions(!lockProportions)}
                      className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                        lockProportions
                          ? 'bg-[#22401d] border-[#396b30] text-[#9de87c]'
                          : 'bg-[#182916] border-[#294223] text-[#789670]'
                      }`}
                      title={lockProportions ? 'Proporção travada (ajuste conjunto)' : 'Proporção livre'}
                    >
                      {lockProportions ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{lockProportions ? 'Proporção Travada' : 'Livre'}</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#a5c79c]">Largura da Logo:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="24"
                            max="140"
                            value={logoWidth}
                            onChange={(e) => {
                              const val = Math.max(24, Math.min(140, Number(e.target.value) || 24));
                              setLogoWidth(val);
                              if (lockProportions) setLogoHeight(Math.round(val * 1.14));
                            }}
                            className="w-14 px-1.5 py-0.5 text-right font-mono font-bold text-white bg-[#0e1d0d] border border-[#2b4d24] rounded-md text-xs focus:ring-1 focus:ring-[#75c65b]"
                          />
                          <span className="text-xs text-[#8ca87e]">px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="24"
                        max="120"
                        step="2"
                        value={logoWidth}
                        onChange={(e) => {
                          const w = Number(e.target.value);
                          setLogoWidth(w);
                          if (lockProportions) {
                            setLogoHeight(Math.round(w * 1.14));
                          }
                        }}
                        className="w-full h-2 bg-[#1e3b1c] rounded-lg appearance-none cursor-pointer accent-[#75c65b]"
                      />
                      <div className="flex justify-between text-[10px] text-[#6d8a65] mt-0.5">
                        <span>24px (Discreta)</span>
                        <span>44px (Padrão)</span>
                        <span>120px (Grande)</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#a5c79c]">Altura da Logo:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="24"
                            max="140"
                            value={logoHeight}
                            onChange={(e) => {
                              const val = Math.max(24, Math.min(140, Number(e.target.value) || 24));
                              setLogoHeight(val);
                            }}
                            className="w-14 px-1.5 py-0.5 text-right font-mono font-bold text-white bg-[#0e1d0d] border border-[#2b4d24] rounded-md text-xs focus:ring-1 focus:ring-[#75c65b]"
                          />
                          <span className="text-xs text-[#8ca87e]">px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="24"
                        max="140"
                        step="2"
                        value={logoHeight}
                        onChange={(e) => setLogoHeight(Number(e.target.value))}
                        className="w-full h-2 bg-[#1e3b1c] rounded-lg appearance-none cursor-pointer accent-[#75c65b]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Tamanho dos Escritos do Cabeçalho */}
                <div className="p-5 rounded-2xl bg-[#142613] border border-[#294a24] space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Type className="w-4 h-4 text-[#75c65b]" />
                    <span>Tamanho dos Escritos (Tipografia)</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#a5c79c]">Tamanho do Título:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="14"
                            max="42"
                            value={titleFontSize}
                            onChange={(e) => {
                              const val = Math.max(14, Math.min(42, Number(e.target.value) || 14));
                              setTitleFontSize(val);
                            }}
                            className="w-14 px-1.5 py-0.5 text-right font-mono font-bold text-white bg-[#0e1d0d] border border-[#2b4d24] rounded-md text-xs focus:ring-1 focus:ring-[#75c65b]"
                          />
                          <span className="text-xs text-[#8ca87e]">px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="14"
                        max="42"
                        step="1"
                        value={titleFontSize}
                        onChange={(e) => setTitleFontSize(Number(e.target.value))}
                        className="w-full h-2 bg-[#1e3b1c] rounded-lg appearance-none cursor-pointer accent-[#75c65b]"
                      />
                      <div className="flex justify-between text-[10px] text-[#6d8a65] mt-0.5">
                        <span>14px</span>
                        <span>22px (Padrão)</span>
                        <span>42px</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#a5c79c]">Tamanho do Subtítulo:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="8"
                            max="22"
                            value={subtitleFontSize}
                            onChange={(e) => {
                              const val = Math.max(8, Math.min(22, Number(e.target.value) || 8));
                              setSubtitleFontSize(val);
                            }}
                            className="w-14 px-1.5 py-0.5 text-right font-mono font-bold text-white bg-[#0e1d0d] border border-[#2b4d24] rounded-md text-xs focus:ring-1 focus:ring-[#75c65b]"
                          />
                          <span className="text-xs text-[#8ca87e]">px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="22"
                        step="1"
                        value={subtitleFontSize}
                        onChange={(e) => setSubtitleFontSize(Number(e.target.value))}
                        className="w-full h-2 bg-[#1e3b1c] rounded-lg appearance-none cursor-pointer accent-[#75c65b]"
                      />
                      <div className="flex justify-between text-[10px] text-[#6d8a65] mt-0.5">
                        <span>8px</span>
                        <span>11px (Padrão)</span>
                        <span>22px</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Edição dos Textos do Cabeçalho */}
              <div className="p-5 rounded-2xl bg-[#142613] border border-[#294a24] space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <Type className="w-4 h-4 text-[#75c65b]" />
                  <span>Texto Escrito do Cabeçalho</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#a5c79c] mb-1">
                      Título Principal:
                    </label>
                    <input
                      type="text"
                      value={headerTitleText}
                      onChange={(e) => setHeaderTitleText(e.target.value)}
                      placeholder="Floresta Verde"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0e1d0d] border border-[#2b4d24] text-white text-xs focus:ring-2 focus:ring-[#75c65b] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#a5c79c] mb-1">
                      Subtítulo:
                    </label>
                    <input
                      type="text"
                      value={headerSubtitleText}
                      onChange={(e) => setHeaderSubtitleText(e.target.value)}
                      placeholder="Atacado & Parcerias B2B"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0e1d0d] border border-[#2b4d24] text-white text-xs focus:ring-2 focus:ring-[#75c65b] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Trocar a Logo por Foto (Upload ou URL) */}
              <div className="p-5 rounded-2xl bg-[#142613] border border-[#294a24] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Camera className="w-4 h-4 text-[#75c65b]" />
                    <span>Trocar Logo por Foto (Arquivo ou Link)</span>
                  </div>
                  <span className="text-[10px] text-[#93b387] bg-[#1c381a] px-2 py-0.5 rounded-md border border-[#2b4c25]">
                    Recomendado: 400 × 400 px (PNG Transparente ou SVG)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#193318] border border-[#305929] flex items-center justify-center p-2 shrink-0 shadow-md">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo Oficial" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-[#8ca883] text-center leading-tight">
                        Brasão Vetorial Ativo
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => triggerUploadFor('logo')}
                        className="px-4 py-2 rounded-xl bg-[#2e5527] hover:bg-[#396930] text-white font-bold text-xs flex items-center gap-1.5 border border-[#437a38] transition-all cursor-pointer shadow-md"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carregar Foto da Logo do Computador</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl(null)}
                          className="px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-semibold border border-red-800 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Restaurar Brasão Vetorial Original</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={logoUrl || ''}
                      onChange={(e) => setLogoUrl(e.target.value.trim() || null)}
                      placeholder="Ou cole aqui a URL direta da logo (ex: https://.../logo.png)"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0e1d0d] border border-[#2b4d24] text-white text-xs placeholder-[#6e8a65] focus:ring-2 focus:ring-[#75c65b] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: HERO BANNER & TREE BACKGROUND (GUARANTEES EXACT MATCH) */}
          {/* ============================================================ */}
          {activeTab === 'heroTree' && (
            <div className="space-y-6">
              {/* Informative Guidance */}
              <div className="p-4 rounded-2xl bg-[#172c16] border border-[#2b5026] flex items-start gap-3">
                <Info className="w-5 h-5 text-[#86d46d] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-white font-bold text-xs sm:text-sm">
                    Fidelidade Visual do Banner: O que você vê aqui é exatamente o que fica no site
                  </div>
                  <div className="text-xs text-[#b8d6af] leading-relaxed">
                    • <strong>Resolução Recomendada:</strong> 1920 × 1080 px (Full HD) ou 2560 × 1440 px (2K Widescreen).<br />
                    • <strong>Compressão Automática:</strong> Qualquer foto enviada do seu computador é comprimida automaticamente para carregamento ultrarrápido sem perda de nitidez.<br />
                    • <strong>Ajuste de Claridade & Película:</strong> Controle abaixo exatamente quanto da foto é visível sob o texto para garantir harmonia perfeita.
                  </div>
                </div>
              </div>

              {/* Exact Live Preview of the Banner */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-semibold text-[#a5c79c] flex items-center gap-2">
                    <span>Pré-visualização Fiel do Banner Principal:</span>
                    <span className="text-[10px] text-[#86d46d] font-normal">
                      (Sincronização 100% idêntica à página inicial)
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#142613] border border-[#264421]">
                    <button
                      type="button"
                      onClick={() => setBannerPreviewMode('withBanner')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        bannerPreviewMode === 'withBanner'
                          ? 'bg-[#284923] text-white'
                          : 'text-[#85a87d] hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Com Textos & Película</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerPreviewMode('purePhoto')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        bannerPreviewMode === 'purePhoto'
                          ? 'bg-[#284923] text-white'
                          : 'text-[#85a87d] hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Foto Pura</span>
                    </button>
                  </div>
                </div>

                <div className="relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-[#2d4f28] shadow-2xl bg-black">
                  {/* The Background Photo with user brightness */}
                  <img
                    src={activeBannerImage}
                    alt="Banner Floresta Verde"
                    style={{
                      filter: `brightness(${bannerBrightness}%) contrast(1.05)`,
                    }}
                    className="w-full h-full object-cover object-center transition-all duration-300"
                  />

                  {/* Wind, leaves & miniature products live preview */}
                  {bannerPreviewMode === 'withBanner' && (
                    <WindBlowingLeaves showProducts={showFloatingProducts} />
                  )}

                  {/* The Overlay (when preview mode is withBanner) */}
                  {bannerPreviewMode === 'withBanner' && (
                    <div
                      style={{ opacity: bannerOverlayOpacity / 100 }}
                      className="absolute inset-0 bg-gradient-to-r from-[#0a1409] via-[#0c190a]/70 to-[#0a1409] transition-opacity duration-300 pointer-events-none"
                    />
                  )}

                  {/* Simulated Hero Content */}
                  {bannerPreviewMode === 'withBanner' && (
                    <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center max-w-xl pointer-events-none">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#182d16]/90 border border-[#375e2f] text-[#aed49b] text-[10px] font-semibold w-max mb-3">
                        <Wind className="w-3 h-3 text-[#88c96f]" />
                        <span>Fragrâncias Botânicas & Cosméticos • Direto da Fábrica</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight leading-tight">
                        Potencialize as Vendas da sua Loja com Aromas da Natureza
                      </h3>
                      <p className="text-xs text-[#cadfc5] mt-2 line-clamp-2">
                        Tabela de atacado oficial para lojistas de decoração e redes com margens brutas de até 120%.
                      </p>
                    </div>
                  )}

                  {/* Badge indicating active status */}
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-[#142312]/90 backdrop-blur-sm text-[#a5e890] px-3 py-1 rounded-full font-bold text-[10px] border border-[#3b6833] shadow-md flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-[#86d46d]" />
                      <span>{treeBgUrl ? 'Foto Personalizada Ativa' : 'Foto Padrão da Floresta'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Controls: Claridade & Contraste da Imagem no Banner */}
              <div className="p-5 rounded-2xl bg-[#142613] border border-[#294a24] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Sliders className="w-4 h-4 text-[#75c65b]" />
                    <span>Ajuste de Claridade e Contraste da Imagem no Banner</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetBannerAppearance}
                    className="text-[11px] text-[#9fcb8d] hover:text-white underline cursor-pointer"
                  >
                    Restaurar Claridade Ideal
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-[#a5c79c]">Claridade da Foto (Brilho):</span>
                      <span className="font-mono font-bold text-white bg-[#0e1d0d] px-2 py-0.5 rounded border border-[#2b4d24]">
                        {bannerBrightness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="2"
                      value={bannerBrightness}
                      onChange={(e) => setBannerBrightness(Number(e.target.value))}
                      className="w-full h-2 bg-[#1e3b1c] rounded-lg appearance-none cursor-pointer accent-[#75c65b]"
                    />
                    <div className="flex justify-between text-[10px] text-[#6d8a65] mt-0.5">
                      <span>50% (Escurecida)</span>
                      <span>85% (Recomendado)</span>
                      <span>100% (Natural Viva)</span>
                    </div>
                  </div>

                  {/* Overlay Opacity */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-[#a5c79c]">Película de Contraste para Textos:</span>
                      <span className="font-mono font-bold text-white bg-[#0e1d0d] px-2 py-0.5 rounded border border-[#2b4d24]">
                        {bannerOverlayOpacity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="2"
                      value={bannerOverlayOpacity}
                      onChange={(e) => setBannerOverlayOpacity(Number(e.target.value))}
                      className="w-full h-2 bg-[#1e3b1c] rounded-lg appearance-none cursor-pointer accent-[#75c65b]"
                    />
                    <div className="flex justify-between text-[10px] text-[#6d8a65] mt-0.5">
                      <span>10% (Foto Super Nítida)</span>
                      <span>40% (Equilíbrio Nobre)</span>
                      <span>80% (Mais Escura)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload or Direct URL */}
              <div className="p-5 rounded-2xl bg-[#142613] border border-[#294a24] space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider mb-1">
                  <Upload className="w-4 h-4 text-[#75c65b]" />
                  <span>Substituir a Imagem do Banner</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <button
                    type="button"
                    onClick={() => triggerUploadFor('heroTree')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2e5527] hover:bg-[#396930] text-white font-bold text-xs flex items-center justify-center gap-2 border border-[#437a38] transition-all cursor-pointer shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Carregar Foto do Computador (JPG, PNG, WebP)</span>
                  </button>

                  <span className="text-xs text-[#81a179]">ou cole o link direto da imagem:</span>
                </div>

                <input
                  type="text"
                  value={treeBgUrl}
                  onChange={(e) => setTreeBgUrl(e.target.value)}
                  placeholder="https://exemplo.com/sua-arvore-ventando.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1d0d] border border-[#2a4d25] text-white placeholder-[#6d8a65] focus:bg-[#132412] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                />

                {treeBgUrl && (
                  <button
                    type="button"
                    onClick={() => setTreeBgUrl('')}
                    className="text-xs text-[#ff9999] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Voltar para a foto de árvore padrão da Floresta Verde</span>
                  </button>
                )}
              </div>

              {/* 3. Miniaturas dos Produtos Flutuando com as Folhas (1 de cada modelo) */}
              <div className="p-5 rounded-2xl bg-[#142613] border border-[#294a24] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1e3c1b] border border-[#3b6635] flex items-center justify-center text-[#75c65b] shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                        <span>Miniaturas de Produtos com as Folhas</span>
                        <span className="text-[10px] text-[#86d46d] font-semibold bg-[#1e3b1c] px-2 py-0.5 rounded-full border border-[#325e2e]">
                          1 de Cada Modelo
                        </span>
                      </div>
                      <p className="text-[11px] text-[#a5c79c] mt-0.5">
                        Exibe 1 exemplar de cada modelo da fábrica voando suavemente com o vento botânico sobre o banner.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFloatingProducts(!showFloatingProducts)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
                      showFloatingProducts
                        ? 'bg-[#295424] text-white border-[#4d8c3e] shadow-md shadow-[#295424]/30'
                        : 'bg-[#182317] text-[#839e7c] border-[#293c27] hover:text-white'
                    }`}
                  >
                    {showFloatingProducts ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-[#8fe864]" />
                        <span>Miniaturas Ativadas</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-[#6e8a67]" />
                        <span>Apenas Folhas</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Grid preview of the 9 unique models passing */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-[#8ca883] mb-2.5 flex items-center justify-between">
                    <span>Modelos que passam na animação (9 modelos artesanais únicos):</span>
                    <span className="text-[10px] text-[#a6f57e]">Interativos ao passar o mouse</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                    {FLOATING_MODELS_CONFIG.map((model) => (
                      <div
                        key={model.id}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                          showFloatingProducts
                            ? 'bg-[#0f1f0e] border-[#2d5226] text-white hover:border-[#529143] hover:bg-[#142613]'
                            : 'bg-[#0e170d] border-[#1e2e1c] text-[#556950] opacity-50'
                        }`}
                        title={model.category}
                      >
                        <div className="h-14 flex items-center justify-center py-1">
                          <MiniatureProductSVG modelKey={model.modelKey} />
                        </div>
                        <span className="text-[9.5px] font-medium text-center line-clamp-2 leading-tight mt-1 text-[#d8ecd2]">
                          {model.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: PRODUCT VITRINE IMAGES */}
          {/* ============================================================ */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#172c16] border border-[#2b5026] flex items-start gap-3">
                <Info className="w-5 h-5 text-[#86d46d] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-white font-bold text-xs sm:text-sm">
                    Medidas Recomendadas para os Produtos da Vitrine:
                  </div>
                  <div className="text-xs text-[#b8d6af] leading-relaxed">
                    • <strong>Resolução Ideal:</strong> 800 × 800 px (Quadrada 1:1) ou 800 × 1000 px.<br />
                    • <strong>Fundo Recomendado:</strong> Cenários claros, toalhas de linho, madeira ou frascos em ambiente decorativo.<br />
                    • <strong>Compressão Automática:</strong> As fotos são otimizadas na hora ao serem enviadas.
                  </div>
                </div>
              </div>

              {/* Grid of Product Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* 1. Difusores */}
                <div className="p-4 rounded-2xl bg-[#142613] border border-[#2b4c25] space-y-3">
                  <div className="h-40 rounded-xl overflow-hidden bg-black/40 border border-[#2b4822] relative group">
                    <img
                      src={
                        diffusersUrl ||
                        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'
                      }
                      alt="Difusores de Ambiente"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => triggerUploadFor('diffusers')}
                        className="px-3 py-1.5 rounded-lg bg-[#274720] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Substituir</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">Difusores Canelados</span>
                    <span className="text-[11px] text-[#7fa377]">250ml & Refis 1L</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => triggerUploadFor('diffusers')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#274720] hover:bg-[#345f2c] text-white text-xs font-semibold flex items-center justify-center gap-1 border border-[#3b6631] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Alterar</span>
                    </button>
                    {diffusersUrl && (
                      <button
                        type="button"
                        onClick={() => setDiffusersUrl('')}
                        className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-900/60 cursor-pointer"
                        title="Restaurar padrão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Águas Perfumadas / Sprays */}
                <div className="p-4 rounded-2xl bg-[#142613] border border-[#2b4c25] space-y-3">
                  <div className="h-40 rounded-xl overflow-hidden bg-black/40 border border-[#2b4822] relative group">
                    <img
                      src={
                        spraysUrl ||
                        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80'
                      }
                      alt="Home Sprays"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => triggerUploadFor('sprays')}
                        className="px-3 py-1.5 rounded-lg bg-[#274720] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Substituir</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">Home Sprays & Lençóis</span>
                    <span className="text-[11px] text-[#7fa377]">500ml Gatilho Nobre</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => triggerUploadFor('sprays')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#274720] hover:bg-[#345f2c] text-white text-xs font-semibold flex items-center justify-center gap-1 border border-[#3b6631] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Alterar</span>
                    </button>
                    {spraysUrl && (
                      <button
                        type="button"
                        onClick={() => setSpraysUrl('')}
                        className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-900/60 cursor-pointer"
                        title="Restaurar padrão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Óleos Essenciais */}
                <div className="p-4 rounded-2xl bg-[#142613] border border-[#2b4c25] space-y-3">
                  <div className="h-40 rounded-xl overflow-hidden bg-black/40 border border-[#2b4822] relative group">
                    <img
                      src={
                        oilsUrl ||
                        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'
                      }
                      alt="Óleos Essenciais"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => triggerUploadFor('oils')}
                        className="px-3 py-1.5 rounded-lg bg-[#274720] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Substituir</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">Óleos Essenciais Puros</span>
                    <span className="text-[11px] text-[#7fa377]">10ml Cromatografados</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => triggerUploadFor('oils')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#274720] hover:bg-[#345f2c] text-white text-xs font-semibold flex items-center justify-center gap-1 border border-[#3b6631] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Alterar</span>
                    </button>
                    {oilsUrl && (
                      <button
                        type="button"
                        onClick={() => setOilsUrl('')}
                        className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-900/60 cursor-pointer"
                        title="Restaurar padrão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Velas Aromáticas */}
                <div className="p-4 rounded-2xl bg-[#142613] border border-[#2b4c25] space-y-3">
                  <div className="h-40 rounded-xl overflow-hidden bg-black/40 border border-[#2b4822] relative group">
                    <img
                      src={
                        candlesUrl ||
                        'https://images.unsplash.com/photo-1570823635306-250abb06d4b3?auto=format&fit=crop&w=800&q=80'
                      }
                      alt="Velas Aromáticas"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => triggerUploadFor('candles')}
                        className="px-3 py-1.5 rounded-lg bg-[#274720] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Substituir</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">Velas Vegetais de Soja</span>
                    <span className="text-[11px] text-[#7fa377]">180g Pavio de Algodão</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => triggerUploadFor('candles')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#274720] hover:bg-[#345f2c] text-white text-xs font-semibold flex items-center justify-center gap-1 border border-[#3b6631] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Alterar</span>
                    </button>
                    {candlesUrl && (
                      <button
                        type="button"
                        onClick={() => setCandlesUrl('')}
                        className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-900/60 cursor-pointer"
                        title="Restaurar padrão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 5. Linha Hotelaria & Amenities */}
                <div className="p-4 rounded-2xl bg-[#142613] border border-[#2b4c25] space-y-3">
                  <div className="h-40 rounded-xl overflow-hidden bg-black/40 border border-[#2b4822] relative group">
                    <img
                      src={
                        amenitiesUrl ||
                        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
                      }
                      alt="Hotelaria & Amenities"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => triggerUploadFor('amenities')}
                        className="px-3 py-1.5 rounded-lg bg-[#274720] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Substituir</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">Amenities & Hotelaria</span>
                    <span className="text-[11px] text-[#7fa377]">Sabonetes & Shampoos</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => triggerUploadFor('amenities')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#274720] hover:bg-[#345f2c] text-white text-xs font-semibold flex items-center justify-center gap-1 border border-[#3b6631] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Alterar</span>
                    </button>
                    {amenitiesUrl && (
                      <button
                        type="button"
                        onClick={() => setAmenitiesUrl('')}
                        className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-900/60 cursor-pointer"
                        title="Restaurar padrão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 6. Displays e Mostruários */}
                <div className="p-4 rounded-2xl bg-[#142613] border border-[#2b4c25] space-y-3">
                  <div className="h-40 rounded-xl overflow-hidden bg-black/40 border border-[#2b4822] relative group">
                    <img
                      src={
                        displaysUrl ||
                        'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80'
                      }
                      alt="Displays de Balcão"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => triggerUploadFor('displays')}
                        className="px-3 py-1.5 rounded-lg bg-[#274720] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Substituir</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">Displays de Balcão</span>
                    <span className="text-[11px] text-[#7fa377]">Madeira Reflorestada</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => triggerUploadFor('displays')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-[#274720] hover:bg-[#345f2c] text-white text-xs font-semibold flex items-center justify-center gap-1 border border-[#3b6631] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Alterar</span>
                    </button>
                    {displaysUrl && (
                      <button
                        type="button"
                        onClick={() => setDisplaysUrl('')}
                        className="p-1.5 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-900/60 cursor-pointer"
                        title="Restaurar padrão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-[#142413] border-t border-[#254221] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="text-xs text-[#9bb592] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões de Fábrica</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-[#33562a] text-xs font-bold text-[#b5cead] hover:bg-[#1a3118] transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#447233] to-[#5b9545] hover:from-[#3a622c] hover:to-[#4e803a] text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {successToast ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <span>Salvar & Aplicar Imediatamente</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
