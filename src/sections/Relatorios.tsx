import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, DollarSign, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/format';
import { useCalculations } from '@/hooks/useCalculations';
import { format, parseISO, subMonths, eachMonthOfInterval, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { useStorage } from '@/hooks/useStorage';

const COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee', '#fb923c'];

export function Relatorios() {
  const { data } = useStorage();
  
  const [mesInicio, setMesInicio] = useState(format(subMonths(new Date(), 5), 'yyyy-MM'));
  const [mesFim, setMesFim] = useState(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState('evolucao');

  const { resultadoMensal } = useCalculations(data);

  // Dados do período
  const dadosPeriodo = useMemo(() => {
    try {
      const inicio = parseISO(mesInicio + '-01');
      const fim = parseISO(mesFim + '-01');
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
        };
      });
    } catch (error) {
      console.error('Erro ao calcular dados do período:', error);
      return [];
    }
  }, [mesInicio, mesFim, resultadoMensal]);

  // Despesas por categoria
  const despesasPorCategoria = useMemo(() => {
    try {
      const inicio = parseISO(mesInicio + '-01');
      const fim = endOfMonth(parseISO(mesFim + '-01'));
      
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

      const custosFixos = data?.configuracoes?.custosFixos?.reduce((acc: number, c: any) => acc + (c?.valor || 0), 0) || 0;
      if (custosFixos > 0) {
        categorias['custos_fixos'] = { nome: 'Custos Fixos', valor: custosFixos, cor: '#ef4444' };
      }

      const custosVariaveis = data?.configuracoes?.custosVariaveis?.reduce((acc: number, c: any) => acc + (c?.valor || 0), 0) || 0;
      if (custosVariaveis > 0) {
        categorias['custos_variaveis'] = { nome: 'Custos Variáveis', valor: custosVariaveis, cor: '#f97316' };
      }

      return Object.values(categorias).sort((a, b) => b.valor - a.valor);
    } catch (error) {
      console.error('Erro ao calcular despesas por categoria:', error);
      return [];
    }
  }, [data?.transacoes, data?.categoriasConta, data?.configuracoes, mesInicio, mesFim]);

  // Totais do período
  const totais = useMemo(() => {
    return dadosPeriodo.reduce((acc, m) => ({
      faturamento: (acc.faturamento || 0) + (m.faturamento || 0),
      faturamentoLiquido: (acc.faturamentoLiquido || 0) + (m.faturamentoLiquido || 0),
      lucro: (acc.lucro || 0) + (m.lucro || 0),
      custosFixos: (acc.custosFixos || 0) + (m.custosFixos || 0),
      custosVariaveis: (acc.custosVariaveis || 0) + (m.custosVariaveis || 0),
      cmv: (acc.cmv || 0) + (m.cmv || 0),
    }), { faturamento: 0, faturamentoLiquido: 0, lucro: 0, custosFixos: 0, custosVariaveis: 0, cmv: 0 });
  }, [dadosPeriodo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
          <p className="text-gray-500">Análise financeira simplificada</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div>
              <Label>Mês Início</Label>
              <Input
                type="month"
                value={mesInicio}
                onChange={(e) => setMesInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Mês Fim</Label>
              <Input
                type="month"
                value={mesFim}
                onChange={(e) => setMesFim(e.target.value)}
              />
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
        <Card className={`${(totais.lucro || 0) >= 0 ? 'bg-gradient-to-br from-emerald-50 to-green-50' : 'bg-gradient-to-br from-red-50 to-rose-50'}`}>
          <CardContent className="p-4">
            <p className={`text-sm font-medium ${(totais.lucro || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {(totais.lucro || 0) >= 0 ? 'Lucro Total' : 'Prejuízo Total'}
            </p>
            <p className={`text-2xl font-bold ${(totais.lucro || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCurrency(Math.abs(totais.lucro || 0))}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-orange-600 font-medium">Custos Fixos</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(totais.custosFixos)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="p-4">
            <p className="text-sm text-purple-600 font-medium">CMV Total</p>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(totais.cmv)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
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
        </TabsList>

        <TabsContent value="evolucao" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              {dadosPeriodo.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosPeriodo}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="mes" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Custos" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
                Tendência de Lucro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosPeriodo.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dadosPeriodo}>
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
                <p className="text-gray-500 text-center py-8">Nenhum dado disponível para o período</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
