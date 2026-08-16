import React, { useState } from 'react';
import { Estagiario, Escola } from '../../types/hunter';
import {
  UserCheck,
  Plus,
  Search,
  Sparkles,
  Table,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  User,
  ShieldCheck,
  ClipboardCopy
} from 'lucide-react';
import { GlowButton } from '../GlowButton';
import { HunterWatermark } from '../HunterWatermark';
import { WhatsAppButton } from '../WhatsAppButton';

interface EstagiariosViewProps {
  estagiarios: Estagiario[];
  escolas?: Escola[];
  onAddEstagiario: (estagiario: Omit<Estagiario, 'id' | 'dataCadastro'>) => void;
  onAddEstagiariosLote?: (estagiarios: Omit<Estagiario, 'id' | 'dataCadastro'>[]) => void;
  onDeleteEstagiario?: (id: string) => void;
}

export const EstagiariosView: React.FC<EstagiariosViewProps> = ({
  estagiarios,
  escolas = [],
  onAddEstagiario,
  onAddEstagiariosLote,
  onDeleteEstagiario
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'excel' | 'manual'>('excel');
  const [selectedEstagiario, setSelectedEstagiario] = useState<Estagiario | null>(null);
  const [estagiarioToDelete, setEstagiarioToDelete] = useState<Estagiario | null>(null);

  // Estado para cola do Excel (TSV / Linhas)
  const [excelText, setExcelText] = useState('');

  // Form unitário manual (20 campos)
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [dataNascimento, setDataNascimento] = useState('');
  const [fone, setFone] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');

  // Escola do estagiário (manual)
  const [escolaNome, setEscolaNome] = useState('');
  const [escolaEndereco, setEscolaEndereco] = useState('');
  const [escolaBairro, setEscolaBairro] = useState('');
  const [escolaCidade, setEscolaCidade] = useState('');
  const [escolaCep, setEscolaCep] = useState('');
  const [escolaFone, setEscolaFone] = useState('');
  const [escolaCnpj, setEscolaCnpj] = useState('');
  const [escolaResponsavel, setEscolaResponsavel] = useState('');
  const [escolaEmail, setEscolaEmail] = useState('');

  // Filtragem
  const filtered = estagiarios.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      (e.nome || '').toLowerCase().includes(term) ||
      (e.cpf || '').toLowerCase().includes(term) ||
      (e.cidade || '').toLowerCase().includes(term) ||
      (e.escolaNome || '').toLowerCase().includes(term) ||
      (e.fone || '').toLowerCase().includes(term)
    );
  });

  // Função para processar texto colado do Excel
  const parseExcelText = (text: string): Omit<Estagiario, 'id' | 'dataCadastro'>[] => {
    if (!text || !text.trim()) return [];
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsedList: Omit<Estagiario, 'id' | 'dataCadastro'>[] = [];

    for (const line of lines) {
      // Separador: tabulação (\t) ou ponto e vírgula/vírgula se for de CSV
      const separator = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : '\t');
      const cols = line.split(separator).map(c => c.trim());

      const nomeVal = cols[0] || '';
      if (!nomeVal) continue;

      parsedList.push({
        nome: cols[0] || '',
        endereco: cols[1] || '',
        cep: cols[2] || '',
        bairro: cols[3] || '',
        cidade: cols[4] || '',
        estado: cols[5] || 'SP',
        dataNascimento: cols[6] || '',
        fone: cols[7] || '',
        responsavel: cols[8] || '',
        cpf: cols[9] || '',
        email: cols[10] || '',
        // Dados da escola
        escolaNome: cols[11] || '',
        escolaEndereco: cols[12] || '',
        escolaBairro: cols[13] || '',
        escolaCidade: cols[14] || '',
        escolaCep: cols[15] || '',
        escolaFone: cols[16] || '',
        escolaCnpj: cols[17] || '',
        escolaResponsavel: cols[18] || '',
        escolaEmail: cols[19] || ''
      });
    }

    return parsedList;
  };

  const parsedExcelRows = parseExcelText(excelText);

  // Botão para carregar exemplo real no textarea para teste prático
  const handleLoadExcelExample = () => {
    const exemplo1 = [
      "Ana Souza Silva",
      "Rua da Consolação, 1500",
      "01301-100",
      "Consolação",
      "São Paulo",
      "SP",
      "14/05/2006",
      "(11) 99888-1122",
      "Roberto Souza",
      "123.456.789-00",
      "ana.souza@email.com",
      "ETEC São Paulo",
      "Av. Tiradentes, 615",
      "Luz",
      "São Paulo",
      "01102-000",
      "(11) 3311-2233",
      "46.378.190/0001-20",
      "Coordenadora Lúcia",
      "contato@etecsp.gov.br"
    ].join("\t");

    const exemplo2 = [
      "Lucas Mendes Santos",
      "Av. Paulista, 900",
      "01310-100",
      "Bela Vista",
      "São Paulo",
      "SP",
      "22/09/2005",
      "(11) 97777-3344",
      "Mariana Mendes",
      "987.654.321-11",
      "lucas@email.com",
      "Senai Roberto Mange",
      "Rua Doutor Alvares, 400",
      "Vila Mariana",
      "São Paulo",
      "04015-001",
      "(11) 5544-3322",
      "03.774.819/0001-02",
      "Diretor Marcos",
      "diretoria@senai.br"
    ].join("\t");

    setExcelText(`${exemplo1}\n${exemplo2}`);
  };

  // Enviar em lote (colados do Excel)
  const handleSaveExcelBatch = () => {
    if (parsedExcelRows.length === 0) {
      alert('Nenhum dado válido foi identificado. Cole os dados da planilha na área de texto.');
      return;
    }
    if (onAddEstagiariosLote) {
      onAddEstagiariosLote(parsedExcelRows);
    } else {
      parsedExcelRows.forEach(row => onAddEstagiario(row));
    }
    setExcelText('');
    setShowModal(false);
  };

  // Enviar cadastro manual
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onAddEstagiario({
      nome: nome.trim(),
      endereco: endereco.trim(),
      cep: cep.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      estado: estado.trim() || 'SP',
      dataNascimento: dataNascimento.trim(),
      fone: fone.trim(),
      responsavel: responsavel.trim(),
      cpf: cpf.trim(),
      email: email.trim(),
      // Escola
      escolaNome: escolaNome.trim(),
      escolaEndereco: escolaEndereco.trim(),
      escolaBairro: escolaBairro.trim(),
      escolaCidade: escolaCidade.trim(),
      escolaCep: escolaCep.trim(),
      escolaFone: escolaFone.trim(),
      escolaCnpj: escolaCnpj.trim(),
      escolaResponsavel: escolaResponsavel.trim(),
      escolaEmail: escolaEmail.trim()
    });

    // Limpar
    setNome('');
    setEndereco('');
    setCep('');
    setBairro('');
    setCidade('');
    setEstado('SP');
    setDataNascimento('');
    setFone('');
    setResponsavel('');
    setCpf('');
    setEmail('');
    setEscolaNome('');
    setEscolaEndereco('');
    setEscolaBairro('');
    setEscolaCidade('');
    setEscolaCep('');
    setEscolaFone('');
    setEscolaCnpj('');
    setEscolaResponsavel('');
    setEscolaEmail('');
    setShowModal(false);
  };

  // Auto-preencher se o usuário colar uma linha completa tabulada no campo Nome
  const handleNomePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('Text');
    if (pasted && pasted.includes('\t')) {
      e.preventDefault();
      const cols = pasted.split('\t').map(c => c.trim());
      if (cols[0]) setNome(cols[0]);
      if (cols[1]) setEndereco(cols[1]);
      if (cols[2]) setCep(cols[2]);
      if (cols[3]) setBairro(cols[3]);
      if (cols[4]) setCidade(cols[4]);
      if (cols[5]) setEstado(cols[5]);
      if (cols[6]) setDataNascimento(cols[6]);
      if (cols[7]) setFone(cols[7]);
      if (cols[8]) setResponsavel(cols[8]);
      if (cols[9]) setCpf(cols[9]);
      if (cols[10]) setEmail(cols[10]);
      if (cols[11]) setEscolaNome(cols[11]);
      if (cols[12]) setEscolaEndereco(cols[12]);
      if (cols[13]) setEscolaBairro(cols[13]);
      if (cols[14]) setEscolaCidade(cols[14]);
      if (cols[15]) setEscolaCep(cols[15]);
      if (cols[16]) setEscolaFone(cols[16]);
      if (cols[17]) setEscolaCnpj(cols[17]);
      if (cols[18]) setEscolaResponsavel(cols[18]);
      if (cols[19]) setEscolaEmail(cols[19]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 select-none relative" id="view-estagiarios">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Banco de <span className="text-gold-gradient-bright">Estagiários</span>
          </h2>
          <p className="text-sm text-zinc-400">
            Relação de estagiários cadastrados com importação de planilha Excel e sincronização com Escolas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlowButton
            onClick={() => setShowModal(true)}
            icon={<Plus className="w-4 h-4 text-amber-400" />}
            id="btn-add-estagiario"
          >
            Cadastrar
          </GlowButton>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#39FF14] absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#39FF14' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar"
            style={{ color: '#39FF14' }}
            className="w-full bg-zinc-950/90 border border-white rounded-xl pl-10 pr-4 py-3 text-sm text-[#39FF14] placeholder-[#39FF14] focus:outline-none focus:border-white transition-colors font-medium"
          />
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 font-mono">
          <span>REGISTROS:</span>
          <span className="text-amber-300 font-bold">{estagiarios.length}</span>
        </div>
      </div>

      {/* Main Table / Empty State */}
      {estagiarios.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Nenhum Estagiário Cadastrado
          </h3>
          <p className="text-sm text-zinc-400 max-w-md mb-6">
            Clique no botão <strong className="text-amber-300">"Cadastrar"</strong> para colar os dados direto de uma planilha do Excel (com suporte aos 20 campos na ordem especificada).
          </p>
          <GlowButton
            onClick={() => setShowModal(true)}
            icon={<Plus className="w-4 h-4 text-amber-400" />}
          >
            Cadastrar (Colar do Excel)
          </GlowButton>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-zinc-400 bg-zinc-950/40 rounded-xl border border-zinc-800">
          Nenhum estagiário coincide com a busca "{searchTerm}".
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/90 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Estagiário / Nascimento</th>
                <th className="py-3 px-4">CPF / Contato</th>
                <th className="py-3 px-4">Endereço / Cidade</th>
                <th className="py-3 px-4">Escola do Candidato (Sincronizada)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
              {filtered.map((est) => {
                const isEscola01 = !est.escolaNome || est.escolaNome.includes('01') || est.escolaNome.includes('Padrão');
                return (
                  <tr key={est.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#39FF14] flex items-center gap-2" style={{ color: '#39FF14' }}>
                        <WhatsAppButton
                          phone={est.fone}
                          companyName={est.nome}
                          size="sm"
                        />
                        <span>{est.nome}</span>
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-2 text-[#39FF14]" style={{ color: '#39FF14' }}>
                        <span>Nasc: {est.dataNascimento || '—'}</span>
                        {est.responsavel && (
                          <span style={{ color: '#39FF14' }}>• Resp: {est.responsavel}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{est.cpf || '—'}</div>
                      <div className="text-xs font-mono mt-0.5 text-[#39FF14]" style={{ color: '#39FF14' }}>{est.fone || '—'}</div>
                      <div className="text-[11px] text-[#39FF14]" style={{ color: '#39FF14' }}>{est.email || ''}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{est.endereco || '—'}</div>
                      <div className="text-xs mt-0.5 text-[#39FF14]" style={{ color: '#39FF14' }}>
                        {est.bairro || ''} {est.cidade ? `• ${est.cidade} - ${est.estado || 'SP'}` : ''} ({est.cep || '—'})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium flex items-center gap-1.5 text-[#39FF14]" style={{ color: '#39FF14' }}>
                        <Building2 className="w-3.5 h-3.5 text-[#FFD700] shrink-0 drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                        <span>{est.escolaNome || 'Escola Cadastro 01'}</span>
                      </div>
                      <div className="text-[11px] mt-0.5 font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>
                        CNPJ: {est.escolaCnpj || '—'}
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
                          <CheckCircle2 className="w-3 h-3 text-[#FFD700]" />
                          <span>Módulo Escolas OK</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <WhatsAppButton
                          phone={est.fone}
                          companyName={est.nome}
                        />
                        <button
                          onClick={() => setSelectedEstagiario(est)}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-300 hover:text-white hover:border-amber-400/60 transition-all cursor-pointer"
                          title="Ver ficha completa do estagiário e da escola"
                        >
                          <Eye className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                        </button>
                        {onDeleteEstagiario && (
                          <button
                            onClick={() => setEstagiarioToDelete(est)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
                            title="Excluir estagiário"
                          >
                            <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalhes Estagiario & Escola Modal */}
      {selectedEstagiario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-[0_0_35px_rgba(212,175,55,0.25)] max-h-[90vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={220} opacity="opacity-[0.16]" />
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0 relative z-10">
              <h3 className="text-lg font-bold text-white">
                Ficha Completa do <span className="text-gold-gradient-bright">Estagiário</span>
              </h3>
              <button
                onClick={() => setSelectedEstagiario(null)}
                className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                title="Fechar"
              >
                <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </button>
            </div>

            <div className="space-y-4 text-sm overflow-y-auto flex-1 relative z-10 pr-1">
              {/* Seção 1: Dados do Candidato / Estagiário */}
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>Dados do Candidato / Estagiário</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">Nome do Candidato</span>
                    <span className="font-bold text-base text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.nome}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">CPF / Data Nasc</span>
                    <span className="font-mono font-semibold text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.cpf || '—'}</span>
                    <span className="text-xs block text-[#39FF14]" style={{ color: '#39FF14' }}>Nasc: {selectedEstagiario.dataNascimento || '—'}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">Contato / Telefone</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.fone || '—'}</span>
                      <WhatsAppButton
                        phone={selectedEstagiario.fone}
                        companyName={selectedEstagiario.nome}
                        size="sm"
                      />
                    </div>
                    <span className="text-xs block text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.email || '—'}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">Responsável</span>
                    <span className="font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.responsavel || '—'}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 sm:col-span-2">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">Endereço Completo do Candidato</span>
                    <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.endereco || '—'} • {selectedEstagiario.bairro || '—'} • {selectedEstagiario.cidade || '—'}/{selectedEstagiario.estado || 'SP'} • CEP: {selectedEstagiario.cep || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados da Escola que o estagiário estuda (sincronizada) */}
              <div className="pt-2">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#FFD700]" />
                  <span>Escola onde o Estagiário Estuda (Sincronizada no botão Escolas)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">Nome da Escola</span>
                    <span className="font-bold text-base text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.escolaNome || 'Escola Cadastro 01'}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">CNPJ da Escola</span>
                    <span className="font-mono font-semibold text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.escolaCnpj || '—'}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">Fone / Contato Escola</span>
                    <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.escolaFone || '—'}</span>
                    <span className="text-xs block text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.escolaEmail || '—'}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">Responsável da Escola</span>
                    <span className="font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.escolaResponsavel || '—'}</span>
                  </div>
                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 sm:col-span-2">
                    <span className="text-xs text-zinc-500 uppercase block font-semibold">Endereço da Escola</span>
                    <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEstagiario.escolaEndereco || '—'} • {selectedEstagiario.escolaBairro || '—'} • {selectedEstagiario.escolaCidade || '—'} • CEP: {selectedEstagiario.escolaCep || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-3 border-t border-zinc-800 shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => setSelectedEstagiario(null)}
                className="px-5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CADASTRAR (Capacidade 500 - Com suporte à planilha do Excel) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/50 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(212,175,55,0.3)] max-h-[92vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={240} opacity="opacity-[0.16]" />
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-400 text-black uppercase tracking-wider">
                    Capacidade: 500
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    Cadastrar <span className="text-gold-gradient-bright">Estagiários</span>
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Os dados não precisam ser digitados — podem ser colados direto de uma planilha do Excel
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                title="Fechar"
              >
                <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </button>
            </div>

            {/* Abas para alternar entre Colar do Excel ou Preenchimento Manual */}
            <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 pb-3 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('excel')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  modalTab === 'excel'
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_20px_rgba(255,215,0,0.5)] scale-[1.02]'
                    : 'bg-amber-500/15 text-[#FFD700] hover:bg-amber-500/30 hover:text-yellow-200 border-amber-500/40 shadow-[0_0_10px_rgba(255,215,0,0.2)]'
                }`}
              >
                <FileSpreadsheet className={`w-4 h-4 ${modalTab === 'excel' ? 'text-zinc-950' : 'text-[#FFD700]'}`} />
                <span className={modalTab === 'excel' ? 'text-zinc-950 font-extrabold' : 'text-[#FFD700] font-bold'}>
                  Colar do Excel / Planilha (Recomendado)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('manual')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  modalTab === 'manual'
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_20px_rgba(255,215,0,0.5)] scale-[1.02]'
                    : 'bg-amber-500/15 text-[#FFD700] hover:bg-amber-500/30 hover:text-yellow-200 border-amber-500/40 shadow-[0_0_10px_rgba(255,215,0,0.2)]'
                }`}
              >
                <Table className={`w-4 h-4 ${modalTab === 'manual' ? 'text-zinc-950' : 'text-[#FFD700]'}`} />
                <span className={modalTab === 'manual' ? 'text-zinc-950 font-extrabold' : 'text-[#FFD700] font-bold'}>
                  Cadastro Manual (Campo a Campo)
                </span>
              </button>
            </div>

            {/* Conteúdo Aba 1: Colar do Excel */}
            {modalTab === 'excel' ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Guia das 20 Colunas */}
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Ordem das 20 colunas do Excel (Candidato + Escola):
                    </span>
                    <button
                      type="button"
                      onClick={handleLoadExcelExample}
                      className="text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded border border-amber-500/30 transition-colors cursor-pointer"
                    >
                      Carregar Exemplo de Planilha
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-300 leading-relaxed bg-black/60 p-2.5 rounded-lg border border-zinc-800 overflow-x-auto whitespace-nowrap">
                    1.Nome | 2.Endereço | 3.CEP | 4.Bairro | 5.Cidade | 6.Estado | 7.Data de Nasc. | 8.Fone | 9.Responsável | 10.CPF | 11.e-mail || <b>12.Nome da Escola | 13.Endereço Escola | 14.Bairro Escola | 15.Cidade Escola | 16.CEP Escola | 17.Fone Escola | 18.CNPJ Escola | 19.Responsável Escola | 20.e-mail Escola</b>
                  </div>

                  <p className="text-xs text-zinc-400">
                    * Se os campos da escola estiverem vazios, o sistema preencherá com a <b>Escola Cadastro 01</b>. Se informados, os dados da escola serão salvos automaticamente no módulo <b>Escolas</b>.
                  </p>
                </div>

                {/* Textarea para colagem */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Cole as linhas da sua planilha do Excel aqui (separadas por tabulação ou vírgula):
                  </label>
                  <textarea
                    rows={6}
                    value={excelText}
                    onChange={(e) => setExcelText(e.target.value)}
                    placeholder="Cole as células copiadas diretamente do Excel aqui..."
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 font-mono"
                  />
                </div>

                {/* Pré-visualização da tabela colada */}
                {parsedExcelRows.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        Pré-visualização ({parsedExcelRows.length} registro(s) identificado(s)):
                      </span>
                      <span className="text-xs text-zinc-400">
                        Pronto para salvar no banco e sincronizar com Escolas
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-black/60 max-h-48">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900 text-zinc-400 uppercase tracking-wider">
                          <tr>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Candidato</th>
                            <th className="py-2 px-3">CPF / Contato</th>
                            <th className="py-2 px-3">Cidade/UF</th>
                            <th className="py-2 px-3">Escola Informada</th>
                            <th className="py-2 px-3">Sincronização</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {parsedExcelRows.map((r, idx) => {
                            const temEscola = !!r.escolaNome && r.escolaNome.trim().length > 0;
                            return (
                              <tr key={idx} className="hover:bg-zinc-900/50">
                                <td className="py-2 px-3 font-mono">{idx + 1}</td>
                                <td className="py-2 px-3 font-semibold text-[#39FF14]" style={{ color: '#39FF14' }}>{r.nome}</td>
                                <td className="py-2 px-3 font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{r.cpf || '—'} / {r.fone || '—'}</td>
                                <td className="py-2 px-3 text-[#39FF14]" style={{ color: '#39FF14' }}>{r.cidade || '—'} / {r.estado || 'SP'}</td>
                                <td className="py-2 px-3 font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>
                                  {temEscola ? r.escolaNome : '— (Vazio)'}
                                </td>
                                <td className="py-2 px-3">
                                  {temEscola ? (
                                    <span className="text-amber-300 font-semibold">
                                      ✓ Criará/Atualizará na lista Escolas
                                    </span>
                                  ) : (
                                    <span className="text-amber-300">
                                      ⚠ Usará Escola Cadastro 01
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer Excel */}
                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExcelBatch}
                    disabled={parsedExcelRows.length === 0}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                      parsedExcelRows.length > 0
                        ? 'bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 shadow-[0_4px_20px_rgba(251,191,36,0.35)]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                    <span>Salvar {parsedExcelRows.length > 0 ? `${parsedExcelRows.length} Estagiário(s)` : 'Cadastro(s)'} no Sistema</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Aba 2: Formulário Manual */
              <form onSubmit={handleSaveManual} className="flex-1 overflow-y-auto space-y-5 pr-1">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <b>Dica:</b> Você pode colar uma linha inteira do Excel tabulada direto no campo "Nome do Candidato" que todos os 20 campos serão preenchidos na hora!
                </div>

                {/* 1. Dados do Candidato */}
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                    1. Dados do Candidato / Estagiário (11 Campos)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Nome do Candidato *
                      </label>
                      <input
                        type="text"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        onPaste={handleNomePaste}
                        placeholder="Ex: João da Silva (pode colar a linha tabulada aqui)"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="text"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        placeholder="Ex: 15/05/2005"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        placeholder="Ex: 111.222.333-44"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Telefone (Fone)
                      </label>
                      <input
                        type="text"
                        value={fone}
                        onChange={(e) => setFone(e.target.value)}
                        placeholder="Ex: (11) 99999-0000"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ex: candidato@email.com"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Responsável
                      </label>
                      <input
                        type="text"
                        value={responsavel}
                        onChange={(e) => setResponsavel(e.target.value)}
                        placeholder="Ex: Maria da Silva (Mãe)"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        placeholder="Ex: 01000-000"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Ex: Rua das Flores, 100"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Ex: Centro"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Cidade / Estado
                      </label>
                      <input
                        type="text"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="Ex: São Paulo"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Dados da Escola que o Estagiário Estuda */}
                <div className="pt-3 border-t border-zinc-800">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                    2. Escola que o Estagiário Estuda (9 Campos — Sincronizará com o botão Escolas)
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-3">
                    * Se deixar em branco, o sistema utilizará automaticamente a <b>Escola Cadastro 01</b> (primeira escola cadastrada no sistema).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Nome da Escola
                      </label>
                      <input
                        type="text"
                        value={escolaNome}
                        onChange={(e) => setEscolaNome(e.target.value)}
                        placeholder="Ex: ETEC São Paulo"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        CNPJ da Escola
                      </label>
                      <input
                        type="text"
                        value={escolaCnpj}
                        onChange={(e) => setEscolaCnpj(e.target.value)}
                        placeholder="Ex: 12.345.678/0001-99"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Endereço da Escola
                      </label>
                      <input
                        type="text"
                        value={escolaEndereco}
                        onChange={(e) => setEscolaEndereco(e.target.value)}
                        placeholder="Ex: Av. Tiradentes, 500"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Bairro da Escola
                      </label>
                      <input
                        type="text"
                        value={escolaBairro}
                        onChange={(e) => setEscolaBairro(e.target.value)}
                        placeholder="Ex: Luz"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Cidade da Escola
                      </label>
                      <input
                        type="text"
                        value={escolaCidade}
                        onChange={(e) => setEscolaCidade(e.target.value)}
                        placeholder="Ex: São Paulo"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        CEP da Escola
                      </label>
                      <input
                        type="text"
                        value={escolaCep}
                        onChange={(e) => setEscolaCep(e.target.value)}
                        placeholder="Ex: 01102-000"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Fone da Escola
                      </label>
                      <input
                        type="text"
                        value={escolaFone}
                        onChange={(e) => setEscolaFone(e.target.value)}
                        placeholder="Ex: (11) 3333-4444"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Responsável Escola
                      </label>
                      <input
                        type="text"
                        value={escolaResponsavel}
                        onChange={(e) => setEscolaResponsavel(e.target.value)}
                        placeholder="Ex: Coordenadora Ana"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        E-mail da Escola
                      </label>
                      <input
                        type="email"
                        value={escolaEmail}
                        onChange={(e) => setEscolaEmail(e.target.value)}
                        placeholder="Ex: contato@etec.br"
                        style={{ color: '#39FF14' }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 font-bold text-sm shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                    <span>Salvar Estagiário e Sincronizar Escola</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão de Estagiário */}
      {estagiarioToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)] relative overflow-hidden">
            <HunterWatermark size={180} opacity="opacity-[0.10]" />
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trash2 className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Excluir Estagiário do Sistema
                </h3>
                <p className="text-xs text-zinc-400">Confirmação de exclusão permanente</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-300 mb-6">
              <p>
                Tem certeza de que deseja excluir o estagiário <strong className="text-amber-300">{estagiarioToDelete.nome}</strong>?
              </p>
              {estagiarioToDelete.cpf && (
                <p className="text-xs text-zinc-400">
                  CPF: <span className="font-mono text-zinc-300">{estagiarioToDelete.cpf}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEstagiarioToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteEstagiario) {
                    onDeleteEstagiario(estagiarioToDelete.id);
                  }
                  setEstagiarioToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Excluir Estagiário</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
