import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Pegue a URL completa da janela
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Tenta pegar o código tanto do hash (resposta do Google) quanto da query string
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = queryParams.get('code');

        if (accessToken && refreshToken) {
          // Se temos tokens no hash, é uma resposta de sucesso
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) throw error;
          
          // Redireciona para a página principal
          window.location.href = '/';
        } else if (code) {
          // Se temos um código, trocamos por sessão
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) throw error;
          
          window.location.href = '/';
        } else {
          throw new Error('Nenhum código ou token de autenticação encontrado');
        }
      } catch (err: any) {
        console.error('Erro no callback:', err);
        setError(err.message);
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    };

    handleAuthCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro: {error}</p>
          <p className="text-gray-600 mt-2">Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
    </div>
  );
}
