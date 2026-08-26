import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  Copy, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  SendHorizontal, 
  PlusCircle, 
  Trash2, 
  Layers,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { HunterWatermark } from '../HunterWatermark';
import { 
  DemandaRegistro, 
  STORAGE_KEY_DEMANDAS, 
  STORAGE_KEY_DEMANDA_PASSWORD, 
  DEFAULT_DEMANDA_PASSWORD 
} from '../../types/hunter';
import { triggerAutoSaveToCloud } from '../../lib/supabase';
// @ts-ignore
import adminOfficeFullscreenBg from '../../assets/images/admin_office_fullscreen_bg_1786668610871.jpg';

interface DemandaItemState {
  id: string;
  mensagem: string;
  dataDemanda: string;
}

interface WhatsAppDetectado {
  numeroOriginal: string;
  numeroFormatado: string;
  numeroLimpo: string;
  linkWeb: string;
}

// Função para extrair números de telefone / WhatsApp do texto da mensagem
export function extrairNumerosWhatsApp(texto: string): WhatsAppDetectado[] {
  if (!texto || !texto.trim()) return [];

  // Regex abrangente para números brasileiros e internacionais
  // Detecta padrões como: (34) 99999-9999, +55 34 99999-9999, 34 99999-9999, 34999999999, +5534999999999, wa.me/5534999999999
  const phoneRegex = /(?:\+?55\s?)?(?:\(?0?[1-9]{2}\)?[\s.-]?)?(?:9[\s.-]?)?[0-9]{4}[\s.-]?[0-9]{4}/g;
  
  const matches = texto.match(phoneRegex);
  if (!matches) return [];

  const resultados: WhatsAppDetectado[] = [];
  const vistos = new Set<string>();

  for (const match of matches) {
    // Remove tudo que não for dígito
    let digitos = match.replace(/\D/g, '');

    // Se começa com 0 (ex: 034...), remove o zero inicial
    if (digitos.length === 11 && digitos.startsWith('0')) {
      digitos = digitos.substring(1);
    } else if (digitos.length === 12 && digitos.startsWith('0')) {
      digitos = digitos.substring(1);
    }

    // Validação de tamanho mínimo para ser um telefone válido (pelo menos 10 dígitos: DDD + 8 ou 9 dígitos)
    if (digitos.length >= 10 && digitos.length <= 13) {
      let numeroComDDI = digitos;
      
      // Se não tiver DDI 55 (tamanho 10 ou 11), adiciona DDI 55 do Brasil
      if (digitos.length === 10 || digitos.length === 11) {
        numeroComDDI = `55${digitos}`;
      }

      // Evita duplicatas na mesma demanda
      if (!vistos.has(numeroComDDI)) {
        vistos.add(numeroComDDI);

        // Formatação visual amigável: +55 (DD) 9XXXX-XXXX
        let formatado = match.trim();
        if (numeroComDDI.startsWith('55') && numeroComDDI.length === 13) {
          const ddd = numeroComDDI.substring(2, 4);
          const p1 = numeroComDDI.substring(4, 9);
          const p2 = numeroComDDI.substring(9);
          formatado = `+55 (${ddd}) ${p1}-${p2}`;
        } else if (numeroComDDI.startsWith('55') && numeroComDDI.length === 12) {
          const ddd = numeroComDDI.substring(2, 4);
          const p1 = numeroComDDI.substring(4, 8);
          const p2 = numeroComDDI.substring(8);
          formatado = `+55 (${ddd}) ${p1}-${p2}`;
        }

        resultados.push({
          numeroOriginal: match.trim(),
          numeroFormatado: formatado,
          numeroLimpo: numeroComDDI,
          linkWeb: `https://web.whatsapp.com/send?phone=${numeroComDDI}`,
        });
      }
    }
  }

  return resultados;
}

