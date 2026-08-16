import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, ArrowRight, HelpCircle, Loader2, CloudDownload, CheckCircle2 } from 'lucide-react';
import { HunterLogo } from './HunterLogo';
import { HunterWatermark } from './HunterWatermark';
import { FORGOT_SYSTEM_PASSWORD } from '../types/hunter';
import { restoreFromSupabase } from '../lib/supabase';

interface SystemLockScreenProps {
  currentPassword: string;
  onUnlock: () => void;
  onUpdatePassword: (newPass: string) => void;
}

export const SystemLockScreen: React.FC<SystemLockScreenProps> = ({
  currentPassword,
  onUnlock,
  onUpdatePassword,
}) => {
  const [inputSenha, setInputSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [adminNotice, setAdminNotice] = useState(false);
  const [isRestoringCloud, setIsRestoringCloud] = useState(false);
  const [cloudStatusText, setCloudStatusText] = useState('');

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPass = inputSenha.trim();
    if (cleanPass === currentPassword) {
      // Baixar banco de dados da nuvem e restaurar instantaneamente
      setIsRestoringCloud(true);
      setCloudStatusText('Sincronizando com a nuvem Supabase...');

      try {
        const res = await restoreFromSupabase();
        if (res.success) {
          setCloudStatusText('Banco de dados da nuvem restaurado!');
        } else {
          console.warn('Aviso ao sincronizar da nuvem:', res.message);
        }
      } catch (err: any) {
        console.warn('Não foi possível sincronizar da nuvem:', err);
      } finally {
        setTimeout(() => {
          setIsRestoringCloud(false);
          onUnlock();
        }, 500);
      }
    } else {
      setErrorMsg('Senha incorreta! Digite a senha de 6 dígitos válida.');
    }
  };

  const handleForgotPass = () => {
    // Ao clicar em "Esqueci minha senha":
    // 1. Apresenta mensagem "Entre em contato com o administrador do sistema"
    // 2. A senha atual deixa de funcionar e a senha (203040) inicia o sistema
    setAdminNotice(true);
    setErrorMsg('');
    onUpdatePassword(FORGOT_SYSTEM_PASSWORD);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black animate-fadeIn select-none">
      <div className="bg-zinc-950 border border-amber-500/50 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-[0_0_60px_rgba(212,175,55,0.35)] relative overflow-hidden text-center">
        <HunterWatermark size={280} opacity="opacity-[0.18]" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo & Lock Icon */}
          <div className="relative mb-4">
            <HunterLogo size={64} glow={true} />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-zinc-950 flex items-center justify-center text-zinc-950 shadow-lg">
              <Lock className="w-4 h-4 font-bold" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white mb-1 tracking-wide">
            HUNTER <span className="text-gold-gradient-bright">DESKTOP</span>
          </h2>
          <p className="text-xs font-semibold text-amber-300/90 mb-6 uppercase tracking-widest">
            Acesso Restrito ao Sistema
          </p>

          {/* Banner Mensagem "Entre em contato com o administrador do sistema" */}
          {adminNotice && (
            <div className="w-full p-4 mb-5 rounded-2xl bg-amber-500/10 border-2 border-amber-400/80 text-left animate-fadeIn shadow-[0_0_20px_rgba(212,175,55,0.25)]">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-extrabold text-amber-300 mb-1">
                    Entre em contato com o administrador do sistema
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Sua senha atual foi substituída pela senha padrão de contingência do sistema: <span className="font-mono font-bold text-[#39FF14] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">203040</span>.
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Digite <b>203040</b> no campo abaixo para iniciar o sistema.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado de Restauração da Nuvem */}
          {isRestoringCloud && (
            <div className="w-full p-4 mb-4 rounded-2xl bg-[#3ECF8E]/15 border border-[#3ECF8E]/40 text-left animate-fadeIn flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-[#3ECF8E] shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-[#3ECF8E]">
                  Restaurando dados da nuvem Supabase
                </p>
                <p className="text-[11px] text-zinc-300">
                  {cloudStatusText || 'Atualizando cadastros no navegador...'}
                </p>
              </div>
            </div>
          )}

          {/* Formulário da Senha */}
          <form onSubmit={handleUnlockSubmit} className="w-full space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/90 border border-red-500/60 text-red-300 text-xs flex items-center justify-center gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Digite a senha de 6 dígitos:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  maxLength={6}
                  required
                  autoFocus
                  disabled={isRestoringCloud}
                  value={inputSenha}
                  onChange={(e) => setInputSenha(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full bg-zinc-900/90 border border-amber-500/40 rounded-2xl px-4 py-3.5 text-center text-2xl font-mono tracking-[0.4em] text-[#39FF14] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 transition-all shadow-inner disabled:opacity-50"
                  style={{ color: '#39FF14' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-300 p-1.5 cursor-pointer transition-colors"
                  title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRestoringCloud}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-zinc-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_25px_rgba(255,215,0,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRestoringCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Sincronizando Nuvem...</span>
                </>
              ) : (
                <>
                  <span>Acessar Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Botão Esqueci minha senha */}
          <div className="mt-5 pt-4 border-t border-zinc-800/80 w-full flex justify-center">
            <button
              type="button"
              onClick={handleForgotPass}
              className="text-xs font-bold text-amber-400/90 hover:text-amber-300 underline underline-offset-4 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Esqueci minha senha</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
