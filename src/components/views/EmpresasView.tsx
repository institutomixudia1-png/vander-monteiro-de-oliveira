import React, { useState, useEffect } from 'react';
import { Empresa, ContratoParceria, empresaTemContratoParceria } from '../../types/hunter';
import { DEFAULT_CONTRATOS } from '../../data/sampleData';
import { Building2, Plus, Search, Eye, Trash2, X, Phone, Mail, MapPin, ShieldAlert } from 'lucide-react';
import { GlowButton } from '../GlowButton';
import { HunterWatermark } from '../HunterWatermark';
import { WhatsAppButton } from '../WhatsAppButton';

interface EmpresasViewProps {
  empresas: Empresa[];
  contratos?: ContratoParceria[];
  onAddEmpresa: (empresa: Omit<Empresa, 'id' | 'dataCadastro'>) => void;
  onDeleteEmpresa?: (id: string) => void;
}

export const EmpresasView: React.FC<EmpresasViewProps> = ({
  empresas,
  contratos: contratosProps,
  onAddEmpresa,
  onDeleteEmpresa
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);

  // Carregar contratos para filtrar empresas que já possuem Contrato de Parceria
  const [localContratos, setLocalContratos] = useState<ContratoParceria[]>(() => {
    try {
      const saved = localStorage.getItem('hunter_desktop_contratos_parceria_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return DEFAULT_CONTRATOS;
    } catch {
      return DEFAULT_CONTRATOS;
    }
  });

  useEffect(() => {
    const loadContratos = () => {
      try {
        const saved = localStorage.getItem('hunter_desktop_contratos_parceria_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setLocalContratos(parsed);
          }
        }
      } catch {
        // ignore error
      }
    };
    loadContratos();
    window.addEventListener('focus', loadContratos);
    return () => window.removeEventListener('focus', loadContratos);
  }, []);

  const activeContratos = contratosProps || localContratos;

  // Filtrar empresas para exibir APENAS as que NÃO possuem Contrato de Parceria
  const empresasSemContrato = empresas.filter(
    (emp) => !empresaTemContratoParceria(emp, activeContratos)
  );

  // Form states
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
  const [vagas, setVagas] = useState(1);

  const filtered = empresasSemContrato.filter(e => {
    const nome = (e.nomeFantasia || e.nome || '').toLowerCase();
    const razao = (e.razaoSocial || '').toLowerCase();
    const cid = (e.cidade || '').toLowerCase();
    const doc = (e.cnpj || '');
    return (
      nome.includes(searchTerm.toLowerCase()) ||
      razao.includes(searchTerm.toLowerCase()) ||
      cid.includes(searchTerm.toLowerCase()) ||
      doc.includes(searchTerm)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFantasia.trim()) return;

    onAddEmpresa({
      nomeFantasia: nomeFantasia.trim(),
      razaoSocial: razaoSocial.trim() || nomeFantasia.trim(),
      endereco: endereco.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      cep: cep.trim(),
      fone: fone.trim(),
      responsavel: responsavel.trim(),
      email: email.trim(),
      cnpj: cnpj.trim(),
      vagasAbertas: Number(vagas) || 0
    });

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
    setVagas(1);
    setShowModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 select-none relative" id="view-empresas">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-amber-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.3)] tracking-tight">
            Relação de <span className="text-gold-gradient-bright">Empresas</span>
          </h2>
          <p className="text-sm text-zinc-400">
            Gerencie empresas cadastradas com nome fantasia, razão social, CNPJ, responsável e contato.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlowButton
            onClick={() => setShowModal(true)}
            icon={<Plus className="w-4 h-4 text-amber-400" />}
            id="btn-add-empresa"
          >
            Cadastrar Empresas
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 font-mono">
          <span>EMPRESAS SEM CONTRATO:</span>
          <span className="text-amber-300 font-bold">{empresasSemContrato.length}</span>
        </div>
      </div>

      {/* Main Table / Empty State */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
            <Building2 className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-amber-400 mb-1">
            {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma Empresa Cadastrada'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-md mb-6">
            {searchTerm
              ? 'Nenhum registro coincide com sua busca atual.'
              : 'Clique no botão abaixo "Cadastrar Empresas" para preencher os dados de uma nova empresa no sistema.'}
          </p>
          {!searchTerm && (
            <GlowButton
              onClick={() => setShowModal(true)}
              icon={<Plus className="w-4 h-4 text-amber-400" />}
            >
              Cadastrar Empresas
            </GlowButton>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/90 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Nome Fantasia / Razão Social</th>
                <th className="py-3 px-4">CNPJ / Telefone</th>
                <th className="py-3 px-4">Endereço / Cidade</th>
                <th className="py-3 px-4">Responsável / E-mail</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
              {filtered.map((emp) => {
                const displayNome = emp.nomeFantasia || emp.nome || 'Empresa Sem Nome';
                return (
                  <tr key={emp.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#39FF14]" style={{ color: '#39FF14' }}>{displayNome}</div>
                      <div className="text-xs mt-0.5 text-[#39FF14]" style={{ color: '#39FF14' }}>
                        {emp.razaoSocial || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.cnpj || '—'}</div>
                      <div className="font-mono text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.fone || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.endereco || '—'}</div>
                      <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.cidade || '—'} • {emp.bairro || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.responsavel || '—'}</div>
                      <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.email || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <WhatsAppButton
                          phone={emp.fone}
                          companyName={displayNome}
                        />
                        <button
                          onClick={() => setSelectedEmpresa(emp)}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-300 hover:text-white hover:border-amber-400/60 transition-all cursor-pointer"
                          title="Ver ficha completa"
                        >
                          <Eye className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                        </button>
                        {onDeleteEmpresa && (
                          <button
                            onClick={() => setEmpresaToDelete(emp)}
                            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
                            title="Excluir empresa"
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

      {/* Detalhes Empresa Modal */}
      {selectedEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_35px_rgba(212,175,55,0.25)] relative overflow-hidden">
            <HunterWatermark size={180} opacity="opacity-[0.16]" />
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-amber-400">
                Ficha da <span className="text-gold-gradient-bright">Empresa</span>
              </h3>
              <button
                onClick={() => setSelectedEmpresa(null)}
                className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-400/60 flex items-center justify-center text-[#FFD700] hover:text-white hover:bg-amber-500/30 hover:border-amber-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                title="Fechar"
              >
                <X className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-zinc-300">
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 uppercase block font-semibold">Nome Fantasia</span>
                <span className="font-bold text-base text-[#39FF14]" style={{ color: '#39FF14' }}>
                  {selectedEmpresa.nomeFantasia || selectedEmpresa.nome}
                </span>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 uppercase block font-semibold">Razão Social</span>
                <span className="font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresa.razaoSocial || '—'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">CNPJ</span>
                  <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresa.cnpj || '—'}</span>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">Telefone</span>
                  <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresa.fone || '—'}</span>
                </div>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <span className="text-xs text-zinc-500 uppercase block font-semibold">Endereço & Bairro</span>
                <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresa.endereco || '—'} — {selectedEmpresa.bairro || '—'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">Cidade</span>
                  <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresa.cidade || '—'}</span>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">CEP</span>
                  <span className="font-mono text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresa.cep || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">Responsável</span>
                  <span className="font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresa.responsavel || '—'}</span>
                </div>
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase block font-semibold">E-mail</span>
                  <span className="text-[#39FF14]" style={{ color: '#39FF14' }}>{selectedEmpresa.email || '—'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setSelectedEmpresa(null)}
                className="px-5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/30 hover:border-amber-300 text-sm font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(255,215,0,0.25)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Empresas */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black animate-fadeIn">
          <div className="bg-zinc-950 border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 shadow-[0_0_35px_rgba(212,175,55,0.25)] max-h-[90vh] flex flex-col overflow-hidden relative">
            <HunterWatermark size={200} opacity="opacity-[0.16]" />
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 shrink-0 relative z-10">
              <div>
                <h3 className="text-lg font-bold text-amber-400">
                  Cadastrar Nova <span className="text-gold-gradient-bright">Empresa</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Preencha os dados da empresa parceira
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: Hunter Brasil"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
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
                    placeholder="Ex: Hunter Tech Empregos Ltda"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    required
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Ex: Av. Paulista, 1000 - Sala 402"
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
                    placeholder="Ex: Bela Vista"
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
                    placeholder="Ex: 01310-100"
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
                    placeholder="Ex: (11) 3222-1000"
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
                    placeholder="Ex: 45.678.901/0001-23"
                    style={{ color: '#39FF14' }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-[#39FF14] focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    placeholder="Ex: Carlos Oliveira (RH)"
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
                    placeholder="Ex: rh@huntertech.com.br"
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
                  <span>Salvar Empresa no Sistema</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}
      {/* Modal de Confirmação de Exclusão de Empresa */}
      {empresaToDelete && (
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
                Tem certeza de que deseja excluir a empresa <strong className="text-amber-300">{empresaToDelete.razaoSocial || empresaToDelete.nomeFantasia || empresaToDelete.nome}</strong>?
              </p>
              {empresaToDelete.cnpj && (
                <p className="text-xs text-zinc-400">
                  CNPJ: <span className="font-mono text-zinc-300">{empresaToDelete.cnpj}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEmpresaToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 text-sm font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteEmpresa) {
                    onDeleteEmpresa(empresaToDelete.id);
                  }
                  setEmpresaToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-500 text-white text-sm font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                <span>Excluir Empresa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

