import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, ChefHat, Package, Box, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';
import type { SistemaData, FichaTecnica, ItemFichaTecnica, TipoProduto, UnidadeMedida } from '@/types';

interface FichaTecnicaProps {
  data: SistemaData;
  onAddFicha: (ficha: Omit<FichaTecnica, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateFicha: (id: string, updates: Partial<FichaTecnica>) => void;
  onDeleteFicha: (id: string) => void;
}

const unidadesMedida: { value: UnidadeMedida; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'L', label: 'L' },
  { value: 'ml', label: 'ml' },
  { value: 'un', label: 'un' },
];

export function FichaTecnicaSection({ data, onAddFicha, onUpdateFicha, onDeleteFicha }: FichaTecnicaProps) {
  const [activeTab, setActiveTab] = useState('receitas');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingFicha, setViewingFicha] = useState<FichaTecnica | null>(null);
  
  // Form states
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoProduto>('receita_base');
  const [categoriaId, setCategoriaId] = useState('');
  const [receitasBaseIds, setReceitasBaseIds] = useState<string[]>([]);
  const [itens, setItens] = useState<ItemFichaTecnica[]>([]);
  const [itensEmbalagem, setItensEmbalagem] = useState<ItemFichaTecnica[]>([]);
  const [rendimentoQuantidade, setRendimentoQuantidade] = useState('');
  const [rendimentoUnidade, setRendimentoUnidade] = useState<UnidadeMedida>('un');
  const [precoVenda, setPrecoVenda] = useState('');
  const [validadeDias, setValidadeDias] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Item form
  const [ingredienteId, setIngredienteId] = useState('');
  const [quantidadeItem, setQuantidadeItem] = useState('');
  const [unidadeItem, setUnidadeItem] = useState<UnidadeMedida>('g');
  const [itemType, setItemType] = useState<'ingrediente' | 'embalagem'>('ingrediente');

  // Garantir que os arrays existam com proteção máxima
  const fichasTecnicas = useMemo(() => data?.fichasTecnicas || [], [data?.fichasTecnicas]);
  const ingredientes = useMemo(() => data?.ingredientes || [], [data?.ingredientes]);
  const categoriasProduto = useMemo(() => data?.categoriasProduto || [], [data?.categoriasProduto]);

  const receitasBase = useMemo(() => 
    fichasTecnicas.filter(f => f?.tipo === 'receita_base'),
    [fichasTecnicas]
  );
  
  const produtosFinais = useMemo(() => 
    fichasTecnicas.filter(f => f?.tipo === 'produto_final'),
    [fichasTecnicas]
  );

  // Calcular custo total incluindo receitas base selecionadas
  const custoTotal = useMemo(() => {
    let custo = 0;
    
    // Custo das receitas base selecionadas (múltiplas)
    if (receitasBaseIds && receitasBaseIds.length > 0) {
      receitasBaseIds.forEach(id => {
        const receitaBase = fichasTecnicas.find(f => f?.id === id);
        if (receitaBase) {
          custo += receitaBase.custoTotal || 0;
        }
      });
    }
    
    // Custo dos ingredientes adicionais
    custo += (itens || []).reduce((acc, item) => {
      if (!item) return acc;
      const ingrediente = ingredientes.find(i => i?.id === item.ingredienteId);
      if (ingrediente) {
        return acc + ((item.quantidade || 0) * (ingrediente.custoUnidade || 0));
      }
      return acc;
    }, 0);
    
    // Custo das embalagens
    custo += (itensEmbalagem || []).reduce((acc, item) => {
      if (!item) return acc;
      const ingrediente = ingredientes.find(i => i?.id === item.ingredienteId);
      if (ingrediente) {
        return acc + ((item.quantidade || 0) * (ingrediente.custoUnidade || 0));
      }
      return acc;
    }, 0);
    
    return custo;
  }, [itens, itensEmbalagem, receitasBaseIds, fichasTecnicas, ingredientes]);

  const custoUnidade = useMemo(() => {
    const rendimento = parseFloat(rendimentoQuantidade) || 1;
    return rendimento > 0 ? custoTotal / rendimento : 0;
  }, [custoTotal, rendimentoQuantidade]);

  const margemLucro = useMemo(() => {
    const preco = parseFloat(precoVenda) || 0;
    if (preco <= 0 || custoUnidade <= 0) return 0;
    return ((preco - custoUnidade) / preco) * 100;
  }, [precoVenda, custoUnidade]);

  const cmvPercentual = useMemo(() => {
    const preco = parseFloat(precoVenda) || 0;
    if (preco <= 0 || custoUnidade <= 0) return 0;
    return (custoUnidade / preco) * 100;
  }, [precoVenda, custoUnidade]);

  // Custo total das receitas base selecionadas
  const custoReceitasBase = useMemo(() => {
    if (!receitasBaseIds || receitasBaseIds.length === 0) return 0;
    return receitasBaseIds.reduce((total, id) => {
      const receita = fichasTecnicas.find(f => f?.id === id);
      return total + (receita?.custoTotal || 0);
    }, 0);
  }, [receitasBaseIds, fichasTecnicas]);

  const handleAddItem = () => {
    if (!ingredienteId || !quantidadeItem) return;
    
    const ingrediente = ingredientes.find(i => i?.id === ingredienteId);
    if (!ingrediente) return;
    
    const custo = parseFloat(quantidadeItem) * (ingrediente.custoUnidade || 0);
    const novoItem: ItemFichaTecnica = {
      ingredienteId,
      quantidade: parseFloat(quantidadeItem),
      unidade: unidadeItem,
      custo,
    };
    
    if (itemType === 'embalagem') {
      setItensEmbalagem(prev => [...(prev || []), novoItem]);
    } else {
      setItens(prev => [...(prev || []), novoItem]);
    }
    
    setIngredienteId('');
    setQuantidadeItem('');
  };

  const handleRemoveItem = (index: number, type: 'ingrediente' | 'embalagem') => {
    if (type === 'embalagem') {
      setItensEmbalagem(prev => (prev || []).filter((_, i) => i !== index));
    } else {
      setItens(prev => (prev || []).filter((_, i) => i !== index));
    }
  };

  // Adicionar ou remover receita base
  const toggleReceitaBase = (receitaId: string) => {
    if (receitasBaseIds.includes(receitaId)) {
      setReceitasBaseIds(prev => prev.filter(id => id !== receitaId));
    } else {
      setReceitasBaseIds(prev => [...prev, receitaId]);
    }
  };

  const removeReceitaBase = (receitaId: string) => {
    setReceitasBaseIds(prev => prev.filter(id => id !== receitaId));
  };

  const handleSubmit = () => {
    if (!nome || !categoriaId || !rendimentoQuantidade) return;

    const fichaData = {
      nome,
      tipo,
      categoriaId,
      receitasBaseIds: receitasBaseIds.length > 0 ? receitasBaseIds : undefined,
      itens: itens || [],
      itensEmbalagem: itensEmbalagem || [],
      rendimentoQuantidade: parseFloat(rendimentoQuantidade) || 1,
      rendimentoUnidade,
      custoTotal,
      custoUnidade,
      precoVenda: parseFloat(precoVenda) || 0,
      margemLucro,
      cmvPercentual,
      validadeDias: validadeDias ? parseInt(validadeDias) : undefined,
      descricao,
    };

    if (editingId) {
      onUpdateFicha(editingId, fichaData);
      setEditingId(null);
    } else {
      onAddFicha(fichaData);
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setNome('');
    setTipo('receita_base');
    setCategoriaId('');
    setReceitasBaseIds([]);
    setItens([]);
    setItensEmbalagem([]);
    setRendimentoQuantidade('');
    setRendimentoUnidade('un');
    setPrecoVenda('');
    setValidadeDias('');
    setDescricao('');
  };

  const handleEdit = (ficha: FichaTecnica) => {
    if (!ficha) return;
    setEditingId(ficha.id);
    setNome(ficha.nome || '');
    setTipo(ficha.tipo || 'receita_base');
    setCategoriaId(ficha.categoriaId || '');
    setReceitasBaseIds(ficha.receitasBaseIds || []);
    setItens(ficha.itens || []);
    setItensEmbalagem(ficha.itensEmbalagem || []);
    setRendimentoQuantidade(ficha.rendimentoQuantidade?.toString() || '');
    setRendimentoUnidade(ficha.rendimentoUnidade || 'un');
    setPrecoVenda(ficha.precoVenda?.toString() || '');
    setValidadeDias(ficha.validadeDias?.toString() || '');
    setDescricao(ficha.descricao || '');
    setActiveTab(ficha.tipo === 'receita_base' ? 'receitas' : 'produtos');
    setIsDialogOpen(true);
  };

  const handleOpenNew = (tipoInicial: TipoProduto) => {
    setEditingId(null);
    resetForm();
    setTipo(tipoInicial);
    setActiveTab(tipoInicial === 'receita_base' ? 'receitas' : 'produtos');
    setIsDialogOpen(true);
  };

  const FichaCard = ({ ficha }: { ficha: FichaTecnica }) => {
    if (!ficha) return null;
    
    const categoria = categoriasProduto.find(c => c?.id === ficha.categoriaId);
    const receitasBaseVinculadas = (ficha.receitasBaseIds || [])
      .map(id => fichasTecnicas.find(f => f?.id === id))
      .filter(Boolean);
    
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setViewingFicha(ficha)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 truncate">{ficha.nome || 'Sem nome'}</p>
                {categoria && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: (categoria.cor || '#ccc') + '20', color: categoria.cor }}
                  >
                    {categoria.nome}
                  </span>
                )}
              </div>
              {/* Mostrar múltiplas receitas base */}
              {receitasBaseVinculadas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {receitasBaseVinculadas.map((receita, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                      Base: {receita?.nome}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <p className="text-gray-500">
                  Custo: <span className="font-medium text-gray-700">{formatCurrency(ficha.custoTotal || 0)}</span>
                </p>
                <p className="text-gray-500">
                  Rendimento: <span className="text-gray-700">{ficha.rendimentoQuantidade || 0} {ficha.rendimentoUnidade || 'un'}</span>
                </p>
                {ficha.tipo === 'produto_final' && (
                  <>
                    <p className="text-gray-500">
                      Preço: <span className="font-medium text-gray-700">{formatCurrency(ficha.precoVenda || 0)}</span>
                    </p>
                    <p className="text-gray-500">
                      Margem: <span className={`font-medium ${(ficha.margemLucro || 0) >= 50 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {formatPercentage(ficha.margemLucro || 0)}
                      </span>
                    </p>
                  </>
                )}
                {ficha.validadeDias && (
                  <p className="text-gray-500 col-span-2">
                    Validade: <span className="text-gray-700">{ficha.validadeDias} dias</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(ficha)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDeleteFicha(ficha.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Verificar se há categorias cadastradas
  const temCategorias = categoriasProduto.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ficha Técnica</h2>
          <p className="text-gray-500">Cadastre receitas e produtos com custos detalhados</p>
        </div>
      </div>

      {/* Alertas */}
      {!temCategorias && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-700">
            Cadastre categorias de produtos em Configurações antes de criar fichas técnicas.
          </AlertDescription>
        </Alert>
      )}

      {/* Dialog de Visualização */}
      <Dialog open={!!viewingFicha} onOpenChange={() => setViewingFicha(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              {viewingFicha?.nome || 'Detalhes'}
            </DialogTitle>
          </DialogHeader>
          {viewingFicha && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Custo Total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(viewingFicha.custoTotal || 0)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Custo por Unidade</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(viewingFicha.custoUnidade || 0)}</p>
                </div>
              </div>
              
              {/* Receitas Base (múltiplas) */}
              {(viewingFicha.receitasBaseIds || []).length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium mb-2">
                    Receitas Base ({viewingFicha.receitasBaseIds?.length}):
                  </p>
                  <div className="space-y-1">
                    {(viewingFicha.receitasBaseIds || []).map((id, idx) => {
                      const receita = fichasTecnicas.find(f => f?.id === id);
                      return receita ? (
                        <p key={idx} className="text-gray-900 text-sm">
                          • {receita.nome} ({formatCurrency(receita.custoTotal || 0)})
                        </p>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {/* Ingredientes */}
              {(viewingFicha.itens || []).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Ingredientes Adicionais</h4>
                  <div className="space-y-2">
                    {(viewingFicha.itens || []).map((item, idx) => {
                      if (!item) return null;
                      const ing = ingredientes.find(i => i?.id === item.ingredienteId);
                      return (
                        <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{ing?.nome || 'Desconhecido'}</span>
                          <span className="text-sm text-gray-600">
                            {formatNumber(item.quantidade || 0)} {item.unidade || ''} = {formatCurrency(item.custo || 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Embalagens */}
              {(viewingFicha.itensEmbalagem || []).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    Embalagens
                  </h4>
                  <div className="space-y-2">
                    {(viewingFicha.itensEmbalagem || []).map((item, idx) => {
                      if (!item) return null;
                      const ing = ingredientes.find(i => i?.id === item.ingredienteId);
                      return (
                        <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{ing?.nome || 'Desconhecido'}</span>
                          <span className="text-sm text-gray-600">
                            {formatNumber(item.quantidade || 0)} {item.unidade || ''} = {formatCurrency(item.custo || 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewingFicha.tipo === 'produto_final' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Preço de Venda</p>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(viewingFicha.precoVenda || 0)}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-600">Margem de Lucro</p>
                    <p className="text-lg font-bold text-emerald-700">{formatPercentage(viewingFicha.margemLucro || 0)}</p>
                  </div>
                  {viewingFicha.validadeDias && (
                    <div className="p-3 bg-amber-50 rounded-lg col-span-2">
                      <p className="text-sm text-amber-600">Validade</p>
                      <p className="text-lg font-bold text-amber-700">{viewingFicha.validadeDias} dias</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Cadastro */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Nova'} Ficha Técnica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoProduto)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita_base">Receita Base</SelectItem>
                    <SelectItem value="produto_final">Produto Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria *</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasProduto.length === 0 && (
                      <SelectItem value="" disabled>Nenhuma categoria cadastrada</SelectItem>
                    )}
                    {categoriasProduto.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Nome *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Massa de Bolo de Chocolate"
              />
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Modo de preparo, observações..."
              />
            </div>

            {/* Seleção de Múltiplas Receitas Base */}
            {tipo === 'produto_final' && (
              <div className="space-y-2">
                <Label>Receitas Base (opcional)</Label>
                <div className="border rounded-lg p-3 space-y-3">
                  {/* Receitas selecionadas (chips) */}
                  {receitasBaseIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {receitasBaseIds.map((id) => {
                        const receita = receitasBase.find(r => r?.id === id);
                        return receita ? (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full"
                          >
                            {receita.nome}
                            <button
                              onClick={() => removeReceitaBase(id)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  {/* Lista de receitas disponíveis */}
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {receitasBase.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">
                        Nenhuma receita base cadastrada
                      </p>
                    ) : (
                      receitasBase.map((receita) => {
                        const isSelected = receitasBaseIds.includes(receita.id);
                        return (
                          <div
                            key={receita.id}
                            onClick={() => toggleReceitaBase(receita.id)}
                            className={`
                              flex items-center justify-between p-2 rounded cursor-pointer
                              ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`
                                w-4 h-4 rounded border flex items-center justify-center
                                ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                              `}>
                                {isSelected && <span className="text-white text-xs">✓</span>}
                              </div>
                              <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                                {receita.nome}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatCurrency(receita.custoTotal || 0)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Custo total das receitas selecionadas */}
                  {receitasBaseIds.length > 0 && (
                    <div className="pt-2 border-t text-sm text-gray-600">
                      Custo total das receitas base: 
                      <span className="font-semibold text-gray-800 ml-1">
                        {formatCurrency(custoReceitasBase)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Adicionar Ingredientes/Embalagens */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Ingredientes e Embalagens
              </Label>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={itemType} onValueChange={(v) => setItemType(v as 'ingrediente' | 'embalagem')}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingrediente">Ingrediente</SelectItem>
                    <SelectItem value="embalagem">Embalagem</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ingredienteId} onValueChange={setIngredienteId}>
                  <SelectTrigger className="flex-1 min-w-[150px]">
                    <SelectValue placeholder={ingredientes.length === 0 ? "Cadastre ingredientes" : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredientes.length === 0 && (
                      <SelectItem value="" disabled>Nenhum ingrediente cadastrado</SelectItem>
                    )}
                    {ingredientes
                      .filter(ing => itemType === 'embalagem' ? ing?.tipo === 'embalagem' : ing?.tipo === 'ingrediente')
                      .map((ing) => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.nome} ({formatCurrency(ing.custoUnidade || 0)}/{ing.unidade})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Qtd"
                  value={quantidadeItem}
                  onChange={(e) => setQuantidadeItem(e.target.value)}
                  className="w-20"
                />
                <Select value={unidadeItem} onValueChange={(v) => setUnidadeItem(v as UnidadeMedida)}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={!ingredienteId || !quantidadeItem}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Lista de Ingredientes */}
              {(itens || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Ingredientes Adicionais</p>
                  {(itens || []).map((item, idx) => {
                    if (!item) return null;
                    const ing = ingredientes.find(i => i?.id === item.ingredienteId);
                    return (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{ing?.nome || 'Desconhecido'} - {formatNumber(item.quantidade || 0)} {item.unidade || ''}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{formatCurrency(item.custo || 0)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => handleRemoveItem(idx, 'ingrediente')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Lista de Embalagens */}
              {(itensEmbalagem || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    Embalagens
                  </p>
                  {(itensEmbalagem || []).map((item, idx) => {
                    if (!item) return null;
                    const ing = ingredientes.find(i => i?.id === item.ingredienteId);
                    return (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{ing?.nome || 'Desconhecido'} - {formatNumber(item.quantidade || 0)} {item.unidade || ''}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{formatCurrency(item.custo || 0)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => handleRemoveItem(idx, 'embalagem')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Custo Total */}
              <div className="flex justify-between p-2 bg-emerald-50 rounded font-medium">
                <span>Custo Total:</span>
                <span className="text-emerald-600">{formatCurrency(custoTotal)}</span>
              </div>
            </div>

            {/* Rendimento e Validade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rendimento (quantidade) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={rendimentoQuantidade}
                  onChange={(e) => setRendimentoQuantidade(e.target.value)}
                  placeholder="Ex: 10"
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={rendimentoUnidade} onValueChange={(v) => setRendimentoUnidade(v as UnidadeMedida)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesMedida.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preço de Venda e Validade (apenas para produto final) */}
            {tipo === 'produto_final' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preço de Venda</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={precoVenda}
                      onChange={(e) => setPrecoVenda(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label>Validade (dias) *</Label>
                    <Input
                      type="number"
                      value={validadeDias}
                      onChange={(e) => setValidadeDias(e.target.value)}
                      placeholder="Ex: 7"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Número de dias de validade do produto
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Custo por Unidade</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(custoUnidade)}</p>
              </div>
              {tipo === 'produto_final' && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Margem de Lucro</p>
                    <p className={`text-lg font-bold ${margemLucro >= 50 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {formatPercentage(margemLucro)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CMV (%)</p>
                    <p className="text-lg font-bold text-blue-600">{formatPercentage(cmvPercentual)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lucro/un</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency((parseFloat(precoVenda) || 0) - custoUnidade)}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
                onClick={handleSubmit}
                disabled={!nome || !categoriaId || !rendimentoQuantidade || (tipo === 'produto_final' && !validadeDias)}
              >
                {editingId ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receitas" className="flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            Receitas Base ({receitasBase.length})
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos Finais ({produtosFinais.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="receitas" className="mt-4">
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => handleOpenNew('receita_base')}
              className="w-full"
              disabled={!temCategorias}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita Base
            </Button>
          </div>
          {receitasBase.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                {temCategorias 
                  ? 'Nenhuma receita base cadastrada' 
                  : 'Cadastre categorias em Configurações primeiro'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receitasBase.map((ficha) => (
                <FichaCard key={ficha?.id} ficha={ficha} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="produtos" className="mt-4">
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => handleOpenNew('produto_final')}
              className="w-full"
              disabled={!temCategorias}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto Final
            </Button>
          </div>
          {produtosFinais.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                {temCategorias 
                  ? 'Nenhum produto final cadastrado' 
                  : 'Cadastre categorias em Configurações primeiro'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {produtosFinais.map((ficha) => (
                <FichaCard key={ficha?.id} ficha={ficha} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
