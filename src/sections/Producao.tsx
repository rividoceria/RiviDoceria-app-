import { useState, useMemo } from 'react';
import { Plus, Trash2, Factory, Calendar, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Producao } from '@/types';
import { useCalculations } from '@/hooks/useCalculations';
import { format, differenceInDays } from 'date-fns';
import { useStorage } from '@/hooks/useStorage';
import { toast } from 'sonner';

export function ProducaoSection() {
  const { data, addProducao, deleteProducao } = useStorage();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'registro' | 'compras'>('registro');
  
  // Form states
  const [fichaTecnicaId, setFichaTecnicaId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [dataProducao, setDataProducao] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataValidade, setDataValidade] = useState('');
  const [observacao, setObservacao] = useState('');

  const ingredientes = useMemo(() => data?.ingredientes || [], [data?.ingredientes]);
  const fichasTecnicas = useMemo(() => data?.fichasTecnicas || [], [data?.fichasTecnicas]);
  const producoes = useMemo(() => data?.producoes || [], [data?.producoes]);

  const { gerarListaCompras } = useCalculations(data);
  const listaCompras = gerarListaCompras();

  const producoesRecentes = useMemo(() => {
    return [...producoes]
      .filter(p => p != null)
      .sort((a, b) => new Date(b?.dataProducao || 0).getTime() - new Date(a?.dataProducao || 0).getTime())
      .slice(0, 50);
  }, [producoes]);

  const sugestaoValidade = useMemo(() => {
    if (!fichaTecnicaId || !dataProducao) return '';
    
    const ficha = fichasTecnicas.find(f => f?.id === fichaTecnicaId);
    if (!ficha?.validadeDias) return '';
    
    const [ano, mes, dia] = dataProducao.split('-').map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    data.setUTCDate(data.getUTCDate() + ficha.validadeDias);
    
    const anoResult = data.getUTCFullYear();
    const mesResult = String(data.getUTCMonth() + 1).padStart(2, '0');
    const diaResult = String(data.getUTCDate()).padStart(2, '0');
    
    return `${anoResult}-${mesResult}-${diaResult}`;
  }, [fichaTecnicaId, dataProducao, fichasTecnicas]);

  const aplicarSugestaoValidade = () => {
    if (sugestaoValidade) {
      setDataValidade(sugestaoValidade);
    }
  };

  const handleSubmit = async () => {
    if (!fichaTecnicaId || !quantidade || !dataValidade) return;
    
    const ficha = fichasTecnicas.find(f => f?.id === fichaTecnicaId);
    if (!ficha) return;
    
    const custoTotal = (ficha.custoUnidade || 0) * parseInt(quantidade);
    
    await addProducao({
      fichaTecnicaId,
      quantidadeProduzida: parseInt(quantidade),
      dataProducao: dataProducao,
      dataValidade: dataValidade,
      custoTotal,
      observacao,
    });
    
    setFichaTecnicaId('');
    setQuantidade('');
    setDataValidade('');
    setObservacao('');
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteProducao(id);
  };

  const produtosFinais = useMemo(() => 
    fichasTecnicas.filter(f => f?.tipo === 'produto_final' && f?.validadeDias),
    [fichasTecnicas]
  );

  const temProdutos = produtosFinais.length > 0;

  function calcularStatusValidade(dataValidade?: string): { status: 'valido' | 'proximo' | 'vencido'; diasRestantes: number } {
    if (!dataValidade) return { status: 'valido', diasRestantes: 999 };
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataValidade);
    validade.setHours(0, 0, 0, 0);
    
    const diasRestantes = differenceInDays(validade, hoje);
    
    if (diasRestantes < 0) {
      return { status: 'vencido', diasRestantes };
    } else if (diasRestantes <= 2) {
      return { status: 'proximo', diasRestantes };
    }
    return { status: 'valido', diasRestantes };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Produção</h2>
          <p className="text-gray-500">Registre suas produções manualmente</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Produção
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Produção</DialogTitle>
            </DialogHeader>
            
            {!temProdutos ? (
              <div className="pt-4">
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">
                    Nenhum produto com validade cadastrada. Cadastre produtos finais com validade na Ficha Técnica primeiro.
                  </AlertDescription>
                </Alert>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Produto *</Label>
                  <Select value={fichaTecnicaId} onValueChange={setFichaTecnicaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosFinais.map((ficha) => (
                        <SelectItem key={ficha?.id} value={ficha?.id}>
                          {ficha?.nome} (Custo: {formatCurrency(ficha?.custoUnidade || 0)}/un)
                          {ficha?.validadeDias ? ` • Validade: ${ficha.validadeDias}d` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                      placeholder="Ex: 10"
                    />
                  </div>
                  <div>
                    <Label>Data Produção *</Label>
                    <Input
                      type="date"
                      value={dataProducao}
                      onChange={(e) => setDataProducao(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Data de Validade *</Label>
                  <Input
                    type="date"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    required
                  />
                </div>
                
                {fichaTecnicaId && sugestaoValidade && !dataValidade && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-700 flex-1">
                      Sugestão: {format(new Date(sugestaoValidade + 'T12:00:00'), 'dd/MM/yyyy')}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={aplicarSugestaoValidade}
                      className="text-xs bg-white"
                    >
                      Usar
                    </Button>
                  </div>
                )}

                {dataValidade && (
                  <div className="p-3 bg-amber-50 rounded-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      Validade: {format(new Date(dataValidade + 'T12:00:00'), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}

                {fichaTecnicaId && quantidade && (
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-700">
                      Custo estimado: <span className="font-bold">
                        {formatCurrency(
                          (fichasTecnicas.find(f => f?.id === fichaTecnicaId)?.custoUnidade || 0) * parseInt(quantidade || '0')
                        )}
                      </span>
                    </p>
                  </div>
                )}
                
                <div>
                  <Label>Observação (opcional)</Label>
                  <Input
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex: Produção para o fim de semana"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
                    onClick={handleSubmit}
                    disabled={!fichaTecnicaId || !quantidade || !dataValidade}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'registro' | 'compras')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registro" className="flex items-center gap-2">
            <Factory className="w-4 h-4" />
            Registros de Produção
          </TabsTrigger>
          <TabsTrigger value="compras" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Lista de Compras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registro" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Factory className="w-5 h-5 text-blue-500" />
                Registros de Produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              {producoesRecentes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma produção registrada
                </p>
              ) : (
                <div className="space-y-3">
                  {producoesRecentes.map((producao) => {
                    if (!producao) return null;
                    const ficha = fichasTecnicas.find(f => f?.id === producao.fichaTecnicaId);
                    
                    const { status, diasRestantes } = calcularStatusValidade(producao.dataValidade);
                    
                    const statusConfig = {
                      valido: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '' },
                      proximo: { bg: 'bg-amber-50', text: 'text-amber-700', label: '(Próximo do vencimento)' },
                      vencido: { bg: 'bg-red-50', text: 'text-red-700', label: '(VENCIDO)' },
                    };
                    
                    const config = statusConfig[status];

                    return (
                      <div key={producao?.id} className={`flex items-center justify-between p-3 rounded-lg ${config.bg}`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{ficha?.nome || 'Produto não encontrado'}</p>
                          <p className="text-sm text-gray-500">
                            Produção: {format(new Date(producao.dataProducao + 'T12:00:00'), 'dd/MM/yyyy')} • {producao.quantidadeProduzida} unidades
                          </p>
                          {producao.dataValidade && (
                            <p className={`text-xs mt-1 flex items-center gap-1 ${config.text}`}>
                              <Calendar className="w-3 h-3" />
                              Validade: {format(new Date(producao.dataValidade + 'T12:00:00'), 'dd/MM/yyyy')}
                              {config.label && <span className="font-bold">{config.label}</span>}
                              {status === 'valido' && diasRestantes > 0 && ` (${diasRestantes} dias restantes)`}
                              {status === 'proximo' && ` (${diasRestantes} dias restantes)`}
                            </p>
                          )}
                          {producao.observacao && (
                            <p className="text-xs text-gray-400 mt-1">{producao.observacao}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 ml-2">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(producao.custoTotal || 0)}</p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency((producao.custoTotal || 0) / (producao.quantidadeProduzida || 1))}/un
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(producao.id)}
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
        </TabsContent>

        <TabsContent value="compras" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-pink-500" />
                Lista de Compras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Itens com estoque abaixo do mínimo sugerido (controle por embalagens)
              </p>
              {listaCompras.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum item necessário para compra no momento
                </p>
              ) : (
                <div className="space-y-3">
                  {listaCompras.map((item) => {
                    if (!item) return null;
                    const ingrediente = ingredientes.find(i => i?.id === item.ingredienteId);
                    return (
                      <div key={item?.ingredienteId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-pink-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item?.nome || 'Desconhecido'}</p>
                            <p className="text-sm text-gray-500">
                              Estoque: <span className="font-medium">{formatNumber(item?.quantidadeEstoque || 0)}</span> embalagens • 
                              Mínimo: <span className="font-medium">{formatNumber(item?.estoqueMinimo || 0)}</span> embalagens
                            </p>
                            {ingrediente && (
                              <p className="text-xs text-gray-400">
                                {formatNumber(ingrediente.quantidadeEmbalagem || 0)} {ingrediente.unidade}/embalagem
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatNumber(item?.quantidadeComprar || 0)} embalagens
                          </p>
                          <p className="text-sm text-gray-500">
                            ~{formatCurrency(item?.custoEstimado || 0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between p-3 bg-emerald-50 rounded-lg font-semibold">
                    <span className="text-emerald-700">Custo Total Estimado:</span>
                    <span className="text-emerald-700">
                      {formatCurrency(listaCompras.reduce((acc, item) => acc + (item?.custoEstimado || 0), 0))}
                    </span>
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
