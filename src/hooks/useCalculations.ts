import { useMemo, useCallback } from 'react';
import type { 
  SistemaData, 
  DashboardData, 
  ResultadoMensal, 
  ItemListaCompras,
  FormaPagamento 
} from '@/types';
import { startOfMonth, endOfMonth, format, addDays } from 'date-fns';

export function useCalculations(data: SistemaData) {
  // Calcular taxa de acordo com a forma de pagamento
  const calcularTaxa = useCallback((formaPagamento: FormaPagamento, valor: number): number => {
    if (formaPagamento === 'dinheiro') return 0;
    const taxa = data.configuracoes.taxas[formaPagamento] || 0;
    return valor * (taxa / 100);
  }, [data.configuracoes.taxas]);

  // Calcular valor líquido após taxas
  const calcularValorLiquido = useCallback((formaPagamento: FormaPagamento, valor: number): number => {
    const taxa = calcularTaxa(formaPagamento, valor);
    return valor - taxa;
  }, [calcularTaxa]);

  // Obter transações de um período
  const getTransacoesPorPeriodo = useCallback((dataInicio: Date, dataFim: Date) => {
    return data.transacoes.filter(t => {
      const dataTransacao = new Date(t.data);
      return dataTransacao >= dataInicio && dataTransacao <= dataFim;
    });
  }, [data.transacoes]);

  // Obter transações do dia
  const getTransacoesDoDia = useCallback((dataRef: Date = new Date()) => {
    const dataStr = format(dataRef, 'yyyy-MM-dd');
    return data.transacoes.filter(t => t.data.startsWith(dataStr));
  }, [data.transacoes]);

  // Obter transações do mês
  const getTransacoesDoMes = useCallback((dataRef: Date = new Date()) => {
    const inicioMes = startOfMonth(dataRef);
    const fimMes = endOfMonth(dataRef);
    return getTransacoesPorPeriodo(inicioMes, fimMes);
  }, [getTransacoesPorPeriodo]);

  // Calcular CMV baseado no percentual configurado
  const calcularCMV = useCallback((faturamento: number): number => {
    const cmvPercentual = data.configuracoes.cmvPercentualPadrao || 30;
    return faturamento * (cmvPercentual / 100);
  }, [data.configuracoes.cmvPercentualPadrao]);

  // Dashboard data - simplificado sem métricas por produto
  const dashboardData: DashboardData = useMemo(() => {
    const hoje = new Date();
    const transacoesDia = getTransacoesDoDia(hoje);
    const transacoesMes = getTransacoesDoMes(hoje);

    // Faturamento = soma de todas as receitas
    const faturamentoDia = transacoesDia
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0);
    
    const faturamentoMes = transacoesMes
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0);

    // Faturamento líquido (após taxas)
    const faturamentoLiquidoMes = transacoesMes
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valorLiquido, 0);

    // Despesas do mês (transações do tipo despesa + contas pagas)
    const despesasTransacoes = transacoesMes
      .filter(t => t.tipo === 'despesa')
      .reduce((acc, t) => acc + t.valor, 0);
    
    const despesasContas = data.contasPagar
      .filter(c => c.pago && c.dataPagamento?.startsWith(format(hoje, 'yyyy-MM')))
      .reduce((acc, c) => acc + c.valor, 0);

    const despesasMes = despesasTransacoes + despesasContas;

    // Custos fixos e variáveis
    const custosFixos = data.configuracoes.custosFixos.reduce((acc, c) => acc + c.valor, 0);
    const custosVariaveis = data.configuracoes.custosVariaveis.reduce((acc, c) => acc + c.valor, 0);

    // CMV (Custo da Mercadoria Vendida)
    const cmv = calcularCMV(faturamentoMes);

    // Lucro/Prejuízo = Faturamento - CMV - Custos Fixos - Custos Variáveis - Despesas
    const lucroPrejuizo = faturamentoLiquidoMes - cmv - custosFixos - custosVariaveis - despesasMes;
    
    // Margem de lucro sobre o faturamento
    const margemLucro = faturamentoMes > 0 ? (lucroPrejuizo / faturamentoMes) * 100 : 0;

    // Contas a vencer nos próximos 7 dias
    const dataLimite = addDays(hoje, 7);
    const contasVencendo = data.contasPagar.filter(c => {
      const vencimento = new Date(c.dataVencimento);
      return !c.pago && vencimento > hoje && vencimento <= dataLimite;
    });

    // Ingredientes com estoque baixo
    const ingredientesEstoqueBaixo = data.ingredientes.filter(i => 
      i.estoqueAtual <= i.estoqueMinimo
    );

    // Progresso das metas
    const progressoMetas = data.metas
      .filter(m => m.ativa)
      .map(meta => {
        const percentual = meta.valorMeta > 0 ? (meta.valorAcumulado / meta.valorMeta) * 100 : 0;
        return { meta, percentual: Math.min(percentual, 100) };
      });

    // Resumo por forma de pagamento (apenas receitas)
    const resumoPorFormaPagamento = transacoesMes
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => {
        if (!acc[t.formaPagamento]) acc[t.formaPagamento] = 0;
        acc[t.formaPagamento] += t.valor;
        return acc;
      }, {} as Record<FormaPagamento, number>);

    return {
      faturamentoDia,
      faturamentoMes,
      despesasMes,
      lucroPrejuizo,
      margemLucro,
      contasVencendo,
      ingredientesEstoqueBaixo,
      progressoMetas,
      resumoPorFormaPagamento,
    };
  }, [data, getTransacoesDoDia, getTransacoesDoMes, calcularCMV]);

  // Resultado Mensal - fórmula corrigida: Receita - CV - CF - CMV = Resultado
  const resultadoMensal = useCallback((mesRef: Date = new Date()): ResultadoMensal => {
    const transacoesMes = getTransacoesDoMes(mesRef);
    
    // Faturamento bruto (todas as receitas)
    const faturamento = transacoesMes
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valor, 0);
    
    // Faturamento líquido (após taxas)
    const faturamentoLiquido = transacoesMes
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => acc + t.valorLiquido, 0);

    // Custos fixos (valor absoluto)
    const custosFixos = data.configuracoes.custosFixos.reduce((acc, c) => acc + c.valor, 0);
    
    // Custos variáveis (valor absoluto)
    const custosVariaveis = data.configuracoes.custosVariaveis.reduce((acc, c) => acc + c.valor, 0);

    // CMV (Custo da Mercadoria Vendida) - percentual sobre faturamento
    const cmv = calcularCMV(faturamento);

    // Lucro = Faturamento Líquido - CMV - Custos Fixos - Custos Variáveis
    const lucro = faturamentoLiquido - cmv - custosFixos - custosVariaveis;
    
    // Margem sobre faturamento bruto
    const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0;
    
    // Ponto de equilíbrio corrigido
    // Ponto de Equilíbrio = Custos Fixos / (1 - (Custos Variáveis + CMV) / Faturamento)
    // Se não houver faturamento, retorna apenas os custos fixos
    const custosTotaisVariaveis = custosVariaveis + cmv;
    let pontoEquilibrio = custosFixos;
    
    if (faturamento > 0 && faturamentoLiquido > custosTotaisVariaveis) {
      const margemContribuicao = faturamentoLiquido - custosTotaisVariaveis;
      const indiceMargemContribuicao = margemContribuicao / faturamento;
      if (indiceMargemContribuicao > 0) {
        pontoEquilibrio = custosFixos / indiceMargemContribuicao;
      }
    }

    return {
      mes: format(mesRef, 'yyyy-MM'),
      faturamento,
      faturamentoLiquido,
      custosFixos,
      custosVariaveis,
      cmv,
      lucro,
      margem,
      pontoEquilibrio: isFinite(pontoEquilibrio) ? pontoEquilibrio : custosFixos,
    };
  }, [data, getTransacoesDoMes, calcularCMV]);

  // Gerar lista de compras baseada no estoque mínimo (por embalagens)
  const gerarListaCompras = useCallback((): ItemListaCompras[] => {
    return data.ingredientes
      .filter(ingrediente => (ingrediente.estoqueAtual || 0) <= (ingrediente.estoqueMinimo || 0))
      .map(ingrediente => {
        // Quantidade sugerida para compra = estoque mínimo - estoque atual (em embalagens)
        const quantidadeSugerida = Math.max(0, (ingrediente.estoqueMinimo || 0) - (ingrediente.estoqueAtual || 0));
        
        return {
          ingredienteId: ingrediente.id,
          nome: ingrediente.nome,
          quantidadeEstoque: ingrediente.estoqueAtual || 0,
          estoqueMinimo: ingrediente.estoqueMinimo || 0,
          quantidadeComprar: quantidadeSugerida,
          unidade: ingrediente.unidade,
          custoEstimado: quantidadeSugerida * (ingrediente.precoEmbalagem || 0),
        };
      })
      .filter(item => item.quantidadeComprar > 0)
      .sort((a, b) => b.custoEstimado - a.custoEstimado);
  }, [data.ingredientes]);

  // Calcular custo de uma ficha técnica (incluindo receita base se houver)
  const calcularCustoFichaTecnica = useCallback((fichaId: string): number => {
    const ficha = data.fichasTecnicas.find(f => f.id === fichaId);
    if (!ficha) return 0;

    let custoTotal = 0;

    // Se tiver receita base, incluir o custo dela
    if (ficha.receitasBaseIds) {
      const receitaBase = data.fichasTecnicas.find(f => f.id === ficha.receitasBaseIds);
      if (receitaBase) {
        custoTotal += receitaBase.custoTotal;
      }
    }

    // Adicionar custo dos ingredientes adicionais
    for (const item of ficha.itens) {
      const ingrediente = data.ingredientes.find(i => i.id === item.ingredienteId);
      if (ingrediente) {
        custoTotal += item.quantidade * ingrediente.custoUnidade;
      }
    }

    // Adicionar custo das embalagens
    for (const item of ficha.itensEmbalagem) {
      const ingrediente = data.ingredientes.find(i => i.id === item.ingredienteId);
      if (ingrediente) {
        custoTotal += item.quantidade * ingrediente.custoUnidade;
      }
    }

    return custoTotal;
  }, [data.fichasTecnicas, data.ingredientes]);

  return {
    calcularTaxa,
    calcularValorLiquido,
    getTransacoesDoDia,
    getTransacoesDoMes,
    calcularCMV,
    dashboardData,
    resultadoMensal,
    gerarListaCompras,
    calcularCustoFichaTecnica,
  };
}
