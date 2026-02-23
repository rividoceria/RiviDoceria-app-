import { useState, useMemo } from 'react';
import { Plus, Trash2, Check, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ProgressBar } from '@/components/ui-custom/ProgressBar';
import { formatCurrency, formatDate } from '@/lib/format';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useStorage } from '@/hooks/useStorage';

export function ContasPagar() {
  const { data, addContaPagar, updateContaPagar, deleteContaPagar } = useStorage();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState(format(new Date(), 'yyyy-MM'));
  
  // Form states
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [recorrente, setRecorrente] = useState(false);

  const contasFiltradas = useMemo(() => {
    const inicioMes = startOfMonth(parseISO(mesSelecionado + '-01'));
    const fimMes = endOfMonth(inicioMes);
    
    return (data?.contasPagar || [])
      .filter(c => {
        const dataVenc = parseISO(c.dataVencimento);
        return dataVenc >= inicioMes && dataVenc <= fimMes;
      })
      .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());
  }, [data?.contasPagar, mesSelecionado]);

  const gastosPorCategoria = useMemo(() => {
    const gastos: Record<string, number> = {};
    
    (data?.transacoes || [])
      .filter(t => t.tipo === 'despesa' && t.data.startsWith(mesSelecionado) && t.categoriaId)
      .forEach(t => {
        if (t.categoriaId) {
          gastos[t.categoriaId] = (gastos[t.categoriaId] || 0) + t.valor;
        }
      });

    (data?.contasPagar || [])
      .filter(c => c.dataVencimento.startsWith(mesSelecionado) && c.pago)
      .forEach(c => {
        gastos[c.categoriaId] = (gastos[c.categoriaId] || 0) + c.valor;
      });

    return gastos;
  }, [data?.transacoes, data?.contasPagar, mesSelecionado]);

  const handleSubmit = async () => {
    if (!descricao || !categoriaId || !valor || !dataVencimento) return;
    
    await addContaPagar({
      descricao,
      categoriaId,
      valor: parseFloat(valor),
      dataVencimento,
      pago: false,
      recorrente,
    });
    
    setDescricao('');
    setCategoriaId('');
    setValor('');
    setDataVencimento('');
    setRecorrente(false);
    setIsDialogOpen(false);
  };

  const handlePagar = async (conta: any) => {
    await updateContaPagar(conta.id, {
      pago: !conta.pago,
      dataPagamento: !conta.pago ? format(new Date(), 'yyyy-MM-dd') : undefined,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteContaPagar(id);
  };

  const hoje = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contas a Pagar</h2>
          <p className="text-gray-500">Gerencie suas contas e limites por categoria</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Descrição</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Aluguel Janeiro"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {(data?.categoriasConta || []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Conta Recorrente</Label>
                <Switch checked={recorrente} onCheckedChange={setRecorrente} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
                  onClick={handleSubmit}
                  disabled={!descricao || !categoriaId || !valor || !dataVencimento}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Limite de Gasto por Categoria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-pink-500" />
            Limite de Gasto por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(data?.categoriasConta || [])
              .filter(cat => cat.limiteGasto && cat.limiteGasto > 0)
              .map((categoria) => {
                const gasto = gastosPorCategoria[categoria.id] || 0;
                const percentual = categoria.limiteGasto ? (gasto / categoria.limiteGasto) * 100 : 0;
                
                return (
                  <div key={categoria.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{categoria.nome}</span>
                      <span className={`text-sm font-semibold ${percentual > 100 ? 'text-red-600' : 'text-gray-600'}`}>
                        {formatCurrency(gasto)} / {formatCurrency(categoria.limiteGasto)}
                      </span>
                    </div>
                    <ProgressBar
                      value={gasto}
                      max={categoria.limiteGasto}
                      color={percentual > 90 ? 'pink' : percentual > 70 ? 'orange' : 'green'}
                      showPercentage={false}
                      size="sm"
                    />
                  </div>
                );
              })}
          </div>
          {(data?.categoriasConta || []).filter(cat => cat.limiteGasto && cat.limiteGasto > 0).length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Nenhuma categoria com limite definido. Configure em Configurações &gt; Categorias.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seletor de Mês */}
      <div className="flex items-center gap-4">
        <Label>Mês:</Label>
        <Input
          type="month"
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Contas do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contasFiltradas.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma conta registrada para este mês</p>
          ) : (
            <div className="space-y-3">
              {contasFiltradas.map((conta) => {
                const categoria = data?.categoriasConta?.find(c => c.id === conta.categoriaId);
                const dataVenc = parseISO(conta.dataVencimento);
                const vencida = !conta.pago && dataVenc < hoje;
                const vencendoHoje = !conta.pago && format(dataVenc, 'yyyy-MM-dd') === format(hoje, 'yyyy-MM-dd');
                
                return (
                  <div 
                    key={conta.id} 
                    className={`
                      flex items-center justify-between p-4 rounded-lg border
                      ${conta.pago ? 'bg-gray-50 border-gray-200' : vencida ? 'bg-red-50 border-red-200' : vencendoHoje ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePagar(conta)}
                        className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                          ${conta.pago 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-pink-500'
                          }
                        `}
                      >
                        {conta.pago && <Check className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${conta.pago ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {conta.descricao}
                          </p>
                          {conta.recorrente && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                              Recorrente
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {categoria?.nome} • Vence em {formatDate(conta.dataVencimento)}
                          {vencida && <span className="text-red-600 font-medium ml-2">(Vencida)</span>}
                          {vencendoHoje && <span className="text-amber-600 font-medium ml-2">(Vence hoje)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${conta.pago ? 'text-gray-500' : 'text-gray-900'}`}>
                        {formatCurrency(conta.valor)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(conta.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