export const DemandaView: React.FC = () => {
  // Lista de demandas preenchidas + rascunhos
  const [demandas, setDemandas] = useState<DemandaItemState[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEMANDAS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = parsed.map((d: any) => ({
            id: d.id || `demanda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            mensagem: d.mensagem || '',
            dataDemanda: d.dataDemanda || '',
          }));
          // Garante que haja pelo menos uma caixa vazia ao final para novas demandas
          const last = list[list.length - 1];
          if (last && last.mensagem.trim() !== '') {
            list.push({
              id: `demanda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              mensagem: '',
              dataDemanda: '',
            });
          }
          return list;
        }
      }
      return [
        {
          id: `demanda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          mensagem: '',
          dataDemanda: '',
        }
      ];
    } catch {
      return [
        {
          id: `demanda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          mensagem: '',
          dataDemanda: '',
        }
      ];
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const textareaRefs = useRef<{ [id: string]: HTMLTextAreaElement | null }>({});

  // Senha de 6 dígitos para acesso direto ao módulo de Demanda na tela de Acesso Restrito
  const [demandaSenha, setDemandaSenha] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DEMANDA_PASSWORD);
      return saved && saved.trim() ? saved.trim() : DEFAULT_DEMANDA_PASSWORD;
    } catch {
      return DEFAULT_DEMANDA_PASSWORD;
    }
  });
  const [showDemandaSenha, setShowDemandaSenha] = useState(false);
  const [isEditingSenha, setIsEditingSenha] = useState(false);
  const [senhaSavedAlert, setSenhaSavedAlert] = useState(false);

  // Listener para sincronizar e recarregar demandas após restauração do Supabase
  useEffect(() => {
    const handleDatabaseRestored = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_DEMANDAS);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const list = parsed.map((d: any) => ({
              id: d.id || `demanda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              mensagem: d.mensagem || '',
              dataDemanda: d.dataDemanda || '',
            }));
            const last = list[list.length - 1];
            if (last && last.mensagem.trim() !== '') {
              list.push({
                id: `demanda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                mensagem: '',
                dataDemanda: '',
              });
            }
            setDemandas(list);
          }
        }

        const savedPass = localStorage.getItem(STORAGE_KEY_DEMANDA_PASSWORD);
        if (savedPass && savedPass.trim()) {
          setDemandaSenha(savedPass.trim());
        }
      } catch (err) {
        console.error('Erro ao restaurar demandas em DemandaView:', err);
      }
    };

    window.addEventListener('hunter_database_restored', handleDatabaseRestored);
    return () => window.removeEventListener('hunter_database_restored', handleDatabaseRestored);
  }, []);

  const handleSalvarSenhaDemanda = (novaSenha: string) => {
    const apenasDigitos = novaSenha.replace(/\D/g, '').slice(0, 6);
    setDemandaSenha(apenasDigitos);
    if (apenasDigitos.length === 6) {
      localStorage.setItem(STORAGE_KEY_DEMANDA_PASSWORD, apenasDigitos);
      triggerAutoSaveToCloud();
      setSenhaSavedAlert(true);
      setTimeout(() => setSenhaSavedAlert(false), 3000);
    }
  };

  // Formata data e hora atual no padrão brasileiro (DD/MM/AAAA às HH:mm:ss)
  const getFormattedCurrentDate = () => {
    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR');
    const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${dataStr} às ${horaStr}`;
  };

  // Salva no localStorage e nuvem sempre que as demandas mudarem
  const persistirDemandas = (itens: DemandaItemState[]) => {
    const apenasPreenchidas: DemandaRegistro[] = itens
      .filter(item => item.mensagem.trim() !== '')
      .map(item => ({
        id: item.id,
        mensagem: item.mensagem.trim(),
        dataDemanda: item.dataDemanda || getFormattedCurrentDate(),
        dataHoraISO: new Date().toISOString(),
        titulo: item.mensagem.trim().split('\n')[0].substring(0, 60),
      }));

    localStorage.setItem(STORAGE_KEY_DEMANDAS, JSON.stringify(apenasPreenchidas));
    triggerAutoSaveToCloud();
  };

  // Atualiza uma caixa específica e adiciona nova caixa abaixo se a última for preenchida
  const handleAtualizarDemanda = (id: string, novoTexto: string, dataCustom?: string) => {
    setDemandas(prevDemandas => {
      const index = prevDemandas.findIndex(d => d.id === id);
      if (index === -1) return prevDemandas;

      const itemAtual = prevDemandas[index];
      const novaData = dataCustom || itemAtual.dataDemanda || (novoTexto.trim() ? getFormattedCurrentDate() : '');

      const novasDemandas = [...prevDemandas];
      novasDemandas[index] = {
        ...itemAtual,
        mensagem: novoTexto,
        dataDemanda: novoTexto.trim() ? novaData : '',
      };

      // Se a última caixa agora está preenchida, adiciona automaticamente uma nova caixa vazia abaixo
      const ultima = novasDemandas[novasDemandas.length - 1];
      if (ultima && ultima.mensagem.trim() !== '') {
        novasDemandas.push({
          id: `demanda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          mensagem: '',
          dataDemanda: '',
        });
      }

      persistirDemandas(novasDemandas);
      return novasDemandas;
    });
  };

  // Trata o evento onPaste (Ctrl+V) manual na caixa de texto
  const handlePasteInTextarea = (id: string, e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textoColado = e.clipboardData.getData('text');
    if (textoColado && textoColado.trim()) {
      const dataGerada = getFormattedCurrentDate();
      handleAtualizarDemanda(id, textoColado, dataGerada);
      
      const wpp = extrairNumerosWhatsApp(textoColado);
      if (wpp.length > 0) {
        setFeedback(`✓ Demanda registrada! ${wpp.length} número(s) de WhatsApp detectado(s) com botão de acesso direto.`);
      } else {
        setFeedback('✓ Demanda colada e data registrada com sucesso!');
      }
      setTimeout(() => setFeedback(null), 4500);
    }
  };

  // Botão "Postar Demanda" logo após a caixa de texto: cola diretamente na caixa existente sem abrir modals
  const handlePostarDemanda = async (targetId: string) => {
    const textarea = textareaRefs.current[targetId];
    if (textarea) {
      textarea.focus();
    }

    let textoClipboard = '';

    // 1. Tenta ler diretamente a área de transferência usando a Clipboard API do navegador
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        textoClipboard = await navigator.clipboard.readText();
      }
    } catch (err) {
      console.warn('Leitura direta via navigator.clipboard:', err);
    }

    // 2. Se obteve texto da área de transferência, preenche diretamente a caixa existente
    if (textoClipboard && textoClipboard.trim()) {
      const dataGerada = getFormattedCurrentDate();
      handleAtualizarDemanda(targetId, textoClipboard.trim(), dataGerada);
      if (textarea) {
        textarea.value = textoClipboard.trim();
        textarea.focus();
      }
      
      const wpp = extrairNumerosWhatsApp(textoClipboard);
      if (wpp.length > 0) {
        setFeedback(`✓ Demanda postada! ${wpp.length} número(s) de WhatsApp detectado(s) com botão para abrir a conversa.`);
      } else {
        setFeedback('✓ Conteúdo da área de transferência colado na caixa de texto com sucesso!');
      }
      setTimeout(() => setFeedback(null), 4500);
      return;
    }

    // 3. Caso o navegador restrinja permissão de leitura em segundo plano, foca na caixa existente
    if (textarea) {
      textarea.focus();
    }
    setFeedback('Pressione Ctrl+V diretamente na caixa de texto para colar sua demanda.');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Abrir WhatsApp Web em nova aba com o número
  const handleAbrirWhatsAppWeb = (numeroLimpo: string) => {
    const url = `https://web.whatsapp.com/send?phone=${numeroLimpo}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Limpar texto de uma caixa de demanda específica
  const handleLimparDemanda = (id: string) => {
    handleAtualizarDemanda(id, '');
    const textarea = textareaRefs.current[id];
    if (textarea) {
      textarea.value = '';
      textarea.focus();
    }
    setFeedback('Caixa de texto limpa.');
    setTimeout(() => setFeedback(null), 3000);
  };

  // Excluir ou Limpar uma caixa de demanda
  const handleRemoverDemanda = (id: string) => {
    setDemandas(prev => {
      let filtradas = prev.filter(d => d.id !== id);
      if (filtradas.length === 0 || filtradas[filtradas.length - 1].mensagem.trim() !== '') {
        filtradas.push({
          id: `demanda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          mensagem: '',
          dataDemanda: '',
        });
      }
      persistirDemandas(filtradas);
      return filtradas;
    });
  };

  // Copiar conteúdo da demanda
  const handleCopiarMensagem = (texto: string, id: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Adicionar manualmente uma nova caixa vazia
  const handleAdicionarNovaCaixa = () => {
    setDemandas(prev => {
      const nova: DemandaItemState = {
        id: `demanda_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        mensagem: '',
        dataDemanda: '',
      };
      return [...prev, nova];
    });
  };

  const totalDemandasPostadas = demandas.filter(d => d.mensagem.trim() !== '').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-white relative select-none overflow-y-scroll golden-scrollbar">
      {/* Background Image / Watermark */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none mix-blend-luminosity"
        style={{ backgroundImage: `url(${adminOfficeFullscreenBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/95 pointer-events-none" />
      <HunterWatermark size={380} opacity="opacity-[0.12]" />

      {/* Header da Aba Demanda */}
      <header className="relative z-10 border-b border-amber-500/30 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-[0_4px_25px_rgba(0,0,0,0.5)] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.25)]">
            <ClipboardList className="w-6 h-6 drop-shadow-[0_0_8px_rgba(255,215,0,0.85)]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-white tracking-wide">
                Painel de <span className="text-gold-gradient-bright">Demanda</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-[#FFD700] border border-amber-500/40 uppercase tracking-wider">
                Módulo Oficial
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Cole sua demanda. Telefones e WhatsApp são detectados automaticamente com botões diretos para abrir a conversa no WhatsApp Web.
            </p>
          </div>
        </div>

        {/* Contador de Quantidade de Demandas e Configuração da Senha de 6 Dígitos no Cabeçalho */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Contador de Demandas */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-amber-500/40 text-xs shadow-[0_0_15px_rgba(255,215,0,0.15)]">
            <Layers className="w-4 h-4 text-[#FFD700]" />
            <span className="text-zinc-300 font-semibold">Demandas:</span>
            <span className="text-[#FFD700] font-extrabold font-mono text-sm">{totalDemandasPostadas}</span>
          </div>

          {/* Caixa de Configuração para Senha de 6 Dígitos de Acesso Direto à Demanda */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/95 border-2 border-amber-500/70 shadow-[0_0_18px_rgba(255,215,0,0.25)]">
            <div className="flex items-center gap-1.5 text-xs text-[#FFD700] font-extrabold">
              <KeyRound className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
              <span className="whitespace-nowrap text-[#FFD700]">Senha Demanda:</span>
            </div>
            
            <div className="relative flex items-center">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-lpignore="true"
                data-form-type="other"
                name="hunter_demanda_access_pin"
                maxLength={6}
                value={showDemandaSenha ? demandaSenha : (demandaSenha ? '•'.repeat(demandaSenha.length) : '')}
                onFocus={() => setShowDemandaSenha(true)}
                onChange={(e) => handleSalvarSenhaDemanda(e.target.value)}
                placeholder="607080"
                className="w-24 px-2 py-1 text-center font-mono font-black text-sm text-[#FFD700] bg-black border border-amber-500/60 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40 tracking-widest shadow-inner placeholder-zinc-600"
                title="Senha de 6 dígitos para acesso direto à Demanda pelo Acesso Restrito"
              />
              <button
                type="button"
                onClick={() => setShowDemandaSenha(!showDemandaSenha)}
                className="ml-1.5 text-zinc-400 hover:text-[#FFD700] p-1 cursor-pointer transition-colors"
                title={showDemandaSenha ? 'Ocultar Dígitos' : 'Ver Dígitos'}
              >
                {showDemandaSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {senhaSavedAlert && (
              <span className="text-[10px] font-extrabold text-[#FFD700] bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/60 animate-fadeIn">
                Salva!
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Feedback Banner */}
      {feedback && (
        <div className="relative z-10 mx-6 mt-4 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Conteúdo Principal: Lista Dinâmica de Caixas de Demanda */}
      <div className="relative z-10 flex-1 p-6 flex flex-col max-w-6xl w-full mx-auto gap-6 pb-16">
        
        {demandas.map((demanda, index) => {
          const isPreenchida = demanda.mensagem.trim() !== '';
          const numeroDemanda = index + 1;
          const whatsAppsDetectados = extrairNumerosWhatsApp(demanda.mensagem);

          return (
            <div
              key={demanda.id}
              className={`flex flex-col bg-zinc-950/90 border rounded-2xl p-5 shadow-[0_0_30px_rgba(212,175,55,0.12)] transition-all ${
                isPreenchida 
                  ? 'border-amber-500/50 shadow-[0_0_25px_rgba(212,175,55,0.15)]' 
                  : 'border-amber-500/30 border-dashed hover:border-amber-400/60'
              }`}
            >
              {/* Cabeçalho da Caixa de Demanda: Número & Data da Demanda */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 mb-3 border-b border-zinc-800/90">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-[#FFD700] text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                    <FileText className="w-3.5 h-3.5" />
                    Demanda #{numeroDemanda}
                  </span>

                  {/* Bloco de Data da Demanda */}
                  <div className="flex items-center gap-2">
                    {demanda.dataDemanda ? (
                      <span className="text-xs font-extrabold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-400/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,215,0,0.25)]">
                        <Clock className="w-3.5 h-3.5 text-[#FFD700]" />
                        Data da Demanda: {demanda.dataDemanda}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500 italic flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                        (A data da demanda será capturada automaticamente ao colar)
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas do Cabeçalho da Caixa com FONTE DOURADA */}
                <div className="flex items-center gap-2">
                  {isPreenchida && (
                    <button
                      type="button"
                      onClick={() => handleCopiarMensagem(demanda.mensagem, demanda.id)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-[#FFD700] hover:bg-amber-500/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.15)]"
                      title="Copiar texto da demanda"
                    >
                      {copiedId === demanda.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#FFD700]" />
                          <span className="text-[#FFD700]">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#FFD700]" />
                          <span className="text-[#FFD700]">Copiar</span>
                        </>
                      )}
                    </button>
                  )}

                  {(isPreenchida || demandas.length > 1) && (
                    <button
                      type="button"
                      onClick={() => handleRemoverDemanda(demanda.id)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-[#FFD700] hover:bg-amber-500/20 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,215,0,0.15)]"
                      title="Limpar/Remover esta caixa"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span className="text-[#FFD700]">{isPreenchida ? 'Excluir' : 'Remover'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* BARRA DE NÚMEROS DE WHATSAPP DETECTADOS NO TEXTO */}
              {whatsAppsDetectados.length > 0 && (
                <div className="mb-3 p-3.5 rounded-xl bg-zinc-950 border-2 border-amber-500/60 shadow-[0_0_20px_rgba(255,215,0,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-[#FFD700] shrink-0 shadow-[0_0_10px_rgba(255,215,0,0.25)]">
                      <MessageCircle className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]" />
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold text-[#FFD700] uppercase tracking-wider flex items-center gap-1.5">
                        WhatsApp Detectado no Texto
                      </div>
                      <div className="text-xs text-zinc-300 font-mono font-semibold">
                        {whatsAppsDetectados.map(w => w.numeroFormatado).join('  |  ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {whatsAppsDetectados.map((wpp, wIdx) => (
                      <button
                        key={`${demanda.id}_wpp_${wIdx}`}
                        type="button"
                        onClick={() => handleAbrirWhatsAppWeb(wpp.numeroLimpo)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border-2 border-amber-400/90 text-[#FFD700] font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_18px_rgba(255,215,0,0.35)] hover:shadow-[0_0_25px_rgba(255,215,0,0.65)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                        title={`Abrir WhatsApp Web com ${wpp.numeroFormatado}`}
                      >
                        <MessageCircle className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                        <span className="text-[#FFD700] font-extrabold tracking-wide drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]">
                          Abrir WhatsApp Web
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#FFD700]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Caixa de Texto da Demanda */}
              <div className="flex-1 flex flex-col">
                <textarea
                  ref={(el) => {
                    textareaRefs.current[demanda.id] = el;
                  }}
                  value={demanda.mensagem}
                  onChange={(e) => handleAtualizarDemanda(demanda.id, e.target.value)}
                  onPaste={(e) => handlePasteInTextarea(demanda.id, e)}
                  placeholder={
                    isPreenchida
                      ? 'Mensagem da demanda...'
                      : `Cole aqui a Demanda #${numeroDemanda} (clique no botão "Postar Demanda" logo abaixo ou use Ctrl+V)...`
                  }
                  className="w-full min-h-[180px] p-4 rounded-xl bg-black/90 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 text-sm leading-relaxed resize-y font-sans golden-scrollbar shadow-inner"
                />
              </div>

              {/* Barra Inferior com o Botão POSTAR DEMANDA Funcional e Botão de WhatsApp Rápido se houver */}
              <div className="flex items-center justify-between flex-wrap gap-3 mt-3 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 font-mono">
                    {demanda.mensagem.length} caracteres
                  </span>
                  {isPreenchida && (
                    <span className="text-[11px] text-amber-400/80 flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-[#FFD700]" /> Salva no sistema
                    </span>
                  )}
                  {whatsAppsDetectados.length > 0 && (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 font-semibold">
                      <Phone className="w-3 h-3 text-[#FFD700]" /> {whatsAppsDetectados.length} contato(s) identificado(s)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Botões individuais de WhatsApp direto na barra inferior se houver múltiplos */}
                  {whatsAppsDetectados.map((wpp, wIdx) => (
                    <button
                      key={`btn_footer_${demanda.id}_${wIdx}`}
                      type="button"
                      onClick={() => handleAbrirWhatsAppWeb(wpp.numeroLimpo)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-amber-500/50 text-[#FFD700] hover:bg-amber-500/20 text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,215,0,0.2)] transition-all cursor-pointer"
                      title={`Conversar com ${wpp.numeroFormatado} no WhatsApp Web`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span className="text-[#FFD700]">WhatsApp {whatsAppsDetectados.length > 1 ? `(${wIdx + 1})` : ''}</span>
                      <ExternalLink className="w-3 h-3 text-[#FFD700]" />
                    </button>
                  ))}

                  {isPreenchida && (
                    <button
                      type="button"
                      onClick={() => handleLimparDemanda(demanda.id)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-[#FFD700] hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Limpar texto desta caixa"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span className="text-[#FFD700]">Limpar</span>
                    </button>
                  )}

                  {/* Botão POSTAR DEMANDA que cola a área de transferência DIRETAMENTE nesta caixa existente */}
                  <button
                    type="button"
                    onClick={() => handlePostarDemanda(demanda.id)}
                    className="px-5 py-2.5 rounded-xl bg-zinc-950 border-2 border-amber-400/90 text-[#FFD700] hover:text-amber-200 hover:bg-amber-500/20 text-xs font-extrabold flex items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.35)] hover:shadow-[0_0_30px_rgba(255,215,0,0.65)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                    title="Colar mensagem da área de transferência diretamente nesta caixa de texto"
                  >
                    <SendHorizontal className="w-4 h-4 text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.85)]" />
                    <span className="text-[#FFD700] font-extrabold tracking-wide drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]">
                      Postar Demanda
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Botão para adicionar manualmente mais uma caixa de demanda */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleAdicionarNovaCaixa}
            className="px-6 py-3 rounded-2xl bg-zinc-950/80 border border-amber-500/40 text-[#FFD700] hover:bg-amber-500/15 hover:border-amber-400 text-xs font-extrabold flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#FFD700]" />
            Adicionar Outra Caixa de Demanda
          </button>
        </div>

        {/* Rodapé informativo */}
        <div className="py-4 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
          <span>Sistema Hunter Desktop</span>
          <span>•</span>
          <span className="text-amber-400/80 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FFD700]" /> Detecção inteligente de WhatsApp e sincronização de demandas em tempo real
          </span>
        </div>
      </div>
    </div>
  );
};
