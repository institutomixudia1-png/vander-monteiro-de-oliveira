import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, DollarSign, Calendar, Users, FileText, CheckCircle2, Building2, Save, Download, Loader2, Copy, ExternalLink } from 'lucide-react';
import { ContratoParceria, TCEContrato, HunterDados, FolhaPagamentoSalva, FolhaEstagiarioItem, getEstagiariosAtivosDaEmpresa } from '../types/hunter';
import { TermoRescisaoData } from './TermoRescisaoPDFModal';
import { HunterWatermark } from './HunterWatermark';
import { HunterPDFLogo } from './HunterPDFLogo';
import html2pdf from 'html2pdf.js';

const getHtml2Pdf = () => {
  if (typeof window !== 'undefined' && (window as any).html2pdf) {
    return (window as any).html2pdf;
  }
  if (typeof html2pdf === 'function') {
    return html2pdf;
  }
  if (html2pdf && typeof (html2pdf as any).default === 'function') {
    return (html2pdf as any).default;
  }
  return null;
};

interface FolhaValores {
  faltas: string;
  bonificacoes: string;
  adiantamento: string;
}

interface FolhaPagamentoModalProps {
  contratoEmpresa: ContratoParceria;
  tces: TCEContrato[];
  rescisoes: TermoRescisaoData[];
  hunterDados: HunterDados | null;
  onSaveFolha?: (folha: FolhaPagamentoSalva) => void;
  onClose: () => void;
}

// Helper de formatação de valores numéricos
function parseVal(v: string | number | undefined): number {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  const clean = String(v).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function fmtVal(num: number): string {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDataInicio(dataStr: string, defaultYear: number): { day: number; month: number; year: number } {
  if (!dataStr || dataStr === '—') {
    return { day: 1, month: 1, year: defaultYear };
  }

  const MONTH_MAP: Record<string, number> = {
    'janeiro': 1, 'jan': 1, '01': 1, '1': 1,
    'fevereiro': 2, 'fev': 2, '02': 2, '2': 2,
    'março': 3, 'marco': 3, 'mar': 3, '03': 3, '3': 3,
    'abril': 4, 'abr': 4, '04': 4, '4': 4,
    'maio': 5, 'mai': 5, '05': 5, '5': 5,
    'junho': 6, 'jun': 6, '06': 6, '6': 6,
    'julho': 7, 'jul': 7, '07': 7, '7': 7,
    'agosto': 8, 'ago': 8, '08': 8, '8': 8,
    'setembro': 9, 'set': 9, '09': 9, '9': 9,
    'outubro': 10, 'out': 10, '10': 10,
    'novembro': 11, 'nov': 11, '11': 11,
    'dezembro': 12, 'dez': 12, '12': 12,
  };

  const clean = dataStr.trim().toLowerCase();

  if (clean.includes('/')) {
    const parts = clean.split('/');
    const d = parseInt(parts[0], 10) || 1;
    let m = MONTH_MAP[parts[1]] || parseInt(parts[1], 10) || 1;
    let y = defaultYear;
    if (parts[2]) {
      const parsedY = parseInt(parts[2], 10);
      if (parsedY < 100) y = 2000 + parsedY;
      else if (parsedY > 1900) y = parsedY;
    }
    return { day: d, month: m, year: y };
  }

  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts[0].length === 4) {
      const y = parseInt(parts[0], 10) || defaultYear;
      const m = parseInt(parts[1], 10) || 1;
      const d = parseInt(parts[2], 10) || 1;
      return { day: d, month: m, year: y };
    } else {
      const d = parseInt(parts[0], 10) || 1;
      const m = parseInt(parts[1], 10) || 1;
      const y = parseInt(parts[2], 10) || defaultYear;
      return { day: d, month: m, year: y };
    }
  }

  const words = clean.split(/\s+/).filter(w => w !== 'de');
  if (words.length >= 2) {
    const d = parseInt(words[0], 10) || 1;
    const m = MONTH_MAP[words[1]] || 1;
    let y = defaultYear;
    if (words[2]) {
      const parsedY = parseInt(words[2], 10);
      if (parsedY > 1900) y = parsedY;
    }
    return { day: d, month: m, year: y };
  }

  return { day: 1, month: 1, year: defaultYear };
}

