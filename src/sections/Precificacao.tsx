import { useState, useMemo } from 'react';
import { Tag, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatPercentage } from '@/lib/format';
import type { SistemaData, FichaTecnica } from '@/types';

interface PrecificacaoProps {
  data: SistemaData;
  onUpdateFicha: (id: string, updates: Partial<FichaTecnica>) => void;
}

export function Precificacao({ data, onUpdateFicha }: PrecificacaoProps) {
  const [selectedFichaId, setSelectedFichaId] = useState<string>('');
  const [novoPreco, setNovoPreco] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Verificações de segurança para evitar tela branca
  const produtos = useMemo(() => {
    return (data?.fichasTecnicas || []).filter(f => f?.tipo === 'produto_final');
  }, [data?.fichasTecnicas]);

  const categoriasProduto = useMemo(() => {
    return data?.categoriasProduto || [];
  }, [data?.categoriasProduto]);

  const produtosPorCategoria = useMemo(() => {
    const grouped: Record<string, { categoria: typeof categoriasProduto[0]; produtos: typeof produtos }> = {};
    
    produtos.forEach(produto => {
      if (!produto?.categoriaId) return;
      
      const cat = categoriasProduto.find(c => c?.id === produto.categoriaId);
      if (cat) {
        if (!grouped[cat.id]) {
          grouped[cat.id] = { categoria: cat, produtos: [] };
        }
        grouped[cat.id].produtos.push(produto);
      }
    });

    return Object.values(grouped);
  }, [produtos, categoriasProduto]);

  const handleAtualizarPreco = () => {
    if (!selectedFichaId || !novoPreco) return;
    
    const preco = parseFloat(novoPreco);
    const ficha = produtos.find(p => p?.id === selectedFichaId);
    if (!ficha) return;

    const margemLucro = ficha.custoUnidade > 0 ? ((preco - ficha.custoUnidade) / preco) * 100 : 0;
    const cmvPercentual = ficha.custoUnidade > 0 ? (ficha.custoUnidade / preco) * 100 : 0;

    onUpdateFicha(selectedFichaId, {
      precoVenda: preco,
      margemLucro,
      cmvPercentual,
    });

    setNovoPreco('');
    setSelectedFichaId('');
    setIsDialogOpen(false);
  };

  const openPrecoDialog = (fichaId: string, precoAtual: number) => {
    setSelectedFichaId(fichaId);
    setNovoPreco(precoAtual?.toString() || '0');
    setIsDialogOpen(true);
  };

  const getMargemStatus = (margem: number, margemIdeal: number) => {
    if (margem >= margemIdeal) return { status: 'good', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (margem >= margemIdeal * 0.7) return { status: 'warning', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { status: 'bad', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Precificação</h2>
        <p className="text-gray-500">Análise e ajuste de preços dos produtos</p>
      </div>

      {/* Resumo por Categoria */}
      {categoriasProduto.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriasProduto.map((categoria) => {
            if (!categoria) return null;
            
            const produtosCat = produtos.filter(p => p?.categoriaId === categoria.id);
            const mediaMargem = produtosCat.length > 0
              ? produtosCat.reduce((acc, p) => acc + (p?.margemLucro || 0), 0) / produtosCat.length
              : 0;
            
            return (
              <Card key={categoria.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoria.cor || '#ccc' }}
                    />
                    <h4 className="font-semibold text-gray-900">{categoria.nome}</h4>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      Margem Ideal: <span className="font-medium">{formatPercentage(categoria.margemPadrao)}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Média Atual: <span className={`font-medium ${mediaMargem >= categoria.margemPadrao ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {formatPercentage(mediaMargem)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Produtos: <span className="font-medium">{produtosCat.length}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            Nenhuma categoria de produto cadastrada. Vá em Configurações para criar categorias.
          </CardContent>
        </Card>
      )}

      {/* Lista de Produtos por Categoria */}
      <div className="space-y-6">
        {produtosPorCategoria.length > 0 ? (
          produtosPorCategoria.map(({ categoria, produtos: produtosCat }) => (
            <Card key={categoria.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: categoria.cor || '#ccc' }}
                  />
                  {categoria.nome}
                  <span className="text-sm font-normal text-gray-500">
                    (Margem ideal: {formatPercentage(categoria.margemPadrao)})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {produtosCat.map((produto) => {
                    if (!produto) return null;
                    
                    const margemStatus = getMargemStatus(produto.margemLucro || 0, categoria.margemPadrao);
                    const precoIdeal = produto.custoUnidade > 0 
                      ? produto.custoUnidade / (1 - categoria.margemPadrao / 100) 
                      : 0;
                    
                    return (
                      <div key={produto.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{produto.nome}</h4>
                              {margemStatus.status === 'good' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                              {margemStatus.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                              {margemStatus.status === 'bad' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-gray-500">Custo/un</p>
                                <p className="font-medium text-gray-900">{formatCurrency(produto.custoUnidade || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Preço Atual</p>
                                <p className="font-medium text-gray-900">{formatCurrency(produto.precoVenda || 0)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Preço Ideal</p>
                                <p className="font-medium text-blue-600">{formatCurrency(precoIdeal)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Margem Real</p>
                                <p className={`font-bold ${margemStatus.color}`}>
                                  {formatPercentage(produto.margemLucro || 0)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-4 text-sm">
                              <div className={`px-2 py-1 rounded ${margemStatus.bg}`}>
                                <span className={margemStatus.color}>
                                  {margemStatus.status === 'good' && 'Margem OK'}
                                  {margemStatus.status === 'warning' && 'Margem Baixa'}
                                  {margemStatus.status === 'bad' && 'Margem Crítica'}
                                </span>
                              </div>
                              <span className="text-gray-500">
                                CMV: {formatPercentage(produto.cmvPercentual || 0)}
                              </span>
                              <span className="text-gray-500">
                                Lucro/un: {formatCurrency((produto.precoVenda || 0) - (produto.custoUnidade || 0))}
                              </span>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPrecoDialog(produto.id, produto.precoVenda || 0)}
                          >
                            <Tag className="w-4 h-4 mr-1" />
                            Ajustar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              {produtos.length === 0 
                ? 'Nenhum produto final cadastrado. Crie fichas técnicas na aba "Ficha Técnica".'
                : 'Nenhuma categoria encontrada para os produtos.'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Ajuste de Preço */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Preço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedFichaId && (
              <div className="p-3 bg-gray-50 rounded-lg">
                {(() => {
                  const ficha = produtos.find(p => p?.id === selectedFichaId);
                  const categoria = categoriasProduto.find(c => c?.id === ficha?.categoriaId);
                  if (!ficha || !categoria) return null;
                  
                  const precoIdeal = ficha.custoUnidade > 0 
                    ? ficha.custoUnidade / (1 - categoria.margemPadrao / 100) 
                    : 0;
                  const novoPrecoNum = parseFloat(novoPreco) || 0;
                  const novaMargem = novoPrecoNum > 0 && ficha.custoUnidade > 0
                    ? ((novoPrecoNum - ficha.custoUnidade) / novoPrecoNum) * 100 
                    : 0;
                  
                  return (
                    <>
                      <p className="font-medium text-gray-900">{ficha.nome}</p>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-gray-600">Custo: {formatCurrency(ficha.custoUnidade || 0)}</p>
                        <p className="text-gray-600">Preço ideal: {formatCurrency(precoIdeal)}</p>
                        <p className="text-gray-600">Margem ideal: {formatPercentage(categoria.margemPadrao)}</p>
                        {novoPrecoNum > 0 && (
                          <p className={`font-medium ${novaMargem >= categoria.margemPadrao ? 'text-emerald-600' : 'text-amber-600'}`}>
                            Nova margem: {formatPercentage(novaMargem)}
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            <div>
              <Label>Novo Preço</Label>
              <Input
                type="number"
                step="0.01"
                value={novoPreco}
                onChange={(e) => setNovoPreco(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
                onClick={handleAtualizarPreco}
                disabled={!novoPreco}
              >
                Atualizar Preço
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
