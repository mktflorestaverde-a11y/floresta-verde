import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Droplets,
  ExternalLink,
  Flame,
  HelpCircle,
  Image as ImageIcon,
  KeyRound,
  Leaf,
  Lock,
  Menu,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Truck,
  Wind,
  X,
} from 'lucide-react';
import { LogoFlorestaVerde } from '../brand/LogoFlorestaVerde';
import { WindBlowingLeaves } from './WindBlowingLeaves';
import { Customer } from '../../types/crm';
import { crmStorage, LandingMediaSettings } from '../../services/crmStorage';

interface B2BLandingPageProps {
  onOpenEmployeeLogin: () => void;
  customLogoUrl?: string | null;
  onOpenLogoModal?: () => void;
  onOpenMediaModal?: () => void;
  isTeamMember?: boolean;
}

// Essences Catalogue Definition
interface EssenceItem {
  id: string;
  name: string;
  family: 'herbal' | 'floral' | 'citrico' | 'amadeirado';
  familyLabel: string;
  headline: string;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  intensity: number;
  bestFor: string;
  colorHex: string;
  tag: string;
  imageUrl: string;
  description: string;
}

const ESSENCE_COLLECTION: EssenceItem[] = [
  {
    id: 'alecrim-bambu',
    name: 'Alecrim Silvestre & Bambu Imperial',
    family: 'herbal',
    familyLabel: 'Herbal & Verde',
    headline: 'Frescor revigorante, clareza mental e sofisticação botânica',
    topNotes: 'Alecrim da horta, Folhas de Bambu, Limão Siciliano',
    heartNotes: 'Lírio do Vale, Eucalipto Glóbulos, Chá Branco',
    baseNotes: 'Cedro Nobre, Musgo de Carvalho, Âmbar Leve',
    intensity: 4,
    bestFor: 'Lojas de Decoração, Living Rooms, Escritórios e Recepções',
    colorHex: '#3d5c2e',
    tag: 'Campeão de Vendas',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=700&q=80',
    description:
      'Uma das fragrâncias mais aclamadas da Floresta Verde. Estimula a concentração, transmite sensação de limpeza imediata e cria uma atmosfera acolhedora e elegante.',
  },
  {
    id: 'lavanda-vanilla',
    name: 'Lavanda Francesa & Vanilla Bourbon',
    family: 'floral',
    familyLabel: 'Floral & Relaxante',
    headline: 'Conforto supremo, serenidade e toque aveludado de baunilha',
    topNotes: 'Lavanda Provençal, Bergamota, Mandarina Suave',
    heartNotes: 'Flor de Íris, Gerânio Bourbon, Alecrim Francês',
    baseNotes: 'Fava de Baunilha de Madagascar, Sândalo, Almíscar Branco',
    intensity: 3,
    bestFor: 'Quartos de Pousadas & Hotéis, Spas, Lojas de Cama & Banho',
    colorHex: '#524368',
    tag: 'Sensação de Bem-Estar',
    imageUrl: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=700&q=80',
    description:
      'Harmonia perfeita entre as propriedades calmantes da lavanda de alta altitude e a doçura amendoada da baunilha nobre. Induz ao relaxamento profundo.',
  },
  {
    id: 'capim-limao',
    name: 'Capim-Limão & Bergamota da Amazônia',
    family: 'citrico',
    familyLabel: 'Cítrico & Revigorante',
    headline: 'Energia solar, frescor cítrico vibrante e notas terapêuticas',
    topNotes: 'Capim-Santo Fresco, Cascas de Bergamota, Verbena',
    heartNotes: 'Gengibre Suave, Jasmim d’Água, Flor de Laranjeira',
    baseNotes: 'Vetiver Terroso, Madeira de Guaiaco, Cedro',
    intensity: 5,
    bestFor: 'Empórios Naturais, Lavabos de Alto Padrão, Clínicas e Espaços Gourmet',
    colorHex: '#60731f',
    tag: 'Aroma Estimulante',
    imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80',
    description:
      'Explosão cítrica marcante com propriedades revigorantes naturais. Neutraliza odores e transforma qualquer espaço em um refúgio luminoso e acolhedor.',
  },
  {
    id: 'flor-cerejeira',
    name: 'Flor de Cerejeira & Pimenta Rosa',
    family: 'floral',
    familyLabel: 'Floral Sofisticado',
    headline: 'Feminilidade requintada, doçura sutil e sensualidade moderna',
    topNotes: 'Pimenta Rosa em Grãos, Frutas Vermelhas, Bergamota',
    heartNotes: 'Pétalas de Cerejeira Japonesa, Peônia Rosa, Rosa Damascena',
    baseNotes: 'Patchouli Suave, Âmbar Dourado, Baunilha Cremosa',
    intensity: 4,
    bestFor: 'Boutiques Femininas, Estética & Harmonização, Salões Conceito',
    colorHex: '#7d4554',
    tag: 'Elegância Marcante',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=700&q=80',
    description:
      'Uma fragrância floral contemporânea e envolvente. Cria um ambiente sofisticado e sedutor, com altíssimo apelo visual e olfativo no ponto de venda.',
  },
  {
    id: 'pitanga-cedro',
    name: 'Pitanga Negra & Cedro da Mata Atlântica',
    family: 'amadeirado',
    familyLabel: 'Amadeirado & Exótico',
    headline: 'Identidade brasileira, sofisticação amadeirada e notas frutadas',
    topNotes: 'Pitanga Madura, Groselha Selvagem, Folhas de Figo',
    heartNotes: 'Cassis, Orquídea Silvestre, Cravo da Índia',
    baseNotes: 'Cedro Vermelho, Musgo da Floresta, Âmbar Negro',
    intensity: 4,
    bestFor: 'Hotéis Boutique, Lojas de Móveis Planejados, Barbearias Premium',
    colorHex: '#523422',
    tag: 'Exclusividade Botânica',
    imageUrl: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=700&q=80',
    description:
      'O calor e a nobreza das matas brasileiras em uma combinação única e inesquecível. Proporciona imponência e sensação acolhedora inigualável.',
  },
  {
    id: 'eucalipto-menta',
    name: 'Eucalipto Glóbulos & Menta Piperita',
    family: 'herbal',
    familyLabel: 'Herbal & Terapêutico',
    headline: 'Purificação do ar, respiração plena e spa botânico em casa',
    topNotes: 'Eucalipto Puro, Hortelã Menta, Pinho Silvestre',
    heartNotes: 'Tomilho Branco, Chá Verde, Lavandim',
    baseNotes: 'Madeiras Claras, Almíscar Puro, Vetiver',
    intensity: 5,
    bestFor: 'Studios de Yoga & Pilates, Spas Terapêuticos, Academias Premium',
    colorHex: '#274b3d',
    tag: 'Grau Farmacêutico',
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=80',
    description:
      'Elaborado com óleos essenciais destilados por arraste a vapor. Abre as vias respiratórias, refresca a temperatura percebida e dissipa o estresse cotidiano.',
  },
];