function isDataRetroativa(
  dataInicioStr: string,
  refMesStr: string,
  refAnoStr: string | number
): boolean {
  if (!dataInicioStr || dataInicioStr === '—') return false;

  const MONTH_MAP: Record<string, number> = {
    'janeiro': 1, 'jan': 1, '01': 1, '1': 1,
    'fevereiro': 2, 'fev': 2, '02': 2, '2': 2,
    'março': 3, 'marco': 3, 'mar': 3, '03': 3, '3': 3,
    'abril': 4, 'abr': 4, '04': 4, '4': 4,
    'maio': 5, 'mai': 5, '05': 5, '5': 5,
    'junho': 6, 'jun': 6, '06': 6, '6': 6,
    'julho': 7, 'jul': 7, '07': 7, '7': 7,
    'agosto': 8, 'ago': 8, '08': 8, '8': 8,
    'setembro': 9, 'set': 9, '09': 9, '9': 9,
    'outubro': 10, 'out': 10, '10': 10,
    'novembro': 11, 'nov': 11, '11': 11,
    'dezembro': 12, 'dez': 12, '12': 12,
  };

  const cleanMes = String(refMesStr).trim().toLowerCase();
  let refMonth = MONTH_MAP[cleanMes];

  if (!refMonth) {
    const parts = cleanMes.split('/');
    if (parts.length > 0) {
      refMonth = MONTH_MAP[parts[0].trim()];
    }
  }

  if (!refMonth) {
    const parsedNum = parseInt(cleanMes, 10);
    if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 12) {
      refMonth = parsedNum;
    }
  }

  let refYear = typeof refAnoStr === 'number' ? refAnoStr : parseInt(String(refAnoStr), 10);
  if (isNaN(refYear)) {
    refYear = new Date().getFullYear();
  }

  const { month: startMonth, year: startYear } = parseDataInicio(dataInicioStr, refYear);

  if (!refMonth) return false;

  if (refYear < startYear) return true;
  if (refYear === startYear && refMonth < startMonth) return true;

  return false;
}

function calcularDiasTrabalhados(
  dataInicioStr: string,
  refMesStr: string,
  refAnoStr: string | number
): number {
  if (isDataRetroativa(dataInicioStr, refMesStr, refAnoStr)) {
    return 0;
  }

  if (!dataInicioStr || dataInicioStr === '—') return 30;

  const MONTH_MAP: Record<string, number> = {
    'janeiro': 1, 'jan': 1, '01': 1, '1': 1,
    'fevereiro': 2, 'fev': 2, '02': 2, '2': 2,
    'março': 3, 'marco': 3, 'mar': 3, '03': 3, '3': 3,
    'abril': 4, 'abr': 4, '04': 4, '4': 4,
    'maio': 5, 'mai': 5, '05': 5, '5': 5,
    'junho': 6, 'jun': 6, '06': 6, '6': 6,
    'julho': 7, 'jul': 7, '07': 7, '7': 7,
    'agosto': 8, 'ago': 8, '08': 8, '8': 8,
    'setembro': 9, 'set': 9, '09': 9, '9': 9,
    'outubro': 10, 'out': 10, '10': 10,
    'novembro': 11, 'nov': 11, '11': 11,
    'dezembro': 12, 'dez': 12, '12': 12,
  };

  const cleanMes = String(refMesStr).trim().toLowerCase();
  let refMonth = MONTH_MAP[cleanMes];

  if (!refMonth) {
    const parts = cleanMes.split('/');
    if (parts.length > 0) {
      refMonth = MONTH_MAP[parts[0].trim()];
    }
  }

  if (!refMonth) {
    const parsedNum = parseInt(cleanMes, 10);
    if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 12) {
      refMonth = parsedNum;
    }
  }

  let refYear = typeof refAnoStr === 'number' ? refAnoStr : parseInt(String(refAnoStr), 10);
  if (isNaN(refYear)) {
    refYear = new Date().getFullYear();
  }

  const { day: startDay, month: startMonth, year: startYear } = parseDataInicio(dataInicioStr, refYear);

  if (!refMonth) return 30;

  if (startYear === refYear && startMonth === refMonth) {
    const totalDaysInMonth = new Date(refYear, refMonth, 0).getDate();
    const diasCorridos = totalDaysInMonth - startDay + 1;
    return Math.max(1, Math.min(totalDaysInMonth, diasCorridos));
  }

  return 30;
}

