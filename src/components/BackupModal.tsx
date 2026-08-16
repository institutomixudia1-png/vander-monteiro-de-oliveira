import React, { useState } from 'react';
import { X, Database, Download, Upload, CheckCircle2, AlertTriangle, Globe, FolderArchive, Loader2 } from 'lucide-react';
import { downloadProjectZip } from '../utils/zipDownloader';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleDownloadNetlifyFiles = async () => {
    try {
      setIsZipping(true);
      setSuccessMsg(null);
      setErrorMsg(null);
      await downloadProjectZip();
      setSuccessMsg('Arquivo ZIP do sistema gerado e baixado com sucesso! Pronto para subir no Netlify.');
    } catch (err) {
      console.error('Erro ao gerar pacote ZIP:', err);
      setErrorMsg('Ocorreu um erro ao compactar os arquivos do projeto.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleExportBackup = () => {
    try {
      setSuccessMsg(null);
      setErrorMsg(null);

      // Coleta todas as chaves do localStorage do sistema Hunter
      const backupData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('hunter_') || key.startsWith('tce_') || key.startsWith('rescisao_') || key.startsWith('folha_'))) {
          try {
            const val = localStorage.getItem(key);
            if (val) backupData[key] = JSON.parse(val);
          } catch {
            backupData[key] = localStorage.getItem(key);
          }
        }
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `backup_hunter_desktop_${dateStr}_${timeStr}.json`;

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('Backup exportado com sucesso! Arquivo gerado.');
    } catch (err) {
      console.error('Erro ao gerar backup:', err);
      setErrorMsg('Ocorreu um erro ao gerar o arquivo de backup.');
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSuccessMsg(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Arquivo de backup inválido.');
        }

        let keysRestored = 0;
        Object.entries(parsed).forEach(([key, val]) => {
          if (typeof val === 'object') {
            localStorage.setItem(key, JSON.stringify(val));
          } else {
            localStorage.setItem(key, String(val));
          }
          keysRestored++;
        });

        if (keysRestored > 0) {
          setSuccessMsg(`Backup restaurado com sucesso! (${keysRestored} blocos de dados atualizados). Recarregando sistema...`);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setErrorMsg('Nenhum dado compatível encontrado no arquivo.');
        }
      } catch (err) {
        console.error('Erro ao importar backup:', err);
        setErrorMsg('Arquivo de backup inválido ou corrompido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-amber-500/50 rounded-2xl shadow-[0_0_40px_rgba(255,215,0,0.25)] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-[#FFD700]">
              <Database className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-amber-400">
                Backup do Sistema
              </h3>
              <p className="text-xs text-zinc-400">
                HUNTER Desktop — Exportar e Restaurar Dados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-sm flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Download Project ZIP for Netlify */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#00C7B7]/15 via-emerald-500/10 to-[#00C7B7]/15 border border-[#00C7B7]/50 space-y-3 shadow-[0_0_20px_rgba(0,199,183,0.15)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Globe className="w-4 h-4 text-[#00C7B7]" />
                Baixar Arquivos para Hospedar no Netlify
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00C7B7] text-zinc-950 uppercase tracking-wider">
                ZIP Completo
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Baixa um arquivo <b>.ZIP</b> com todo o código-fonte pronto e configurado com <code className="text-amber-300 font-mono">netlify.toml</code> e <code className="text-amber-300 font-mono">_redirects</code> para publicar diretamente no Netlify.
            </p>
            <button
              onClick={handleDownloadNetlifyFiles}
              disabled={isZipping}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00C7B7] to-teal-600 hover:from-[#00C7B7]/90 hover:to-teal-500 text-zinc-950 font-extrabold text-sm shadow-[0_0_15px_rgba(0,199,183,0.35)] hover:shadow-[0_0_20px_rgba(0,199,183,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Compactando arquivos do projeto...</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-4 h-4 text-zinc-950" />
                  <span>Baixar Pasta de Arquivos (.zip para Netlify)</span>
                </>
              )}
            </button>
          </div>

          {/* Export / Download Section */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Download className="w-4 h-4 text-[#FFD700]" />
              Fazer Backup dos Dados (Exportar JSON)
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Gera um arquivo seguro de backup contendo todos os cadastros de Empresas, Estagiários, Escolas, Contratos TCE, Seguradoras e histórico.
            </p>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-sm shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar Arquivo de Backup (.json)
            </button>
          </div>

          {/* Import / Restore Section */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-zinc-200 font-bold text-sm">
              <Upload className="w-4 h-4 text-amber-400" />
              Restaurar Backup (Importar JSON)
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Selecione um arquivo de backup (.json) exportado anteriormente para restaurar todas as informações no sistema.
            </p>
            <label className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-amber-400/50 text-zinc-200 hover:text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 text-center">
              <Upload className="w-4 h-4 text-amber-400" />
              Selecionar Arquivo de Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
