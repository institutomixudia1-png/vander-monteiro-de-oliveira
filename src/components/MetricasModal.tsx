import React, { useMemo, useEffect, useState } from 'react';
import { Empresa, Estagiario, TCEContrato, TermoRescisaoData, ContratoParceria, isTceDaEmpresa } from '../types/hunter';
import { DEFAULT_CONTRATOS } from '../data/sampleData';
import { HunterLogo } from './HunterLogo';
import { HunterWatermark } from './HunterWatermark';
import {
  PieChart as PieChartIcon,
  X,
  MapPin,
  Users,
  Trophy,
  Building2,
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
  FileCheck,
  FileX
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface MetricasModalProps {
  isOpen: boolean;
  onClose: () => void;
  estagiarios: Estagiario[];
  tces?: TCEContrato[];
  rescisoes?: TermoRescisaoData[];
  empresas?: Empresa[];
  contratos?: ContratoParceria[];
  embedded?: boolean;
}

const COLORS = [
  '#FFD700', // Gold Hunter
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MESES_ABREV = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const STORAGE_KEY_FATURAMENTO = 'hunter_faturamento_historico_v1';

const parseMonetaryValue = (valStr: string | number | undefined): number => {
  if (typeof valStr === 'number') return valStr;
  if (!valStr) return 0;
  const cleanStr = String(valStr).replace(/[^\d.,]/g, '').trim();
  if (!cleanStr) return 0;
  if (cleanStr.includes(',')) {
    const normalized = cleanStr.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }
  return parseFloat(cleanStr) || 0;
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const MONTH_MAP_PT: Record<string, number> = {
  janeiro: 0, jan: 0,
  fevereiro: 1, fev: 1,
  março: 2, marco: 2, mar: 2,
  abril: 3, abr: 3,
  maio: 4, mai: 4,
  junho: 5, jun: 5,
  julho: 6, jul: 6,
  agosto: 7, ago: 7,
  setembro: 8, set: 8,
  outubro: 9, out: 9,
  novembro: 10, nov: 10,
  dezembro: 11, dez: 11
};

const parseDateToYearMonth = (dateStr?: string, fallbackObj?: any): { year: number; month: number } | null => {
  if (dateStr) {
    const str = String(dateStr).trim().toLowerCase();
    if (str) {
      // 1. Formato DD/MM/YYYY ou DD/MM/YY
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
          if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
            return { year, month };
          }
        }
      }

      // 2. Formato YYYY-MM-DD
      if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length >= 3 && parts[0].length === 4) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
            return { year, month };
          }
        }
      }

      // 3. Nomes de meses em português (ex: "11 de Agosto de 2026", "Agosto de 2026", "Agosto")
      for (const [key, monthIdx] of Object.entries(MONTH_MAP_PT)) {
        if (str.includes(key)) {
          const yearMatch = str.match(/\b(20\d\d|19\d\d)\b/);
          const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
          return { year, month: monthIdx };
        }
      }

      // 4. Parser padrão JS Date
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return { year: d.getFullYear(), month: d.getMonth() };
      }
    }
  }

  // 5. Verificação no objeto fallback (ex: folhaRescisao { ano, referencia })
  if (fallbackObj) {
    if (fallbackObj.ano && fallbackObj.referencia) {
      const anoNum = parseInt(fallbackObj.ano, 10);
      const refLower = String(fallbackObj.referencia).toLowerCase();
      const foundKey = Object.keys(MONTH_MAP_PT).find(k => refLower.includes(k));
      if (!isNaN(anoNum) && foundKey) {
        return { year: anoNum, month: MONTH_MAP_PT[foundKey] };
      }
    }
  }

  return null;
};

const currentYearGlobal = new Date().getFullYear();

