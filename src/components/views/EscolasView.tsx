import React, { useState } from 'react';
import { Escola, Estagiario } from '../../types/hunter';
import { GraduationCap, Plus, Search, Sparkles, Building, MapPin, Phone, Mail, User, ShieldAlert, CheckCircle2, FileText, Trash2, Eye, X } from 'lucide-react';
import { GlowButton } from '../GlowButton';
import { HunterWatermark } from '../HunterWatermark';
import { WhatsAppButton } from '../WhatsAppButton';

interface EscolasViewProps {
  escolas: Escola[];
  estagiarios?: Estagiario[];
  onAddEscola: (escola: Omit<Escola, 'id' | 'dataCadastro'>) => void;
  onDeleteEscola?: (id: string) => void;
}

export const EscolasView: React.FC<EscolasViewProps> = ({
  escolas,
  estagiarios,
  onAddEscola,
  onDeleteEscola
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState<Escola | null>(null);
  const [escolaToDelete, setEscolaToDelete] = useState<Escola | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [cep, setCep] = useState('');
  const [fone, setFone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState<Escola['tipo']>('Universidade');
  const [alunos, setAlunos] = useState(0);

  const maxCapacity = 500;
  const isCapacityFull = escolas.length >= maxCapacity;

  const filtered = escolas.filter(e =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.bairro.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.cnpj && e.cnpj.includes(searchTerm)) ||
    (e.responsavel && e.responsavel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || isCapacityFull) return;

    onAddEscola({
      nome: nome.trim(),
      endereco: endereco.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      cep: cep.trim(),
      fone: fone.trim(),
      cnpj: cnpj.trim(),
      responsavel: responsavel.trim(),
      email: email.trim(),
      tipo,
      alunosAtivos: Number(alunos) || 0
    });

    // Reset Form
    setNome('');
    setEndereco('');
    setBairro('');
    setCidade('');
    setCep('');
    setFone('');
    setCnpj('');
    setResponsavel('');
    setEmail('');
    setTipo('Universidade');
    setAlunos(0);
    setShowModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 select-none relative" id="view-escolas">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Relação de <span className="text-gold-gradient-bright">Escolas e Instituições</span>
          </h2>
          <p className="text-sm text-zinc-400">
            Cadastre e consulte escolas com endereço, CNPJ, responsável e contato.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlowButton
            onClick={() => setShowModal(true)}
            icon={<Plus className="w-4 h-4 text-amber-400" />}
            disabled={isCapacityFull}
            id="btn-add-escola"
          >
            Cadastrar Nova Escola
          </GlowButton>
        </div>
      </div>

      {/* Search Bar & Registros Badge */}
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
          <span className="text-amber-300 font-bold">{escolas.length}</span>
        </div>
      </div>

      {/* Main Table / Empty State */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <GraduationCap className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {searchTerm ? 'Nenhuma escola encontrada para a busca' : 'Nenhuma Escola Cadastrada'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-md mb-6">
            {searchTerm
              ? 'Tente pesquisar com outros termos ou limpe o filtro de busca.'
              : 'Clique no botão abaixo "Cadastrar Nova Escola" para adicionar instituições ao sistema.'}
          </p>
          {!searchTerm && (
            <GlowButton
              onClick={() => setShowModal(true)}
              icon={<Plus className="w-4 h-4 text-amber-400" />}
            >
              Cadastrar Nova Escola
            </GlowButton>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/90 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Nome da Escola</th>
                <th className="py-3 px-4">Endereço / Bairro</th>
                <th className="py-3 px-4">Cidade / CEP</th>
                <th className="py-3 px-4">Telefone / CNPJ</th>
                <th className="py-3 px-4">Responsável / E-mail</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
              {filtered.map((escola) => (
                <tr key={escola.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.nome}</div>
                    <div className="text-xs font-mono mt-0.5 text-[#39FF14]" style={{ color: '#39FF14' }}>
                      {escola.tipo || 'Instituição de Ensino'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.endereco || '—'}</div>
                    <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.bairro || '—'}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.cidade || '—'}</div>
                    <div className="text-xs font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.cep || '—'}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.fone || '—'}</div>
                    <div className="text-xs font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.cnpj || '—'}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.responsavel || '—'}</div>
                    <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.email || '—'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <WhatsAppButton
                        phone={escola.fone}
                        companyName={escola.nome}
                      />
                      <button
                        onClick={() => setSelectedEscola(escola)}
                        className="p-1.5 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 hover:border-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                        title="Ver dados completos"
                      >
                        <Eye className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                      </button>
                      {onDeleteEscola && (
                        <button
                          onClick={() => setEscolaToDelete(escola)}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-amber-500/40 text-amber-300 hover:text-amber-200 hover:border-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                          title="Excluir escola"
                        >
                          <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedEscola && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_35px_rgba(212,175,55,0.25)] relative overflow-hidden max-h-[90vh] flex flex-col">
            <HunterWatermark size={180} opacity="opacity-[0.16]" />
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0 relative z-10">
              <h3 className="text-lg font-bold text-white">
                Ficha da <span className="text-gold-gradient-bright">Escola</span>
              </h3>
              <button
                onClick={() => setSelectedEscola(null)}
                className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                title="Fechar"
              >
                <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-zinc-300 overflow-y-auto flex-1 relative z-10 pr-1">
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 uppercase block font-semibold">Nome da Escola</span>
                <span className="font-bold text-base text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEscola.nome}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">CNPJ</span>
                  <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEscola.cnpj || 'Não informado'}</span>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">Telefone</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEscola.fone || 'Não informado'}</span>
                    <WhatsAppButton
                      phone={selectedEscola.fone}
                      companyName={selectedEscola.nome}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 uppercase block font-semibold">Endereço & Bairro</span>
                <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEscola.endereco || '—'} — {selectedEscola.bairro || '—'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">Cidade</span>
                  <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEscola.cidade || 'Não informada'}</span>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">CEP</span>
                  <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEscola.cep || 'Não informado'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">Nome do Responsável</span>
                  <span className="font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEscola.responsavel || 'Não informado'}</span>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">E-mail</span>
                  <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEscola.email || 'Não informado'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => setSelectedEscola(null)}
                className="px-5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Nova Escola */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 shadow-[0_0_35px_rgba(212,175,55,0.25)] max-h-[90vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={200} opacity="opacity-[0.16]" />
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0 relative z-10">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Cadastrar Nova <span className="text-gold-gradient-bright">Escola</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Sistema de limite para até 500 escolas cadastradas.
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

            <div className="overflow-y-auto flex-1 relative z-10 pr-1">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome da Escola ou Instituição *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Escola Estadual Professor Silva / FATEC / Colégio São Paulo"
                  style={{ color: '#39FF14' }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Endereço (Rua, Av, Número) *
                  </label>
                  <input
                    type="text"
                    required
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Ex: Av. Brasil, 1500 - Centro"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
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
                    placeholder="Ex: Jardim Paulista"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
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
                    placeholder="Ex: 01000-000"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Telefone (Fone) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fone}
                    onChange={(e) => setFone(e.target.value)}
                    placeholder="Ex: (11) 3456-7890"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
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
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Ex: Diretora Claudia Mendes"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
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
                    placeholder="Ex: contato@escola.edu.br"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500/20 backdrop-blur-md border border-amber-400/60 text-amber-200 hover:text-white hover:bg-amber-500/30 text-sm font-bold shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                  <span>Salvar Escola no Sistema</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}
      {/* Modal de Confirmação de Exclusão de Escola */}
      {escolaToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)] relative overflow-hidden">
            <HunterWatermark size={180} opacity="opacity-[0.10]" />
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trash2 className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Excluir Escola do Sistema
                </h3>
                <p className="text-xs text-zinc-400">Confirmação de exclusão permanente</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-300 mb-6">
              <p>
                Tem certeza de que deseja excluir a escola <strong className="text-amber-300">{escolaToDelete.nome}</strong>?
              </p>
              {escolaToDelete.cnpj && (
                <p className="text-xs text-zinc-400">
                  CNPJ: <span className="font-mono text-zinc-300">{escolaToDelete.cnpj}</span>
                </p>
              )}
              {(() => {
                const vinculados = (estagiarios || []).filter(e =>
                  (e.escolaNome || '').trim().toLowerCase() === (escolaToDelete.nome || '').trim().toLowerCase()
                );
                if (vinculados.length > 0) {
                  return (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Atenção: Existem <strong>{vinculados.length} estagiário(s)</strong> cadastrado(s) com esta escola.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEscolaToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteEscola) {
                    onDeleteEscola(escolaToDelete.id);
                  }
                  setEscolaToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Excluir Escola</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

