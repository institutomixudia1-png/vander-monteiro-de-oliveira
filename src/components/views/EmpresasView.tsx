import React, { useState, useEffect } from 'react';
import { Empresa, ContratoParceria, empresaTemContratoParceria } from '../../types/hunter';
import { DEFAULT_CONTRATOS } from '../../data/sampleData';
import { Building2, Plus, Search, Eye, Trash2, X, Phone, Mail, MapPin, ShieldAlert } from 'lucide-react';
import { GlowButton } from '../GlowButton';
import { HunterWatermark } from '../HunterWatermark';
import { WhatsAppButton } from '../WhatsAppButton';
// @ts-ignore
import adminOfficeFullscreenBg from '../../assets/images/admin_office_fullscreen_bg_1786668610871.jpg';

interface EmpresasViewProps {
  empresas: Empresa[];
  contratos?: ContratoParceria[];
  onAddEmpresa: (empresa: Omit<Empresa, 'id' | 'dataCadastro'>) => void;
  onDeleteEmpresa?: (id: string) => void;
  embedded?: boolean;
  onClose?: () => void;
}

export const EmpresasView: React.FC<EmpresasViewProps> = ({
  empresas,
  contratos: contratosProps,
  onAddEmpresa,
  onDeleteEmpresa,
  embedded = false,
  onClose
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

  const mainContent = (
    <div className={`bg-zinc-900/60 backdrop-blur-2xl border border-amber-400/40 rounded-2xl w-full p-5 md:p-7 shadow-[0_12px_45px_rgba(0,0,0,0.5),0_0_35px_rgba(212,175,55,0.2)] flex flex-col overflow-hidden relative ${embedded ? 'max-h-[85vh] my-auto' : 'max-w-6xl mx-auto'}`}>
      <HunterWatermark size={280} opacity="opacity-[0.08]" />

      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-700/60 pb-4 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-[#FFD700] shrink-0 shadow-[0_0_15px_rgba(255,215,0,0.25)]">
            <Building2 className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-amber-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.3)] tracking-tight flex items-center gap-2">
              Relação de <span className="text-gold-gradient-bright">Empresas</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                Cadastro Geral
              </span>
            </h2>
            <p className="text-xs text-zinc-300">
              Gerencie empresas cadastradas com nome fantasia, razão social, CNPJ, responsável e contato.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <GlowButton
            onClick={() => setShowModal(true)}
            icon={<Plus className="w-4 h-4 text-amber-400" />}
            id="btn-add-empresa"
            className="py-2 px-4 text-xs"
          >
            Cadastrar Empresas
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

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 my-4 shrink-0 relative z-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#39FF14] absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#39FF14' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, razão social, CNPJ ou cidade..."
            style={{ color: '#39FF14' }}
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#39FF14] placeholder-emerald-400/60 focus:outline-none focus:border-amber-400/80 transition-colors font-medium shadow-inner"
          />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-700/80 text-xs text-zinc-300 font-mono shrink-0">
          <span>EMPRESAS SEM CONTRATO:</span>
          <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
            {empresasSemContrato.length}
          </span>
        </div>
      </div>

      {/* Main Table / Empty State */}
      <div className="flex-1 overflow-y-auto relative z-10 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl bg-zinc-900/40 border border-zinc-700/50 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Building2 className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-amber-400 mb-1">
              {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma Empresa Cadastrada'}
            </h3>
            <p className="text-xs text-zinc-300 max-w-md mb-4">
              {searchTerm
                ? 'Nenhum registro coincide com sua busca atual.'
                : 'Clique no botão abaixo "Cadastrar Empresas" para preencher os dados de uma nova empresa no sistema.'}
            </p>
            {!searchTerm && (
              <GlowButton
                onClick={() => setShowModal(true)}
                icon={<Plus className="w-4 h-4 text-amber-400" />}
                className="text-xs py-2 px-4"
              >
                Cadastrar Empresas
              </GlowButton>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-700/60 bg-zinc-900/50">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/80 text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-zinc-700/70">
                <tr>
                  <th className="py-3 px-4">Nome Fantasia / Razão Social</th>
                  <th className="py-3 px-4">CNPJ / Telefone</th>
                  <th className="py-3 px-4">Endereço / Cidade</th>
                  <th className="py-3 px-4">Responsável / E-mail</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50 text-zinc-200 text-xs">
                {filtered.map((emp) => {
                  const displayNome = emp.nomeFantasia || emp.nome || 'Empresa Sem Nome';
                  return (
                    <tr key={emp.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-[#39FF14]" style={{ color: '#39FF14' }}>{displayNome}</div>
                        <div className="text-xs mt-0.5 text-[#39FF14]" style={{ color: '#39FF14', opacity: 0.9 }}>
                          {emp.razaoSocial || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.cnpj || '—'}</div>
                        <div className="font-mono text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.fone || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.endereco || '—'}</div>
                        <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.cidade || '—'} • {emp.bairro || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-[#39FF14]" style={{ color: '#39FF14' }}>{emp.responsavel || '—'}</div>
                        <div className="text-xs text-[#39FF14]" style={{ color: '#39FF14', opacity: 0.9 }}>{emp.email || '—'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <WhatsAppButton
                            phone={emp.fone}
                            companyName={displayNome}
                          />
                          <button
                            onClick={() => setSelectedEmpresa(emp)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-amber-300 hover:text-white hover:border-amber-400/60 transition-all cursor-pointer shadow-sm"
                            title="Ver ficha completa"
                          >
                            <Eye className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                          </button>
                          {onDeleteEmpresa && (
                            <button
                              onClick={() => setEmpresaToDelete(emp)}
                              className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer shadow-sm"
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
      </div>

      {/* Footer com Fechar */}
      {onClose && (
        <div className="pt-3.5 mt-3.5 border-t border-zinc-700/60 flex items-center justify-between shrink-0 relative z-10">
          <span className="text-xs text-zinc-300">
            Total de empresas listadas: <strong style={{ color: '#39FF14' }}>{filtered.length}</strong>
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
      id="view-empresas"
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

