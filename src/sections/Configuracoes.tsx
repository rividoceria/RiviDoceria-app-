import { useState, useRef } from 'react';
import { Percent, DollarSign, Tag, FolderOpen, Plus, Trash2, TrendingUp, PieChart, Download, Store, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatPercentage } from '@/lib/format';
import type { SistemaData, Configuracoes, CategoriaConta, CategoriaProduto, CustoFixo, CustoVariavel } from '@/types';

interface ConfiguracoesProps {
  data: SistemaData;
  onUpdateConfig: (config: Partial<Configuracoes>) => void;
  onAddCategoriaConta: (categoria: Omit<CategoriaConta, 'id'>) => void;
  onDeleteCategoriaConta: (id: string) => void;
  onAddCategoriaProduto: (categoria: Omit<CategoriaProduto, 'id'>) => void;
  onDeleteCategoriaProduto: (id: string) => void;
}

export function ConfiguracoesSection({ 
  data, 
  onUpdateConfig, 
  onAddCategoriaConta,
  onDeleteCategoriaConta,
  onAddCategoriaProduto,
  onDeleteCategoriaProduto,
}: ConfiguracoesProps) {
  const [activeTab, setActiveTab] = useState('geral');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'custoFixo' | 'custoVariavel' | 'categoriaConta' | 'categoriaProduto'>('custoFixo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [cor, setCor] = useState('#f472b6');
  const [tipo, setTipo] = useState<'fixa' | 'variavel'>('fixa');
  const [limiteGasto, setLimiteGasto] = useState('');
  const [margemPadrao, setMargemPadrao] = useState('');

  const { configuracoes, categoriasConta, categoriasProduto } = data;

  const handleAddCustoFixo = () => {
    if (!nome || !valor) return;
    const novoCusto: CustoFixo = {
      id: crypto.randomUUID(),
      nome,
      valor: parseFloat(valor),
    };
    onUpdateConfig({
      custosFixos: [...(configuracoes.custosFixos || []), novoCusto],
    });
    resetForm();
  };

  const handleDeleteCustoFixo = (id: string) => {
    onUpdateConfig({
      custosFixos: (configuracoes.custosFixos || []).filter(c => c.id !== id),
    });
  };

  const handleAddCustoVariavel = () => {
    if (!nome || !valor) return;
    const novoCusto: CustoVariavel = {
      id: crypto.randomUUID(),
      nome,
      valor: parseFloat(valor),
    };
    onUpdateConfig({
      custosVariaveis: [...(configuracoes.custosVariaveis || []), novoCusto],
    });
    resetForm();
  };

  const handleDeleteCustoVariavel = (id: string) => {
    onUpdateConfig({
      custosVariaveis: (configuracoes.custosVariaveis || []).filter(c => c.id !== id),
    });
  };

  const handleAddCategoriaConta = () => {
    if (!nome) return;
    onAddCategoriaConta({
      nome,
      tipo,
      limiteGasto: limiteGasto ? parseFloat(limiteGasto) : undefined,
      cor,
    });
    resetForm();
    setIsDialogOpen(false);
  };

  const handleAddCategoriaProduto = () => {
    if (!nome || !margemPadrao) return;
    onAddCategoriaProduto({
      nome,
      margemPadrao: parseFloat(margemPadrao),
      cor,
    });
    resetForm();
    setIsDialogOpen(false);
  };

  // Backup manual - Exportar JSON
  const handleExportBackup = () => {
    const backupData = {
      ...data,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const date = new Date();
    const dateStr = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}_${String(date.getDate()).padStart(2, '0')}`;
    link.download = `backup_docegestao_${dateStr}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Upload de logo (base64 para localStorage)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onUpdateConfig({ logoUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setNome('');
    setValor('');
    setCor('#f472b6');
    setTipo('fixa');
    setLimiteGasto('');
    setMargemPadrao('');
  };

  const openDialog = (type: typeof dialogType) => {
    setDialogType(type);
    resetForm();
    setIsDialogOpen(true);
  };

  const colors = [
    '#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa',
    '#f87171', '#22d3ee', '#fb923c', '#e879f9', '#84cc16',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
        <p className="text-gray-500">Personalize as configurações do sistema</p>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'categoriaConta' && 'Nova Categoria de Conta'}
              {dialogType === 'categoriaProduto' && 'Nova Categoria de Produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={dialogType === 'categoriaConta' ? 'Ex: Marketing' : 'Ex: Bolos'}
              />
            </div>
            
            {dialogType === 'categoriaConta' && (
              <div>
                <Label>Tipo</Label>
                <select 
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value as 'fixa' | 'variavel')}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="fixa">Fixa</option>
                  <option value="variavel">Variável</option>
                </select>
              </div>
            )}
            
            {dialogType === 'categoriaConta' && (
              <div>
                <Label>Limite de Gasto (opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={limiteGasto}
                  onChange={(e) => setLimiteGasto(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            )}
            
            {dialogType === 'categoriaProduto' && (
              <div>
                <Label>Margem Padrão (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={margemPadrao}
                  onChange={(e) => setMargemPadrao(e.target.value)}
                  placeholder="60"
                />
              </div>
            )}
            
            <div>
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${cor === c ? 'border-gray-900' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
                onClick={dialogType === 'categoriaConta' ? handleAddCategoriaConta : handleAddCategoriaProduto}
                disabled={!nome || (dialogType === 'categoriaProduto' && !margemPadrao)}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="geral" className="flex items-center gap-1">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="taxas" className="flex items-center gap-1">
            <Percent className="w-4 h-4" />
            <span className="hidden sm:inline">Taxas</span>
          </TabsTrigger>
          <TabsTrigger value="custos" className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Custos</span>
          </TabsTrigger>
          <TabsTrigger value="margens" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Margens</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-1">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-1">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Produtos</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Geral - Personalização */}
        <TabsContent value="geral" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-pink-500" />
                Personalização do Estabelecimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nome do Estabelecimento */}
              <div>
                <Label>Nome do Estabelecimento</Label>
                <Input
                  value={configuracoes.nomeEstabelecimento || ''}
                  onChange={(e) => onUpdateConfig({ nomeEstabelecimento: e.target.value })}
                  placeholder="Ex: Doce Sabor Confeitaria"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nome será exibido no menu lateral do sistema
                </p>
              </div>

              <Separator />

              {/* Logo */}
              <div>
                <Label>Logo do Estabelecimento</Label>
                <div className="mt-2 flex items-center gap-4">
                  {configuracoes.logoUrl ? (
                    <img 
                      src={configuracoes.logoUrl} 
                      alt="Logo"
                      className="w-20 h-20 rounded-xl object-cover border"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Store className="w-4 h-4 mr-2" />
                      {configuracoes.logoUrl ? 'Alterar Logo' : 'Upload da Logo'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB
                    </p>
                    {configuracoes.logoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-red-500"
                        onClick={() => onUpdateConfig({ logoUrl: undefined })}
                      >
                        Remover logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backup Manual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-500" />
                Backup Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Faça o download de todos os seus dados em formato JSON. 
                Você pode salvar este arquivo no Google Drive ou localmente para segurança extra.
              </p>
              <Button 
                onClick={handleExportBackup}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Backup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxas" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-pink-500" />
                Taxas por Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pix (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={configuracoes.taxas?.pix ?? 0}
                  onChange={(e) => onUpdateConfig({
                    taxas: { ...(configuracoes.taxas || { pix: 0, debito: 1.5, credito: 3.5 }), pix: parseFloat(e.target.value) || 0 }
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">Geralmente 0% para Pix</p>
              </div>
              <div>
                <Label>Cartão Débito (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={configuracoes.taxas?.debito ?? 1.5}
                  onChange={(e) => onUpdateConfig({
                    taxas: { ...(configuracoes.taxas || { pix: 0, debito: 1.5, credito: 3.5 }), debito: parseFloat(e.target.value) || 0 }
                  })}
                />
              </div>
              <div>
                <Label>Cartão Crédito (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={configuracoes.taxas?.credito ?? 3.5}
                  onChange={(e) => onUpdateConfig({
                    taxas: { ...(configuracoes.taxas || { pix: 0, debito: 1.5, credito: 3.5 }), credito: parseFloat(e.target.value) || 0 }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custos" className="mt-4 space-y-4">
          {/* Custos Fixos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                Custos Fixos Mensais
              </CardTitle>
              <div className="text-sm text-gray-500">
                Total: {formatCurrency((configuracoes.custosFixos || []).reduce((acc, c) => acc + (c?.valor || 0), 0))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do custo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-32"
                />
                <Button onClick={handleAddCustoFixo} disabled={!nome || !valor}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {(configuracoes.custosFixos || []).map((custo) => (
                  <div key={custo?.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{custo?.nome || ''}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(custo?.valor || 0)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => handleDeleteCustoFixo(custo?.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custos Variáveis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                Custos Variáveis Mensais
              </CardTitle>
              <div className="text-sm text-gray-500">
                Total: {formatCurrency((configuracoes.custosVariaveis || []).reduce((acc, c) => acc + (c?.valor || 0), 0))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do custo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-32"
                />
                <Button onClick={handleAddCustoVariavel} disabled={!nome || !valor}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {(configuracoes.custosVariaveis || []).map((custo) => (
                  <div key={custo?.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{custo?.nome || ''}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(custo?.valor || 0)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => handleDeleteCustoVariavel(custo?.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margens" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                Configurações de Margem e CMV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>CMV Percentual Padrão (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={configuracoes.cmvPercentualPadrao ?? 30}
                  onChange={(e) => onUpdateConfig({
                    cmvPercentualPadrao: parseFloat(e.target.value) || 30
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Percentual do faturamento que representa o custo da mercadoria vendida. 
                  Padrão recomendado: 25-35%
                </p>
              </div>
              <div>
                <Label>Margem de Lucro Padrão (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={configuracoes.margemLucroPadrao ?? 60}
                  onChange={(e) => onUpdateConfig({
                    margemLucroPadrao: parseFloat(e.target.value) || 60
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Margem de lucro sugerida para novos produtos. 
                  Padrão recomendado: 50-70%
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-violet-500" />
                Categorias de Contas
              </CardTitle>
              <Button size="sm" onClick={() => openDialog('categoriaConta')}>
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(categoriasConta || []).map((cat) => (
                  <div key={cat?.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: cat?.cor || '#ccc' }}
                      />
                      <div>
                        <span className="font-medium">{cat?.nome || ''}</span>
                        <span className="text-xs text-gray-500 ml-2">({cat?.tipo || ''})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {cat?.limiteGasto && (
                        <span className="text-sm text-gray-500">
                          Limite: {formatCurrency(cat.limiteGasto)}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => onDeleteCategoriaConta(cat?.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produtos" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-pink-500" />
                Categorias de Produtos
              </CardTitle>
              <Button size="sm" onClick={() => openDialog('categoriaProduto')}>
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(categoriasProduto || []).map((cat) => (
                  <div key={cat?.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: cat?.cor || '#ccc' }}
                      />
                      <span className="font-medium">{cat?.nome || ''}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        Margem padrão: {formatPercentage(cat?.margemPadrao || 0)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => onDeleteCategoriaProduto(cat?.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
