import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verificar se as credenciais estão configuradas
const hasValidConfig = supabaseUrl && 
                       supabaseKey && 
                       supabaseUrl.startsWith('http') && 
                       supabaseKey.length > 10;

if (!hasValidConfig) {
  console.warn('[Supabase] Credenciais não configuradas ou inválidas. O aplicativo funcionará em modo offline.');
}

// Criar cliente apenas se tiver configuração válida
export const supabase = hasValidConfig 
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('http://localhost:54321', 'dummy-key'); // Cliente dummy para evitar erros

// Flag para verificar se o Supabase está configurado
export const isSupabaseConfigured = hasValidConfig;

// Helper para verificar se o usuário está autenticado
export const getCurrentUser = async () => {
  if (!hasValidConfig) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.error('[Supabase] Erro ao obter usuário:', err);
    return null;
  }
};

// Helper para fazer logout
export const signOut = async () => {
  if (!hasValidConfig) return { error: null };
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    console.error('[Supabase] Erro ao fazer logout:', err);
    return { error: err as Error };
  }
};

// Helper para login com Google
export const signInWithGoogle = async () => {
  if (!hasValidConfig) {
    return { 
      data: null, 
      error: new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.') 
    };
  }
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  } catch (err) {
    console.error('[Supabase] Erro no login:', err);
    return { data: null, error: err as Error };
  }
};
