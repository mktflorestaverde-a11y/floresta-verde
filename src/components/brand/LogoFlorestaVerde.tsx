import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface LogoFlorestaVerdeProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  variant?: 'shield' | 'horizontal' | 'compact';
  customLogoUrl?: string | null;
  onOpenUploadModal?: () => void;
  showUploadTrigger?: boolean;
  showText?: boolean;
}

export const LogoFlorestaVerde: React.FC<LogoFlorestaVerdeProps> = ({
  className = '',
  width = 120,
  height = 140,
  variant = 'shield',
  customLogoUrl,
  onOpenUploadModal,
  showUploadTrigger = false,
  showText = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // If user uploaded or specified their original brand logo file
  if (customLogoUrl) {
    if (variant === 'horizontal') {
      return (
        <div
          className={`relative inline-flex items-center gap-3.5 select-none ${
            showUploadTrigger ? 'cursor-pointer group' : ''
          } ${className}`}
          onClick={onOpenUploadModal}
          title={showUploadTrigger ? 'Clique para alterar a logo' : undefined}
        >
          <img
            src={customLogoUrl}
            alt="Logo Floresta Verde Oficial"
            style={{ width: 44, height: 48 }}
            className="object-contain drop-shadow-md select-none"
          />
          <div className="flex flex-col text-left">
            <span className="text-xl font-serif font-bold text-white tracking-tight leading-none">
              Floresta Verde
            </span>
            <span className="text-[10px] font-semibold text-[#8eb87c] tracking-widest uppercase mt-1">
              Aromas & Bem-Estar
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative inline-flex items-center justify-center select-none group shrink-0 ${
          showUploadTrigger ? 'cursor-pointer' : ''
        } ${className}`}
        style={{
          width,
          height,
          minWidth: width,
          minHeight: height,
          flexShrink: 0,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onOpenUploadModal}
        title={showUploadTrigger ? 'Logo Oficial Ativa • Clique para gerenciar imagens' : 'Logo Floresta Verde'}
      >
        <img
          src={customLogoUrl}
          alt="Logo Floresta Verde Oficial"
          className="w-full h-full object-contain drop-shadow-lg mx-auto transition-transform duration-200 group-hover:scale-[1.02]"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />

        {showUploadTrigger && (
          <div
            className={`absolute inset-0 rounded-2xl bg-black/55 backdrop-blur-2xs flex flex-col items-center justify-center text-white transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Camera className="w-5 h-5 mb-1 text-[#d8e7c5]" />
            <span className="text-[10px] font-semibold tracking-wide">Trocar logo</span>
          </div>
        )}
      </div>
    );
  }

  // Variant: Horizontal lockup (Emblem + Typography)
  if (variant === 'horizontal') {
    return (
      <div
        className={`inline-flex items-center gap-3.5 select-none shrink-0 ${
          showUploadTrigger ? 'cursor-pointer group' : ''
        } ${className}`}
        onClick={onOpenUploadModal}
        title={showUploadTrigger ? 'Clique para personalizar a logo' : undefined}
      >
        <LogoFlorestaVerde width={42} height={48} variant="compact" />
        <div className="flex flex-col text-left shrink-0 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-none whitespace-nowrap">
              Floresta Verde
            </span>
            <span className="text-[9px] font-bold text-[#86bf6c] border border-[#3b662e] px-1 rounded-sm leading-none py-0.5">
              ®
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#8ca87e] tracking-widest uppercase mt-1 whitespace-nowrap">
            Atacado & Parcerias B2B
          </span>
        </div>
      </div>
    );
  }

  // Pure Vector Heraldic Shield (Razor-sharp, Scalable, Perfectly Balanced)
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none group shrink-0 ${
        showUploadTrigger ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
        flexShrink: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onOpenUploadModal}
      title={showUploadTrigger ? 'Clique para personalizar ou anexar a logo da empresa' : 'Floresta Verde ®'}
    >
      <svg
        viewBox="0 0 240 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        aria-label="Logo Floresta Verde"
      >
        <defs>
          {/* Subtle Outer Drop Shadow */}
          <filter id="fv-crest-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" floodColor="#081206" />
          </filter>

          {/* Deep Forest Gradient */}
          <linearGradient id="fv-shield-grad" x1="120" y1="12" x2="120" y2="268" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3d5828" />
            <stop offset="50%" stopColor="#2c421b" />
            <stop offset="100%" stopColor="#1e2f12" />
          </linearGradient>

          {/* Golden/Emerald Metallic Stroke */}
          <linearGradient id="fv-border-grad" x1="30" y1="12" x2="210" y2="268" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e3f2d3" />
            <stop offset="50%" stopColor="#a7d68f" />
            <stop offset="100%" stopColor="#dcefd0" />
          </linearGradient>
        </defs>

        {/* 1. Outer Sculpted Heraldic Shield Body */}
        <path
          d="M 120 14
             C 148 24, 182 34, 198 48
             C 192 70, 186 82, 184 92
             C 193 104, 210 126, 210 162
             C 210 196, 202 216, 188 226
             L 178 226
             L 120 268
             L 62 226
             L 52 226
             C 38 216, 30 196, 30 162
             C 30 126, 47 104, 56 92
             C 54 82, 48 70, 42 48
             C 58 34, 92 24, 120 14 Z"
          fill="url(#fv-shield-grad)"
          stroke="url(#fv-border-grad)"
          strokeWidth="4.5"
          strokeLinejoin="round"
          filter="url(#fv-crest-glow)"
        />

        {/* 2. Inner Refined Framing Line */}
        <path
          d="M 120 25
             C 144 34, 172 44, 186 56
             C 181 74, 176 83, 175 92
             C 183 102, 197 122, 197 158
             C 197 188, 190 206, 178 215
             L 170 215
             L 120 252
             L 70 215
             L 62 215
             C 50 206, 43 188, 43 158
             C 43 122, 57 102, 65 92
             C 64 83, 59 74, 54 56
             C 68 44, 96 34, 120 25 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeOpacity="0.85"
          strokeLinejoin="round"
        />

        {/* 3. The Iconic Tree of Life (Trunk, Crown Foliage & Root Network) */}
        <g fill="#ffffff" transform="translate(0, 0)">
          {/* Main Leafy Crown Canopy */}
          <path
            d="M 68 84
               C 66 70, 78 60, 88 58
               C 92 48, 102 40, 114 38
               C 120 34, 128 34, 134 38
               C 146 40, 156 48, 160 58
               C 170 60, 182 70, 180 84
               C 182 96, 172 105, 162 102
               C 155 108, 142 106, 136 100
               C 128 106, 116 106, 108 100
               C 102 106, 89 108, 82 102
               C 72 105, 68 96, 68 84 Z"
            fill="#ffffff"
          />

          {/* Foliage Negative Leaf Windows */}
          <g fill="#2c421b">
            <circle cx="90" cy="68" r="2.2" />
            <circle cx="104" cy="56" r="2.6" />
            <circle cx="120" cy="50" r="2.8" />
            <circle cx="136" cy="56" r="2.6" />
            <circle cx="150" cy="68" r="2.2" />
            <circle cx="160" cy="80" r="2.0" />
            <circle cx="80" cy="80" r="2.0" />
            <circle cx="102" cy="74" r="2.8" />
            <circle cx="120" cy="68" r="3.0" />
            <circle cx="138" cy="74" r="2.8" />
            <circle cx="112" cy="88" r="2.2" />
            <circle cx="128" cy="88" r="2.2" />
          </g>

          {/* Central Trunk dividing into branches */}
          <path
            d="M 115 120
               C 114 104, 111 92, 105 82
               C 111 84, 117 90, 120 98
               C 123 90, 129 84, 135 82
               C 129 92, 126 104, 125 120 Z"
            fill="#ffffff"
          />

          {/* Botanical Roots Spreading Elegantly */}
          <g stroke="#ffffff" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Center taproots */}
            <path d="M 120 120 L 120 152" strokeWidth="2.4" />
            <path d="M 116 120 Q 114 135 111 150" strokeWidth="1.8" />
            <path d="M 124 120 Q 126 135 129 150" strokeWidth="1.8" />

            {/* Left spreading roots */}
            <path d="M 115 124 Q 102 132 88 142 Q 78 148 68 152" strokeWidth="1.7" />
            <path d="M 113 128 Q 100 138 90 150" strokeWidth="1.4" />
            <path d="M 110 134 Q 100 144 94 153" strokeWidth="1.2" />

            {/* Right spreading roots */}
            <path d="M 125 124 Q 138 132 152 142 Q 162 148 172 152" strokeWidth="1.7" />
            <path d="M 127 128 Q 140 138 150 150" strokeWidth="1.4" />
            <path d="M 130 134 Q 140 144 146 153" strokeWidth="1.2" />
          </g>

          {/* Circled Registered Trademark Symbol ® */}
          <g transform="translate(156, 138)">
            <circle cx="6" cy="6" r="5" fill="#1e2f12" stroke="#ffffff" strokeWidth="1" />
            <text
              x="6"
              y="8"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="5.5"
              fontWeight="bold"
              fontFamily="system-ui, sans-serif"
            >
              R
            </text>
          </g>
        </g>

        {/* 4. Optional Text inside Crest (Only rendered when showText is true, e.g. login large view) */}
        {showText && (
          <g transform="translate(120, 192)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="24"
              fontWeight="600"
              fontStyle="italic"
              fontFamily="'Playfair Display', Georgia, serif"
              letterSpacing="0.04em"
            >
              Floresta
            </text>
            <text
              x="0"
              y="22"
              textAnchor="middle"
              fill="#e3f2d3"
              fontSize="20"
              fontWeight="400"
              fontStyle="italic"
              fontFamily="'Playfair Display', Georgia, serif"
              letterSpacing="0.04em"
            >
              verde
            </text>
          </g>
        )}
      </svg>

      {/* Hover action prompt */}
      {showUploadTrigger && (
        <div
          className={`absolute inset-0 rounded-2xl bg-black/55 backdrop-blur-2xs flex flex-col items-center justify-center text-white transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Camera className="w-5 h-5 mb-1 text-[#d5e4c3]" />
          <span className="text-[10px] font-semibold tracking-wide text-white">
            Colocar minha logo
          </span>
        </div>
      )}
    </div>
  );
};

export const BotanicalSidebarDecoration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-start select-none ${className}`}>
      <svg
        width="60"
        height="76"
        viewBox="0 0 80 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-45 text-[#9cb185] mb-2"
        aria-hidden="true"
      >
        <path
          d="M15 105 C25 80, 42 50, 68 12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M68 12 C60 18, 56 28, 62 36 C68 32, 72 22, 68 12 Z"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M48 36 C36 34, 26 42, 28 52 C38 52, 46 44, 48 36 Z"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M42 46 C52 50, 58 60, 56 70 C46 68, 40 58, 42 46 Z"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M32 66 C20 68, 14 78, 18 88 C28 86, 32 76, 32 66 Z"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
      <p className="text-[12px] leading-relaxed text-[#a6ba90] font-normal tracking-wide max-w-[190px]">
        Aromas que conectam pessoas e ambientes.
      </p>
    </div>
  );
};
