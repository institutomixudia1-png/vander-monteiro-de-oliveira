import React, { useState } from 'react';
import { X, Save, RotateCcw, FileText, FileCheck, FileX, Plus, Trash2, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';
import { HunterPDFLogo } from './HunterPDFLogo';
import { HunterWatermark } from './HunterWatermark';
import { GlowButton } from './GlowButton';
import {
  MatrizTCE,
  MatrizRescisao,
  MatrizConvenio,
  MatrizRelatorioAtividades,
  DEFAULT_MATRIZ_TCE,
  DEFAULT_MATRIZ_RESCISAO,
  DEFAULT_MATRIZ_CONVENIO,
  DEFAULT_MATRIZ_RELATORIO,
  STORAGE_KEY_MATRIZ_TCE,
  STORAGE_KEY_MATRIZ_RESCISAO,
  STORAGE_KEY_MATRIZ_CONVENIO,
  STORAGE_KEY_MATRIZ_RELATORIO,
  getMatrizTCE,
  getMatrizRescisao,
  getMatrizConvenio,
  getMatrizRelatorio,
} from '../data/matrizesDefaults';

interface MatrizesModalProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

type MatrizTab = 'tce' | 'rescisao' | 'convenio' | 'relatorio';

export const MatrizesModal: React.FC<MatrizesModalProps> = ({ isOpen, onClose, embedded = false }) => {
  const [activeTab, setActiveTab] = useState<MatrizTab>('tce');

  // Estados locais das matrizes
  const [matrizTce, setMatrizTce] = useState<MatrizTCE>(() => getMatrizTCE());
  const [matrizRescisao, setMatrizRescisao] = useState<MatrizRescisao>(() => getMatrizRescisao());
  const [matrizConvenio, setMatrizConvenio] = useState<MatrizConvenio>(() => getMatrizConvenio());
  const [matrizRelatorio, setMatrizRelatorio] = useState<MatrizRelatorioAtividades>(() => getMatrizRelatorio());

  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => {
      setSavedSuccessMsg(null);
    }, 4000);
  };

  // Funções de Salvar
  const handleSaveTCE = () => {
    localStorage.setItem(STORAGE_KEY_MATRIZ_TCE, JSON.stringify(matrizTce));
    showFeedback('Matriz do TCE salva com sucesso! Todos os novos TCEs utilizarão esta versão.');
  };

  const handleResetTCE = () => {
    if (confirm('Deseja restaurar o modelo do TCE para o padrão original do sistema?')) {
      setMatrizTce(DEFAULT_MATRIZ_TCE);
      localStorage.setItem(STORAGE_KEY_MATRIZ_TCE, JSON.stringify(DEFAULT_MATRIZ_TCE));
      showFeedback('Matriz do TCE restaurada para o padrão.');
    }
  };

  const handleSaveRescisao = () => {
    localStorage.setItem(STORAGE_KEY_MATRIZ_RESCISAO, JSON.stringify(matrizRescisao));
    showFeedback('Matriz de Rescisão salva com sucesso! Todos os novos Termos utilizarão esta versão.');
  };

  const handleResetRescisao = () => {
    if (confirm('Deseja restaurar o modelo de Rescisão para o padrão original do sistema?')) {
      setMatrizRescisao(DEFAULT_MATRIZ_RESCISAO);
      localStorage.setItem(STORAGE_KEY_MATRIZ_RESCISAO, JSON.stringify(DEFAULT_MATRIZ_RESCISAO));
      showFeedback('Matriz de Rescisão restaurada para o padrão.');
    }
  };

  const handleSaveConvenio = () => {
    localStorage.setItem(STORAGE_KEY_MATRIZ_CONVENIO, JSON.stringify(matrizConvenio));
    showFeedback('Matriz do Convênio salva com sucesso! Todos os novos Contratos utilizarão esta versão.');
  };

  const handleResetConvenio = () => {
    if (confirm('Deseja restaurar o modelo do Convênio para o padrão original do sistema?')) {
      setMatrizConvenio(DEFAULT_MATRIZ_CONVENIO);
      localStorage.setItem(STORAGE_KEY_MATRIZ_CONVENIO, JSON.stringify(DEFAULT_MATRIZ_CONVENIO));
      showFeedback('Matriz do Convênio restaurada para o padrão.');
    }
  };

  const handleSaveRelatorio = () => {
    localStorage.setItem(STORAGE_KEY_MATRIZ_RELATORIO, JSON.stringify(matrizRelatorio));
    showFeedback('Matriz do Relatório de Atividades salva com sucesso! Todos os novos Relatórios utilizarão esta versão.');
  };

  const handleResetRelatorio = () => {
    if (confirm('Deseja restaurar o modelo do Relatório de Atividades para o padrão original do sistema?')) {
      setMatrizRelatorio(DEFAULT_MATRIZ_RELATORIO);
      localStorage.setItem(STORAGE_KEY_MATRIZ_RELATORIO, JSON.stringify(DEFAULT_MATRIZ_RELATORIO));
      showFeedback('Matriz do Relatório de Atividades restaurada para o padrão.');
    }
  };

  // Manipuladores de Aspectos Avaliados no Relatório
  const handleRelatorioAspectoTitleChange = (index: number, val: string) => {
    setMatrizRelatorio((prev) => {
      const updated = [...prev.aspectosAvaliados];
      updated[index] = { ...updated[index], titulo: val };
      return { ...prev, aspectosAvaliados: updated };
    });
  };

  const handleRelatorioAspectoDescChange = (index: number, val: string) => {
    setMatrizRelatorio((prev) => {
      const updated = [...prev.aspectosAvaliados];
      updated[index] = { ...updated[index], descricao: val };
      return { ...prev, aspectosAvaliados: updated };
    });
  };

  const handleAddRelatorioAspecto = () => {
    setMatrizRelatorio((prev) => {
      const charCode = 97 + prev.aspectosAvaliados.length;
      const letra = String.fromCharCode(charCode);
      return {
        ...prev,
        aspectosAvaliados: [
          ...prev.aspectosAvaliados,
          {
            letra,
            titulo: 'Novo aspecto avaliado:',
            descricao: 'Descrição do novo aspecto avaliado no relatório de atividades.',
          },
        ],
      };
    });
  };

  const handleRemoveRelatorioAspecto = (index: number) => {
    setMatrizRelatorio((prev) => {
      const filtered = prev.aspectosAvaliados.filter((_, i) => i !== index);
      // Recalcular letras a, b, c...
      const reindexed = filtered.map((item, i) => ({
        ...item,
        letra: String.fromCharCode(97 + i),
      }));
      return { ...prev, aspectosAvaliados: reindexed };
    });
  };

  // Manipuladores de Cláusulas TCE
  const handleTceClausulaChange = (index: number, newTexto: string) => {
    setMatrizTce((prev) => {
      const updated = [...prev.clausulas];
      updated[index] = { ...updated[index], texto: newTexto };
      return { ...prev, clausulas: updated };
    });
  };

  const handleAddTceClausula = () => {
    setMatrizTce((prev) => {
      const numNext = prev.clausulas.length + 1;
      return {
        ...prev,
        clausulas: [
          ...prev.clausulas,
          {
            id: `c_${Date.now()}`,
            titulo: `Cláusula ${numNext}ª`,
            texto: 'Nova cláusula do Termo de Compromisso de Estágio.',
          },
        ],
      };
    });
  };

  const handleRemoveTceClausula = (index: number) => {
    setMatrizTce((prev) => ({
      ...prev,
      clausulas: prev.clausulas.filter((_, i) => i !== index),
    }));
  };

  // Manipuladores Convênio Atribuições
  const handleConvenioHunterChange = (index: number, val: string) => {
    setMatrizConvenio((prev) => {
      const updated = [...prev.clausula2_atribuicoesHunter];
      updated[index] = val;
      return { ...prev, clausula2_atribuicoesHunter: updated };
    });
  };

  const handleConvenioConcedenteChange = (index: number, val: string) => {
    setMatrizConvenio((prev) => {
      const updated = [...prev.clausula3_atribuicoesConcedente];
      updated[index] = val;
      return { ...prev, clausula3_atribuicoesConcedente: updated };
    });
  };

  return (
    <div className={embedded ? "w-full max-w-6xl mx-auto my-auto animate-fadeIn text-left py-2 flex flex-col flex-1" : "fixed inset-0 z-[500] bg-black/60 backdrop-blur-md w-screen h-screen flex flex-col justify-center items-center p-0 sm:p-3 animate-fadeIn text-left overflow-hidden"}>
      <div className={`bg-zinc-900/60 backdrop-blur-2xl border border-amber-400/40 rounded-2xl w-full flex flex-col overflow-hidden relative shadow-[0_12px_45px_rgba(0,0,0,0.5),0_0_35px_rgba(212,175,55,0.2)] ${embedded ? 'max-h-[85vh] my-auto' : 'h-full max-w-6xl'}`}>
        <HunterWatermark size={300} opacity="opacity-[0.08]" />

        {/* HEADER DO MODAL DE MATRIZES */}
        <div className="flex items-center justify-between border-b border-zinc-700/60 p-4 sm:p-5 shrink-0 relative z-20 bg-zinc-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <HunterPDFLogo height={38} />
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                Matrizes de Documentos <span className="text-amber-400 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">Modelos Mestre</span>
              </h2>
              <p className="text-xs text-zinc-300">
                Edite a estrutura física, cláusulas e textos padrão que não são preenchidos pelo sistema.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
            title="Fechar Matrizes"
          >
            <X className="w-5 h-5 text-[#FFD700]" />
          </button>
        </div>

        {/* FEEDBACK NOTIFICATION */}
        {savedSuccessMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 px-6 py-2.5 text-xs font-semibold flex items-center gap-2 animate-fadeIn shrink-0 z-20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {/* PARTE DE CIMA DA TELA: OS BOTÕES LADO A LADO */}
        <div className="p-4 bg-zinc-900/50 border-b border-zinc-700/50 shrink-0 relative z-20">
          <div className="text-xs text-zinc-300 font-semibold mb-2 uppercase tracking-wider text-center sm:text-left">
            Selecione a Matriz para alterar o modelo:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 max-w-3xl mx-auto sm:mx-0">
            {/* Botão 1: TCE */}
            <button
              onClick={() => setActiveTab('tce')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 border cursor-pointer text-[#FFD700] ${
                activeTab === 'tce'
                  ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_20px_rgba(255,215,0,0.35)] scale-[1.02]'
                  : 'bg-zinc-900/60 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <FileCheck className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
              <span className="text-[#FFD700]">TCE</span>
            </button>

            {/* Botão 2: Rescisão */}
            <button
              onClick={() => setActiveTab('rescisao')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 border cursor-pointer text-[#FFD700] ${
                activeTab === 'rescisao'
                  ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_20px_rgba(255,215,0,0.35)] scale-[1.02]'
                  : 'bg-zinc-900/60 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <FileX className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
              <span className="text-[#FFD700]">Rescisão</span>
            </button>

            {/* Botão 3: Convênio */}
            <button
              onClick={() => setActiveTab('convenio')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 border cursor-pointer text-[#FFD700] ${
                activeTab === 'convenio'
                  ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_20px_rgba(255,215,0,0.35)] scale-[1.02]'
                  : 'bg-zinc-900/60 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <FileText className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
              <span className="text-[#FFD700]">Convênio</span>
            </button>

            {/* Botão 4: Relatório */}
            <button
              onClick={() => setActiveTab('relatorio')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 border cursor-pointer text-[#FFD700] ${
                activeTab === 'relatorio'
                  ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_20px_rgba(255,215,0,0.35)] scale-[1.02]'
                  : 'bg-zinc-900/60 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Edit3 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
              <span className="text-[#FFD700]">Relatório</span>
            </button>
          </div>
        </div>

        {/* PARTE DE BAIXO DA TELA: O MODELO DO DOCUMENTO ONDE É POSSÍVEL ALTERAR O DOCUMENTO */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10 bg-zinc-900/40">
          
          {/* ================= TELA DA MATRIZ DO TCE ================= */}
          {activeTab === 'tce' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-amber-500/30">
                <div className="text-xs text-zinc-300">
                  <span className="font-bold text-amber-400 block text-sm">Matriz Modelo: TCE (Termo de Compromisso)</span>
                  Altere abaixo as cláusulas, títulos e textos fixos da matriz. Os dados entre colchetes em dourado representam campos que o sistema preenche na hora do cadastro.
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetTCE}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-amber-500/30 hover:border-amber-400 cursor-pointer"
                    title="Restaurar Padrão"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
                    <span>Restaurar Padrão</span>
                  </button>
                  <GlowButton onClick={handleSaveTCE} icon={<Save className="w-4 h-4" />}>
                    Salvar Matriz TCE
                  </GlowButton>
                </div>
              </div>

              {/* MODELO VISUAL A4 EDITÁVEL */}
              <div className="bg-white text-black p-6 sm:p-10 rounded-lg shadow-2xl font-sans text-xs border border-zinc-300 relative">
                <HunterWatermark size={360} opacity="opacity-[0.09]" />

                <div className="relative z-10 space-y-4 text-black">
                  {/* Título & Subtítulo Editáveis */}
                  <div className="border border-amber-400/80 bg-amber-50/50 p-3 rounded-md space-y-2 text-center">
                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Título da Matriz (Editável)
                    </label>
                    <input
                      type="text"
                      value={matrizTce.titulo}
                      onChange={(e) => setMatrizTce({ ...matrizTce, titulo: e.target.value })}
                      className="w-full text-center font-black text-sm uppercase text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none"
                    />

                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mt-2">
                      Subtítulo da Matriz (Editável)
                    </label>
                    <input
                      type="text"
                      value={matrizTce.subtitulo}
                      onChange={(e) => setMatrizTce({ ...matrizTce, subtitulo: e.target.value })}
                      className="w-full text-center font-bold text-xs uppercase text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none"
                    />

                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mt-2">
                      Fundamentação Legal (Editável)
                    </label>
                    <textarea
                      value={matrizTce.fundamentacao}
                      onChange={(e) => setMatrizTce({ ...matrizTce, fundamentacao: e.target.value })}
                      rows={2}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Demonstração de Campos Preenchidos Pelo Sistema */}
                  <div className="bg-zinc-100 p-3 rounded border border-zinc-300 text-[11px] space-y-1 opacity-80 select-none">
                    <span className="font-bold text-amber-800 text-[10px] uppercase block">
                      [ BLOCO DINÂMICO PREENCHIDO PELO SISTEMA ]
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-zinc-600 italic">
                      <div>Escola / Mantenedora: <span className="font-bold text-zinc-800">[DADOS DA ESCOLA]</span></div>
                      <div>Parte Concedente: <span className="font-bold text-zinc-800">[DADOS DA EMPRESA]</span></div>
                      <div>Agente de Integração: <span className="font-bold text-zinc-800">[HUNTER RECURSOS HUMANOS]</span></div>
                      <div>Estagiário(a): <span className="font-bold text-zinc-800">[NOME, CPF, ENDEREÇO]</span></div>
                    </div>
                  </div>

                  {/* Cláusulas Editáveis */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b pb-1 border-zinc-300">
                      <span className="font-bold text-black uppercase text-xs">Cláusulas e Condições da Matriz (Editáveis)</span>
                      <button
                        onClick={handleAddTceClausula}
                        className="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Cláusula</span>
                      </button>
                    </div>

                    {matrizTce.clausulas.map((clausula, idx) => (
                      <div key={clausula.id || idx} className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 text-xs">{clausula.titulo || `Cláusula ${idx + 1}ª`}</span>
                          {matrizTce.clausulas.length > 1 && (
                            <button
                              onClick={() => handleRemoveTceClausula(idx)}
                              className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                              title="Remover esta cláusula"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <textarea
                          value={clausula.texto}
                          onChange={(e) => handleTceClausulaChange(idx, e.target.value)}
                          rows={2}
                          className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Atribuições do Agente */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1.5 mt-4">
                    <span className="font-bold text-amber-900 text-xs block uppercase">Do Agente de Integração (Texto da Matriz)</span>
                    <textarea
                      value={matrizTce.atribuicoesAgente}
                      onChange={(e) => setMatrizTce({ ...matrizTce, atribuicoesAgente: e.target.value })}
                      rows={3}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TELA DA MATRIZ DE RESCISÃO ================= */}
          {activeTab === 'rescisao' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-amber-500/30">
                <div className="text-xs text-zinc-300">
                  <span className="font-bold text-amber-400 block text-sm">Matriz Modelo: Rescisão do TCE</span>
                  Edite os títulos, comunicados e textos explicativos fixos da matriz do Termo de Rescisão.
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetRescisao}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-amber-500/30 hover:border-amber-400 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
                    <span>Restaurar Padrão</span>
                  </button>
                  <GlowButton onClick={handleSaveRescisao} icon={<Save className="w-4 h-4" />}>
                    Salvar Matriz Rescisão
                  </GlowButton>
                </div>
              </div>

              {/* MODELO VISUAL A4 EDITÁVEL RESCISÃO */}
              <div className="bg-white text-black p-6 sm:p-10 rounded-lg shadow-2xl font-sans text-xs border border-zinc-300 relative">
                <HunterWatermark size={360} opacity="opacity-[0.09]" />

                <div className="relative z-10 space-y-4 text-black">
                  {/* Título & Subtítulo Editáveis */}
                  <div className="border border-amber-400/80 bg-amber-50/50 p-3 rounded-md space-y-2 text-center">
                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Título do Termo de Rescisão (Editável)
                    </label>
                    <input
                      type="text"
                      value={matrizRescisao.titulo}
                      onChange={(e) => setMatrizRescisao({ ...matrizRescisao, titulo: e.target.value })}
                      className="w-full text-center font-black text-sm uppercase text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none"
                    />

                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mt-2">
                      Subtítulo / Descrição Legal (Editável)
                    </label>
                    <textarea
                      value={matrizRescisao.subtitulo}
                      onChange={(e) => setMatrizRescisao({ ...matrizRescisao, subtitulo: e.target.value })}
                      rows={2}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed text-center"
                    />
                  </div>

                  {/* Demonstração de Campos Preenchidos Pelo Sistema */}
                  <div className="bg-zinc-100 p-3 rounded border border-zinc-300 text-[11px] space-y-1 opacity-80 select-none">
                    <span className="font-bold text-amber-800 text-[10px] uppercase block">
                      [ DADOS DINÂMICOS DA RESCISÃO PREENCHIDOS PELO SISTEMA ]
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-zinc-600 italic">
                      <div>Número da Rescisão: <span className="font-bold text-zinc-800">[Nº DA RESCISÃO]</span></div>
                      <div>Estagiário e Empresa: <span className="font-bold text-zinc-800">[DADOS DAS PARTES]</span></div>
                      <div>Período Estagiado: <span className="font-bold text-zinc-800">[DATA INÍCIO A DATA RESCISÃO]</span></div>
                      <div>Motivo da Rescisão: <span className="font-bold text-zinc-800">[À PEDIDO EMPRESA / ESTAGIÁRIO]</span></div>
                    </div>
                  </div>

                  {/* Texto do Comunicado */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1.5">
                    <label className="block font-bold text-amber-900 text-xs uppercase">
                      Texto de Abertura do Comunicado (Editável)
                    </label>
                    <input
                      type="text"
                      value={matrizRescisao.comunicado}
                      onChange={(e) => setMatrizRescisao({ ...matrizRescisao, comunicado: e.target.value })}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Atividade Padrão */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1.5">
                    <label className="block font-bold text-amber-900 text-xs uppercase">
                      Atividade / Função Padrão na Matriz (Editável)
                    </label>
                    <input
                      type="text"
                      value={matrizRescisao.atividadesPadrao}
                      onChange={(e) => setMatrizRescisao({ ...matrizRescisao, atividadesPadrao: e.target.value })}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Texto Fechamento / Assinaturas */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1.5">
                    <label className="block font-bold text-amber-900 text-xs uppercase">
                      Texto de Fechamento / Aceite Final (Editável)
                    </label>
                    <textarea
                      value={matrizRescisao.textoAssinaturas}
                      onChange={(e) => setMatrizRescisao({ ...matrizRescisao, textoAssinaturas: e.target.value })}
                      rows={2}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TELA DA MATRIZ DE CONVÊNIO ================= */}
          {activeTab === 'convenio' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-amber-500/30">
                <div className="text-xs text-zinc-300">
                  <span className="font-bold text-amber-400 block text-sm">Matriz Modelo: Convênio (Contrato de Parceria)</span>
                  Edite o objeto do contrato, cláusulas e atribuições do agente de integração e empresa concedente.
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetConvenio}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-amber-500/30 hover:border-amber-400 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
                    <span>Restaurar Padrão</span>
                  </button>
                  <GlowButton onClick={handleSaveConvenio} icon={<Save className="w-4 h-4" />}>
                    Salvar Matriz Convênio
                  </GlowButton>
                </div>
              </div>

              {/* MODELO VISUAL A4 EDITÁVEL CONVÊNIO */}
              <div className="bg-white text-black p-6 sm:p-10 rounded-lg shadow-2xl font-sans text-xs border border-zinc-300 relative space-y-4">
                <HunterWatermark size={360} opacity="opacity-[0.09]" />

                <div className="relative z-10 space-y-4 text-black">

                  {/* Cláusula 1ª - Objeto */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-2">
                    <span className="font-bold text-amber-900 text-xs block uppercase">Cláusula 1ª - Do Objeto (Editável)</span>
                    <textarea
                      value={matrizConvenio.clausula1_objeto}
                      onChange={(e) => setMatrizConvenio({ ...matrizConvenio, clausula1_objeto: e.target.value })}
                      rows={3}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />

                    <span className="font-bold text-amber-900 text-xs block uppercase mt-2">Parágrafo Único da Cláusula 1ª (Editável)</span>
                    <textarea
                      value={matrizConvenio.clausula1_paragrafo}
                      onChange={(e) => setMatrizConvenio({ ...matrizConvenio, clausula1_paragrafo: e.target.value })}
                      rows={3}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Cláusula 2ª - Atribuições Hunter */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-2">
                    <span className="font-bold text-amber-900 text-xs block uppercase">
                      Cláusula 2ª - Das Atribuições do Agente de Integração Hunter (Alíneas Editáveis)
                    </span>
                    {matrizConvenio.clausula2_atribuicoesHunter.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-amber-800 text-xs pt-1">{String.fromCharCode(97 + idx)})</span>
                        <textarea
                          value={item}
                          onChange={(e) => handleConvenioHunterChange(idx, e.target.value)}
                          rows={2}
                          className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Cláusula 3ª - Atribuições Concedente */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-2">
                    <span className="font-bold text-amber-900 text-xs block uppercase">
                      Cláusula 3ª - Das Atribuições da Unidade Concedente (Alíneas Editáveis)
                    </span>
                    {matrizConvenio.clausula3_atribuicoesConcedente.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-amber-800 text-xs pt-1">{String.fromCharCode(97 + idx)})</span>
                        <textarea
                          value={item}
                          onChange={(e) => handleConvenioConcedenteChange(idx, e.target.value)}
                          rows={2}
                          className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Cláusula 4ª - Valores */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-2">
                    <span className="font-bold text-amber-900 text-xs block uppercase">Cláusula 4ª - Dos Valores e Taxa Administrativa (Editável)</span>
                    <textarea
                      value={matrizConvenio.clausula4_valores}
                      onChange={(e) => setMatrizConvenio({ ...matrizConvenio, clausula4_valores: e.target.value })}
                      rows={2}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Cláusula 5ª - Vigência */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-2">
                    <span className="font-bold text-amber-900 text-xs block uppercase">Cláusula 5ª - Da Vigência (Editável)</span>
                    <textarea
                      value={matrizConvenio.clausula5_vigencia}
                      onChange={(e) => setMatrizConvenio({ ...matrizConvenio, clausula5_vigencia: e.target.value })}
                      rows={2}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Cláusula 6ª - Responsabilidades */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-2">
                    <span className="font-bold text-amber-900 text-xs block uppercase">Cláusula 6ª - Das Responsabilidades (Editável)</span>
                    <textarea
                      value={matrizConvenio.clausula6_responsabilidades}
                      onChange={(e) => setMatrizConvenio({ ...matrizConvenio, clausula6_responsabilidades: e.target.value })}
                      rows={2}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />

                    <span className="font-bold text-amber-900 text-xs block uppercase mt-2">Parágrafo Único da Cláusula 6ª (Editável)</span>
                    <textarea
                      value={matrizConvenio.clausula6_paragrafo}
                      onChange={(e) => setMatrizConvenio({ ...matrizConvenio, clausula6_paragrafo: e.target.value })}
                      rows={2}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Cláusula 7ª - Foro */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-2">
                    <span className="font-bold text-amber-900 text-xs block uppercase">Cláusula 7ª - Do Foro (Editável)</span>
                    <textarea
                      value={matrizConvenio.clausula7_foro}
                      onChange={(e) => setMatrizConvenio({ ...matrizConvenio, clausula7_foro: e.target.value })}
                      rows={2}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ================= TELA DA MATRIZ DO RELATÓRIO ================= */}
          {activeTab === 'relatorio' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-amber-500/30">
                <div className="text-xs text-zinc-300">
                  <span className="font-bold text-amber-400 block text-sm">Matriz Modelo: Relatório de Atividades de Estágio</span>
                  Edite os títulos, fundamentação legal, cargo e carga horária padrão, aspectos avaliados e considerações finais.
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetRelatorio}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-amber-500/30 hover:border-amber-400 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
                    <span>Restaurar Padrão</span>
                  </button>
                  <GlowButton onClick={handleSaveRelatorio} icon={<Save className="w-4 h-4" />}>
                    Salvar Matriz Relatório
                  </GlowButton>
                </div>
              </div>

              {/* MODELO VISUAL A4 EDITÁVEL RELATÓRIO */}
              <div className="bg-white text-black p-6 sm:p-10 rounded-lg shadow-2xl font-sans text-xs border border-zinc-300 relative space-y-4">
                <HunterWatermark size={360} opacity="opacity-[0.09]" />

                <div className="relative z-10 space-y-4 text-black">

                  {/* Título, Subtítulo e Fundamentação */}
                  <div className="border border-amber-400/80 bg-amber-50/50 p-3 rounded-md space-y-2 text-center">
                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Título do Relatório (Editável)
                    </label>
                    <input
                      type="text"
                      value={matrizRelatorio.titulo}
                      onChange={(e) => setMatrizRelatorio({ ...matrizRelatorio, titulo: e.target.value })}
                      className="w-full text-center font-black text-sm uppercase text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none"
                    />

                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mt-2">
                      Subtítulo / Descrição Legal (Editável)
                    </label>
                    <input
                      type="text"
                      value={matrizRelatorio.subtitulo}
                      onChange={(e) => setMatrizRelatorio({ ...matrizRelatorio, subtitulo: e.target.value })}
                      className="w-full text-center font-bold text-xs uppercase text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none"
                    />

                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mt-2">
                      Fundamentação Legal (Editável)
                    </label>
                    <textarea
                      value={matrizRelatorio.fundamentacao}
                      onChange={(e) => setMatrizRelatorio({ ...matrizRelatorio, fundamentacao: e.target.value })}
                      rows={2}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed text-center"
                    />
                  </div>

                  {/* Texto de Abertura / Comunicado */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1.5">
                    <label className="block font-bold text-amber-900 text-xs uppercase">
                      Texto do Comunicado de Abertura (Editável)
                    </label>
                    <textarea
                      value={matrizRelatorio.comunicado}
                      onChange={(e) => setMatrizRelatorio({ ...matrizRelatorio, comunicado: e.target.value })}
                      rows={3}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Campos Padrão de Função, Carga Horária e Cargo */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1">
                      <label className="block font-bold text-amber-900 text-[11px] uppercase">
                        Cargo Padrão do Supervisor
                      </label>
                      <input
                        type="text"
                        value={matrizRelatorio.cargoPadrao}
                        onChange={(e) => setMatrizRelatorio({ ...matrizRelatorio, cargoPadrao: e.target.value })}
                        className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1">
                      <label className="block font-bold text-amber-900 text-[11px] uppercase">
                        Carga Horária Padrão
                      </label>
                      <input
                        type="text"
                        value={matrizRelatorio.horasSemanais}
                        onChange={(e) => setMatrizRelatorio({ ...matrizRelatorio, horasSemanais: e.target.value })}
                        className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1">
                      <label className="block font-bold text-amber-900 text-[11px] uppercase">
                        Atividade Padrão do Estagiário
                      </label>
                      <input
                        type="text"
                        value={matrizRelatorio.atividadePadrao}
                        onChange={(e) => setMatrizRelatorio({ ...matrizRelatorio, atividadePadrao: e.target.value })}
                        className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-1.5 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Aspectos Avaliados */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b pb-1 border-zinc-300">
                      <span className="font-bold text-black uppercase text-xs">Aspectos Avaliados do Estágio (Editáveis)</span>
                      <button
                        onClick={handleAddRelatorioAspecto}
                        className="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Aspecto</span>
                      </button>
                    </div>

                    {matrizRelatorio.aspectosAvaliados.map((item, idx) => (
                      <div key={idx} className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-bold text-amber-900 text-xs">{item.letra})</span>
                            <input
                              type="text"
                              value={item.titulo}
                              onChange={(e) => handleRelatorioAspectoTitleChange(idx, e.target.value)}
                              className="font-bold text-xs text-black bg-white border border-zinc-300 rounded p-1 flex-1 focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                          {matrizRelatorio.aspectosAvaliados.length > 1 && (
                            <button
                              onClick={() => handleRemoveRelatorioAspecto(idx)}
                              className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                              title="Remover este aspecto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <textarea
                          value={item.descricao}
                          onChange={(e) => handleRelatorioAspectoDescChange(idx, e.target.value)}
                          rows={2}
                          className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Considerações Finais */}
                  <div className="p-3 bg-amber-50/40 border border-amber-300/80 rounded space-y-1.5">
                    <label className="block font-bold text-amber-900 text-xs uppercase">
                      4) Considerações sobre o período de estágio (Editável)
                    </label>
                    <textarea
                      value={matrizRelatorio.consideracoesFinais}
                      onChange={(e) => setMatrizRelatorio({ ...matrizRelatorio, consideracoesFinais: e.target.value })}
                      rows={3}
                      className="w-full text-xs text-black bg-white border border-zinc-300 rounded p-2 focus:border-amber-500 focus:outline-none leading-relaxed text-justify"
                    />
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
