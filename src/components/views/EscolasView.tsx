import React, { useState } from 'react';
import { Escola, Estagiario } from '../../types/hunter';
import { GraduationCap, Plus, Search, Sparkles, Building, MapPin, Phone, Mail, User, ShieldAlert, CheckCircle2, FileText, Trash2, Eye, X } from 'lucide-react';
import { GlowButton } from '../GlowButton';
import { HunterWatermark } from '../HunterWatermark';
import { WhatsAppButton } from '../WhatsAppButton';
// @ts-ignore
import adminOfficeFullscreenBg from '../../assets/images/admin_office_fullscreen_bg_1786668610871.jpg';

interface EscolasViewProps {
  escolas: Escola[];
  estagiarios?: Estagiario[];
  onAddEscola: (escola: Omit<Escola, 'id' | 'dataCadastro'>) => void;
  onDeleteEscola?: (id: string) => void;
  embedded?: boolean;
  onClose?: () => void;
}

export const EscolasView: React.FC<EscolasViewProps> = ({
  escolas,
  estagiarios,
  onAddEscola,
  onDeleteEscola,
  embedded = false,
  onClose
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

  const mainContent = (
    <div className={`bg-zinc-900/60 backdrop-blur-2xl border border-amber-400/40 rounded-2xl w-full p-5 md:p-7 shadow-[0_12px_45px_rgba(0,0,0,0.5),0_0_35px_rgba(212,175,55,0.2)] flex flex-col overflow-hidden relative ${embedded ? 'max-h-[85vh] my-auto' : 'max-w-6xl mx-auto'}`}>
      <HunterWatermark size={280} opacity="opacity-[0.08]" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-700/60 pb-4 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-[#FFD700] shrink-0 shadow-[0_0_15px_rgba(255,215,0,0.25)]">
            <GraduationCap className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-amber-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.3)] tracking-tight flex items-center gap-2">
              Relação de <span className="text-gold-gradient-bright">Escolas e Instituições</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                Instituições de Ensino
              </span>
            </h2>
            <p className="text-xs text-zinc-300">
              Cadastre e consulte escolas com endereço, CNPJ, responsável e contato.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <GlowButton
            onClick={() => setShowModal(true)}
            icon={<Plus className="w-4 h-4 text-amber-400" />}
            disabled={isCapacityFull}
            id="btn-add-escola"
            className="py-2 px-4 text-xs"
          >
            Cadastrar Nova Escola
          </GlowButton>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.25)] shrink-0"
              title="Fechar Aba"
            >
              <X className="w-4 h-4 text-[#FFD700]" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar & Registros Badge */}
      <div className="flex flex-col sm:flex-row gap-3 my-4 shrink-0 relative z-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#39FF14] absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#39FF14' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por escola, cidade, CNPJ ou responsável..."
            style={{ color: '#39FF14' }}
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#39FF14] placeholder-emerald-400/60 focus:outline-none focus:border-amber-400/80 transition-colors font-medium shadow-inner"
          />
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-700/80 text-xs text-zinc-300 font-mono shrink-0">
          <span>REGISTROS:</span>
          <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">{escolas.length}</span>
        </div>
      </div>

      {/* Main Table / Empty State */}
      <div className="flex-1 overflow-y-auto relative z-10 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-zinc-900/40 border border-zinc-700/50 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <GraduationCap className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-amber-400 mb-1">
              {searchTerm ? 'Nenhuma escola encontrada para a busca' : 'Nenhuma Escola Cadastrada'}
            </h3>
            <p className="text-xs text-zinc-300 max-w-md mb-4">
              {searchTerm
                ? 'Tente pesquisar com outros termos ou limpe o filtro de busca.'
                : 'Clique no botão abaixo "Cadastrar Nova Escola" para adicionar instituições ao sistema.'}
            </p>
            {!searchTerm && (
              <GlowButton
                onClick={() => setShowModal(true)}
                icon={<Plus className="w-4 h-4 text-amber-400" />}
                className="text-xs py-2 px-4"
              >
                Cadastrar Nova Escola
              </GlowButton>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-700/60 bg-zinc-900/50">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/80 text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-zinc-700/70">
                <tr>
                  <th className="py-3 px-4">Nome da Escola</th>
                  <th className="py-3 px-4">Endereço / Bairro</th>
                  <th className="py-3 px-4">Cidade / CEP</th>
                  <th className="py-3 px-4">Telefone / CNPJ</th>
                  <th className="py-3 px-4">Responsável / E-mail</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50 text-zinc-200 text-xs">
                {filtered.map((escola) => (
                  <tr key={escola.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-sm text-[#39FF14]" style={{ color: '#39FF14' }}>{escola.nome}</div>
                      <div className="text-xs font-mono mt-0.5 text-[#39FF14]" style={{ color: '#39FF14', opacity: 0.9 }}>
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
                      <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14', opacity: 0.9 }}>{escola.email || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <WhatsAppButton
                          phone={escola.fone}
                          companyName={escola.nome}
                        />
                        <button
                          onClick={() => setSelectedEscola(escola)}
                          className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-amber-300 hover:text-white hover:border-amber-400/60 transition-all cursor-pointer shadow-sm"
                          title="Ver dados completos"
                        >
                          <Eye className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                        </button>
                        {onDeleteEscola && (
                          <button
                            onClick={() => setEscolaToDelete(escola)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer shadow-sm"
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
      </div>

      {/* Footer com Fechar */}
      {onClose && (
        <div className="pt-3.5 mt-3.5 border-t border-zinc-700/60 flex items-center justify-between shrink-0 relative z-10">
          <span className="text-xs text-zinc-300">
            Total de escolas listadas: <strong style={{ color: '#39FF14' }}>{filtered.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={
        embedded
          ? "w-full max-w-6xl mx-auto my-auto animate-fadeIn text-left py-2 flex flex-col flex-1"
          : "flex-1 overflow-hidden flex flex-col h-full min-h-[520px] text-left select-none relative bg-black"
      }
      id="view-escolas"
    >
      {!embedded && (
        <>
          {/* Imagem de Fundo em Formato Tela Cheia (mesmo fundo do painel administrativo) */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <img
              src={adminOfficeFullscreenBg || '/admin_office_fullscreen_bg.jpg'}
              alt="Painel Administrativo"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('admin_office_fullscreen_bg')) {
                  target.src = '/admin_office_fullscreen_bg.jpg';
                }
              }}
              className="w-full h-full object-cover object-center filter contrast-100 brightness-105 opacity-100 -scale-x-100 transition-all duration-300 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15 pointer-events-none" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col relative z-10">
            {mainContent}
          </div>
        </>
      )}

      {embedded && mainContent}

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

