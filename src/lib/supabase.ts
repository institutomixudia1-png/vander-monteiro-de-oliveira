import { createClient } from '@supabase/supabase-js';

// Supabase Configuration from provided project credentials
export const DEFAULT_SUPABASE_URL = 'https://pjgvswrqrbeyvzfppowa.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_aMj8FtyjfXJsgIUl_UHamg_kO95oAd6';

export const STORAGE_SUPABASE_CONFIG_KEY = 'hunter_supabase_config_v1';
export const STORAGE_SUPABASE_AUTOSYNC_KEY = 'hunter_supabase_autosync_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoSync: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(STORAGE_SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
        anonKey: parsed.anonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
        autoSync: parsed.autoSync ?? false,
      };
    }
  } catch (e) {
    console.warn('Erro ao carregar configuração do Supabase:', e);
  }

  return {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
    autoSync: localStorage.getItem(STORAGE_SUPABASE_AUTOSYNC_KEY) === 'true',
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(STORAGE_SUPABASE_CONFIG_KEY, JSON.stringify(config));
  localStorage.setItem(STORAGE_SUPABASE_AUTOSYNC_KEY, config.autoSync ? 'true' : 'false');
}

// Initialize Supabase Client
export function createSupabaseClientInstance(customConfig?: { url: string; anonKey: string }) {
  const config = customConfig || getSupabaseConfig();
  // Ensure clean URL without /rest/v1
  const cleanUrl = config.url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  return createClient(cleanUrl, config.anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

export const supabase = createSupabaseClientInstance();

/**
 * SQL Schema blindado e recomendado para executar no SQL Editor do Supabase (https://supabase.com/dashboard):
 */
export const SUPABASE_SCHEMA_SQL = `-- ============================================================
-- SCRIPT DE BLINDAGEM E POLÍTICAS RLS DO HUNTER DESKTOP
-- Execute este script no menu: SQL Editor > New query > Run
-- ============================================================

-- 1. Criar a tabela principal do HUNTER Desktop com validações
create table if not exists public.hunter_app_data (
  id text primary key check (id in ('main_hunter_database')),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar Row Level Security (RLS)
alter table public.hunter_app_data enable row level security;

-- 3. Limpar políticas antigas e permissões excessivas
drop policy if exists "Permitir acesso total publico para hunter_app_data" on public.hunter_app_data;
drop policy if exists "hunter_full_access_policy" on public.hunter_app_data;
drop policy if exists "hunter_secure_select" on public.hunter_app_data;
drop policy if exists "hunter_secure_insert" on public.hunter_app_data;
drop policy if exists "hunter_secure_update" on public.hunter_app_data;
drop policy if exists "hunter_block_delete" on public.hunter_app_data;

-- 4. POLÍTICA DE LEITURA (SELECT): Permite ler apenas o banco principal
create policy "hunter_secure_select"
on public.hunter_app_data
for select
to anon, authenticated
using (id = 'main_hunter_database');

-- 5. POLÍTICA DE INSERÇÃO (INSERT): Permite inserir apenas o registro oficial
create policy "hunter_secure_insert"
on public.hunter_app_data
for insert
to anon, authenticated
with check (id = 'main_hunter_database');

-- 6. POLÍTICA DE ATUALIZAÇÃO (UPDATE): Permite atualizar apenas o registro oficial
create policy "hunter_secure_update"
on public.hunter_app_data
for update
to anon, authenticated
using (id = 'main_hunter_database')
with check (id = 'main_hunter_database');

-- 7. PROTEÇÃO ANTI-DELEÇÃO: Não permite exclusão direta de dados por roles públicas
-- (Apenas service_role no painel do Supabase pode deletar)

-- 8. Conceder permissões granulares e seguras
revoke delete on table public.hunter_app_data from anon, authenticated;
grant select, insert, update on table public.hunter_app_data to anon, authenticated;
grant all on table public.hunter_app_data to service_role;
`;

/**
 * Testa a conexão com o Supabase
 */
export async function testSupabaseConnection(client = supabase): Promise<{ success: boolean; message: string }> {
  try {
    // Tenta consultar a tabela hunter_app_data ou verificar a API REST
    const { error } = await client.from('hunter_app_data').select('id').limit(1);
    
    if (error) {
      // Se a tabela ainda não existe (42P01), a conexão com o Supabase funcionou mas a tabela precisa ser criada
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation "public.hunter_app_data" does not exist')) {
        return {
          success: true,
          message: 'Conectado ao Supabase com sucesso! (Tabela hunter_app_data pronta para criação automática ou via SQL).',
        };
      }
      // Se for erro de autenticação ou chave
      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('apikey')) {
        return {
          success: false,
          message: `Erro de autenticação no Supabase: ${error.message}`,
        };
      }
      return {
        success: false,
        message: `Aviso do Supabase: ${error.message} (Código: ${error.code || 'N/A'})`,
      };
    }

    return {
      success: true,
      message: 'Conexão estabelecida com sucesso com o banco de dados Supabase!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Falha ao conectar com o Supabase. Verifique a URL e a Anon Key.',
    };
  }
}

/**
 * Coleta todos os dados locais do HUNTER
 */
export function getAllHunterLocalData(): Record<string, any> {
  const backupData: Record<string, any> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('hunter_') || key.startsWith('tce_') || key.startsWith('rescisao_') || key.startsWith('folha_'))) {
      try {
        const val = localStorage.getItem(key);
        if (val) backupData[key] = JSON.parse(val);
      } catch {
        backupData[key] = localStorage.getItem(key);
      }
    }
  }
  return backupData;
}

