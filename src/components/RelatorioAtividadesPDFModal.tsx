import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Printer, FileText, Download, CheckCircle2, Loader2, Copy, ExternalLink } from 'lucide-react';
import { TCEContrato } from '../types/hunter';
import { HunterPDFLogo } from './HunterPDFLogo';
import { HunterWatermark } from './HunterWatermark';
import { getMatrizRelatorio } from '../data/matrizesDefaults';
import { downloadElementAsPDF } from '../utils/pdfDownloader';

interface RelatorioAtividadesPDFModalProps {
  tce: TCEContrato;
  autoDownload?: boolean;
  onClose: () => void;
}

export const RelatorioAtividadesPDFModal: React.FC<RelatorioAtividadesPDFModalProps> = ({ tce, autoDownload = false, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const isObrigatorio = tce.tipoEstagio === 'obrigatorio';
  const rawMatriz = getMatrizRelatorio();

  const replaceTermosEstagio = (text: string): string => {
    if (!isObrigatorio || !text) return text;
    return text
      .replace(/ESTÁGIO\s+NÃO[- ]OBRIGATÓRIO/g, 'ESTÁGIO OBRIGATÓRIO')
      .replace(/Estágio\s+Não[- ]Obrigatório/g, 'Estágio Obrigatório')
      .replace(/estágio\s+não[- ]obrigatório/g, 'estágio obrigatório')
      .replace(/NÃO\s+OBRIGATÓRIO/g, 'OBRIGATÓRIO')
      .replace(/Não-Obrigatório/g, 'Obrigatório')
      .replace(/não-obrigatório/g, 'obrigatório');
  };

  const matriz = useMemo(() => {
    if (!isObrigatorio) return rawMatriz;
    return {
      ...rawMatriz,
      titulo: replaceTermosEstagio(rawMatriz.titulo),
      subtitulo: replaceTermosEstagio(rawMatriz.subtitulo),
      fundamentacao: replaceTermosEstagio(rawMatriz.fundamentacao),
      comunicado: replaceTermosEstagio(rawMatriz.comunicado)
    };
  }, [rawMatriz, isObrigatorio]);

  const handlePrint = () => {
    window.print();
  };

  const { empresa, estagiario } = tce;

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

  const handleDownloadPDF = async () => {
    if (!docRef.current) return;
    setIsDownloading(true);

    const filename = `Hunter_Relatorio_Atividades_N${tce.numero}_${(estagiario?.nome || 'Estagiario').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    try {
      const result = await downloadElementAsPDF(docRef.current, filename, {
        margin: [8, 8, 8, 8],
        pagebreakMode: ['css', 'legacy']
      });

      if (result.success) {
        setCopiedStatus(`✓ PDF (${filename}) baixado com sucesso no seu computador!`);
      }
    } catch (err: any) {
      console.error('Erro ao gerar PDF do Relatório:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload]);

  // Substituições solicitadas pelo usuário:
  // "papa": Nome do responsável da parte concedente no TCE
  const supervisorNome = empresa.responsavel || 'Supervisor Responsável';

  // "dede": Data em que este documento está sendo feito (data atual por extenso)
  const dataHoje = new Date();
  const dataAtualExtenso = dataHoje.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // "dada": Cidade da parte concedente
  const cidadeParteConcedente = empresa.cidade || 'Uberaba';

  // [DATA INICIAL]: Data de início do estágio descrita no TCE
  const dataInicialEstagio = tce.dataInicio || tce.dataContrato || tce.dataCriacao || 'Não informada';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black animate-fadeIn">
      <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.35)] overflow-hidden relative">
        <HunterWatermark size={260} opacity="opacity-[0.08]" />

        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-400 text-black">
                  RELATÓRIO DE ATIVIDADES DE ESTÁGIO
                </span>
                <span className="text-xs text-zinc-400">
                  • TCE Nº {tce.numero} (Lei 11.788/08)
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                {estagiario?.nome || 'Estagiário'} — {empresa?.nomeFantasia || empresa?.razaoSocial}
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

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-900/50 print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={docRef} 
            data-pdf-root
            className="relative overflow-hidden w-full max-w-[800px] mx-auto bg-white text-black p-8 rounded-xl shadow-2xl print:shadow-none print:rounded-none print:p-0 print:max-w-none text-[11px] leading-relaxed select-text"
            style={{ fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' }}
          >
            
            {/* Watermark */}
            <HunterWatermark size={440} opacity="opacity-[0.09]" />

            <div className="relative z-10 space-y-3">
              {/* Header with Logo */}
              <div className="flex items-center justify-between border-b border-zinc-300 pb-3 mb-2">
                <HunterPDFLogo height={44} />
                <div className="text-right font-sans font-bold text-xs text-black">
                  TCE Nº: {tce.numero}<br />
                  <span className="text-[10px] font-normal text-zinc-600">Lei nº 11.788/2008 - Art. 7º, VII</span>
                </div>
              </div>

              {/* Title Header */}
              <div className="text-center my-3 font-sans">
                <h1 className="text-base font-black uppercase text-black tracking-wide">
                  {matriz.titulo || 'RELATÓRIO de ATIVIDADES de ESTÁGIO'}
                </h1>
                <h2 className="text-xs font-bold text-zinc-800 uppercase mt-0.5">
                  {matriz.subtitulo || 'ACORDO DE COOPERAÇÃO PARA REALIZAÇÃO DE ESTÁGIO NÃO OBRIGATÓRIO'}
                </h2>
                <p className="text-[10px] text-zinc-600 italic mt-0.5 whitespace-pre-line">
                  {matriz.fundamentacao || '(Instrumentos jurídicos de que trata o inciso II do artigo 3º, da Lei 11.788, de 25/09/2008.)'}
                </p>
              </div>

              <p className="text-justify my-2 text-black text-[11px] leading-snug whitespace-pre-line">
                {matriz.comunicado || 'Celebram entre si o presente Instrumento jurídico de:\nRELATÓRIO DE ATIVIDADES DE ESTÁGIO, Previsto na Legislação do Estágio. Lei 11.788 de 25/09/2008.\nAs partes a seguir qualificadas,'}
              </p>

              {/* QUALIFICAÇÃO COMPLETA DAS PARTES ("babi") */}
              <div className="border-t border-b border-black py-2 my-2 space-y-2 font-sans text-[10px]">
                {/* MANTENEDORA */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between font-bold w-full">
                    <span>MANTENEDORA:</span>
                    <span>ESCOLA: {estagiario?.escolaNome || 'Escola Não Informada'}</span>
                  </div>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">ESCOLA:</span> {estagiario?.escolaNome || 'Escola Não Informada'} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ENDEREÇO:</span> {estagiario?.escolaEndereco || 'Endereço Não Informado'} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">BAIRRO:</span> {estagiario?.escolaBairro || 'Bairro Não Informado'}
                  </p>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">CIDADE:</span> {estagiario?.escolaCidade || 'Cidade Não Informada'} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">CEP:</span> {estagiario?.escolaCep || 'CEP'} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ESTADO:</span> MG &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">FONE:</span> {estagiario?.escolaFone || 'Fone'}
                  </p>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold">REPRESENTANTE LEGAL:</span>
                    <span>{estagiario?.escolaResponsavel || 'Representante da Escola'}</span>
                  </div>
                </div>

                {/* PARTE CONCEDENTE */}
                <div className="border-t border-zinc-300 pt-1.5 space-y-0.5">
                  <div className="flex items-center justify-between font-bold w-full">
                    <span>PARTE CONCEDENTE:</span>
                    <span>Nome fantasia: {empresa?.nomeFantasia || empresa?.razaoSocial}</span>
                  </div>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">RAZÃO SOCIAL:</span> {empresa?.razaoSocial} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ENDEREÇO:</span> {empresa?.endereco} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">BAIRRO:</span> {empresa?.bairro}
                  </p>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">CIDADE:</span> {empresa?.cidade} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">CEP:</span> {empresa?.cep} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ESTADO:</span> MG &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">FONE:</span> {empresa?.fone}
                  </p>
                  <div className="flex items-center justify-between w-full">
                    <span><span className="font-bold">CNPJ:</span> {empresa?.cnpj}</span>
                    <span><span className="font-bold">REPRESENTANTE LEGAL:</span> {empresa?.responsavel}</span>
                  </div>
                </div>

                {/* AGENTE DE INTEGRAÇÃO */}
                <div className="border-t border-zinc-300 pt-1.5 space-y-0.5">
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
                </div>

                {/* ESTAGIÁRIO(A) */}
                <div className="border-t border-zinc-300 pt-1.5 space-y-0.5">
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">ESTAGIÁRIO(A):</span> {estagiario?.nome} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ENDEREÇO:</span> {estagiario?.endereco} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">BAIRRO:</span> {estagiario?.bairro}
                  </p>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">CIDADE:</span> {estagiario?.cidade} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">ESTADO:</span> MG &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">CEP:</span> {estagiario?.cep} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">DATA NASCIMENTO:</span> {estagiario?.dataNascimento}
                  </p>
                  <p className="text-black" style={{ textAlign: 'justify', textAlignLast: 'justify' }}>
                    <span className="font-bold">RESPONSÁVEL:</span> {estagiario?.responsavel || 'Não informado'} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">CPF:</span> {estagiario?.cpf} &nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="font-bold">FONE:</span> {estagiario?.fone}
                  </p>
                </div>
              </div>

              <div className="my-3 text-[11px] text-justify leading-relaxed">
                <p>
                  Supervisor(a) do estágio: <strong>{supervisorNome}</strong> – {matriz.cargoPadrao || 'DIRETOR(A) ADMINISTRATIVO(A)'}
                </p>
                <p className="mt-1">
                  As partes convencionam o <strong>RELATÓRIO DE ATIVIDADES</strong> a seguir:
                </p>
              </div>

              {/* 1) Período Estagiado */}
              <div className="my-3 space-y-1 text-[11px] text-justify leading-relaxed">
                <p className="font-bold text-xs font-sans">1) Período Estagiado:</p>
                <p>
                  De: <strong>{dataInicialEstagio}</strong> a <strong>{dataAtualExtenso}</strong>
                </p>
                <p>Carga horária: <strong>{matriz.horasSemanais || '30 horas semanais'}</strong></p>
                <p>
                  Supervisor(a) do estágio: <strong>{supervisorNome}</strong> – {matriz.cargoPadrao || 'DIRETOR(A) ADMINISTRATIVO(A)'}
                </p>
              </div>

              {/* 2) Atividade do Estagiário */}
              <div className="my-3 space-y-1 text-[11px] text-justify">
                <p className="font-bold text-xs font-sans">2) Atividade do Estagiário(a):</p>
                <p className="font-semibold uppercase tracking-wide">
                  {tce.atividadesEstagiario?.trim() || matriz.atividadePadrao || 'ADMINISTRATIVO - AUXILIAR ADMINISTRATIVO / ATENDENTE'}
                </p>
              </div>

              {/* 3) Acompanhamento das Atividades */}
              <div className="my-3 space-y-2 text-[11px]">
                <p className="font-bold text-xs font-sans">3) Acompanhamento das Atividades:</p>
                <p className="text-justify leading-relaxed">
                  Durante o período de estágio, o(a) estagiário(a) desenvolveu suas atividades sob orientação e acompanhamento do(a) supervisor(a) responsável, observando as normas, procedimentos e orientações estabelecidas pela parte concedente.
                </p>
                <p className="text-justify leading-relaxed mt-2">
                  No período avaliado, foram observados os seguintes aspectos:
                </p>

                <div className="space-y-2 mt-2 text-justify leading-relaxed">
                  {matriz.aspectosAvaliados?.map((aspecto, idx) => {
                    const isItemB = aspecto.letra?.toLowerCase() === 'b' || aspecto.titulo?.toLowerCase().includes('responsabilidade') || idx === 1;
                    return (
                      <React.Fragment key={idx}>
                        <div>
                          <p className="font-bold">{aspecto.letra}) {aspecto.titulo}</p>
                          <p className="text-justify leading-relaxed">{aspecto.descricao}</p>
                        </div>
                        {isItemB && (
                          <div className="leading-tight text-transparent select-none" aria-hidden="true">
                            <br />
                            <br />
                            <br />
                            <br />
                            <br />
                            <br />
                            <br />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* 4) Considerações sobre o período de estágio */}
              <div className="my-4 space-y-1 text-[11px] text-justify leading-relaxed">
                <p className="font-bold text-xs font-sans">4) Considerações sobre o período de estágio:</p>
                <p className="text-justify leading-relaxed">
                  {matriz.consideracoesFinais || 'No período avaliado, o(a) estagiário(a) apresentou desenvolvimento compatível com as atividades propostas, participando das rotinas do ambiente profissional e recebendo acompanhamento e orientação do(a) supervisor(a) responsável.'}
                </p>
              </div>

              {/* Data e Local */}
              <div className="text-right font-sans font-semibold text-xs mt-8 mb-4">
                {cidadeParteConcedente} - MG, {dataAtualExtenso}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

