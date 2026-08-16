import React from 'react';

interface HunterLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  glow?: boolean;
}

export const HunterLogo: React.FC<HunterLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  glow = true
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div 
        className="relative flex items-center justify-center transition-all duration-300"
        style={{ width: size, height: size }}
      >
        {/* Ambient gold glow */}
        {glow && (
          <div 
            className="absolute -inset-1 rounded-xl opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-80"
            style={{
              background: 'radial-gradient(circle, rgba(212,175,55,0.7) 0%, rgba(184,134,11,0.2) 70%, transparent 100%)'
            }}
          />
        )}

        {/* High-fidelity SVG of Hunter Desktop geometric "H" blocks */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-[0_2px_10px_rgba(212,175,55,0.6)]"
        >
          <defs>
            <linearGradient id="goldTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCEEAD" />
              <stop offset="45%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#8A6609" />
            </linearGradient>
            <linearGradient id="goldTopRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5DF85" />
              <stop offset="55%" stopColor="#C59B27" />
              <stop offset="100%" stopColor="#7C5803" />
            </linearGradient>
            <linearGradient id="goldBottomLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EEDC82" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#785505" />
            </linearGradient>
            <linearGradient id="goldBottomRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBF0B7" />
              <stop offset="45%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#85620A" />
            </linearGradient>
          </defs>

          {/* Top Left Tall Block */}
          <path
            d="M28 12 L64 12 C66.8 12 68.8 14.5 68.2 17.2 L60.5 50 C59.9 52.7 57.5 54.8 54.7 54.8 L18.7 54.8 C15.9 54.8 13.9 52.3 14.5 49.6 L22.2 16.8 C22.8 14.1 25.2 12 28 12 Z"
            fill="url(#goldTopLeft)"
          />

          {/* Top Right Square-ish Block */}
          <path
            d="M68 28 L91 28 C93.8 28 95.8 30.5 95.2 33.2 L91.2 50 C90.6 52.7 88.2 54.8 85.4 54.8 L62.4 54.8 C59.6 54.8 57.6 52.3 58.2 49.6 L62.2 32.8 C62.8 30.1 65.2 28 68 28 Z"
            fill="url(#goldTopRight)"
          />

          {/* Bottom Left Square-ish Block */}
          <path
            d="M17 59 L40 59 C42.8 59 44.8 61.5 44.2 64.2 L40.2 81 C39.6 83.7 37.2 85.8 34.4 85.8 L11.4 85.8 C8.6 85.8 6.6 83.3 7.2 80.6 L11.2 63.8 C11.8 61.1 14.2 59 17 59 Z"
            fill="url(#goldBottomLeft)"
          />

          {/* Bottom Right Tall Block */}
          <path
            d="M48 59 L84 59 C86.8 59 88.8 61.5 88.2 64.2 L80.5 97 C79.9 99.7 77.5 101.8 74.7 101.8 L38.7 101.8 C35.9 101.8 33.9 99.3 34.5 96.6 L42.2 63.8 C42.8 61.1 45.2 59 48 59 Z"
            fill="url(#goldBottomRight)"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-wider text-gold-gradient-bright drop-shadow-[0_2px_8px_rgba(255,215,0,0.4)]">
            HUNTER
          </span>
          <span className="text-[10px] tracking-[0.28em] font-semibold text-amber-200/80 uppercase -mt-1">
            Desktop App
          </span>
        </div>
      )}
    </div>
  );
};
