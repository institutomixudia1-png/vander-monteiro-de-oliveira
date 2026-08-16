import React from 'react';
import { X, HardDriveDownload, Monitor, Apple, Terminal, CheckCircle2, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { HunterLogo } from './HunterLogo';
import { HunterWatermark } from './HunterWatermark';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const handleInstallPWA = () => {
    // If browser supports PWA installation prompt, trigger or explain
    alert('Dica para instalar no Computador:\n\nNo Chrome ou Edge, clique no ícone de "Instalar aplicativo" (ícone de monitor ou +) na barra de endereços do navegador para instalar o Hunter Desktop direto na sua área de trabalho!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn select-none">
      <div className="bg-zinc-950 border border-amber-500/50 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(212,175,55,0.28)] relative max-h-[90vh] flex flex-col overflow-hidden">
        <HunterWatermark size={220} opacity="opacity-[0.16]" />
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <HunterLogo size={36} glow={true} />
            <div>
              <h3 className="text-xl font-extrabold text-white">
                Instalar <span className="text-gold-gradient-bright">Hunter Desktop</span> no Computador
              </h3>
              <p className="text-xs text-zinc-400">
                Aplicativo compatível com Windows, macOS e Linux
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
            title="Fechar"
          >
            <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
          </button>
        </div>

        {/* Content options - com barra de rolamento */}
        <div className="space-y-6 text-left overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-amber-500/40 scrollbar-track-zinc-900">
          {/* Option 1: One-click PWA Desktop Install */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/60 shadow-[0_0_20px_rgba(235,190,40,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-black uppercase tracking-wider">
                    Recomendado
                  </span>
                  <span className="text-sm font-bold text-white">
                    Instalação Instantânea PWA (Desktop)
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Adiciona o Hunter Desktop como um aplicativo nativo independente com ícone na Área de Trabalho e Menu Iniciar.
                </p>
              </div>

              <button
                onClick={handleInstallPWA}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 font-extrabold text-xs shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <HardDriveDownload className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Instalar Agora</span>
              </button>
            </div>
          </div>

          {/* OS instructions grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Windows */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div className="font-bold text-white text-sm">Windows 10/11</div>
              <p className="text-[11px] text-zinc-400">
                Abra no Chrome ou Edge e clique em <b>"Instalar Hunter Desktop"</b> no canto superior da barra de URL.
              </p>
            </div>

            {/* macOS */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Apple className="w-5 h-5" />
              </div>
              <div className="font-bold text-white text-sm">macOS (Apple Silicon / Intel)</div>
              <p className="text-[11px] text-zinc-400">
                No Chrome ou Safari, selecione <b>Arquivo → Adicionar ao Dock</b> para rodar em tela cheia como app nativo.
              </p>
            </div>

            {/* Linux */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="font-bold text-white text-sm">Linux Desktop</div>
              <p className="text-[11px] text-zinc-400">
                Suporte completo no Chromium ou Firefox para rodar como WebApp independente no sistema.
              </p>
            </div>
          </div>

          {/* Features note */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-zinc-300">
              <b>Armazenamento Local Seguro:</b> Seus cadastros de escolas, empresas e estagiários são salvos diretamente no seu computador com persistência no navegador.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 font-bold text-sm transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
