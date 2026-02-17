import { useState, useEffect, useCallback } from 'react';
import type { SistemaData, Configuracoes, CategoriaConta, CategoriaProduto, TransacaoDiaria } from '@/types';

const STORAGE_KEY = 'docegestao_data_v2';

const defaultConfig: Configuracoes = {
  taxas: {
    pix: 0,
    debito: 1.5,
    credito: 3.5,
  },
  cmvPercentualPadrao: 30,
  margemLucroPadrao: 60,
  custosFixos: [],
  custosVariaveis: [],
};

const defaultCategoriasConta: CategoriaConta[] = [
  { id: '1', nome: 'Aluguel', tipo: 'fixa', cor: '#ef4444' },
  { id: '2', nome: 'Energia', tipo: 'fixa', cor: '#f97316' },
  { id: '3', nome: 'Água', tipo: 'fixa', cor: '#3b82f6' },
  { id: '4', nome: 'Internet', tipo: 'fixa', cor: '#8b5cf6' },
  { id: '5', nome: 'Matéria Prima', tipo: 'variavel', cor: '#22c55e' },
  { id: '6', nome: 'Embalagens', tipo: 'variavel', cor: '#14b8a6' },
  { id: '7', nome: 'Marketing', tipo: 'variavel', cor: '#f59e0b' },
  { id: '8', nome: 'Outros', tipo: 'variavel', cor: '#6b7280' },
];

const defaultCategoriasProduto: CategoriaProduto[] = [
  { id: '1', nome: 'Bolos', margemPadrao: 60, cor: '#f472b6' },
  { id: '2', nome: 'Doces', margemPadrao: 70, cor: '#a78bfa' },
  { id: '3', nome: 'Salgados', margemPadrao: 55, cor: '#fbbf24' },
  { id: '4', nome: 'Bebidas', margemPadrao: 50, cor: '#60a5fa' },
  { id: '5', nome: 'Outros', margemPadrao: 60, cor: '#9ca3af' },
];

const defaultData: SistemaData = {
  ingredientes: [],
  fichasTecnicas: [],
  categoriasProduto: defaultCategoriasProduto,
  producoes: [],
  transacoes: [],
  contasPagar: [],
  categoriasConta: defaultCategoriasConta,
  metas: [],
  configuracoes: defaultConfig,
};

export function useStorage() {
  const [data, setData] = useState<SistemaData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData({ ...defaultData, ...parsed });
      } catch (e) {
        console.error('Erro ao carregar dados:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updateData = useCallback((updates: Partial<SistemaData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const addIngrediente = useCallback((ingrediente: Omit<typeof data.ingredientes[0], 'id' | 'createdAt' | 'updatedAt'>) => {
    const newIngrediente = {
      ...ingrediente,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      ingredientes: [...prev.ingredientes, newIngrediente],
    }));
    return newIngrediente;
  }, []);

  const updateIngrediente = useCallback((id: string, updates: Partial<typeof data.ingredientes[0]>) => {
    setData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.map(i =>
        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
      ),
    }));
  }, []);

  const deleteIngrediente = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter(i => i.id !== id),
    }));
  }, []);

  const addFichaTecnica = useCallback((ficha: Omit<typeof data.fichasTecnicas[0], 'id' | 'createdAt' | 'updatedAt'>) => {
    const newFicha = {
      ...ficha,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      fichasTecnicas: [...prev.fichasTecnicas, newFicha],
    }));
    return newFicha;
  }, []);

  const updateFichaTecnica = useCallback((id: string, updates: Partial<typeof data.fichasTecnicas[0]>) => {
    setData(prev => ({
      ...prev,
      fichasTecnicas: prev.fichasTecnicas.map(f =>
        f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
      ),
    }));
  }, []);

  const deleteFichaTecnica = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      fichasTecnicas: prev.fichasTecnicas.filter(f => f.id !== id),
    }));
  }, []);

  const addProducao = useCallback((producao: Omit<typeof data.producoes[0], 'id' | 'createdAt'>) => {
    const newProducao = {
      ...producao,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      producoes: [...prev.producoes, newProducao],
    }));
    return newProducao;
  }, []);

  const deleteProducao = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      producoes: prev.producoes.filter(p => p.id !== id),
    }));
  }, []);

  const addTransacao = useCallback((transacao: Omit<TransacaoDiaria, 'id' | 'createdAt'>) => {
    const newTransacao = {
      ...transacao,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      transacoes: [...prev.transacoes, newTransacao],
    }));
    return newTransacao;
  }, []);

  const deleteTransacao = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      transacoes: prev.transacoes.filter(t => t.id !== id),
    }));
  }, []);

  const addContaPagar = useCallback((conta: Omit<typeof data.contasPagar[0], 'id' | 'createdAt'>) => {
    const newConta = {
      ...conta,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      contasPagar: [...prev.contasPagar, newConta],
    }));
    return newConta;
  }, []);

  const updateContaPagar = useCallback((id: string, updates: Partial<typeof data.contasPagar[0]>) => {
    setData(prev => ({
      ...prev,
      contasPagar: prev.contasPagar.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const deleteContaPagar = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      contasPagar: prev.contasPagar.filter(c => c.id !== id),
    }));
  }, []);

  const addMeta = useCallback((meta: Omit<typeof data.metas[0], 'id' | 'createdAt'>) => {
    const newMeta = {
      ...meta,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      metas: [...prev.metas, newMeta],
    }));
    return newMeta;
  }, []);

  const updateMeta = useCallback((id: string, updates: Partial<typeof data.metas[0]>) => {
    setData(prev => ({
      ...prev,
      metas: prev.metas.map(m =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  }, []);

  const deleteMeta = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      metas: prev.metas.filter(m => m.id !== id),
    }));
  }, []);

  const updateConfiguracoes = useCallback((config: Partial<Configuracoes>) => {
    setData(prev => ({
      ...prev,
      configuracoes: { ...prev.configuracoes, ...config },
    }));
  }, []);

  const addCategoriaConta = useCallback((categoria: Omit<CategoriaConta, 'id'>) => {
    const newCategoria = {
      ...categoria,
      id: crypto.randomUUID(),
    };
    setData(prev => ({
      ...prev,
      categoriasConta: [...prev.categoriasConta, newCategoria],
    }));
    return newCategoria;
  }, []);

  const updateCategoriaConta = useCallback((id: string, updates: Partial<CategoriaConta>) => {
    setData(prev => ({
      ...prev,
      categoriasConta: prev.categoriasConta.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const deleteCategoriaConta = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      categoriasConta: prev.categoriasConta.filter(c => c.id !== id),
    }));
  }, []);

  const addCategoriaProduto = useCallback((categoria: Omit<CategoriaProduto, 'id'>) => {
    const newCategoria = {
      ...categoria,
      id: crypto.randomUUID(),
    };
    setData(prev => ({
      ...prev,
      categoriasProduto: [...prev.categoriasProduto, newCategoria],
    }));
    return newCategoria;
  }, []);

  const updateCategoriaProduto = useCallback((id: string, updates: Partial<CategoriaProduto>) => {
    setData(prev => ({
      ...prev,
      categoriasProduto: prev.categoriasProduto.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const deleteCategoriaProduto = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      categoriasProduto: prev.categoriasProduto.filter(c => c.id !== id),
    }));
  }, []);

  return {
    data,
    isLoaded,
    updateData,
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
    updateCategoriaConta,
    deleteCategoriaConta,
    addCategoriaProduto,
    updateCategoriaProduto,
    deleteCategoriaProduto,
  };
}
