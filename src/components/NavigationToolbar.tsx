import React from 'react';
import { GlowButton } from './GlowButton';
import { TabId } from '../types/hunter';
import { Crosshair, Building2, UserCheck, GraduationCap } from 'lucide-react';

interface NavigationToolbarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  empresaCount: number;
  estagiarioCount: number;
  escolaCount: number;
}

export const NavigationToolbar: React.FC<NavigationToolbarProps> = ({
  activeTab,
  onSelectTab,
  empresaCount,
  estagiarioCount,
  escolaCount
}) => {
  return (
    <nav className="bg-zinc-950 border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between shrink-0 relative z-20">
      <div className="flex flex-wrap items-center gap-3">
        {/* 1. Hunter Button */}
        <GlowButton
          active={activeTab === 'hunter'}
          onClick={() => onSelectTab('hunter')}
          icon={<Crosshair className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
          id="btn-nav-hunter"
        >
          Hunter
        </GlowButton>

        {/* 2. Empresas Button */}
        <GlowButton
          active={activeTab === 'empresas'}
          onClick={() => onSelectTab('empresas')}
          icon={<Building2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
          id="btn-nav-empresas"
        >
          Empresas
        </GlowButton>

        {/* 3. Estagiários Button */}
        <GlowButton
          active={activeTab === 'estagiarios'}
          onClick={() => onSelectTab('estagiarios')}
          icon={<UserCheck className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
          id="btn-nav-estagiarios"
        >
          Estagiários
        </GlowButton>

        {/* 4. Escolas Button */}
        <GlowButton
          active={activeTab === 'escolas'}
          onClick={() => onSelectTab('escolas')}
          icon={<GraduationCap className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
          id="btn-nav-escolas"
        >
          Escolas
        </GlowButton>
      </div>
    </nav>
  );
};
