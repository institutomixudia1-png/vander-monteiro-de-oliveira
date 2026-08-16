import React, { useState, useEffect, useMemo } from 'react';
import { HunterLogo } from '../HunterLogo';
import { HunterWatermark } from '../HunterWatermark';
import { Crosshair, Building2, UserCheck, GraduationCap, ShieldAlert, Sparkles, Terminal, HardDriveDownload, FileText, Shield, Edit3, Plus, Trash2, X, CheckCircle2, Users, FolderOpen, Search, Eye, Download, Printer, DollarSign, Calendar, FileX, AlertCircle, FileEdit, ClipboardList, KeyRound, PieChart as PieChartIcon } from 'lucide-react';
import { TabId, HunterDados, Seguradora, Empresa, ContratoParceria, TCEContrato, Estagiario, FolhaPagamentoSalva, getEstagiariosAtivosDaEmpresa } from '../../types/hunter';
import { GlowButton } from '../GlowButton';
import { ContratoParceriaPDFModal } from '../ContratoParceriaPDFModal';
import { TCEPDFModal } from '../TCEPDFModal';
import { TermoRescisaoPDFModal, TermoRescisaoData } from '../TermoRescisaoPDFModal';
import { FolhaPagamentoModal } from '../FolhaPagamentoModal';
import { FolhaPDFModal } from '../FolhaPDFModal';
import { RelatorioAtividadesPDFModal } from '../RelatorioAtividadesPDFModal';
import { HunterLogoSplashModal } from '../HunterLogoSplashModal';
import { MatrizesModal } from '../MatrizesModal';
import { WhatsAppButton } from '../WhatsAppButton';
import { RedefinirSenhaModal } from '../RedefinirSenhaModal';
import { MetricasModal } from '../MetricasModal';
import { DEFAULT_HUNTER_DADOS, DEFAULT_SEGURADORAS, DEFAULT_ESTAGIARIOS, DEFAULT_CONTRATOS } from '../../data/sampleData';
import { triggerAutoSaveToCloud } from '../../lib/supabase';
// @ts-ignore
import adminOfficeFullscreenBg from '../../assets/images/admin_office_fullscreen_bg_1786668610871.jpg';

const STORAGE_KEY_HUNTER_DADOS = 'hunter_desktop_dados_v1';
const STORAGE_KEY_SEGURADORAS = 'hunter_desktop_seguradoras_v1';
const STORAGE_KEY_CONTRATOS = 'hunter_desktop_contratos_parceria_v1';
const STORAGE_KEY_TCES = 'hunter_desktop_tces_v1';
const STORAGE_KEY_ESTAGIARIOS = 'hunter_desktop_estagiarios_v1';
const STORAGE_KEY_RESCISAO_NUM = 'hunter_next_rescisao_num_v1';
const STORAGE_KEY_RESCISOES = 'hunter_desktop_rescisoes_v1';
const STORAGE_KEY_FOLHAS = 'hunter_desktop_folhas_v1';

const getFormattedCurrentDate = () => {
  const now = new Date();
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dia = String(now.getDate()).padStart(2, '0');
  const mes = meses[now.getMonth()];
  const ano = now.getFullYear();
  return `${dia} de ${mes} de ${ano}`;
};

interface HunterViewProps {
  onNavigate: (tab: TabId) => void;
  onOpenDownloadModal: () => void;
  empresas?: Empresa[];
  onDeleteEmpresa?: (id: string) => void;
  onUpdatePassword?: (newPass: string) => void;
  estagiarios?: Estagiario[];
}

