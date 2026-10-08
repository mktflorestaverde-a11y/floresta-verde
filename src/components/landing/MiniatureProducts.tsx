import React from 'react';

export type ProductModelKey =
  | 'diffuserGlass'
  | 'diffuserBox'
  | 'homeSpray'
  | 'aromaticCandle'
  | 'refillBottle'
  | 'essentialOil'
  | 'liquidSoap'
  | 'fragrantSachet'
  | 'blisterDiffuser';

export interface FloatingProductItem {
  id: string;
  name: string;
  category: string;
  top: number; // percentage (0 - 100)
  duration: number; // seconds to cross screen
  delay: number; // seconds offset (negative so they are mid-flight on page load)
  sizeScale: number; // scale multiplier
  modelKey: ProductModelKey;
}

/**
 * EXACTLY 1 OF EACH DISTINCT PRODUCT MODEL
 * Staggered with negative delays so all models are immediately visible mid-air
 * floating smoothly with the leaves across the banner without crowding.
 */
export const FLOATING_MODELS_CONFIG: FloatingProductItem[] = [
  {
    id: 'prod-diffuser-glass',
    name: 'Difusor Canelado Signature',
    category: 'Frasco de Vidro com Varetas 250ml',
    top: 12,
    duration: 18,
    delay: -2, // ~11% across screen at t=0
    sizeScale: 1.05,
    modelKey: 'diffuserGlass',
  },
  {
    id: 'prod-diffuser-box',
    name: 'Caixa de Difusor com Visor',
    category: 'Embalagem Luxo & Varetas',
    top: 22,
    duration: 20,
    delay: -14, // ~70% across screen at t=0
    sizeScale: 1.0,
    modelKey: 'diffuserBox',
  },
  {
    id: 'prod-home-spray',
    name: 'Home Spray de Ambiente',
    category: 'Frasco 500ml com Gatilho Nobre',
    top: 33,
    duration: 17,
    delay: -6, // ~35% across screen at t=0
    sizeScale: 1.08,
    modelKey: 'homeSpray',
  },
  {
    id: 'prod-aromatic-candle',
    name: 'Vela em Cera de Coco',
    category: 'Pavio de Madeira Estalante',
    top: 45,
    duration: 21,
    delay: -16, // ~76% across screen at t=0
    sizeScale: 1.04,
    modelKey: 'aromaticCandle',
  },
  {
    id: 'prod-refill-bottle',
    name: 'Frasco Refil Econômico',
    category: 'Refil 500ml Tampa Prateada',
    top: 56,
    duration: 19,
    delay: -10, // ~52% across screen at t=0
    sizeScale: 1.0,
    modelKey: 'refillBottle',
  },
  {
    id: 'prod-essential-oil',
    name: 'Óleo Essencial 100% Puro',
    category: 'Frasco Âmbar 10ml Conta-Gotas',
    top: 67,
    duration: 18,
    delay: -4, // ~22% across screen at t=0
    sizeScale: 1.02,
    modelKey: 'essentialOil',
  },
  {
    id: 'prod-liquid-soap',
    name: 'Sabonete Líquido Home Spa',
    category: 'Frasco 250ml Válvula Pump',
    top: 76,
    duration: 20,
    delay: -12, // ~60% across screen at t=0
    sizeScale: 1.05,
    modelKey: 'liquidSoap',
  },
  {
    id: 'prod-fragrant-sachet',
    name: 'Sachê Perfumado em Envelope',
    category: 'Celulose Nobre 25g com Fita',
    top: 84,
    duration: 22,
    delay: -8, // ~36% across screen at t=0
    sizeScale: 0.98,
    modelKey: 'fragrantSachet',
  },
  {
    id: 'prod-blister-diffuser',
    name: 'Difusor Blister com Flor Seca',
    category: 'Cartela 100ml com Buquê Floral',
    top: 92,
    duration: 19,
    delay: -18, // ~94% across screen at t=0
    sizeScale: 1.0,
    modelKey: 'blisterDiffuser',
  },
];