// Tooltip customizado do gráfico de linha do tempo
const CustomTimelineTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-amber-500/60 p-2.5 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] backdrop-blur-md">
        <p className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5 mb-1">
          <Calendar className="w-3.5 h-3.5 text-[#FFD700]" />
          {data.fullName} {currentYearGlobal}
          {data.isCurrent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-[#FFD700] border border-amber-400/40 font-bold ml-1">
              Mês Atual
            </span>
          )}
        </p>
        <div className="text-xs text-zinc-300 space-y-0.5">
          <p className="text-emerald-400 font-bold flex items-center justify-between gap-3">
            <span>TCEs Feitos:</span>
            <strong className="text-white font-black">{data.tces}</strong>
          </p>
          <p className="text-red-400 font-bold flex items-center justify-between gap-3">
            <span>Rescisões:</span>
            <strong className="text-white font-black">{data.rescisoes}</strong>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip customizado do gráfico de pizza
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-amber-500/60 p-2.5 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] backdrop-blur-md">
        <p className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5 mb-1">
          <MapPin className="w-3.5 h-3.5 text-[#FFD700]" />
          {data.name}
        </p>
        <div className="text-xs text-zinc-300 space-y-0.5">
          <p>
            TCEs Ativos: <strong className="text-white font-bold">{data.value}</strong>
          </p>
          <p>
            Representação: <strong className="text-[#39FF14] font-bold">{data.percentage}%</strong>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip customizado do gráfico de barras de faturamento
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-amber-500/60 p-2.5 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] backdrop-blur-md">
        <p className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5 mb-1">
          <Calendar className="w-3.5 h-3.5 text-[#FFD700]" />
          {data.fullName} {currentYearGlobal}
          {data.isCurrent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-[#FFD700] border border-amber-400/40 font-bold ml-1">
              Mês Atual
            </span>
          )}
        </p>
        <p className="text-xs text-zinc-300">
          Faturamento: <strong className="text-[#FFD700] font-black text-sm">{formatCurrency(data.faturamento)}</strong>
        </p>
      </div>
    );
  }
  return null;
};

// Tooltip customizado do gráfico de linha do tempo das Top 3 Empresas
const CustomTop3CompaniesTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-blue-500/60 p-2.5 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] backdrop-blur-md">
        <p className="font-extrabold text-blue-300 text-xs flex items-center gap-1.5 mb-1.5 border-b border-zinc-800 pb-1">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          {data.fullName} {currentYearGlobal}
          {data.isCurrent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40 font-bold ml-1">
              Mês Atual
            </span>
          )}
        </p>
        <div className="text-xs text-zinc-300 space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-bold flex items-center justify-between gap-3" style={{ color: entry.stroke }}>
              <span className="truncate max-w-[130px]">{entry.name}:</span>
              <strong className="text-white font-black">{entry.value} estag.</strong>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip customizado do gráfico de linha do tempo das Top 3 Empresas em Rescisões
const CustomTop3RescisoesTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-red-500/60 p-2.5 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] backdrop-blur-md">
        <p className="font-extrabold text-red-300 text-xs flex items-center gap-1.5 mb-1.5 border-b border-zinc-800 pb-1">
          <Calendar className="w-3.5 h-3.5 text-red-400" />
          {data.fullName} {currentYearGlobal}
          {data.isCurrent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-400/40 font-bold ml-1">
              Mês Atual
            </span>
          )}
        </p>
        <div className="text-xs text-zinc-300 space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-bold flex items-center justify-between gap-3" style={{ color: entry.stroke }}>
              <span className="truncate max-w-[130px]">{entry.name}:</span>
              <strong className="text-white font-black">{entry.value} resc.</strong>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip customizado do gráfico de empresas (Com TCE Ativo [Verde] vs Sem Estagiário [Vermelho])
const CustomEmpresasStatusTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950/95 border border-emerald-500/60 p-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md">
        <p className="font-extrabold text-emerald-300 text-xs flex items-center gap-1.5 mb-1.5 border-b border-zinc-800 pb-1">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          {data.fullName} {currentYearGlobal}
          {data.isCurrent && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold ml-1">
              Mês Atual
            </span>
          )}
        </p>
        <div className="text-xs text-zinc-300 space-y-1">
          <p className="font-bold flex items-center justify-between gap-3 text-emerald-400">
            <span>Com TCE Ativo:</span>
            <strong className="text-white font-black">{data.comTceAtivo} emp.</strong>
          </p>
          <p className="font-bold flex items-center justify-between gap-3 text-red-400">
            <span>Sem Estagiário Ativo:</span>
            <strong className="text-white font-black">{data.semEstagiarioAtivo} emp.</strong>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const MetricasModal: React.FC<MetricasModalProps> = ({
  isOpen,
  onClose,
  estagiarios,
  tces = [],
  rescisoes = [],
  empresas = [],
  contratos = [],
  embedded = false
}) => {
  if (!isOpen) return null;

  // Filtrar TCEs ativos (não rescindidos)
  const activeTces = useMemo(() => {
    if (!tces || tces.length === 0) return [];
    return tces.filter((tceItem) => {
      const isRescindido = (rescisoes || []).some((r) => {
        if (r.tce?.id && tceItem.id && r.tce.id === tceItem.id) return true;
        if (r.tce?.numero && tceItem.numero && r.tce.numero === tceItem.numero) return true;
        return false;
      });
      return !isRescindido;
    });
  }, [tces, rescisoes]);

  // Faturamento Atual: quantidade de TCEs ativos de cada empresa * valor do contrato de parceria daquela empresa, e soma total
  const faturamentoAtual = useMemo(() => {
    if (activeTces.length === 0) return 0;

    const effectiveContratos = contratos && contratos.length > 0 ? contratos : (() => {
      try {
        const saved = localStorage.getItem('hunter_desktop_contratos_parceria_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return DEFAULT_CONTRATOS;
      } catch {
        return DEFAULT_CONTRATOS;
      }
    })();

    return activeTces.reduce((acc, tce) => {
      const empId = tce.empresaId || tce.empresa?.id;
      const empCnpj = tce.empresa?.cnpj;
      const empRazao = tce.empresa?.razaoSocial?.trim().toLowerCase();

      const contrato = effectiveContratos.find((c) => {
        if (empId && (c.empresaId === empId || c.empresa?.id === empId)) return true;
        if (empCnpj && c.empresa?.cnpj && c.empresa.cnpj === empCnpj) return true;
        if (empRazao && c.empresa?.razaoSocial && c.empresa.razaoSocial.trim().toLowerCase() === empRazao) return true;
        return false;
      });

      const valorContrato = contrato?.valor ? parseMonetaryValue(contrato.valor) : 0;
      return acc + valorContrato;
    }, 0);
  }, [activeTces, contratos]);

  // Estado para armazenar o histórico de faturamento dos meses anteriores
  const [faturamentoHistory, setFaturamentoHistory] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FATURAMENTO);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 a 11

  // Salvar automaticamente o faturamento do mês anterior no dia 1
  useEffect(() => {
    if (!isOpen) return;

    if (currentMonth > 0) {
      const prevMonthIndex = currentMonth - 1;
      const prevKey = `${currentYear}-${prevMonthIndex}`;

      if (faturamentoHistory[prevKey] === undefined) {
        const updated = { ...faturamentoHistory, [prevKey]: faturamentoAtual };
        setFaturamentoHistory(updated);
        try {
          localStorage.setItem(STORAGE_KEY_FATURAMENTO, JSON.stringify(updated));
        } catch (e) {
          console.error('Erro ao salvar histórico de faturamento:', e);
        }
      }
    }
  }, [isOpen, currentMonth, currentYear, faturamentoAtual, faturamentoHistory]);

  // Linha do tempo de TCEs x Rescisões do ano vigente (Janeiro ao mês atual)
  const timelineData = useMemo(() => {
    const tceMonthlyCount = new Array(12).fill(0);
    const rescisaoMonthlyCount = new Array(12).fill(0);

    // 1. Contabilizar TCEs ativos na data de criação
    (tces || []).forEach((tce) => {
      const dateVal = tce.dataCriacao || tce.dataContrato || tce.dataInicio;
      let parsed = parseDateToYearMonth(dateVal);
      if (!parsed) {
        parsed = { year: currentYear, month: currentMonth };
      }
      if (parsed.year === currentYear && parsed.month >= 0 && parsed.month < 12) {
        tceMonthlyCount[parsed.month]++;
      }
    });

    // 2. Contabilizar Rescisões no mês da rescisão e somar ao total de TCEs no mês em que o TCE foi gerado
    (rescisoes || []).forEach((r) => {
      const dateValRescisao = r.dataRescisao || r.dataCriacao;
      let parsedR = parseDateToYearMonth(dateValRescisao, r.folhaRescisao);
      if (!parsedR) {
        parsedR = { year: currentYear, month: currentMonth };
      }
      if (parsedR.year === currentYear && parsedR.month >= 0 && parsedR.month < 12) {
        rescisaoMonthlyCount[parsedR.month]++;
      }

      // Se o TCE rescindido tinha sido removido do array de TCEs ativos, contabilizá-lo também no mês em que foi criado
      if (r.tce) {
        const dateValTCE = r.tce.dataCriacao || r.tce.dataContrato || r.tce.dataInicio;
        let parsedTce = parseDateToYearMonth(dateValTCE);
        if (!parsedTce) {
          parsedTce = parsedR;
        }
        if (parsedTce.year === currentYear && parsedTce.month >= 0 && parsedTce.month < 12) {
          tceMonthlyCount[parsedTce.month]++;
        }
      }
    });

    let totalTcesAno = 0;
    let totalRescisoesAno = 0;

    const chartData = [];
    for (let m = 0; m <= currentMonth; m++) {
      const tcesNum = tceMonthlyCount[m];
      const rescisoesNum = rescisaoMonthlyCount[m];
      totalTcesAno += tcesNum;
      totalRescisoesAno += rescisoesNum;

      chartData.push({
        monthIndex: m,
        name: MESES_ABREV[m],
        fullName: MESES_NOMES[m],
        tces: tcesNum,
        rescisoes: rescisoesNum,
        isCurrent: m === currentMonth
      });
    }

    return {
      chartData,
      totalTcesAno,
      totalRescisoesAno,
      saldoAno: totalTcesAno - totalRescisoesAno
    };
  }, [tces, rescisoes, currentYear, currentMonth]);

  // Top 3 empresas com maior número de estagiários ativos para a linha do tempo (3 linhas em azul)
  const top3CompaniesData = useMemo(() => {
    const companyCounts: Record<string, { id: string; name: string; tces: TCEContrato[] }> = {};

    activeTces.forEach((tce) => {
      const compId = tce.empresa?.id || tce.empresaId || tce.empresa?.nomeFantasia || tce.empresa?.razaoSocial || 'empresa_desconhecida';
      const compName = tce.empresa?.nomeFantasia || tce.empresa?.razaoSocial || tce.empresa?.nome || 'Empresa Concedente';

      if (!companyCounts[compId]) {
        companyCounts[compId] = { id: compId, name: compName, tces: [] };
      }
      companyCounts[compId].tces.push(tce);
    });

    const sortedCompanies = Object.values(companyCounts).sort((a, b) => b.tces.length - a.tces.length);
    const top3 = sortedCompanies.slice(0, 3);

    // 3 tons de azul para as 3 empresas
    const blueShades = [
      { stroke: '#60A5FA', label: 'Azul Claro' },
      { stroke: '#2563EB', label: 'Azul Vivo' },
      { stroke: '#0284C7', label: 'Azul Oceano' },
    ];

    const chartData = [];
    for (let m = 0; m <= currentMonth; m++) {
      const monthItem: any = {
        monthIndex: m,
        name: MESES_ABREV[m],
        fullName: MESES_NOMES[m],
        isCurrent: m === currentMonth
      };

      top3.forEach((comp, idx) => {
        const activeInM = comp.tces.filter((tce) => {
          const dateVal = tce.dataCriacao || tce.dataContrato || tce.dataInicio;
          const parsed = parseDateToYearMonth(dateVal);
          if (!parsed) return true;
          if (parsed.year < currentYear) return true;
          if (parsed.year === currentYear) return parsed.month <= m;
          return false;
        }).length;

        monthItem[`comp_${idx}`] = activeInM;
      });

      chartData.push(monthItem);
    }

    return {
      top3,
      chartData,
      blueShades
    };
  }, [activeTces, currentYear, currentMonth]);

  // Top 3 empresas com mais rescisões (linha do tempo de rescisões)
  const top3RescisoesData = useMemo(() => {
    const companyRescisoes: Record<string, { id: string; name: string; rescisoes: TermoRescisaoData[] }> = {};

    (rescisoes || []).forEach((r) => {
      const compId = r.tce?.empresa?.id || r.tce?.empresaId || r.tce?.empresa?.nomeFantasia || r.tce?.empresa?.razaoSocial || 'empresa_desconhecida';
      const compName = r.tce?.empresa?.nomeFantasia || r.tce?.empresa?.razaoSocial || r.tce?.empresa?.nome || 'Empresa Concedente';

      if (!companyRescisoes[compId]) {
        companyRescisoes[compId] = { id: compId, name: compName, rescisoes: [] };
      }
      companyRescisoes[compId].rescisoes.push(r);
    });

    const sortedCompanies = Object.values(companyRescisoes).sort((a, b) => b.rescisoes.length - a.rescisoes.length);
    const top3 = sortedCompanies.slice(0, 3);

    // 3 tons de vermelho/rosa para o gráfico de rescisões
    const redShades = [
      { stroke: '#EF4444', label: 'Vermelho' },
      { stroke: '#F87171', label: 'Coral' },
      { stroke: '#FB7185', label: 'Rosa Coral' },
    ];

    const chartData = [];
    for (let m = 0; m <= currentMonth; m++) {
      const monthItem: any = {
        monthIndex: m,
        name: MESES_ABREV[m],
        fullName: MESES_NOMES[m],
        isCurrent: m === currentMonth
      };

      top3.forEach((comp, idx) => {
        const countInM = comp.rescisoes.filter((r) => {
          const dateVal = r.dataRescisao || r.dataCriacao;
          let parsed = parseDateToYearMonth(dateVal, r.folhaRescisao);
          if (!parsed) {
            parsed = { year: currentYear, month: currentMonth };
          }
          return parsed.year === currentYear && parsed.month === m;
        }).length;

        monthItem[`comp_${idx}`] = countInM;
      });

      chartData.push(monthItem);
    }

    return {
      top3,
      chartData,
      redShades
    };
  }, [rescisoes, currentYear, currentMonth]);

  // Dashboard: Linha do Tempo de Empresas (Com TCE Ativo [Verde] x Sem Estagiário Ativo [Vermelho])
  const empresasAtivasVsInativasData = useMemo(() => {
    // 1. Obter a lista de contratos de parceria efetivos
    const effectiveContratos = contratos && contratos.length > 0 ? contratos : (() => {
      try {
        const saved = localStorage.getItem('hunter_desktop_contratos_parceria_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return DEFAULT_CONTRATOS;
      } catch {
        return DEFAULT_CONTRATOS;
      }
    })();

    // 2. Coletar a lista única de empresas que POSSUEM contrato de parceria
    const empresasComContratoList: Empresa[] = [];
    const addedCompanyKeys = new Set<string>();

    const addEmpresaIfNew = (emp: Empresa) => {
      const key = emp.id || (emp.cnpj ? emp.cnpj.replace(/\D/g, '') : null) || emp.razaoSocial?.trim().toLowerCase() || emp.nomeFantasia?.trim().toLowerCase();
      if (key && !addedCompanyKeys.has(key)) {
        addedCompanyKeys.add(key);
        empresasComContratoList.push(emp);
      }
    };

    (empresas || []).forEach((e) => {
      const hasContract = (effectiveContratos || []).some(
        (c) =>
          c.empresaId === e.id ||
          c.empresa?.id === e.id ||
          (c.empresa?.cnpj && e.cnpj && c.empresa.cnpj === e.cnpj) ||
          (c.empresa?.razaoSocial && e.razaoSocial && c.empresa.razaoSocial.trim().toLowerCase() === e.razaoSocial.trim().toLowerCase())
      );
      if (hasContract) {
        addEmpresaIfNew(e);
      }
    });

    (effectiveContratos || []).forEach((ct) => {
      if (ct.empresa) {
        addEmpresaIfNew(ct.empresa);
      }
    });

    const totalEmpresasCount = empresasComContratoList.length;

    const chartData = [];
    let currentMesComTce = 0;
    let currentMesSemEstagiario = 0;

    for (let m = 0; m <= currentMonth; m++) {
      const activeCompanyIndices = new Set<number>();
      const rescindedCompanyIndices = new Set<number>();

      (tces || []).forEach((tce) => {
        const dateVal = tce.dataCriacao || tce.dataContrato || tce.dataInicio;
        const parsedStart = parseDateToYearMonth(dateVal);

        let startedByM = false;
        if (!parsedStart) {
          startedByM = true;
        } else if (parsedStart.year < currentYear) {
          startedByM = true;
        } else if (parsedStart.year === currentYear && parsedStart.month <= m) {
          startedByM = true;
        }

        if (!startedByM) return;

        const foiRescindidoAteM = (rescisoes || []).some((r) => {
          const matchTce = (r.tce?.id && tce.id && r.tce.id === tce.id) ||
                           (r.tce?.numero && tce.numero && r.tce.numero === tce.numero);
          if (!matchTce) return false;

          const dateR = r.dataRescisao || r.dataCriacao;
          const parsedR = parseDateToYearMonth(dateR, r.folhaRescisao);
          if (!parsedR) return true;
          if (parsedR.year < currentYear) return true;
          if (parsedR.year === currentYear && parsedR.month <= m) return true;
          return false;
        });

        if (!foiRescindidoAteM) {
          empresasComContratoList.forEach((emp, empIdx) => {
            if (isTceDaEmpresa(tce, emp)) {
              activeCompanyIndices.add(empIdx);
            }
          });
        }
      });

      let unindexedRescisoesCount = 0;
      (rescisoes || []).forEach((r) => {
        const dateR = r.dataRescisao || r.dataCriacao;
        const parsedR = parseDateToYearMonth(dateR, r.folhaRescisao);
        if (!parsedR) return;

        let rescindedByM = false;
        if (parsedR.year < currentYear) {
          rescindedByM = true;
        } else if (parsedR.year === currentYear && parsedR.month <= m) {
          rescindedByM = true;
        }

        if (!rescindedByM) return;

        let matched = false;
        empresasComContratoList.forEach((emp, empIdx) => {
          if (r.tce && isTceDaEmpresa(r.tce, emp)) {
            matched = true;
            if (!activeCompanyIndices.has(empIdx)) {
              rescindedCompanyIndices.add(empIdx);
            }
          }
        });

        if (!matched) {
          unindexedRescisoesCount++;
        }
      });

      const comTce = activeCompanyIndices.size;
      const rescCount = rescindedCompanyIndices.size + unindexedRescisoesCount;
      let semEstagiario = 0;
      if (m === currentMonth) {
        semEstagiario = Math.max(0, totalEmpresasCount - comTce);
      } else {
        semEstagiario = rescCount;
      }

      if (m === currentMonth) {
        currentMesComTce = comTce;
        currentMesSemEstagiario = semEstagiario;
      }

      chartData.push({
        monthIndex: m,
        name: MESES_ABREV[m],
        fullName: MESES_NOMES[m],
        comTceAtivo: comTce,
        semEstagiarioAtivo: semEstagiario,
        isCurrent: m === currentMonth
      });
    }

    return {
      chartData,
      totalEmpresasCount,
      currentMesComTce,
      currentMesSemEstagiario
    };
  }, [empresas, tces, rescisoes, contratos, currentYear, currentMonth]);

  // Montar demonstrativo anual (de Janeiro ao Mês Corrente)
  const faturamentoAnualData = useMemo(() => {
    const list = [];
    let totalAno = 0;

    for (let m = 0; m <= currentMonth; m++) {
      const isCurrent = m === currentMonth;
      const monthKey = `${currentYear}-${m}`;
      const valor = isCurrent ? faturamentoAtual : (faturamentoHistory[monthKey] ?? 0);
      totalAno += valor;

      list.push({
        monthIndex: m,
        name: MESES_ABREV[m],
        fullName: MESES_NOMES[m],
        faturamento: valor,
        isCurrent
      });
    }

    const mediaMensal = list.length > 0 ? totalAno / list.length : 0;

    return {
      chartData: list,
      totalAno,
      mediaMensal,
      faturamentoAtual
    };
  }, [currentMonth, currentYear, faturamentoAtual, faturamentoHistory]);

  // Processar quantidade de TCEs ativos separados por cidade
  const { chartData: cidadeChartData, totalEstagiarios, totalCidades, cidadeComMaisEstagiarios } = useMemo(() => {
    const total = activeTces.length;
    const countMap: Record<string, number> = {};

    activeTces.forEach((tce) => {
      const cidadeRaw = tce.estagiario?.cidade || tce.cidadeForo || tce.empresa?.cidade || '';
      const cidadeNorm = cidadeRaw.trim() !== '' ? cidadeRaw.trim() : 'Não Informada';
      countMap[cidadeNorm] = (countMap[cidadeNorm] || 0) + 1;
    });

    const LARGEST_SLICE_COLOR = '#B4C5E4'; // Cor da maior fatia
    const OTHER_COLORS = [
      '#FFD700', // Gold Hunter
      '#F59E0B', // Amber
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#EC4899', // Pink
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#6366F1', // Indigo
      '#14B8A6', // Teal
    ];

    const data = Object.entries(countMap)
      .map(([cidade, count]) => ({
        name: cidade,
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({
        ...item,
        color: idx === 0 ? LARGEST_SLICE_COLOR : OTHER_COLORS[(idx - 1) % OTHER_COLORS.length]
      }));

    const numCidades = Object.keys(countMap).length;
    const topCidade = data.length > 0 ? data[0] : null;

    return {
      chartData: data,
      totalEstagiarios: total,
      totalCidades: numCidades,
      cidadeComMaisEstagiarios: topCidade
    };
  }, [activeTces]);

  return (
    <div className={embedded ? "w-full max-w-5xl mx-auto my-auto flex flex-col flex-1 relative z-10 space-y-4 animate-fadeIn text-left py-2" : "fixed inset-0 z-[99999] w-screen h-screen bg-black/80 backdrop-blur-md flex flex-col p-4 md:p-8 overflow-y-auto select-none animate-fadeIn"}>
      <div className={`w-full mx-auto my-auto flex flex-col flex-1 relative z-10 space-y-4 ${embedded ? 'bg-zinc-950/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-4 md:p-6 shadow-[0_0_50px_rgba(0,0,0,0.85),0_0_35px_rgba(212,175,55,0.25)]' : 'max-w-5xl'}`}>
        <HunterWatermark size={320} opacity="opacity-[0.08]" />

        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0 relative z-10">
          <div className="flex items-center gap-3.5">
            <HunterLogo size={42} glow={true} />
            <div>
              <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <PieChartIcon className="w-6 h-6 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />
                <span className="text-gold-gradient-bright">Dashboard Anual</span>
              </h3>
              <p className="text-xs md:text-sm text-zinc-400 mt-0.5">
                Demonstrativo financeiro de faturamento e distribuição de estagiários por cidade
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center gap-2 text-[#FFD700] hover:text-white hover:bg-amber-500/35 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,215,0,0.3)] font-bold text-xs md:text-sm"
            title="Voltar ao Sistema"
          >
            <span>Voltar ao Sistema</span>
            <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
          </button>
        </div>

        {/* Content Body: Grid com 3 Colunas de Dashboards */}
        <div className="overflow-y-auto flex-1 relative z-10 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            {/* DASHBOARD 1: Linha do Tempo - TCEs x Rescisões */}
            <div className="bg-zinc-900 p-2 rounded-xl flex flex-col justify-between gap-1 shadow-xl">
              <div>
                <div className="pb-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <LineChartIcon className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />
                    <h4 className="text-xs font-extrabold text-white">
                      TCE x RESCISÕES
                    </h4>
                  </div>
                </div>
              </div>

              {/* Gráfico de Linha do Tempo */}
              <div className="bg-zinc-950/80 p-1 rounded-lg flex flex-col items-center justify-center">
                <div className="h-[114px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#a1a1aa"
                        tick={{ fill: '#d4d4d8', fontSize: 8 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#a1a1aa"
                        tick={{ fill: '#a1a1aa', fontSize: 8 }}
                        allowDecimals={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTimelineTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="tces"
                        name="TCEs Feitos"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#10B981' }}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rescisoes"
                        name="Rescisões"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#EF4444' }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* DASHBOARD 2: Estagiários por Cidade (Pizza) */}
            <div className="bg-zinc-900 p-2 rounded-xl flex flex-col justify-between gap-1 shadow-xl">
              <div>
                <div className="pb-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <PieChartIcon className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />
                    <h4 className="text-xs font-extrabold text-white">
                      Estagiários
                    </h4>
                  </div>
                </div>
              </div>

              {/* Gráfico de Pizza */}
              {totalEstagiarios === 0 ? (
                <div className="p-3 text-center bg-zinc-950 rounded-xl my-1">
                  <PieChartIcon className="w-6 h-6 text-amber-500/50 mx-auto mb-1" />
                  <p className="text-amber-400 text-[10px] font-semibold">
                    Nenhum TCE ativo para exibir gráficos.
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-950/80 p-1 rounded-lg flex flex-col items-center justify-center">
                  <div className="h-[114px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cidadeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={16}
                          outerRadius={32}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percentage }) => `${name} (${percentage}%)`}
                          labelLine={{ stroke: '#f59e0b', strokeWidth: 1 }}
                        >
                          {cidadeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#09090b" strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* DASHBOARD 3: Faturamento Mês a Mês */}
            <div className="bg-zinc-900 p-2 rounded-xl flex flex-col justify-between gap-1 shadow-xl">
              <div>
                <div className="pb-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />
                    <h4 className="text-xs font-extrabold text-white uppercase">
                      faturamento
                    </h4>
                  </div>
                </div>
              </div>

              {/* Gráfico de Barras do Faturamento Mês a Mês */}
              <div className="bg-zinc-950/80 p-1 rounded-lg flex flex-col items-center justify-center">
                <div className="h-[114px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={faturamentoAnualData.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#a1a1aa"
                        tick={{ fill: '#d4d4d8', fontSize: 8 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#a1a1aa"
                        tick={{ fill: '#a1a1aa', fontSize: 8 }}
                        tickFormatter={(val) => `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="faturamento" radius={[3, 3, 0, 0]}>
                        {faturamentoAnualData.chartData.map((entry, idx) => {
                          const isJulho = entry.monthIndex === 6 || entry.name === 'Jul';
                          return (
                            <Cell
                              key={`bar-${idx}`}
                              fill={isJulho ? '#8B5CF6' : entry.isCurrent ? '#FFD700' : '#d97706'}
                              stroke={isJulho ? '#A78BFA' : entry.isCurrent ? '#FFF' : '#b45309'}
                              strokeWidth={isJulho || entry.isCurrent ? 1 : 0}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* DASHBOARD 4: Status das Empresas (COM TCE x SEM TCE) */}
            <div className="bg-zinc-900 p-2 rounded-xl flex flex-col justify-between gap-1 shadow-xl">
              <div>
                <div className="pb-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />
                    <h4 className="text-xs font-extrabold text-white">
                      COM TCE x SEM TCE
                    </h4>
                  </div>
                </div>
              </div>

              {/* Gráfico de Linha do Tempo: Verde x Vermelho */}
              <div className="bg-zinc-950/80 p-1 rounded-lg flex flex-col items-center justify-center">
                <div className="h-[114px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={empresasAtivasVsInativasData.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis
                        dataKey="name"
                        stroke="#a1a1aa"
                        tick={{ fill: '#d4d4d8', fontSize: 8 }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#a1a1aa"
                        tick={{ fill: '#a1a1aa', fontSize: 8 }}
                        allowDecimals={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomEmpresasStatusTooltip />} />
                      {/* Gráfico de Linha do Tempo: Verde x Vermelho */}
                      <Line
                        type="monotone"
                        dataKey="comTceAtivo"
                        name="Com TCE Ativo"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#10B981' }}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="semEstagiarioAtivo"
                        name="Sem Estagiário Ativo"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#EF4444' }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* DASHBOARD 5: Top 3 Empresas (TOP 3) */}
            <div className="bg-zinc-900 p-2 rounded-xl flex flex-col justify-between gap-1 shadow-xl">
              <div>
                <div className="pb-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />
                    <h4 className="text-xs font-extrabold text-white">
                      TOP 3
                    </h4>
                  </div>
                </div>
              </div>

              {/* Gráfico de Linha do Tempo das Top 3 Empresas */}
              <div className="bg-zinc-950/80 p-1 rounded-lg flex flex-col items-center justify-center">
                {top3CompaniesData.top3.length === 0 ? (
                  <div className="p-2 text-center text-blue-400/80 text-[10px] font-semibold">
                    Nenhuma empresa com estagiários ativos cadastrada.
                  </div>
                ) : (
                  <div className="h-[114px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={top3CompaniesData.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <XAxis
                          dataKey="name"
                          stroke="#a1a1aa"
                          tick={{ fill: '#d4d4d8', fontSize: 8 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#a1a1aa"
                          tick={{ fill: '#a1a1aa', fontSize: 8 }}
                          allowDecimals={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTop3CompaniesTooltip />} />
                        {top3CompaniesData.top3.map((comp, idx) => (
                          <Line
                            key={comp.id || idx}
                            type="monotone"
                            dataKey={`comp_${idx}`}
                            name={comp.name}
                            stroke={top3CompaniesData.blueShades[idx].stroke}
                            strokeWidth={2}
                            dot={{ r: 2, fill: top3CompaniesData.blueShades[idx].stroke }}
                            activeDot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* DASHBOARD 6: Top 3 Rescisões (TOP RESCISÕES) */}
            <div className="bg-zinc-900 p-2 rounded-xl flex flex-col justify-between gap-1 shadow-xl">
              <div>
                <div className="pb-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <FileX className="w-3.5 h-3.5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]" />
                    <h4 className="text-xs font-extrabold text-white">
                      TOP RESCISÕES
                    </h4>
                  </div>
                </div>
              </div>

              {/* Gráfico de Linha do Tempo das Rescisões */}
              <div className="bg-zinc-950/80 p-1 rounded-lg flex flex-col items-center justify-center">
                {top3RescisoesData.top3.length === 0 ? (
                  <div className="p-2 text-center text-red-400/80 text-[10px] font-semibold">
                    Nenhuma empresa com rescisões registradas.
                  </div>
                ) : (
                  <div className="h-[114px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={top3RescisoesData.chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <XAxis
                          dataKey="name"
                          stroke="#a1a1aa"
                          tick={{ fill: '#d4d4d8', fontSize: 8 }}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#a1a1aa"
                          tick={{ fill: '#a1a1aa', fontSize: 8 }}
                          allowDecimals={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTop3RescisoesTooltip />} />
                        {top3RescisoesData.top3.map((comp, idx) => (
                          <Line
                            key={comp.id || idx}
                            type="monotone"
                            dataKey={`comp_${idx}`}
                            name={comp.name}
                            stroke={top3RescisoesData.redShades[idx].stroke}
                            strokeWidth={2}
                            dot={{ r: 2, fill: top3RescisoesData.redShades[idx].stroke }}
                            activeDot={{ r: 4 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé informativo na parte de baixo da aba de Estatísticas */}
          <div className="mt-4 pt-3 border-t border-zinc-800 text-center text-xs text-zinc-400 font-medium relative z-10 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[#FFD700] font-bold drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]">HUNTER DESKTOP</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-300 font-medium">Relatório Estatístico Consolidado de Desempenho, Estágios e Faturamento Anual</span>
          </div>
        </div>
      </div>
    </div>
  );
};
