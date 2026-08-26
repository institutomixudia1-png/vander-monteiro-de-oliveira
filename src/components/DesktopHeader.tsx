import React from 'react';
import { HunterLogo } from './HunterLogo';
import { GlowButton } from './GlowButton';
import { TabId } from '../types/hunter';
import { Crosshair, Building2, UserCheck, GraduationCap, CloudUpload, CheckCircle2, Loader2, AlertCircle, Database, ClipboardList } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppButton';

interface DesktopHeaderProps {
  onOpenDownloadModal?: () => void;
  onSaveToCloud?: () => void;
  isSavingCloud?: boolean;
  cloudSaveStatus?: 'idle' | 'success' | 'error';
  activeModuleTitle?: string;
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onLock?: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  onOpenDownloadModal,
  onSaveToCloud,
  isSavingCloud = false,
  cloudSaveStatus = 'idle',
  activeModuleTitle,
  activeTab,
  onSelectTab,
  onLock
}) => {
  const handleOpenSuporte = () => {
    const phone = '5531996290458';
    const text = encodeURIComponent('Olá! Preciso de suporte no HUNTER Desktop.');
    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="h-16 bg-zinc-950/95 px-4 flex items-center justify-between select-none shrink-0 relative z-30">
      {/* Left section: App Brand Logo & Name + Navigation Buttons ao lado da logo */}
      <div className="flex items-center gap-6">
        <div 
          onClick={onLock}
          className="flex items-center gap-3 cursor-pointer group py-1 px-2 rounded-xl hover:bg-zinc-900/80 transition-all duration-300"
          title="Clique na Logo para Bloquear o Sistema (Acesso por Senha)"
        >
          <HunterLogo size={32} glow={true} className="group-hover:scale-105 transition-transform" />
          
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-lg text-gold-gradient-bright tracking-wide group-hover:brightness-110">
              HUNTER
            </span>
            <span className="font-semibold text-sm text-amber-300 group-hover:text-amber-200 transition-colors">
              DESKTOP
            </span>
          </div>
        </div>

        {/* Botões: Hunter, Empresas, Estagiários, Escolas e Suporte ao lado da logo */}
        <nav className="flex items-center gap-2 ml-2">
          <GlowButton
            active={activeTab === 'hunter'}
            onClick={() => onSelectTab('hunter')}
            icon={<Crosshair className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
            id="btn-nav-hunter"
            className="py-2 px-4 text-xs"
          >
            Hunter
          </GlowButton>

          <GlowButton
            active={activeTab === 'empresas'}
            onClick={() => onSelectTab('empresas')}
            icon={<Building2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
            id="btn-nav-empresas"
            className="py-2 px-4 text-xs"
          >
            Empresas
          </GlowButton>

          <GlowButton
            active={activeTab === 'estagiarios'}
            onClick={() => onSelectTab('estagiarios')}
            icon={<UserCheck className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
            id="btn-nav-estagiarios"
            className="py-2 px-4 text-xs"
          >
            Estagiários
          </GlowButton>

          <GlowButton
            active={activeTab === 'escolas'}
            onClick={() => onSelectTab('escolas')}
            icon={<GraduationCap className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
            id="btn-nav-escolas"
            className="py-2 px-4 text-xs"
          >
            Escolas
          </GlowButton>

          {/* Botão Suporte */}
          <GlowButton
            onClick={handleOpenSuporte}
            icon={<WhatsAppIcon className="w-4 h-4 text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
            id="btn-nav-suporte"
            className="py-2 px-4 text-xs"
          >
            Suporte
          </GlowButton>

          {/* Botão Banco de Dados */}
          <GlowButton
            onClick={() => {}}
            icon={<Database className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
            id="btn-nav-banco-dados"
            className="py-2 px-4 text-xs"
          >
            Banco de Dados
          </GlowButton>

          {/* Botão Demanda */}
          <GlowButton
            active={activeTab === 'demanda'}
            onClick={() => onSelectTab('demanda')}
            icon={<ClipboardList className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />}
            id="btn-nav-demanda"
            className="py-2 px-4 text-xs"
          >
            Demanda
          </GlowButton>
        </nav>
      </div>

      {/* Right section: Botão Salvar Nuvem direto no Supabase */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSaveToCloud}
          disabled={isSavingCloud}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer shadow-md disabled:opacity-60 ${
            cloudSaveStatus === 'success'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
              : cloudSaveStatus === 'error'
              ? 'bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.35)]'
              : 'bg-zinc-900/90 border-[#3ECF8E]/60 text-[#3ECF8E] hover:border-[#3ECF8E] hover:bg-[#3ECF8E]/15 hover:text-white shadow-[0_0_14px_rgba(62,207,142,0.2)]'
          }`}
          title="Salvar alterações no banco de dados Supabase"
        >
          {isSavingCloud ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#3ECF8E]" />
              <span>Salvando Nuvem...</span>
            </>
          ) : cloudSaveStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Salvo na Nuvem!</span>
            </>
          ) : cloudSaveStatus === 'error' ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Erro ao Salvar</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4 text-[#3ECF8E]" />
              <span>Salvar Nuvem</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
