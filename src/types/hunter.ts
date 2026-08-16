export type TabId = 'hunter' | 'empresas' | 'estagiarios' | 'escolas';

export interface Empresa {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  fone: string;
  responsavel: string;
  email: string;
  cnpj: string;
  dataCadastro: string;
  vagasAbertas?: number;
  nome?: string; // compatibilidade legada
  setor?: string;
  estado?: string;
}

export interface ContratoParceria {
  id: string;
  numero: number; // Ex: 1200, 1201, 1202...
  empresaId: string;
  empresa: Empresa;
  valor: string; // "eee"
  valorExtenso: string; // "fff"
  diaPagamento: string; // "ggg"
  dataInicio: string; // "hhh"
  dataContrato: string; // "CCC" - Ex: "31 de Julho de 2026"
  cidadeForo: string; // "ddd" - Ex: cidade da empresa
  dataCriacao: string;
}

export interface HunterDados {
  nomeFantasia: string;
  razaoSocial: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  fone: string;
  responsavel: string;
  email: string;
  cnpj: string;
}

export interface Seguradora {
  id: string;
  nome: string;
  apolice: string;
  observacao: string;
  dataCadastro: string;
  fone?: string;
}

export interface TCEContrato {
  id: string;
  numero: number; // Inicia em 1200 em sequência
  empresaId: string;
  empresa: Empresa;
  estagiarioId: string;
  estagiario: Estagiario;
  seguradoraId: string;
  seguradora: Seguradora;
  valor: string; // "eee"
  valorExtenso: string; // "fff"
  diaPagamento: string; // "ggg"
  dataContrato: string; // "CCC"
  cidadeForo: string; // "ddd" (pego do cadastro da empresa)
  dataCriacao: string;
  dataInicio?: string;
  dataUltimoRelatorio?: string;
  tipoEstagio?: 'nao_obrigatorio' | 'obrigatorio';
  atividadesEstagiario?: string;
}

export interface Estagiario {
  id: string;
  nome: string;
  endereco: string;
  cep: string;
  bairro: string;
  cidade: string;
  estado: string;
  dataNascimento: string;
  fone: string;
  responsavel: string;
  cpf: string;
  email: string;
  // Dados da escola que o estagiário estuda:
  escolaNome: string;
  escolaEndereco: string;
  escolaBairro: string;
  escolaCidade: string;
  escolaCep: string;
  escolaFone: string;
  escolaCnpj: string;
  escolaResponsavel: string;
  escolaEmail: string;
  dataCadastro: string;
  // Campos legados opcionais de compatibilidade:
  curso?: string;
  instituicao?: string;
  status?: 'disponivel' | 'alocado' | 'entrevista';
}

export interface Escola {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  cep: string;
  fone: string;
  cnpj: string;
  responsavel: string;
  email: string;
  tipo?: 'Universidade' | 'Faculdade' | 'Escola Técnica' | 'Ensino Médio' | 'Outro';
  alunosAtivos?: number;
  dataCadastro: string;
}

export interface SystemStatus {
  version: string;
  environment: 'desktop' | 'web-preview';
  readyForPartTwo: boolean;
  activeModule: TabId;
}

export interface FolhaRescisaoData {
  referencia: string;
  ano: string;
  ultimoDiaEstagiado: string;
  faltas: string;
  bonificacoes: string;
  adiantamento: string;
}

export interface TermoRescisaoData {
  numeroRescisao: number;
  tce: TCEContrato;
  dataRescisao: string;
  motivoRescisao: string;
  dataCriacao: string;
  folhaRescisao?: FolhaRescisaoData;
}

export interface FolhaEstagiarioItem {
  tce: TCEContrato;
  faltas: string;
  bonificacoes: string;
  adiantamento: string;
  ultimoDiaEstagiado?: string;
}

export interface FolhaPagamentoSalva {
  id: string;
  numeroFolha: string;
  empresa: Empresa;
  contratoEmpresa?: ContratoParceria;
  referencia: string; // "caca"
  ano: string; // "cece"
  dataEmissao: string;
  estagiariosAtivos: FolhaEstagiarioItem[];
}

