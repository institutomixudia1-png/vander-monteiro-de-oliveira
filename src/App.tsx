/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TabId, Empresa, Estagiario, Escola, STORAGE_KEY_SYSTEM_PASSWORD, DEFAULT_SYSTEM_PASSWORD, TCEContrato, TermoRescisaoData, ContratoParceria, getEstagiariosAtivosDaEmpresa } from './types/hunter';
import { DesktopHeader } from './components/DesktopHeader';
import { DownloadModal } from './components/DownloadModal';
import { BackupModal } from './components/BackupModal';
import { SystemLockScreen } from './components/SystemLockScreen';
import { HunterView } from './components/views/HunterView';
import { EmpresasView } from './components/views/EmpresasView';
import { EstagiariosView } from './components/views/EstagiariosView';
import { EscolasView } from './components/views/EscolasView';
import { HunterWatermark } from './components/HunterWatermark';
import { DEFAULT_EMPRESAS, DEFAULT_ESTAGIARIOS, DEFAULT_ESCOLAS, DEFAULT_SEGURADORAS, DEFAULT_CONTRATOS } from './data/sampleData';

const STORAGE_KEYS = {
  EMPRESAS: 'hunter_desktop_empresas_v1',
  ESTAGIARIOS: 'hunter_desktop_estagiarios_v1',
  ESCOLAS: 'hunter_desktop_escolas_v1',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('hunter');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Estado para Senha de Acesso ao Sistema
  const [systemPassword, setSystemPassword] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYSTEM_PASSWORD);
      return saved && saved.trim() ? saved.trim() : DEFAULT_SYSTEM_PASSWORD;
    } catch {
      return DEFAULT_SYSTEM_PASSWORD;
    }
  });

  // Estado para Bloqueio/Desbloqueio da Tela de Acesso (sempre bloqueado ao iniciar)
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleUpdatePassword = (newPass: string) => {
    setSystemPassword(newPass);
    localStorage.setItem(STORAGE_KEY_SYSTEM_PASSWORD, newPass);
  };

  // Seed de cadastros (30 candidatos com escolas, 10 empresas, 2 seguradoras, 6 escolas, 10 contratos de parceria)
  const STORAGE_SEED_KEY = 'hunter_desktop_seed_v7';

  useEffect(() => {
    const isSeeded = localStorage.getItem(STORAGE_SEED_KEY);
    if (!isSeeded) {
      localStorage.setItem(STORAGE_KEYS.EMPRESAS, JSON.stringify(DEFAULT_EMPRESAS));
      localStorage.setItem(STORAGE_KEYS.ESTAGIARIOS, JSON.stringify(DEFAULT_ESTAGIARIOS));
      localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(DEFAULT_ESCOLAS));
      localStorage.setItem('hunter_desktop_seguradoras_v1', JSON.stringify(DEFAULT_SEGURADORAS));
      localStorage.setItem('hunter_desktop_contratos_parceria_v1', JSON.stringify(DEFAULT_CONTRATOS));
      localStorage.setItem(STORAGE_SEED_KEY, 'true');
    }
  }, []);

  // Inicializando cadastros
  const [empresas, setEmpresas] = useState<Empresa[]>(() => {
    try {
      const isSeeded = localStorage.getItem(STORAGE_SEED_KEY);
      if (!isSeeded) return DEFAULT_EMPRESAS;
      const saved = localStorage.getItem(STORAGE_KEYS.EMPRESAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_EMPRESAS;
    } catch {
      return DEFAULT_EMPRESAS;
    }
  });

  const [estagiarios, setEstagiarios] = useState<Estagiario[]>(() => {
    try {
      const isSeeded = localStorage.getItem(STORAGE_SEED_KEY);
      if (!isSeeded) return DEFAULT_ESTAGIARIOS;
      const saved = localStorage.getItem(STORAGE_KEYS.ESTAGIARIOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_ESTAGIARIOS;
    } catch {
      return DEFAULT_ESTAGIARIOS;
    }
  });

  const [escolas, setEscolas] = useState<Escola[]>(() => {
    try {
      const isSeeded = localStorage.getItem(STORAGE_SEED_KEY);
      if (!isSeeded) return DEFAULT_ESCOLAS;
      const saved = localStorage.getItem(STORAGE_KEYS.ESCOLAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_ESCOLAS;
    } catch {
      return DEFAULT_ESCOLAS;
    }
  });

  // Save to localStorage when lists change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMPRESAS, JSON.stringify(empresas));
  }, [empresas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ESTAGIARIOS, JSON.stringify(estagiarios));
  }, [estagiarios]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(escolas));
  }, [escolas]);

  // Handle adding new items
  const handleAddEmpresa = (novo: Omit<Empresa, 'id' | 'dataCadastro'>) => {
    const item: Empresa = {
      ...novo,
      id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
    };
    setEmpresas(prev => [item, ...prev]);
  };

  // Sincronizar dados da escola com o cadastro de escolas
  const syncEscolaComSistema = (
    escolaNome: string,
    escolaEndereco: string,
    escolaBairro: string,
    escolaCidade: string,
    escolaCep: string,
    escolaFone: string,
    escolaCnpj: string,
    escolaResponsavel: string,
    escolaEmail: string,
    escolasAtuais: Escola[]
  ): { escolaAtualizada: Omit<Estagiario, 'id' | 'dataCadastro' | 'nome' | 'endereco' | 'cep' | 'bairro' | 'cidade' | 'estado' | 'dataNascimento' | 'fone' | 'responsavel' | 'cpf' | 'email'>; novaEscola?: Escola } => {
    // Se a escola do estagiário estiver vazia -> Preencher com a Escola "01" (primeira escola cadastrada no sistema)
    if (!escolaNome || !escolaNome.trim()) {
      if (escolasAtuais.length > 0) {
        const esc01 = escolasAtuais[0];
        return {
          escolaAtualizada: {
            escolaNome: esc01.nome || 'Escola Cadastro 01',
            escolaEndereco: esc01.endereco || '',
            escolaBairro: esc01.bairro || '',
            escolaCidade: esc01.cidade || '',
            escolaCep: esc01.cep || '',
            escolaFone: esc01.fone || '',
            escolaCnpj: esc01.cnpj || '',
            escolaResponsavel: esc01.responsavel || '',
            escolaEmail: esc01.email || ''
          }
        };
      } else {
        // Criar uma Escola 01 padrão caso nenhuma escola exista ainda no sistema
        const esc01: Escola = {
          id: `esc-01-${Date.now()}`,
          nome: 'Escola Cadastro 01 (Padrão)',
          endereco: 'Av. Principal, 1000',
          bairro: 'Centro',
          cidade: 'São Paulo - SP',
          cep: '01000-000',
          fone: '(11) 3000-0000',
          cnpj: '00.000.000/0001-00',
          responsavel: 'Diretoria Escolar',
          email: 'contato@escola01.com.br',
          dataCadastro: new Date().toLocaleDateString('pt-BR')
        };
        return {
          escolaAtualizada: {
            escolaNome: esc01.nome,
            escolaEndereco: esc01.endereco,
            escolaBairro: esc01.bairro,
            escolaCidade: esc01.cidade,
            escolaCep: esc01.cep,
            escolaFone: esc01.fone,
            escolaCnpj: esc01.cnpj,
            escolaResponsavel: esc01.responsavel,
            escolaEmail: esc01.email
          },
          novaEscola: esc01
        };
      }
    } else {
      // Escola foi informada -> Verificar se já existe no cadastro de escolas (por nome ou CNPJ)
      const jaExiste = escolasAtuais.some(
        e => e.nome.toLowerCase() === escolaNome.trim().toLowerCase() ||
             (escolaCnpj && e.cnpj && e.cnpj === escolaCnpj.trim())
      );
      if (!jaExiste) {
        const novaEscola: Escola = {
          id: `esc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          nome: escolaNome.trim(),
          endereco: escolaEndereco || '',
          bairro: escolaBairro || '',
          cidade: escolaCidade || '',
          cep: escolaCep || '',
          fone: escolaFone || '',
          cnpj: escolaCnpj || '',
          responsavel: escolaResponsavel || '',
          email: escolaEmail || '',
          dataCadastro: new Date().toLocaleDateString('pt-BR')
        };
        return {
          escolaAtualizada: {
            escolaNome: escolaNome.trim(),
            escolaEndereco: escolaEndereco || '',
            escolaBairro: escolaBairro || '',
            escolaCidade: escolaCidade || '',
            escolaCep: escolaCep || '',
            escolaFone: escolaFone || '',
            escolaCnpj: escolaCnpj || '',
            escolaResponsavel: escolaResponsavel || '',
            escolaEmail: escolaEmail || ''
          },
          novaEscola
        };
      }
      return {
        escolaAtualizada: {
          escolaNome: escolaNome.trim(),
          escolaEndereco: escolaEndereco || '',
          escolaBairro: escolaBairro || '',
          escolaCidade: escolaCidade || '',
          escolaCep: escolaCep || '',
          escolaFone: escolaFone || '',
          escolaCnpj: escolaCnpj || '',
          escolaResponsavel: escolaResponsavel || '',
          escolaEmail: escolaEmail || ''
        }
      };
    }
  };

  const handleAddEstagiario = (novo: Omit<Estagiario, 'id' | 'dataCadastro'>) => {
    if (estagiarios.length >= 500) {
      alert('Capacidade máxima de 500 cadastros de estagiários atingida!');
      return;
    }

    const res = syncEscolaComSistema(
      novo.escolaNome,
      novo.escolaEndereco,
      novo.escolaBairro,
      novo.escolaCidade,
      novo.escolaCep,
      novo.escolaFone,
      novo.escolaCnpj,
      novo.escolaResponsavel,
      novo.escolaEmail,
      escolas
    );

    const item: Estagiario = {
      ...novo,
      ...res.escolaAtualizada,
      id: `est-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
    };

    setEstagiarios(prev => [item, ...prev]);
    if (res.novaEscola) {
      setEscolas(prev => [res.novaEscola!, ...prev]);
    }
  };

  const handleAddEstagiariosLote = (novos: Omit<Estagiario, 'id' | 'dataCadastro'>[]) => {
    const vagasDisponiveis = 500 - estagiarios.length;
    if (vagasDisponiveis <= 0) {
      alert('Capacidade máxima de 500 cadastros de estagiários já foi atingida!');
      return;
    }

    const paraAdicionar = novos.slice(0, vagasDisponiveis);
    const novosEstagiarios: Estagiario[] = [];
    const novasEscolasList: Escola[] = [];
    let escolasAtualizadas = [...escolas];

    for (const n of paraAdicionar) {
      const res = syncEscolaComSistema(
        n.escolaNome,
        n.escolaEndereco,
        n.escolaBairro,
        n.escolaCidade,
        n.escolaCep,
        n.escolaFone,
        n.escolaCnpj,
        n.escolaResponsavel,
        n.escolaEmail,
        escolasAtualizadas
      );
      if (res.novaEscola) {
        novasEscolasList.push(res.novaEscola);
        escolasAtualizadas.push(res.novaEscola);
      }
      novosEstagiarios.push({
        ...n,
        ...res.escolaAtualizada,
        id: `est-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        dataCadastro: new Date().toLocaleDateString('pt-BR'),
      });
    }

    setEstagiarios(prev => [...novosEstagiarios, ...prev]);
    if (novasEscolasList.length > 0) {
      setEscolas(prev => [...novasEscolasList, ...prev]);
    }

    if (novos.length > vagasDisponiveis) {
      alert(`Foram importados ${vagasDisponiveis} estagiários (limite de 500 atingido).`);
    } else {
      alert(`Cadastro concluído com sucesso! ${paraAdicionar.length} estagiário(s) adicionado(s).`);
    }
  };

  const handleDeleteEstagiario = (id: string) => {
    setEstagiarios(prev => prev.filter(e => e.id !== id));
  };

  const handleAddEscola = (novo: Omit<Escola, 'id' | 'dataCadastro'>) => {
    const item: Escola = {
      ...novo,
      id: `esc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
    };
    setEscolas(prev => [item, ...prev]);
  };

  const handleDeleteEscola = (id: string) => {
    setEscolas(prev => prev.filter(e => e.id !== id));
  };

  const handleDeleteEmpresa = (id: string) => {
    const empTarget = empresas.find(e => e.id === id);
    if (empTarget) {
      try {
        const tcesRaw = localStorage.getItem('hunter_desktop_tces_v1');
        const rescisoesRaw = localStorage.getItem('hunter_desktop_rescisoes_v1');
        const tces: TCEContrato[] = tcesRaw ? JSON.parse(tcesRaw) : [];
        const rescisoes: TermoRescisaoData[] = rescisoesRaw ? JSON.parse(rescisoesRaw) : [];
        const estagiariosAtivos = getEstagiariosAtivosDaEmpresa(tces, rescisoes, empTarget);
        if (estagiariosAtivos.length > 0) {
          const nomeEmp = empTarget.razaoSocial || empTarget.nome || 'Empresa';
          alert(
            `Não é possível excluir a empresa "${nomeEmp}" pois ela possui ${estagiariosAtivos.length} estagiário(s) ativo(s) vinculado(s).\n\nPara excluir esta empresa, primeiro rescinda o(s) contrato(s) de estágio do(s) estagiário(s).`
          );
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // 1. Remover da lista de empresas em App.tsx
    setEmpresas(prev => prev.filter(e => {
      if (e.id === id) return false;
      if (empTarget && (
        (e.cnpj && empTarget.cnpj && e.cnpj === empTarget.cnpj) ||
        (e.razaoSocial && empTarget.razaoSocial && e.razaoSocial === empTarget.razaoSocial)
      )) return false;
      return true;
    }));

    // 2. Remover dos contratos de parceria salvos no localStorage
    try {
      const contratosRaw = localStorage.getItem('hunter_desktop_contratos_parceria_v1');
      if (contratosRaw) {
        const contratosArr: ContratoParceria[] = JSON.parse(contratosRaw);
        const filteredContratos = contratosArr.filter(c => {
          if (c.empresaId === id) return false;
          if (c.empresa?.id === id) return false;
          if (empTarget) {
            if (c.empresa?.cnpj && empTarget.cnpj && c.empresa.cnpj === empTarget.cnpj) return false;
            if (c.empresa?.razaoSocial && empTarget.razaoSocial && c.empresa.razaoSocial === empTarget.razaoSocial) return false;
            if (c.empresa?.nome && empTarget.nome && c.empresa.nome === empTarget.nome) return false;
          }
          return true;
        });
        localStorage.setItem('hunter_desktop_contratos_parceria_v1', JSON.stringify(filteredContratos));
      }
    } catch (err) {
      console.error('Erro ao remover contrato de parceria:', err);
    }
  };

  const getActiveTitle = (): string => {
    switch (activeTab) {
      case 'hunter':
        return 'Início / Visão Geral';
      case 'empresas':
        return 'Empresas Cadastradas';
      case 'estagiarios':
        return 'Banco de Estagiários';
      case 'escolas':
        return 'Relação de Escolas';
      default:
        return 'Hunter Desktop';
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white font-sans overflow-hidden select-none">
      {/* 1. Desktop Application Header com Botões de Navegação ao lado da logo */}
      <DesktopHeader
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        activeModuleTitle={getActiveTitle()}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onLock={() => setIsUnlocked(false)}
      />

      {/* 2. Main Workspace Window content area */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-black">
        <HunterWatermark size={380} opacity="opacity-[0.18]" />
        {activeTab === 'hunter' && (
          <HunterView
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
            empresas={empresas}
            onDeleteEmpresa={handleDeleteEmpresa}
            onUpdatePassword={handleUpdatePassword}
            estagiarios={estagiarios}
          />
        )}

        {activeTab === 'empresas' && (
          <EmpresasView
            empresas={empresas}
            onAddEmpresa={handleAddEmpresa}
            onDeleteEmpresa={handleDeleteEmpresa}
          />
        )}

        {activeTab === 'estagiarios' && (
          <EstagiariosView
            estagiarios={estagiarios}
            escolas={escolas}
            onAddEstagiario={handleAddEstagiario}
            onAddEstagiariosLote={handleAddEstagiariosLote}
            onDeleteEstagiario={handleDeleteEstagiario}
          />
        )}

        {activeTab === 'escolas' && (
          <EscolasView
            escolas={escolas}
            estagiarios={estagiarios}
            onAddEscola={handleAddEscola}
            onDeleteEscola={handleDeleteEscola}
          />
        )}
      </main>

      {/* 3. Tela de Bloqueio por Senha de 6 dígitos */}
      {!isUnlocked && (
        <SystemLockScreen
          currentPassword={systemPassword}
          onUnlock={() => setIsUnlocked(true)}
          onUpdatePassword={handleUpdatePassword}
        />
      )}

      {/* 4. Download / Install Standalone Instructions Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* 5. Backup / Import / Export Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
}
