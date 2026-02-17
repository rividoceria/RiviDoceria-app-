import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se o Supabase não estiver configurado, não tentar carregar sessão
    if (!isSupabaseConfigured) {
      console.log('[Auth] Supabase não configurado, pulando verificação de sessão');
      setLoading(false);
      return;
    }

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[Auth] Erro ao obter sessão:', error);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('[Auth] Erro inesperado:', err);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.error('[Auth] Supabase não configurado');
      return { 
        data: null, 
        error: new Error('Configure as credenciais do Supabase primeiro') 
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
      console.error('[Auth] Erro no login:', err);
      return { data: null, error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      return { error };
    } catch (err) {
      console.error('[Auth] Erro no logout:', err);
      return { error: err as Error };
    }
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}
