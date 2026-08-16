import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { HunterLogo } from './HunterLogo';
import { HunterWatermark } from './HunterWatermark';

interface RedefinirSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePassword: (newPass: string) => void;
}

export const RedefinirSenhaModal: React.FC<RedefinirSenhaModalProps> = ({
  isOpen,
  onClose,
  onSavePassword,
}) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validações
    const passDigits = novaSenha.replace(/\D/g, '');
    if (passDigits.length !== 6) {
      setErrorMsg('A senha deve conter exatamente 6 dígitos numéricos.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErrorMsg('A confirmação de senha não confere com a nova senha digitada.');
      return;
    }

    onSavePassword(passDigits);
    setSuccessMsg('Senha alterada com sucesso! A nova senha será exigida no próximo acesso.');
    setTimeout(() => {
      setNovaSenha('');
      setConfirmarSenha('');
      setSuccessMsg('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black animate-fadeIn select-none">
      <div className="bg-zinc-950 border border-amber-500/50 rounded-3xl max-w-md w-full p-6 md:p-8 shadow-[0_0_50px_rgba(212,175,55,0.3)] relative overflow-hidden">
        <HunterWatermark size={240} opacity="opacity-[0.15]" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <HunterLogo size={36} glow={true} />
            <div>
              <h3 className="text-lg font-extrabold text-white">
                Redefinir <span className="text-gold-gradient-bright">Senha do Sistema</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Digite a nova senha de 6 dígitos para o sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.3)]"
            title="Fechar"
          >
            <X className="w-4 h-4 text-[#FFD700]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nova Senha (6 Dígitos Numéricos) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                maxLength={6}
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 123456"
                className="w-full bg-zinc-900 border border-amber-500/30 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.3em] text-[#39FF14] focus:outline-none focus:border-amber-400"
                style={{ color: '#39FF14' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-300 p-1 cursor-pointer"
                title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Confirmar Nova Senha *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              maxLength={6}
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value.replace(/\D/g, ''))}
              placeholder="Digite novamente a nova senha"
              className="w-full bg-zinc-900 border border-amber-500/30 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.3em] text-[#39FF14] focus:outline-none focus:border-amber-400"
              style={{ color: '#39FF14' }}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-zinc-950 font-extrabold text-xs hover:brightness-110 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,215,0,0.4)] flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Salvar Senha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
