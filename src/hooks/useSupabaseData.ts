import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { 
  Ingrediente, 
  FichaTecnica, 
  Producao, 
  TransacaoDiaria,
  ContaPagar,
  CategoriaConta,
  CategoriaProduto,
  Meta,
  Configuracoes
} from '@/types';

export interface SistemaData {
  ingredientes: Ingrediente[];
  fichasTecnicas: FichaTecnica[];
  categoriasProduto: CategoriaProduto[];
  producoes: Producao[];
  transacoes: TransacaoDiaria[];
  contasPagar: ContaPagar[];
  categoriasConta: CategoriaConta[];
  metas: Meta[];
  configuracoes: Configuracoes;
}

const defaultConfig: Configuracoes = {
  taxas: { pix: 0, debito: 1.5, credito: 3.5 },
  cmvPercentualPadrao: 30,
  margemLucroPadrao: 60,
  custosFixos: [],
  custosVariaveis: [],
};

// Converter do formato Supabase para o formato da aplicação
const convertIngrediente = (item: any): Ingrediente => ({
  id: item.id,
  nome: item.nome,
  quantidadeEmbalagem: item.quantidade_embalagem,
  unidade: item.unidade,
  precoEmbalagem: item.preco_embalagem,
  custoUnidade: item.custo_unidade,
  estoqueAtual: item.estoque_atual,
  estoqueMinimo: item.estoque_minimo,
  tipo: item.tipo,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const convertFichaTecnica = (item: any): FichaTecnica => ({
  id: item.id,
  nome: item.nome,
  tipo: item.tipo,
  categoriaId: item.categoria_id,
  receitaBaseId: item.receita_base_id || undefined,
  itens: item.itens || [],
  itensEmbalagem: item.itens_embalagem || [],
  rendimentoQuantidade: item.rendimento_quantidade,
  rendimentoUnidade: item.rendimento_unidade,
  custoTotal: item.custo_total,
  custoUnidade: item.custo_unidade,
  precoVenda: item.preco_venda,
  margemLucro: item.margem_lucro,
  cmvPercentual: item.cmv_percentual,
  validadeDias: item.validade_dias || undefined,
  descricao: item.descricao || undefined,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const convertProducao = (item: any): Producao => ({
  id: item.id,
  fichaTecnicaId: item.ficha_tecnica_id,
  quantidadeProduzida: item.quantidade_produzida,
  dataProducao: item.data_producao,
  dataValidade: item.data_validade || undefined,
  custoTotal: item.custo_total,
  observacao: item.observacao || undefined,
  createdAt: item.created_at,
});

const convertTransacao = (item: any): TransacaoDiaria => ({
  id: item.id,
  data: item.data,
  tipo: item.tipo,
  descricao: item.descricao,
  valor: item.valor,
  formaPagamento: item.forma_pagamento,
  taxaDescontada: item.taxa_descontada,
  valorLiquido: item.valor_liquido,
  categoriaId: item.categoria_id || undefined,
  createdAt: item.created_at,
});

const convertContaPagar = (item: any): ContaPagar => ({
  id: item.id,
  descricao: item.descricao,
  categoriaId: item.categoria_id,
  valor: item.valor,
  dataVencimento: item.data_vencimento,
  pago: item.pago,
  dataPagamento: item.data_pagamento || undefined,
  recorrente: item.recorrente,
  createdAt: item.created_at,
});

const convertCategoriaConta = (item: any): CategoriaConta => ({
  id: item.id,
  nome: item.nome,
  tipo: item.tipo,
  limiteGasto: item.limite_gasto || undefined,
  cor: item.cor,
});

const convertCategoriaProduto = (item: any): CategoriaProduto => ({
  id: item.id,
  nome: item.nome,
  margemPadrao: item.margem_padrao,
  cor: item.cor,
});

const convertMeta = (item: any): Meta => ({
  id: item.id,
  tipo: item.tipo,
  nome: item.nome,
  valorMeta: item.valor_meta,
  valorAcumulado: item.valor_acumulado,
  dataInicio: item.data_inicio,
  dataFim: item.data_fim || undefined,
  contribuicaoMensal: item.contribuicao_mensal,
  ativa: item.ativa,
  createdAt: item.created_at,
});

const convertConfiguracoes = (item: any): Configuracoes => ({
  taxas: item.taxas || { pix: 0, debito: 1.5, credito: 3.5 },
  cmvPercentualPadrao: item.cmv_percentual_padrao || 30,
  margemLucroPadrao: item.margem_lucro_padrao || 60,
  custosFixos: item.custos_fixos || [],
  custosVariaveis: item.custos_variaveis || [],
  nomeEstabelecimento: item.nome_estabelecimento || undefined,
  logoUrl: item.logo_url || undefined,
});

export function useSupabaseData(user: User | null) {
  const [data, setData] = useState<SistemaData>({
    ingredientes: [],
    fichasTecnicas: [],
    categoriasProduto: [],
    producoes: [],
    transacoes: [],
    contasPagar: [],
    categoriasConta: [],
    metas: [],
    configuracoes: defaultConfig,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar todos os dados do usuário
  const loadData = useCallback(async () => {
    // Se o Supabase não estiver configurado, usar dados vazios
    if (!isSupabaseConfigured) {
      console.log('[SupabaseData] Modo offline - usando dados vazios');
      setData({
        ingredientes: [],
        fichasTecnicas: [],
        categoriasProduto: [],
        producoes: [],
        transacoes: [],
        contasPagar: [],
        categoriasConta: [],
        metas: [],
        configuracoes: defaultConfig,
      });
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Carregar todos os dados em paralelo
      const [
        { data: ingredientesData, error: ingredientesError },
        { data: fichasData, error: fichasError },
        { data: categoriasProdData, error: catProdError },
        { data: producoesData, error: producoesError },
        { data: transacoesData, error: transacoesError },
        { data: contasData, error: contasError },
        { data: categoriasContaData, error: catContaError },
        { data: metasData, error: metasError },
        { data: configData, error: configError },
      ] = await Promise.all([
        supabase.from('ingredientes').select('*').eq('user_id', user.id).order('nome'),
        supabase.from('fichas_tecnicas').select('*').eq('user_id', user.id).order('nome'),
        supabase.from('categorias_produto').select('*').eq('user_id', user.id).order('nome'),
        supabase.from('producoes').select('*').eq('user_id', user.id).order('data_producao', { ascending: false }),
        supabase.from('transacoes').select('*').eq('user_id', user.id).order('data', { ascending: false }),
        supabase.from('contas_pagar').select('*').eq('user_id', user.id).order('data_vencimento'),
        supabase.from('categorias_conta').select('*').eq('user_id', user.id).order('nome'),
        supabase.from('metas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('configuracoes').select('*').eq('user_id', user.id).single(),
      ]);

      // Log de erros individuais (não críticos)
      if (ingredientesError) console.error('[SupabaseData] Erro ingredientes:', ingredientesError);
      if (fichasError) console.error('[SupabaseData] Erro fichas:', fichasError);
      if (catProdError) console.error('[SupabaseData] Erro cat prod:', catProdError);
      if (producoesError) console.error('[SupabaseData] Erro producoes:', producoesError);
      if (transacoesError) console.error('[SupabaseData] Erro transacoes:', transacoesError);
      if (contasError) console.error('[SupabaseData] Erro contas:', contasError);
      if (catContaError) console.error('[SupabaseData] Erro cat conta:', catContaError);
      if (metasError) console.error('[SupabaseData] Erro metas:', metasError);
      if (configError) console.error('[SupabaseData] Erro config:', configError);

      setData({
        ingredientes: (ingredientesData || []).map(convertIngrediente),
        fichasTecnicas: (fichasData || []).map(convertFichaTecnica),
        categoriasProduto: (categoriasProdData || []).map(convertCategoriaProduto),
        producoes: (producoesData || []).map(convertProducao),
        transacoes: (transacoesData || []).map(convertTransacao),
        contasPagar: (contasData || []).map(convertContaPagar),
        categoriasConta: (categoriasContaData || []).map(convertCategoriaConta),
        metas: (metasData || []).map(convertMeta),
        configuracoes: configData ? convertConfiguracoes(configData) : defaultConfig,
      });
    } catch (err) {
      console.error('[SupabaseData] Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do servidor');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Operações CRUD - retornam null/error se Supabase não configurado

  const checkSupabase = () => {
    if (!isSupabaseConfigured) {
      console.error('[SupabaseData] Supabase não configurado');
      return false;
    }
    return true;
  };

  // Ingredientes
  const addIngrediente = useCallback(async (ingrediente: Omit<Ingrediente, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!checkSupabase() || !user) return null;
    try {
      const { data, error } = await (supabase as any).from('ingredientes').insert({
        user_id: user.id,
        nome: ingrediente.nome,
        quantidade_embalagem: ingrediente.quantidadeEmbalagem,
        unidade: ingrediente.unidade,
        preco_embalagem: ingrediente.precoEmbalagem,
        custo_unidade: ingrediente.custoUnidade,
        estoque_atual: ingrediente.estoqueAtual,
        estoque_minimo: ingrediente.estoqueMinimo,
        tipo: ingrediente.tipo,
      }).select().single();
      
      if (error) throw error;
      await loadData();
      return convertIngrediente(data);
    } catch (err) {
      console.error('[SupabaseData] Erro ao adicionar ingrediente:', err);
      return null;
    }
  }, [user, loadData]);

  const updateIngrediente = useCallback(async (id: string, updates: Partial<Ingrediente>) => {
    if (!checkSupabase() || !user) return;
    try {
      const updateData: any = {};
      if (updates.nome) updateData.nome = updates.nome;
      if (updates.quantidadeEmbalagem !== undefined) updateData.quantidade_embalagem = updates.quantidadeEmbalagem;
      if (updates.unidade) updateData.unidade = updates.unidade;
      if (updates.precoEmbalagem !== undefined) updateData.preco_embalagem = updates.precoEmbalagem;
      if (updates.custoUnidade !== undefined) updateData.custo_unidade = updates.custoUnidade;
      if (updates.estoqueAtual !== undefined) updateData.estoque_atual = updates.estoqueAtual;
      if (updates.estoqueMinimo !== undefined) updateData.estoque_minimo = updates.estoqueMinimo;
      if (updates.tipo) updateData.tipo = updates.tipo;
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await (supabase as any).from('ingredientes').update(updateData).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao atualizar ingrediente:', err);
    }
  }, [user, loadData]);

  const deleteIngrediente = useCallback(async (id: string) => {
    if (!checkSupabase() || !user) return;
    try {
      const { error } = await (supabase as any).from('ingredientes').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao deletar ingrediente:', err);
    }
  }, [user, loadData]);

  // Fichas Técnicas
  const addFichaTecnica = useCallback(async (ficha: Omit<FichaTecnica, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!checkSupabase() || !user) return null;
    try {
      const { data, error } = await (supabase as any).from('fichas_tecnicas').insert({
        user_id: user.id,
        nome: ficha.nome,
        tipo: ficha.tipo,
        categoria_id: ficha.categoriaId,
        receita_base_id: ficha.receitaBaseId,
        itens: ficha.itens,
        itens_embalagem: ficha.itensEmbalagem,
        rendimento_quantidade: ficha.rendimentoQuantidade,
        rendimento_unidade: ficha.rendimentoUnidade,
        custo_total: ficha.custoTotal,
        custo_unidade: ficha.custoUnidade,
        preco_venda: ficha.precoVenda,
        margem_lucro: ficha.margemLucro,
        cmv_percentual: ficha.cmvPercentual,
        validade_dias: ficha.validadeDias,
        descricao: ficha.descricao,
      }).select().single();
      
      if (error) throw error;
      await loadData();
      return convertFichaTecnica(data);
    } catch (err) {
      console.error('[SupabaseData] Erro ao adicionar ficha:', err);
      return null;
    }
  }, [user, loadData]);

  const updateFichaTecnica = useCallback(async (id: string, updates: Partial<FichaTecnica>) => {
    if (!checkSupabase() || !user) return;
    try {
      const updateData: any = {};
      if (updates.nome) updateData.nome = updates.nome;
      if (updates.categoriaId) updateData.categoria_id = updates.categoriaId;
      if (updates.receitaBaseId !== undefined) updateData.receita_base_id = updates.receitaBaseId;
      if (updates.itens) updateData.itens = updates.itens;
      if (updates.itensEmbalagem) updateData.itens_embalagem = updates.itensEmbalagem;
      if (updates.rendimentoQuantidade !== undefined) updateData.rendimento_quantidade = updates.rendimentoQuantidade;
      if (updates.rendimentoUnidade) updateData.rendimento_unidade = updates.rendimentoUnidade;
      if (updates.custoTotal !== undefined) updateData.custo_total = updates.custoTotal;
      if (updates.custoUnidade !== undefined) updateData.custo_unidade = updates.custoUnidade;
      if (updates.precoVenda !== undefined) updateData.preco_venda = updates.precoVenda;
      if (updates.margemLucro !== undefined) updateData.margem_lucro = updates.margemLucro;
      if (updates.cmvPercentual !== undefined) updateData.cmv_percentual = updates.cmvPercentual;
      if (updates.validadeDias !== undefined) updateData.validade_dias = updates.validadeDias;
      if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await (supabase as any).from('fichas_tecnicas').update(updateData).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao atualizar ficha:', err);
    }
  }, [user, loadData]);

  const deleteFichaTecnica = useCallback(async (id: string) => {
    if (!checkSupabase() || !user) return;
    try {
      const { error } = await (supabase as any).from('fichas_tecnicas').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao deletar ficha:', err);
    }
  }, [user, loadData]);

  // Produções
  const addProducao = useCallback(async (producao: Omit<Producao, 'id' | 'createdAt'>) => {
    if (!checkSupabase() || !user) return null;
    try {
      const { data, error } = await (supabase as any).from('producoes').insert({
        user_id: user.id,
        ficha_tecnica_id: producao.fichaTecnicaId,
        quantidade_produzida: producao.quantidadeProduzida,
        data_producao: producao.dataProducao,
        data_validade: producao.dataValidade,
        custo_total: producao.custoTotal,
        observacao: producao.observacao,
      }).select().single();
      
      if (error) throw error;
      await loadData();
      return convertProducao(data);
    } catch (err) {
      console.error('[SupabaseData] Erro ao adicionar produção:', err);
      return null;
    }
  }, [user, loadData]);

  const deleteProducao = useCallback(async (id: string) => {
    if (!checkSupabase() || !user) return;
    try {
      const { error } = await (supabase as any).from('producoes').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao deletar produção:', err);
    }
  }, [user, loadData]);

  // Transações
  const addTransacao = useCallback(async (transacao: Omit<TransacaoDiaria, 'id' | 'createdAt'>) => {
    if (!checkSupabase() || !user) return null;
    try {
      const { data, error } = await (supabase as any).from('transacoes').insert({
        user_id: user.id,
        data: transacao.data,
        tipo: transacao.tipo,
        descricao: transacao.descricao,
        valor: transacao.valor,
        forma_pagamento: transacao.formaPagamento,
        taxa_descontada: transacao.taxaDescontada,
        valor_liquido: transacao.valorLiquido,
        categoria_id: transacao.categoriaId,
      }).select().single();
      
      if (error) throw error;
      await loadData();
      return convertTransacao(data);
    } catch (err) {
      console.error('[SupabaseData] Erro ao adicionar transação:', err);
      return null;
    }
  }, [user, loadData]);

  const deleteTransacao = useCallback(async (id: string) => {
    if (!checkSupabase() || !user) return;
    try {
      const { error } = await (supabase as any).from('transacoes').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao deletar transação:', err);
    }
  }, [user, loadData]);

  // Contas a Pagar
  const addContaPagar = useCallback(async (conta: Omit<ContaPagar, 'id' | 'createdAt'>) => {
    if (!checkSupabase() || !user) return null;
    try {
      const { data, error } = await (supabase as any).from('contas_pagar').insert({
        user_id: user.id,
        descricao: conta.descricao,
        categoria_id: conta.categoriaId,
        valor: conta.valor,
        data_vencimento: conta.dataVencimento,
        pago: conta.pago,
        data_pagamento: conta.dataPagamento,
        recorrente: conta.recorrente,
      }).select().single();
      
      if (error) throw error;
      await loadData();
      return convertContaPagar(data);
    } catch (err) {
      console.error('[SupabaseData] Erro ao adicionar conta:', err);
      return null;
    }
  }, [user, loadData]);

  const updateContaPagar = useCallback(async (id: string, updates: Partial<ContaPagar>) => {
    if (!checkSupabase() || !user) return;
    try {
      const updateData: any = {};
      if (updates.descricao) updateData.descricao = updates.descricao;
      if (updates.categoriaId) updateData.categoria_id = updates.categoriaId;
      if (updates.valor !== undefined) updateData.valor = updates.valor;
      if (updates.dataVencimento) updateData.data_vencimento = updates.dataVencimento;
      if (updates.pago !== undefined) updateData.pago = updates.pago;
      if (updates.dataPagamento !== undefined) updateData.data_pagamento = updates.dataPagamento;
      if (updates.recorrente !== undefined) updateData.recorrente = updates.recorrente;
      
      const { error } = await (supabase as any).from('contas_pagar').update(updateData).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao atualizar conta:', err);
    }
  }, [user, loadData]);

  const deleteContaPagar = useCallback(async (id: string) => {
    if (!checkSupabase() || !user) return;
    try {
      const { error } = await (supabase as any).from('contas_pagar').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao deletar conta:', err);
    }
  }, [user, loadData]);

  // Metas
  const addMeta = useCallback(async (meta: Omit<Meta, 'id' | 'createdAt'>) => {
    if (!checkSupabase() || !user) return null;
    try {
      const { data, error } = await (supabase as any).from('metas').insert({
        user_id: user.id,
        tipo: meta.tipo,
        nome: meta.nome,
        valor_meta: meta.valorMeta,
        valor_acumulado: meta.valorAcumulado,
        data_inicio: meta.dataInicio,
        data_fim: meta.dataFim,
        contribuicao_mensal: meta.contribuicaoMensal,
        ativa: meta.ativa,
      }).select().single();
      
      if (error) throw error;
      await loadData();
      return convertMeta(data);
    } catch (err) {
      console.error('[SupabaseData] Erro ao adicionar meta:', err);
      return null;
    }
  }, [user, loadData]);

  const updateMeta = useCallback(async (id: string, updates: Partial<Meta>) => {
    if (!checkSupabase() || !user) return;
    try {
      const updateData: any = {};
      if (updates.tipo) updateData.tipo = updates.tipo;
      if (updates.nome) updateData.nome = updates.nome;
      if (updates.valorMeta !== undefined) updateData.valor_meta = updates.valorMeta;
      if (updates.valorAcumulado !== undefined) updateData.valor_acumulado = updates.valorAcumulado;
      if (updates.dataInicio) updateData.data_inicio = updates.dataInicio;
      if (updates.dataFim !== undefined) updateData.data_fim = updates.dataFim;
      if (updates.contribuicaoMensal !== undefined) updateData.contribuicao_mensal = updates.contribuicaoMensal;
      if (updates.ativa !== undefined) updateData.ativa = updates.ativa;
      
      const { error } = await (supabase as any).from('metas').update(updateData).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao atualizar meta:', err);
    }
  }, [user, loadData]);

  const deleteMeta = useCallback(async (id: string) => {
    if (!checkSupabase() || !user) return;
    try {
      const { error } = await (supabase as any).from('metas').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao deletar meta:', err);
    }
  }, [user, loadData]);

  // Configurações
  const updateConfiguracoes = useCallback(async (config: Partial<Configuracoes>) => {
    if (!checkSupabase() || !user) return;
    try {
      const updateData: any = {};
      if (config.taxas) updateData.taxas = config.taxas;
      if (config.cmvPercentualPadrao !== undefined) updateData.cmv_percentual_padrao = config.cmvPercentualPadrao;
      if (config.margemLucroPadrao !== undefined) updateData.margem_lucro_padrao = config.margemLucroPadrao;
      if (config.custosFixos) updateData.custos_fixos = config.custosFixos;
      if (config.custosVariaveis) updateData.custos_variaveis = config.custosVariaveis;
      if (config.nomeEstabelecimento !== undefined) updateData.nome_estabelecimento = config.nomeEstabelecimento;
      if (config.logoUrl !== undefined) updateData.logo_url = config.logoUrl;
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await (supabase as any).from('configuracoes').update(updateData).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao atualizar config:', err);
    }
  }, [user, loadData]);

  // Categorias Conta
  const addCategoriaConta = useCallback(async (categoria: Omit<CategoriaConta, 'id'>) => {
    if (!checkSupabase() || !user) return null;
    try {
      const { data, error } = await (supabase as any).from('categorias_conta').insert({
        user_id: user.id,
        nome: categoria.nome,
        tipo: categoria.tipo,
        limite_gasto: categoria.limiteGasto,
        cor: categoria.cor,
      }).select().single();
      
      if (error) throw error;
      await loadData();
      return convertCategoriaConta(data);
    } catch (err) {
      console.error('[SupabaseData] Erro ao adicionar categoria:', err);
      return null;
    }
  }, [user, loadData]);

  const deleteCategoriaConta = useCallback(async (id: string) => {
    if (!checkSupabase() || !user) return;
    try {
      const { error } = await (supabase as any).from('categorias_conta').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao deletar categoria:', err);
    }
  }, [user, loadData]);

  // Categorias Produto
  const addCategoriaProduto = useCallback(async (categoria: Omit<CategoriaProduto, 'id'>) => {
    if (!checkSupabase() || !user) return null;
    try {
      const { data, error } = await (supabase as any).from('categorias_produto').insert({
        user_id: user.id,
        nome: categoria.nome,
        margem_padrao: categoria.margemPadrao,
        cor: categoria.cor,
      }).select().single();
      
      if (error) throw error;
      await loadData();
      return convertCategoriaProduto(data);
    } catch (err) {
      console.error('[SupabaseData] Erro ao adicionar categoria:', err);
      return null;
    }
  }, [user, loadData]);

  const deleteCategoriaProduto = useCallback(async (id: string) => {
    if (!checkSupabase() || !user) return;
    try {
      const { error } = await (supabase as any).from('categorias_produto').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      await loadData();
    } catch (err) {
      console.error('[SupabaseData] Erro ao deletar categoria:', err);
    }
  }, [user, loadData]);

  // Backup
  const createBackup = useCallback(async () => {
    if (!checkSupabase() || !user) return null;
    try {
      const backupData = {
        ingredientes: data.ingredientes,
        fichasTecnicas: data.fichasTecnicas,
        categoriasProduto: data.categoriasProduto,
        producoes: data.producoes,
        transacoes: data.transacoes,
        contasPagar: data.contasPagar,
        categoriasConta: data.categoriasConta,
        metas: data.metas,
        configuracoes: data.configuracoes,
        backupDate: new Date().toISOString(),
      };
      
      const { data: backup, error } = await (supabase as any).from('backups').insert({
        user_id: user.id,
        data: backupData,
      }).select().single();
      
      if (error) throw error;
      return backup;
    } catch (err) {
      console.error('[SupabaseData] Erro ao criar backup:', err);
      return null;
    }
  }, [user, data]);

  const downloadBackup = useCallback(() => {
    const backupData = {
      ingredientes: data.ingredientes,
      fichasTecnicas: data.fichasTecnicas,
      categoriasProduto: data.categoriasProduto,
      producoes: data.producoes,
      transacoes: data.transacoes,
      contasPagar: data.contasPagar,
      categoriasConta: data.categoriasConta,
      metas: data.metas,
      configuracoes: data.configuracoes,
      backupDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  // Upload de logo
  const uploadLogo = useCallback(async (file: File) => {
    if (!checkSupabase() || !user) return null;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);
      
      await updateConfiguracoes({ logoUrl: publicUrl });
      
      return publicUrl;
    } catch (err) {
      console.error('[SupabaseData] Erro ao fazer upload da logo:', err);
      return null;
    }
  }, [user, updateConfiguracoes]);

  return {
    data,
    loading,
    error,
    refreshData: loadData,
    // CRUD operations
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
    // Backup
    createBackup,
    downloadBackup,
    // Logo
    uploadLogo,
  };
}
