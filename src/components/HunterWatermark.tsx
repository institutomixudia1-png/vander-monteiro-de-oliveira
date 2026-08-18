import React from 'react';
import { HunterLogo } from './HunterLogo';

interface HunterWatermarkProps {
  size?: number;
  opacity?: string;
  numericOpacity?: number;
  className?: string;
  showText?: boolean;
}

export const HunterWatermark: React.FC<HunterWatermarkProps> = ({
  size = 380,
  opacity,
  numericOpacity,
  className = '',
  showText = false,
}) => {
  // Parse opacity to clean inline float for 100% reliable html2canvas / html2pdf rendering
  let finalOpacity = 0.045; // 4.5% subtle golden watermark
  if (typeof numericOpacity === 'number') {
    finalOpacity = numericOpacity;
  } else if (opacity) {
    const match = opacity.match(/opacity-\[(\d+(?:\.\d+)?)\]/);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed)) {
        finalOpacity = Math.min(parsed, 0.05); // Cap to 5% max for watermarks
      }
    }
  }

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <div 
        className="flex flex-col items-center justify-center text-center transition-all"
        style={{ opacity: finalOpacity }}
      >
        <HunterLogo size={size} glow={false} watermark={true} />
        {showText && (
          <div className="flex flex-col items-center mt-4">
            <span className="text-4xl font-black tracking-[0.28em] text-[#996515] uppercase">
              HUNTER
            </span>
            <span className="text-[11px] font-extrabold tracking-[0.35em] text-[#805300] uppercase mt-1">
              RECURSOS HUMANOS INTELIGENTES
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
