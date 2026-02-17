import { useState } from 'react';
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

function App() {
  const [currentModule, setCurrentModule] = useState<ModuleType>('dashboard');
  const {
    data,
    isLoaded,
    addIngrediente,
    updateIngrediente,
    deleteIngrediente,
    addFichaTecnica,
    updateFichaTecnica,
    deleteFichaTecnica,
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
    updateConfiguracoes,
    addCategoriaConta,
    deleteCategoriaConta,
    addCategoriaProduto,
    deleteCategoriaProduto,
  } = useStorage();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <p className="text-gray-600">Carregando DoceGestão...</p>
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
    switch (currentModule) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'caixa':
        return (
          <CaixaDiario
            data={data}
            onAddTransacao={handleAddTransacao}
            onDeleteTransacao={deleteTransacao}
          />
        );
      case 'contas':
        return (
          <ContasPagar
            data={data}
            onAddConta={addContaPagar}
            onUpdateConta={updateContaPagar}
            onDeleteConta={deleteContaPagar}
          />
        );
      case 'resultado':
        return <ResultadoMensal data={data} />;
      case 'metas':
        return (
          <Metas
            data={data}
            onAddMeta={handleAddMeta}
            onUpdateMeta={handleUpdateMeta}
            onDeleteMeta={deleteMeta}
          />
        );
      case 'ingredientes':
        return (
          <Ingredientes
            data={data}
            onAddIngrediente={addIngrediente}
            onUpdateIngrediente={updateIngrediente}
            onDeleteIngrediente={deleteIngrediente}
          />
        );
      case 'fichatecnica':
        return (
          <FichaTecnicaSection
            data={data}
            onAddFicha={addFichaTecnica}
            onUpdateFicha={updateFichaTecnica}
            onDeleteFicha={deleteFichaTecnica}
          />
        );
      case 'producao':
        return (
          <ProducaoSection
            data={data}
            onAddProducao={handleAddProducao}
            onDeleteProducao={deleteProducao}
          />
        );
      case 'precificacao':
        return (
          <Precificacao
            data={data}
            onUpdateFicha={updateFichaTecnica}
          />
        );
      case 'relatorios':
        return <Relatorios data={data} />;
      case 'configuracoes':
        return (
          <ConfiguracoesSection
            data={data}
            onUpdateConfig={updateConfiguracoes}
            onAddCategoriaConta={addCategoriaConta}
            onDeleteCategoriaConta={deleteCategoriaConta}
            onAddCategoriaProduto={addCategoriaProduto}
            onDeleteCategoriaProduto={deleteCategoriaProduto}
          />
        );
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <>
      <MainLayout 
        currentModule={currentModule} 
        onModuleChange={setCurrentModule}
        configuracoes={data?.configuracoes}
      >
        {renderModule()}
      </MainLayout>
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
