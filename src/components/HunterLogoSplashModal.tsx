import React, { useEffect } from 'react';
import { HunterLogo } from './HunterLogo';

interface HunterLogoSplashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HunterLogoSplashModal: React.FC<HunterLogoSplashModalProps> = ({
  isOpen,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer select-none animate-in fade-in duration-300 p-6"
      title="Clique em qualquer lugar para fechar"
    >
      <div className="flex flex-col items-center gap-8 transform hover:scale-105 transition-transform duration-500">
        {/* Large Centered Hunter Desktop Logo */}
        <div className="p-10 rounded-3xl bg-zinc-950/60 border border-amber-500/30 shadow-[0_0_100px_rgba(255,215,0,0.35)] flex items-center justify-center">
          <HunterLogo size={220} glow={true} />
        </div>

        {/* Text Brand */}
        <div className="flex items-baseline gap-5 mt-2">
          <span className="font-black text-6xl md:text-7xl tracking-wider text-gold-gradient-bright drop-shadow-[0_0_35px_rgba(255,215,0,0.8)]">
            HUNTER
          </span>
          <span className="text-white font-bold text-3xl md:text-4xl tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            DESKTOP
          </span>
        </div>

        <div className="h-0.5 w-64 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent my-2" />

        <p className="text-zinc-500 text-xs font-mono tracking-[0.3em] uppercase mt-4">
          Clique em qualquer lugar para fechar
        </p>
      </div>
    </div>
  );
};