export const B2BLandingPage: React.FC<B2BLandingPageProps> = ({
  onOpenEmployeeLogin,
  customLogoUrl,
  onOpenLogoModal,
  onOpenMediaModal,
  isTeamMember = false,
}) => {
  // Landing media state from CRM Storage
  const [landingMedia, setLandingMedia] = useState<LandingMediaSettings>(() =>
    crmStorage.getLandingMedia()
  );

  useEffect(() => {
    const handleStorageChange = (e?: Event) => {
      const customEvt = e as CustomEvent<LandingMediaSettings> | undefined;
      if (customEvt && customEvt.detail) {
        setLandingMedia((prev) => ({ ...prev, ...customEvt.detail }));
      } else {
        setLandingMedia(crmStorage.getLandingMedia());
      }
    };
    window.addEventListener('floresta_verde_crm_changed', handleStorageChange);
    return () => window.removeEventListener('floresta_verde_crm_changed', handleStorageChange);
  }, []);

  // Manual dimensions for Logo and Header Typography (controlled exclusively by team members)
  const logoWidth = landingMedia.logoWidth || 44;
  const logoHeight = landingMedia.logoHeight || 50;
  const titleFontSize = landingMedia.titleFontSize || 22;
  const subtitleFontSize = landingMedia.subtitleFontSize || 11;
  const headerTitleText = landingMedia.headerTitleText || 'Floresta Verde';
  const headerSubtitleText = landingMedia.headerSubtitleText || 'Atacado & Parcerias B2B';
  const bannerBrightness = landingMedia.bannerBrightness !== undefined ? landingMedia.bannerBrightness : 85;
  const bannerOverlayOpacity = landingMedia.bannerOverlayOpacity !== undefined ? landingMedia.bannerOverlayOpacity : 40;
  const showFloatingProducts = landingMedia.showFloatingProducts !== false;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Selected essence filter
  const [selectedFamily, setSelectedFamily] = useState<string>('all');

  // Profit Simulator State
  const [simulatedWholesale, setSimulatedWholesale] = useState<number>(1500);

  // Form State - Matches 100% Internal CRM Customer Registration Fields
  const [name, setName] = useState(''); // Razão Social / Nome da Empresa
  const [tradeName, setTradeName] = useState(''); // Nome Fantasia
  const [document, setDocument] = useState(''); // CNPJ / CPF
  const [contactPerson, setContactPerson] = useState(''); // Responsável / Comprador
  const [email, setEmail] = useState(''); // E-mail Comercial
  const [phone, setPhone] = useState(''); // Telefone
  const [whatsapp, setWhatsapp] = useState(''); // WhatsApp
  const [cityState, setCityState] = useState(''); // Cidade / UF
  const [businessType, setBusinessType] = useState('Loja de Decoração & Móveis');
  const [productInterest, setProductInterest] = useState('Difusores de Ambiente & Refis 1L');
  const [customCycleDays, setCustomCycleDays] = useState('45'); // Ciclo médio estimado
  const [notes, setNotes] = useState(''); // Observações do ponto de venda

  // Submit Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdCustomerId, setCreatedCustomerId] = useState('');
  const [submittedLeadName, setSubmittedLeadName] = useState('');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Phone Formatter helper
  const handlePhoneChange = (val: string, setter: (v: string) => void) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) {
      setter(raw ? `(${raw}` : '');
    } else if (raw.length <= 7) {
      setter(`(${raw.slice(0, 2)}) ${raw.slice(2)}`);
    } else {
      setter(`(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`);
    }
  };

  // CNPJ Formatter helper
  const handleCnpjChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 14);
    if (raw.length <= 2) setDocument(raw);
    else if (raw.length <= 5) setDocument(`${raw.slice(0, 2)}.${raw.slice(2)}`);
    else if (raw.length <= 8) setDocument(`${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`);
    else if (raw.length <= 12)
      setDocument(`${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`);
    else
      setDocument(
        `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`
      );
  };

  // Filtered Essences
  const filteredEssences = useMemo(() => {
    if (selectedFamily === 'all') return ESSENCE_COLLECTION;
    return ESSENCE_COLLECTION.filter((item) => item.family === selectedFamily);
  }, [selectedFamily]);

  // Wholesale Calculations for simulator
  const simulatedRetail = Math.round(simulatedWholesale * 2.2); // ~120% markup
  const simulatedProfit = simulatedRetail - simulatedWholesale;
  const estimatedUnits = Math.round(simulatedWholesale / 38);

  // Automatic Submission directly registering a new B2B customer in the CRM
  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !contactPerson.trim() || !email.trim() || !phone.trim()) {
      alert('Por favor, preencha os campos obrigatórios (Razão Social, Responsável, E-mail e Telefone).');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create comprehensive Customer matching 100% internal CRM structure
      const newCustomerData: Omit<Customer, 'id' | 'createdAt'> = {
        name: name.trim(),
        tradeName: tradeName.trim() || undefined,
        segment: 'b2b',
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        document: document.trim() || undefined,
        contactPerson: contactPerson.trim(),
        channelOrigin: 'Landing Page B2B',
        funnelStage: 'novos_contatos',
        assignedTo: 'Equipe Comercial B2B',
        customCycleDays: customCycleDays ? Number(customCycleDays) : 45,
        notes: `[Cadastro Via Landing Page B2B] Cidade/UF: ${cityState || 'Não informada'} | Segmento: ${businessType} | Linha de Interesse: ${productInterest}${
          notes.trim() ? ` | Observações: ${notes.trim()}` : ''
        }`,
      };

      const saved = crmStorage.addCustomer(newCustomerData);
      setCreatedCustomerId(saved.id);
      setSubmittedLeadName(saved.name);
      setIsSubmitted(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Erro ao cadastrar novo cliente B2B no CRM:', err);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const scrollToFormWithInterest = (interest: string) => {
    setProductInterest(interest);
    const formEl = window.document.getElementById('formulario-b2b');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Product Showcase definition for upper awareness section
  const productShowcase = [
    {
      title: 'Difusores Canelados 250ml & Refis 1L',
      category: 'Líder em Recompra',
      margin: '110% de Margem',
      desc: 'Vidro canelado pesado com varetas de fibra negra para difusão contínua 360° no ambiente.',
      imageUrl:
        landingMedia.productDiffusersUrl ||
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
      badge: 'Campeão de Vendas',
    },
    {
      title: 'Home Sprays de Ambiente 500ml',
      category: 'Uso Imediato',
      margin: '95% de Margem',
      desc: 'Água perfumada com gatilho ergonômico importado. Não mancha tecidos e perfuma na hora.',
      imageUrl:
        landingMedia.productSpraysUrl ||
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
      badge: 'Névoa Ultrafina',
    },
    {
      title: 'Óleos Essenciais 100% Puros 10ml',
      category: 'Aromaterapia Terapêutica',
      margin: '120% de Margem',
      desc: 'Frasco âmbar UV com laudo cromatográfico para difusores elétricos e uso profissional.',
      imageUrl:
        landingMedia.productOilsUrl ||
        'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80',
      badge: 'Laudo Farmacêutico',
    },
    {
      title: 'Velas em Cera de Coco & Pavio de Madeira',
      category: 'Sensorial & Luxo',
      margin: '115% de Margem',
      desc: 'Cera 100% vegetal sem parafina fóssil. Pavio que estala suavemente como lareira ao queimar.',
      imageUrl:
        landingMedia.productCandlesUrl ||
        'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80',
      badge: 'Queima Limpa',
    },
    {
      title: 'Amenities & Cosméticos Botânicos 5L',
      category: 'Hotelaria & Spas',
      margin: 'Preço Direto da Fábrica',
      desc: 'Sabonetes vegetais perolados, shampoos biodegradáveis e dispensers para suítes de luxo.',
      imageUrl:
        landingMedia.productAmenitiesUrl ||
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      badge: 'Hotelaria de Charme',
    },
    {
      title: 'Displays de Balcão em Madeira Nobre',
      category: 'Ponto de Venda',
      margin: 'Bonificado',
      desc: 'Expositor gratuito em madeira tratada de reflorestamento com réguas olfativas e provadores.',
      imageUrl:
        landingMedia.productDisplaysUrl ||
        'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80',
      badge: 'Brinde Bonificado',
    },
  ];

  const faqs = [
    {
      q: 'Qual é o pedido mínimo para compras no atacado?',
      a: 'O pedido mínimo para faturamento B2B da Floresta Verde é de apenas R$ 500,00 sortido em qualquer linha de produtos. Isso possibilita que lojistas e revendas comecem com investimento acessível e rápida rotação no balcão.',
    },
    {
      q: 'É obrigatório ter CNPJ para revender os produtos?',
      a: 'Trabalhamos tanto com empresas com CNPJ ativo (Lojas de Decoração, Pousadas, Hotéis, Spas, Farmácias, Boutiques) quanto com revendedores autônomos qualificados com CPF cadastrado.',
    },
    {
      q: 'Quais são as condições comerciais e formas de faturamento corporativo?',
      a: 'Disponibilizamos condições comerciais personalizadas para cada perfil empresarial. Para o CNPJ da sua empresa, oferecemos faturamento corporativo programado após rápida análise cadastral, além de condições especiais com desconto para pagamentos à vista via PIX e parcelamento no cartão corporativo.',
    },
    {
      q: 'Vocês fornecem mostruários, displays e provadores para a loja?',
      a: 'Sim! Em pedidos qualificados de atacado disponibilizamos displays elegantes produzidos em madeira maciça de reflorestamento, réguas olfativas e frascos provadores bonificados para impulsionar a experiência sensorial no seu balcão.',
    },
    {
      q: 'Qual é a margem de lucro sugerida para revenda?',
      a: 'Nossa tabela de preços de atacado foi desenvolvida para assegurar margens brutas entre 80% e 120% para a sua loja física ou e-commerce, proporcionando uma das melhores rentabilidades do mercado de bem-estar.',
    },
    {
      q: 'Qual é o prazo de despacho e entrega dos pedidos?',
      a: 'Mantemos estoque permanente de todas as fragrâncias e insumos. O despacho é realizado em até 48 horas úteis após confirmação do pedido, via transportadoras parceiras rastreadas para todo o território nacional.',
    },
  ];

  const heroBackgroundUrl =
    landingMedia.treeBgUrl ||
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2000&q=85';

  return (
    <div className="min-h-screen bg-[#0d170c] text-[#e8eee4] font-sans selection:bg-[#3d5a2d] selection:text-[#f3faef] relative overflow-x-hidden">
      {/* Top Banner Notice: Atacado Oficial Floresta Verde */}
      <div className="bg-gradient-to-r from-[#172b15] via-[#244221] to-[#172b15] text-[#d6e9cb] px-4 py-2.5 text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2 border-b border-[#2d4e28]/60 shadow-inner relative z-30">
        <Sparkles className="w-3.5 h-3.5 text-[#95d779] shrink-0 animate-pulse" />
        <span className="font-semibold text-white">Catálogo B2B 2026 Liberado:</span>
        <span className="hidden sm:inline">Margens de até 120% e Displays de Balcão Bonificados para Lojistas</span>
        <span className="hidden md:inline text-white/30">•</span>
        <a
          href="#formulario-b2b"
          className="underline underline-offset-2 hover:text-white font-bold transition-colors text-[#b5e89b]"
        >
          Cadastrar Empresa e Receber Tabela de Atacado →
        </a>
      </div>

      {/* Main Navbar with Perfect Crisp Logo (Synchronized with Modal and Mobile Optimized) */}
      <header className="sticky top-0 z-40 bg-[#0d170c]/95 backdrop-blur-md border-b border-[#263c22] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo & Brand Identity (Clean, Crisp, With Custom Sizing, Never Squeezed) */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Desktop / Tablet Sizing */}
            <div className="hidden sm:block shrink-0">
              <LogoFlorestaVerde
                width={logoWidth}
                height={logoHeight}
                variant="compact"
                customLogoUrl={customLogoUrl}
                onOpenUploadModal={isTeamMember ? onOpenMediaModal || onOpenLogoModal : undefined}
                showUploadTrigger={false}
              />
            </div>
            {/* Mobile Adaptive Sizing (Harmonious scale on small screens) */}
            <div className="sm:hidden shrink-0">
              <LogoFlorestaVerde
                width={Math.min(logoWidth, 48)}
                height={Math.round((Math.min(logoWidth, 48) / Math.max(logoWidth, 1)) * logoHeight)}
                variant="compact"
                customLogoUrl={customLogoUrl}
                onOpenUploadModal={isTeamMember ? onOpenMediaModal || onOpenLogoModal : undefined}
                showUploadTrigger={false}
              />
            </div>

            <div className="flex flex-col text-left shrink-0 whitespace-nowrap">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  style={{ fontSize: `${titleFontSize}px` }}
                  className="font-serif font-bold tracking-tight text-white leading-none whitespace-nowrap hidden sm:inline"
                >
                  {headerTitleText}
                </span>
                <span
                  style={{ fontSize: `${Math.min(titleFontSize, 18)}px` }}
                  className="font-serif font-bold tracking-tight text-white leading-none whitespace-nowrap sm:hidden"
                >
                  {headerTitleText}
                </span>
                <span className="text-[9px] font-bold text-[#86bf6c] border border-[#3b662e] px-1 rounded-sm leading-none py-0.5 shrink-0">
                  ®
                </span>
              </div>
              <span
                style={{ fontSize: `${subtitleFontSize}px` }}
                className="font-semibold text-[#8ca87e] tracking-widest uppercase mt-1 whitespace-nowrap hidden sm:block"
              >
                {headerSubtitleText}
              </span>
              <span
                style={{ fontSize: `${Math.min(subtitleFontSize, 9.5)}px` }}
                className="font-semibold text-[#8ca87e] tracking-widest uppercase mt-0.5 whitespace-nowrap sm:hidden"
              >
                {headerSubtitleText}
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop Wide XL+) */}
          <nav className="hidden xl:flex items-center gap-5 2xl:gap-7 text-xs font-semibold uppercase tracking-wider text-[#a9c29b]">
            <a href="#vitrine-produtos" className="hover:text-white transition-colors">
              Vitrine de Produtos
            </a>
            <a href="#essencias" className="hover:text-white transition-colors">
              Guia Olfativo
            </a>
            <a href="#simulador" className="hover:text-white transition-colors">
              Calculadora de Lucro
            </a>
            <a href="#diferenciais" className="hover:text-white transition-colors">
              Diferenciais B2B
            </a>
            <a href="#depoimentos" className="hover:text-white transition-colors">
              Quem Revende
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              Dúvidas
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Customization button: ONLY visible to authenticated team members */}
            {isTeamMember && onOpenMediaModal && (
              <button
                type="button"
                onClick={onOpenMediaModal}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#142312] border border-[#2d4927] text-xs font-medium text-[#c0d8b4] hover:text-white hover:bg-[#1a2f18] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                title="Ajustar manualmente o tamanho da logo, da escrita e imagens (Exclusivo da equipe)"
              >
                <Sliders className="w-3.5 h-3.5 text-[#82b470]" />
                <span>Ajustar Logo & Mídias</span>
              </button>
            )}

            <a
              href="#formulario-b2b"
              className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#3d652f] to-[#518240] hover:from-[#345828] hover:to-[#457235] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-[0_4px_16px_rgba(61,101,47,0.35)] transition-all whitespace-nowrap"
            >
              <span className="hidden sm:inline">Cadastrar Minha Loja</span>
              <span className="sm:hidden">Revender</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            {/* Quick access to employee login */}
            <button
              type="button"
              onClick={onOpenEmployeeLogin}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#142312] border border-[#2d4927] text-xs font-medium text-[#c0d8b4] hover:text-white hover:bg-[#1a2f18] transition-all whitespace-nowrap"
              title="Acesso exclusivo para colaboradores internos da Floresta Verde"
            >
              <Lock className="w-3.5 h-3.5 text-[#82b470]" />
              <span>Área da Equipe</span>
            </button>

            {/* Mobile & Tablet Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-[#142312] border border-[#284422] text-[#b8d6af] hover:text-white hover:bg-[#1a2f18] transition-colors"
              aria-label={isMobileMenuOpen ? 'Fechar Menu' : 'Abrir Menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden border-t border-[#233a20] bg-[#0c160b]/98 backdrop-blur-xl px-4 py-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2.5 text-sm font-semibold uppercase tracking-wider text-[#b8d4ab]">
              <a
                href="#vitrine-produtos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[#192b17] hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Vitrine de Produtos</span>
                <ArrowRight className="w-4 h-4 text-[#6e9960]" />
              </a>
              <a
                href="#essencias"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[#192b17] hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Guia Olfativo</span>
                <ArrowRight className="w-4 h-4 text-[#6e9960]" />
              </a>
              <a
                href="#simulador"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[#192b17] hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Calculadora de Lucro</span>
                <ArrowRight className="w-4 h-4 text-[#6e9960]" />
              </a>
              <a
                href="#diferenciais"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[#192b17] hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Diferenciais B2B</span>
                <ArrowRight className="w-4 h-4 text-[#6e9960]" />
              </a>
              <a
                href="#depoimentos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[#192b17] hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Quem Revende</span>
                <ArrowRight className="w-4 h-4 text-[#6e9960]" />
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl hover:bg-[#192b17] hover:text-white transition-colors flex items-center justify-between"
              >
                <span>Dúvidas Frequentes</span>
                <ArrowRight className="w-4 h-4 text-[#6e9960]" />
              </a>
            </nav>

            <div className="pt-2 border-t border-[#1f361c] flex flex-col gap-2.5">
              <a
                href="#formulario-b2b"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3d652f] to-[#518240] text-white text-center font-bold text-sm shadow-md"
              >
                Cadastrar Minha Loja (Atacado)
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenEmployeeLogin();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#142312] border border-[#2d4927] text-xs font-semibold text-[#c0d8b4] flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-[#82b470]" />
                  <span>Área da Equipe</span>
                </button>

                {isTeamMember && onOpenMediaModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenMediaModal();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#1c331a] border border-[#396632] text-xs font-semibold text-[#a5e890] flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#8fe864]" />
                    <span>Ajustar Logo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION WITH WIND ANIMATION & TREE BACKGROUND */}
      <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 overflow-hidden border-b border-[#233b20]">
        {/* Animated Wind, Flying Green Leaves & Miniature Products Passing */}
        <WindBlowingLeaves showProducts={showFloatingProducts} />

        {/* Majestic Tree Background with Wind Atmosphere - Matches Edit Platform Exactly */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBackgroundUrl}
            alt="Árvore Majestosa Ventando Floresta Verde"
            className="w-full h-full object-cover object-center transition-all duration-700"
            style={{
              filter: `brightness(${bannerBrightness}%) contrast(1.05)`,
            }}
          />
          {/* Ethereal Gradient Overlay calibrated for exact match */}
          <div
            style={{ opacity: bannerOverlayOpacity / 100 }}
            className="absolute inset-0 bg-gradient-to-r from-[#0a1409] via-[#0c190a]/70 to-[#0a1409] transition-opacity duration-500 pointer-events-none"
          />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0d170c] to-transparent pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left pt-2">
              {/* Luxury Seal Pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#182d16]/90 border border-[#375e2f] text-[#aed49b] text-xs font-semibold shadow-lg backdrop-blur-sm">
                <Wind className="w-3.5 h-3.5 text-[#88c96f]" />
                <span className="tracking-wide">Fragrâncias Botânicas & Cosméticos de Ambiente</span>
                <span className="text-[#4e8241]">•</span>
                <span className="text-white font-bold">Direto da Fábrica</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-serif font-bold text-white tracking-tight leading-[1.12]">
                Transforme sua loja com os{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a1d989] via-[#d0f0bd] to-[#7fba67] italic">
                  aromas botânicos
                </span>{' '}
                mais desejados e lucrativos do Brasil.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#b8ccb1] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Difusores de alta fixação, home sprays, óleos essenciais 100% puros e amenities requintadas. Fórmulas
                nobres com extratos vegetais que encantam o olfato, fidelizam clientes e garantem recompra contínua.
              </p>

              {/* 4 Core B2B Metrics Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-left">
                <div className="bg-[#122211]/90 border border-[#2b4b25] p-3.5 rounded-2xl shadow-md backdrop-blur-sm">
                  <div className="text-[#a4e08c] font-bold text-xl sm:text-2xl font-serif">Até 120%</div>
                  <div className="text-[11px] text-[#9bb392] font-semibold leading-tight mt-0.5">
                    Margem bruta no balcão
                  </div>
                </div>

                <div className="bg-[#122211]/90 border border-[#2b4b25] p-3.5 rounded-2xl shadow-md backdrop-blur-sm">
                  <div className="text-[#a4e08c] font-bold text-xl sm:text-2xl font-serif">R$ 500</div>
                  <div className="text-[11px] text-[#9bb392] font-semibold leading-tight mt-0.5">
                    Pedido inicial acessível
                  </div>
                </div>

                <div className="bg-[#122211]/90 border border-[#2b4b25] p-3.5 rounded-2xl shadow-md backdrop-blur-sm">
                  <div className="text-[#a4e08c] font-bold text-xl sm:text-2xl font-serif">48 horas</div>
                  <div className="text-[11px] text-[#9bb392] font-semibold leading-tight mt-0.5">
                    Despacho rápido em estoque
                  </div>
                </div>

                <div className="bg-[#122211]/90 border border-[#2b4b25] p-3.5 rounded-2xl shadow-md backdrop-blur-sm">
                  <div className="text-[#a4e08c] font-bold text-xl sm:text-2xl font-serif">100% Puro</div>
                  <div className="text-[11px] text-[#9bb392] font-semibold leading-tight mt-0.5">
                    Laudo cromatográfico real
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-3">
                <a
                  href="#formulario-b2b"
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-[#447034] to-[#5b9545] hover:from-[#3a602c] hover:to-[#4e803b] text-white font-bold text-sm shadow-[0_8px_24px_rgba(68,112,52,0.4)] hover:shadow-[0_12px_32px_rgba(68,112,52,0.55)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Cadastrar Empresa & Receber Catálogo com Preços</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                <a
                  href="#vitrine-produtos"
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#142613]/90 border border-[#385e30] hover:bg-[#1c351b] text-[#e0eed9] font-semibold text-sm transition-all flex items-center justify-center gap-2.5 shadow-md backdrop-blur-sm"
                >
                  <Package className="w-4 h-4 text-[#75c65b]" />
                  <span>Explorar Produtos em Destaque</span>
                </a>
              </div>
            </div>

            {/* Right: Comprehensive CRM Registration Form (Matches Internal Customer Schema) */}
            <div className="lg:col-span-5" id="formulario-b2b">
              <div className="bg-[#122211]/95 rounded-3xl p-6 sm:p-7 border border-[#2d5027] shadow-[0_20px_60px_rgba(0,0,0,0.55)] relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-36 h-36 bg-[#2a4d23]/30 rounded-bl-full -z-0 blur-xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#75c65b] animate-ping" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#a1d989]">
                        Cadastro Oficial B2B
                      </span>
                    </div>
                    <span className="text-[11px] text-[#93b387] bg-[#1a3419] px-2.5 py-1 rounded-full border border-[#2d5229]">
                      Registro Direto no CRM
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                    Cadastre sua Empresa
                  </h2>
                  <p className="text-xs sm:text-sm text-[#b0cca7] mt-1 mb-4">
                    Preencha as informações cadastrais para ativação da conta corporativa e liberação imediata das
                    tabelas de atacado da Floresta Verde.
                  </p>

                  {isSubmitted ? (
                    <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="w-16 h-16 bg-[#1a3818] text-[#71cb56] rounded-full mx-auto flex items-center justify-center border border-[#32612d] shadow-lg">
                        <CheckCircle className="w-9 h-9" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Empresa Cadastrada no CRM!</h3>
                      <p className="text-xs sm:text-sm text-[#b5cead] leading-relaxed">
                        Excelente! O cadastro comercial da empresa <strong className="text-white">"{submittedLeadName}"</strong>{' '}
                        foi inserido com sucesso na base oficial da Floresta Verde.
                      </p>

                      <div className="p-4 rounded-2xl bg-[#162c14] border border-[#2a5026] text-left text-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">Protocolo Comercial:</span>
                          <span className="font-mono text-[#a5e890] font-bold bg-[#0d180c] px-2.5 py-1 rounded-lg border border-[#294a24]">
                            FV-{createdCustomerId ? createdCustomerId.replace('cust-', '').slice(-6).toUpperCase() : 'B2B-OK'}
                          </span>
                        </div>
                        <div className="font-semibold text-white flex items-center gap-1.5 pt-1">
                          <CheckCircle2 className="w-4 h-4 text-[#75c65b]" />
                          <span>Fila de Atendimento B2B Ativada</span>
                        </div>
                        <p className="text-[#a5c49b] leading-relaxed">
                          Nossa equipe comercial já recebeu os dados completos e iniciará o contato via telefone/e-mail
                          para apresentar o catálogo, agendar o envio de mostruários e habilitar suas condições com margem
                          de até 120%.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSubmitted(false);
                            setName('');
                            setTradeName('');
                            setDocument('');
                            setContactPerson('');
                            setEmail('');
                            setPhone('');
                            setWhatsapp('');
                            setNotes('');
                          }}
                          className="text-xs text-[#9bb592] hover:text-white underline py-1 transition-colors"
                        >
                          Cadastrar outra filial ou nova empresa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitLead} className="space-y-3 text-left">
                      {/* Name / Razão Social */}
                      <div>
                        <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                          Razão Social ou Nome Empresarial <span className="text-[#ff7878]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Essências & Décor Brasil Ltda"
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white placeholder-[#78966e] focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b] focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Trade Name & CNPJ */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            Nome Fantasia da Loja
                          </label>
                          <input
                            type="text"
                            value={tradeName}
                            onChange={(e) => setTradeName(e.target.value)}
                            placeholder="Ex: Aroma & Casa"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white placeholder-[#78966e] focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            CNPJ ou CPF <span className="text-[#ff7878]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={document}
                            onChange={(e) => handleCnpjChange(e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white placeholder-[#78966e] focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          />
                        </div>
                      </div>

                      {/* Contact Person & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            Responsável / Comprador <span className="text-[#ff7878]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                            placeholder="Seu nome completo"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white placeholder-[#78966e] focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            E-mail Corporativo <span className="text-[#ff7878]">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="compras@sualoja.com.br"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white placeholder-[#78966e] focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          />
                        </div>
                      </div>

                      {/* Phone & WhatsApp */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            Telefone Comercial <span className="text-[#ff7878]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value, setPhone)}
                            placeholder="(11) 3456-7890"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white placeholder-[#78966e] focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            WhatsApp Comercial <span className="text-[#ff7878]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={whatsapp}
                            onChange={(e) => handlePhoneChange(e.target.value, setWhatsapp)}
                            placeholder="(11) 98765-4321"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white placeholder-[#78966e] focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          />
                        </div>
                      </div>

                      {/* City/State & Business Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            Cidade e Estado (UF) <span className="text-[#ff7878]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={cityState}
                            onChange={(e) => setCityState(e.target.value)}
                            placeholder="Ex: São Paulo / SP"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white placeholder-[#78966e] focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            Segmento de Atuação
                          </label>
                          <select
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          >
                            <option value="Loja de Decoração & Móveis">Loja de Decoração & Móveis</option>
                            <option value="Hotel / Pousada / Resort">Hotel / Pousada / Resort</option>
                            <option value="Spa / Clínica / Aromaterapia">Spa / Clínica / Aromaterapia</option>
                            <option value="Empório / Produtos Naturais">Empório / Produtos Naturais</option>
                            <option value="Loja de Presentes & Floricultura">Loja de Presentes & Floricultura</option>
                            <option value="Boutique de Moda & Acessórios">Boutique de Moda & Acessórios</option>
                            <option value="Revendedor Autônomo">Revendedor Autônomo</option>
                            <option value="Outro Modelo">Outro Modelo</option>
                          </select>
                        </div>
                      </div>

                      {/* Product Interest & Cycle */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            Linha de Maior Interesse
                          </label>
                          <select
                            value={productInterest}
                            onChange={(e) => setProductInterest(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          >
                            <option value="Difusores de Ambiente & Refis 1L">
                              Difusores de Varetas & Refis 1L
                            </option>
                            <option value="Home Sprays & Águas Perfumadas">
                              Home Sprays & Águas de Lençol
                            </option>
                            <option value="Óleos Essenciais Puros & Nebulizadores">
                              Óleos Essenciais 100% Puros
                            </option>
                            <option value="Amenities para Hotelaria & Suítes">
                              Amenities para Hotelaria (5L)
                            </option>
                            <option value="Velas Aromáticas Vegetais">Velas em Cera de Coco</option>
                            <option value="Mix Completo para Revenda">Mix Completo de Todas as Linhas</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                            Estimativa de Recompra
                          </label>
                          <select
                            value={customCycleDays}
                            onChange={(e) => setCustomCycleDays(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                          >
                            <option value="30">Mensal (~30 dias)</option>
                            <option value="45">Bimestral (~45 dias)</option>
                            <option value="60">Trimestral (~60 dias)</option>
                            <option value="90">Sazonal / Sob Demanda</option>
                          </select>
                        </div>
                      </div>

                      {/* Observations Notes */}
                      <div>
                        <label className="block text-xs font-semibold text-[#d0e5c9] mb-1">
                          Observações & Necessidades da sua Loja (opcional)
                        </label>
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ex: Temos 2 lojas físicas em shopping, interesse em display de balcão e linhas com lavanda e alecrim."
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#2d4d27] bg-[#162914] text-white placeholder-[#78966e] focus:bg-[#1c3519] focus:outline-none focus:ring-2 focus:ring-[#75c65b]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#447233] to-[#5b9545] hover:from-[#3a622c] hover:to-[#4e803a] text-white text-sm font-bold tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Finalizar Cadastro da Empresa & Liberar Catálogo</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-center text-[#8ca882] pt-1">
                        🔒 Dados protegidos e integrados em tempo real com a gestão comercial B2B.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UPPER SHOWCASE: FOTOS DOS PRODUTOS DA FLORESTA VERDE (CONSCIÊNCIA DO PRODUTO) */}
      {/* Requirement: "e preciso de uma parte no superior com fotos dos produtos da floresta verde também, para gerar consciencia do produto" */}
      <section id="vitrine-produtos" className="py-16 bg-[#0a1309] border-b border-[#1d351b] relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#162b14] border border-[#2f552a] text-[#8fe070] text-xs font-bold uppercase tracking-wider mb-2.5">
              <Package className="w-3.5 h-3.5 text-[#73c759]" />
              <span>Consciência de Linhas • Vitrine de Produtos Floresta Verde</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Design Botânico de Luxo para Encantar seu Cliente
            </h2>
            <p className="text-xs sm:text-sm text-[#a8c49e] mt-2">
              Clique em qualquer produto para selecioná-lo automaticamente no formulário e solicitar mostruários bonificados.
            </p>
          </div>

          {/* Product Awareness Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productShowcase.map((prod, idx) => (
              <div
                key={idx}
                onClick={() => scrollToFormWithInterest(prod.title)}
                className="bg-[#112110] rounded-2xl overflow-hidden border border-[#254222] hover:border-[#4d863f] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group cursor-pointer"
                title="Clique para selecionar este produto no formulário de atacado"
              >
                {/* Photo with Badge & Gradient */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={prod.imageUrl}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#112110] via-transparent to-black/25" />

                  <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#112110]/90 backdrop-blur-md text-[10px] font-bold text-[#b5e79f] border border-[#30592b]">
                    {prod.badge}
                  </span>

                  <span className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-[#3c6630] text-[10px] font-bold text-white shadow-md">
                    {prod.margin}
                  </span>

                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#98ce82]">
                      {prod.category}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-white leading-tight">
                      {prod.title}
                    </h3>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-[#a9c29f] leading-relaxed">
                    {prod.desc}
                  </p>

                  <div className="pt-2 border-t border-[#1e381b] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#8ca882]">Pronta entrega em estoque</span>
                    <span className="text-xs font-bold text-[#8ee866] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>Selecionar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: BRAND SEALS */}
      <section className="py-8 bg-[#091108] border-b border-[#1b3117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-xl bg-[#142613] text-[#71cb56] flex items-center justify-center shrink-0 border border-[#2b4c25]">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Extratos 100% Puros</div>
                <div className="text-[11px] text-[#86a27e]">Origem vegetal sustentável</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-xl bg-[#142613] text-[#71cb56] flex items-center justify-center shrink-0 border border-[#2b4c25]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Laudo Cromatográfico</div>
                <div className="text-[11px] text-[#86a27e]">Pureza testada em laboratório</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-xl bg-[#142613] text-[#71cb56] flex items-center justify-center shrink-0 border border-[#2b4c25]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Alta Fixação Olfativa</div>
                <div className="text-[11px] text-[#86a27e]">Difusão equilibrada contínua</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-xl bg-[#142613] text-[#71cb56] flex items-center justify-center shrink-0 border border-[#2b4c25]">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Displays para sua Loja</div>
                <div className="text-[11px] text-[#86a27e]">Mostruário e provador grátis</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-[#142613] text-[#71cb56] flex items-center justify-center shrink-0 border border-[#2b4c25]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Pronta Entrega Brasil</div>
                <div className="text-[11px] text-[#86a27e]">Despacho seguro em 48h</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: ICONIC ESSENCE & OLFACTORY PYRAMID EXPLORER */}
      <section id="essencias" className="py-20 lg:py-28 bg-[#0e1a0d] border-b border-[#233a1f] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#183016] border border-[#2f552a] text-[#97d87f] text-xs font-bold uppercase tracking-wider mb-3">
              <Droplets className="w-3.5 h-3.5 text-[#73c759]" />
              <span>Coleção de Essências & Notas Olfativas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight">
              Aromas exclusivos criados com o melhor da botânica
            </h2>
            <p className="text-sm sm:text-base text-[#b1c7a8] mt-4 leading-relaxed">
              Cada essência Floresta Verde é desenvolvida com base em pirâmides olfativas harmoniosas, garantindo
              presença marcante, fixação prolongada e zero notas sintéticas agressivas.
            </p>

            {/* Olfactory Family Filters */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
              {[
                { id: 'all', label: 'Todas as Essências' },
                { id: 'herbal', label: 'Herbal & Verde' },
                { id: 'floral', label: 'Floral Sofisticado' },
                { id: 'citrico', label: 'Cítrico & Revigorante' },
                { id: 'amadeirado', label: 'Amadeirado Nobre' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFamily(f.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedFamily === f.id
                      ? 'bg-[#3d652f] text-white shadow-md border border-[#5a9346]'
                      : 'bg-[#142413] text-[#9cb692] hover:text-white hover:bg-[#1a3118] border border-[#243c21]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Essences Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEssences.map((essence) => (
              <div
                key={essence.id}
                className="bg-[#122211] rounded-3xl overflow-hidden border border-[#254222] hover:border-[#427339] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group"
              >
                {/* Photo & Badge */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={essence.imageUrl}
                    alt={essence.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#122211] via-transparent to-black/30" />

                  {/* Badge */}
                  <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#122211]/90 backdrop-blur-md text-[11px] font-bold text-[#b7e8a1] border border-[#3b6332]">
                    {essence.tag}
                  </span>

                  {/* Intensity Indicator */}
                  <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md flex items-center gap-1 border border-white/10 text-[11px] text-white">
                    <span className="text-[10px] text-[#8ea884] font-medium">Intensidade:</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-3 rounded-full ${
                            i < essence.intensity ? 'bg-[#75c65b]' : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Essence Title on Image Bottom */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9acb85]">
                      {essence.familyLabel}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-white drop-shadow-sm leading-tight">
                      {essence.name}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-[#a9c29f] leading-relaxed italic">
                    "{essence.headline}"
                  </p>

                  {/* Olfactory Pyramid Structure */}
                  <div className="p-3.5 rounded-2xl bg-[#0b170a] border border-[#1e361b] space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-[#8eb87c] w-14 shrink-0 text-[11px]">Saída:</span>
                      <span className="text-[#d8ebd2] text-[11px]">{essence.topNotes}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-[#8eb87c] w-14 shrink-0 text-[11px]">Corpo:</span>
                      <span className="text-[#d8ebd2] text-[11px]">{essence.heartNotes}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-[#8eb87c] w-14 shrink-0 text-[11px]">Fundo:</span>
                      <span className="text-[#d8ebd2] text-[11px]">{essence.baseNotes}</span>
                    </div>
                  </div>

                  {/* Recommended Segment */}
                  <div className="text-[11px] text-[#93b088] pt-1">
                    <strong className="text-white">Ideal para:</strong> {essence.bestFor}
                  </div>

                  {/* Action: Select in Form */}
                  <div className="pt-2 border-t border-[#1e381b]">
                    <button
                      type="button"
                      onClick={() => scrollToFormWithInterest(`Linha ${essence.name}`)}
                      className="w-full py-2.5 rounded-xl bg-[#193317] hover:bg-[#254b22] text-[#c6e9b4] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-[#2b5227] cursor-pointer"
                    >
                      <span>Selecionar esta Essência no Cadastro</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION: WHOLESALE PROFIT SIMULATOR FOR STORE OWNERS */}
      <section id="simulador" className="py-20 bg-[#0d180c] border-b border-[#233a1e]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#122311] to-[#172c16] rounded-3xl p-6 sm:p-10 border border-[#2b4c25] shadow-2xl">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7dd461] block mb-1">
                Calculadora Comercial B2B
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Simule seu Pedido e Lucro Estimado no Balcão
              </h2>
              <p className="text-xs sm:text-sm text-[#a8c49e] mt-2">
                Ajuste o valor do seu investimento inicial no atacado e veja o retorno projetado para a sua loja física ou
                e-commerce.
              </p>
            </div>

            {/* Slider Control */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#bfd6b6] font-semibold">Valor do Pedido de Atacado:</span>
                <span className="text-2xl font-bold font-serif text-[#a6e68d]">
                  R$ {simulatedWholesale.toLocaleString('pt-BR')},00
                </span>
              </div>

              <input
                type="range"
                min="500"
                max="8000"
                step="250"
                value={simulatedWholesale}
                onChange={(e) => setSimulatedWholesale(Number(e.target.value))}
                className="w-full h-2.5 bg-[#1b3519] rounded-lg appearance-none cursor-pointer accent-[#75c65b]"
              />

              <div className="flex justify-between text-[11px] text-[#78966e] font-medium">
                <span>R$ 500 (Mínimo B2B)</span>
                <span>R$ 4.000</span>
                <span>R$ 8.000+ (Redes & Franquias)</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-[#0b1609] p-4 rounded-2xl border border-[#213e1e]">
                <div className="text-xs text-[#87a57e] font-semibold uppercase tracking-wider">
                  Investimento Atacado
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white font-serif mt-1">
                  R$ {simulatedWholesale.toLocaleString('pt-BR')},00
                </div>
                <div className="text-[11px] text-[#6e8a65] mt-1">~{estimatedUnits} frascos sortidos</div>
              </div>

              <div className="bg-[#0b1609] p-4 rounded-2xl border border-[#213e1e]">
                <div className="text-xs text-[#87a57e] font-semibold uppercase tracking-wider">
                  Faturamento Estimado no Varejo
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#9ae080] font-serif mt-1">
                  R$ {simulatedRetail.toLocaleString('pt-BR')},00
                </div>
                <div className="text-[11px] text-[#6e8a65] mt-1">Margem média de 120% no PDV</div>
              </div>

              <div className="bg-[#1c3819] p-4 rounded-2xl border border-[#3b6633] shadow-md">
                <div className="text-xs text-[#b8e8a3] font-bold uppercase tracking-wider">
                  Lucro Líquido para sua Loja
                </div>
                <div className="text-xl sm:text-3xl font-bold text-white font-serif mt-1">
                  R$ {simulatedProfit.toLocaleString('pt-BR')},00
                </div>
                <div className="text-[11px] text-[#b8e8a3] mt-1 font-semibold">
                  {simulatedWholesale >= 1500 ? '🎁 Display de madeira bonificado!' : 'Retorno rápido garantido'}
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <a
                href="#formulario-b2b"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#447233] to-[#5b9545] hover:from-[#3a622c] hover:to-[#4e803a] text-white font-bold text-xs sm:text-sm shadow-lg transition-all"
              >
                <span>Garantir esta Tabela e Margem para Minha Loja</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: B2B COMMERCIAL ADVANTAGES */}
      <section id="diferenciais" className="py-20 lg:py-28 bg-[#0a1409] border-b border-[#1f361c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#79cb5f] block mb-2">
              Diferenciais para Lojistas
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              Por que a Floresta Verde é a parceira ideal para seu negócio?
            </h2>
            <p className="text-sm sm:text-base text-[#a7c29e] mt-3">
              Estruturamos nosso modelo comercial para que sua loja tenha facilidade na recompra, altíssima rotatividade e
              uma experiência olfativa memorável para seus clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#112110] rounded-2xl p-6 border border-[#234220] shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#193317] text-[#71cb56] flex items-center justify-center border border-[#2f5529]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Margens de Lucro até 120%</h3>
              <p className="text-xs sm:text-sm text-[#a4c19b] leading-relaxed">
                Tabela de preços de atacado desenhada para que sua revenda tenha margem real e lucratividade superior à
                média do varejo tradicional de decoração e bem-estar.
              </p>
            </div>

            <div className="bg-[#112110] rounded-2xl p-6 border border-[#234220] shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#193317] text-[#71cb56] flex items-center justify-center border border-[#2f5529]">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Faturamento Corporativo Flexível</h3>
              <p className="text-xs sm:text-sm text-[#a4c19b] leading-relaxed">
                Condições comerciais personalizadas e crédito programado para o CNPJ da sua empresa após rápida análise
                cadastral, além de descontos especiais para pagamentos à vista via PIX.
              </p>
            </div>

            <div className="bg-[#112110] rounded-2xl p-6 border border-[#234220] shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#193317] text-[#71cb56] flex items-center justify-center border border-[#2f5529]">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Estoque a Pronta Entrega</h3>
              <p className="text-xs sm:text-sm text-[#a4c19b] leading-relaxed">
                Despacho rápido em até 48 horas úteis com transportadoras especializadas, garantindo que seu mostruário
                nunca fique desabastecido nos momentos de pico de vendas.
              </p>
            </div>

            <div className="bg-[#112110] rounded-2xl p-6 border border-[#234220] shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#193317] text-[#71cb56] flex items-center justify-center border border-[#2f5529]">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Displays para Balcão Bonificados</h3>
              <p className="text-xs sm:text-sm text-[#a4c19b] leading-relaxed">
                Displays de madeira nobre tratada, provadores e réguas olfativas que convidam o cliente da sua loja física
                a experimentar as notas no ar e comprar na hora.
              </p>
            </div>

            <div className="bg-[#112110] rounded-2xl p-6 border border-[#234220] shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#193317] text-[#71cb56] flex items-center justify-center border border-[#2f5529]">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Linha Exclusiva de Hotelaria & Spas</h3>
              <p className="text-xs sm:text-sm text-[#a4c19b] leading-relaxed">
                Amenities personalizadas para hotéis boutique, pousadas e clínicas de estética, criando a assinatura
                olfativa inesquecível da sua marca.
              </p>
            </div>

            <div className="bg-[#112110] rounded-2xl p-6 border border-[#234220] shadow-md space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#193317] text-[#71cb56] flex items-center justify-center border border-[#2f5529]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Formulação Botânica Segura</h3>
              <p className="text-xs sm:text-sm text-[#a4c19b] leading-relaxed">
                Ingredientes nobres, óleos essenciais puros, sem testes em animais e com registro conforme todas as normas
                da vigilância sanitária.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: TESTIMONIALS */}
      <section id="depoimentos" className="py-20 lg:py-28 bg-[#0e1a0d] border-b border-[#233a1f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#79cb5f] block mb-2">
              Depoimentos Reais
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              O que dizem os parceiros que já revendem Floresta Verde
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#122211] rounded-2xl p-6 border border-[#244221] shadow-lg space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#b2cbb0] italic leading-relaxed">
                "A introdução dos difusores da Floresta Verde na nossa loja aumentou o ticket médio das compras em 35%. Os
                clientes entram elogiando o perfume no ar e levam o kit completo."
              </p>
              <div className="pt-2 border-t border-[#1e381b]">
                <div className="font-bold text-sm text-white">Renata Silveira</div>
                <div className="text-xs text-[#8ca883]">Casa Aroma Decorações • São Paulo/SP</div>
              </div>
            </div>

            <div className="bg-[#122211] rounded-2xl p-6 border border-[#244221] shadow-lg space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#b2cbb0] italic leading-relaxed">
                "Utilizamos a assinatura olfativa da Floresta Verde em todas as suítes e recepção do nosso hotel. A
                fixação é incomparável e hoje vendemos os frascos na nossa loja de presentes."
              </p>
              <div className="pt-2 border-t border-[#1e381b]">
                <div className="font-bold text-sm text-white">Guilherme Toledo</div>
                <div className="text-xs text-[#8ca883]">Hotel Boutique Reserva da Serra • Petrópolis/RJ</div>
              </div>
            </div>

            <div className="bg-[#122211] rounded-2xl p-6 border border-[#244221] shadow-lg space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-[#b2cbb0] italic leading-relaxed">
                "A qualidade dos óleos essenciais puros e a flexibilidade comercial nos deram a segurança que precisávamos
                para abastecer nossos tratamentos terapêuticos e revender aos pacientes."
              </p>
              <div className="pt-2 border-t border-[#1e381b]">
                <div className="font-bold text-sm text-white">Dra. Carolina Mendes</div>
                <div className="text-xs text-[#8ca883]">Spa & Espaço Terapêutico Zen • Campinas/SP</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: FAQ */}
      <section id="faq" className="py-20 lg:py-28 bg-[#0a1409] border-b border-[#1f361c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#79cb5f] block mb-2">
              Perguntas Frequentes
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">Dúvidas sobre o Atacado B2B</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-[#112110] rounded-2xl border border-[#234220] overflow-hidden transition-all shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white hover:bg-[#162d14] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#83ab77] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#9fe682]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#b0ccaa] leading-relaxed border-t border-[#1d361b]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM FOOTER & EMPLOYEE ACCESS CARD */}
      <footer className="bg-[#070e06] text-[#b9ceb2] pt-16 pb-10 border-t border-[#1b3117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <LogoFlorestaVerde
                  width={38}
                  height={44}
                  variant="compact"
                  customLogoUrl={customLogoUrl}
                  showUploadTrigger={false}
                />
                <div>
                  <span className="font-serif text-xl font-bold text-white tracking-wide block">
                    Floresta Verde
                  </span>
                  <span className="text-[10px] text-[#8ea884] tracking-widest uppercase block">
                    Aromas Botânicos & Cosméticos Comerciais
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#95b08e] max-w-md leading-relaxed">
                Desenvolvimento de fragrâncias botânicas nobres, difusores de ambiente canelados, águas perfumadas e
                óleos essenciais puros para lojistas de decoração e redes de hotelaria em todo o Brasil.
              </p>
              <div className="text-xs text-[#7e9976]">
                São Paulo / SP • Atendimento Comercial: Segunda a Sexta das 8h às 18h
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-2 text-xs">
              <div className="font-bold text-white text-sm mb-3">Links do Atacado</div>
              <div>
                <a href="#vitrine-produtos" className="hover:text-white transition-colors">
                  Vitrine de Produtos
                </a>
              </div>
              <div>
                <a href="#essencias" className="hover:text-white transition-colors">
                  Guia Olfativo
                </a>
              </div>
              <div>
                <a href="#simulador" className="hover:text-white transition-colors">
                  Simulador de Rentabilidade
                </a>
              </div>
              <div>
                <a href="#formulario-b2b" className="hover:text-white transition-colors">
                  Cadastrar Empresa
                </a>
              </div>
              <div>
                <a href="#faq" className="hover:text-white transition-colors">
                  Dúvidas Frequentes
                </a>
              </div>
            </div>

            {/* EMPLOYEE PORTAL ACCESS CARD */}
            <div className="md:col-span-3 bg-[#0d1a0c] p-6 rounded-2xl border border-[#2b4c25] space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4 text-[#88cb70]" />
                <span>Área Restrita da Equipe</span>
              </div>
              <p className="text-[11px] text-[#93b08c] leading-relaxed">
                Acesso exclusivo para diretoria, equipe comercial B2B/B2C e financeiro da Floresta Verde.
              </p>

              <button
                type="button"
                onClick={onOpenEmployeeLogin}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#345c27] to-[#477a36] hover:from-[#2c4e21] hover:to-[#3e6b2f] text-white text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer group"
              >
                <KeyRound className="w-4 h-4 text-[#b9e6a5] group-hover:rotate-12 transition-transform" />
                <span>Acesso para Funcionários</span>
              </button>
            </div>
          </div>

          {/* Copyright & Disclaimer */}
          <div className="pt-8 border-t border-[#182d15] flex flex-col sm:flex-row items-center justify-between text-xs text-[#799472] gap-3">
            <div>
              © {new Date().getFullYear()} Floresta Verde • Marca Registrada ® • Todos os direitos reservados
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onOpenEmployeeLogin}
                className="text-[#96bc8b] hover:text-white transition-colors underline underline-offset-2 flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Entrar no Painel CRM (Funcionários)</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
