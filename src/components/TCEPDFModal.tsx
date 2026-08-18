import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Printer, Download, CheckCircle2, Shield, FileText, Loader2, Copy, ExternalLink } from 'lucide-react';
import { TCEContrato } from '../types/hunter';
import { HunterLogo } from './HunterLogo';
import { HunterPDFLogo } from './HunterPDFLogo';
import { HunterWatermark } from './HunterWatermark';
import { getMatrizTCE } from '../data/matrizesDefaults';
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

interface TCEPDFModalProps {
  tce: TCEContrato;
  autoDownload?: boolean;
  onClose: () => void;
}

export const TCEPDFModal: React.FC<TCEPDFModalProps> = ({ tce, autoDownload = false, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const { empresa, estagiario, seguradora } = tce;
  const isObrigatorio = tce.tipoEstagio === 'obrigatorio';

  const replaceTermosEstagio = (text: string): string => {
    if (!isObrigatorio || !text) return text;
    return text
      // ESTÁGIO NÃO OBRIGATÓRIO / ESTÁGIO NÃO-OBRIGATÓRIO
      .replace(/ESTÁGIO\s+NÃO[- ]OBRIGATÓRIO/g, 'ESTÁGIO OBRIGATÓRIO')
      .replace(/Estágio\s+Não[- ]Obrigatório/g, 'Estágio Obrigatório')
      .replace(/Estágio\s+Não\s+Obrigatório/g, 'Estágio Obrigatório')
      .replace(/estágio\s+não[- ]obrigatório/g, 'estágio obrigatório')
      .replace(/estágio\s+não\s+obrigatório/g, 'estágio obrigatório')
      .replace(/estágio\s+NÃO\s+OBRIGATÓRIO/g, 'estágio OBRIGATÓRIO')
      // NÃO OBRIGATÓRIO isolado
      .replace(/NÃO\s+OBRIGATÓRIO/g, 'OBRIGATÓRIO')
      .replace(/NÃO-OBRIGATÓRIO/g, 'OBRIGATÓRIO')
      .replace(/Não-Obrigatório/g, 'Obrigatório')
      .replace(/Não\s+Obrigatório/g, 'Obrigatório')
      .replace(/não-obrigatório/g, 'obrigatório')
      .replace(/não\s+obrigatório/g, 'obrigatório');
  };

  const rawMatriz = getMatrizTCE();
  const matriz = useMemo(() => {
    if (!isObrigatorio) return rawMatriz;
    return {
      ...rawMatriz,
      titulo: replaceTermosEstagio(rawMatriz.titulo),
      subtitulo: replaceTermosEstagio(rawMatriz.subtitulo),
      fundamentacao: replaceTermosEstagio(rawMatriz.fundamentacao),
      clausulas: (rawMatriz.clausulas || []).map((c) => ({
        ...c,
        titulo: replaceTermosEstagio(c.titulo),
        texto: replaceTermosEstagio(c.texto)
      })),
      atribuicoesAgente: replaceTermosEstagio(rawMatriz.atribuicoesAgente)
    };
  }, [rawMatriz, isObrigatorio]);

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

    const filename = `Hunter_TCE_N${tce.numero}_${(estagiario?.nome || 'Estagiario').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    const opt: any = {
      margin: [8, 8, 10, 8],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
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
        console.error('Erro ao gerar PDF do TCE:', err);
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-black">
                  TCE Nº {tce.numero}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isObrigatorio
                    ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}>
                  {isObrigatorio ? 'Estágio Obrigatório' : 'Estágio Não-Obrigatório'}
                </span>
                <span className="text-xs text-zinc-400">
                  • Termo de Compromisso de Estágio
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
          <div ref={docRef} className="max-w-[800px] mx-auto">
            
            {/* CONTAINER ÚNICO CONTÍNUO DO TCE */}
            <div className="relative overflow-hidden bg-white text-black p-6 sm:p-8 pb-8 rounded-xl shadow-2xl print:shadow-none print:rounded-none print:p-0 print:max-w-none font-sans text-[11px] leading-[1.25] select-text">
              
              {/* MARCA D'ÁGUA HUNTER */}
              <HunterWatermark size={440} opacity="opacity-[0.09]" />

              <div className="relative z-10">
                {/* CABEÇALHO DO MODELO COM A LOGO */}
                <div className="flex items-center justify-between border-b-2 border-zinc-300 pb-2 mb-2">
                  <HunterPDFLogo height={44} />
                  <div className="text-right font-bold text-sm text-black">
                    TCE: {tce.numero}
                  </div>
                </div>

                {/* TÍTULO PRINCIPAL DA MATRIZ */}
                <div className="text-center my-2">
                  <h1 className="text-base font-black uppercase text-black tracking-wide">
                    {matriz.titulo}
                  </h1>
                  <h2 className="text-xs font-bold text-black uppercase mt-0.5">
                    {matriz.subtitulo}
                  </h2>
                  <p className="text-[10px] text-black mt-0.5 italic">
                    {matriz.fundamentacao}
                  </p>
                </div>

                <p className="text-justify mb-1.5 text-black">
                  Celebram entre si o presente Instrumento jurídico de:<br />
                  <strong>TERMO DE COMPROMISSO DE ESTÁGIO</strong>, previsto no Artigo 8º da Legislação do Estágio. Lei 11.788 de 25/09/2008.<br />
                  As partes a seguir qualificadas,
                </p>

                <div className="border-t border-zinc-400 my-1 pt-1 space-y-0.5 text-black">
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

                <div className="border-t border-zinc-400 my-1 pt-1 space-y-0.5 text-black">
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
                    <span><span className="font-bold">REPRESENTANTE LEGAL:</span> {empresa.responsavel}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-400 my-1 pt-1 space-y-0.5 text-black">
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

                <div className="border-t border-zinc-400 my-1 pt-1 space-y-0.5 text-black">
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
                    <span className="font-bold">RESPONSÁVEL:</span> {estagiario.responsavel} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">CPF:</span> {estagiario.cpf} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">FONE:</span> {estagiario.fone}
                  </p>
                  <div className="font-bold text-black uppercase tracking-wide text-center">
                    REGULARMENTE MATRICULADO(a) NO ENSINO MÉDIO
                  </div>
                </div>

                <div className="border-t border-zinc-400 mt-1 mb-2 pt-1 text-center font-bold text-black">
                  Supervisor(a) do estágio: {empresa.responsavel} – DIRETOR(A) ADMINISTRATIVO(A) – {empresa.fone}
                </div>

                <div className="border-t border-zinc-400 mt-2 pt-2 text-center font-normal mb-2 text-black">
                  As partes convencionam as cláusulas e condições a seguir:
                </div>

                {/* CLÁUSULAS */}
                <div className="space-y-1.5 mt-0 mb-2 text-justify text-black">
                  <div className="text-center font-bold leading-tight">
                    01- Período de vigência deste instrumento:<br />
                    <span className="font-normal">
                      12 meses à contar do dia {tce.dataContrato}, podendo ser rescindido unilateralmente por qualquer das partes, a qualquer momento, sem ônus, multas ou aviso-prévio, mediante formalização do respectivo Termo de Rescisão.
                    </span>
                  </div>

                  <div className="text-center font-bold leading-tight">
                    02- Jornada :<br />
                    <span className="font-normal">30 (TRINTA) horas semanais</span>
                  </div>

                  <div className="text-center font-bold leading-tight">
                    03- Atividade do Estagiário(a):<br />
                    <span className="font-normal">
                      {tce.atividadesEstagiario?.trim() || 'ADMINISTRATIVO - AUXILIAR ADMINISTRATIVO / ATENDENTE'}
                    </span>
                  </div>

                  <div className="text-center leading-tight">
                    <span className="font-bold">04- Valor da Bolsa-estágio + Auxílio :</span><br />
                    <span>
                      No período do estágio o Estagiário receberá, uma Bolsa-estágio mensal no valor de R$ {tce.valor} ({tce.valorExtenso} reais) + auxílio-transporte + curso profissionalizante, pagos até o dia {tce.diaPagamento} do mês subsequente ao vencido.
                    </span>
                  </div>

                  <div className="text-center leading-tight">
                    <span className="font-bold">05- Seguro</span><br />
                    <span>
                      No período de vigência do presente TCE, o estagiário terá cobertura de Seguro de Acidentes Pessoais, contratado pela Parte Concedente na Apólice Coletiva de Acidentes Pessoais nº <span className="text-black">{seguradora.apolice}</span> , garantido pela <span className="text-black">{seguradora.nome}</span> , cobertura de:MORTE ACIDENTAL OU INVALIDEZ PERMANENTE TOTAL/PARCIAL POR ACIDENTE 10.000,00. AUX FUNERAL 3.000,00 , nos termos do Inciso IV, do Art. 9º da Lei nº 11.788 de 25/09/2008.
                    </span>
                  </div>

                  {/* Cláusulas Dinâmicas da Matriz do TCE */}
                  {matriz.clausulas.map((c, idx) => {
                    const isClause7 = c.id === 'c7' || c.titulo.includes('7ª') || c.titulo.includes('7a') || c.titulo.includes('Cláusula 7') || idx === 6;
                    return (
                      <React.Fragment key={c.id || idx}>
                        <p className="m-0 text-justify leading-tight">
                          <strong>{c.titulo} - </strong> {c.texto}
                        </p>
                        {isClause7 && (
                          <div className="leading-tight text-transparent select-none" aria-hidden="true">
                            <br />
                            <br />
                            <br />
                            <br />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  <div className="mt-2 leading-tight">
                    <strong className="block uppercase">DO AGENTE DE INTEGRAÇÃO:</strong>
                    <span>{matriz.atribuicoesAgente}</span>
                  </div>
                </div>

                {/* CIDADE FORO E DATA */}
                <div className="text-right font-bold my-3">
                  {tce.cidadeForo}, {tce.dataContrato}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