/**
 * Salva todos os dados locais no Supabase
 */
export async function syncAllToSupabase(client = supabase): Promise<{ success: boolean; message: string; timestamp?: string }> {
  try {
    const localData = getAllHunterLocalData();
    const timestamp = new Date().toISOString();

    const payload = {
      id: 'main_hunter_database',
      data: {
        ...localData,
        _syncedAt: timestamp,
        _system: 'HUNTER Desktop',
      },
      updated_at: timestamp,
    };

    const { error } = await client
      .from('hunter_app_data')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      // Se a tabela não existir, informa o usuário com clareza
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error('A tabela "hunter_app_data" ainda não foi criada no Supabase. Copie o script SQL no painel para criá-la em 1 clique.');
      }
      throw error;
    }

    return {
      success: true,
      message: `Dados sincronizados com o Supabase com sucesso! (${Object.keys(localData).length} blocos de dados salvos na nuvem).`,
      timestamp,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Erro ao sincronizar dados com o Supabase.',
    };
  }
}

/**
 * Baixa e restaura todos os dados do Supabase para o LocalStorage
 */
export async function restoreFromSupabase(client = supabase): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const { data, error } = await client
      .from('hunter_app_data')
      .select('*')
      .eq('id', 'main_hunter_database')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Nenhum dado salvo encontrado no Supabase para este projeto. Faça um upload inicial primeiro.');
      }
      throw error;
    }

    if (!data || !data.data) {
      throw new Error('Formato de dados inválido retornado pelo Supabase.');
    }

    const payloadData = data.data;
    let restoredCount = 0;

    Object.entries(payloadData).forEach(([key, val]) => {
      if (key.startsWith('_')) return; // ignora metadados internos como _syncedAt
      if (typeof val === 'object') {
        localStorage.setItem(key, JSON.stringify(val));
      } else {
        localStorage.setItem(key, String(val));
      }
      restoredCount++;
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hunter_database_restored', { detail: { count: restoredCount } }));
    }

    return {
      success: true,
      message: `Dados baixados e restaurados do Supabase com sucesso! (${restoredCount} blocos atualizados).`,
      count: restoredCount,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Erro ao restaurar dados do Supabase.',
    };
  }
}

/**
 * Hidrata os dados a partir do Supabase no carregamento inicial da aplicação.
 * Garante que alterações feitas na web permaneçam mesmo após deploys ou atualizações do código.
 */
export async function hydrateFromSupabaseOnStartup(client = supabase): Promise<{ hydrated: boolean; count?: number; message?: string }> {
  try {
    const { data, error } = await client
      .from('hunter_app_data')
      .select('*')
      .eq('id', 'main_hunter_database')
      .single();

    if (error) {
      // Se ainda não existir registro no banco na nuvem, faz o primeiro sync
      if (error.code === 'PGRST116') {
        await syncAllToSupabase(client);
        return { hydrated: false, message: 'Banco de dados inicializado na nuvem.' };
      }
      return { hydrated: false, message: error.message };
    }

    if (data && data.data && typeof data.data === 'object') {
      const payloadData = data.data;
      let restoredCount = 0;

      Object.entries(payloadData).forEach(([key, val]) => {
        if (key.startsWith('_')) return;
        if (typeof val === 'object') {
          localStorage.setItem(key, JSON.stringify(val));
        } else {
          localStorage.setItem(key, String(val));
        }
        restoredCount++;
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hunter_database_restored', { detail: { count: restoredCount } }));
      }

      return {
        hydrated: true,
        count: restoredCount,
        message: `${restoredCount} blocos de dados sincronizados da nuvem.`,
      };
    }

    return { hydrated: false };
  } catch (err: any) {
    console.warn('Hidratação inicial da nuvem não pôde ser completada (mantendo dados locais):', err);
    return { hydrated: false, message: err.message };
  }
}

let autoSaveTimeout: any = null;
let isAutoSaving = false;

export type CloudSyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export function notifyCloudSyncStatus(status: CloudSyncStatus, message?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hunter_cloud_sync_state', {
        detail: { status, message, timestamp: new Date().toISOString() },
      })
    );
  }
}

/**
 * Dispara o salvamento automático com debounce de 1.2 segundos
 * Salva na nuvem sempre que algo for modificado no sistema
 */
export function triggerAutoSaveToCloud(delayMs = 1200) {
  if (typeof window === 'undefined') return;

  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  notifyCloudSyncStatus('saving', 'Salvando alterações automaticamente na nuvem...');

  autoSaveTimeout = setTimeout(async () => {
    if (isAutoSaving) return;
    try {
      isAutoSaving = true;
      const res = await syncAllToSupabase();
      if (res.success) {
        notifyCloudSyncStatus('saved', 'Alterações salvas na nuvem com sucesso!');
      } else {
        notifyCloudSyncStatus('error', res.message);
      }
    } catch (err: any) {
      notifyCloudSyncStatus('error', err.message || 'Erro ao sincronizar na nuvem.');
    } finally {
      isAutoSaving = false;
      // Retorna para o estado normal após 3 segundos
      setTimeout(() => {
        notifyCloudSyncStatus('idle');
      }, 3000);
    }
  }, delayMs);
}

