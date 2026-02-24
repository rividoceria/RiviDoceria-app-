import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, DollarSign, PieChart, Calendar, Download, Filter, X, ArrowUpDown, CreditCard, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import { useCalculations } from '@/hooks/useCalculations';
import { format, parseISO, subMonths, eachMonthOfInterval, endOfMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { useStorage } from '@/hooks/useStorage';
import { toast } from 'sonner';

const COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee', '#fb923c'];

type PeriodoType = 'mes' | 'trimestre' | 'semestre' | 'ano' | 'personalizado';

export function Relatorios() {
  const { data } = useStorage();
  
  // Estado para o período selecionado
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoType>('mes');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [mostrarFiltrosPersonalizados, setMostrarFiltrosPersonalizados] = useState(false);
  
  const [activeTab, setActiveTab] = useState('evolucao');

  const { resultadoMensal } = useCalculations(data);

  // Função para calcular fluxo de caixa manualmente
  const calcularFluxoCaixa = (inicio: Date, fim: Date) => {
    const transacoes = data?.transacoes?.filter(t => {
      if (!t?.data) return false;
      const dataTransacao = new Date(t.data);
      return dataTransacao >= inicio && dataTransacao <= fim;
    }) || [];

    const entradas = transacoes
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => acc + (t.valor || 0), 0);

    const saidas = transacoes
      .filter(t => t.tipo === 'despesa')
      .reduce((acc, t) => acc + (t.valor || 0), 0);

    const detalhamento = [
      ...transacoes
        .filter(t => t.tipo === 'receita')
        .map(t => ({
          descricao: t.descricao || 'Venda',
          valor: t.valor || 0,
          tipo: 'entrada' as const
        })),
      ...transacoes
        .filter(t => t.tipo === 'despesa')
        .map(t => ({
          descricao: t.descricao || 'Despesa',
          valor: t.valor || 0,
          tipo: 'saida' as const
        }))
    ];

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      detalhamento
    };
  };

  // Atualizar datas com base no período selecionado
  const atualizarPeriodo = (periodo: PeriodoType) => {
    setPeriodoSelecionado(periodo);
    const hoje = new Date();
    
    switch(periodo) {
      case 'mes':
        setDataInicio(format(startOfMonth(hoje), 'yyyy-MM-dd'));
        setDataFim(format(endOfMonth(hoje), 'yyyy-MM-dd'));
        setMostrarFiltrosPersonalizados(false);
        break;
      case 'trimestre':
        setDataInicio(format(startOfMonth(subMonths(hoje, 2)), 'yyyy-MM-dd'));
        setDataFim(format(endOfMonth(hoje), 'yyyy-MM-dd'));
        setMostrarFiltrosPersonalizados(false);
        break;
      case 'semestre':
        setDataInicio(format(startOfMonth(subMonths(hoje, 5)), 'yyyy-MM-dd'));
        setDataFim(format(endOfMonth(hoje), 'yyyy-MM-dd'));
        setMostrarFiltrosPersonalizados(false);
        break;
      case 'ano':
        setDataInicio(format(startOfMonth(subMonths(hoje, 11)), 'yyyy-MM-dd'));
        setDataFim(format(endOfMonth(hoje), 'yyyy-MM-dd'));
        setMostrarFiltrosPersonalizados(false);
        break;
      case 'personalizado':
        setMostrarFiltrosPersonalizados(true);
        break;
    }
  };

  // Dados do período mensal para gráficos
  const dadosMensais = useMemo(() => {
    try {
      const inicio = parseISO(dataInicio);
      const fim = parseISO(dataFim);
      
      // Se for período menor que 2 meses, mostrar dias
      const diffDays = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 60) {
        // Agrupar por dia
        const dias: Record<string, any> = {};
        const transacoes = data?.transacoes?.filter(t => {
          if (!t?.data) return false;
          const dataTransacao = new Date(t.data);
          return dataTransacao >= inicio && dataTransacao <= fim;
        }) || [];

        transacoes.forEach(t => {
          const dia = format(new Date(t.data), 'dd/MM');
          if (!dias[dia]) {
            dias[dia] = {
              dia,
              faturamento: 0,
              despesas: 0,
              saldo: 0
            };
          }
          if (t.tipo === 'receita') {
            dias[dia].faturamento += t.valor || 0;
          } else {
            dias[dia].despesas += t.valor || 0;
          }
          dias[dia].saldo = dias[dia].faturamento - dias[dia].despesas;
        });

        return Object.values(dias).sort((a, b) => a.dia.localeCompare(b.dia));
      } else {
        // Agrupar por mês
        const meses = eachMonthOfInterval({ start: inicio, end: fim });
        return meses.map(mesItem => {
          const res = resultadoMensal(mesItem);
          return {
            mes: format(mesItem, 'MMM/yy', { locale: ptBR }),
            faturamento: res?.faturamento || 0,
            faturamentoLiquido: res?.faturamentoLiquido || 0,
            lucro: res?.lucro || 0,
            despesas: (res?.custosFixos || 0) + (res?.custosVariaveis || 0) + (res?.cmv || 0),
            cmv: res?.cmv || 0,
            custosFixos: res?.custosFixos || 0,
            custosVariaveis: res?.custosVariaveis || 0,
            receitas: res?.faturamento || 0,
            despesasTotais: (res?.custosFixos || 0) + (res?.custosVariaveis || 0) + (res?.cmv || 0)
          };
        });
      }
    } catch (error) {
      console.error('Erro ao calcular dados do período:', error);
      return [];
    }
  }, [dataInicio, dataFim, resultadoMensal, data?.transacoes]);

  // Fluxo de caixa
  const fluxoCaixa = useMemo(() => {
    return calcularFluxoCaixa(parseISO(dataInicio), parseISO(dataFim));
  }, [dataInicio, dataFim, data?.transacoes]);

  // Despesas por categoria
  const despesasPorCategoria = useMemo(() => {
    try {
      const inicio = parseISO(dataInicio);
      const fim = endOfMonth(parseISO(dataFim));
      
      const transacoes = data?.transacoes?.filter(t => {
        if (!t?.data) return false;
        const dataTransacao = new Date(t.data);
        return t.tipo === 'despesa' && dataTransacao >= inicio && dataTransacao <= fim;
      }) || [];

      const categorias: Record<string, { nome: string; valor: number; cor: string }> = {};
      
      transacoes.forEach(t => {
        if (t.categoriaId) {
          const cat = data?.categoriasConta?.find(c => c?.id === t.categoriaId);
          if (cat) {
            if (!categorias[cat.id]) {
              categorias[cat.id] = { nome: cat.nome, valor: 0, cor: cat.cor };
            }
            categorias[cat.id].valor += t.valor || 0;
          }
        }
      });

      // Adicionar custos fixos configurados (rateados por dia no período)
      const diasNoPeriodo = Math.ceil((parseISO(dataFim).getTime() - parseISO(dataInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const custosFixos = (data?.configuracoes?.custosFixos || []).reduce((acc: number, c: any) => acc + (c?.valor || 0), 0);
      if (custosFixos > 0) {
        const valorRateado = (custosFixos / 30) * Math.ceil(diasNoPeriodo / 30);
        categorias['custos_fixos'] = { 
          nome: 'Custos Fixos', 
          valor: valorRateado, 
          cor: '#ef4444' 
        };
      }

      const custosVariaveis = (data?.configuracoes?.custosVariaveis || []).reduce((acc: number, c: any) => acc + (c?.valor || 0), 0);
      if (custosVariaveis > 0) {
        const valorRateado = (custosVariaveis / 30) * Math.ceil(diasNoPeriodo / 30);
        categorias['custos_variaveis'] = { 
          nome: 'Custos Variáveis', 
          valor: valorRateado, 
          cor: '#f97316' 
        };
      }

      return Object.values(categorias).sort((a, b) => b.valor - a.valor);
    } catch (error) {
      console.error('Erro ao calcular despesas por categoria:', error);
      return [];
    }
  }, [data?.transacoes, data?.categoriasConta, data?.configuracoes, dataInicio, dataFim]);

  // Totais do período
  const totais = useMemo(() => {
    if (dadosMensais.length === 0) {
      return {
        faturamento: 0,
        despesas: 0,
        saldo: 0,
        custosFixos: 0,
        custosVariaveis: 0,
        cmv: 0,
        ticketMedio: 0,
        qtdVendas: 0
      };
    }

    // Se for dados diários
    if (dadosMensais[0]?.dia) {
      const faturamento = dadosMensais.reduce((acc, d) => acc + (d.faturamento || 0), 0);
      const despesas = dadosMensais.reduce((acc, d) => acc + (d.despesas || 0), 0);
      const qtdVendas = data?.transacoes?.filter(t => {
        if (!t?.data) return false;
        const dataTransacao = new Date(t.data);
        return t.tipo === 'receita' && dataTransacao >= parseISO(dataInicio) && dataTransacao <= parseISO(dataFim);
      }).length || 0;

      return {
        faturamento,
        despesas,
        saldo: faturamento - despesas,
        custosFixos: 0,
        custosVariaveis: 0,
        cmv: 0,
        ticketMedio: qtdVendas > 0 ? faturamento / qtdVendas : 0,
        qtdVendas
      };
    }

    // Se for dados mensais
    return dadosMensais.reduce((acc, m) => ({
      faturamento: (acc.faturamento || 0) + (m.faturamento || 0),
      despesas: (acc.despesas || 0) + (m.despesas || 0),
      saldo: (acc.saldo || 0) + (m.lucro || 0),
      custosFixos: (acc.custosFixos || 0) + (m.custosFixos || 0),
      custosVariaveis: (acc.custosVariaveis || 0) + (m.custosVariaveis || 0),
      cmv: (acc.cmv || 0) + (m.cmv || 0),
    }), { 
      faturamento: 0, 
      despesas: 0, 
      saldo: 0, 
      custosFixos: 0, 
      custosVariaveis: 0, 
      cmv: 0 
    });
  }, [dadosMensais, data?.transacoes, dataInicio, dataFim]);

  // Exportar relatório em JSON (simples)
  const handleExportJSON = () => {
    try {
      const relatorio = {
        periodo: {
          inicio: dataInicio,
          fim: dataFim
        },
        totais,
        despesasPorCategoria,
        dadosMensais,
        fluxoCaixa,
        exportadoEm: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const limparFiltros = () => {
    setPeriodoSelecionado('mes');
    setDataInicio(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setDataFim(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    setMostrarFiltrosPersonalizados(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
          <p className="text-gray-500">Análise financeira completa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="font-medium">Período</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={periodoSelecionado} onValueChange={(v: PeriodoType) => atualizarPeriodo(v)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Este mês</SelectItem>
                  <SelectItem value="trimestre">Últimos 3 meses</SelectItem>
                  <SelectItem value="semestre">Últimos 6 meses</SelectItem>
                  <SelectItem value="ano">Últimos 12 meses</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {mostrarFiltrosPersonalizados && (
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="flex-1">
                    <Label className="text-xs">Data Início</Label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Data Fim</Label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                <X className="w-4 h-4 mr-1" />
                Limpar filtro
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-pink-500 to-rose-500">
                <Filter className="w-4 h-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Totais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600 font-medium">Faturamento Total</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totais.faturamento)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-orange-600 font-medium">Despesas Totais</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(totais.despesas)}</p>
          </CardContent>
        </Card>
        
        <Card className={`${(totais.saldo || 0) >= 0 ? 'bg-gradient-to-br from-emerald-50 to-green-50' : 'bg-gradient-to-br from-red-50 to-rose-50'}`}>
          <CardContent className="p-4">
            <p className={`text-sm font-medium ${(totais.saldo || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              Saldo do Período
            </p>
            <p className={`text-2xl font-bold ${(totais.saldo || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(Math.abs(totais.saldo || 0))}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="p-4">
            <p className="text-sm text-purple-600 font-medium">CMV Total</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(totais.cmv)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards adicionais para fluxo de caixa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                <span className="font-medium">Total de Vendas</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{fluxoCaixa?.entradas ? formatCurrency(fluxoCaixa.entradas) : 'R$ 0,00'}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-red-500" />
                <span className="font-medium">Total de Despesas</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{fluxoCaixa?.saidas ? formatCurrency(fluxoCaixa.saidas) : 'R$ 0,00'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolucao" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Evolução</span>
          </TabsTrigger>
          <TabsTrigger value="despesas" className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Despesas</span>
          </TabsTrigger>
          <TabsTrigger value="tendencia" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Tendência</span>
          </TabsTrigger>
          <TabsTrigger value="fluxo" className="flex items-center gap-1">
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">Fluxo de Caixa</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolucao" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução {dadosMensais[0]?.dia ? 'Diária' : 'Mensal'}</CardTitle>
            </CardHeader>
            <CardContent>
              {dadosMensais.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosMensais}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey={dadosMensais[0]?.dia ? "dia" : "mes"} stroke="#6b7280" />
                      <YAxis stroke="#6b7280" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum dado disponível para o período</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                Despesas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {despesasPorCategoria.length > 0 ? (
                <>
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={despesasPorCategoria}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="valor"
                          nameKey="nome"
                        >
                          {despesasPorCategoria.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {despesasPorCategoria.map((cat, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.cor || COLORS[idx % COLORS.length] }}
                          />
                          <span className="font-medium">{cat.nome}</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(cat.valor)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhuma despesa no período</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tendencia" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Tendência de Resultados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosMensais.length > 0 && !dadosMensais[0]?.dia ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosMensais}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="faturamentoLiquido" name="Faturamento Líquido" stroke="#06b6d4" strokeWidth={2} />
                      <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#10b981" strokeWidth={2} />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Dados diários não disponíveis para tendência mensal</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fluxo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-blue-500" />
                Fluxo de Caixa Detalhado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fluxoCaixa && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">Entradas</p>
                      <p className="text-xl font-bold text-green-700">{formatCurrency(fluxoCaixa.entradas)}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600">Saídas</p>
                      <p className="text-xl font-bold text-red-700">{formatCurrency(fluxoCaixa.saidas)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${fluxoCaixa.saldo >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      <p className={`text-sm ${fluxoCaixa.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Saldo
                      </p>
                      <p className={`text-xl font-bold ${fluxoCaixa.saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(Math.abs(fluxoCaixa.saldo))}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Últimas Transações</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {fluxoCaixa.detalhamento?.slice(0, 10).map((item, idx) => (
                        <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{item.descricao || 'Transação'}</span>
                          <span className={item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(item.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
