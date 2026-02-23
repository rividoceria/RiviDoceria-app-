import { useState } from 'react';
import { Plus, Trash2, Edit2, Package, ShoppingBag, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCard } from '@/components/ui-custom/AlertCard';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Ingrediente, UnidadeMedida } from '@/types';
import { useStorage } from '@/hooks/useStorage';
import { toast } from 'sonner';

const unidadesMedida: { value: UnidadeMedida; label: string }[] = [
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'un', label: 'Unidade (un)' },
  { value: 'cm', label: 'Centímetro (cm)' },
  { value: 'm', label: 'Metro (m)' },
];

export function Ingredientes() {
  const { data, addIngrediente, updateIngrediente, deleteIngrediente } = useStorage();
  
  const [activeTab, setActiveTab] = useState('ingredientes');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [nome, setNome] = useState('');
  const [quantidadeEmbalagem, setQuantidadeEmbalagem] = useState('');
  const [unidade, setUnidade] = useState<UnidadeMedida>('kg');
  const [precoEmbalagem, setPrecoEmbalagem] = useState('');
  const [estoqueAtual, setEstoqueAtual] = useState('0');
  const [estoqueMinimo, setEstoqueMinimo] = useState('0');

  const ingredientes = (data?.ingredientes || []).filter(i => i.tipo === 'ingrediente');
  const embalagens = (data?.ingredientes || []).filter(i => i.tipo === 'embalagem');
  const estoqueBaixo = (data?.ingredientes || []).filter(i => i.estoqueAtual <= i.estoqueMinimo);

  const calcularCustoUnidade = (qtd: number, preco: number): number => {
    if (qtd <= 0 || preco <= 0) return 0;
    return preco / qtd;
  };

  const handleSubmit = async () => {
    const qtd = parseFloat(quantidadeEmbalagem);
    const preco = parseFloat(precoEmbalagem);
    const custoUnidade = calcularCustoUnidade(qtd, preco);
    
    const itemData = {
      nome,
      quantidadeEmbalagem: qtd,
      unidade,
      precoEmbalagem: preco,
      custoUnidade,
      estoqueAtual: parseFloat(estoqueAtual) || 0,
      estoqueMinimo: parseFloat(estoqueMinimo) || 0,
      tipo: activeTab === 'ingredientes' ? 'ingrediente' as const : 'embalagem' as const,
    };

    if (editingId) {
      await updateIngrediente(editingId, itemData);
      setEditingId(null);
    } else {
      await addIngrediente(itemData);
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setNome('');
    setQuantidadeEmbalagem('');
    setUnidade('kg');
    setPrecoEmbalagem('');
    setEstoqueAtual('0');
    setEstoqueMinimo('0');
  };

  const handleEdit = (item: Ingrediente) => {
    setEditingId(item.id);
    setNome(item.nome);
    setQuantidadeEmbalagem(item.quantidadeEmbalagem.toString());
    setUnidade(item.unidade);
    setPrecoEmbalagem(item.precoEmbalagem.toString());
    setEstoqueAtual(item.estoqueAtual.toString());
    setEstoqueMinimo(item.estoqueMinimo.toString());
    setActiveTab(item.tipo === 'ingrediente' ? 'ingredientes' : 'embalagens');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteIngrediente(id);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const ItemCard = ({ item }: { item: Ingrediente }) => {
    const estoqueCritico = (item.estoqueAtual || 0) <= (item.estoqueMinimo || 0);
    
    return (
      <Card className={estoqueCritico ? 'border-red-200 bg-red-50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{item.nome || 'Sem nome'}</p>
                {estoqueCritico && (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <p className="text-gray-500">
                  Embalagem: <span className="text-gray-700">{formatNumber(item.quantidadeEmbalagem || 0)} {item.unidade}</span>
                </p>
                <p className="text-gray-500">
                  Preço: <span className="text-gray-700">{formatCurrency(item.precoEmbalagem || 0)}</span>
                </p>
                <p className="text-gray-500">
                  Custo/un: <span className="font-medium text-emerald-600">{formatCurrency(item.custoUnidade || 0)}</span>
                </p>
                <p className={`${estoqueCritico ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  Estoque: <span className={estoqueCritico ? 'text-red-700' : 'text-gray-700'}>
                    {formatNumber(item.estoqueAtual || 0)} embalagens
                  </span>
                  {estoqueCritico && ' (Baixo)'}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Mínimo: {formatNumber(item.estoqueMinimo || 0)} embalagens
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(item)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ingredientes e Embalagens</h2>
          <p className="text-gray-500">Cadastre seus insumos e controle o estoque</p>
        </div>
        <Button 
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
          onClick={handleOpenNew}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Alertas de Estoque Baixo */}
      {estoqueBaixo.length > 0 && (
        <AlertCard
          title="Estoque Baixo"
          message={`${estoqueBaixo.length} item(s) com estoque abaixo do mínimo: ${estoqueBaixo.map(i => i.nome).join(', ')}`}
          type="warning"
        />
      )}

      {/* Dialog de Cadastro */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Novo'} {activeTab === 'ingredientes' ? 'Ingrediente' : 'Embalagem'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={activeTab === 'ingredientes' ? 'Ex: Farinha de Trigo' : 'Ex: Caixa para Bolo'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Qtd. da Embalagem</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={quantidadeEmbalagem}
                  onChange={(e) => setQuantidadeEmbalagem(e.target.value)}
                  placeholder="Ex: 5"
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Select value={unidade} onValueChange={(v) => setUnidade(v as UnidadeMedida)}>
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
            <div>
              <Label>Preço da Embalagem</Label>
              <Input
                type="number"
                step="0.01"
                value={precoEmbalagem}
                onChange={(e) => setPrecoEmbalagem(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estoque Atual (embalagens)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={estoqueAtual}
                  onChange={(e) => setEstoqueAtual(e.target.value)}
                  placeholder="Ex: 5"
                />
              </div>
              <div>
                <Label>Estoque Mínimo (embalagens)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(e.target.value)}
                  placeholder="Ex: 2"
                />
              </div>
            </div>
            {quantidadeEmbalagem && precoEmbalagem && (
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-700">
                  Custo por {unidade}: <span className="font-bold">{formatCurrency(calcularCustoUnidade(parseFloat(quantidadeEmbalagem), parseFloat(precoEmbalagem)))}</span>
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
                disabled={!nome || !quantidadeEmbalagem || !precoEmbalagem}
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
          <TabsTrigger value="ingredientes" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Ingredientes ({ingredientes.length})
          </TabsTrigger>
          <TabsTrigger value="embalagens" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Embalagens ({embalagens.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ingredientes" className="mt-4">
          {ingredientes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhum ingrediente cadastrado
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ingredientes.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="embalagens" className="mt-4">
          {embalagens.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhuma embalagem cadastrada
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {embalagens.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
