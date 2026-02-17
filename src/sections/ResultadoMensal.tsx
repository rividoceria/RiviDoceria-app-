import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/ui-custom/StatCard';
import { formatCurrency, formatPercentage } from '@/lib/format';
import type { SistemaData } from '@/types';
import { useCalculations } from '@/hooks/useCalculations';
import { format, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface ResultadoMensalProps {
  data: SistemaData;
}

export function ResultadoMensal({ data }: ResultadoMensalProps) {
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), 'yyyy-MM'));
  const { resultadoMensal } = useCalculations(data);

  const resultado = useMemo(() => {
    const mesDate = parseISO(mesSelecionado + '-01');
    return resultadoMensal(mesDate);
  }, [mesSelecionado, resultadoMensal]);

  // Dados para gráfico de evolução (últimos 6 meses)
  const evolucaoMensal = useMemo(() => {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const mes = subMonths(new Date(), i);
      const res = resultadoMensal(mes);
      meses.push({
        mes: format(mes, 'MMM', { locale: ptBR }),
        faturamento: res.faturamento,
        faturamentoLiquido: res.faturamentoLiquido,
        lucro: res.lucro,
        despesas: res.custosFixos + res.custosVariaveis + res.cmv,
      });
    }
    return meses;
  }, [resultadoMensal]);



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resultado Mensal</h2>
          <p className="text-gray-500">Análise financeira completa do mês</p>
        </div>
        <div className="flex items-center gap-4">
          <Label>Mês:</Label>
          <Input
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Bruto"
          value={formatCurrency(resultado.faturamento)}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Faturamento Líquido"
          value={formatCurrency(resultado.faturamentoLiquido)}
          subtitle="Após taxas"
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Custos Totais"
          value={formatCurrency(resultado.custosFixos + resultado.custosVariaveis + resultado.cmv)}
          icon={<PieChart className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title={resultado.lucro >= 0 ? 'Lucro' : 'Prejuízo'}
          value={formatCurrency(Math.abs(resultado.lucro))}
          trend={resultado.lucro >= 0 ? 'up' : 'down'}
          trendValue={`Margem: ${formatPercentage(resultado.margem)}`}
          icon={resultado.lucro >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          color={resultado.lucro >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Fórmula do Resultado */}
      <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Fórmula do Resultado</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              Faturamento Líquido
            </span>
            <span className="text-gray-400">-</span>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
              Custos Fixos
            </span>
            <span className="text-gray-400">-</span>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
              Custos Variáveis
            </span>
            <span className="text-gray-400">-</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
              CMV
            </span>
            <span className="text-gray-400">=</span>
            <span className={`px-3 py-1 rounded-full font-medium ${resultado.lucro >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              Resultado
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Ponto de Equilíbrio */}
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-violet-600 font-medium">Ponto de Equilíbrio</p>
                <p className="text-3xl font-bold text-violet-700">{formatCurrency(resultado.pontoEquilibrio)}</p>
                <p className="text-sm text-violet-500">
                  Você precisa faturar este valor para cobrir todos os custos
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-violet-600">Status:</p>
              <p className={`text-lg font-bold ${resultado.faturamento >= resultado.pontoEquilibrio ? 'text-emerald-600' : 'text-red-600'}`}>
                {resultado.faturamento >= resultado.pontoEquilibrio ? 'Acima do P.E.' : 'Abaixo do P.E.'}
              </p>
              <p className="text-sm text-violet-500">
                {resultado.faturamento >= resultado.pontoEquilibrio 
                  ? `+${formatCurrency(resultado.faturamento - resultado.pontoEquilibrio)}` 
                  : `-${formatCurrency(resultado.pontoEquilibrio - resultado.faturamento)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Evolução dos Últimos 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Evolução em Linha */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Tendência de Lucro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="despesas" name="Custos" stroke="#ef4444" strokeWidth={2} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Detalhado */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Resumo Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Receitas</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Faturamento Bruto</span>
                  <span className="font-medium">{formatCurrency(resultado.faturamento)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxas Descontadas</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(resultado.faturamento - resultado.faturamentoLiquido)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Faturamento Líquido</span>
                    <span className="text-blue-600">{formatCurrency(resultado.faturamentoLiquido)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Custos e Despesas</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CMV ({data.configuracoes.cmvPercentualPadrao}%)</span>
                  <span className="font-medium text-red-600">-{formatCurrency(resultado.cmv)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Custos Fixos</span>
                  <span className="font-medium text-red-600">-{formatCurrency(resultado.custosFixos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Custos Variáveis</span>
                  <span className="font-medium text-red-600">-{formatCurrency(resultado.custosVariaveis)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total de Custos</span>
                    <span className="text-red-600">
                      -{formatCurrency(resultado.cmv + resultado.custosFixos + resultado.custosVariaveis)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Resultado Final</span>
              <span className={`text-2xl font-bold ${resultado.lucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {resultado.lucro >= 0 ? '+' : '-'}{formatCurrency(Math.abs(resultado.lucro))}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Margem de lucro: {formatPercentage(resultado.margem)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
