import { useState, useMemo } from 'react';
import { Plus, Trash2, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/format';
import type { TransacaoDiaria, FormaPagamento, TipoTransacao } from '@/types';
import { useCalculations } from '@/hooks/useCalculations';
import { format } from 'date-fns';
import { useStorage } from '@/hooks/useStorage';
import { toast } from 'sonner';

export function CaixaDiario() {
  const { data, addTransacao, deleteTransacao } = useStorage();
  
  const [activeTab, setActiveTab] = useState('receitas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form states
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tipoTransacao, setTipoTransacao] = useState<TipoTransacao>('receita');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('dinheiro');
  const [categoriaId, setCategoriaId] = useState('');

  const { calcularTaxa, calcularValorLiquido } = useCalculations(data);

  // Transações do dia selecionado
  const transacoesDoDia = useMemo(() => {
    return (data?.transacoes || []).filter(t => t.data.startsWith(dataSelecionada));
  }, [data?.transacoes, dataSelecionada]);

  const receitasDoDia = transacoesDoDia.filter(t => t.tipo === 'receita');
  const despesasDoDia = transacoesDoDia.filter(t => t.tipo === 'despesa');

  // Resumo do dia
  const resumoDia = useMemo(() => {
    const totalReceitas = receitasDoDia.reduce((acc, t) => acc + t.valor, 0);
    const totalDespesas = despesasDoDia.reduce((acc, t) => acc + t.valor, 0);
    const saldo = totalReceitas - totalDespesas;
    
    const receitasPorForma = receitasDoDia.reduce((acc, t) => {
      if (!acc[t.formaPagamento]) acc[t.formaPagamento] = 0;
      acc[t.formaPagamento] += t.valor;
      return acc;
    }, {} as Record<FormaPagamento, number>);

    return { totalReceitas, totalDespesas, saldo, receitasPorForma };
  }, [receitasDoDia, despesasDoDia]);

  const handleSubmit = async () => {
    if (!descricao || !valor) return;
    
    const valorNum = parseFloat(valor);
    const taxaDescontada = calcularTaxa(formaPagamento, valorNum);
    const valorLiquido = calcularValorLiquido(formaPagamento, valorNum);
    
    await addTransacao({
      data: dataSelecionada,
      tipo: tipoTransacao,
      descricao,
      valor: valorNum,
      formaPagamento,
      taxaDescontada,
      valorLiquido,
      categoriaId: tipoTransacao === 'despesa' ? categoriaId || undefined : undefined,
    });
    
    // Reset form
    setDescricao('');
    setValor('');
    setCategoriaId('');
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTransacao(id);
  };

  const formaPagamentoIcons: Record<FormaPagamento, React.ReactNode> = {
    dinheiro: <Banknote className="w-4 h-4" />,
    pix: <Smartphone className="w-4 h-4" />,
    debito: <CreditCard className="w-4 h-4" />,
    credito: <CreditCard className="w-4 h-4" />,
  };

  const formaPagamentoLabels: Record<FormaPagamento, string> = {
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    debito: 'Cartão Débito',
    credito: 'Cartão Crédito',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Caixa Diário</h2>
          <p className="text-gray-500">Controle de receitas e despesas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Tipo</Label>
                <Select value={tipoTransacao} onValueChange={(v) => setTipoTransacao(v as TipoTransacao)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrição</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder={tipoTransacao === 'receita' ? 'Ex: Vendas do dia' : 'Ex: Compra de insumos'}
                />
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
                <Label>Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="debito">Cartão Débito</SelectItem>
                    <SelectItem value="credito">Cartão Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tipoTransacao === 'despesa' && (
                <div>
                  <Label>Categoria (opcional)</Label>
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
              )}

              {tipoTransacao === 'receita' && valor && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="flex justify-between">
                    <span>Valor Bruto:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(valor) || 0)}</span>
                  </p>
                  <p className="flex justify-between text-gray-500">
                    <span>Taxa ({formaPagamento === 'dinheiro' ? 0 : data?.configuracoes?.taxas[formaPagamento]}%):</span>
                    <span>-{formatCurrency(calcularTaxa(formaPagamento, parseFloat(valor) || 0))}</span>
                  </p>
                  <p className="flex justify-between font-semibold text-green-600">
                    <span>Valor Líquido:</span>
                    <span>{formatCurrency(calcularValorLiquido(formaPagamento, parseFloat(valor) || 0))}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
                  onClick={handleSubmit}
                  disabled={!descricao || !valor}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo do Dia */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-600 font-medium">Total Receitas</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(resumoDia.totalReceitas)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-600 font-medium">Total Despesas</p>
            <p className="text-2xl font-bold text-red-700">{formatCurrency(resumoDia.totalDespesas)}</p>
          </CardContent>
        </Card>
        <Card className={`${resumoDia.saldo >= 0 ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'}`}>
          <CardContent className="p-4">
            <p className={`text-sm font-medium ${resumoDia.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo do Dia</p>
            <p className={`text-2xl font-bold ${resumoDia.saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(resumoDia.saldo)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Seletor de Data */}
      <div className="flex items-center gap-4">
        <Label>Data:</Label>
        <Input
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Receitas por Forma de Pagamento */}
      {Object.keys(resumoDia.receitasPorForma).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Receitas por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(resumoDia.receitasPorForma) as [FormaPagamento, number][]).map(([forma, valor]) => (
                <div key={forma} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  {formaPagamentoIcons[forma]}
                  <span className="text-sm font-medium">{formaPagamentoLabels[forma]}:</span>
                  <span className="text-sm font-bold">{formatCurrency(valor)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Receitas e Despesas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receitas">Receitas ({receitasDoDia.length})</TabsTrigger>
          <TabsTrigger value="despesas">Despesas ({despesasDoDia.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="receitas" className="mt-4">
          {receitasDoDia.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhuma receita registrada nesta data
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {receitasDoDia.map((transacao) => (
                <Card key={transacao.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          {formaPagamentoIcons[transacao.formaPagamento]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transacao.descricao}</p>
                          <p className="text-sm text-gray-500">
                            {formaPagamentoLabels[transacao.formaPagamento]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(transacao.valor)}</p>
                          <p className="text-xs text-gray-500">Líq: {formatCurrency(transacao.valorLiquido)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(transacao.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="despesas" className="mt-4">
          {despesasDoDia.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhuma despesa registrada nesta data
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {despesasDoDia.map((transacao) => {
                const categoria = transacao.categoriaId 
                  ? data?.categoriasConta?.find(c => c.id === transacao.categoriaId)
                  : null;
                return (
                  <Card key={transacao.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            {formaPagamentoIcons[transacao.formaPagamento]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transacao.descricao}</p>
                            <p className="text-sm text-gray-500">
                              {categoria?.nome || 'Sem categoria'} • {formaPagamentoLabels[transacao.formaPagamento]}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-red-600">-{formatCurrency(transacao.valor)}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(transacao.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