const calcularDiasTCEAtivo = (tce: TCEContrato): number => {
  const dateStr = tce.dataUltimoRelatorio || tce.dataInicio || tce.dataContrato || tce.dataCriacao;
  if (!dateStr) return 0;

  let startDate: Date | null = null;
  const trimmed = dateStr.trim();

  // Pattern DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/').map(Number);
    startDate = new Date(year, month - 1, day);
  }
  // Pattern YYYY-MM-DD
  else if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    startDate = new Date(trimmed);
  }
  // Pattern "DD de Mês de YYYY"
  else {
    const mesesMap: Record<string, number> = {
      janeiro: 0, fev: 1, fevereiro: 1, marco: 2, março: 2, abril: 3, maio: 4, junho: 5,
      julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dez: 11, dezembro: 11
    };
    const match = trimmed.toLowerCase().match(/(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = mesesMap[match[2]] ?? 0;
      const year = parseInt(match[3], 10);
      startDate = new Date(year, month, day);
    } else {
      const parsed = Date.parse(trimmed);
      if (!isNaN(parsed)) {
        startDate = new Date(parsed);
      }
    }
  }

  if (!startDate || isNaN(startDate.getTime())) return 0;

  const today = new Date();
  const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const diffMs = todayMidnight - startMidnight;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const HunterView: React.FC<HunterViewProps> = ({
  onNavigate,
  onOpenDownloadModal,
  empresas = [],
  onDeleteEmpresa,
  onUpdatePassword,
  estagiarios: estagiariosProps
}) => {
  // Estado para Dados Cadastrais da Hunter (único cadastro)
  const [hunterDados, setHunterDados] = useState<HunterDados | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HUNTER_DADOS);
      return saved ? JSON.parse(saved) : DEFAULT_HUNTER_DADOS;
    } catch {
      return DEFAULT_HUNTER_DADOS;
    }
  });

  // Estado para Seguradoras (máximo 5)
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SEGURADORAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_SEGURADORAS;
    } catch {
      return DEFAULT_SEGURADORAS;
    }
  });

  // Estado para Contratos de Parceria de Clientes (inicia no 1200 em sequência)
  const [contratos, setContratos] = useState<ContratoParceria[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONTRATOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_CONTRATOS;
    } catch {
      return DEFAULT_CONTRATOS;
    }
  });

  // Estado para Estagiários
  const [estagiariosState, setEstagiarios] = useState<Estagiario[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ESTAGIARIOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_ESTAGIARIOS;
    } catch {
      return DEFAULT_ESTAGIARIOS;
    }
  });

  const estagiarios = estagiariosProps || estagiariosState;

  // Estado para Termos de Compromisso de Estágio (TCEs)
  const [tces, setTces] = useState<TCEContrato[]>(() => {
    try {
      const isReset = localStorage.getItem('hunter_desktop_reset_v3');
      if (!isReset) return [];
      const saved = localStorage.getItem(STORAGE_KEY_TCES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Estado para Termos de Rescisão de Estágio
  const [rescisoes, setRescisoes] = useState<TermoRescisaoData[]>(() => {
    try {
      const isReset = localStorage.getItem('hunter_desktop_reset_v3');
      if (!isReset) return [];
      const saved = localStorage.getItem(STORAGE_KEY_RESCISOES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Estado para Folhas de Pagamento Salvas
  const [folhasPagamento, setFolhasPagamento] = useState<FolhaPagamentoSalva[]>(() => {
    try {
      const isReset = localStorage.getItem('hunter_desktop_reset_v3');
      if (!isReset) return [];
      const saved = localStorage.getItem(STORAGE_KEY_FOLHAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const isHunterLoadedRef = React.useRef(false);

  useEffect(() => {
    if (hunterDados) {
      localStorage.setItem(STORAGE_KEY_HUNTER_DADOS, JSON.stringify(hunterDados));
      if (isHunterLoadedRef.current) triggerAutoSaveToCloud();
    }
  }, [hunterDados]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SEGURADORAS, JSON.stringify(seguradoras));
    if (isHunterLoadedRef.current) triggerAutoSaveToCloud();
  }, [seguradoras]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONTRATOS, JSON.stringify(contratos));
    if (isHunterLoadedRef.current) triggerAutoSaveToCloud();
  }, [contratos]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TCES, JSON.stringify(tces));
    if (isHunterLoadedRef.current) triggerAutoSaveToCloud();
  }, [tces]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESCISOES, JSON.stringify(rescisoes));
    if (isHunterLoadedRef.current) triggerAutoSaveToCloud();
  }, [rescisoes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FOLHAS, JSON.stringify(folhasPagamento));
    if (isHunterLoadedRef.current) triggerAutoSaveToCloud();
  }, [folhasPagamento]);

  useEffect(() => {
    isHunterLoadedRef.current = true;
  }, []);

  // Listener para recarregar todos os dados após restauração do Supabase
  useEffect(() => {
    const handleDatabaseRestored = () => {
      try {
        const savedDados = localStorage.getItem(STORAGE_KEY_HUNTER_DADOS);
        if (savedDados) setHunterDados(JSON.parse(savedDados));

        const savedSeg = localStorage.getItem(STORAGE_KEY_SEGURADORAS);
        if (savedSeg) setSeguradoras(JSON.parse(savedSeg));

        const savedContr = localStorage.getItem(STORAGE_KEY_CONTRATOS);
        if (savedContr) setContratos(JSON.parse(savedContr));

        const savedEstag = localStorage.getItem(STORAGE_KEY_ESTAGIARIOS);
        if (savedEstag) setEstagiarios(JSON.parse(savedEstag));

        const savedTces = localStorage.getItem(STORAGE_KEY_TCES);
        if (savedTces) setTces(JSON.parse(savedTces));

        const savedResc = localStorage.getItem(STORAGE_KEY_RESCISOES);
        if (savedResc) setRescisoes(JSON.parse(savedResc));

        const savedFolhas = localStorage.getItem(STORAGE_KEY_FOLHAS);
        if (savedFolhas) setFolhasPagamento(JSON.parse(savedFolhas));
      } catch (err) {
        console.error('Erro ao atualizar estados locais após restauração:', err);
      }
    };

    window.addEventListener('hunter_database_restored', handleDatabaseRestored);
    return () => window.removeEventListener('hunter_database_restored', handleDatabaseRestored);
  }, []);

  const handleSaveFolha = (novaFolha: FolhaPagamentoSalva) => {
    setFolhasPagamento((prev) => [novaFolha, ...prev]);
  };

  const handleDeleteFolha = (id: string) => {
    setFolhasPagamento((prev) => prev.filter((f) => f.id !== id));
  };

  // Modais e Área de Trabalho
  type AdminWorkspaceSection = 'none' | 'dados' | 'seguradoras' | 'clientes' | 'tce' | 'matrizes' | 'relatorio' | 'metricas';
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState<AdminWorkspaceSection>('none');
  const [showMetricasModal, setShowMetricasModal] = useState(false);
  const [showLogoSplashModal, setShowLogoSplashModal] = useState(false);
  const [showDadosWorkspace, setShowDadosWorkspace] = useState(false);
  const [showRedefinirSenhaModal, setShowRedefinirSenhaModal] = useState(false);
  const [showSeguradorasModal, setShowSeguradorasModal] = useState(false);
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [showNovoContratoModal, setShowNovoContratoModal] = useState(false);
  const [showTCEModal, setShowTCEModal] = useState(false);
  const [showDocumentosModal, setShowDocumentosModal] = useState(false);
  const [showMatrizesModal, setShowMatrizesModal] = useState(false);
  const [showFolhaModal, setShowFolhaModal] = useState(false);
  const [showRelatorioAtividadesModal, setShowRelatorioAtividadesModal] = useState(false);
  const [selectedTCEForRelatorio, setSelectedTCEForRelatorio] = useState<TCEContrato | null>(null);
  const [autoDownloadRelatorioPDF, setAutoDownloadRelatorioPDF] = useState(false);
  const [searchRelatorioTerm, setSearchRelatorioTerm] = useState('');
  const [documentosTab, setDocumentosTab] = useState<'tces' | 'rescisoes' | 'contratos' | 'folhas'>('tces');
  const [selectedContratoForPDF, setSelectedContratoForPDF] = useState<ContratoParceria | null>(null);
  const [autoDownloadContratoPDF, setAutoDownloadContratoPDF] = useState(false);
  const [selectedEmpresaForView, setSelectedEmpresaForView] = useState<ContratoParceria | null>(null);
  const [selectedTCEForPDF, setSelectedTCEForPDF] = useState<TCEContrato | null>(null);
  const [autoDownloadTcePDF, setAutoDownloadTcePDF] = useState(false);
  const [selectedFolhaForPDF, setSelectedFolhaForPDF] = useState<FolhaPagamentoSalva | null>(null);
  const [selectedEmpresaForContrato, setSelectedEmpresaForContrato] = useState<Empresa | null>(null);
  const [searchEmpresaTerm, setSearchEmpresaTerm] = useState('');
  const [isEditingDados, setIsEditingDados] = useState(false);

  // Estados para confirmação de exclusão
  const [empresaContratoToDelete, setEmpresaContratoToDelete] = useState<ContratoParceria | null>(null);
  const [empresaContratoAlert, setEmpresaContratoAlert] = useState<{ nome: string; count: number } | null>(null);
  const [tceToDelete, setTceToDelete] = useState<TCEContrato | null>(null);
  const [rescisaoToDelete, setRescisaoToDelete] = useState<TermoRescisaoData | null>(null);
  const [seguradoraToDelete, setSeguradoraToDelete] = useState<Seguradora | null>(null);

  // Estados para Rescisão de Estágio (TCE)
  const [tceParaRescindir, setTceParaRescindir] = useState<TCEContrato | null>(null);
  const [dataRescisaoInput, setDataRescisaoInput] = useState<string>('');
  const [motivoRescisaoInput, setMotivoRescisaoInput] = useState<'À pedido da empresa' | 'À pedido do estagiário(a)'>('À pedido da empresa');
  const [selectedTermoRescisaoData, setSelectedTermoRescisaoData] = useState<TermoRescisaoData | null>(null);
  const [autoDownloadRescisaoPDF, setAutoDownloadRescisaoPDF] = useState(false);

  // Estados para Fechamento de Folha do Estagiário Rescindido
  const [referenciaFolhaRescisaoInput, setReferenciaFolhaRescisaoInput] = useState<string>('Agosto');
  const [anoFolhaRescisaoInput, setAnoFolhaRescisaoInput] = useState<string>('2026');
  const [ultimoDiaEstagiadoInput, setUltimoDiaEstagiadoInput] = useState<string>('');
  const [faltasRescisaoInput, setFaltasRescisaoInput] = useState<string>('0');
  const [bonificacoesRescisaoInput, setBonificacoesRescisaoInput] = useState<string>('0,00');
  const [adiantamentoRescisaoInput, setAdiantamentoRescisaoInput] = useState<string>('0,00');

  const handleOpenRescisaoModal = (tceItem: TCEContrato) => {
    setTceParaRescindir(tceItem);
    const currentDateStr = getFormattedCurrentDate();
    setDataRescisaoInput(currentDateStr);
    setUltimoDiaEstagiadoInput(currentDateStr);
    setMotivoRescisaoInput('À pedido da empresa');

    const now = new Date();
    const mesesNomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    setReferenciaFolhaRescisaoInput(mesesNomes[now.getMonth()]);
    setAnoFolhaRescisaoInput(String(now.getFullYear()));
    setFaltasRescisaoInput('0');
    setBonificacoesRescisaoInput('0,00');
    setAdiantamentoRescisaoInput('0,00');
  };

  // Estados para Modal de Estagiários Rescindidos (Filtro por Mês, Ano e Empresa)
  const [showRescindidosModal, setShowRescindidosModal] = useState(false);
  const [filterRescisaoMes, setFilterRescisaoMes] = useState<string>('');
  const [filterRescisaoAno, setFilterRescisaoAno] = useState<string>('');
  const [filterRescisaoEmpresa, setFilterRescisaoEmpresa] = useState<string>('');

  const handleOpenRescindidosModalFromEmpresa = () => {
    if (selectedEmpresaForView) {
      setFilterRescisaoEmpresa(
        selectedEmpresaForView.empresa?.razaoSocial || selectedEmpresaForView.empresa?.nome || ''
      );
    }
    const now = new Date();
    const mesesNomes = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    setFilterRescisaoMes(mesesNomes[now.getMonth()]);
    setFilterRescisaoAno(String(now.getFullYear()));
    setShowRescindidosModal(true);
  };

  const handleGerarRelatorioAtividades = async (tceItem: TCEContrato) => {
    // 1. Copiar e-mail do aluno e da escola para a área de transferência
    const emailsToCopy: string[] = [];
    if (tceItem.estagiario?.email?.trim()) {
      emailsToCopy.push(tceItem.estagiario.email.trim());
    }
    if (tceItem.estagiario?.escolaEmail?.trim()) {
      emailsToCopy.push(tceItem.estagiario.escolaEmail.trim());
    }
    if (emailsToCopy.length > 0) {
      try {
        await navigator.clipboard.writeText(emailsToCopy.join(', '));
      } catch (err) {
        console.error('Erro ao copiar e-mails para a área de transferência:', err);
      }
    }

    // 2. Abrir a página https://painel.autentique.com.br/documentos/novo em nova aba
    window.open('https://painel.autentique.com.br/documentos/novo', '_blank');

    // 3. Atualizar data do último relatório, acionar o download do PDF e abrir a modal
    const nowIso = new Date().toISOString();
    setTces((prevTces) =>
      prevTces.map((item) =>
        item.id === tceItem.id
          ? { ...item, dataUltimoRelatorio: nowIso }
          : item
      )
    );
    setAutoDownloadRelatorioPDF(true);
    setSelectedTCEForRelatorio(tceItem);
  };

  const getFilteredRescisoes = () => {
    return rescisoes.filter((res) => {
      // 1. Empresa check
      const empNome = (res.tce?.empresa?.razaoSocial || res.tce?.empresa?.nome || '').toLowerCase();
      const empCnpj = (res.tce?.empresa?.cnpj || '').toLowerCase();
      const filterEmp = filterRescisaoEmpresa.trim().toLowerCase();
      const matchesEmpresa = !filterEmp || empNome.includes(filterEmp) || empCnpj.includes(filterEmp);

      // 2. Date string checks
      const dtRes = (res.dataRescisao || '').toLowerCase();
      const dtCria = (res.dataCriacao || '').toLowerCase();
      const fullDateText = `${dtRes} ${dtCria}`;

      // Month check
      const filterMes = filterRescisaoMes.trim().toLowerCase();
      let matchesMes = true;
      if (filterMes) {
        const monthMap: Record<string, string[]> = {
          '01': ['01', '1', 'janeiro', 'jan'],
          '1': ['01', '1', 'janeiro', 'jan'],
          '02': ['02', '2', 'fevereiro', 'fev'],
          '2': ['02', '2', 'fevereiro', 'fev'],
          '03': ['03', '3', 'março', 'marco', 'mar'],
          '3': ['03', '3', 'março', 'marco', 'mar'],
          '04': ['04', '4', 'abril', 'abr'],
          '4': ['04', '4', 'abril', 'abr'],
          '05': ['05', '5', 'maio'],
          '5': ['05', '5', 'maio'],
          '06': ['06', '6', 'junho', 'jun'],
          '6': ['06', '6', 'junho', 'jun'],
          '07': ['07', '7', 'julho', 'jul'],
          '7': ['07', '7', 'julho', 'jul'],
          '08': ['08', '8', 'agosto', 'ago'],
          '8': ['08', '8', 'agosto', 'ago'],
          '09': ['09', '9', 'setembro', 'set'],
          '9': ['09', '9', 'setembro', 'set'],
          '10': ['10', 'outubro', 'out'],
          '11': ['11', 'novembro', 'nov'],
          '12': ['12', 'dezembro', 'dez'],
        };
        const monthVariants = monthMap[filterMes] || [filterMes];
        matchesMes = monthVariants.some((v) => fullDateText.includes(v));
      }

      // Year check
      const filterAno = filterRescisaoAno.trim().toLowerCase();
      const matchesAno = !filterAno || fullDateText.includes(filterAno);

      return matchesEmpresa && matchesMes && matchesAno;
    });
  };

  const handleConfirmarRescisao = async () => {
    if (!tceParaRescindir) return;

    // 1. Copiar e-mail do aluno e da escola para a área de transferência
    const emailsToCopy: string[] = [];
    if (tceParaRescindir.estagiario?.email?.trim()) {
      emailsToCopy.push(tceParaRescindir.estagiario.email.trim());
    }
    if (tceParaRescindir.estagiario?.escolaEmail?.trim()) {
      emailsToCopy.push(tceParaRescindir.estagiario.escolaEmail.trim());
    }
    if (emailsToCopy.length > 0) {
      try {
        await navigator.clipboard.writeText(emailsToCopy.join(', '));
      } catch (err) {
        console.error('Erro ao copiar e-mails para a área de transferência:', err);
      }
    }

    // 2. Abrir a página https://painel.autentique.com.br/documentos/novo em nova aba
    window.open('https://painel.autentique.com.br/documentos/novo', '_blank');

    // Número sequencial da rescisão (inicia em 730)
    const savedNum = localStorage.getItem(STORAGE_KEY_RESCISAO_NUM);
    const currentNum = savedNum ? parseInt(savedNum, 10) : 730;
    const nextNum = isNaN(currentNum) ? 730 : currentNum;

    // Salvar próximo número para futura rescisão
    localStorage.setItem(STORAGE_KEY_RESCISAO_NUM, String(nextNum + 1));

    // 1. Retirar estagiário da lista de estagiários da empresa atual (remove o TCE)
    setTces((prev) => prev.filter((t) => t.id !== tceParaRescindir.id));

    // 2. Preparar dados
    const dataRescisaoFinal = dataRescisaoInput.trim() || getFormattedCurrentDate();
    const ultimoDiaFinal = ultimoDiaEstagiadoInput.trim() || dataRescisaoFinal;
    const refFinal = referenciaFolhaRescisaoInput.trim() || 'Agosto';
    const anoFinal = anoFolhaRescisaoInput.trim() || String(new Date().getFullYear());
    const faltasFinal = faltasRescisaoInput.trim() || '0';
    const boniFinal = bonificacoesRescisaoInput.trim() || '0,00';
    const adianFinal = adiantamentoRescisaoInput.trim() || '0,00';

    const folhaRescisaoData = {
      referencia: refFinal,
      ano: anoFinal,
      ultimoDiaEstagiado: ultimoDiaFinal,
      faltas: faltasFinal,
      bonificacoes: boniFinal,
      adiantamento: adianFinal,
    };

    const novaRescisao: TermoRescisaoData = {
      numeroRescisao: nextNum,
      tce: tceParaRescindir,
      dataRescisao: dataRescisaoFinal,
      motivoRescisao: motivoRescisaoInput,
      dataCriacao: getFormattedCurrentDate(),
      folhaRescisao: folhaRescisaoData,
    };

    // 3. Fechamento de Folha automático (Apenas do estagiário rescindido)
    const novaFolhaRescisaoSalva: FolhaPagamentoSalva = {
      id: `folha_rescisao_${Date.now()}`,
      numeroFolha: `RESC-${nextNum}`,
      empresa: tceParaRescindir.empresa,
      referencia: refFinal,
      ano: anoFinal,
      dataEmissao: getFormattedCurrentDate(),
      estagiariosAtivos: [
        {
          tce: tceParaRescindir,
          faltas: faltasFinal,
          bonificacoes: boniFinal,
          adiantamento: adianFinal,
          ultimoDiaEstagiado: ultimoDiaFinal,
        },
      ],
    };

    setFolhasPagamento((prev) => [novaFolhaRescisaoSalva, ...prev]);

    // 4. Salvar na lista de rescisões
    setRescisoes((prev) => [novaRescisao, ...prev]);

    // 5. Abrir modal do PDF do Termo de Rescisão com a Folha Anexa e download automático
    setAutoDownloadRescisaoPDF(true);
    setSelectedTermoRescisaoData(novaRescisao);

    // Fechar modal de entrada
    setTceParaRescindir(null);
  };

  const handleDeleteRescisao = (numeroRescisao: number) => {
    const target = rescisoes.find((r) => r.numeroRescisao === numeroRescisao);
    if (target) {
      setRescisaoToDelete(target);
    }
  };

  // Estados para geração do TCE
  const [selectedEmpresaForTCE, setSelectedEmpresaForTCE] = useState<Empresa | null>(null);
  const [selectedEstagiarioForTCE, setSelectedEstagiarioForTCE] = useState<Estagiario | null>(null);
  const [selectedSeguradoraForTCE, setSelectedSeguradoraForTCE] = useState<Seguradora | null>(null);
  const [tceTipoEstagio, setTceTipoEstagio] = useState<'nao_obrigatorio' | 'obrigatorio'>('nao_obrigatorio');
  const [tceAtividadesEstagiario, setTceAtividadesEstagiario] = useState('');
  const [tceValor, setTceValor] = useState('');
  const [tceValorExtenso, setTceValorExtenso] = useState('');
  const [tceDia, setTceDia] = useState('');
  const [tceDataContrato, setTceDataContrato] = useState('31 de Julho de 2026');

  // Form Dados da Hunter
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [cep, setCep] = useState('');
  const [fone, setFone] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [email, setEmail] = useState('');
  const [cnpj, setCnpj] = useState('');

  // Form Seguradora
  const [segNome, setSegNome] = useState('');
  const [segApolice, setSegApolice] = useState('');
  const [segObservacao, setSegObservacao] = useState('');
  const [segFone, setSegFone] = useState('');

  // Form Contrato de Parceria
  const [cpValor, setCpValor] = useState('');
  const [cpValorExtenso, setCpValorExtenso] = useState('');
  const [cpDiaPagamento, setCpDiaPagamento] = useState('');
  const [cpDataInicio, setCpDataInicio] = useState('');

  useEffect(() => {
    if (hunterDados) {
      localStorage.setItem(STORAGE_KEY_HUNTER_DADOS, JSON.stringify(hunterDados));
    }
  }, [hunterDados]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SEGURADORAS, JSON.stringify(seguradoras));
  }, [seguradoras]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONTRATOS, JSON.stringify(contratos));
  }, [contratos]);

  useEffect(() => {
    if (empresas) {
      const empIds = new Set(empresas.map(e => e.id));
      const empCnpjs = new Set(empresas.map(e => e.cnpj).filter(Boolean));
      const empRazaos = new Set(empresas.map(e => (e.razaoSocial || e.nome || '').trim().toLowerCase()).filter(Boolean));

      setContratos(prev => {
        const filtered = prev.filter(ct => {
          if (ct.empresaId && empIds.has(ct.empresaId)) return true;
          if (ct.empresa?.id && empIds.has(ct.empresa.id)) return true;
          if (ct.empresa?.cnpj && empCnpjs.has(ct.empresa.cnpj)) return true;
          const name = (ct.empresa?.razaoSocial || ct.empresa?.nome || '').trim().toLowerCase();
          if (name && empRazaos.has(name)) return true;
          return false;
        });
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    }
  }, [empresas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESCISOES, JSON.stringify(rescisoes));
  }, [rescisoes]);

  // Lista de empresas que possuem contrato de parceria ativo
  const empresasComContratoAtivo = (() => {
    const list: Empresa[] = [];
    const addedIds = new Set<string>();

    (empresas || []).forEach((emp) => {
      const hasContract = (contratos || []).some(
        (c) =>
          c.empresaId === emp.id ||
          c.empresa?.id === emp.id ||
          (c.empresa?.cnpj && emp.cnpj && c.empresa.cnpj === emp.cnpj) ||
          (c.empresa?.razaoSocial && emp.razaoSocial && c.empresa.razaoSocial.trim().toLowerCase() === emp.razaoSocial.trim().toLowerCase())
      );
      if (hasContract && !addedIds.has(emp.id)) {
        list.push(emp);
        addedIds.add(emp.id);
      }
    });

    (contratos || []).forEach((ct) => {
      if (ct.empresa && ct.empresa.id && !addedIds.has(ct.empresa.id)) {
        list.push(ct.empresa);
        addedIds.add(ct.empresa.id);
      }
    });

    return list;
  })();

  // Lista de empresas que AINDA NÃO possuem contrato de parceria
  const empresasSemContrato = (() => {
    return (empresas || []).filter((emp) => {
      const hasContract = (contratos || []).some(
        (c) =>
          c.empresaId === emp.id ||
          c.empresa?.id === emp.id ||
          (c.empresa?.cnpj && emp.cnpj && c.empresa.cnpj === emp.cnpj) ||
          (c.empresa?.razaoSocial && emp.razaoSocial && c.empresa.razaoSocial.trim().toLowerCase() === emp.razaoSocial.trim().toLowerCase())
      );
      return !hasContract;
    });
  })();

  // Lista de contratos filtrados para a pesquisa na área de trabalho
  const filteredContratos = useMemo(() => {
    if (!searchEmpresaTerm.trim()) return contratos;
    const term = searchEmpresaTerm.toLowerCase().trim();
    return contratos.filter((c) => {
      const numStr = String(c.numero || '');
      const empNome = (c.empresa?.nomeFantasia || c.empresa?.razaoSocial || c.empresa?.nome || '').toLowerCase();
      const cnpj = (c.empresa?.cnpj || '').toLowerCase();
      const resp = (c.empresa?.responsavel || '').toLowerCase();
      const cidade = (c.empresa?.cidade || '').toLowerCase();
      return numStr.includes(term) || empNome.includes(term) || cnpj.includes(term) || resp.includes(term) || cidade.includes(term);
    });
  }, [contratos, searchEmpresaTerm]);

  const getNextContratoNumero = () => {
    if (contratos.length === 0) return 1200;
    const max = Math.max(...contratos.map(c => c.numero || 1200));
    return max + 1;
  };

  const formatDataContratoExtenso = (date: Date): string => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const handleOpenNovoContratoModal = () => {
    setShowClientesModal(false);
    setShowDocumentosModal(false);
    setSelectedEmpresaForContrato(null);
    setSearchEmpresaTerm('');
    setCpValor('500,00');
    setCpValorExtenso('quinhentos reais');
    setCpDiaPagamento('10');
    setCpDataInicio(new Date().toLocaleDateString('pt-BR'));
    setShowNovoContratoModal(true);
  };

  const handleGenerateContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresaForContrato) return;

    const num = getNextContratoNumero();
    const novo: ContratoParceria = {
      id: `ct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      numero: num,
      empresaId: selectedEmpresaForContrato.id,
      empresa: selectedEmpresaForContrato,
      valor: cpValor.trim() || '0,00',
      valorExtenso: cpValorExtenso.trim() || 'zero',
      diaPagamento: cpDiaPagamento.trim() || '10',
      dataInicio: cpDataInicio.trim() || new Date().toLocaleDateString('pt-BR'),
      dataContrato: formatDataContratoExtenso(new Date()),
      cidadeForo: selectedEmpresaForContrato.cidade || 'São Paulo',
      dataCriacao: new Date().toLocaleDateString('pt-BR')
    };

    // 1. Copiar e-mail da empresa para a área de transferência
    const companyEmail = selectedEmpresaForContrato.email || '';
    if (companyEmail) {
      try {
        await navigator.clipboard.writeText(companyEmail);
      } catch (err) {
        console.error('Erro ao copiar e-mail para a área de transferência:', err);
      }
    }

    // 2. Abrir a página https://painel.autentique.com.br/documentos/novo em nova aba
    window.open('https://painel.autentique.com.br/documentos/novo', '_blank');

    // 3. Salvar o contrato no estado e abrir a modal de PDF com download automático acionado
    setContratos(prev => [novo, ...prev]);
    setShowNovoContratoModal(false);
    setSelectedEmpresaForContrato(null);
    setAutoDownloadContratoPDF(true);
    setSelectedContratoForPDF(novo);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TCES, JSON.stringify(tces));
  }, [tces]);

  const getNextTceNumero = () => {
    if (tces.length === 0) return 1200;
    const max = Math.max(...tces.map(c => c.numero || 1200));
    return max + 1;
  };

  const handleGenerateTCE = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresaForTCE || !selectedEstagiarioForTCE || !selectedSeguradoraForTCE) {
      alert('Por favor, selecione 1 Empresa, 1 Estagiário e 1 Seguradora para emitir o TCE.');
      return;
    }

    // 1. Copiar email do aluno e email da escola para a área de transferência
    const emailsToCopy: string[] = [];
    if (selectedEstagiarioForTCE.email?.trim()) {
      emailsToCopy.push(selectedEstagiarioForTCE.email.trim());
    }
    if (selectedEstagiarioForTCE.escolaEmail?.trim()) {
      emailsToCopy.push(selectedEstagiarioForTCE.escolaEmail.trim());
    }
    if (emailsToCopy.length > 0) {
      try {
        await navigator.clipboard.writeText(emailsToCopy.join(', '));
      } catch (err) {
        console.error('Erro ao copiar e-mails para a área de transferência:', err);
      }
    }

    // 2. Abrir a página https://painel.autentique.com.br/documentos/novo em nova aba
    window.open('https://painel.autentique.com.br/documentos/novo', '_blank');

    // 3. Salvar TCE e acionar download automático do PDF
    const num = getNextTceNumero();
    const novoTce: TCEContrato = {
      id: `tce-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      numero: num,
      empresaId: selectedEmpresaForTCE.id,
      empresa: selectedEmpresaForTCE,
      estagiarioId: selectedEstagiarioForTCE.id,
      estagiario: selectedEstagiarioForTCE,
      seguradoraId: selectedSeguradoraForTCE.id,
      seguradora: selectedSeguradoraForTCE,
      valor: tceValor.trim() || '800,00',
      valorExtenso: tceValorExtenso.trim() || 'oitocentos reais',
      diaPagamento: tceDia.trim() || '10',
      dataContrato: tceDataContrato.trim() || formatDataContratoExtenso(new Date()),
      cidadeForo: selectedEmpresaForTCE.cidade || 'Uberaba',
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
      tipoEstagio: tceTipoEstagio,
      atividadesEstagiario: tceAtividadesEstagiario.trim() || undefined
    };

    setTces(prev => [novoTce, ...prev]);
    setShowTCEModal(false);
    setSelectedEmpresaForTCE(null);
    setSelectedEstagiarioForTCE(null);
    setSelectedSeguradoraForTCE(null);
    setTceTipoEstagio('nao_obrigatorio');
    setTceAtividadesEstagiario('');
    setAutoDownloadTcePDF(true);
    setSelectedTCEForPDF(novoTce);
  };

  const handleDeleteTCE = (id: string) => {
    const target = tces.find(t => t.id === id);
    if (target) {
      setTceToDelete(target);
    }
  };

  const handleDeleteContrato = (ct: ContratoParceria) => {
    const nomeEmp = ct.empresa?.razaoSocial || ct.empresa?.nome || 'Empresa';
    const estagiariosAtivos = getEstagiariosAtivosDaEmpresa(tces, rescisoes, ct);

    if (estagiariosAtivos.length > 0) {
      setEmpresaContratoAlert({ nome: nomeEmp, count: estagiariosAtivos.length });
      return;
    }

    setEmpresaContratoToDelete(ct);
  };

  const confirmDeleteEmpresaContrato = () => {
    if (!empresaContratoToDelete) return;
    const ct = empresaContratoToDelete;

    // 1. Remover do estado local de contratos do HunterView
    setContratos(prev => prev.filter(c => c.id !== ct.id));

    // 2. Encontrar ID da empresa no cadastro global e chamar onDeleteEmpresa
    const empIdTarget = ct.empresaId || ct.empresa?.id;
    const matchingEmp = (empresas || []).find(e =>
      (empIdTarget && e.id === empIdTarget) ||
      (ct.empresa?.cnpj && e.cnpj && e.cnpj === ct.empresa.cnpj) ||
      (ct.empresa?.razaoSocial && e.razaoSocial && e.razaoSocial === ct.empresa.razaoSocial)
    );

    if (matchingEmp && onDeleteEmpresa) {
      onDeleteEmpresa(matchingEmp.id);
    } else if (empIdTarget && onDeleteEmpresa) {
      onDeleteEmpresa(empIdTarget);
    }

    // 3. Limpar localStorage para a chave 'hunter_desktop_empresas_v1'
    try {
      const empresasRaw = localStorage.getItem('hunter_desktop_empresas_v1');
      if (empresasRaw) {
        const empArr: Empresa[] = JSON.parse(empresasRaw);
        const filtered = empArr.filter(e => {
          if (empIdTarget && e.id === empIdTarget) return false;
          if (matchingEmp && e.id === matchingEmp.id) return false;
          if (ct.empresa?.cnpj && e.cnpj && ct.empresa.cnpj === e.cnpj) return false;
          if (ct.empresa?.razaoSocial && e.razaoSocial && ct.empresa.razaoSocial === e.razaoSocial) return false;
          return true;
        });
        localStorage.setItem('hunter_desktop_empresas_v1', JSON.stringify(filtered));
      }
    } catch (err) {
      console.error('Erro ao limpar empresas no localStorage:', err);
    }

    setEmpresaContratoToDelete(null);
  };

  const handleOpenDadosModal = () => {
    if (activeWorkspaceSection !== 'dados') {
      if (hunterDados) {
        setNomeFantasia(hunterDados.nomeFantasia);
        setRazaoSocial(hunterDados.razaoSocial);
        setEndereco(hunterDados.endereco);
        setBairro(hunterDados.bairro);
        setCidade(hunterDados.cidade);
        setCep(hunterDados.cep);
        setFone(hunterDados.fone);
        setResponsavel(hunterDados.responsavel);
        setEmail(hunterDados.email);
        setCnpj(hunterDados.cnpj);
        setIsEditingDados(false);
      } else {
        setNomeFantasia('');
        setRazaoSocial('');
        setEndereco('');
        setBairro('');
        setCidade('');
        setCep('');
        setFone('');
        setResponsavel('');
        setEmail('');
        setCnpj('');
        setIsEditingDados(true);
      }
      setActiveWorkspaceSection('dados');
    } else {
      setActiveWorkspaceSection('none');
    }
  };

  const handleSaveDados = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFantasia.trim()) return;

    const novosDados: HunterDados = {
      nomeFantasia: nomeFantasia.trim(),
      razaoSocial: razaoSocial.trim(),
      endereco: endereco.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      cep: cep.trim(),
      fone: fone.trim(),
      responsavel: responsavel.trim(),
      email: email.trim(),
      cnpj: cnpj.trim()
    };

    setHunterDados(novosDados);
    setIsEditingDados(false);
  };

  const handleAddSeguradora = (e: React.FormEvent) => {
    e.preventDefault();
    if (!segNome.trim() || seguradoras.length >= 5) return;

    const nova: Seguradora = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nome: segNome.trim(),
      apolice: segApolice.trim(),
      observacao: segObservacao.trim(),
      fone: segFone.trim(),
      dataCadastro: new Date().toLocaleDateString('pt-BR')
    };

    setSeguradoras(prev => [...prev, nova]);
    setSegNome('');
    setSegApolice('');
    setSegObservacao('');
    setSegFone('');
  };

  const handleDeleteSeguradora = (id: string) => {
    setSeguradoras(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col md:flex-row h-full min-h-[520px] text-left select-none relative bg-black" id="view-hunter">
      {/* Imagem de Fundo em Formato Tela Cheia (Sem logomarcas ou textos) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <img
          src={adminOfficeFullscreenBg}
          alt="Painel Administrativo"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover object-center filter contrast-105 -scale-x-100 ${
            activeWorkspaceSection !== 'none' ? 'brightness-[0.12] opacity-40' : 'brightness-95'
          }`}
        />
        {/* Camada total de escurecimento quando qualquer caixa da área de trabalho estiver aberta */}
        {activeWorkspaceSection !== 'none' && (
          <div className="absolute inset-0 bg-black/85" />
        )}
        {/* Camadas sutis de gradiente para garantir contraste, elegância e profundidade */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75" />
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Coluna da Esquerda: Painel Administrativo com os Botões sobre fundo escuro translúcido com desfoque */}
      <div className="w-full md:w-[320px] lg:w-[340px] shrink-0 pt-3 pb-6 px-4 md:px-6 flex flex-col items-start justify-start z-10 bg-black/40 md:bg-black/40 backdrop-blur-md overflow-y-auto">
        <h1 className="text-sm md:text-base font-bold tracking-tight text-amber-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.3)] text-left mb-3">
          Painel Administrativo
        </h1>

        {/* Botões Especiais Dentro do Hunter: organizados um abaixo do outro na esquerda */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* Botão Dados Cadastrais da Hunter */}
          <button
            onClick={handleOpenDadosModal}
            className={`relative group overflow-hidden px-3.5 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 text-left flex items-center justify-between cursor-pointer w-full select-none ${
              activeWorkspaceSection === 'dados'
                ? 'bg-amber-500/25 border-amber-300 text-white shadow-[0_0_22px_rgba(255,215,0,0.35)] scale-[1.01]'
                : 'bg-black/80 border-amber-400/50 hover:bg-amber-500/20 hover:border-amber-300 hover:text-white hover:shadow-[0_4px_22px_rgba(255,215,0,0.25)] hover:scale-[1.015] shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Efeito de brilho/varredura ao passar o mouse */}
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 225, 120, 0.22), transparent)'
              }}
            />
            {/* Linha de acento dourado na parte inferior */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-0 group-hover:w-2/3 group-hover:opacity-80 transition-all duration-300" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-black/75 border border-amber-500/30 group-hover:bg-amber-500/20 group-hover:border-amber-300/80 flex items-center justify-center text-[#FFD700] group-hover:scale-110 transition-all shrink-0">
                <FileText className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)] group-hover:drop-shadow-[0_0_10px_rgba(255,215,0,0.95)]" />
              </div>
              <span className="text-xs md:text-sm font-bold text-amber-400 group-hover:text-amber-200 transition-colors">
                Dados Cadastrais
              </span>
            </div>
          </button>

          {/* Botão Seguradoras */}
          <button
            onClick={() => setActiveWorkspaceSection(prev => prev === 'seguradoras' ? 'none' : 'seguradoras')}
            className={`relative group overflow-hidden px-3.5 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 text-left flex items-center justify-between cursor-pointer w-full select-none ${
              activeWorkspaceSection === 'seguradoras'
                ? 'bg-amber-500/25 border-amber-300 text-white shadow-[0_0_22px_rgba(255,215,0,0.35)] scale-[1.01]'
                : 'bg-black/80 border-amber-400/50 hover:bg-amber-500/20 hover:border-amber-300 hover:text-white hover:shadow-[0_4px_22px_rgba(255,215,0,0.25)] hover:scale-[1.015] shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Efeito de brilho/varredura ao passar o mouse */}
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 225, 120, 0.22), transparent)'
              }}
            />
            {/* Linha de acento dourado na parte inferior */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-0 group-hover:w-2/3 group-hover:opacity-80 transition-all duration-300" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-black/75 border border-amber-500/30 group-hover:bg-amber-500/20 group-hover:border-amber-300/80 flex items-center justify-center text-[#FFD700] group-hover:scale-110 transition-all shrink-0">
                <Shield className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)] group-hover:drop-shadow-[0_0_10px_rgba(255,215,0,0.95)]" />
              </div>
              <span className="text-xs md:text-sm font-bold text-amber-400 group-hover:text-amber-200 transition-colors">
                Seguradoras
              </span>
            </div>
          </button>

          {/* Botão Clientes */}
          <button
            onClick={() => setActiveWorkspaceSection(prev => prev === 'clientes' ? 'none' : 'clientes')}
            className={`relative group overflow-hidden px-3.5 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 text-left flex items-center justify-between cursor-pointer w-full select-none ${
              activeWorkspaceSection === 'clientes'
                ? 'bg-amber-500/25 border-amber-300 text-white shadow-[0_0_22px_rgba(255,215,0,0.35)] scale-[1.01]'
                : 'bg-black/80 border-amber-400/50 hover:bg-amber-500/20 hover:border-amber-300 hover:text-white hover:shadow-[0_4px_22px_rgba(255,215,0,0.25)] hover:scale-[1.015] shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Efeito de brilho/varredura ao passar o mouse */}
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 225, 120, 0.22), transparent)'
              }}
            />
            {/* Linha de acento dourado na parte inferior */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-0 group-hover:w-2/3 group-hover:opacity-80 transition-all duration-300" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-black/75 border border-amber-500/30 group-hover:bg-amber-500/20 group-hover:border-amber-300/80 flex items-center justify-center text-[#FFD700] group-hover:scale-110 transition-all shrink-0">
                <Users className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)] group-hover:drop-shadow-[0_0_10px_rgba(255,215,0,0.95)]" />
              </div>
              <span className="text-xs md:text-sm font-bold text-amber-400 group-hover:text-amber-200 transition-colors">
                Clientes
              </span>
            </div>
          </button>

          {/* Botão TCE */}
          <button
            onClick={() => setActiveWorkspaceSection(prev => prev === 'tce' ? 'none' : 'tce')}
            className={`relative group overflow-hidden px-3.5 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 text-left flex items-center justify-between cursor-pointer w-full select-none ${
              activeWorkspaceSection === 'tce'
                ? 'bg-amber-500/25 border-amber-300 text-white shadow-[0_0_22px_rgba(255,215,0,0.35)] scale-[1.01]'
                : 'bg-black/80 border-amber-400/50 hover:bg-amber-500/20 hover:border-amber-300 hover:text-white hover:shadow-[0_4px_22px_rgba(255,215,0,0.25)] hover:scale-[1.015] shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Efeito de brilho/varredura ao passar o mouse */}
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 225, 120, 0.22), transparent)'
              }}
            />
            {/* Linha de acento dourado na parte inferior */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-0 group-hover:w-2/3 group-hover:opacity-80 transition-all duration-300" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-black/75 border border-amber-500/30 group-hover:bg-amber-500/20 group-hover:border-amber-300/80 flex items-center justify-center text-[#FFD700] group-hover:scale-110 transition-all shrink-0">
                <GraduationCap className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)] group-hover:drop-shadow-[0_0_10px_rgba(255,215,0,0.95)]" />
              </div>
              <span className="text-xs md:text-sm font-bold text-amber-400 group-hover:text-amber-200 transition-colors">
                TCE
              </span>
            </div>
          </button>

          {/* Botão Matrizes */}
          <button
            onClick={() => setActiveWorkspaceSection(prev => prev === 'matrizes' ? 'none' : 'matrizes')}
            className={`relative group overflow-hidden px-3.5 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 text-left flex items-center justify-between cursor-pointer w-full select-none ${
              activeWorkspaceSection === 'matrizes'
                ? 'bg-amber-500/25 border-amber-300 text-white shadow-[0_0_22px_rgba(255,215,0,0.35)] scale-[1.01]'
                : 'bg-black/80 border-amber-400/50 hover:bg-amber-500/20 hover:border-amber-300 hover:text-white hover:shadow-[0_4px_22px_rgba(255,215,0,0.25)] hover:scale-[1.015] shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Efeito de brilho/varredura ao passar o mouse */}
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 225, 120, 0.22), transparent)'
              }}
            />
            {/* Linha de acento dourado na parte inferior */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-0 group-hover:w-2/3 group-hover:opacity-80 transition-all duration-300" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-black/75 border border-amber-500/30 group-hover:bg-amber-500/20 group-hover:border-amber-300/80 flex items-center justify-center text-[#FFD700] group-hover:scale-110 transition-all shrink-0">
                <FileEdit className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)] group-hover:drop-shadow-[0_0_10px_rgba(255,215,0,0.95)]" />
              </div>
              <span className="text-xs md:text-sm font-bold text-amber-400 group-hover:text-amber-200 transition-colors">
                Matrizes
              </span>
            </div>
          </button>

          {/* Botão Relatório de Atividades */}
          <button
            onClick={() => {
              setSearchRelatorioTerm('');
              setActiveWorkspaceSection(prev => prev === 'relatorio' ? 'none' : 'relatorio');
            }}
            className={`relative group overflow-hidden px-3.5 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 text-left flex items-center justify-between cursor-pointer w-full select-none ${
              activeWorkspaceSection === 'relatorio'
                ? 'bg-amber-500/25 border-amber-300 text-white shadow-[0_0_22px_rgba(255,215,0,0.35)] scale-[1.01]'
                : 'bg-black/80 border-amber-400/50 hover:bg-amber-500/20 hover:border-amber-300 hover:text-white hover:shadow-[0_4px_22px_rgba(255,215,0,0.25)] hover:scale-[1.015] shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Efeito de brilho/varredura ao passar o mouse */}
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 225, 120, 0.22), transparent)'
              }}
            />
            {/* Linha de acento dourado na parte inferior */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-0 group-hover:w-2/3 group-hover:opacity-80 transition-all duration-300" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-black/75 border border-amber-500/30 group-hover:bg-amber-500/20 group-hover:border-amber-300/80 flex items-center justify-center text-[#FFD700] group-hover:scale-110 transition-all shrink-0">
                <ClipboardList className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)] group-hover:drop-shadow-[0_0_10px_rgba(255,215,0,0.95)]" />
              </div>
              <span className="text-xs md:text-sm font-bold text-amber-400 group-hover:text-amber-200 transition-colors">
                Relatório de Atividades
              </span>
            </div>
          </button>

          {/* Botão Métricas / Estatísticas */}
          <button
            onClick={() => setActiveWorkspaceSection(prev => prev === 'metricas' ? 'none' : 'metricas')}
            className={`relative group overflow-hidden px-3.5 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 text-left flex items-center justify-between cursor-pointer w-full select-none ${
              activeWorkspaceSection === 'metricas'
                ? 'bg-amber-500/25 border-amber-300 text-white shadow-[0_0_22px_rgba(255,215,0,0.35)] scale-[1.01]'
                : 'bg-black/80 border-amber-400/50 hover:bg-amber-500/20 hover:border-amber-300 hover:text-white hover:shadow-[0_4px_22px_rgba(255,215,0,0.25)] hover:scale-[1.015] shadow-[0_2px_10px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Efeito de brilho/varredura ao passar o mouse */}
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 225, 120, 0.22), transparent)'
              }}
            />
            {/* Linha de acento dourado na parte inferior */}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-0 group-hover:w-2/3 group-hover:opacity-80 transition-all duration-300" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 rounded-lg bg-black/75 border border-amber-500/30 group-hover:bg-amber-500/20 group-hover:border-amber-300/80 flex items-center justify-center text-[#FFD700] group-hover:scale-110 transition-all shrink-0">
                <PieChartIcon className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)] group-hover:drop-shadow-[0_0_10px_rgba(255,215,0,0.95)]" />
              </div>
              <span className="text-xs md:text-sm font-bold text-amber-400 group-hover:text-amber-200 transition-colors">
                Estatísticas
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Área de Trabalho do Painel Administrativo */}
      <div className="flex-1 relative z-10 flex flex-col p-4 md:p-6 overflow-y-auto">
        {/* 1. Área de Trabalho: Dados Cadastrais da Hunter */}
        {activeWorkspaceSection === 'dados' && (
          <div className="w-full max-w-4xl mx-auto my-auto animate-fadeIn text-left py-2">
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_35px_rgba(212,175,55,0.25)] flex flex-col overflow-hidden relative">
              <HunterWatermark size={240} opacity="opacity-[0.12]" />
              
              {/* Cabeçalho da Caixa na Área de Trabalho */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <HunterLogo size={38} glow={true} />
                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-white">
                      Dados Cadastrais da <span className="text-gold-gradient-bright">Hunter</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {hunterDados && !isEditingDados
                        ? 'Cadastro único da Hunter no sistema. Clique em "Editar" para atualizar as informações.'
                        : 'Preencha os campos abaixo para cadastrar os dados cadastrais da Hunter.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {hunterDados && !isEditingDados && (
                    <GlowButton
                      onClick={() => setIsEditingDados(true)}
                      icon={<Edit3 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />}
                      className="!text-[#FFD700]"
                    >
                      <span className="text-[#FFD700] font-bold drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Editar</span>
                    </GlowButton>
                  )}
                  <button
                    onClick={() => setActiveWorkspaceSection('none')}
                    className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                    title="Fechar Área de Trabalho"
                  >
                    <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 relative z-10 pr-1">
                {/* View Modo Somente Leitura */}
                {hunterDados && !isEditingDados ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>A Hunter já está cadastrada. Você pode clicar no botão <b>"Editar"</b> acima para alterar qualquer informação.</span>
                    </div>

                    {/* Card Segurança - Redefinir Senha */}
                    <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-500/40 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(212,175,55,0.12)]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                          <KeyRound className="w-4 h-4 text-[#FFD700]" />
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-zinc-400 uppercase block">Segurança do Sistema</span>
                          <span className="text-xs font-bold text-white">Senha de 6 Dígitos para Acesso</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRedefinirSenhaModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400/80 text-[#FFD700] hover:text-white hover:bg-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)] shrink-0 flex items-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-[#FFD700]" />
                        <span className="text-[#FFD700]">Redefinir Senha</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 uppercase block">Nome Fantasia</span>
                        <span className="font-bold text-base text-[#39FF14]" style={{ color: '#39FF14' }}>{hunterDados.nomeFantasia}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 uppercase block">Razão Social</span>
                        <span className="font-semibold text-[#39FF14]" style={{ color: '#39FF14' }}>{hunterDados.razaoSocial || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 uppercase block">CNPJ</span>
                        <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{hunterDados.cnpj || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 uppercase block">Telefone (Fone)</span>
                        <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{hunterDados.fone || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 uppercase block">Endereço & Bairro</span>
                        <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{hunterDados.endereco || '—'} — {hunterDados.bairro || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 uppercase block">Cidade</span>
                        <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{hunterDados.cidade || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 uppercase block">CEP</span>
                        <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{hunterDados.cep || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                        <span className="text-xs font-semibold text-zinc-500 uppercase block">Responsável</span>
                        <span className="font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{hunterDados.responsavel || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 sm:col-span-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase block">E-mail</span>
                        <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{hunterDados.email || '—'}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveWorkspaceSection('none')}
                        className="px-6 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulário de Edição / Cadastro Único */
                  <form onSubmit={handleSaveDados} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Nome Fantasia *
                        </label>
                        <input
                          type="text"
                          required
                          value={nomeFantasia}
                          onChange={(e) => setNomeFantasia(e.target.value)}
                          placeholder="Ex: Hunter Desktop Brasil"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Razão Social *
                        </label>
                        <input
                          type="text"
                          required
                          value={razaoSocial}
                          onChange={(e) => setRazaoSocial(e.target.value)}
                          placeholder="Ex: Hunter Serviços de Recrutamento Ltda"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Endereço *
                        </label>
                        <input
                          type="text"
                          required
                          value={endereco}
                          onChange={(e) => setEndereco(e.target.value)}
                          placeholder="Ex: Av. Paulista, 1000"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Bairro *
                        </label>
                        <input
                          type="text"
                          required
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          placeholder="Ex: Bela Vista"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          required
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          placeholder="Ex: São Paulo - SP"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          CEP *
                        </label>
                        <input
                          type="text"
                          required
                          value={cep}
                          onChange={(e) => setCep(e.target.value)}
                          placeholder="Ex: 01310-100"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Telefone (Fone) *
                        </label>
                        <input
                          type="text"
                          required
                          value={fone}
                          onChange={(e) => setFone(e.target.value)}
                          placeholder="Ex: (11) 3000-0000"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          CNPJ *
                        </label>
                        <input
                          type="text"
                          required
                          value={cnpj}
                          onChange={(e) => setCnpj(e.target.value)}
                          placeholder="Ex: 12.345.678/0001-90"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Responsável *
                        </label>
                        <input
                          type="text"
                          required
                          value={responsavel}
                          onChange={(e) => setResponsavel(e.target.value)}
                          placeholder="Ex: Diretoria Geral"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Ex: contato@hunter.com.br"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (hunterDados) setIsEditingDados(false);
                          else setActiveWorkspaceSection('none');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 font-bold text-sm shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all cursor-pointer"
                      >
                        Salvar Dados da Hunter
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. Área de Trabalho: Seguradoras */}
        {activeWorkspaceSection === 'seguradoras' && (
          <div className="w-full max-w-4xl mx-auto my-auto animate-fadeIn text-left py-2">
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_35px_rgba(212,175,55,0.25)] flex flex-col overflow-hidden relative">
              <HunterWatermark size={240} opacity="opacity-[0.12]" />
              
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                    <Shield className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-amber-300">
                      Cadastro de <span className="text-gold-gradient-bright">Seguradoras</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Espaço para cadastrar até 5 seguradoras conveniadas (Campos: Nome, Apólice, Fone e Observação)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveWorkspaceSection('none')}
                  className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                  title="Fechar"
                >
                  <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 relative z-10 pr-1 space-y-5">
                {/* Contador de vagas (máx 5) */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-300">
                    Seguradoras Cadastradas:
                  </span>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {seguradoras.length} / 5
                  </span>
                </div>

                {/* Formulário de Cadastro (se < 5) */}
                {seguradoras.length < 5 ? (
                  <form onSubmit={handleAddSeguradora} className="space-y-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Nome da Seguradora *
                        </label>
                        <input
                          type="text"
                          required
                          value={segNome}
                          onChange={(e) => setSegNome(e.target.value)}
                          placeholder="Ex: Porto Seguro Cia de Seguros"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Número da Apólice *
                        </label>
                        <input
                          type="text"
                          required
                          value={segApolice}
                          onChange={(e) => setSegApolice(e.target.value)}
                          placeholder="Ex: 01.0698.000456-0"
                          style={{ color: '#39FF14' }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Telefone (WhatsApp / Contato)
                      </label>
                      <input
                        type="text"
                        value={segFone}
                        onChange={(e) => setSegFone(e.target.value)}
                        placeholder="Ex: (11) 98765-4321 ou (11) 3000-0000"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Observação
                      </label>
                      <input
                        type="text"
                        value={segObservacao}
                        onChange={(e) => setSegObservacao(e.target.value)}
                        placeholder="Ex: Cobertura contra acidentes pessoais para estagiários"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 font-bold text-xs shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                        <span>Cadastrar Seguradora</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-4 font-semibold flex items-center justify-between">
                    <span>Limite máximo de <b>5 seguradoras</b> atingido. Remova uma seguradora se desejar cadastrar outra.</span>
                  </div>
                )}

                {/* Lista das seguradoras cadastradas (até 5) */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Seguradoras Conveniadas
                  </div>
                  {seguradoras.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-xl border border-zinc-800">
                      Nenhuma seguradora cadastrada ainda. Utilize o formulário acima para cadastrar até 5 seguradoras.
                    </div>
                  ) : (
                    seguradoras.map((seg, idx) => (
                      <div
                        key={seg.id}
                        className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4 hover:border-amber-500/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <WhatsAppButton
                              phone={seg.fone}
                              companyName={seg.nome}
                              size="sm"
                            />
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-sm text-[#39FF14]" style={{ color: '#39FF14' }}>
                              {seg.nome}
                            </span>
                            <span className="text-xs font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>
                              • Apólice: <b className="text-[#39FF14]" style={{ color: '#39FF14' }}>{seg.apolice}</b>
                              {seg.fone && <span className="ml-2">• Fone: {seg.fone}</span>}
                            </span>
                          </div>
                          {seg.observacao && (
                            <p className="text-xs pl-8 text-[#39FF14]" style={{ color: '#39FF14' }}>
                              Obs: {seg.observacao}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteSeguradora(seg.id)}
                          className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer shrink-0"
                          title="Excluir seguradora"
                        >
                          <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end">
                  <button
                    onClick={() => setActiveWorkspaceSection('none')}
                    className="px-6 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Área de Trabalho: Clientes (Contratos de Parceria) */}
        {activeWorkspaceSection === 'clientes' && (
          <div className="w-full max-w-5xl mx-auto my-auto animate-fadeIn text-left py-2">
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_35px_rgba(212,175,55,0.25)] flex flex-col overflow-hidden relative">
              <HunterWatermark size={240} opacity="opacity-[0.12]" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-5 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                    <Users className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-white">
                      Empresas Clientes e <span className="text-gold-gradient-bright">Contratos de Parceria</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Relação de empresas conveniadas e contratos ativos no sistema Hunter
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GlowButton
                    onClick={() => setShowNovoContratoModal(true)}
                    icon={<Plus className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />}
                    className="!text-[#FFD700]"
                  >
                    <span className="text-[#FFD700] font-bold drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Novo Contrato</span>
                  </GlowButton>
                  <button
                    onClick={() => setActiveWorkspaceSection('none')}
                    className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                    title="Fechar"
                  >
                    <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  </button>
                </div>
              </div>

              {/* Barra de Pesquisa */}
              <div className="mb-4 relative z-10">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchEmpresaTerm}
                    onChange={(e) => setSearchEmpresaTerm(e.target.value)}
                    placeholder="Pesquisar por empresa, CNPJ, responsável, cidade ou Nº do contrato..."
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors"
                  />
                </div>
              </div>

              {/* Tabela de Contratos */}
              <div className="overflow-y-auto flex-1 border border-zinc-800/80 rounded-xl bg-zinc-900/40 relative z-10">
                {filteredContratos.length === 0 ? (
                  <div className="p-10 text-center text-zinc-500 text-xs">
                    <Building2 className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                    Nenhum contrato de parceria encontrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-zinc-900/90 text-[11px] font-bold text-amber-400 uppercase tracking-wider border-b border-zinc-800 sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="p-3">Nº Contrato</th>
                          <th className="p-3">Empresa Cliente</th>
                          <th className="p-3">CNPJ / Cidade</th>
                          <th className="p-3">Valores</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {filteredContratos.map((c) => (
                          <tr key={c.id} className="hover:bg-zinc-900/80 transition-colors">
                            <td className="p-3 font-mono font-bold text-amber-300">
                              #{String(c.numero).padStart(3, '0')}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-sm text-[#39FF14] flex items-center gap-2" style={{ color: '#39FF14' }}>
                                <WhatsAppButton
                                  phone={c.empresa?.fone}
                                  companyName={c.empresa?.nomeFantasia || c.empresa?.razaoSocial || c.empresa?.nome}
                                  size="sm"
                                />
                                <span>{c.empresa?.nomeFantasia || c.empresa?.nome}</span>
                              </div>
                              <div className="text-[11px] text-[#39FF14]" style={{ color: '#39FF14' }}>
                                {c.empresa?.razaoSocial}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-mono text-[11px] text-[#39FF14]" style={{ color: '#39FF14' }}>
                                {c.empresa?.cnpj || '—'}
                              </div>
                              <div className="text-[11px] text-[#39FF14]" style={{ color: '#39FF14' }}>
                                {c.empresa?.cidade || '—'}
                              </div>
                            </td>
                            <td className="p-3 font-mono text-[11px]">
                              <div>Valor: <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>R$ {c.valor}</span></div>
                              <div className="text-[#39FF14]" style={{ color: '#39FF14' }}>Dia Pgto: {c.diaPagamento}</div>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedEmpresaForView(c)}
                                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                                  title="Ver Dados da Empresa"
                                >
                                  <Building2 className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                                  <span className="text-[#FFD700] font-bold drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Ver Empresa</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedContratoForPDF(c);
                                    setAutoDownloadContratoPDF(false);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/50 text-amber-300 hover:text-white hover:bg-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(255,215,0,0.2)]"
                                  title="Visualizar e Imprimir Contrato PDF"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                                  <span className="text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Gerar PDF</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteContrato(c)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:border-red-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                  title="Excluir Empresa e Contrato"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                                  <span className="text-[#FFD700] font-bold drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Excluir</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-end relative z-10">
                <button
                  onClick={() => setActiveWorkspaceSection('none')}
                  className="px-6 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Área de Trabalho: TCE (Termo de Compromisso de Estágio) */}
        {activeWorkspaceSection === 'tce' && (
          <div className="w-full max-w-3xl mx-auto my-auto animate-fadeIn text-left py-2">
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_35px_rgba(212,175,55,0.25)] flex flex-col overflow-hidden relative">
              <HunterWatermark size={240} opacity="opacity-[0.12]" />
              
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                    <GraduationCap className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                      <span>EMISSÃO DE DOCUMENTO LEGAL (LEI 11.788/08)</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-white">
                      Emitir Novo <span className="text-gold-gradient-bright">TCE (Termo de Estágio)</span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setActiveWorkspaceSection('none')}
                  className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                  title="Fechar"
                >
                  <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 relative z-10 pr-1">
                <form onSubmit={handleGenerateTCE} className="space-y-4">
                  {/* Opção: Modalidade do Estágio (Não-Obrigatório vs Obrigatório) */}
                  <div className="bg-zinc-900/90 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                    <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Modalidade do Estágio (Lei nº 11.788/08)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setTceTipoEstagio('nao_obrigatorio')}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                          tceTipoEstagio === 'nao_obrigatorio'
                            ? 'bg-amber-500/25 border-amber-400 text-[#FFD700] shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                            : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            tceTipoEstagio === 'nao_obrigatorio'
                              ? 'border-amber-400 bg-amber-400'
                              : 'border-zinc-600 bg-transparent'
                          }`}>
                            {tceTipoEstagio === 'nao_obrigatorio' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <span>Estágio Não-Obrigatório</span>
                        </div>
                        {tceTipoEstagio === 'nao_obrigatorio' && (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Padrão</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTceTipoEstagio('obrigatorio')}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                          tceTipoEstagio === 'obrigatorio'
                            ? 'bg-amber-500/25 border-amber-400 text-[#FFD700] shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                            : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            tceTipoEstagio === 'obrigatorio'
                              ? 'border-amber-400 bg-amber-400'
                              : 'border-zinc-600 bg-transparent'
                          }`}>
                            {tceTipoEstagio === 'obrigatorio' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <span>Estágio Obrigatório</span>
                        </div>
                        {tceTipoEstagio === 'obrigatorio' && (
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Curricular</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Seleção de Empresa Concedente */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                      <span>Empresa Concedente (com Contrato Ativo) *</span>
                      <span className="text-[11px] text-amber-400">{contratos.length} empresa(s) conveniada(s)</span>
                    </label>
                    <select
                      required
                      value={selectedEmpresaForTCE?.id || ''}
                      onChange={(e) => {
                        const emp = empresasComContratoAtivo.find((em) => em.id === e.target.value);
                        setSelectedEmpresaForTCE(emp || null);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#FFD700] focus:outline-none focus:border-amber-400 font-bold"
                    >
                      <option value="">-- Selecione uma Empresa Conveniada --</option>
                      {empresasComContratoAtivo.map((em) => (
                        <option key={em.id} value={em.id}>
                          {em.nomeFantasia || em.razaoSocial || em.nome} {em.cnpj ? `(CNPJ: ${em.cnpj})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleção do Estagiário */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                      <span>Estagiário(a) *</span>
                      <span className="text-[11px] text-amber-400">{estagiarios.length} estagiário(s) cadastrado(s)</span>
                    </label>
                    <select
                      required
                      value={selectedEstagiarioForTCE?.id || ''}
                      onChange={(e) => {
                        const est = estagiarios.find((es) => es.id === e.target.value);
                        setSelectedEstagiarioForTCE(est || null);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#FFD700] focus:outline-none focus:border-amber-400 font-bold"
                    >
                      <option value="">-- Selecione um Estagiário --</option>
                      {estagiarios.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.nome} {est.cpf ? `(CPF: ${est.cpf})` : ''} {est.curso ? `— ${est.curso}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleção da Seguradora */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                      <span>Seguradora Conveniada *</span>
                      <span className="text-[11px] text-amber-400">{seguradoras.length} seguradora(s) ativa(s)</span>
                    </label>
                    <select
                      required
                      value={selectedSeguradoraForTCE?.id || ''}
                      onChange={(e) => {
                        const seg = seguradoras.find((s) => s.id === e.target.value);
                        setSelectedSeguradoraForTCE(seg || null);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#FFD700] focus:outline-none focus:border-amber-400 font-bold"
                    >
                      <option value="">-- Selecione a Seguradora --</option>
                      {seguradoras.map((seg) => (
                        <option key={seg.id} value={seg.id}>
                          {seg.nome} (Apólice: {seg.apolice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Valor Bolsa (R$)
                      </label>
                      <input
                        type="text"
                        required
                        value={tceValor}
                        onChange={(e) => setTceValor(e.target.value)}
                        placeholder="Ex: 800,00"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Valor por Extenso
                      </label>
                      <input
                        type="text"
                        required
                        value={tceValorExtenso}
                        onChange={(e) => setTceValorExtenso(e.target.value)}
                        placeholder="Ex: oitocentos reais"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Dia Pagamento
                      </label>
                      <input
                        type="text"
                        required
                        value={tceDia}
                        onChange={(e) => setTceDia(e.target.value)}
                        placeholder="Ex: 10"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                      <span>Atividades do Estagiário</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Opcional - deixe vazio para usar o padrão</span>
                    </label>
                    <input
                      type="text"
                      value={tceAtividadesEstagiario}
                      onChange={(e) => setTceAtividadesEstagiario(e.target.value)}
                      placeholder="Padrão: ADMINISTRATIVO - AUXILIAR ADMINISTRATIVO / ATENDENTE"
                      style={{ color: '#39FF14' }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Data de Início do Contrato
                    </label>
                    <input
                      type="text"
                      required
                      value={tceDataContrato}
                      onChange={(e) => setTceDataContrato(e.target.value)}
                      placeholder="Ex: 31 de Julho de 2026"
                      style={{ color: '#39FF14' }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setActiveWorkspaceSection('none')}
                      className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedEmpresaForTCE || !selectedEstagiarioForTCE || !selectedSeguradoraForTCE}
                      className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                        selectedEmpresaForTCE && selectedEstagiarioForTCE && selectedSeguradoraForTCE
                          ? 'bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 shadow-[0_4px_20px_rgba(251,191,36,0.35)]'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                      <span>Gerar TCE Nº {getNextTceNumero()} em PDF</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 5. Área de Trabalho: Matrizes de Documentos */}
        {activeWorkspaceSection === 'matrizes' && (
          <div className="w-full max-w-5xl mx-auto my-auto animate-fadeIn text-left py-2">
            <MatrizesModal
              isOpen={true}
              onClose={() => setActiveWorkspaceSection('none')}
              embedded={true}
            />
          </div>
        )}

        {/* 6. Área de Trabalho: Relatório Semestral de Atividades */}
        {activeWorkspaceSection === 'relatorio' && (
          <div className="w-full max-w-5xl mx-auto my-auto animate-fadeIn text-left py-2">
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_35px_rgba(212,175,55,0.25)] flex flex-col overflow-hidden relative">
              <HunterWatermark size={240} opacity="opacity-[0.12]" />
              
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.25)]">
                    <ClipboardList className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-extrabold text-white">
                      Relatório de Atividades dos <span className="text-gold-gradient-bright">Estagiários</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Emissão semestral (mínimo de 180 dias de estágio ativo) conforme Art. 9º, VII da Lei nº 11.788/08
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveWorkspaceSection('none')}
                  className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                  title="Fechar"
                >
                  <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4 relative shrink-0 z-10">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome do estagiário, empresa, CPF ou Nº do TCE..."
                  value={searchRelatorioTerm}
                  onChange={(e) => setSearchRelatorioTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60 transition-all"
                />
              </div>

              {/* Active TCE Interns List (> 180 days) */}
              <div className="flex-1 overflow-y-auto pr-1 relative z-10">
                {(() => {
                  const term = searchRelatorioTerm.toLowerCase().trim();
                  const list = tces.filter((tce) => {
                    const diasAtivo = calcularDiasTCEAtivo(tce);
                    if (diasAtivo <= 180) return false;

                    if (!term) return true;
                    const estNome = (tce.estagiario?.nome || '').toLowerCase();
                    const estCpf = (tce.estagiario?.cpf || '').toLowerCase();
                    const empNome = (tce.empresa?.nomeFantasia || tce.empresa?.razaoSocial || tce.empresa?.nome || '').toLowerCase();
                    const tceNum = String(tce.numero);
                    return estNome.includes(term) || estCpf.includes(term) || empNome.includes(term) || tceNum.includes(term);
                  });

                  if (list.length === 0) {
                    return (
                      <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800/80 my-4">
                        <GraduationCap className="w-10 h-10 text-amber-400/40 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-zinc-300">
                          Nenhum estagiário com mais de 180 dias de TCE ativo encontrado
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 max-w-lg mx-auto">
                          {searchRelatorioTerm
                            ? 'Tente alterar os termos da busca.'
                            : 'De acordo com a Lei 11.788/08, os relatórios de atividades devem ser emitidos a cada 6 meses (180 dias). Nenhum dos TCEs cadastrados possui mais de 180 dias entre a data de início e a data atual.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/30">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                            <th className="py-3 px-4">Estagiário(a)</th>
                            <th className="py-3 px-4">Empresa Concedente</th>
                            <th className="py-3 px-4">TCE / Tempo</th>
                            <th className="py-3 px-4 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-xs">
                          {list.map((tceItem) => {
                            const diasAtivo = calcularDiasTCEAtivo(tceItem);
                            return (
                              <tr key={tceItem.id} className="hover:bg-zinc-900/60 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-sm flex items-center gap-2" style={{ color: '#39FF14' }}>
                                    <WhatsAppButton
                                      phone={tceItem.estagiario?.fone}
                                      companyName={tceItem.estagiario?.nome}
                                      size="sm"
                                    />
                                    <span>{tceItem.estagiario?.nome || '—'}</span>
                                  </div>
                                  <div className="text-[11px] font-mono mt-0.5" style={{ color: '#39FF14', opacity: 0.85 }}>
                                    CPF: {tceItem.estagiario?.cpf || '—'} {tceItem.estagiario?.escolaNome ? `• ${tceItem.estagiario.escolaNome}` : ''}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-xs" style={{ color: '#39FF14' }}>
                                    {tceItem.empresa?.nomeFantasia || tceItem.empresa?.razaoSocial || tceItem.empresa?.nome || '—'}
                                  </div>
                                  <div className="text-[11px] font-mono" style={{ color: '#39FF14', opacity: 0.85 }}>
                                    CNPJ: {tceItem.empresa?.cnpj || '—'}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className="font-mono font-bold text-xs bg-black/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg inline-block"
                                    style={{ color: '#39FF14' }}
                                  >
                                    Nº {tceItem.numero}
                                  </span>
                                  <div className="text-[11px] font-mono mt-1 font-semibold" style={{ color: '#39FF14', opacity: 0.9 }}>
                                    ⏱ {diasAtivo} dias ativos
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleGerarRelatorioAtividades(tceItem)}
                                    className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/60 hover:bg-amber-500/20 font-extrabold text-xs flex items-center gap-1.5 ml-auto transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                                    style={{ color: '#FFD700' }}
                                  >
                                    <FileText className="w-3.5 h-3.5" style={{ color: '#FFD700' }} />
                                    <span style={{ color: '#FFD700' }}>Gerar</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between shrink-0 relative z-10">
                <span className="text-xs text-zinc-500">
                  Elegíveis (&gt;180 dias):{' '}
                  <strong style={{ color: '#39FF14' }}>
                    {
                      tces.filter((tce) => calcularDiasTCEAtivo(tce) > 180).length
                    }
                  </strong>{' '}
                  de {tces.length} estagiários cadastrados
                </span>
                <button
                  onClick={() => setActiveWorkspaceSection('none')}
                  className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. Área de Trabalho: Métricas & Estatísticas */}
        {activeWorkspaceSection === 'metricas' && (
          <div className="w-full max-w-6xl mx-auto my-auto animate-fadeIn text-left py-2">
            <MetricasModal
              isOpen={true}
              onClose={() => setActiveWorkspaceSection('none')}
              estagiarios={estagiarios}
              tces={tces}
              rescisoes={rescisoes}
              empresas={empresas}
              contratos={contratos}
              embedded={true}
            />
          </div>
        )}

        {/* Indicador quando nenhuma seção estiver aberta */}
        {activeWorkspaceSection === 'none' && (
          <div className="flex-1 hidden md:flex items-end justify-end p-4 pointer-events-none">
            <div className="bg-black/50 backdrop-blur-md border border-amber-500/30 rounded-2xl px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-xs font-semibold text-zinc-300 tracking-wide">
                Área de Trabalho do Painel Administrativo
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal 2: Seguradoras (Até 5 Seguradoras) */}
      {showSeguradorasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn text-left">
          <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-[0_0_45px_rgba(212,175,55,0.3)] max-h-[90vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={220} opacity="opacity-[0.16]" />
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5 shrink-0 relative z-10">
              <div>
                <h3 className="text-xl font-extrabold text-amber-300">
                  Cadastro de <span className="text-gold-gradient-bright">Seguradoras</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Espaço para cadastrar até 5 seguradoras (Campos: Nome, Apólice e Observação)
                </p>
              </div>
              <button
                onClick={() => setShowSeguradorasModal(false)}
                className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                title="Fechar"
              >
                <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 relative z-10 pr-1">

            {/* Contador de vagas (máx 5) */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 mb-5">
              <span className="text-xs font-semibold text-zinc-300">
                Seguradoras cadastradas:
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {seguradoras.length} / 5
              </span>
            </div>

            {/* Formulário de Cadastro (se menor que 5) */}
            {seguradoras.length < 5 ? (
              <form onSubmit={handleAddSeguradora} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 mb-6 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Adicionando Seguradora ({seguradoras.length + 1} de 5)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Nome da Seguradora *
                    </label>
                    <input
                      type="text"
                      required
                      value={segNome}
                      onChange={(e) => setSegNome(e.target.value)}
                      placeholder="Ex: Porto Seguro / Allianz"
                      style={{ color: '#39FF14' }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Número da Apólice *
                    </label>
                    <input
                      type="text"
                      required
                      value={segApolice}
                      onChange={(e) => setSegApolice(e.target.value)}
                      placeholder="Ex: AP-2026-998877"
                      style={{ color: '#39FF14' }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Fone (WhatsApp)
                    </label>
                    <input
                      type="text"
                      value={segFone}
                      onChange={(e) => setSegFone(e.target.value)}
                      placeholder="Ex: (11) 3366-3000"
                      style={{ color: '#39FF14' }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Observação
                  </label>
                  <input
                    type="text"
                    value={segObservacao}
                    onChange={(e) => setSegObservacao(e.target.value)}
                    placeholder="Ex: Cobertura contra acidentes pessoais para estagiários"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 font-bold text-xs shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                    <span>Cadastrar Seguradora</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-6 font-semibold flex items-center justify-between">
                <span>Limite máximo de <b>5 seguradoras</b> atingido. Remova uma seguradora se desejar cadastrar outra.</span>
              </div>
            )}

            {/* Lista das seguradoras cadastradas (até 5) */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Seguradoras Conveniadas
              </div>
              {seguradoras.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-xl border border-zinc-800">
                  Nenhuma seguradora cadastrada ainda. Utilize o formulário acima para cadastrar até 5 seguradoras.
                </div>
              ) : (
                seguradoras.map((seg, idx) => (
                  <div
                    key={seg.id}
                    className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <WhatsAppButton
                          phone={seg.fone}
                          companyName={seg.nome}
                          size="sm"
                        />
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-sm text-[#39FF14]" style={{ color: '#39FF14' }}>
                          {seg.nome}
                        </span>
                        <span className="text-xs font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>
                          • Apólice: <b className="text-[#39FF14]" style={{ color: '#39FF14' }}>{seg.apolice}</b>
                          {seg.fone && <span className="ml-2">• Fone: {seg.fone}</span>}
                        </span>
                      </div>
                      {seg.observacao && (
                        <p className="text-xs pl-8 text-[#39FF14]" style={{ color: '#39FF14' }}>
                          Obs: {seg.observacao}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteSeguradora(seg.id)}
                      className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors cursor-pointer"
                      title="Excluir seguradora"
                    >
                      <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowSeguradorasModal(false)}
                className="px-6 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              >
                Concluir
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL: Clientes (Contratos de Parceria) */}
      {showClientesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-[0_0_35px_rgba(212,175,55,0.25)] max-h-[90vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={240} opacity="opacity-[0.16]" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-5 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Users className="w-4 h-4" />
                  <span>PARCERIAS ATIVAS • CONVÊNIO ESTÁGIO</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Empresas <span className="text-gold-gradient-bright">Clientes</span> (Contratos de Parceria)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Relação das empresas parceiras e acesso aos respectivos contratos emitidos pelo sistema.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <GlowButton
                  onClick={handleOpenNovoContratoModal}
                  icon={<Plus className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />}
                  className="!text-[#FFD700]"
                >
                  <span className="text-[#FFD700] font-bold drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Novo Contrato De Parceria</span>
                </GlowButton>

                <button
                  onClick={() => setShowClientesModal(false)}
                  className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                  title="Fechar"
                >
                  <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                </button>
              </div>
            </div>

            {/* Lista dos Contratos / Clientes */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {contratos.length === 0 ? (
                <div className="py-14 px-4 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Nenhum Contrato de Parceria Emitido
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5">
                    Clique no botão abaixo para selecionar uma empresa cadastrada no sistema e emitir o Contrato Nº 1200 em PDF no modelo oficial.
                  </p>
                  <GlowButton
                    onClick={handleOpenNovoContratoModal}
                    icon={<Plus className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />}
                    className="!text-[#FFD700]"
                  >
                    <span className="text-[#FFD700] font-bold drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Novo Contrato De Parceria</span>
                  </GlowButton>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">Contrato Nº</th>
                        <th className="py-3 px-4">Empresa / Razão Social</th>
                        <th className="py-3 px-4">Cidade / Foro</th>
                        <th className="py-3 px-4">Valor Mensal</th>
                        <th className="py-3 px-4">Emissão</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {contratos.map((ct) => (
                        <tr key={ct.id} className="hover:bg-zinc-900 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                              Nº {ct.numero}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-sm text-[#39FF14]" style={{ color: '#39FF14' }}>
                              {ct.empresa.razaoSocial || ct.empresa.nome}
                            </div>
                            <div className="text-[11px] font-mono mt-0.5 text-[#39FF14]" style={{ color: '#39FF14' }}>
                              CNPJ: {ct.empresa.cnpj || '—'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[#39FF14]" style={{ color: '#39FF14' }}>{ct.cidadeForo}</div>
                            <div className="text-[11px] text-[#39FF14]" style={{ color: '#39FF14' }}>{ct.empresa.estado || 'SP'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#39FF14]" style={{ color: '#39FF14' }}>R$ {ct.valor}</div>
                            <div className="text-[11px] text-[#39FF14]" style={{ color: '#39FF14' }}>Dia {ct.diaPagamento} de cada mês</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-[#39FF14]" style={{ color: '#39FF14' }}>{ct.dataCriacao}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <WhatsAppButton
                                phone={ct.empresa.fone}
                                companyName={ct.empresa.razaoSocial || ct.empresa.nome}
                              />
                              <button
                                onClick={() => {
                                  setSelectedEmpresaForView(ct);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 hover:text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Ver dados da empresa e estagiários vinculados (TCEs)"
                              >
                                <Building2 className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                                <span>Ver Empresa</span>
                              </button>
                              <button
                                onClick={() => handleDeleteContrato(ct)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-[#FFD700] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Excluir empresa"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                                <span className="text-[#FFD700] font-bold drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Excluir</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowClientesModal(false)}
                className="px-6 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: Novo Contrato De Parceria (Selecionar Empresa + Preencher Valores) */}
      {showNovoContratoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(212,175,55,0.35)] max-h-[92vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={240} opacity="opacity-[0.16]" />
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-400 text-black">
                    PRÓXIMO CONTRATO: Nº {getNextContratoNumero()}
                  </span>
                  <span className="text-xs text-zinc-400">
                    • Contagem em sequência a partir de 1200
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  Novo Contrato De <span className="text-gold-gradient-bright">Parceria</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Selecione a empresa cadastrada e preencha os campos para o modelo oficial do PDF.
                </p>
              </div>
              <button
                onClick={() => setShowNovoContratoModal(false)}
                className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                title="Fechar"
              >
                <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </button>
            </div>

            <form onSubmit={handleGenerateContrato} className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* PASSO 1: Lista das Empresas Cadastradas no Sistema */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>1. Selecione a Empresa e Cidade/Foro</span>
                  </label>
                  {selectedEmpresaForContrato && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span>Empresa selecionada: <b>{selectedEmpresaForContrato.nomeFantasia || selectedEmpresaForContrato.razaoSocial}</b></span>
                    </span>
                  )}
                </div>

                {/* Filtro rápido de empresas */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-[#39FF14] absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#39FF14' }} />
                  <input
                    type="text"
                    value={searchEmpresaTerm}
                    onChange={(e) => setSearchEmpresaTerm(e.target.value)}
                    placeholder="Pesquisar"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#39FF14] placeholder-[#39FF14] focus:outline-none focus:border-white font-medium"
                  />
                </div>

                {empresas.length === 0 ? (
                  <div className="py-8 px-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                    <p className="text-xs text-zinc-300 mb-2 font-semibold">
                      Nenhuma empresa cadastrada no sistema ainda.
                    </p>
                    <p className="text-[11px] text-zinc-400 mb-4">
                      Acesse o módulo <b>"Empresas"</b> na barra superior para cadastrar as empresas antes de gerar o contrato de parceria.
                    </p>
                  </div>
                ) : empresasSemContrato.length === 0 ? (
                  <div className="py-8 px-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center">
                    <p className="text-xs text-amber-300 mb-2 font-semibold">
                      Todas as empresas cadastradas já possuem um Contrato de Parceria firmado.
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Para gerar um novo contrato de parceria, cadastre uma nova empresa no módulo <b>"Empresas"</b> na barra superior.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-black/60 divide-y divide-zinc-800/80">
                    {empresasSemContrato
                      .filter(emp => {
                        const t = searchEmpresaTerm.toLowerCase();
                        return (
                          (emp.nomeFantasia || '').toLowerCase().includes(t) ||
                          (emp.razaoSocial || '').toLowerCase().includes(t) ||
                          (emp.cnpj || '').toLowerCase().includes(t) ||
                          (emp.cidade || '').toLowerCase().includes(t)
                        );
                      })
                      .map((emp) => {
                        const isSelected = selectedEmpresaForContrato?.id === emp.id;
                        return (
                          <div
                            key={emp.id}
                            onClick={() => setSelectedEmpresaForContrato(emp)}
                            className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-500/15 border-l-4 border-amber-400'
                                : 'hover:bg-zinc-900/80'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-[#39FF14] text-xs flex items-center gap-2" style={{ color: '#39FF14' }}>
                                <span>{emp.razaoSocial || emp.nome}</span>
                                {emp.nomeFantasia && (
                                  <span className="font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>({emp.nomeFantasia})</span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono mt-0.5 text-[#39FF14]" style={{ color: '#39FF14' }}>
                                CNPJ: {emp.cnpj || '—'} • Cidade: {emp.cidade || '—'}/{emp.estado || 'SP'} • Fone: {emp.fone || '—'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmpresaForContrato(emp);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {isSelected ? '✓ Selecionada' : 'Selecionar'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* PASSO 2: Campos do Contrato */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>2. Preencha os Valores do Contrato</span>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Preencha os valores e informações necessárias para o contrato oficial.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Valor (R$)
                    </label>
                    <input
                      type="text"
                      required
                      value={cpValor}
                      onChange={(e) => setCpValor(e.target.value)}
                      placeholder="Ex: 500,00"
                      style={{ color: '#39FF14' }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Valor por Extenso
                    </label>
                    <input
                      type="text"
                      required
                      value={cpValorExtenso}
                      onChange={(e) => setCpValorExtenso(e.target.value)}
                      placeholder="Ex: quinhentos reais"
                      style={{ color: '#39FF14' }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Dia de Pagamento
                    </label>
                    <input
                      type="text"
                      required
                      value={cpDiaPagamento}
                      onChange={(e) => setCpDiaPagamento(e.target.value)}
                      placeholder="Ex: 10"
                      style={{ color: '#39FF14' }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Data Início
                    </label>
                    <input
                      type="text"
                      required
                      value={cpDataInicio}
                      onChange={(e) => setCpDataInicio(e.target.value)}
                      placeholder="Ex: 10/08/2026"
                      style={{ color: '#39FF14' }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Modal Novo Contrato */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNovoContratoModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedEmpresaForContrato}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                    selectedEmpresaForContrato
                      ? 'bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 shadow-[0_4px_20px_rgba(251,191,36,0.35)]'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  <span>Gerar Contrato Nº {getNextContratoNumero()} em PDF</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: EMISSÃO DE TCE (Termo de Compromisso de Estágio) */}
      {showTCEModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-[0_0_35px_rgba(212,175,55,0.25)] max-h-[90vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={220} opacity="opacity-[0.16]" />
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5 shrink-0 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>EMISSÃO DE DOCUMENTO LEGAL (LEI 11.788/08)</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Emitir Novo <span className="text-gold-gradient-bright">TCE (Termo de Estágio)</span>
                </h3>
              </div>
              <button
                onClick={() => setShowTCEModal(false)}
                className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                title="Fechar"
              >
                <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 relative z-10 pr-1">

            <form onSubmit={handleGenerateTCE} className="space-y-4">
              {/* Opção: Modalidade do Estágio (Não-Obrigatório vs Obrigatório) */}
              <div className="bg-zinc-900/90 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Modalidade do Estágio (Lei nº 11.788/08)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTceTipoEstagio('nao_obrigatorio')}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                      tceTipoEstagio === 'nao_obrigatorio'
                        ? 'bg-amber-500/25 border-amber-400 text-[#FFD700] shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        tceTipoEstagio === 'nao_obrigatorio'
                          ? 'border-amber-400 bg-amber-400'
                          : 'border-zinc-600 bg-transparent'
                      }`}>
                        {tceTipoEstagio === 'nao_obrigatorio' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <span>Estágio Não-Obrigatório</span>
                    </div>
                    {tceTipoEstagio === 'nao_obrigatorio' && (
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Padrão</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTceTipoEstagio('obrigatorio')}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                      tceTipoEstagio === 'obrigatorio'
                        ? 'bg-amber-500/25 border-amber-400 text-[#FFD700] shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        tceTipoEstagio === 'obrigatorio'
                          ? 'border-amber-400 bg-amber-400'
                          : 'border-zinc-600 bg-transparent'
                      }`}>
                        {tceTipoEstagio === 'obrigatorio' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <span>Estágio Obrigatório</span>
                    </div>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {tceTipoEstagio === 'nao_obrigatorio'
                    ? '• Termo padrão de estágio não-obrigatório na emissão do documento.'
                    : '• O sistema substituirá automaticamente os termos para "Estágio Obrigatório" no corpo do TCE.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Empresa (com Contrato de Parceria Ativo)</span>
                  <span className="text-[10px] text-amber-400 font-normal">
                    {empresasComContratoAtivo.length} empresa(s) com contrato ativo
                  </span>
                </label>
                <select
                  required
                  value={selectedEmpresaForTCE?.id || ''}
                  onChange={(e) => {
                    const emp = empresasComContratoAtivo.find((x) => x.id === e.target.value) || null;
                    setSelectedEmpresaForTCE(emp);
                  }}
                  style={{ color: '#39FF14' }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                >
                  <option value="" className="bg-zinc-900 text-zinc-400">
                    {empresasComContratoAtivo.length > 0
                      ? '-- Selecione uma empresa com contrato de parceria ativo --'
                      : '-- Nenhuma empresa com contrato de parceria ativo --'}
                  </option>
                  {empresasComContratoAtivo.map((emp) => {
                    const ct = contratos.find(
                      (c) =>
                        c.empresaId === emp.id ||
                        c.empresa?.id === emp.id ||
                        (c.empresa?.cnpj && emp.cnpj && c.empresa.cnpj === emp.cnpj)
                    );
                    return (
                      <option key={emp.id} value={emp.id} style={{ color: '#39FF14' }} className="bg-zinc-900 text-[#39FF14]">
                        {emp.nomeFantasia || emp.razaoSocial} ({emp.cnpj}){ct ? ` — Contrato Nº ${ct.numero}` : ''}
                      </option>
                    );
                  })}
                </select>
                {empresasComContratoAtivo.length === 0 && (
                  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Nenhuma empresa possui contrato de parceria ativo no momento. Para emitir um TCE, primeiro cadastre o <b>Contrato de Parceria</b> na aba <b>Clientes / Contratos</b>.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Selecione o(a) Estagiário(a)
                </label>
                <select
                  required
                  value={selectedEstagiarioForTCE?.id || ''}
                  onChange={(e) => {
                    const est = estagiarios.find((x) => x.id === e.target.value) || null;
                    setSelectedEstagiarioForTCE(est);
                  }}
                  style={{ color: '#39FF14' }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                >
                  <option value="" className="bg-zinc-900 text-zinc-400">-- Selecione um estagiário cadastrado --</option>
                  {estagiarios.map((est) => (
                    <option key={est.id} value={est.id} style={{ color: '#39FF14' }} className="bg-zinc-900 text-[#39FF14]">
                      {est.nome} ({est.cpf})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Selecione a Seguradora de Acidentes
                </label>
                <select
                  required
                  value={selectedSeguradoraForTCE?.id || ''}
                  onChange={(e) => {
                    const seg = seguradoras.find((x) => x.id === e.target.value) || null;
                    setSelectedSeguradoraForTCE(seg);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                  style={{ color: '#39FF14' }}
                >
                  <option value="" className="bg-zinc-900 text-zinc-400">-- Selecione uma seguradora --</option>
                  {seguradoras.map((seg) => (
                    <option key={seg.id} value={seg.id} className="bg-zinc-900 text-[#39FF14]" style={{ color: '#39FF14' }}>
                      {seg.nome} (Apólice: {seg.apolice})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Valor Bolsa (R$)
                  </label>
                  <input
                    type="text"
                    required
                    value={tceValor}
                    onChange={(e) => setTceValor(e.target.value)}
                    placeholder="Ex: 800,00"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Valor por Extenso
                  </label>
                  <input
                    type="text"
                    required
                    value={tceValorExtenso}
                    onChange={(e) => setTceValorExtenso(e.target.value)}
                    placeholder="Ex: oitocentos reais"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Dia Pagamento
                  </label>
                  <input
                    type="text"
                    required
                    value={tceDia}
                    onChange={(e) => setTceDia(e.target.value)}
                    placeholder="Ex: 10"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Atividades do Estagiário</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Opcional - deixe vazio para usar o padrão</span>
                </label>
                <input
                  type="text"
                  value={tceAtividadesEstagiario}
                  onChange={(e) => setTceAtividadesEstagiario(e.target.value)}
                  placeholder="Padrão: ADMINISTRATIVO - AUXILIAR ADMINISTRATIVO / ATENDENTE"
                  style={{ color: '#39FF14' }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-600 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Data de Início do Contrato
                </label>
                <input
                  type="text"
                  required
                  value={tceDataContrato}
                  onChange={(e) => setTceDataContrato(e.target.value)}
                  placeholder="Ex: 31 de Julho de 2026"
                  style={{ color: '#39FF14' }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-[#39FF14] placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowTCEModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedEmpresaForTCE || !selectedEstagiarioForTCE || !selectedSeguradoraForTCE}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                    selectedEmpresaForTCE && selectedEstagiarioForTCE && selectedSeguradoraForTCE
                      ? 'bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 shadow-[0_4px_20px_rgba(251,191,36,0.35)]'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  <span>Gerar TCE Nº {getNextTceNumero()} em PDF</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Documentos (Contratos e TCEs Salvos para Baixar) */}
      {showDocumentosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-[0_0_35px_rgba(212,175,55,0.25)] max-h-[90vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={240} opacity="opacity-[0.16]" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4 mb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <FolderOpen className="w-4 h-4" />
                  <span>CENTRAL DE DOCUMENTOS DO HUNTER</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Documentos — <span className="text-gold-gradient-bright">Contratos & TCEs Emitidos</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Visualize e baixe em PDF todos os documentos oficiais gerados pelo sistema.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDocumentosModal(false)}
                  className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                  title="Fechar"
                >
                  <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                </button>
              </div>
            </div>

            {/* ABAS DE DOCUMENTOS: TCEs | RESCISÕES | CONTRATOS DE PARCERIA */}
            <div className="flex items-center gap-2 border-b border-zinc-800 mb-4 pb-2 flex-wrap">
              <button
                onClick={() => setDocumentosTab('tces')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  documentosTab === 'tces'
                    ? 'bg-amber-500/20 text-[#FFD700] border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                    : 'bg-zinc-900 text-amber-300/80 hover:text-[#FFD700] border border-zinc-800'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Termos de Estágio (TCEs) ({tces.length})</span>
              </button>
              <button
                onClick={() => setDocumentosTab('rescisoes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  documentosTab === 'rescisoes'
                    ? 'bg-amber-500/20 text-[#FFD700] border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                    : 'bg-zinc-900 text-amber-300/80 hover:text-[#FFD700] border border-zinc-800'
                }`}
              >
                <FileX className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Rescisões ({rescisoes.length})</span>
              </button>
              <button
                onClick={() => setDocumentosTab('contratos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  documentosTab === 'contratos'
                    ? 'bg-amber-500/20 text-[#FFD700] border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                    : 'bg-zinc-900 text-amber-300/80 hover:text-[#FFD700] border border-zinc-800'
                }`}
              >
                <FileText className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Contratos de Parceria ({contratos.length})</span>
              </button>
              <button
                onClick={() => setDocumentosTab('folhas')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  documentosTab === 'folhas'
                    ? 'bg-amber-500/20 text-[#FFD700] border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                    : 'bg-zinc-900 text-amber-300/80 hover:text-[#FFD700] border border-zinc-800'
                }`}
              >
                <DollarSign className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Folha ({folhasPagamento.length})</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {documentosTab === 'tces' ? (
                tces.length === 0 ? (
                  <div className="py-14 px-4 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#FFD700] mx-auto mb-3">
                      <GraduationCap className="w-6 h-6 text-[#FFD700]" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">
                      Nenhum TCE Emitido até o momento
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5">
                      Ao gerar um novo <b>Termo de Compromisso de Estágio (TCE)</b>, o documento ficará arquivado aqui para download.
                    </p>
                    <button
                      onClick={() => {
                        setShowDocumentosModal(false);
                        setShowTCEModal(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 text-black hover:bg-amber-400 font-bold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-black" />
                      <span>Emitir Primeiro TCE PDF</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tces.map((tc) => (
                      <div
                        key={tc.id}
                        className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-400 text-black">
                                TCE Nº {tc.numero}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                tc.tipoEstagio === 'obrigatorio'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              }`}>
                                {tc.tipoEstagio === 'obrigatorio' ? 'Estágio Obrigatório' : 'Não-Obrigatório'}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {tc.dataCriacao}
                            </span>
                          </div>
                          <h4 className="font-bold text-[#39FF14] text-sm" style={{ color: '#39FF14' }}>
                            Estagiário: {tc.estagiario.nome}
                          </h4>
                          <p className="text-xs text-[#39FF14] mt-0.5" style={{ color: '#39FF14' }}>
                            Empresa: {tc.empresa.nomeFantasia || tc.empresa.razaoSocial}
                          </p>
                          <p className="text-[11px] font-mono mt-1 text-[#39FF14]" style={{ color: '#39FF14' }}>
                            Bolsa: R$ {tc.valor} • Dia: {tc.diaPagamento}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                          <span className="text-xs font-semibold text-[#39FF14]" style={{ color: '#39FF14' }}>
                            Seg.: {tc.seguradora.nome}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteTCE(tc.id)}
                              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                              title="Excluir TCE"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#FFD700]" />
                            </button>
                            <button
                              onClick={() => setSelectedTCEForPDF(tc)}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-[#FFD700]" />
                              <span>Abrir e Baixar PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : documentosTab === 'rescisoes' ? (
                rescisoes.length === 0 ? (
                  <div className="py-14 px-4 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#FFD700] mx-auto mb-3">
                      <FileX className="w-6 h-6 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">
                      Nenhum Termo de Rescisão Registrado
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      Ao rescindir um Termo de Compromisso de Estágio (TCE), o documento de rescisão ficará arquivado aqui para visualização e download em PDF.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rescisoes.map((res) => (
                      <div
                        key={res.numeroRescisao}
                        className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-[#FFD700] border border-amber-500/40">
                              RESCISÃO Nº {res.numeroRescisao}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {res.dataRescisao}
                            </span>
                          </div>
                          <h4 className="font-bold text-[#39FF14] text-sm" style={{ color: '#39FF14' }}>
                            Estagiário: {res.tce?.estagiario?.nome || '—'}
                          </h4>
                          <p className="text-xs text-[#39FF14] mt-0.5" style={{ color: '#39FF14' }}>
                            Empresa: {res.tce?.empresa?.nomeFantasia || res.tce?.empresa?.razaoSocial || '—'}
                          </p>
                          <p className="text-[11px] text-[#39FF14] mt-1" style={{ color: '#39FF14' }}>
                            Motivo: <strong className="text-[#39FF14]" style={{ color: '#39FF14' }}>{res.motivoRescisao}</strong>
                          </p>
                          <p className="text-[11px] font-mono mt-0.5 text-[#39FF14]" style={{ color: '#39FF14' }}>
                            TCE de Origem: Nº {res.tce?.numero || '—'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                          <span className="text-xs font-semibold text-[#39FF14] truncate max-w-[140px]" style={{ color: '#39FF14' }} title={res.tce?.estagiario?.escolaNome}>
                            {res.tce?.estagiario?.escolaNome || '—'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteRescisao(res.numeroRescisao)}
                              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                              title="Excluir Termo de Rescisão"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#FFD700]" />
                            </button>
                            <button
                              onClick={() => setSelectedTermoRescisaoData(res)}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-[#FFD700]" />
                              <span>Abrir e Baixar PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : documentosTab === 'contratos' ? (
                contratos.length === 0 ? (
                  <div className="py-14 px-4 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#FFD700] mx-auto mb-3">
                      <FolderOpen className="w-6 h-6 text-[#FFD700]" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">
                      Nenhum Contrato de Parceria Salvo
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-5">
                      Ao criar um novo <b>Contrato de Parceria</b> com uma empresa cliente, o PDF é arquivado automaticamente nesta central.
                    </p>
                    <GlowButton
                      onClick={() => {
                        setShowDocumentosModal(false);
                        handleOpenNovoContratoModal();
                      }}
                      icon={<Plus className="w-4 h-4 text-black" />}
                    >
                      Emitir Primeiro Contrato PDF
                    </GlowButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {contratos.map((ct) => (
                      <div
                        key={ct.id}
                        className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-400 text-black">
                              CONTRATO Nº {ct.numero}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {ct.dataCriacao}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#39FF14]" style={{ color: '#39FF14' }}>
                            {ct.empresa.razaoSocial || ct.empresa.nome}
                          </h4>
                          <p className="text-xs mt-0.5 text-[#39FF14]" style={{ color: '#39FF14' }}>
                            Nome Fantasia: {ct.empresa.nomeFantasia || '—'}
                          </p>
                          <p className="text-[11px] font-mono mt-1 text-[#39FF14]" style={{ color: '#39FF14' }}>
                            CNPJ: {ct.empresa.cnpj || '—'} • Foro: {ct.cidadeForo}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                          <span className="text-xs font-semibold text-[#39FF14]" style={{ color: '#39FF14' }}>
                            R$ {ct.valor} / mês
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedContratoForPDF(ct)}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-[#FFD700]" />
                              <span>Abrir e Baixar PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* TAB: FOLHAS DE PAGAMENTO SALVAS */
                folhasPagamento.length === 0 ? (
                  <div className="py-14 px-4 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#FFD700] mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-[#FFD700]" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">
                      Nenhuma Folha de Pagamento Salva
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      Ao abrir a <b>Folha de Pagamento</b> de uma empresa e clicar em <b>Imprimir Folha</b>, os recibos em PDF daquela folha ficarão salvos aqui para visualização posterior.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {folhasPagamento.map((folha) => (
                      <div
                        key={folha.id}
                        className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-[#FFD700] border border-amber-500/40">
                              {folha.numeroFolha}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              Emissão: {folha.dataEmissao}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#39FF14]" style={{ color: '#39FF14' }}>
                            Empresa: {folha.empresa.razaoSocial || folha.empresa.nomeFantasia || folha.empresa.nome}
                          </h4>
                          <p className="text-xs mt-0.5 text-[#39FF14]" style={{ color: '#39FF14' }}>
                            Referência: <strong className="text-[#FFD700]">{folha.referencia} / {folha.ano}</strong>
                          </p>
                          <p className="text-[11px] font-mono mt-1 text-[#39FF14]" style={{ color: '#39FF14' }}>
                            CNPJ: {folha.empresa.cnpj || '—'} • {folha.estagiariosAtivos.length} estagiário(s)
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                          <span className="text-xs font-semibold text-amber-400">
                            PDF Gerado
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteFolha(folha.id)}
                              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                              title="Excluir Folha Salva"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#FFD700]" />
                            </button>
                            <button
                              onClick={() => setSelectedFolhaForPDF(folha)}
                              className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-[#FFD700]" />
                              <span>Abrir e Baixar PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowDocumentosModal(false)}
                className="px-6 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.1 MODAL: Ver Empresa (Dados da Empresa + Relação de Estagiários com TCE) */}
      {selectedEmpresaForView && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_35px_rgba(212,175,55,0.25)] overflow-hidden relative">
            <HunterWatermark size={240} opacity="opacity-[0.16]" />
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#39FF14]" style={{ color: '#39FF14' }}>
                    {selectedEmpresaForView.empresa.razaoSocial || selectedEmpresaForView.empresa.nome}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    CNPJ: <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresaForView.empresa.cnpj || 'Não informado'}</span> • Contrato Nº <span className="font-mono font-bold text-amber-400">{selectedEmpresaForView.numero}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenRescindidosModalFromEmpresa}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/20 border border-red-500/60 hover:bg-red-500/30 text-[#FFD700] hover:text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                  title="Abrir lista de Estagiários Rescindidos desta empresa"
                >
                  <FileX className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  <span style={{ color: '#FFD700' }}>Rescindidos</span>
                </button>
                <button
                  onClick={() => setShowFolhaModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/60 hover:bg-amber-500/30 text-[#FFD700] hover:text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                  title="Abrir Folha de Pagamento para esta empresa"
                >
                  <DollarSign className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  <span>Folha de pagamento</span>
                </button>
                <button
                  onClick={() => setSelectedEmpresaForView(null)}
                  className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                  title="Fechar"
                >
                  <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                </button>
              </div>
            </div>

            {/* Conteúdo scrollável */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Dados Cadastrais da Empresa */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Dados Cadastrais da Empresa (Parte Concedente)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-zinc-500 block">Razão Social / Nome</span>
                    <span className="font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresaForView.empresa.razaoSocial || selectedEmpresaForView.empresa.nome || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">CNPJ</span>
                    <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresaForView.empresa.cnpj || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Representante Legal</span>
                    <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresaForView.empresa.representanteLegal || '—'} ({selectedEmpresaForView.empresa.cargoRepresentante || 'Cargo não inf.'})</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-xs text-zinc-500 block">Endereço Completo</span>
                    <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>
                      {selectedEmpresaForView.empresa.endereco || '—'}, {selectedEmpresaForView.empresa.bairro || ''} — {selectedEmpresaForView.empresa.cidade || ''}/{selectedEmpresaForView.empresa.estado || 'SP'} (CEP: {selectedEmpresaForView.empresa.cep || '—'})
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Contato / Telefone</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>
                        {selectedEmpresaForView.empresa.contato || '—'} — {selectedEmpresaForView.empresa.fone || ''}
                      </span>
                      <WhatsAppButton
                        phone={selectedEmpresaForView.empresa.fone}
                        companyName={selectedEmpresaForView.empresa.razaoSocial || selectedEmpresaForView.empresa.nome}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Cidade do Foro</span>
                    <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresaForView.cidadeForo || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Dia de Pagamento</span>
                    <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>Dia {selectedEmpresaForView.diaPagamento || '10'} de cada mês</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block">Valor Mensal Contrato</span>
                    <span className="font-bold text-[#39FF14]" style={{ color: '#39FF14' }}>R$ {selectedEmpresaForView.valor || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Relação de Estagiários que fizeram TCE com esta Empresa */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Estagiários Vinculados via TCE (Parte Concedente)</span>
                  </h4>
                  <div>
                    {(() => {
                      const estagiariosTCE = getEstagiariosAtivosDaEmpresa(tces, rescisoes, selectedEmpresaForView);
                      return (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 font-mono font-bold text-[#39FF14]" style={{ color: '#39FF14' }}>
                          {estagiariosTCE.length} {estagiariosTCE.length === 1 ? 'estagiário ativo' : 'estagiários ativos'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {(() => {
                  const estagiariosTCE = getEstagiariosAtivosDaEmpresa(tces, rescisoes, selectedEmpresaForView);

                  if (estagiariosTCE.length === 0) {
                    return (
                      <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-8 text-center">
                        <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>Nenhum estagiário ativo nesta empresa no momento.</p>
                        <p className="text-xs text-zinc-400 mt-1">Quando você gerar Termos de Compromisso de Estágio (TCEs) ativos tendo esta empresa como Parte Concedente, eles aparecerão listados aqui.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                            <th className="py-3 px-4">TCE Nº</th>
                            <th className="py-3 px-4">Estagiário</th>
                            <th className="py-3 px-4">Instituição de Ensino</th>
                            <th className="py-3 px-4">Bolsa / Início</th>
                            <th className="py-3 px-4 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-sm">
                          {estagiariosTCE.map((tceItem) => (
                            <tr key={tceItem.id} className="hover:bg-zinc-900/60 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-mono font-bold text-xs bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg text-[#39FF14]" style={{ color: '#39FF14' }}>
                                  Nº {tceItem.numero}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-[#39FF14] text-sm flex items-center gap-2" style={{ color: '#39FF14' }}>
                                  <WhatsAppButton
                                    phone={tceItem.estagiario?.fone}
                                    companyName={tceItem.estagiario?.nome}
                                    size="sm"
                                  />
                                  <span>{tceItem.estagiario?.nome || '—'}</span>
                                </div>
                                <div className="text-[11px] text-[#39FF14] font-mono mt-0.5" style={{ color: '#39FF14' }}>
                                  CPF: {tceItem.estagiario?.cpf || '—'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-[#39FF14] text-xs font-semibold" style={{ color: '#39FF14' }}>{tceItem.estagiario?.escolaNome || '—'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-[#39FF14] text-xs" style={{ color: '#39FF14' }}>R$ {tceItem.valor || '—'}</div>
                                <div className="text-[11px] text-[#39FF14]" style={{ color: '#39FF14' }}>{tceItem.dataContrato || tceItem.dataCriacao}</div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleOpenRescisaoModal(tceItem)}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-300 hover:text-white text-xs font-bold flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                                  title="Rescindir contrato de estágio e gerar Termo de Rescisão"
                                >
                                  <FileX className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                                  <span>Rescindir</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedContratoForPDF(selectedEmpresaForView);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 hover:text-white font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                title="Abrir e baixar PDF do Contrato de Parceria"
              >
                <Download className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Abrir e Baixar PDF</span>
              </button>
              <button
                onClick={() => setSelectedEmpresaForView(null)}
                className="px-6 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.2 MODAL: Confirmação de Rescisão de Estágio (Entrada da Data e Motivo) */}
      {tceParaRescindir && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-red-500/40 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(239,68,68,0.2)] overflow-hidden relative">
            <HunterWatermark size={200} opacity="opacity-[0.16]" />
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#FFD700]">
                  <FileX className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Rescindir Termo de Estágio (TCE)</h3>
                  <p className="text-xs text-zinc-400">TCE Nº <span className="font-mono font-bold text-amber-300">{tceParaRescindir.numero}</span></p>
                </div>
              </div>
              <button
                onClick={() => setTceParaRescindir(null)}
                className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                title="Fechar"
              >
                <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-200">Atenção:</p>
                  <p className="mt-0.5 text-zinc-300">
                    Ao confirmar, o estagiário <strong className="text-white">{tceParaRescindir.estagiario?.nome}</strong> será retirado da lista de estagiários ativos da empresa <strong className="text-white">{tceParaRescindir.empresa?.razaoSocial || tceParaRescindir.empresa?.nome}</strong> e o <strong className="text-amber-300">Termo de Rescisão (PDF)</strong> será gerado.
                  </p>
                </div>
              </div>

              {/* Data da Rescisão (ççç) */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Data da Rescisão
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dataRescisaoInput}
                    onChange={(e) => setDataRescisaoInput(e.target.value)}
                    placeholder="Ex: 10 de Agosto de 2026"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Exemplo: 10 de Agosto de 2026 ou 03 de Agosto de 2026.
                </p>
              </div>

              {/* Motivo da Rescisão (baba) */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Motivo da Rescisão
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMotivoRescisaoInput('À pedido da empresa')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      motivoRescisaoInput === 'À pedido da empresa'
                        ? 'bg-amber-500/20 border-amber-400/80 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span>À pedido da empresa</span>
                    {motivoRescisaoInput === 'À pedido da empresa' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMotivoRescisaoInput('À pedido do estagiário(a)')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                      motivoRescisaoInput === 'À pedido do estagiário(a)'
                        ? 'bg-amber-500/20 border-amber-400/80 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span>À pedido do estagiário(a)</span>
                    {motivoRescisaoInput === 'À pedido do estagiário(a)' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Fechamento da Folha do Estagiário Rescindido */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                  <DollarSign className="w-4 h-4 text-[#FFD700]" />
                  <h4 className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">
                    Fechamento da Folha (Estagiário Rescindido)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mês de Referência */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Mês de Referência
                    </label>
                    <input
                      type="text"
                      value={referenciaFolhaRescisaoInput}
                      onChange={(e) => setReferenciaFolhaRescisaoInput(e.target.value)}
                      placeholder="Ex: Agosto"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Ano */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Ano
                    </label>
                    <input
                      type="text"
                      value={anoFolhaRescisaoInput}
                      onChange={(e) => setAnoFolhaRescisaoInput(e.target.value)}
                      placeholder="Ex: 2026"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Último dia estagiado */}
                <div>
                  <label className="block text-[11px] font-bold text-[#FFD700] uppercase mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FFD700]" />
                    <span>Último dia estagiado</span>
                  </label>
                  <input
                    type="text"
                    value={ultimoDiaEstagiadoInput}
                    onChange={(e) => setUltimoDiaEstagiadoInput(e.target.value)}
                    placeholder="Ex: 10/08/2026"
                    className="w-full bg-zinc-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-200 font-bold placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-[0_0_10px_rgba(255,215,0,0.15)]"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Campo gravado no recibo da folha de fechamento em anexo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Faltas */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Faltas (dias)
                    </label>
                    <input
                      type="text"
                      value={faltasRescisaoInput}
                      onChange={(e) => setFaltasRescisaoInput(e.target.value)}
                      placeholder="0"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Bonificação */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Bonificação (R$)
                    </label>
                    <input
                      type="text"
                      value={bonificacoesRescisaoInput}
                      onChange={(e) => setBonificacoesRescisaoInput(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Adiantamento */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                      Adiantamento (R$)
                    </label>
                    <input
                      type="text"
                      value={adiantamentoRescisaoInput}
                      onChange={(e) => setAdiantamentoRescisaoInput(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setTceParaRescindir(null)}
                className="px-5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRescisao}
                className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 font-bold text-xs flex items-center gap-2 shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all cursor-pointer"
              >
                <FileX className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Confirmar Rescisão e Gerar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5.3 MODAL: PDF Termo de Conclusão / Rescisão */}
      {selectedTermoRescisaoData && (
        <TermoRescisaoPDFModal
          data={selectedTermoRescisaoData}
          autoDownload={autoDownloadRescisaoPDF}
          onClose={() => {
            setSelectedTermoRescisaoData(null);
            setAutoDownloadRescisaoPDF(false);
          }}
        />
      )}

      {/* 5.2 MODAL: Folha de Pagamento da Empresa */}
      {showFolhaModal && selectedEmpresaForView && (
        <FolhaPagamentoModal
          contratoEmpresa={selectedEmpresaForView}
          tces={tces}
          rescisoes={rescisoes}
          hunterDados={hunterDados}
          onSaveFolha={handleSaveFolha}
          onClose={() => setShowFolhaModal(false)}
        />
      )}

      {/* 5.3 MODAL: Visualização e Download de Folha de Pagamento PDF Salva */}
      {selectedFolhaForPDF && (
        <FolhaPDFModal
          folha={selectedFolhaForPDF}
          hunterDados={hunterDados}
          onClose={() => setSelectedFolhaForPDF(null)}
        />
      )}

      {/* 6. MODAL: Visualização e Download do PDF do Contrato de Parceria */}
      {selectedContratoForPDF && (
        <ContratoParceriaPDFModal
          contrato={selectedContratoForPDF}
          autoDownload={autoDownloadContratoPDF}
          onClose={() => {
            setSelectedContratoForPDF(null);
            setAutoDownloadContratoPDF(false);
          }}
        />
      )}

      {/* 7. MODAL: Visualização e Download do PDF do TCE */}
      {selectedTCEForPDF && (
        <TCEPDFModal
          tce={selectedTCEForPDF}
          autoDownload={autoDownloadTcePDF}
          onClose={() => {
            setSelectedTCEForPDF(null);
            setAutoDownloadTcePDF(false);
          }}
        />
      )}

      {/* 8. MODAL: Matrizes de Documentos (TCE, Rescisão, Convênio) */}
      <MatrizesModal
        isOpen={showMatrizesModal}
        onClose={() => setShowMatrizesModal(false)}
      />

      {/* 9. MODAL: Tela preta com a logo da HUNTER Desktop centralizada e grande */}
      <HunterLogoSplashModal
        isOpen={showLogoSplashModal}
        onClose={() => setShowLogoSplashModal(false)}
      />

      {/* 10. MODAL: Estagiários Rescindidos (Filtro por Mês, Ano e Empresa) */}
      {showRescindidosModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-red-500/40 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_40px_rgba(239,68,68,0.25)] overflow-hidden relative">
            <HunterWatermark size={240} opacity="opacity-[0.16]" />

            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center">
                  <FileX className="w-5 h-5 text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.85)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#39FF14]" style={{ color: '#39FF14' }}>
                    Estagiários Rescindidos
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Relação e histórico de rescisões por Mês, Ano e Empresa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRescindidosModal(false)}
                className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                title="Fechar"
              >
                <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </button>
            </div>

            {/* Conteúdo scrollável */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Caixas de Texto para Filtros: Mês e Ano */}
              <div className="bg-zinc-900/60 border border-amber-500/30 rounded-xl p-4 sm:p-5">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>Filtrar Rescisões (Mês e Ano)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Caixa 1: Mês */}
                  <div>
                    <label className="block text-xs font-bold text-[#FFD700] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span>Mês:</span>
                    </label>
                    <input
                      type="text"
                      value={filterRescisaoMes}
                      onChange={(e) => setFilterRescisaoMes(e.target.value)}
                      placeholder="Ex: Agosto, 08, Julho..."
                      className="w-full bg-zinc-900 border border-amber-500/40 rounded-lg px-3 py-2 text-[#39FF14] font-semibold text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-zinc-600 font-mono"
                      style={{ color: '#39FF14' }}
                    />
                  </div>

                  {/* Caixa 2: Ano */}
                  <div>
                    <label className="block text-xs font-bold text-[#FFD700] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span>Ano:</span>
                    </label>
                    <input
                      type="text"
                      value={filterRescisaoAno}
                      onChange={(e) => setFilterRescisaoAno(e.target.value)}
                      placeholder="Ex: 2026..."
                      className="w-full bg-zinc-900 border border-amber-500/40 rounded-lg px-3 py-2 text-[#39FF14] font-semibold text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder-zinc-600 font-mono"
                      style={{ color: '#39FF14' }}
                    />
                  </div>
                </div>
              </div>

              {/* Quantidade de Rescisões Criadas no Mês / Filtro */}
              {(() => {
                const list = getFilteredRescisoes();
                return (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <FileX className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block font-semibold">Resumo do Filtro</span>
                        <span className="text-sm font-bold text-[#39FF14]" style={{ color: '#39FF14' }}>
                          Mês: <span className="text-amber-300">{filterRescisaoMes || 'Todos'}</span> • Ano: <span className="text-amber-300">{filterRescisaoAno || 'Todos'}</span>
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-center">
                      <span className="text-xs text-zinc-400 block font-semibold">Quantidade de Rescisões</span>
                      <span className="text-xl font-black text-[#39FF14]" style={{ color: '#39FF14' }}>
                        {list.length} {list.length === 1 ? 'rescisão criada' : 'rescisões criadas'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Lista em formato de lista com os estagiários rescindidos */}
              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Lista de Estagiários Rescindidos</span>
                </h4>

                {(() => {
                  const list = getFilteredRescisoes();
                  if (list.length === 0) {
                    return (
                      <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-8 text-center">
                        <FileX className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>
                          Nenhuma rescisão encontrada para os dados informados.
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Ajuste as caixas de texto de Mês, Ano ou Empresa para localizar outros registros.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-[45vh] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/90 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                            <th className="py-3 px-4">Nº Rescisão</th>
                            <th className="py-3 px-4">Estagiário / CPF</th>
                            <th className="py-3 px-4">Empresa (Parte Concedente)</th>
                            <th className="py-3 px-4">Data da Criação da Rescisão</th>
                            <th className="py-3 px-4">Motivo</th>
                            <th className="py-3 px-4 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-sm">
                          {list.map((res) => (
                            <tr key={res.numeroRescisao} className="hover:bg-zinc-900/60 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-mono font-bold text-xs bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg text-[#39FF14]" style={{ color: '#39FF14' }}>
                                  Nº {res.numeroRescisao}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-[#39FF14] text-sm" style={{ color: '#39FF14' }}>
                                  {res.tce?.estagiario?.nome || '—'}
                                </div>
                                <div className="text-[11px] text-[#39FF14] font-mono mt-0.5" style={{ color: '#39FF14' }}>
                                  CPF: {res.tce?.estagiario?.cpf || '—'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-[#39FF14] text-xs font-semibold" style={{ color: '#39FF14' }}>
                                  {res.tce?.empresa?.razaoSocial || res.tce?.empresa?.nome || '—'}
                                </div>
                                <div className="text-[11px] text-[#39FF14] font-mono" style={{ color: '#39FF14' }}>
                                  CNPJ: {res.tce?.empresa?.cnpj || '—'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-[#39FF14] text-xs" style={{ color: '#39FF14' }}>
                                  {res.dataCriacao || res.dataRescisao}
                                </div>
                                {res.dataCriacao && res.dataRescisao !== res.dataCriacao && (
                                  <div className="text-[11px] text-zinc-400">Efetivação: {res.dataRescisao}</div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-xs text-[#39FF14] font-semibold" style={{ color: '#39FF14' }}>
                                  {res.motivoRescisao}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => setSelectedTermoRescisaoData(res)}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/60 hover:bg-amber-500/30 text-[#FFD700] hover:text-white text-xs font-bold flex items-center gap-1.5 ml-auto transition-all cursor-pointer shadow-[0_0_8px_rgba(255,215,0,0.2)]"
                                  title="Visualizar Termo de Rescisão em PDF"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#FFD700]" />
                                  <span>Ver PDF</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end">
              <button
                onClick={() => setShowRescindidosModal(false)}
                className="px-6 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Relatório de Atividades dos Estagiários */}
      {showRelatorioAtividadesModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black animate-fadeIn text-left">
          <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl max-w-4xl w-full p-6 shadow-[0_0_45px_rgba(212,175,55,0.3)] max-h-[90vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={220} opacity="opacity-[0.16]" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ClipboardList className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    Relatório de Atividades dos <span className="text-amber-400">Estagiários</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Estagiários com mais de 180 dias (6 meses) de TCE ativo (Art. 7º, VII da Lei 11.788/08)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRelatorioAtividadesModal(false)}
                className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-4 relative shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nome do estagiário, empresa, CPF ou Nº do TCE..."
                value={searchRelatorioTerm}
                onChange={(e) => setSearchRelatorioTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/60 transition-all"
              />
            </div>

            {/* Active TCE Interns List (> 180 days) */}
            <div className="flex-1 overflow-y-auto pr-1 relative z-10">
              {(() => {
                const term = searchRelatorioTerm.toLowerCase().trim();
                const list = tces.filter((tce) => {
                  const diasAtivo = calcularDiasTCEAtivo(tce);
                  if (diasAtivo <= 180) return false;

                  if (!term) return true;
                  const estNome = (tce.estagiario?.nome || '').toLowerCase();
                  const estCpf = (tce.estagiario?.cpf || '').toLowerCase();
                  const empNome = (tce.empresa?.nomeFantasia || tce.empresa?.razaoSocial || tce.empresa?.nome || '').toLowerCase();
                  const tceNum = String(tce.numero);
                  return estNome.includes(term) || estCpf.includes(term) || empNome.includes(term) || tceNum.includes(term);
                });

                if (list.length === 0) {
                  return (
                    <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800/80 my-4">
                      <GraduationCap className="w-10 h-10 text-amber-400/40 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-zinc-300">
                        Nenhum estagiário com mais de 180 dias de TCE ativo encontrado
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 max-w-lg mx-auto">
                        {searchRelatorioTerm
                          ? 'Tente alterar os termos da busca.'
                          : 'De acordo com a Lei 11.788/08, os relatórios de atividades devem ser emitidos a cada 6 meses (180 dias). Nenhum dos TCEs cadastrados possui mais de 180 dias entre a data de início e a data atual.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/30">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Estagiário(a)</th>
                          <th className="py-3 px-4">Empresa Concedente</th>
                          <th className="py-3 px-4">TCE / Tempo</th>
                          <th className="py-3 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-xs">
                        {list.map((tceItem) => {
                          const diasAtivo = calcularDiasTCEAtivo(tceItem);
                          return (
                            <tr key={tceItem.id} className="hover:bg-zinc-900/60 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-sm flex items-center gap-2" style={{ color: '#39FF14' }}>
                                  <WhatsAppButton
                                    phone={tceItem.estagiario?.fone}
                                    companyName={tceItem.estagiario?.nome}
                                    size="sm"
                                  />
                                  <span>{tceItem.estagiario?.nome || '—'}</span>
                                </div>
                                <div className="text-[11px] font-mono mt-0.5" style={{ color: '#39FF14', opacity: 0.85 }}>
                                  CPF: {tceItem.estagiario?.cpf || '—'} {tceItem.estagiario?.escolaNome ? `• ${tceItem.estagiario.escolaNome}` : ''}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-xs" style={{ color: '#39FF14' }}>
                                  {tceItem.empresa?.nomeFantasia || tceItem.empresa?.razaoSocial || tceItem.empresa?.nome || '—'}
                                </div>
                                <div className="text-[11px] font-mono" style={{ color: '#39FF14', opacity: 0.85 }}>
                                  CNPJ: {tceItem.empresa?.cnpj || '—'}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className="font-mono font-bold text-xs bg-black/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg inline-block"
                                  style={{ color: '#39FF14' }}
                                >
                                  Nº {tceItem.numero}
                                </span>
                                <div className="text-[11px] font-mono mt-1 font-semibold" style={{ color: '#39FF14', opacity: 0.9 }}>
                                  ⏱ {diasAtivo} dias ativos
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleGerarRelatorioAtividades(tceItem)}
                                  className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/60 hover:bg-amber-500/20 font-extrabold text-xs flex items-center gap-1.5 ml-auto transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                                  style={{ color: '#FFD700' }}
                                >
                                  <FileText className="w-3.5 h-3.5" style={{ color: '#FFD700' }} />
                                  <span style={{ color: '#FFD700' }}>Gerar</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-500">
                Elegíveis (&gt;180 dias):{' '}
                <strong style={{ color: '#39FF14' }}>
                  {
                    tces.filter((tce) => calcularDiasTCEAtivo(tce) > 180).length
                  }
                </strong>{' '}
                de {tces.length} estagiários cadastrados
              </span>
              <button
                onClick={() => setShowRelatorioAtividadesModal(false)}
                className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF do Relatório de Atividades */}
      {selectedTCEForRelatorio && (
        <RelatorioAtividadesPDFModal
          tce={selectedTCEForRelatorio}
          autoDownload={autoDownloadRelatorioPDF}
          onClose={() => {
            setSelectedTCEForRelatorio(null);
            setAutoDownloadRelatorioPDF(false);
          }}
        />
      )}

      {/* Modal Redefinir Senha do Sistema */}
      <RedefinirSenhaModal
        isOpen={showRedefinirSenhaModal}
        onClose={() => setShowRedefinirSenhaModal(false)}
        onSavePassword={(newPass) => {
          if (onUpdatePassword) {
            onUpdatePassword(newPass);
          }
        }}
      />

      {/* Modal de Métricas / Dashboards (Faturamento e Estagiários por Cidade) */}
      <MetricasModal
        isOpen={showMetricasModal}
        onClose={() => setShowMetricasModal(false)}
        estagiarios={estagiarios}
        tces={tces}
        rescisoes={rescisoes}
        empresas={empresas}
        contratos={contratos}
      />

      {/* Modal de Confirmação de Exclusão de Empresa/Contrato no HunterView */}
      {empresaContratoToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)] relative overflow-hidden">
            <HunterWatermark size={180} opacity="opacity-[0.10]" />
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trash2 className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Excluir Empresa do Sistema
                </h3>
                <p className="text-xs text-zinc-400">Confirmação de exclusão permanente</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-300 mb-6">
              <p>
                Tem certeza de que deseja excluir a empresa <strong className="text-amber-300">{empresaContratoToDelete.empresa?.razaoSocial || empresaContratoToDelete.empresa?.nome}</strong> e remover seu Contrato de Parceria dos registros?
              </p>
              {empresaContratoToDelete.empresa?.cnpj && (
                <p className="text-xs text-zinc-400">
                  CNPJ: <span className="font-mono text-zinc-300">{empresaContratoToDelete.empresa.cnpj}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEmpresaContratoToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteEmpresaContrato}
                className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span className="text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Excluir Empresa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta de Impeditivo de Exclusão por Estagiários Ativos */}
      {empresaContratoAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(212,175,55,0.25)] relative overflow-hidden">
            <HunterWatermark size={180} opacity="opacity-[0.10]" />
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Não é Possível Excluir
                </h3>
                <p className="text-xs text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Atenção ao vínculo de estagiários</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-300 mb-6">
              <p>
                Não é possível excluir a empresa <strong className="text-[#FFD700]">{empresaContratoAlert.nome}</strong> pois ela possui <strong className="text-[#FFD700]">{empresaContratoAlert.count} estagiário(s) ativo(s)</strong> vinculado(s).
              </p>
              <p className="text-xs text-zinc-400">
                Para excluir esta empresa, primeiro rescinda o(s) contrato(s) de estágio do(s) estagiário(s).
              </p>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEmpresaContratoAlert(null)}
                className="px-5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)] flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span className="text-[#FFD700] font-bold drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Entendi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de TCE */}
      {tceToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)] relative overflow-hidden">
            <HunterWatermark size={180} opacity="opacity-[0.10]" />
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trash2 className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Excluir TCE Nº {tceToDelete.numero}
                </h3>
                <p className="text-xs text-zinc-400">Confirmação de exclusão do contrato de estágio</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-300 mb-6">
              <p>
                Deseja realmente excluir o TCE Nº <strong className="text-amber-300">{tceToDelete.numero}</strong> do estagiário <strong className="text-amber-300">{tceToDelete.estagiario?.nome}</strong>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setTceToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTces(prev => prev.filter(t => t.id !== tceToDelete.id));
                  setTceToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span className="text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Excluir TCE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Termo de Rescisão */}
      {rescisaoToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)] relative overflow-hidden">
            <HunterWatermark size={180} opacity="opacity-[0.10]" />
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trash2 className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Excluir Termo de Rescisão
                </h3>
                <p className="text-xs text-zinc-400">Confirmação de exclusão do documento</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-300 mb-6">
              <p>
                Tem certeza de que deseja excluir o Termo de Rescisão Nº <strong className="text-amber-300">{rescisaoToDelete.numeroRescisao}</strong> ({rescisaoToDelete.estagiarioNome})?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setRescisaoToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setRescisoes(prev => prev.filter(r => r.numeroRescisao !== rescisaoToDelete.numeroRescisao));
                  setRescisaoToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span className="text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">Excluir Rescisão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