export function isTceDaEmpresa(
  tce: TCEContrato,
  empresaTarget: Empresa | ContratoParceria | { empresaId?: string; empresa?: Empresa; cnpj?: string; razaoSocial?: string; nomeFantasia?: string; nome?: string }
): boolean {
  if (!tce || !empresaTarget) return false;

  const targetEmp: Empresa | undefined = 'empresa' in empresaTarget && empresaTarget.empresa ? empresaTarget.empresa : (empresaTarget as Empresa);
  const targetEmpId = ('empresaId' in empresaTarget ? empresaTarget.empresaId : null) || targetEmp?.id;

  const tceEmp = tce.empresa;
  const tceEmpId = tce.empresaId || tceEmp?.id;

  // 1. Direct ID match
  if (tceEmpId && targetEmpId && tceEmpId === targetEmpId) return true;
  if (tceEmp?.id && targetEmp?.id && tceEmp.id === targetEmp.id) return true;

  // 2. CNPJ match (digits only)
  const cleanCnpj = (s?: string) => (s || '').replace(/\D/g, '');
  const tceCnpj = cleanCnpj(tceEmp?.cnpj);
  const targetCnpj = cleanCnpj(targetEmp?.cnpj);
  if (tceCnpj && targetCnpj && tceCnpj === targetCnpj) return true;

  // 3. Name matches (case insensitive, trimmed)
  const cleanStr = (s?: string) => (s || '').trim().toLowerCase();
  const targetRazao = cleanStr(targetEmp?.razaoSocial);
  const targetFantasia = cleanStr(targetEmp?.nomeFantasia || targetEmp?.nome);

  const tceRazao = cleanStr(tceEmp?.razaoSocial);
  const tceFantasia = cleanStr(tceEmp?.nomeFantasia || tceEmp?.nome);

  if (targetRazao && tceRazao && targetRazao === tceRazao) return true;
  if (targetFantasia && tceFantasia && targetFantasia === tceFantasia) return true;
  if (targetRazao && tceFantasia && targetRazao === tceFantasia) return true;
  if (targetFantasia && tceRazao && targetFantasia === tceRazao) return true;

  return false;
}

export function empresaTemContratoParceria(
  emp: Empresa,
  contratos: ContratoParceria[]
): boolean {
  if (!emp || !contratos || contratos.length === 0) return false;

  const cleanCnpj = (s?: string) => (s || '').replace(/\D/g, '');
  const cleanStr = (s?: string) => (s || '').trim().toLowerCase();

  const empId = emp.id;
  const empCnpj = cleanCnpj(emp.cnpj);
  const empRazao = cleanStr(emp.razaoSocial);
  const empFantasia = cleanStr(emp.nomeFantasia || emp.nome);

  return contratos.some(c => {
    const cEmpId = c.empresaId || c.empresa?.id;
    if (empId && cEmpId && empId === cEmpId) return true;

    const cCnpj = cleanCnpj(c.empresa?.cnpj);
    if (empCnpj && cCnpj && empCnpj === cCnpj) return true;

    const cRazao = cleanStr(c.empresa?.razaoSocial);
    const cFantasia = cleanStr(c.empresa?.nomeFantasia || c.empresa?.nome);

    if (empRazao && cRazao && empRazao === cRazao) return true;
    if (empFantasia && cFantasia && empFantasia === cFantasia) return true;
    if (empRazao && cFantasia && empRazao === cFantasia) return true;
    if (empFantasia && cRazao && empFantasia === cRazao) return true;

    return false;
  });
}

export function getEstagiariosAtivosDaEmpresa(
  tces: TCEContrato[],
  rescisoes: TermoRescisaoData[],
  empresaTarget: Empresa | ContratoParceria
): TCEContrato[] {
  const tcesDaEmpresa = tces.filter((tce) => isTceDaEmpresa(tce, empresaTarget));

  return tcesDaEmpresa.filter((tceItem) => {
    const isRescindido = (rescisoes || []).some((r) => {
      if (r.tce?.id && tceItem.id && r.tce.id === tceItem.id) return true;
      if (r.tce?.numero && tceItem.numero && r.tce.numero === tceItem.numero) return true;
      return false;
    });
    return !isRescindido;
  });
}

export const STORAGE_KEY_SYSTEM_PASSWORD = 'hunter_system_password_v1';
export const DEFAULT_SYSTEM_PASSWORD = '102030';
export const FORGOT_SYSTEM_PASSWORD = '203040';


