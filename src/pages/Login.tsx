import { useEffect } from 'react';
import { Chrome, Cake, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface LoginProps {
  onLogin?: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const { signInWithGoogle, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && onLogin) {
      onLogin();
    }
  }, [isAuthenticated, onLogin]);

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Cake className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200">
            <Cake className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DoceGestão</h1>
          <p className="text-gray-600 flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4 text-pink-500" />
            Sistema de Gestão para Docerias
            <Sparkles className="w-4 h-4 text-pink-500" />
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Bem-vindo!</CardTitle>
            <CardDescription>
              Faça login para acessar seu sistema de gestão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
            >
              <Chrome className="w-5 h-5 mr-3 text-blue-500" />
              Entrar com Google
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p>Ao fazer login, você concorda com os termos de uso.</p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white/50 rounded-lg">
            <div className="text-2xl mb-1">📊</div>
            <p className="text-xs text-gray-600">Dashboard</p>
          </div>
          <div className="p-3 bg-white/50 rounded-lg">
            <div className="text-2xl mb-1">💰</div>
            <p className="text-xs text-gray-600">Financeiro</p>
          </div>
          <div className="p-3 bg-white/50 rounded-lg">
            <div className="text-2xl mb-1">📦</div>
            <p className="text-xs text-gray-600">Estoque</p>
          </div>
        </div>
      </div>
    </div>
  );
}
