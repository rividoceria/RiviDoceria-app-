import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  SistemaData, 
  Configuracoes, 
  CategoriaConta, 
  CategoriaProduto, 
  TransacaoDiaria,
  Ingrediente,
  FichaTecnica,
  Producao,
  ContaPagar,
  Meta
} from '@/types';
import { toast } from 'sonner';

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

// ========== UNIDADES DE MEDIDA PERMITIDAS ==========
// Deve corresponder exatamente às definidas no banco de dados
const UNIDADES_PERMITIDAS = [
  'kg',  // Quilograma
  'g',   // Grama
  'L',   // Litro
  'ml',  // Mililitro
  'un',  // Unidade
  'cm',  // Centímetro
  'm'    // Metro
];

export function useStorage() {
  const { user } = useAuth();
  const [data, setData] = useState<SistemaData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);

  // ========== CARREGAR DADOS DO SUPABASE ==========
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setIsLoaded(true);
        return;
      }

      try {
        const [
          categoriasProduto,
          categoriasConta,
          custosFixos,
          custosVariaveis,
          ingredientes,
          fichasTecnicas,
          producoes,
          transacoes,
          contasPagar,
          metas,
          configuracoes
        ] = await Promise.all([
          supabase.from('categorias_produtos').select('*').eq('user_id', user.id),
          supabase.from('categorias_contas').select('*').eq('user_id', user.id),
          supabase.from('custos_fixos').select('*').eq('user_id', user.id),
          supabase.from('custos_variaveis').select('*').eq('user_id', user.id),
          supabase.from('ingredientes').select('*').eq('user_id', user.id),
          supabase.from('fichas_tecnicas').select('*').eq('user_id', user.id),
          supabase.from('producoes').select('*').eq('user_id', user.id),
          supabase.from('transacoes').select('*').eq('user_id', user.id),
          supabase.from('contas_pagar').select('*').eq('user_id', user.id),
          supabase.from('metas').select('*').eq('user_id', user.id),
          supabase.from('configuracoes').select('*').eq('user_id', user.id).maybeSingle()
        ]);

        let itensFicha: any[] = [];
        if (fichasTecnicas.data && fichasTecnicas.data.length > 0) {
          const fichaIds = fichasTecnicas.data.map(f => f.id);
          const itensResult = await supabase
            .from('itens_ficha')
            .select('*')
            .in('ficha_id', fichaIds);
          itensFicha = itensResult.data || [];
        }

        let receitasBase: any[] = [];
        if (fichasTecnicas.data && fichasTecnicas.data.length > 0) {
          const fichaIds = fichasTecnicas.data.map(f => f.id);
          const receitasResult = await supabase
            .from('receitas_base_ficha')
            .select('*')
            .in('ficha_produto_id', fichaIds);
          receitasBase = receitasResult.data || [];
        }

        console.log('📊 [LOAD] Ingredientes do Supabase:', ingredientes.data);

        // Montar os dados no formato esperado pelo app
        const loadedData: SistemaData = {
          // Ingredientes - calcular precoEmbalagem
          ingredientes: (ingredientes.data || []).map((item: any) => {
            const precoEmbalagemCalculado = item.custo_unidade * item.quantidade_embalagem;
            return {
              id: item.id,
              nome: item.nome,
              quantidadeEmbalagem: item.quantidade_embalagem,
              unidade: item.unidade,
              precoEmbalagem: precoEmbalagemCalculado,
              custoUnidade: item.custo_unidade,
              estoqueAtual: item.quantidade_estoque,
              estoqueMinimo: item.estoque_minimo,
              tipo: item.tipo,
              createdAt: item.created_at,
              updatedAt: item.created_at,
            };
          }),
          
          fichasTecnicas: (fichasTecnicas.data || []).map((ficha: any) => ({
            ...ficha,
            itens: itensFicha.filter(item => item.ficha_id === ficha.id && item.tipo === 'ingrediente'),
            itensEmbalagem: itensFicha.filter(item => item.ficha_id === ficha.id && item.tipo === 'embalagem'),
            receitasBaseIds: receitasBase
              .filter(r => r.ficha_produto_id === ficha.id)
              .map(r => r.receita_base_id)
          })),
          
          categoriasProduto: (categoriasProduto.data || []).map((item: any) => ({
            id: item.id,
            nome: item.nome,
            margemPadrao: item.margem_padrao,
            cor: item.cor,
          })),
          
          categoriasConta: (categoriasConta.data || []).map((item: any) => ({
            id: item.id,
            nome: item.nome,
            tipo: item.tipo,
            limiteGasto: item.limite_gasto,
            cor: item.cor,
          })),
          
          producoes: producoes.data || [],
          transacoes: transacoes.data || [],
          contasPagar: contasPagar.data || [],
          metas: metas.data || [],
          configuracoes: configuracoes.data ? {
            ...defaultConfig,
            ...configuracoes.data,
            custosFixos: custosFixos.data || [],
            custosVariaveis: custosVariaveis.data || [],
          } : defaultConfig,
        };

        console.log('📊 [LOAD] Ingredientes carregados:', loadedData.ingredientes);
        setData(loadedData);
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();
  }, [user]);

  // ========== INGREDIENTES (CORRIGIDO COM TODAS AS UNIDADES) ==========
  const addIngrediente = useCallback(async (ingrediente: Omit<Ingrediente, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('Usuário não logado');
      return;
    }

    console.log('📝 Adicionando ingrediente:', ingrediente);

    // Validar unidade (agora inclui cm e m)
    if (!UNIDADES_PERMITIDAS.includes(ingrediente.unidade)) {
      toast.error(`Unidade inválida: ${ingrediente.unidade}. Use: kg, g, L, ml, un, cm, m`);
      return;
    }

    // Validar quantidade
    if (ingrediente.quantidadeEmbalagem <= 0) {
      toast.error('Quantidade da embalagem deve ser maior que zero');
      return;
    }

    // Calcular custo_unidade a partir do precoEmbalagem e quantidadeEmbalagem
    const custoUnidadeCalculado = ingrediente.precoEmbalagem / ingrediente.quantidadeEmbalagem;

    const newIngrediente = {
      user_id: user.id,
      nome: ingrediente.nome,
      tipo: ingrediente.tipo,
      unidade: ingrediente.unidade,
      custo_unidade: custoUnidadeCalculado,
      quantidade_embalagem: ingrediente.quantidadeEmbalagem,
      estoque_minimo: ingrediente.estoqueMinimo,
      quantidade_estoque: ingrediente.estoqueAtual,
      created_at: new Date().toISOString(),
    };

    console.log('📤 Enviando para Supabase:', newIngrediente);

    const { data: result, error } = await supabase
      .from('ingredientes')
      .insert([newIngrediente])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro no Supabase:', error);
      
      if (error.message.includes('ingredientes_unidade_check')) {
        toast.error('Unidade inválida. Use: kg, g, L, ml, un, cm, m');
      } else {
        toast.error('Erro ao adicionar ingrediente: ' + error.message);
      }
      return;
    }

    console.log('✅ Ingrediente adicionado no Supabase:', result);

    // Calcular precoEmbalagem a partir do resultado
    const precoEmbalagemCalculado = result.custo_unidade * result.quantidade_embalagem;

    const novoIngrediente: Ingrediente = {
      id: result.id,
      nome: result.nome,
      quantidadeEmbalagem: result.quantidade_embalagem,
      unidade: result.unidade,
      precoEmbalagem: precoEmbalagemCalculado,
      custoUnidade: result.custo_unidade,
      estoqueAtual: result.quantidade_estoque,
      estoqueMinimo: result.estoque_minimo,
      tipo: result.tipo,
      createdAt: result.created_at,
      updatedAt: result.created_at,
    };

    setData(prev => ({
      ...prev,
      ingredientes: [...prev.ingredientes, novoIngrediente],
    }));

    toast.success('Ingrediente adicionado com sucesso!');
    return novoIngrediente;
  }, [user]);

  const updateIngrediente = useCallback(async (id: string, updates: Partial<Ingrediente>) => {
    if (!user) return;

    console.log('📝 Atualizando ingrediente:', id, updates);

    // Validar unidade se estiver sendo atualizada
    if (updates.unidade && !UNIDADES_PERMITIDAS.includes(updates.unidade)) {
      toast.error(`Unidade inválida: ${updates.unidade}. Use: kg, g, L, ml, un, cm, m`);
      return;
    }

    const dbUpdates: any = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
    if (updates.unidade !== undefined) dbUpdates.unidade = updates.unidade;
    if (updates.quantidadeEmbalagem !== undefined) dbUpdates.quantidade_embalagem = updates.quantidadeEmbalagem;
    if (updates.estoqueMinimo !== undefined) dbUpdates.estoque_minimo = updates.estoqueMinimo;
    if (updates.estoqueAtual !== undefined) dbUpdates.quantidade_estoque = updates.estoqueAtual;
    
    // Lógica para atualizar custo_unidade baseado em precoEmbalagem
    if (updates.precoEmbalagem !== undefined) {
      const ingredienteAtual = data.ingredientes.find(i => i.id === id);
      if (ingredienteAtual) {
        const quantidade = updates.quantidadeEmbalagem ?? ingredienteAtual.quantidadeEmbalagem;
        if (quantidade > 0) {
          dbUpdates.custo_unidade = updates.precoEmbalagem / quantidade;
        }
      }
    } else if (updates.custoUnidade !== undefined) {
      dbUpdates.custo_unidade = updates.custoUnidade;
    }

    const { data: result, error } = await supabase
      .from('ingredientes')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ingrediente:', error);
      
      if (error.message.includes('ingredientes_unidade_check')) {
        toast.error('Unidade inválida. Use: kg, g, L, ml, un, cm, m');
      } else {
        toast.error('Erro ao atualizar ingrediente: ' + error.message);
      }
      return;
    }

    const precoEmbalagemCalculado = result.custo_unidade * result.quantidade_embalagem;

    const ingredienteAtualizado: Ingrediente = {
      id: result.id,
      nome: result.nome,
      quantidadeEmbalagem: result.quantidade_embalagem,
      unidade: result.unidade,
      precoEmbalagem: precoEmbalagemCalculado,
      custoUnidade: result.custo_unidade,
      estoqueAtual: result.quantidade_estoque,
      estoqueMinimo: result.estoque_minimo,
      tipo: result.tipo,
      createdAt: result.created_at,
      updatedAt: result.created_at,
    };

    setData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.map(i => i.id === id ? ingredienteAtualizado : i),
    }));

    toast.success('Ingrediente atualizado!');
  }, [user, data.ingredientes]);

  const deleteIngrediente = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('ingredientes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar ingrediente:', error);
      toast.error('Erro ao deletar ingrediente');
      return;
    }

    setData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter(i => i.id !== id),
    }));

    toast.success('Ingrediente deletado!');
  }, [user]);

  // ========== FICHAS TÉCNICAS ==========
  const addFichaTecnica = useCallback(async (ficha: Omit<FichaTecnica, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const { data: novaFicha, error: fichaError } = await supabase
      .from('fichas_tecnicas')
      .insert([{
        ...ficha,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (fichaError) {
      console.error('Erro ao adicionar ficha técnica:', fichaError);
      toast.error('Erro ao adicionar ficha técnica');
      return;
    }

    const itens = [
      ...(ficha.itens || []).map(item => ({ ...item, tipo: 'ingrediente' })),
      ...(ficha.itensEmbalagem || []).map(item => ({ ...item, tipo: 'embalagem' }))
    ];

    if (itens.length > 0) {
      const { error: itensError } = await supabase
        .from('itens_ficha')
        .insert(itens.map(item => ({
          ...item,
          ficha_id: novaFicha.id,
        })));

      if (itensError) {
        console.error('Erro ao adicionar itens da ficha:', itensError);
      }
    }

    if (ficha.receitasBaseIds && ficha.receitasBaseIds.length > 0) {
      const { error: receitasError } = await supabase
        .from('receitas_base_ficha')
        .insert(ficha.receitasBaseIds.map(receitaId => ({
          ficha_produto_id: novaFicha.id,
          receita_base_id: receitaId,
        })));

      if (receitasError) {
        console.error('Erro ao adicionar receitas base:', receitasError);
      }
    }

    const fichaCompleta: FichaTecnica = {
      ...novaFicha,
      itens: ficha.itens || [],
      itensEmbalagem: ficha.itensEmbalagem || [],
      receitasBaseIds: ficha.receitasBaseIds || [],
    };

    setData(prev => ({
      ...prev,
      fichasTecnicas: [...prev.fichasTecnicas, fichaCompleta],
    }));

    return fichaCompleta;
  }, [user]);

  const updateFichaTecnica = useCallback(async (id: string, updates: Partial<FichaTecnica>) => {
    if (!user) return;

    const { data: fichaAtualizada, error: fichaError } = await supabase
      .from('fichas_tecnicas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (fichaError) {
      console.error('Erro ao atualizar ficha técnica:', fichaError);
      toast.error('Erro ao atualizar ficha técnica');
      return;
    }

    await supabase.from('itens_ficha').delete().eq('ficha_id', id);
    
    const itens = [
      ...(updates.itens || []).map(item => ({ ...item, tipo: 'ingrediente' })),
      ...(updates.itensEmbalagem || []).map(item => ({ ...item, tipo: 'embalagem' }))
    ];

    if (itens.length > 0) {
      await supabase.from('itens_ficha').insert(
        itens.map(item => ({
          ...item,
          ficha_id: id,
        }))
      );
    }

    await supabase.from('receitas_base_ficha').delete().eq('ficha_produto_id', id);
    
    if (updates.receitasBaseIds && updates.receitasBaseIds.length > 0) {
      await supabase.from('receitas_base_ficha').insert(
        updates.receitasBaseIds.map(receitaId => ({
          ficha_produto_id: id,
          receita_base_id: receitaId,
        }))
      );
    }

    setData(prev => ({
      ...prev,
      fichasTecnicas: prev.fichasTecnicas.map(f => 
        f.id === id ? { ...f, ...updates, ...fichaAtualizada } : f
      ),
    }));
  }, [user]);

  const deleteFichaTecnica = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('fichas_tecnicas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar ficha técnica:', error);
      toast.error('Erro ao deletar ficha técnica');
      return;
    }

    setData(prev => ({
      ...prev,
      fichasTecnicas: prev.fichasTecnicas.filter(f => f.id !== id),
    }));
  }, [user]);

  // ========== PRODUÇÕES ==========
  const addProducao = useCallback(async (producao: Omit<Producao, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { data: result, error } = await supabase
      .from('producoes')
      .insert([{
        ...producao,
        user_id: user.id,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar produção:', error);
      toast.error('Erro ao adicionar produção');
      return;
    }

    setData(prev => ({
      ...prev,
      producoes: [...prev.producoes, result],
    }));

    return result;
  }, [user]);

  const deleteProducao = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('producoes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar produção:', error);
      toast.error('Erro ao deletar produção');
      return;
    }

    setData(prev => ({
      ...prev,
      producoes: prev.producoes.filter(p => p.id !== id),
    }));
  }, [user]);

  // ========== TRANSAÇÕES ==========
  const addTransacao = useCallback(async (transacao: Omit<TransacaoDiaria, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { data: result, error } = await supabase
      .from('transacoes')
      .insert([{
        ...transacao,
        user_id: user.id,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar transação:', error);
      toast.error('Erro ao adicionar transação');
      return;
    }

    setData(prev => ({
      ...prev,
      transacoes: [...prev.transacoes, result],
    }));

    return result;
  }, [user]);

  const deleteTransacao = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('transacoes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar transação:', error);
      toast.error('Erro ao deletar transação');
      return;
    }

    setData(prev => ({
      ...prev,
      transacoes: prev.transacoes.filter(t => t.id !== id),
    }));
  }, [user]);

  // ========== CONTAS A PAGAR ==========
  const addContaPagar = useCallback(async (conta: Omit<ContaPagar, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { data: result, error } = await supabase
      .from('contas_pagar')
      .insert([{
        ...conta,
        user_id: user.id,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar conta:', error);
      toast.error('Erro ao adicionar conta');
      return;
    }

    setData(prev => ({
      ...prev,
      contasPagar: [...prev.contasPagar, result],
    }));

    return result;
  }, [user]);

  const updateContaPagar = useCallback(async (id: string, updates: Partial<ContaPagar>) => {
    if (!user) return;

    const { data: result, error } = await supabase
      .from('contas_pagar')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conta:', error);
      toast.error('Erro ao atualizar conta');
      return;
    }

    setData(prev => ({
      ...prev,
      contasPagar: prev.contasPagar.map(c => c.id === id ? result : c),
    }));
  }, [user]);

  const deleteContaPagar = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('contas_pagar')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar conta:', error);
      toast.error('Erro ao deletar conta');
      return;
    }

    setData(prev => ({
      ...prev,
      contasPagar: prev.contasPagar.filter(c => c.id !== id),
    }));
  }, [user]);

  // ========== METAS ==========
  const addMeta = useCallback(async (meta: Omit<Meta, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { data: result, error } = await supabase
      .from('metas')
      .insert([{
        ...meta,
        user_id: user.id,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar meta:', error);
      toast.error('Erro ao adicionar meta');
      return;
    }

    setData(prev => ({
      ...prev,
      metas: [...prev.metas, result],
    }));

    return result;
  }, [user]);

  const updateMeta = useCallback(async (id: string, updates: Partial<Meta>) => {
    if (!user) return;

    const { data: result, error } = await supabase
      .from('metas')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar meta:', error);
      toast.error('Erro ao atualizar meta');
      return;
    }

    setData(prev => ({
      ...prev,
      metas: prev.metas.map(m => m.id === id ? result : m),
    }));
  }, [user]);

  const deleteMeta = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('metas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar meta:', error);
      toast.error('Erro ao deletar meta');
      return;
    }

    setData(prev => ({
      ...prev,
      metas: prev.metas.filter(m => m.id !== id),
    }));
  }, [user]);

  // ========== CONFIGURAÇÕES ==========
  const updateConfiguracoes = useCallback(async (config: Partial<Configuracoes>) => {
    if (!user) return;

    const { custosFixos, custosVariaveis, ...configRest } = config;

    const { error: configError } = await supabase
      .from('configuracoes')
      .upsert({
        user_id: user.id,
        ...configRest,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (configError) {
      console.error('Erro ao atualizar configurações:', configError);
      toast.error('Erro ao atualizar configurações');
    }

    if (custosFixos) {
      await supabase.from('custos_fixos').delete().eq('user_id', user.id);
      
      if (custosFixos.length > 0) {
        await supabase.from('custos_fixos').insert(
          custosFixos.map(c => ({ ...c, user_id: user.id }))
        );
      }
    }

    if (custosVariaveis) {
      await supabase.from('custos_variaveis').delete().eq('user_id', user.id);
      
      if (custosVariaveis.length > 0) {
        await supabase.from('custos_variaveis').insert(
          custosVariaveis.map(c => ({ ...c, user_id: user.id }))
        );
      }
    }

    setData(prev => ({
      ...prev,
      configuracoes: { ...prev.configuracoes, ...config },
    }));
  }, [user]);

  // ========== CATEGORIAS DE CONTAS ==========
  const addCategoriaConta = useCallback(async (categoria: Omit<CategoriaConta, 'id'>) => {
    if (!user) {
      toast.error('Usuário não logado');
      return;
    }

    const { data: result, error } = await supabase
      .from('categorias_contas')
      .insert([{
        nome: categoria.nome,
        tipo: categoria.tipo,
        limite_gasto: categoria.limiteGasto,
        cor: categoria.cor,
        user_id: user.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro no Supabase:', error);
      toast.error('Erro ao adicionar categoria: ' + error.message);
      return;
    }

    const novaCategoria: CategoriaConta = {
      id: result.id,
      nome: result.nome,
      tipo: result.tipo,
      limiteGasto: result.limite_gasto,
      cor: result.cor,
    };

    setData(prev => ({
      ...prev,
      categoriasConta: [...prev.categoriasConta, novaCategoria],
    }));

    toast.success('Categoria adicionada com sucesso!');
    return novaCategoria;
  }, [user]);

  const updateCategoriaConta = useCallback(async (id: string, updates: Partial<CategoriaConta>) => {
    if (!user) return;

    const dbUpdates: any = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
    if (updates.limiteGasto !== undefined) dbUpdates.limite_gasto = updates.limiteGasto;
    if (updates.cor !== undefined) dbUpdates.cor = updates.cor;

    const { data: result, error } = await supabase
      .from('categorias_contas')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar categoria de conta:', error);
      toast.error('Erro ao atualizar categoria');
      return;
    }

    const categoriaAtualizada: CategoriaConta = {
      id: result.id,
      nome: result.nome,
      tipo: result.tipo,
      limiteGasto: result.limite_gasto,
      cor: result.cor,
    };

    setData(prev => ({
      ...prev,
      categoriasConta: prev.categoriasConta.map(c => c.id === id ? categoriaAtualizada : c),
    }));

    toast.success('Categoria atualizada!');
  }, [user]);

  const deleteCategoriaConta = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('categorias_contas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar categoria de conta:', error);
      toast.error('Erro ao deletar categoria');
      return;
    }

    setData(prev => ({
      ...prev,
      categoriasConta: prev.categoriasConta.filter(c => c.id !== id),
    }));

    toast.success('Categoria deletada!');
  }, [user]);

  // ========== CATEGORIAS DE PRODUTOS ==========
  const addCategoriaProduto = useCallback(async (categoria: Omit<CategoriaProduto, 'id'>) => {
    if (!user) {
      toast.error('Usuário não logado');
      return;
    }

    const { data: result, error } = await supabase
      .from('categorias_produtos')
      .insert([{
        nome: categoria.nome,
        margem_padrao: categoria.margemPadrao,
        cor: categoria.cor,
        user_id: user.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro no Supabase:', error);
      toast.error('Erro ao adicionar categoria: ' + error.message);
      return;
    }

    const novaCategoria: CategoriaProduto = {
      id: result.id,
      nome: result.nome,
      margemPadrao: result.margem_padrao,
      cor: result.cor,
    };

    setData(prev => ({
      ...prev,
      categoriasProduto: [...prev.categoriasProduto, novaCategoria],
    }));

    toast.success('Categoria adicionada com sucesso!');
    return novaCategoria;
  }, [user]);

  const updateCategoriaProduto = useCallback(async (id: string, updates: Partial<CategoriaProduto>) => {
    if (!user) return;

    const dbUpdates: any = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.margemPadrao !== undefined) dbUpdates.margem_padrao = updates.margemPadrao;
    if (updates.cor !== undefined) dbUpdates.cor = updates.cor;

    const { data: result, error } = await supabase
      .from('categorias_produtos')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar categoria de produto:', error);
      toast.error('Erro ao atualizar categoria');
      return;
    }

    const categoriaAtualizada: CategoriaProduto = {
      id: result.id,
      nome: result.nome,
      margemPadrao: result.margem_padrao,
      cor: result.cor,
    };

    setData(prev => ({
      ...prev,
      categoriasProduto: prev.categoriasProduto.map(c => c.id === id ? categoriaAtualizada : c),
    }));

    toast.success('Categoria atualizada!');
  }, [user]);

  const deleteCategoriaProduto = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('categorias_produtos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar categoria de produto:', error);
      toast.error('Erro ao deletar categoria');
      return;
    }

    setData(prev => ({
      ...prev,
      categoriasProduto: prev.categoriasProduto.filter(c => c.id !== id),
    }));

    toast.success('Categoria deletada!');
  }, [user]);

  // Função de updateData mantida para compatibilidade
  const updateData = useCallback((updates: Partial<SistemaData>) => {
    setData(prev => ({ ...prev, ...updates }));
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
