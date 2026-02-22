import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MainLayout, type ModuleType } from '@/components/layout/MainLayout';
import { Dashboard } from '@/sections/Dashboard';
import { CaixaDiario } from '@/sections/CaixaDiario';
import { ContasPagar } from '@/sections/ContasPagar';
import { ResultadoMensal } from '@/sections/ResultadoMensal';
import { Metas } from '@/sections/Metas';
import { Ingredientes } from '@/sections/Ingredientes';
import { FichaTecnicaSection } from '@/sections/FichaTecnica';
import { ProducaoSection } from '@/sections/Producao';
import { Precificacao } from '@/sections/Precificacao';
import { Relatorios } from '@/sections/Relatorios';
import { ConfiguracoesSection } from '@/sections/Configuracoes';
import { useStorage } from '@/hooks/useStorage';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Auth from '@/sections/Auth';
import AuthCallback from '@/sections/AuthCallback';
import ResetPassword from '@/sections/ResetPassword';
import { Button } from '@/components/ui/button';

// ========== ERROR BOUNDARY COMPONENT ==========
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ ERRO CAPTURADO PELO ERROR BOUNDARY:');
    console.error('Erro:', error);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Ops! Algo deu errado</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 overflow-auto max-h-96">
              <p className="text-red-800 font-mono text-sm whitespace-pre-wrap">
                {this.state.error?.toString()}
              </p>
              <p className="text-red-700 font-mono text-xs mt-2 whitespace-pre-wrap">
                {this.state.error?.stack}
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()} variant="default">
                Recarregar Página
              </Button>
              <Button onClick={() => this.setState({ hasError: false, error: null })} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ========== COMPONENTES DE ROTA ==========
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando DoceGestão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ========== COMPONENTE PRINCIPAL ==========
function MainApp() {
  const [currentModule, setCurrentModule] = useState<ModuleType>('dashboard');
  const { signOut } = useAuth();
  const {
    data,
    isLoaded,
    addIngrediente,
    updateIngrediente,
    deleteIngrediente,
    updateFichaTecnica,
    addProducao,
    deleteProducao,
    addTransacao,
    deleteTransacao,
    addContaPagar,
    updateContaPagar,
    deleteContaPagar,
    addMeta,
    updateMeta,
    deleteMeta,
  } = useStorage();

  // LOGS PARA DEBUG
  console.log('=== MAINAPP RENDER ===');
  console.log('isLoaded:', isLoaded);
  console.log('data:', data);
  console.log('categoriasProduto:', data?.categoriasProduto);
  console.log('fichasTecnicas:', data?.fichasTecnicas);
  console.log('produtos finais:', data?.fichasTecnicas?.filter((f: any) => f?.tipo === 'produto_final'));

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando DoceGestão...</p>
        </div>
      </div>
    );
  }

  const handleAddTransacao = (transacao: Parameters<typeof addTransacao>[0]) => {
    addTransacao(transacao);
    const tipo = transacao.tipo === 'receita' ? 'Receita' : 'Despesa';
    toast.success(`${tipo} registrada com sucesso!`);
  };

  const handleAddProducao = (producao: Parameters<typeof addProducao>[0]) => {
    addProducao(producao);
    toast.success('Produção registrada com sucesso!');
  };

  const handleAddMeta = (meta: Parameters<typeof addMeta>[0]) => {
    addMeta(meta);
    toast.success('Meta criada com sucesso!');
  };

  const handleUpdateMeta = (id: string, updates: Parameters<typeof updateMeta>[1]) => {
    updateMeta(id, updates);
    if (updates.valorAcumulado !== undefined) {
      toast.success('Valor adicionado à meta!');
    }
  };

  const renderModule = () => {
    console.log('Renderizando módulo:', currentModule);
    
    try {
      switch (currentModule) {
        case 'dashboard':
          return (
            <ErrorBoundary key="dashboard">
              <Dashboard data={data} />
            </ErrorBoundary>
          );
        case 'caixa':
          return (
            <ErrorBoundary key="caixa">
              <CaixaDiario
                data={data}
                onAddTransacao={handleAddTransacao}
                onDeleteTransacao={deleteTransacao}
              />
            </ErrorBoundary>
          );
        case 'contas':
          return (
            <ErrorBoundary key="contas">
              <ContasPagar
                data={data}
                onAddConta={addContaPagar}
                onUpdateConta={updateContaPagar}
                onDeleteConta={deleteContaPagar}
              />
            </ErrorBoundary>
          );
        case 'resultado':
          return (
            <ErrorBoundary key="resultado">
              <ResultadoMensal data={data} />
            </ErrorBoundary>
          );
        case 'metas':
          return (
            <ErrorBoundary key="metas">
              <Metas
                data={data}
                onAddMeta={handleAddMeta}
                onUpdateMeta={handleUpdateMeta}
                onDeleteMeta={deleteMeta}
              />
            </ErrorBoundary>
          );
        case 'ingredientes':
          return (
            <ErrorBoundary key="ingredientes">
              <Ingredientes
                data={data}
                onAddIngrediente={addIngrediente}
                onUpdateIngrediente={updateIngrediente}
                onDeleteIngrediente={deleteIngrediente}
              />
            </ErrorBoundary>
          );
        case 'fichatecnica':
          return (
            <ErrorBoundary key="fichatecnica">
              <FichaTecnicaSection
                data={data}
              />
            </ErrorBoundary>
          );
        case 'producao':
          return (
            <ErrorBoundary key="producao">
              <ProducaoSection
                data={data}
                onAddProducao={handleAddProducao}
                onDeleteProducao={deleteProducao}
              />
            </ErrorBoundary>
          );
        case 'precificacao':
          return (
            <ErrorBoundary key="precificacao">
              <Precificacao
                data={data}
                onUpdateFicha={updateFichaTecnica}
              />
            </ErrorBoundary>
          );
        case 'relatorios':
          return (
            <ErrorBoundary key="relatorios">
              <Relatorios data={data} />
            </ErrorBoundary>
          );
        case 'configuracoes':
          return (
            <ErrorBoundary key="configuracoes">
              <ConfiguracoesSection
                data={data}
              />
            </ErrorBoundary>
          );
        default:
          return (
            <ErrorBoundary key="dashboard-default">
              <Dashboard data={data} />
            </ErrorBoundary>
          );
      }
    } catch (error) {
      console.error('Erro no renderModule:', error);
      return (
        <div className="p-8 text-center">
          <h3 className="text-xl font-bold text-red-600 mb-2">Erro ao carregar módulo</h3>
          <pre className="text-left bg-gray-100 p-4 rounded overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      );
    }
  };

  return (
    <>
      <MainLayout 
        currentModule={currentModule} 
        onModuleChange={setCurrentModule}
        configuracoes={data?.configuracoes}
        onLogout={signOut}
      >
        {renderModule()}
      </MainLayout>
      <Toaster position="top-right" richColors />
    </>
  );
}

// ========== APP PRINCIPAL ==========
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Auth />
                </PublicRoute>
              } 
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            
            {/* Rota principal protegida */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <MainApp />
                </ProtectedRoute>
              } 
            />
            
            {/* Redireciona rotas desconhecidas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
