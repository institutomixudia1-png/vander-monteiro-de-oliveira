import React, { useState } from 'react';
import { Database, CloudUpload, CloudDownload, HardDrive, CheckCircle2, AlertTriangle, Loader2, X, RefreshCw } from 'lucide-react';
import { syncAllToSupabase, restoreFromSupabase, getAllHunterLocalData } from '../lib/supabase';

interface BancoDadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const BancoDadosModal: React.FC<BancoDadosModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const localData = getAllHunterLocalData();
  const totalBlocos = Object.keys(localData).length;

  const handleSalvarNuvem = async () => {
    try {
      setIsSaving(true);
      setFeedback(null);
      const res = await syncAllToSupabase();
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Banco de dados sincronizado e gravado na Nuvem com sucesso!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Erro ao sincronizar com a nuvem.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Falha na conexão com a nuvem.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestaurarNuvem = async () => {
    try {
      setIsRestoring(true);
      setFeedback(null);
      const res = await restoreFromSupabase();
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Restauração concluída! ${res.count || 0} cadastros carregados com sucesso.`,
        });
        if (onDataRestored) {
          onDataRestored();
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Erro ao restaurar dados da nuvem.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Falha na conexão ao restaurar da nuvem.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 text-zinc-100 shadow-[0_0_50px_rgba(251,191,36,0.15)] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Banco de Dados & Nuvem
            </h3>
            <p className="text-xs text-zinc-400">
              Sincronização persistente para proteger cadastros e dados reais
            </p>
          </div>
        </div>

        {/* Info card */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              Cadastros armazenados no dispositivo:
            </span>
            <span className="font-bold font-mono text-amber-300">{totalBlocos} tabelas ativas</span>
          </div>
          <div className="text-[11px] text-zinc-400 leading-relaxed">
            Seus cadastros reais (Empresas, Estagiários, Escolas, Contratos, Seguradoras, Demandas) ficam salvos no seu navegador e são sincronizados com o banco de dados na Nuvem.
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-3 rounded-xl mb-5 text-xs flex items-start gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/20 border border-red-500/40 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleSalvarNuvem}
            disabled={isSaving || isRestoring}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 hover:text-white font-bold text-xs shadow-[0_0_15px_rgba(251,191,36,0.2)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <CloudUpload className="w-4 h-4 text-amber-400" />
            )}
            <span>Salvar na Nuvem Agora</span>
          </button>

          <button
            onClick={handleRestaurarNuvem}
            disabled={isSaving || isRestoring}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isRestoring ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <CloudDownload className="w-4 h-4 text-blue-400" />
            )}
            <span>Restaurar da Nuvem</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-400">
            ✓ O salvamento automático já sincroniza as alterações periodicamente na Nuvem.
          </p>
        </div>
      </div>
    </div>
  );
};
