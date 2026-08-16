import React, { useRef, useState, useEffect } from 'react';
import { ContratoParceria } from '../types/hunter';
import { Download, Printer, X, CheckCircle2, ShieldCheck, FileText, Loader2, ExternalLink, Copy } from 'lucide-react';
import { HunterLogo } from './HunterLogo';
import { HunterPDFLogo } from './HunterPDFLogo';
import { HunterWatermark } from './HunterWatermark';
import { getMatrizConvenio } from '../data/matrizesDefaults';
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

interface ContratoParceriaPDFModalProps {
  contrato: ContratoParceria;
  autoDownload?: boolean;
  onClose: () => void;
}

export const ContratoParceriaPDFModal: React.FC<ContratoParceriaPDFModalProps> = ({
  contrato,
  autoDownload = false,
  onClose
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const matriz = getMatrizConvenio();

  const emp = contrato?.empresa || (contrato as any)?.empresa || (contrato as any) || {};
  const numContratoStr = String(contrato?.numero || 1200);
  const razaoSocial = emp.razaoSocial || emp.nome || '—';
  const nomeFantasia = emp.nomeFantasia || emp.nome || '—';
  const endereco = emp.endereco || '—';
  const bairro = emp.bairro || '—';
  const cidade = emp.cidade || '—';
  const cep = emp.cep || '—';
  const estado = emp.estado || 'SP';
  const fone = emp.fone || '—';
  const cnpj = emp.cnpj || '—';
  const representanteLegal = emp.responsavel || emp.representanteLegal || '—';
  const email = emp.email || '—';
  const cidadeForo = contrato?.cidadeForo || cidade || '—';
  const dataContrato = contrato?.dataContrato || '—';
  const valEee = contrato?.valor || '0,00';
  const valFff = contrato?.valorExtenso || 'zero';
  const valGgg = contrato?.diaPagamento || '10';
  const valHhh = contrato?.dataInicio || '10/08/2026';

  // Função para copiar email e abrir Autentique
  const handleCopyEmailAndOpenAutentique = async () => {
    if (email && email !== '—') {
      try {
        await navigator.clipboard.writeText(email);
        setCopiedStatus(`E-mail (${email}) copiado para a área de transferência!`);
      } catch (err) {
        console.error('Erro ao copiar email:', err);
      }
    } else {
      setCopiedStatus('Empresa sem e-mail cadastrado. Abrindo Autentique...');
    }
    window.open('https://painel.autentique.com.br/documentos/novo', '_blank');

    setTimeout(() => {
      setCopiedStatus(null);
    }, 6000);
  };

  // Função para baixar via html2pdf.js
  const handleDownloadPDF = () => {
    if (!docRef.current) return;
    setIsDownloading(true);

    const filename = `Hunter_Contrato_Parceria_${numContratoStr}_${(nomeFantasia || razaoSocial).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    const opt: any = {
      margin: [8, 8, 8, 8], // milímetros [topo, esquerda, base, direita]
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
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
        console.error('Erro ao gerar PDF:', err);
        window.print();
        setIsDownloading(false);
      });
  };

  // Auto-download quando acionado pela criação de novo contrato
  useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload]);

  // Função para impressão nativa do navegador
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden select-none animate-fadeIn">
      <HunterWatermark size={320} opacity="opacity-[0.08]" />
      {/* Top Controls Toolbar */}
      <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-black">
                CONTRATO Nº {numContratoStr}
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                • {razaoSocial}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              Convênio Agente de Integração e Unidade Concedente de Estágio
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
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Imprimir documento ou salvar como PDF nativo"
          >
            <Printer className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-5 py-2 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 text-xs font-bold flex items-center gap-2 shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Baixar em PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
            title="Fechar Visualização"
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

      {/* Document Area - A4 Pages Preview */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-900 flex flex-col items-center gap-8">
        {/* Container com largura A4 onde o documento será capturado pelo html2pdf.js */}
        <div
          ref={docRef}
          id="documento-contrato-parceria-pdf"
          className="w-full max-w-[800px] bg-white text-black font-sans shadow-2xl rounded-sm p-6 sm:p-8 text-[11px] leading-[1.4] text-justify select-text"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* ======================= CONTEÚDO DO CONTRATO ======================= */}
          <div className="relative overflow-hidden pb-2">
            <HunterWatermark size={440} opacity="opacity-[0.09]" />
            <div className="relative z-10">
            {/* Header com Logo HUNTER e número do contrato */}
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-400">
              <HunterPDFLogo height={48} />
              <div className="text-right font-bold text-sm text-black self-center">
                Contrato {numContratoStr}
              </div>
            </div>

            {/* Título Principal */}
            <div className="text-center font-bold text-xs uppercase mb-3 leading-tight text-black">
              CONVÊNIO AGENTE DE INTEGRAÇÃO e UNIDADE CONCEDENTE DE ESTÁGIO.<br />
              <span className="font-normal">Celebram entre si o presente Instrumento jurídico, as partes a seguir qualificadas,</span>
            </div>

            {/* Linha Divisória 1: Antes da Parte Concedente */}
            <div className="border-t border-black my-2"></div>

            {/* Parte Concedente (sublinhado e negrito) */}
            <div className="mb-2 text-black">
              <div className="font-bold underline mb-1 uppercase text-xs">PARTE CONCEDENTE:</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between w-full">
                  <span><strong>RAZÃO SOCIAL:</strong> {razaoSocial}</span>
                  <span><strong>NOME FANTASIA:</strong> {nomeFantasia}</span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span><strong>ENDEREÇO:</strong> {endereco}</span>
                  <span><strong>BAIRRO:</strong> {bairro}</span>
                </div>
                <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                  <strong>CIDADE:</strong> {cidade} &nbsp;&nbsp;&nbsp;&nbsp; <strong>CEP:</strong> {cep} &nbsp;&nbsp;&nbsp;&nbsp; <strong>ESTADO:</strong> {estado} &nbsp;&nbsp;&nbsp;&nbsp; <strong>FONE:</strong> {fone}
                </p>
                <div className="flex items-center justify-between w-full">
                  <span><strong>CNPJ:</strong> {cnpj}</span>
                  <span><strong>REPRESENTANTE LEGAL:</strong> {representanteLegal}</span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span><strong>E-MAIL:</strong> {email}</span>
                </div>
              </div>
            </div>

            {/* Linha Divisória abaixo do e-mail da Parte Concedente */}
            <div className="border-t border-black my-2"></div>

            {/* Agente de Integração */}
            <div className="mb-2 text-black">
              <div className="flex items-center justify-between font-bold underline uppercase text-xs mb-1 w-full">
                <span>AGENTE DE INTEGRAÇÃO:</span>
                <span>HUNTER RECURSOS HUMANOS</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                  <strong>AGENTE:</strong> Hunter Recursos Humanos Inteligentes &nbsp;&nbsp;&nbsp;&nbsp; <strong>ENDEREÇO:</strong> Rua Alvares Cabral Nº106 &nbsp;&nbsp;&nbsp;&nbsp; <strong>SALA:</strong> 504 &nbsp;&nbsp;&nbsp;&nbsp; <strong>BAIRRO:</strong> Fabrício
                </p>
                <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                  <strong>CIDADE:</strong> UBERABA &nbsp;&nbsp;&nbsp;&nbsp; <strong>CEP:</strong> 38.065-240 &nbsp;&nbsp;&nbsp;&nbsp; <strong>ESTADO:</strong> MINAS GERAIS &nbsp;&nbsp;&nbsp;&nbsp; <strong>FONE:</strong> (34) 98892-5088
                </p>
                <div className="flex items-center justify-between w-full">
                  <span><strong>CNPJ:</strong> 54.013.036/0001-39</span>
                  <span><strong>E-MAIL:</strong> nacionalestagios1@gmail.com</span>
                </div>
                <div className="flex items-center justify-between w-full">
                  <span><strong>REPRESENTANTE LEGAL:</strong> VANDER MONTEIRO DE OLIVEIRA</span>
                </div>
              </div>
            </div>

            {/* Linha Divisória 2: Depois do Representante Legal do Agente de Integração */}
            <div className="border-t border-black my-2"></div>

            {/* Cláusula 1ª */}
            <div className="mb-3">
              <div className="font-bold underline uppercase mb-1">CLÁUSULA 1ª - DO OBJETO</div>
              <p className="mb-2">
                {matriz.clausula1_objeto}
              </p>
              <p className="mb-2">
                {matriz.clausula1_paragrafo}
              </p>
            </div>

            {/* Espaço de 1 linha entre a Cláusula 1 e a Cláusula 2 */}
            <div className="leading-tight text-transparent select-none" aria-hidden="true">
              <br />
            </div>

            {/* Cláusula 2ª */}
            <div className="mb-4">
              <div className="font-bold underline uppercase mb-1">CLÁUSULA 2ª - DAS ATRIBUIÇÕES DO AGENTE DE INTEGRAÇÃO</div>
              <p className="mb-1">
                Para cumprir o estabelecimento na cláusula 1ª caberá a HUNTER RECURSOS HUMANOS, em seu papel de AGENTE DE INTEGRAÇÃO:
              </p>
              <div className="space-y-1 pl-1">
                {matriz.clausula2_atribuicoesHunter.map((item, idx) => (
                  <p key={idx}>{String.fromCharCode(97 + idx)}) {item}</p>
                ))}
              </div>
            </div>

            {/* Espaço de 6 linhas solicitadas entre a Cláusula 2 e a Cláusula 3 */}
            <div className="leading-tight text-transparent select-none" aria-hidden="true">
              <br />
              <br />
              <br />
              <br />
              <br />
              <br />
            </div>

            {/* Cláusula 3ª */}
            <div className="mb-4">
              <div className="font-bold underline uppercase mb-1">CLÁUSULA 3ª – DAS ATRIBUIÇÕES DA UNIDADE CONCEDENTE</div>
              <p className="mb-1">Para cumprir o established na Cláusula 1ª caberá a UNIDADE CONCEDENTE:</p>
              <div className="space-y-1.5 pl-1">
                {matriz.clausula3_atribuicoesConcedente.map((item, idx) => (
                  <p key={idx}>{String.fromCharCode(97 + idx)}) {item}</p>
                ))}
              </div>
            </div>

            {/* Cláusula 4ª */}
            <div className="mb-4">
              <div className="font-bold underline uppercase mb-1">CLÁUSULA 4ª - DOS VALORES</div>
              <p>
                {matriz.clausula4_valores} o valor pré-fixado de R$ {valEee} ({valFff} REAIS), mensais por estagiário, o qual encaminhará à Unidade Concedente as informações relativas à Forma e pagamento do mesmo. Os valores deverão ser pagos dia {valGgg} de cada mês iniciando dia {valHhh}.
              </p>
            </div>

            {/* Cláusula 5ª */}
            <div className="mb-4">
              <div className="font-bold underline uppercase mb-1">CLÁUSULA 5ª - DA VIGÊNCIA</div>
              <p>
                {matriz.clausula5_vigencia}
              </p>
            </div>

            {/* Cláusula 6ª */}
            <div className="mb-4">
              <div className="font-bold underline uppercase mb-1">CLÁUSULA 6ª – DAS RESPONSABILIDADES</div>
              <p className="mb-3">
                {matriz.clausula6_responsabilidades}
              </p>
              <p>
                {matriz.clausula6_paragrafo}
              </p>
            </div>

            {/* Cláusula 7ª */}
            <div className="mb-10">
              <div className="font-bold underline uppercase mb-1">CLÁUSULA 7ª - DO FORO</div>
              <p className="mb-4">
                {matriz.clausula7_foro}
              </p>
              <p>
                As partes, por estarem de acordo quanto ao cumprimento dos termos mutuamente firmados, assinam o presente em duas vias de igual teor e conteúdo.
              </p>
            </div>

            {/* Data por extenso */}
            <div className="text-right font-bold text-xs mb-4 pr-4">
              {cidadeForo}, {dataContrato}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