/**
 * Miniature Product Vector Graphics (1 of each model, high-fidelity luxury detailing)
 */
export const MiniatureProductSVG: React.FC<{ modelKey: ProductModelKey }> = ({ modelKey }) => {
  switch (modelKey) {
    case 'diffuserGlass':
      return (
        <svg width="38" height="66" viewBox="0 0 38 66" fill="none" className="select-none overflow-visible">
          <defs>
            <linearGradient id="glassBodyGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="25%" stopColor="#d8f4cb" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#4e8c3b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1e3a15" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="goldCollarGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff0b3" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#8a6b10" />
            </linearGradient>
            <filter id="softGlowGlass" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8fe864" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Black Diffusion Reed Sticks fan */}
          <path d="M19 32 L6 2" stroke="#121811" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19 32 L13 0" stroke="#1c261b" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19 32 L25 1" stroke="#121811" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19 32 L32 4" stroke="#222e20" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M19 32 L18 0" stroke="#162015" strokeWidth="1.8" strokeLinecap="round" />

          {/* Gold Metallic Neck Collar */}
          <rect x="14" y="28" width="10" height="6" rx="1.5" fill="url(#goldCollarGrad)" stroke="#fffbe0" strokeWidth="0.6" />
          <ellipse cx="19" cy="28" rx="4.5" ry="1.4" fill="#4d3b07" />

          {/* Crystal Fluted Glass Bottle Body */}
          <rect x="8" y="33" width="22" height="30" rx="3" fill="url(#glassBodyGrad)" stroke="#ffffff" strokeWidth="0.9" strokeOpacity="0.85" filter="url(#softGlowGlass)" />

          {/* Vertical Glass Flutes (Canelado effect) */}
          <line x1="12" y1="35" x2="12" y2="60" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
          <line x1="16" y1="35" x2="16" y2="60" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
          <line x1="22" y1="35" x2="22" y2="60" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />
          <line x1="26" y1="35" x2="26" y2="60" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.45" />

          {/* Liquid Level */}
          <path d="M9 43 Q19 41 29 43 L29 60 Q29 62 27 62 L11 62 Q9 62 9 60 Z" fill="#2d6122" fillOpacity="0.8" />

          {/* Brand Label with Gold Crest */}
          <rect x="10.5" y="44" width="17" height="12" rx="1.5" fill="#fcfcf9" fillOpacity="0.95" stroke="#325428" strokeWidth="0.5" />
          <path d="M19 46 L21 49 L17 49 Z" fill="#294e22" />
          <rect x="12.5" y="50.5" width="13" height="1.2" fill="#1b3617" />
          <rect x="14" y="52.8" width="10" height="0.9" fill="#75a867" />

          {/* Specular Highlight */}
          <line x1="10" y1="36" x2="10" y2="59" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.8" />
        </svg>
      );

    case 'diffuserBox':
      return (
        <svg width="38" height="66" viewBox="0 0 38 66" fill="none" className="select-none overflow-visible">
          <defs>
            <linearGradient id="boxBaseGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3d2352" />
              <stop offset="100%" stopColor="#1a0c25" />
            </linearGradient>
            <linearGradient id="boxTopGrad2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fffdf7" />
              <stop offset="100%" stopColor="#e3dfd3" />
            </linearGradient>
          </defs>

          {/* Reed Sticks peeking from box top */}
          <path d="M19 20 L11 2" stroke="#1a2317" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M19 20 L18 0" stroke="#121a11" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M19 20 L27 3" stroke="#222e20" strokeWidth="1.6" strokeLinecap="round" />

          {/* Box Main Body */}
          <rect x="6" y="18" width="26" height="46" rx="2.5" fill="url(#boxTopGrad2)" stroke="#3e2454" strokeWidth="0.9" />

          {/* Botanical Pattern Filigree */}
          <path d="M8 23 Q13 21 11 27 M23 23 Q28 25 25 30 M10 33 Q7 37 12 38" stroke="#7e5a99" strokeWidth="0.7" strokeOpacity="0.5" fill="none" />

          {/* Cut-Out Acetate Window */}
          <rect x="10" y="28" width="18" height="20" rx="2" fill="#1b1124" stroke="#d4af37" strokeWidth="0.6" />
          {/* Inner Bottle Silhouette Visible */}
          <rect x="13.5" y="34" width="11" height="13" rx="1.5" fill="#a484d6" fillOpacity="0.85" />
          <rect x="16.5" y="31.5" width="5" height="3" rx="0.5" fill="#d4af37" />

          {/* Colored Bottom Segment */}
          <path d="M6 50 L32 50 L32 61 Q32 63 30 63 L8 63 Q6 63 6 61 Z" fill="url(#boxBaseGrad2)" />
          {/* Gold Foil Signature Line */}
          <rect x="11" y="53.5" width="16" height="1.2" fill="#f0db99" />
          <rect x="13" y="56.5" width="12" height="0.9" fill="#ffffff" fillOpacity="0.75" />

          {/* Crest on Top */}
          <path d="M19 21 L21 24 L17 24 Z" fill="#3e2454" />
        </svg>
      );

    case 'homeSpray':
      return (
        <svg width="34" height="66" viewBox="0 0 34 66" fill="none" className="select-none overflow-visible">
          <defs>
            <linearGradient id="sprayLiquid2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="30%" stopColor="#79cb5f" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#295c1c" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#11290b" />
            </linearGradient>
            <linearGradient id="triggerGrad2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ededed" />
              <stop offset="100%" stopColor="#b0b0b0" />
            </linearGradient>
          </defs>

          {/* Trigger Sprayer Head */}
          <rect x="13" y="16" width="8" height="5" fill="url(#triggerGrad2)" rx="0.8" stroke="#888" strokeWidth="0.5" />
          {/* Spray Nozzle */}
          <path d="M14 16 L7 14 L7 19 L14 18 Z" fill="url(#triggerGrad2)" stroke="#666" strokeWidth="0.5" />
          {/* Ergonomic Finger Trigger Lever */}
          <path d="M11 18 Q8 24 12 28" stroke="#444" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          {/* Trigger Hood */}
          <path d="M13 16 Q19 11 24 14 Q26 17 20 18 Z" fill="url(#triggerGrad2)" stroke="#777" strokeWidth="0.5" />

          {/* Bottle Neck & Shoulder */}
          <path d="M12 21 L22 21 L25 28 L9 28 Z" fill="url(#sprayLiquid2)" stroke="#ffffff" strokeWidth="0.5" />

          {/* Cylinder Bottle Body 500ml */}
          <rect x="8" y="28" width="18" height="36" rx="3.5" fill="url(#sprayLiquid2)" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />

          {/* Luxury Emerald Brand Label */}
          <rect x="9.5" y="34" width="15" height="19" rx="1.5" fill="#133310" stroke="#d4af37" strokeWidth="0.6" />
          <rect x="11.5" y="37" width="11" height="1.4" fill="#ffffff" />
          <rect x="11" y="40.5" width="12" height="1" fill="#9de87c" />
          <rect x="12.5" y="48.5" width="9" height="1" fill="#d4af37" />

          {/* Reflection Glint */}
          <line x1="10" y1="30" x2="10" y2="61" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.85" />
        </svg>
      );

    case 'aromaticCandle':
      return (
        <svg width="36" height="58" viewBox="0 0 36 58" fill="none" className="select-none overflow-visible">
          <defs>
            <linearGradient id="candleGlassAmber" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#d9822b" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#87470c" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#472002" />
            </linearGradient>
            <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffae6" />
              <stop offset="40%" stopColor="#ffb833" />
              <stop offset="80%" stopColor="#ff5500" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ff3300" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Warm Candle Light Aura */}
          <circle cx="18" cy="15" r="11" fill="url(#flameGlow)" opacity="0.85" />

          {/* Natural Wood Wick with Glowing Tip */}
          <line x1="18" y1="21" x2="18" y2="28" stroke="#3b2512" strokeWidth="2.4" strokeLinecap="round" />
          {/* Flame teardrop */}
          <path d="M18 10 C21 15, 20 19, 18 21 C16 19, 15 15, 18 10 Z" fill="#ffea75" stroke="#ff9900" strokeWidth="0.5" />
          <circle cx="18" cy="18" r="1.5" fill="#ffffff" />

          {/* Amber Glass Candle Jar */}
          <rect x="7" y="27" width="22" height="27" rx="3.5" fill="url(#candleGlassAmber)" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.7" />

          {/* Coconut Wax Pool Top */}
          <ellipse cx="18" cy="28.5" rx="10" ry="2.5" fill="#fcf9ee" stroke="#e0d7c3" strokeWidth="0.5" />

          {/* Luxury Kraft & Gold Label */}
          <rect x="9.5" y="34" width="17" height="15" rx="1.5" fill="#1f1810" stroke="#d4af37" strokeWidth="0.5" />
          <path d="M18 36 L19.5 38.5 L16.5 38.5 Z" fill="#d4af37" />
          <rect x="11.5" y="40" width="13" height="1.2" fill="#fffdf5" />
          <rect x="12" y="42.5" width="12" height="0.9" fill="#e5ad42" />
          <rect x="13.5" y="45.5" width="9" height="0.8" fill="#ffffff" fillOpacity="0.7" />

          {/* Glass Specular Highlight */}
          <line x1="9" y1="30" x2="9" y2="51" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.8" />
        </svg>
      );

    case 'refillBottle':
      return (
        <svg width="32" height="62" viewBox="0 0 32 62" fill="none" className="select-none overflow-visible">
          <defs>
            <linearGradient id="refillLiquid2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="25%" stopColor="#dcefd2" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#458231" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1e3a15" />
            </linearGradient>
            <linearGradient id="silverCap2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f5f5f5" />
              <stop offset="50%" stopColor="#d0d0d0" />
              <stop offset="100%" stopColor="#8a8a8a" />
            </linearGradient>
          </defs>

          {/* Metallic Ribbed Screw Cap */}
          <rect x="11.5" y="10" width="9" height="8" rx="1" fill="url(#silverCap2)" stroke="#ffffff" strokeWidth="0.5" />
          <line x1="14" y1="11" x2="14" y2="17" stroke="#666" strokeWidth="0.4" />
          <line x1="16" y1="11" x2="16" y2="17" stroke="#666" strokeWidth="0.4" />
          <line x1="18" y1="11" x2="18" y2="17" stroke="#666" strokeWidth="0.4" />

          {/* Bottle Neck & Shoulder */}
          <path d="M11 18 L21 18 L25 25 L7 25 Z" fill="url(#refillLiquid2)" />

          {/* Main 500ml Bottle Body */}
          <rect x="6.5" y="25" width="19" height="34" rx="4" fill="url(#refillLiquid2)" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />

          {/* White Apothecary Label */}
          <rect x="8.5" y="32" width="15" height="18" rx="1" fill="#ffffff" fillOpacity="0.95" stroke="#335928" strokeWidth="0.4" />
          <rect x="10.5" y="35" width="11" height="1.3" fill="#203d19" />
          <rect x="10" y="38" width="12" height="2" fill="#c49a37" />
          <rect x="11" y="42.5" width="10" height="0.9" fill="#4d7541" />
          <rect x="12" y="45.5" width="8" height="0.8" fill="#777" />

          {/* Bottle highlight */}
          <line x1="8" y1="27" x2="8" y2="56" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.8" />
        </svg>
      );

    case 'essentialOil':
      return (
        <svg width="30" height="58" viewBox="0 0 30 58" fill="none" className="select-none overflow-visible">
          <defs>
            <linearGradient id="oilAmberGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="35%" stopColor="#e0882e" />
              <stop offset="75%" stopColor="#7a3d07" />
              <stop offset="100%" stopColor="#3d1b02" />
            </linearGradient>
            <linearGradient id="oilGoldRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff2b3" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#87680c" />
            </linearGradient>
          </defs>

          {/* Dropper Rubber Bulb */}
          <path d="M12 7 Q15 2 18 7 L18 12 L12 12 Z" fill="#1b1c1b" stroke="#333" strokeWidth="0.5" />
          {/* Gold Dropper Collar Ring */}
          <rect x="10.5" y="12" width="9" height="5" rx="1" fill="url(#oilGoldRing)" stroke="#ffffff" strokeWidth="0.4" />

          {/* Amber Bottle Shoulder */}
          <path d="M11 17 L19 17 L22 22 L8 22 Z" fill="url(#oilAmberGrad)" />

          {/* 10ml Amber Dropper Bottle */}
          <rect x="7" y="22" width="16" height="28" rx="3" fill="url(#oilAmberGrad)" stroke="#ffffff" strokeWidth="0.7" strokeOpacity="0.75" />

          {/* Apothecary 10ml Pure Label */}
          <rect x="8.5" y="27" width="13" height="15" rx="1" fill="#fffdfa" stroke="#4d2f0d" strokeWidth="0.4" />
          <path d="M15 29 L16.5 31.5 L13.5 31.5 Z" fill="#7a3d07" />
          <rect x="10" y="32.5" width="10" height="1.2" fill="#2d1704" />
          <rect x="10.5" y="35" width="9" height="0.9" fill="#c47d1b" />
          <rect x="11.5" y="38" width="7" height="0.8" fill="#555" />

          {/* Amber gloss highlight */}
          <line x1="8.5" y1="24" x2="8.5" y2="47" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.8" />
        </svg>
      );

    case 'liquidSoap':
      return (
        <svg width="34" height="62" viewBox="0 0 34 62" fill="none" className="select-none overflow-visible">
          <defs>
            <linearGradient id="soapLiquid2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="30%" stopColor="#30c25a" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#1a7834" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0c3d1a" />
            </linearGradient>
            <linearGradient id="pumpGrad2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#e8e8e8" />
              <stop offset="100%" stopColor="#cccccc" />
            </linearGradient>
          </defs>

          {/* Pump Dispenser Spout */}
          <path d="M17 7 L9 6 Q7 6.5 7 8 L10 9 L17 9 Z" fill="url(#pumpGrad2)" stroke="#999" strokeWidth="0.4" />
          {/* Pump Stem */}
          <rect x="15.5" y="9" width="3" height="7" fill="url(#pumpGrad2)" stroke="#999" strokeWidth="0.4" />
          {/* Pump Collar */}
          <rect x="12.5" y="16" width="9" height="4.5" rx="0.9" fill="url(#pumpGrad2)" stroke="#888" strokeWidth="0.4" />

          {/* Rounded Bottle Body */}
          <rect x="7" y="20.5" width="20" height="36" rx="7" fill="url(#soapLiquid2)" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.8" />

          {/* Clean Label */}
          <rect x="9" y="28" width="16" height="17" rx="1.5" fill="#f8fdf6" stroke="#24542a" strokeWidth="0.4" />
          <path d="M17 30 L18.5 32.5 L15.5 32.5 Z" fill="#1b4d21" />
          <rect x="11" y="34" width="12" height="1.3" fill="#133d18" />
          <rect x="10.5" y="37" width="13" height="1" fill="#428a4c" />
          <rect x="12.5" y="41" width="9" height="0.8" fill="#666" />

          {/* Soap Gloss */}
          <line x1="9" y1="23" x2="9" y2="53" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.8" />
        </svg>
      );

    case 'fragrantSachet':
      return (
        <svg width="38" height="52" viewBox="0 0 38 52" fill="none" className="select-none overflow-visible">
          <defs>
            <linearGradient id="sachetPouch2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e3b1c" />
              <stop offset="50%" stopColor="#172e16" />
              <stop offset="100%" stopColor="#0d1b0d" />
            </linearGradient>
            <linearGradient id="goldRibbon2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="50%" stopColor="#ffe699" />
              <stop offset="100%" stopColor="#b38f24" />
            </linearGradient>
          </defs>

          {/* Paper Pouch Envelope */}
          <rect x="6" y="6" width="26" height="40" rx="2.5" fill="url(#sachetPouch2)" stroke="#4e8241" strokeWidth="0.9" />

          {/* Vertical Gold Ribbon Band */}
          <rect x="17" y="6" width="4" height="40" fill="url(#goldRibbon2)" />

          {/* Cream Parchment Badge */}
          <rect x="9.5" y="16" width="19" height="19" rx="1.5" fill="#f5eedc" stroke="#d4af37" strokeWidth="0.6" />

          {/* Crest & Text on Badge */}
          <path d="M19 18 L20.5 20.5 L17.5 20.5 Z" fill="#2d4f25" />
          <rect x="12" y="22" width="14" height="1.3" fill="#1b3617" />
          <rect x="13" y="25" width="12" height="1" fill="#805d1b" />
          <rect x="14.5" y="29.5" width="9" height="0.8" fill="#555" />

          {/* Subtle Crimp Borders top & bottom */}
          <line x1="6" y1="8" x2="32" y2="8" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.45" />
          <line x1="6" y1="44" x2="32" y2="44" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.45" />
        </svg>
      );

    case 'blisterDiffuser':
      return (
        <svg width="38" height="64" viewBox="0 0 38 64" fill="none" className="select-none overflow-visible">
          <defs>
            <linearGradient id="blisterCard2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7f5ed" />
              <stop offset="100%" stopColor="#e3dcce" />
            </linearGradient>
            <linearGradient id="amberMiniBottle2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="40%" stopColor="#d9822b" />
              <stop offset="80%" stopColor="#8a480d" />
              <stop offset="100%" stopColor="#4a2202" />
            </linearGradient>
          </defs>

          {/* Cardboard Blister Backing Card */}
          <rect x="6" y="5" width="26" height="54" rx="3.5" fill="url(#blisterCard2)" stroke="#c2bba8" strokeWidth="0.9" />
          {/* Euro Hang Hole Slot at Top */}
          <rect x="15" y="7" width="8" height="2.5" rx="1.2" fill="#0d170c" />

          {/* Botanical Floral Artwork on Card */}
          <path d="M8 16 Q13 13 12 19 M25 15 Q29 18 26 21" stroke="#7e9e73" strokeWidth="0.7" fill="none" />

          {/* Thermoformed Plastic Bubble */}
          <rect x="9.5" y="18" width="19" height="37" rx="3" fill="#ffffff" fillOpacity="0.22" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.9" />

          {/* Dried Flower Bouquet Stems inside blister */}
          <path d="M21 31 L22 20" stroke="#879976" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M20 31 L18 19" stroke="#879976" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M22 31 L24 21" stroke="#879976" strokeWidth="1.2" strokeLinecap="round" />
          {/* Yellow Mini Dried Flower heads */}
          <circle cx="22" cy="20" r="2.2" fill="#fcd34d" />
          <circle cx="18" cy="19" r="2" fill="#f59e0b" />
          <circle cx="24" cy="21" r="2" fill="#fcd34d" />

          {/* Mini Amber Bottle 100ml */}
          <rect x="12.5" y="30" width="13" height="22" rx="2" fill="url(#amberMiniBottle2)" stroke="#ffe699" strokeWidth="0.5" />
          {/* Gold cap */}
          <rect x="14.5" y="27" width="9" height="4" rx="0.6" fill="#d4af37" stroke="#ffffff" strokeWidth="0.4" />
          {/* Label */}
          <rect x="13.5" y="35" width="11" height="10" rx="0.5" fill="#fefae0" stroke="#7a4209" strokeWidth="0.3" />
          <rect x="14.5" y="37" width="9" height="1.1" fill="#693504" />
          <rect x="15.5" y="39.5" width="7" height="0.8" fill="#a16207" />

          {/* Plastic Reflection */}
          <line x1="11" y1="20" x2="11" y2="51" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.8" />
        </svg>
      );
  }
};
