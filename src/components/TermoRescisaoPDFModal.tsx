import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Printer, FileText, Download, CheckCircle2, Loader2, Copy, ExternalLink } from 'lucide-react';
import { TCEContrato, HunterDados, FolhaRescisaoData, TermoRescisaoData } from '../types/hunter';
export type { FolhaRescisaoData, TermoRescisaoData };
import { HunterPDFLogo } from './HunterPDFLogo';
import { HunterWatermark } from './HunterWatermark';
import { getMatrizRescisao } from '../data/matrizesDefaults';
import { RenderReciboStub, parseVal, fmtVal, calcularDiasTrabalhados, calcularDiasTotaisEstagiados, getDiaDoUltimoDiaEstagiado } from './FolhaPDFModal';
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

interface TermoRescisaoPDFModalProps {
  data: TermoRescisaoData;
  autoDownload?: boolean;
  onClose: () => void;
}

export const TermoRescisaoPDFModal: React.FC<TermoRescisaoPDFModalProps> = ({ data, autoDownload = false, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const { tce, numeroRescisao, dataRescisao, motivoRescisao } = data;
  const rawMatriz = getMatrizRescisao();
  const { empresa, estagiario } = tce;

  const replaceTermosRescisao = (text: string): string => {
    if (!text) return text;
    return text
      .replace(/TERMO\s+DE\s+COMPROMISSO/gi, 'TERMO DE RESCISÃO')
      .replace(/Termo\s+de\s+Compromisso/g, 'Termo de Rescisão')
      .replace(/termo\s+de\s+compromisso/g, 'termo de rescisão');
  };

  const matriz = useMemo(() => {
    return {
      ...rawMatriz,
      titulo: replaceTermosRescisao(rawMatriz.titulo),
      subtitulo: replaceTermosRescisao(rawMatriz.subtitulo || 'Instrumento jurídico de Termo de Rescisão de Estágio e Convênio de Concessão de Estágio, previstos na Lei 11.788 de 25/01/2008 que regulamenta e disciplina a contratação de Estagiários.'),
      comunicado: replaceTermosRescisao(rawMatriz.comunicado),
      textoAssinaturas: replaceTermosRescisao(rawMatriz.textoAssinaturas)
    };
  }, [rawMatriz]);

  const handleCopyEmailsAndOpenAutentique = async () => {
    const emailsToCopy: string[] = [];
    if (estagiario?.email?.trim()) {
      emailsToCopy.push(estagiario.email.trim());
    }
    if (estagiario?.escolaEmail?.trim()) {
      emailsToCopy.push(estagiario.escolaEmail.trim());
    }

    if (emailsToCopy.length > 0) {
      const joined = emailsToCopy.join(', ');
      try {
        await navigator.clipboard.writeText(joined);
        setCopiedStatus(`E-mails (${joined}) copiados para a área de transferência!`);
      } catch (err) {
        console.error('Erro ao copiar e-mails:', err);
      }
    } else {
      setCopiedStatus('Nenhum e-mail de aluno ou escola cadastrado. Abrindo Autentique...');
    }
    window.open('https://painel.autentique.com.br/documentos/novo', '_blank');

    setTimeout(() => {
      setCopiedStatus(null);
    }, 6000);
  };

  const handleDownloadPDF = () => {
    if (!docRef.current) return;
    setIsDownloading(true);

    const filename = `Hunter_Termo_Rescisao_N${numeroRescisao}_${(estagiario?.nome || 'Estagiario').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    const opt: any = {
      margin: [0, 0, 0, 0],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], before: '.html2pdf__page-break' }
    };

    const pdfWorker = getHtml2Pdf();
    if (!pdfWorker) {
      console.warn('html2pdf não disponível, acionando impressão nativa');
      window.print();
      setIsDownloading(false);
      return;
    }

    pdfWorker()
      .set(opt)
      .from(docRef.current)
      .save()
      .then(() => {
        setIsDownloading(false);
      })
      .catch((err: any) => {
        console.error('Erro ao gerar PDF da Rescisão:', err);
        window.print();
        setIsDownloading(false);
      });
  };

  useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload]);

  // "bibi" - Data de início / criação do TCE
  const dataInicioTCE = (tce as any).dataInicio || tce.dataContrato || tce.dataCriacao || 'Não informada';

  // "GINA" - Nome do responsável na parte concedente
  const nomeResponsavelEmpresa = empresa.responsavel || (empresa as any).representanteLegal || 'RESPONSÁVEL LEGAL';

  // "bubu" - Cidade da parte concedente
  const cidadeEmpresa = empresa.cidade || empresa.cidadeForo || 'Uberaba';

  // Dados do Fechamento de Folha em Anexo
  const folhaInfo: FolhaRescisaoData = data.folhaRescisao || {
    referencia: 'Agosto',
    ano: String(new Date().getFullYear()),
    ultimoDiaEstagiado: dataRescisao,
    faltas: '0',
    bonificacoes: '0,00',
    adiantamento: '0,00',
  };

  const cici = empresa.nomeFantasia || empresa.razaoSocial || '—';
  const coco = empresa.cnpj || '—';
  const caca = folhaInfo.referencia;
  const cece = folhaInfo.ano;
  const cucu = estagiario.nome || '—';
  const lala = estagiario.cpf || '—';
  const lele = dataInicioTCE;
  const xoxo = tce.valor || '0,00';
  const lulu = folhaInfo.bonificacoes || '0,00';
  const xexe = folhaInfo.adiantamento || '0,00';
  const lili = folhaInfo.faltas || '0';
  const ultimoDiaEstagiado = folhaInfo.ultimoDiaEstagiado || dataRescisao;

  const baseBolsa = parseVal(xoxo);
  const lolo = getDiaDoUltimoDiaEstagiado(ultimoDiaEstagiado);
  const valBolsa = lolo < 30 ? (baseBolsa / 30) * lolo : baseBolsa;
  const valBoni = parseVal(lulu);
  const valAdian = parseVal(xexe);
  const numFaltas = parseVal(lili);
  const valFalta = numFaltas > 0 ? (baseBolsa / 30) * numFaltas : 0;

  const diasTotaisEstagiados = calcularDiasTotaisEstagiados(lele, ultimoDiaEstagiado);
  const valRecesso = (baseBolsa / 365) * diasTotaisEstagiados;

  const xaxa = fmtVal(valBolsa);
  const xixi = valFalta > 0 ? fmtVal(valFalta) : '0,00';
  const xuxu = fmtVal(valBolsa + valBoni + valRecesso);
  const papa = fmtVal(valAdian + valFalta);
  const pepe = fmtVal((valBolsa + valBoni + valRecesso) - (valAdian + valFalta));

  const hunterDadosSalvos: HunterDados | null = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('hunter_dados_gerais');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black animate-fadeIn">
      <style>{`
        @media print {
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>
      <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.35)] overflow-hidden relative">
        <HunterWatermark size={260} opacity="opacity-[0.08]" />
        {/* Barra de Controles do Modal (Não sai na impressão) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-black">
                  RESCISÃO Nº {numeroRescisao}
                </span>
                <span className="text-xs text-zinc-400">
                  • Termo de Conclusão / Rescisão + Fechamento de Folha Anexo
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                {empresa.nomeFantasia || empresa.razaoSocial} — Estagiário(a): {estagiario.nome}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopyEmailsAndOpenAutentique}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              title="Copiar e-mails do aluno e da escola e abrir Autentique"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copiar E-mails & Autentique</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Imprimir visualização nativa"
            >
              <Printer className="w-4 h-4 text-[#FFD700]" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 font-bold text-xs flex items-center gap-2 shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#FFD700] animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
              title="Fechar"
            >
              <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
            </button>
          </div>
        </div>

        {copiedStatus && (
          <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-6 py-2.5 text-center text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{copiedStatus}</span>
          </div>
        )}

        {/* Corpo do Documento (A4 Estilo e Impressão) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-900/50 print:p-0 print:bg-white print:overflow-visible">
          <div ref={docRef} className="max-w-[800px] mx-auto space-y-8 print:space-y-0">
          
            {/* PÁGINA 1: TERMO DE RESCISÃO DO TCE */}
            <div 
              className="relative overflow-hidden bg-white text-black p-8 sm:p-12 rounded-xl shadow-2xl print:shadow-none print:rounded-none font-sans text-[11px] leading-relaxed select-text"
              style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
            >
              
              {/* MARCA D'ÁGUA HUNTER NA FOLHA DO DOCUMENTO */}
              <HunterWatermark size={440} numericOpacity={0.045} />

              <div className="relative z-10">
                {/* CABEÇALHO DO MODELO COM A LOGO E NÚMERO DA RESCISÃO */}
                <div className="flex items-center justify-between border-b-2 border-zinc-300 pb-4 mb-4">
                  <HunterPDFLogo height={48} />
                  <div className="text-right font-bold text-sm text-black">
                    Rescisão: {numeroRescisao}
                  </div>
                </div>

            {/* TÍTULO PRINCIPAL DA MATRIZ */}
            <div className="text-center my-4">
              <h1 className="text-lg font-black uppercase text-black tracking-wide">
                {matriz.titulo}
              </h1>
              <p className="text-[10px] text-black mt-1 max-w-2xl mx-auto">
                {matriz.subtitulo}
              </p>
            </div>

            {/* QUALIFICAÇÃO "pppp" */}
            <div className="my-3 text-black">
              <p className="text-justify font-semibold text-black mb-1">
                As partes a seguir qualificadas,
              </p>
              <hr className="border-zinc-400 my-2" />

              {/* BLOCO "pppp" - DADOS DAS PARTES */}
              <div className="space-y-3 text-[10.5px] text-black">
                {/* 1. MANTENEDORA / ESCOLA */}
                <div className="border-b border-zinc-300 pb-2 space-y-0.5 text-black">
                  <div className="flex items-center justify-between font-bold w-full">
                    <span>MANTENEDORA:</span>
                    <span>ESCOLA: {estagiario.escolaNome || 'Escola Não Informada'}</span>
                  </div>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">ESCOLA:</span> {estagiario.escolaNome || 'Escola Não Informada'} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ENDEREÇO:</span> {estagiario.escolaEndereco || 'Endereço Não Informado'} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">BAIRRO:</span> {estagiario.escolaBairro || 'Bairro Não Informado'}
                  </p>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">CIDADE:</span> {estagiario.escolaCidade || 'Cidade Não Informada'} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">CEP:</span> {estagiario.escolaCep || 'CEP'} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ESTADO:</span> MG &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">FONE:</span> {estagiario.escolaFone || 'Fone'}
                  </p>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold">REPRESENTANTE LEGAL:</span>
                    <span>{estagiario.escolaResponsavel || 'Representante da Escola'}</span>
                  </div>
                </div>

                {/* 2. PARTE CONCEDENTE */}
                <div className="border-b border-zinc-300 pb-2 space-y-0.5 text-black">
                  <div className="flex items-center justify-between font-bold w-full">
                    <span>PARTE CONCEDENTE:</span>
                    <span>Nome fantasia: {empresa.nomeFantasia || empresa.razaoSocial}</span>
                  </div>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">RAZÃO SOCIAL:</span> {empresa.razaoSocial} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ENDEREÇO:</span> {empresa.endereco} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">BAIRRO:</span> {empresa.bairro}
                  </p>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">CIDADE:</span> {empresa.cidade} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">CEP:</span> {empresa.cep} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ESTADO:</span> MG &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">FONE:</span> {empresa.fone}
                  </p>
                  <div className="flex items-center justify-between w-full">
                    <span><span className="font-bold">CNPJ:</span> {empresa.cnpj}</span>
                    <span><span className="font-bold">REPRESENTANTE LEGAL:</span> {nomeResponsavelEmpresa}</span>
                  </div>
                </div>

                {/* 3. AGENTE DE INTEGRAÇÃO */}
                <div className="border-b border-zinc-300 pb-2 space-y-0.5 text-black">
                  <div className="flex items-center justify-between font-bold w-full">
                    <span>AGENTE DE INTEGRAÇÃO:</span>
                    <span>HUNTER RECURSOS HUMANOS INTELIGENTES</span>
                  </div>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">AGENTE:</span> Hunter Recursos Humanos Inteligentes &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ENDEREÇO:</span> Rua Alvares Cabral Nº106 SALA: 504 &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">BAIRRO:</span> Fabrício
                  </p>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">CIDADE:</span> UBERABA &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">CEP:</span> 38.065-240 &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ESTADO:</span> MINAS GERAIS &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">FONE:</span> (34) 98892-5088
                  </p>
                  <div className="flex items-center justify-between w-full">
                    <span><span className="font-bold">CNPJ:</span> 54.013 036/0001-39</span>
                    <span><span className="font-bold">E-MAIL:</span> nacionalestagios1@gmail.com</span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold">REPRESENTANTE LEGAL:</span>
                    <span>VANDER MONTEIRO DE OLIVEIRA</span>
                  </div>
                </div>

                {/* 4. ESTAGIÁRIO(A) */}
                <div className="space-y-0.5 text-black">
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">ESTAGIÁRIO(A):</span> {estagiario.nome} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ENDEREÇO:</span> {estagiario.endereco} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">BAIRRO:</span> {estagiario.bairro}
                  </p>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">CIDADE:</span> {estagiario.cidade} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ESTADO:</span> MG &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">CEP:</span> {estagiario.cep} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">DATA NASCIMENTO:</span> {estagiario.dataNascimento}
                  </p>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">CPF:</span> {estagiario.cpf} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">FONE:</span> {estagiario.fone}
                  </p>
                </div>
              </div>

              <hr className="border-zinc-400 my-2" />
            </div>

            {/* COMUNICADO E ITENS DA RESCISÃO DA MATRIZ */}
            <div className="space-y-3 mt-4 text-[11px] text-black text-justify">
              <p className="font-semibold text-black">
                {matriz.comunicado}
              </p>

              {/* 1) Período Estagiado */}
              <div>
                <p className="font-bold text-black">1) Período Estagiado:</p>
                <p className="pl-3 mt-0.5">
                  de: {dataInicioTCE} a {dataRescisao}
                </p>
                <p className="pl-3 mt-0.5">
                  Carga horária: 30 horas semanais &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Supervisor(a) do estágio: {nomeResponsavelEmpresa} – DIRETOR(A) ADMINISTRATIVO(A)
                </p>
              </div>

              {/* 2) Motivo da Rescisão */}
              <div>
                <p className="font-bold text-black">2) Motivo da Rescisão :</p>
                <p className="pl-3 mt-0.5 font-medium">
                  {motivoRescisao}
                </p>
              </div>

              {/* 3) Atividade do Estagiário(a) */}
              <div>
                <p className="font-bold text-black">3) Atividade do Estagiário(a):</p>
                <p className="pl-3 mt-0.5 uppercase">
                  {tce.atividadesEstagiario?.trim() || matriz.atividadesPadrao || 'ADMINISTRATIVO - AUXILIAR ADMINISTRATIVO / ATENDENTE'}
                </p>
              </div>
            </div>

            {/* LOCAL E DATA (DIREITA) */}
            <div className="text-right mt-12 text-black">
              <p className="text-sm font-semibold text-black">
                {cidadeEmpresa}, {dataRescisao}
              </p>
            </div>

            </div>
          </div>

          {/* PÁGINA 2 / ANEXO: RECIBO DE PAGAMENTO (FOLHA DO ESTAGIÁRIO RESCINDIDO) */}
          <div 
            className="html2pdf__page-break relative overflow-hidden bg-white text-black p-6 sm:p-8 rounded-xl shadow-2xl print:shadow-none print:rounded-none font-sans text-[11px] leading-relaxed select-text"
            style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
          >
            <HunterWatermark size={440} numericOpacity={0.045} />
            
            <div className="relative z-10 space-y-4">
              <div className="border-b-2 border-black pb-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-wider text-black">
                  ANEXO AO TERMO DE RESCISÃO Nº {numeroRescisao}
                </div>
                <div className="text-xs font-black uppercase text-black mt-0.5">
                  FOLHA DE PAGAMENTO DE FECHAMENTO DO ESTAGIÁRIO RESCINDIDO
                </div>
              </div>

              {/* VIA 1: Empresa */}
              <div>
                <div className="text-[9px] font-bold text-gray-700 uppercase mb-1">Via 1 (Empresa)</div>
                <RenderReciboStub
                  cici={cici}
                  coco={coco}
                  caca={caca}
                  cece={cece}
                  cucu={cucu}
                  lala={lala}
                  lele={lele}
                  xoxo={xoxo}
                  lulu={lulu}
                  xexe={xexe}
                  lili={lili}
                  lolo={lolo}
                  xaxa={xaxa}
                  xixi={xixi}
                  xuxu={xuxu}
                  papa={papa}
                  pepe={pepe}
                  ultimoDiaEstagiado={ultimoDiaEstagiado}
                  hunterDados={hunterDadosSalvos}
                />
              </div>

              {/* Divisor de corte */}
              <div className="my-3 border-b-2 border-dashed border-gray-400 w-full relative">
                <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white px-2 text-[8.5px] text-gray-500 font-mono uppercase">
                  ✂ Destaque aqui (Via Empresa / Via Estagiário)
                </span>
              </div>

              {/* VIA 2: Estagiário */}
              <div>
                <div className="text-[9px] font-bold text-gray-700 uppercase mb-1">Via 2 (Estagiário)</div>
                <RenderReciboStub
                  cici={cici}
                  coco={coco}
                  caca={caca}
                  cece={cece}
                  cucu={cucu}
                  lala={lala}
                  lele={lele}
                  xoxo={xoxo}
                  lulu={lulu}
                  xexe={xexe}
                  lili={lili}
                  lolo={lolo}
                  xaxa={xaxa}
                  xixi={xixi}
                  xuxu={xuxu}
                  papa={papa}
                  pepe={pepe}
                  ultimoDiaEstagiado={ultimoDiaEstagiado}
                  hunterDados={hunterDadosSalvos}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
);
};
