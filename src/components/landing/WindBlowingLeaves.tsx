import React, { useMemo, useState } from 'react';
import {
  FLOATING_MODELS_CONFIG,
  MiniatureProductSVG,
} from './MiniatureProducts';

interface LeafParticle {
  id: number;
  top: number; // percentage (0 - 100)
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds (negative so leaves are already mid-flight)
  opacity: number;
  rotationSpeed: number; // seconds
  colorHex: string;
  type: 'elongated' | 'oval' | 'small';
}

interface WindBlowingLeavesProps {
  className?: string;
  showProducts?: boolean;
}

export const WindBlowingLeaves: React.FC<WindBlowingLeavesProps> = ({
  className = '',
  showProducts = true,
}) => {
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  // Pre-calculated organic leaf distribution with negative delays so leaves are ALREADY floating at load
  const leaves: LeafParticle[] = useMemo(() => {
    const colors = ['#8fe864', '#66be40', '#4d992f', '#a6f57e', '#3c7a25', '#bdfca0'];
    const types: ('elongated' | 'oval' | 'small')[] = ['elongated', 'oval', 'small'];

    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      top: 4 + ((i * 4.6) % 92), // distributed across viewport height
      size: 13 + (i % 6) * 3.5, // 13px to 31px
      duration: 8 + (i % 5) * 2, // 8s to 16s
      delay: -((i * 1.7) % 15), // negative delay so leaves are already active across the whole screen
      opacity: 0.65 + (i % 4) * 0.1,
      rotationSpeed: 3 + (i % 4) * 1.2,
      colorHex: colors[i % colors.length],
      type: types[i % types.length],
    }));
  }, []);

  const handleProductClick = () => {
    const el = document.getElementById('vitrine-produtos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden z-10 ${className}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes windDrift {
          0% {
            transform: translateX(-60px) translateY(0px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.92;
          }
          50% {
            transform: translateX(50vw) translateY(24px) rotate(180deg);
          }
          90% {
            opacity: 0.92;
          }
          100% {
            transform: translateX(calc(100vw + 80px)) translateY(-15px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes productDrift {
          0% {
            transform: translateX(-140px) translateY(0px) rotate(-6deg) scale(0.96);
            opacity: 0;
          }
          5% {
            opacity: 0.95;
          }
          25% {
            transform: translateX(25vw) translateY(-14px) rotate(4deg) scale(1);
          }
          50% {
            transform: translateX(52vw) translateY(12px) rotate(-4deg) scale(1.02);
          }
          75% {
            transform: translateX(78vw) translateY(-8px) rotate(3deg) scale(1);
          }
          94% {
            opacity: 0.95;
          }
          100% {
            transform: translateX(calc(100vw + 140px)) translateY(6px) rotate(-3deg) scale(0.96);
            opacity: 0;
          }
        }

        @keyframes windStream {
          0% {
            transform: translateX(-100%) scaleY(0.9);
            opacity: 0;
          }
          20% {
            opacity: 0.35;
          }
          80% {
            opacity: 0.35;
          }
          100% {
            transform: translateX(150%) scaleY(1.1);
            opacity: 0;
          }
        }

        @keyframes sparkleGlint {
          0%, 100% {
            opacity: 0.25;
            transform: scale(0.85);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.3);
          }
        }
      `}</style>

      {/* Gentle Wind Current Lines (flowing breeze from left to right) */}
      <svg
        className="absolute top-1/4 left-0 w-[200%] h-40 opacity-30 select-none"
        viewBox="0 0 1200 120"
        fill="none"
        style={{
          animation: 'windStream 12s linear infinite',
        }}
      >
        <path
          d="M0 40 Q 250 80, 500 30 T 1000 50 T 1500 30"
          stroke="url(#windGradient)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="12 16"
        />
        <path
          d="M100 80 Q 350 20, 600 70 T 1100 40 T 1600 60"
          stroke="url(#windGradient)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="8 20"
        />
        <defs>
          <linearGradient id="windGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8fe864" stopOpacity="0" />
            <stop offset="30%" stopColor="#b4f794" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7dc45b" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className="absolute top-3/5 left-0 w-[200%] h-36 opacity-25 select-none"
        viewBox="0 0 1200 100"
        fill="none"
        style={{
          animation: 'windStream 16s linear -6s infinite',
        }}
      >
        <path
          d="M0 60 Q 300 20, 600 70 T 1200 30"
          stroke="url(#windGradient2)"
          strokeWidth="1.5"
          strokeDasharray="14 18"
        />
        <defs>
          <linearGradient id="windGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a3f57f" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#75c65b" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Botanical Green Leaves */}
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute will-change-transform"
          style={{
            top: `${leaf.top}%`,
            left: 0,
            animation: `windDrift ${leaf.duration}s cubic-bezier(0.25, 0.1, 0.25, 1) ${leaf.delay}s infinite`,
            opacity: leaf.opacity,
          }}
        >
          {leaf.type === 'elongated' ? (
            /* Bamboo / Rosemary slender leaf */
            <svg
              width={leaf.size}
              height={leaf.size * 1.8}
              viewBox="0 0 20 40"
              fill="none"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
              }}
            >
              <path
                d="M10 0 C18 10, 18 30, 10 40 C2 30, 2 10, 10 0 Z"
                fill={leaf.colorHex}
              />
              <path
                d="M10 2 L10 38"
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeOpacity="0.4"
              />
            </svg>
          ) : leaf.type === 'oval' ? (
            /* Citrus / Laurel classic botanical leaf */
            <svg
              width={leaf.size * 1.3}
              height={leaf.size * 1.5}
              viewBox="0 0 28 36"
              fill="none"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
              }}
            >
              <path
                d="M14 0 C24 8, 28 24, 14 36 C0 24, 4 8, 14 0 Z"
                fill={leaf.colorHex}
              />
              <path
                d="M14 3 L14 33 M14 12 Q20 10, 23 15 M14 20 Q8 18, 5 23"
                stroke="#ffffff"
                strokeWidth="0.75"
                strokeOpacity="0.4"
              />
            </svg>
          ) : (
            /* Delicate herb leaflet */
            <svg
              width={leaf.size}
              height={leaf.size * 1.2}
              viewBox="0 0 20 24"
              fill="none"
              style={{
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
              }}
            >
              <path
                d="M10 0 C16 6, 18 16, 10 24 C2 16, 4 6, 10 0 Z"
                fill={leaf.colorHex}
              />
              <path
                d="M10 2 L10 22"
                stroke="#ffffff"
                strokeWidth="0.6"
                strokeOpacity="0.35"
              />
            </svg>
          )}
        </div>
      ))}

      {/* ============================================================ */}
      {/* 1 OF EACH PRODUCT MODEL PASSING IN MINIATURE WITH THE WIND  */}
      {/* ============================================================ */}
      {showProducts &&
        FLOATING_MODELS_CONFIG.map((product) => {
          const isHovered = hoveredProductId === product.id;

          return (
            <div
              key={product.id}
              className="absolute will-change-transform pointer-events-auto cursor-pointer"
              style={{
                top: `${product.top}%`,
                left: 0,
                animation: `productDrift ${product.duration}s cubic-bezier(0.35, 0.1, 0.25, 1) ${product.delay}s infinite`,
                animationPlayState: isHovered ? 'paused' : 'running',
              }}
              onMouseEnter={() => setHoveredProductId(product.id)}
              onMouseLeave={() => setHoveredProductId(null)}
              onClick={handleProductClick}
              title={`${product.name} - Clique para ver detalhes na vitrine`}
            >
              <div
                className={`relative group transition-all duration-300 ${
                  isHovered ? 'scale-130 z-50' : 'hover:scale-115'
                }`}
                style={{
                  filter:
                    'drop-shadow(0 4px 12px rgba(0,0,0,0.75)) drop-shadow(0 0 10px rgba(140,230,100,0.4))',
                }}
              >
                {/* Miniature Product Vector */}
                <MiniatureProductSVG modelKey={product.modelKey} />

                {/* Ambient Halo behind product */}
                <div
                  className="absolute inset-0 -z-10 rounded-full blur-[6px] opacity-40 transition-opacity"
                  style={{
                    background: 'radial-gradient(circle, rgba(160,245,120,0.6) 0%, transparent 70%)',
                  }}
                />

                {/* Subtle Luminous Sparkle */}
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white opacity-90 pointer-events-none"
                  style={{
                    animation: 'sparkleGlint 3s ease-in-out infinite',
                    boxShadow: '0 0 6px #a6f57e, 0 0 10px #ffffff',
                  }}
                />

                {/* Interactive Tooltip on Hover */}
                <div
                  className={`absolute left-1/2 -bottom-9 -translate-x-1/2 transition-all duration-200 pointer-events-none z-50 ${
                    isHovered
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-1.5 scale-90'
                  }`}
                >
                  <div className="px-3 py-1.5 rounded-xl bg-[#091508]/95 text-[#a6f57e] border border-[#3b6833] whitespace-nowrap shadow-2xl backdrop-blur-md flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8fe864] animate-pulse" />
                      <span className="text-white text-[10.5px] font-bold">{product.name}</span>
                    </div>
                    <span className="text-[9px] text-[#9edc8b] font-medium">
                      {product.category} • Clique para ver na vitrine
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
