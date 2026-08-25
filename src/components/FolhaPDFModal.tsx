import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, DollarSign, Calendar, Users, Building2, FileText, Download, Loader2, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { FolhaPagamentoSalva, HunterDados } from '../types/hunter';
import { HunterWatermark } from './HunterWatermark';
import { HunterPDFLogo } from './HunterPDFLogo';
import { downloadElementAsPDF } from '../utils/pdfDownloader';

interface FolhaPDFModalProps {
  folha: FolhaPagamentoSalva;
  hunterDados: HunterDados | null;
  autoDownload?: boolean;
  onClose: () => void;
}

// Helper de formatação de valores numéricos para impressão do recibo
export function parseVal(v: string | number | undefined): number {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  const clean = String(v).replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function fmtVal(num: number): string {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseDataInicio(dataStr: string, defaultYear: number): { day: number; month: number; year: number } {
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

export function getDiaDoUltimoDiaEstagiado(dataStr: string): number {
  if (!dataStr || dataStr === '—') return 30;
  const clean = dataStr.trim().toLowerCase();

  if (/^\d{1,2}$/.test(clean)) {
    const d = parseInt(clean, 10);
    if (d >= 1 && d <= 31) return d;
  }

  const parsed = parseDataInicio(clean, new Date().getFullYear());
  if (parsed && parsed.day >= 1 && parsed.day <= 31) {
    return parsed.day;
  }
  return 30;
}

export function isDataRetroativa(
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

export function calcularDiasTrabalhados(
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

export function calcularDiasTotaisEstagiados(dataInicioStr: string, dataFimStr: string): number {
  if (!dataInicioStr || !dataFimStr || dataInicioStr === '—' || dataFimStr === '—') return 0;
  const currentYear = new Date().getFullYear();
  const start = parseDataInicio(dataInicioStr, currentYear);
  const end = parseDataInicio(dataFimStr, currentYear);

  const startDate = new Date(start.year, start.month - 1, start.day);
  const endDate = new Date(end.year, end.month - 1, end.day);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export const FolhaPDFModal: React.FC<FolhaPDFModalProps> = ({ folha, hunterDados, autoDownload = false, onClose }) => {
  const empresa = folha.empresa;
  const cici = empresa.razaoSocial || empresa.nomeFantasia || empresa.nome || 'Empresa';
  const coco = empresa.cnpj || '—';
  const caca = folha.referencia || '—';
  const cece = folha.ano || '—';

  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const handleCopyEmailAndOpenAutentique = async () => {
    const emailToCopy = empresa?.email?.trim() || folha.contratoEmpresa?.empresa?.email?.trim();
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

  const handleDownloadPDF = async () => {
    if (!docRef.current) return;
    setIsDownloading(true);

    const filename = `Hunter_Folha_Pagamento_${folha.referencia}_${folha.ano}_${(cici).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    try {
      const result = await downloadElementAsPDF(docRef.current, filename, {
        margin: [0, 0, 0, 0],
        pagebreakMode: ['css', 'legacy']
      });

      if (result.success) {
        setCopiedStatus(`✓ PDF (${filename}) baixado com sucesso no seu computador!`);
      }
    } catch (err: any) {
      console.error('Erro ao baixar PDF:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (autoDownload) {
      handleDownloadPDF();
      handleCopyEmailAndOpenAutentique();
    }
  }, [autoDownload]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-black animate-fadeIn overflow-hidden">
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
                  Folha de Pagamento Saved PDF
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  {folha.numeroFolha}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-[#39FF14] mt-0.5" style={{ color: '#39FF14' }}>
                {cici} ({caca} / {cece})
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
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/60 hover:bg-amber-500/35 text-[#FFD700] hover:text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              title="Baixar PDF da Folha"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#FFD700] animate-spin" />
                  <span>Baixando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-[#FFD700] font-bold">Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Imprimir via navegador"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              <span>Imprimir</span>
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

        {/* PREVIEW DE TELA DOS RECIBOS (Não impresso - 2 Vias por Estagiário) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 print:hidden relative z-10 bg-zinc-950">
          <div className="text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
            <span>
              Mostrando recibos para <b>{folha.estagiariosAtivos.length}</b> estagiário(s) da empresa <b>{cici}</b> (2 Vias idênticas por página).
            </span>
            <span className="font-mono text-amber-400">Emissão: {folha.dataEmissao}</span>
          </div>

          {folha.estagiariosAtivos.map((item, idx) => {
            const tce = item.tce;
            const cucu = tce.estagiario?.nome || '—';
            const lala = tce.estagiario?.cpf || '—';
            const lele = (tce as any).dataInicio || tce.dataContrato || tce.dataCriacao || '—';
            const xoxo = tce.valor || '0,00';
            const lulu = item.bonificacoes || '0,00';
            const xexe = item.adiantamento || '0,00';
            const lili = item.faltas || '0';
            const ultimoDiaEstagiado = item.ultimoDiaEstagiado;

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

            const diasTotaisEstagiados = (ultimoDiaEstagiado && !retro) ? calcularDiasTotaisEstagiados(lele, ultimoDiaEstagiado) : 0;
            const valRecesso = (ultimoDiaEstagiado && !retro && diasTotaisEstagiados > 0) ? (baseBolsa / 365) * diasTotaisEstagiados : 0;

            const xaxa = fmtVal(valBolsa);
            const xixi = valFalta > 0 ? fmtVal(valFalta) : '0,00';
            const xuxu = fmtVal(valBolsa + valBoni + valRecesso);
            const papa = fmtVal(valAdian + valFalta);
            const pepe = fmtVal((valBolsa + valBoni + valRecesso) - (valAdian + valFalta));

            return (
              <div key={idx} className="bg-white text-black p-4 sm:p-6 rounded-xl shadow-2xl border border-gray-300 font-sans text-[11px] leading-tight space-y-4">
                <div className="text-center font-bold text-amber-600 text-xs uppercase tracking-wider border-b pb-2 border-gray-200">
                  Visualização do Recibo — Estagiário {idx + 1} de {folha.estagiariosAtivos.length}: {cucu}
                </div>

                {/* VIA 1: Superior */}
                <div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase mb-1">Via 1 (Empresa)</div>
                  <RenderReciboStub
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
                    ultimoDiaEstagiado={item.ultimoDiaEstagiado}
                    hunterDados={hunterDados}
                  />
                </div>

                {/* Divisor de corte */}
                <div className="my-3 border-b-2 border-dashed border-gray-400 w-full relative">
                  <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white px-2 text-[8.5px] text-gray-500 font-mono uppercase">
                    ✂ Destaque aqui (Via Empresa / Via Estagiário)
                  </span>
                </div>

                {/* VIA 2: Inferior */}
                <div>
                  <div className="text-[9px] font-bold text-gray-500 uppercase mb-1">Via 2 (Estagiário)</div>
                  <RenderReciboStub
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
                    ultimoDiaEstagiado={item.ultimoDiaEstagiado}
                    hunterDados={hunterDados}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* IMPRESSÃO REAL DO PDF (2 recibos idênticos por folha A4 por estagiário) */}
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
          {folha.estagiariosAtivos.map((item, idx) => {
            const tce = item.tce;
            const cucu = tce.estagiario?.nome || '—';
            const lala = tce.estagiario?.cpf || '—';
            const lele = (tce as any).dataInicio || tce.dataContrato || tce.dataCriacao || '—';
            const xoxo = tce.valor || '0,00';
            const lulu = item.bonificacoes || '0,00';
            const xexe = item.adiantamento || '0,00';
            const lili = item.faltas || '0';
            const ultimoDiaEstagiado = item.ultimoDiaEstagiado;

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

            const diasTotaisEstagiados = (ultimoDiaEstagiado && !retro) ? calcularDiasTotaisEstagiados(lele, ultimoDiaEstagiado) : 0;
            const valRecesso = (ultimoDiaEstagiado && !retro && diasTotaisEstagiados > 0) ? (baseBolsa / 365) * diasTotaisEstagiados : 0;

            const xaxa = fmtVal(valBolsa);
            const xixi = valFalta > 0 ? fmtVal(valFalta) : '0,00';
            const xuxu = fmtVal(valBolsa + valBoni + valRecesso);
            const papa = fmtVal(valAdian + valFalta);
            const pepe = fmtVal((valBolsa + valBoni + valRecesso) - (valAdian + valFalta));

            return (
              <div
                key={idx}
                className="w-full bg-white text-black p-4 border border-gray-300 rounded space-y-4 relative overflow-hidden"
                style={{
                  pageBreakAfter: idx < folha.estagiariosAtivos.length - 1 ? 'always' : 'auto',
                  breakAfter: idx < folha.estagiariosAtivos.length - 1 ? 'page' : 'auto',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid',
                }}
              >
                <HunterWatermark size={360} opacity="opacity-[0.09]" />
                <div>
                  <RenderReciboStub
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
                    ultimoDiaEstagiado={item.ultimoDiaEstagiado}
                    hunterDados={hunterDados}
                  />
                </div>

                <div className="my-2 border-b-2 border-dashed border-gray-400 w-full text-center">
                  <span className="text-[8.5px] text-gray-500 font-mono uppercase">
                    ✂ Via Empresa / Via Estagiário
                  </span>
                </div>

                <div>
                  <RenderReciboStub
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
                    ultimoDiaEstagiado={item.ultimoDiaEstagiado}
                    hunterDados={hunterDados}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* CONTAINER OCULTO PARA CAPTURA DO PDF PELA HTML2PDF */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
          <div ref={docRef} data-pdf-root className="bg-white text-black text-[11px]" style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' }}>
            {folha.estagiariosAtivos.map((item, idx) => {
              const tce = item.tce;
              const cucu = tce.estagiario?.nome || '—';
              const lala = tce.estagiario?.cpf || '—';
              const lele = (tce as any).dataInicio || tce.dataContrato || tce.dataCriacao || '—';
              const xoxo = tce.valor || '0,00';
              const lulu = item.bonificacoes || '0,00';
              const xexe = item.adiantamento || '0,00';
              const lili = item.faltas || '0';
              const ultimoDiaEstagiado = item.ultimoDiaEstagiado;

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

              const diasTotaisEstagiados = (ultimoDiaEstagiado && !retro) ? calcularDiasTotaisEstagiados(lele, ultimoDiaEstagiado) : 0;
              const valRecesso = (ultimoDiaEstagiado && !retro && diasTotaisEstagiados > 0) ? (baseBolsa / 365) * diasTotaisEstagiados : 0;

              const xaxa = fmtVal(valBolsa);
              const xixi = valFalta > 0 ? fmtVal(valFalta) : '0,00';
              const xuxu = fmtVal(valBolsa + valBoni + valRecesso);
              const papa = fmtVal(valAdian + valFalta);
              const pepe = fmtVal((valBolsa + valBoni + valRecesso) - (valAdian + valFalta));

              return (
                <div
                  key={idx}
                  className="w-[210mm] bg-white text-black p-4 space-y-4 box-border relative overflow-hidden"
                  style={{
                    pageBreakAfter: idx < folha.estagiariosAtivos.length - 1 ? 'always' : 'auto',
                    breakAfter: idx < folha.estagiariosAtivos.length - 1 ? 'page' : 'auto',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                  }}
                >
                  <HunterWatermark size={360} opacity="opacity-[0.09]" />
                  <div>
                    <RenderReciboStub
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
                      ultimoDiaEstagiado={item.ultimoDiaEstagiado}
                      hunterDados={hunterDados}
                    />
                  </div>

                  <div className="my-2 border-b-2 border-dashed border-gray-400 w-full text-center">
                    <span className="text-[8.5px] text-gray-500 font-mono uppercase">
                      ✂ Via Empresa / Via Estagiário
                    </span>
                  </div>

                  <div>
                    <RenderReciboStub
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
                      ultimoDiaEstagiado={item.ultimoDiaEstagiado}
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

// COMPONENTE DO RECIBO EXATO BASEADO NO MODELO ANEXADO
export interface StubProps {
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
  ultimoDiaEstagiado?: string;
  hunterDados: HunterDados | null;
}

export const RenderReciboStub: React.FC<StubProps> = ({
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
  ultimoDiaEstagiado,
  hunterDados,
}) => {
  const baseBolsa = parseVal(xoxo);
  const diasTotaisEstagiados = ultimoDiaEstagiado ? calcularDiasTotaisEstagiados(lele, ultimoDiaEstagiado) : 0;
  const valRecessoNum = (ultimoDiaEstagiado && diasTotaisEstagiados > 0) ? (baseBolsa / 365) * diasTotaisEstagiados : 0;
  const valRecessoStr = fmtVal(valRecessoNum);

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
          <div className="grid grid-cols-12 gap-1 items-center">
            <div className={ultimoDiaEstagiado ? "col-span-4" : "col-span-6"}>
              <span className="block text-[8.5px] text-gray-700 font-bold">Estagiário(a)</span>
              <span className="font-extrabold text-black uppercase">{cucu}</span>
            </div>
            <div className="col-span-3">
              <span className="block text-[8.5px] text-gray-700 font-bold">C.P.F.</span>
              <span className="font-mono font-bold text-black">{lala}</span>
            </div>
            <div className={ultimoDiaEstagiado ? "col-span-2 text-right" : "col-span-3 text-right"}>
              <span className="block text-[8.5px] text-gray-700 font-bold">Data Início:</span>
              <span className="font-mono font-bold text-black">{lele}</span>
            </div>
            {ultimoDiaEstagiado && (
              <div className="col-span-3 text-right border-l border-black pl-1">
                <span className="block text-[8px] text-black font-extrabold uppercase">Último dia estagiado:</span>
                <span className="font-mono font-black text-black text-[10px]">{ultimoDiaEstagiado}</span>
              </div>
            )}
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
                <td className="p-1 border-r border-black font-medium">
                  {ultimoDiaEstagiado ? `Recesso Remunerado: ( ${diasTotaisEstagiados} dias estagiados )` : 'Recesso Remunerado:'}
                </td>
                <td className="p-1 border-r border-black text-right font-mono font-bold">
                  {ultimoDiaEstagiado && valRecessoNum > 0 ? `R$ ${valRecessoStr}` : ''}
                </td>
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
            {ultimoDiaEstagiado && (
              <div className="text-[8px] font-extrabold text-black uppercase mt-0.5">
                Último dia: {ultimoDiaEstagiado}
              </div>
            )}
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