export const FolhaPagamentoModal: React.FC<FolhaPagamentoModalProps> = ({
  contratoEmpresa,
  tces,
  rescisoes,
  hunterDados,
  onSaveFolha,
  onClose,
}) => {
  const empresa = contratoEmpresa.empresa;

  // Data atual para valores padrão de Referência e Ano
  const now = new Date();
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentMonth = meses[now.getMonth()];
  const currentYear = String(now.getFullYear());

  const [referencia, setReferencia] = useState(currentMonth);
  const [ano, setAno] = useState(currentYear);

  // Obter estagiários do TCE desta empresa que estejam ATIVOS (não rescindidos)
  const estagiariosAtivos = getEstagiariosAtivosDaEmpresa(tces, rescisoes, contratoEmpresa);

  // Chave do localStorage para salvar os valores preenchidos nesta folha
  const storageKey = `hunter_folha_${empresa.id || empresa.cnpj}_${referencia}_${ano}`;

  const [valores, setValores] = useState<Record<string, FolhaValores>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Salvar no localStorage sempre que os valores mudarem
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(valores));
    } catch (err) {
      console.error('Erro ao salvar folha de pagamento:', err);
    }
  }, [valores, storageKey]);

  const handleInputChange = (tceId: string, field: keyof FolhaValores, value: string) => {
    setValores((prev) => ({
      ...prev,
      [tceId]: {
        faltas: prev[tceId]?.faltas || '',
        bonificacoes: prev[tceId]?.bonificacoes || '',
        adiantamento: prev[tceId]?.adiantamento || '',
        [field]: value,
      },
    }));
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const pdfDocRef = useRef<HTMLDivElement>(null);

  const handleCopyEmailAndOpenAutentique = async () => {
    const emailToCopy = empresa?.email?.trim() || contratoEmpresa?.empresa?.email?.trim();
    if (emailToCopy) {
      try {
        await navigator.clipboard.writeText(emailToCopy);
        setCopiedStatus(`E-mail da empresa (${emailToCopy}) copiado para a área de transferência!`);
      } catch (err) {
        console.error('Erro ao copiar e-mail:', err);
      }
    } else {
      setCopiedStatus('Nenhum e-mail de empresa cadastrado. Abrindo Autentique...');
    }
    window.open('https://painel.autentique.com.br/documentos/novo', '_blank');

    setTimeout(() => {
      setCopiedStatus(null);
    }, 6000);
  };

  const handlePrintAndSave = async () => {
    // 1. Copiar e-mail da empresa para a área de transferência
    const emailToCopy = empresa?.email?.trim() || contratoEmpresa?.empresa?.email?.trim();
    if (emailToCopy) {
      try {
        await navigator.clipboard.writeText(emailToCopy);
        setCopiedStatus(`E-mail (${emailToCopy}) copiado para a área de transferência!`);
      } catch (err) {
        console.error('Erro ao copiar e-mail:', err);
      }
    } else {
      setCopiedStatus('Empresa sem e-mail cadastrado. Gerando folha...');
    }

    // 2. Abrir página Autentique em nova aba
    window.open('https://painel.autentique.com.br/documentos/novo', '_blank');

    // 3. Montar o objeto FolhaPagamentoSalva para guardar na aba "Documentos" -> "Folha"
    const itensFolha: FolhaEstagiarioItem[] = estagiariosAtivos.map((tceItem) => {
      const val = valores[tceItem.id] || { faltas: '', bonificacoes: '', adiantamento: '' };
      return {
        tce: tceItem,
        faltas: val.faltas,
        bonificacoes: val.bonificacoes,
        adiantamento: val.adiantamento,
      };
    });

    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const novaFolha: FolhaPagamentoSalva = {
      id: `folha_${Date.now()}`,
      numeroFolha: `FOLHA-${String(Date.now()).slice(-4)}`,
      empresa,
      contratoEmpresa,
      referencia,
      ano,
      dataEmissao: dataHoje,
      estagiariosAtivos: itensFolha,
    };

    if (onSaveFolha) {
      onSaveFolha(novaFolha);
    }

    // 4. Download do PDF para a pasta Downloads
    if (pdfDocRef.current) {
      setIsDownloading(true);
      const filename = `Hunter_Folha_Pagamento_${referencia}_${ano}_${(empresa.razaoSocial || empresa.nomeFantasia || 'Empresa').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

      const opt: any = {
        margin: [0, 0, 0, 0],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      const pdfWorker = getHtml2Pdf();
      if (pdfWorker) {
        pdfWorker()
          .set(opt)
          .from(pdfDocRef.current)
          .save()
          .then(() => {
            setIsDownloading(false);
          })
          .catch((err: any) => {
            console.error('Erro ao gerar PDF da folha:', err);
            window.print();
            setIsDownloading(false);
          });
      } else {
        window.print();
        setIsDownloading(false);
      }
    } else {
      window.print();
    }

    setTimeout(() => {
      setCopiedStatus(null);
    }, 6000);
  };

  // Mapeamentos dos nomes pedidos pelo usuário
  const cici = empresa.razaoSocial || empresa.nomeFantasia || empresa.nome || 'Empresa';
  const coco = empresa.cnpj || '—';
  const caca = referencia || '—';
  const cece = ano || '—';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black animate-fadeIn overflow-hidden">
      <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.35)] overflow-hidden relative">
        <HunterWatermark size={260} opacity="opacity-[0.08]" />

        {/* HEADER DO MODAL (Não impresso) */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0 print:hidden relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#FFD700]">
              <DollarSign className="w-5 h-5 drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-400 text-black uppercase tracking-wider">
                  Folha de Pagamento
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Contrato Nº {contratoEmpresa.numero}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#39FF14] mt-0.5" style={{ color: '#39FF14' }}>
                {cici}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopyEmailAndOpenAutentique}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              title="Copiar e-mail da empresa e abrir Autentique"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copiar E-mail & Autentique</span>
            </button>

            <button
              type="button"
              onClick={handlePrintAndSave}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/60 hover:bg-amber-500/35 text-[#FFD700] hover:text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              title="Salvar folha, baixar PDF, copiar e-mail da empresa e abrir Autentique"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#FFD700] animate-spin" />
                  <span>Gerando Folha PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  <span className="text-[#FFD700] font-bold">Imprimir Folha e Salvar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
              title="Fechar"
            >
              <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
            </button>
          </div>
        </div>

        {copiedStatus && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-6 py-2.5 text-center text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 animate-fadeIn relative z-20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{copiedStatus}</span>
          </div>
        )}

        {/* CONTEÚDO TELA (VISÍVEL NO MONITOR) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 print:hidden relative z-10">
          
          {/* CABEÇALHO COM DADOS DA EMPRESA E CAIXAS DE REFERÊNCIA E ANO */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-zinc-800/80">
              <div>
                <span className="text-xs text-zinc-400 block font-semibold mb-0.5">Empresa / Parte Concedente</span>
                <span className="font-bold text-[#39FF14] text-sm" style={{ color: '#39FF14' }}>
                  {cici}
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block font-semibold mb-0.5">CNPJ</span>
                <span className="font-mono text-[#39FF14] text-sm" style={{ color: '#39FF14' }}>
                  {coco}
                </span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block font-semibold mb-0.5">Dia de Pagamento</span>
                <span className="text-[#39FF14] text-sm font-semibold" style={{ color: '#39FF14' }}>
                  Dia {contratoEmpresa.diaPagamento || '10'} de cada mês
                </span>
              </div>
            </div>

            {/* AS 2 CAIXAS DE TEXTO PEDIDAS: REFERÊNCIA E ANO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-xl border border-amber-500/30">
              <div>
                <label className="block text-xs font-bold text-[#FFD700] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Referência:</span>
                </label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ex: Janeiro, Fevereiro, Agosto..."
                  className="w-full bg-zinc-900 border border-amber-500/40 rounded-lg px-3 py-2 text-[#39FF14] font-semibold text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-zinc-600"
                  style={{ color: '#39FF14' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#FFD700] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ano:</span>
                </label>
                <input
                  type="text"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  placeholder="Ex: 2026"
                  className="w-full bg-zinc-900 border border-amber-500/40 rounded-lg px-3 py-2 text-[#39FF14] font-semibold text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-zinc-600"
                  style={{ color: '#39FF14' }}
                />
              </div>
            </div>
          </div>

          {/* LISTA DE ESTAGIÁRIOS ATIVOS COM AS 3 CAIXAS DE TEXTO (FALTAS, BONIFICAÇÕES, ADIANTAMENTO) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FFD700]" />
                <span>Estagiários Ativos na Empresa ({estagiariosAtivos.length})</span>
              </h4>
              <span className="text-xs text-zinc-400">Preencha os valores individuais abaixo:</span>
            </div>

            {estagiariosAtivos.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 text-center">
                <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>
                  Nenhum estagiário ativo nesta empresa no momento.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Os estagiários vinculados via TCE que não foram rescindidos aparecerão listados aqui.
                </p>
              </div>
            ) : (
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/90 text-[11px] font-bold uppercase tracking-wider text-[#FFD700]">
                        <th className="py-3 px-4 w-[35%]">Estagiário / CPF</th>
                        <th className="py-3 px-4 w-[15%]">Bolsa</th>
                        <th className="py-3 px-4 w-[16%]">Faltas</th>
                        <th className="py-3 px-4 w-[17%]">Bonificação</th>
                        <th className="py-3 px-4 w-[17%]">Adiantamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-sm">
                      {estagiariosAtivos.map((tceItem) => {
                        const val = valores[tceItem.id] || { faltas: '', bonificacoes: '', adiantamento: '' };
                        const lele = (tceItem as any).dataInicio || tceItem.dataContrato || tceItem.dataCriacao || '—';
                        const retro = isDataRetroativa(lele, caca, cece);
                        return (
                          <tr key={tceItem.id} className="hover:bg-zinc-900/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#39FF14]" style={{ color: '#39FF14' }}>
                                {tceItem.estagiario?.nome || 'Estagiário não informado'}
                              </div>
                              <div className="text-[11px] text-[#39FF14] font-mono mt-0.5 flex items-center gap-1" style={{ color: '#39FF14' }}>
                                <span>CPF: {tceItem.estagiario?.cpf || '—'} • Início: {lele}</span>
                                {retro && (
                                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-sans font-bold border border-amber-500/30">
                                    Retroativo (R$ 0,00)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-[#39FF14] text-xs" style={{ color: '#39FF14' }}>
                                {retro ? 'R$ 0,00' : `R$ ${tceItem.valor || '—'}`}
                              </span>
                            </td>
                            {/* CAIXA 1: FALTAS */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={retro ? '0' : val.faltas}
                                disabled={retro}
                                onChange={(e) => handleInputChange(tceItem.id, 'faltas', e.target.value)}
                                placeholder={retro ? '0' : 'Faltas'}
                                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-[#39FF14] focus:outline-none transition-all placeholder-zinc-600 font-mono disabled:opacity-50 font-bold"
                                style={{ color: '#39FF14' }}
                              />
                            </td>
                            {/* CAIXA 2: BONIFICAÇÕES */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={retro ? '0,00' : val.bonificacoes}
                                disabled={retro}
                                onChange={(e) => handleInputChange(tceItem.id, 'bonificacoes', e.target.value)}
                                placeholder={retro ? '0,00' : 'Bonificação'}
                                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-[#39FF14] focus:outline-none transition-all placeholder-zinc-600 font-mono disabled:opacity-50 font-bold"
                                style={{ color: '#39FF14' }}
                              />
                            </td>
                            {/* CAIXA 3: ADIANTAMENTO */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={retro ? '0,00' : val.adiantamento}
                                disabled={retro}
                                onChange={(e) => handleInputChange(tceItem.id, 'adiantamento', e.target.value)}
                                placeholder={retro ? '0,00' : 'Adiantamento'}
                                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-[#39FF14] focus:outline-none transition-all placeholder-zinc-600 font-mono disabled:opacity-50 font-bold"
                                style={{ color: '#39FF14' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER DO MODAL (Não impresso) */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0 print:hidden relative z-20">
          <span className="text-xs text-zinc-400">
            Ao clicar em <b>Imprimir Folha</b>, o documento "folha" em PDF será salvo na aba <b>Documentos</b>.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintAndSave}
              className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/60 hover:bg-amber-500/35 text-[#FFD700] hover:text-white font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
            >
              <Printer className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              <span className="text-[#FFD700] font-bold">Imprimir Folha e Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* ================= MODELO DE IMPRESSÃO DA FOLHA DE PAGAMENTO (1 PÁGINA POR ESTAGIÁRIO COM 2 RECIBOS IDÊNTICOS) ================= */}
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:text-black print:z-[9999] font-sans text-[11px]">
          <style>{`
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            @media print {
              body {
                background: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .page-break {
                page-break-after: always !important;
                break-after: page !important;
              }
            }
          `}</style>
          {estagiariosAtivos.map((tceItem, idx) => {
            const val = valores[tceItem.id] || { faltas: '', bonificacoes: '', adiantamento: '' };
            const cucu = tceItem.estagiario?.nome || '—';
            const lala = tceItem.estagiario?.cpf || '—';
            const lele = (tceItem as any).dataInicio || tceItem.dataContrato || tceItem.dataCriacao || '—';
            const xoxo = tceItem.valor || '0,00';
            const lulu = val.bonificacoes || '0,00';
            const xexe = val.adiantamento || '0,00';
            const lili = val.faltas || '0';

            const retro = isDataRetroativa(lele, caca, cece);

            const baseBolsa = retro ? 0 : parseVal(xoxo);
            const lolo = calcularDiasTrabalhados(lele, caca, cece);
            const valBolsa = retro ? 0 : (lolo < 30 ? (baseBolsa / 30) * lolo : baseBolsa);
            const valBoni = retro ? 0 : parseVal(lulu);
            const valAdian = retro ? 0 : parseVal(xexe);
            const numFaltas = retro ? 0 : parseVal(lili);
            const valFalta = retro ? 0 : (numFaltas > 0 ? (baseBolsa / 30) * numFaltas : 0);

            const displayXoxo = retro ? '0,00' : xoxo;
            const displayLulu = retro ? '0,00' : lulu;
            const displayXexe = retro ? '0,00' : xexe;
            const displayLili = retro ? '0' : lili;

            const xaxa = fmtVal(valBolsa);
            const xixi = valFalta > 0 ? fmtVal(valFalta) : '0,00';
            const xuxu = fmtVal(valBolsa + valBoni);
            const papa = fmtVal(valAdian + valFalta);
            const pepe = fmtVal((valBolsa + valBoni) - (valAdian + valFalta));

            return (
              <div
                key={tceItem.id}
                className="w-full bg-white text-black p-4 border border-gray-300 rounded space-y-4 relative overflow-hidden"
                style={{
                  pageBreakAfter: idx < estagiariosAtivos.length - 1 ? 'always' : 'auto',
                  breakAfter: idx < estagiariosAtivos.length - 1 ? 'page' : 'auto',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                }}
              >
                <HunterWatermark size={360} opacity="opacity-[0.09]" />
                <div>
                  <RenderStub
                    cici={cici}
                    coco={coco}
                    caca={caca}
                    cece={cece}
                    cucu={cucu}
                    lala={lala}
                    lele={lele}
                    xoxo={displayXoxo}
                    lulu={displayLulu}
                    xexe={displayXexe}
                    lili={displayLili}
                    lolo={lolo}
                    xaxa={xaxa}
                    xixi={xixi}
                    xuxu={xuxu}
                    papa={papa}
                    pepe={pepe}
                    hunterDados={hunterDados}
                  />
                </div>

                <div className="my-2 border-b-2 border-dashed border-gray-400 w-full text-center">
                  <span className="text-[8.5px] text-gray-500 font-mono uppercase">
                    ✂ Via Empresa / Via Estagiário
                  </span>
                </div>

                <div>
                  <RenderStub
                    cici={cici}
                    coco={coco}
                    caca={caca}
                    cece={cece}
                    cucu={cucu}
                    lala={lala}
                    lele={lele}
                    xoxo={displayXoxo}
                    lulu={displayLulu}
                    xexe={displayXexe}
                    lili={displayLili}
                    lolo={lolo}
                    xaxa={xaxa}
                    xixi={xixi}
                    xuxu={xuxu}
                    papa={papa}
                    pepe={pepe}
                    hunterDados={hunterDados}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= CONTAINER OCULTO PARA CAPTURA DO PDF PELA HTML2PDF ================= */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
          <div ref={pdfDocRef} className="bg-white text-black font-sans text-[11px]">
            {estagiariosAtivos.map((tceItem, idx) => {
              const val = valores[tceItem.id] || { faltas: '', bonificacoes: '', adiantamento: '' };
              const cucu = tceItem.estagiario?.nome || '—';
              const lala = tceItem.estagiario?.cpf || '—';
              const lele = (tceItem as any).dataInicio || tceItem.dataContrato || tceItem.dataCriacao || '—';
              const xoxo = tceItem.valor || '0,00';
              const lulu = val.bonificacoes || '0,00';
              const xexe = val.adiantamento || '0,00';
              const lili = val.faltas || '0';

              const retro = isDataRetroativa(lele, caca, cece);

              const baseBolsa = retro ? 0 : parseVal(xoxo);
              const lolo = calcularDiasTrabalhados(lele, caca, cece);
              const valBolsa = retro ? 0 : (lolo < 30 ? (baseBolsa / 30) * lolo : baseBolsa);
              const valBoni = retro ? 0 : parseVal(lulu);
              const valAdian = retro ? 0 : parseVal(xexe);
              const numFaltas = retro ? 0 : parseVal(lili);
              const valFalta = retro ? 0 : (numFaltas > 0 ? (baseBolsa / 30) * numFaltas : 0);

              const displayXoxo = retro ? '0,00' : xoxo;
              const displayLulu = retro ? '0,00' : lulu;
              const displayXexe = retro ? '0,00' : xexe;
              const displayLili = retro ? '0' : lili;

              const xaxa = fmtVal(valBolsa);
              const xixi = valFalta > 0 ? fmtVal(valFalta) : '0,00';
              const xuxu = fmtVal(valBolsa + valBoni);
              const papa = fmtVal(valAdian + valFalta);
              const pepe = fmtVal((valBolsa + valBoni) - (valAdian + valFalta));

              return (
                <div
                  key={tceItem.id}
                  className="w-[210mm] bg-white text-black p-4 space-y-4 box-border relative overflow-hidden"
                  style={{
                    pageBreakAfter: idx < estagiariosAtivos.length - 1 ? 'always' : 'auto',
                    breakAfter: idx < estagiariosAtivos.length - 1 ? 'page' : 'auto',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <HunterWatermark size={360} opacity="opacity-[0.09]" />
                  <div>
                    <RenderStub
                      cici={cici}
                      coco={coco}
                      caca={caca}
                      cece={cece}
                      cucu={cucu}
                      lala={lala}
                      lele={lele}
                      xoxo={displayXoxo}
                      lulu={displayLulu}
                      xexe={displayXexe}
                      lili={displayLili}
                      lolo={lolo}
                      xaxa={xaxa}
                      xixi={xixi}
                      xuxu={xuxu}
                      papa={papa}
                      pepe={pepe}
                      hunterDados={hunterDados}
                    />
                  </div>

                  <div className="my-2 border-b-2 border-dashed border-gray-400 w-full text-center">
                    <span className="text-[8.5px] text-gray-500 font-mono uppercase">
                      ✂ Via Empresa / Via Estagiário
                    </span>
                  </div>

                  <div>
                    <RenderStub
                      cici={cici}
                      coco={coco}
                      caca={caca}
                      cece={cece}
                      cucu={cucu}
                      lala={lala}
                      lele={lele}
                      xoxo={displayXoxo}
                      lulu={displayLulu}
                      xexe={displayXexe}
                      lili={displayLili}
                      lolo={lolo}
                      xaxa={xaxa}
                      xixi={xixi}
                      xuxu={xuxu}
                      papa={papa}
                      pepe={pepe}
                      hunterDados={hunterDados}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

// COMPONENTE DO STUB DE RECIBO DO MODELO
interface StubProps {
  cici: string;
  coco: string;
  caca: string;
  cece: string;
  cucu: string;
  lala: string;
  lele: string;
  xoxo: string;
  lulu: string;
  xexe: string;
  lili: string;
  lolo?: number;
  xaxa: string;
  xixi: string;
  xuxu: string;
  papa: string;
  pepe: string;
  hunterDados: HunterDados | null;
}

const RenderStub: React.FC<StubProps> = ({
  cici,
  coco,
  caca,
  cece,
  cucu,
  lala,
  lele,
  xoxo,
  lulu,
  xexe,
  lili,
  lolo = 30,
  xaxa,
  xixi,
  xuxu,
  papa,
  pepe,
  hunterDados,
}) => {
  return (
    <div className="border-2 border-black bg-white text-black flex flex-row relative h-full w-full min-h-[340px] text-[10px] leading-tight">
      {/* CORPO PRINCIPAL DO RECIBO (ESQUERDA) */}
      <div className="flex-1 p-2.5 flex flex-col justify-between border-r-2 border-black">
        
        {/* CABEÇALHO DO RECIBO */}
        <div className="border-b border-black pb-1.5 mb-1.5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wide">Recibo de Pagamento</h2>
              <h3 className="text-[11px] font-extrabold uppercase">Bolsa Estágio</h3>
            </div>
            <div className="flex flex-col items-center">
              <HunterPDFLogo height={28} />
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold">
                Referência:<br />
                <span className="font-black text-xs">{caca} / {cece}</span>
              </div>
            </div>
          </div>

          <div className="mt-1.5 text-[9.5px] leading-tight space-y-0.5 border-t border-black pt-1">
            <div className="flex justify-between">
              <span>
                <strong>Unidade Concedente:</strong> {cici}
              </span>
              <span>
                <strong>C.N.P.J.</strong> {coco}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                <strong>Agente de Integração:</strong> {hunterDados?.razaoSocial || 'HUNTER RECURSOS HUMANOS INTELIGENTES'}
              </span>
              <span>
                <strong>C.N.P.J.</strong> {hunterDados?.cnpj || '54.013.036/0001-39'}
              </span>
            </div>
          </div>
        </div>

        {/* DADOS DO ESTAGIÁRIO */}
        <div className="border-b border-black pb-1 mb-1.5 text-[9.5px]">
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-6">
              <span className="block text-[8.5px] text-gray-700 font-bold">Estagiário(a)</span>
              <span className="font-extrabold text-black uppercase">{cucu}</span>
            </div>
            <div className="col-span-3">
              <span className="block text-[8.5px] text-gray-700 font-bold">C.P.F.</span>
              <span className="font-mono font-bold text-black">{lala}</span>
            </div>
            <div className="col-span-3 text-right">
              <span className="block text-[8.5px] text-gray-700 font-bold">Data Início:</span>
              <span className="font-mono font-bold text-black">{lele}</span>
            </div>
          </div>
        </div>

        {/* TABELA DE DEMONSTRATIVO */}
        <div className="flex-1 border border-black mb-1.5 flex flex-col justify-between">
          <table className="w-full text-left text-[9.5px] border-collapse">
            <thead>
              <tr className="border-b border-black bg-gray-100 font-bold uppercase text-[8.5px]">
                <th className="p-1 border-r border-black w-8 text-center">Código</th>
                <th className="p-1 border-r border-black">Descrição</th>
                <th className="p-1 border-r border-black w-24 text-right">Vencimentos</th>
                <th className="p-1 w-24 text-right">Descontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              <tr className="border-b border-black">
                <td className="p-1 border-r border-black text-center font-mono">1</td>
                <td className="p-1 border-r border-black font-medium">Bolsa Estágio: ( {lolo} dias no período )</td>
                <td className="p-1 border-r border-black text-right font-mono font-bold">R$ {xaxa}</td>
                <td className="p-1 text-right font-mono"></td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-1 border-r border-black text-center font-mono">2</td>
                <td className="p-1 border-r border-black font-medium">Bonificação:</td>
                <td className="p-1 border-r border-black text-right font-mono font-bold">{lulu !== '0,00' && lulu !== '0' && lulu !== '' ? `R$ ${lulu}` : ''}</td>
                <td className="p-1 text-right font-mono"></td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-1 border-r border-black text-center font-mono">3</td>
                <td className="p-1 border-r border-black font-medium">Adiantamento:</td>
                <td className="p-1 border-r border-black text-right font-mono"></td>
                <td className="p-1 text-right font-mono font-bold">{xexe !== '0,00' && xexe !== '0' && xexe !== '' ? `R$ ${xexe}` : ''}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-1 border-r border-black text-center font-mono">4</td>
                <td className="p-1 border-r border-black font-medium">Faltas: ( {lili || '0'} )</td>
                <td className="p-1 border-r border-black text-right font-mono"></td>
                <td className="p-1 text-right font-mono font-bold">{xixi !== '0,00' && xixi !== '0' && xixi !== '' ? `R$ ${xixi}` : ''}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-1 border-r border-black text-center font-mono">5</td>
                <td className="p-1 border-r border-black font-medium">Recesso Remunerado:</td>
                <td className="p-1 border-r border-black text-right font-mono font-bold"></td>
                <td className="p-1 text-right font-mono"></td>
              </tr>
            </tbody>
          </table>

          {/* TOTALIZADORES */}
          <div className="border-t border-black bg-gray-50 grid grid-cols-2 text-[9px] font-bold">
            <div className="p-1 border-r border-black flex justify-between">
              <span>Total de Vencimentos</span>
              <span className="font-mono text-black font-extrabold">R$ {xuxu}</span>
            </div>
            <div className="p-1 flex justify-between">
              <span>Total de Descontos</span>
              <span className="font-mono text-black font-extrabold">R$ {papa}</span>
            </div>
          </div>
        </div>

        {/* RODAPÉ DO RECIBO */}
        <div className="grid grid-cols-12 gap-1.5 text-[9px] items-center pt-1 border-t border-black">
          <div className="col-span-4 border border-black p-1 text-center bg-gray-50">
            <span className="block text-[8px] text-gray-700 font-bold uppercase">Valor Base Bolsa-Auxilio</span>
            <span className="font-mono font-black text-[11px] text-black">R$ {xoxo}</span>
          </div>

          <div className="col-span-4 text-center font-bold text-[8px] text-gray-800 leading-tight">
            VALORES REFERENTES AOS<br />
            DIAS ESTAGIADOS EM<br />
            <span className="font-extrabold text-black uppercase">{caca} / {cece}</span>
          </div>

          <div className="col-span-4 border-2 border-black p-1 text-right bg-gray-100">
            <span className="block text-[8px] text-gray-800 font-bold uppercase">Valor líquido</span>
            <span className="font-mono font-black text-xs text-black">R$ {pepe}</span>
          </div>
        </div>
      </div>

      {/* COLUNA LATERAL DIREITA: ASSINATURA E DATA (EXATO COMO NO MODELO) */}
      <div className="w-9 bg-white text-black flex flex-col justify-between items-center py-3 px-0.5 select-none relative shrink-0">
        <div className="flex-1 flex items-center justify-center">
          <span className="-rotate-90 whitespace-nowrap text-[9.5px] font-extrabold uppercase tracking-wider text-black">
            Assinatura:
          </span>
        </div>
        <div className="flex flex-col items-center justify-end pt-2 text-[9px] font-bold">
          <span className="font-mono text-[9.5px] tracking-widest">/ /</span>
          <span className="text-[8px] uppercase font-bold mt-0.5">Data :</span>
        </div>
      </div>
    </div>
  );
};
