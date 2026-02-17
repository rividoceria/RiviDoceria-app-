import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Target,
  Calendar,
  CreditCard,
  Wallet,
  Smartphone,
  Banknote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui-custom/StatCard';
import { ProgressBar } from '@/components/ui-custom/ProgressBar';
import { AlertCard } from '@/components/ui-custom/AlertCard';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/format';
import type { SistemaData, FormaPagamento } from '@/types';
import { useCalculations } from '@/hooks/useCalculations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  data: SistemaData;
}

const formaPagamentoIcons: Record<FormaPagamento, React.ReactNode> = {
  dinheiro: <Banknote className="w-4 h-4" />,
  pix: <Smartphone className="w-4 h-4" />,
  debito: <CreditCard className="w-4 h-4" />,
  credito: <CreditCard className="w-4 h-4" />,
};

const formaPagamentoLabels: Record<FormaPagamento, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  debito: 'Débito',
  credito: 'Crédito',
};

export function Dashboard({ data }: DashboardProps) {
  const { dashboardData } = useCalculations(data);

  const {
    faturamentoDia,
    faturamentoMes,
    lucroPrejuizo,
    margemLucro,
    contasVencendo,
    ingredientesEstoqueBaixo,
    progressoMetas,
    resumoPorFormaPagamento,
  } = dashboardData;

  const temAlertas = ingredientesEstoqueBaixo.length > 0 || contasVencendo.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">Visão geral da sua doceria</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Hoje"
          value={formatCurrency(faturamentoDia)}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Faturamento Mês"
          value={formatCurrency(faturamentoMes)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="pink"
        />
        <StatCard
          title={lucroPrejuizo >= 0 ? 'Lucro do Mês' : 'Prejuízo do Mês'}
          value={formatCurrency(Math.abs(lucroPrejuizo))}
          trend={lucroPrejuizo >= 0 ? 'up' : 'down'}
          trendValue={lucroPrejuizo >= 0 ? 'Positivo' : 'Negativo'}
          icon={lucroPrejuizo >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          color={lucroPrejuizo >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Margem de Lucro"
          value={formatPercentage(margemLucro)}
          subtitle="Sobre o faturamento"
          icon={<Target className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Alertas */}
      {temAlertas && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ingredientesEstoqueBaixo.length > 0 && (
              <AlertCard
                title="Estoque Baixo"
                message={`${ingredientesEstoqueBaixo.length} ingrediente(s) com estoque abaixo do mínimo: ${ingredientesEstoqueBaixo.map(i => i.nome).join(', ')}`}
                type="warning"
              />
            )}
            {contasVencendo.length > 0 && (
              <AlertCard
                title="Contas a Vencer"
                message={`${contasVencendo.length} conta(s) próximas do vencimento`}
                type="info"
              />
            )}
          </div>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-pink-500" />
              Progresso das Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressoMetas.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma meta ativa</p>
            ) : (
              <div className="space-y-4">
                {progressoMetas.map(({ meta }) => (
                  <ProgressBar
                    key={meta.id}
                    label={meta.nome}
                    value={meta.valorAcumulado}
                    max={meta.valorMeta}
                    sublabel={`${formatCurrency(meta.valorAcumulado)} de ${formatCurrency(meta.valorMeta)} • Faltam ${formatCurrency(meta.valorMeta - meta.valorAcumulado)}`}
                    color={meta.tipo === 'faturamento' ? 'green' : 'blue'}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contas a Vencer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Contas Próximas do Vencimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contasVencendo.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma conta próxima do vencimento</p>
            ) : (
              <div className="space-y-3">
                {contasVencendo.slice(0, 5).map((conta) => (
                  <div key={conta.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{conta.descricao}</p>
                      <p className="text-sm text-gray-500">Vence em {formatDate(conta.dataVencimento)}</p>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(conta.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receitas por Forma de Pagamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-500" />
              Receitas por Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(resumoPorFormaPagamento).length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma receita no mês</p>
            ) : (
              <div className="space-y-3">
                {(Object.entries(resumoPorFormaPagamento) as [FormaPagamento, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([forma, valor]) => (
                    <div key={forma} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {formaPagamentoIcons[forma]}
                        </div>
                        <span className="font-medium text-gray-900">{formaPagamentoLabels[forma]}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(valor)}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Resumo Financeiro do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Faturamento</span>
                <span className="font-semibold text-gray-900">{formatCurrency(faturamentoMes)}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Custos Fixos</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(data.configuracoes.custosFixos.reduce((a, c) => a + c.valor, 0))}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Custos Variáveis</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(data.configuracoes.custosVariaveis.reduce((a, c) => a + c.valor, 0))}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">CMV ({data.configuracoes.cmvPercentualPadrao}%)</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(faturamentoMes * (data.configuracoes.cmvPercentualPadrao / 100))}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="font-semibold text-emerald-700">Resultado</span>
                  <span className={`font-bold ${lucroPrejuizo >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {lucroPrejuizo >= 0 ? '+' : '-'}{formatCurrency(Math.abs(lucroPrejuizo))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
