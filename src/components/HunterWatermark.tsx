import React from 'react';
import { HunterLogo } from './HunterLogo';

interface HunterWatermarkProps {
  size?: number;
  opacity?: string;
  className?: string;
  showText?: boolean;
}

export const HunterWatermark: React.FC<HunterWatermarkProps> = ({
  size = 380,
  opacity = 'opacity-[0.09]',
  className = '',
  showText = false,
}) => {
  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <div className={`flex flex-col items-center justify-center text-center transition-all ${opacity}`}>
        <HunterLogo size={size} glow={false} />
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
