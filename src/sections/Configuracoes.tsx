import { useState, useRef, useEffect } from 'react';
import { Percent, DollarSign, Tag, FolderOpen, Plus, Trash2, TrendingUp, PieChart, Download, Store, Image, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { useStorage } from '@/hooks/useStorage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { CategoriaConta, CategoriaProduto, CustoFixo, CustoVariavel } from '@/types';
import { toast } from 'sonner';

interface ConfiguracoesProps {
  data: any;
}

export function ConfiguracoesSection({ data }: ConfiguracoesProps) {
  const { user } = useAuth();
  const { updateConfiguracoes } = useStorage();
  
  const [activeTab, setActiveTab] = useState('geral');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'categoriaConta' | 'categoriaProduto'>('categoriaConta');
  const [editandoCategoria, setEditandoCategoria] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para custos fixos
  const [nomeFixo, setNomeFixo] = useState('');
  const [valorFixo, setValorFixo] = useState('');
  const [editandoFixo, setEditandoFixo] = useState<string | null>(null);
  
  // Estados para custos variáveis
  const [nomeVariavel, setNomeVariavel] = useState('');
  const [valorVariavel, setValorVariavel] = useState('');
  const [editandoVariavel, setEditandoVariavel] = useState<string | null>(null);
  
  // Estados para categorias
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#f472b6');
  const [tipo, setTipo] = useState<'fixa' | 'variavel'>('fixa');
  const [limiteGasto, setLimiteGasto] = useState('');
  const [margemPadrao, setMargemPadrao] = useState('');

  // Estados para taxas
  const [taxas, setTaxas] = useState(data.configuracoes?.taxas || { pix: 0, debito: 1.5, credito: 3.5 });

  // Estados para margens
  const [cmvPercentual, setCmvPercentual] = useState(data.configuracoes?.cmvPercentualPadrao?.toString() || '30');
  const [margemLucro, setMargemLucro] = useState(data.configuracoes?.margemLucroPadrao?.toString() || '60');

  // Estados para configurações gerais
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState(data.configuracoes?.nomeEstabelecimento || '');
  const [logoUrl, setLogoUrl] = useState(data.configuracoes?.logoUrl || '');

  const { configuracoes, categoriasConta, categoriasProduto } = data;

  // ========== FUNÇÃO PARA RECARREGAR DADOS ==========
  const reloadData = async () => {
    if (!user) return;
    
    // Forçar recarregamento dos dados (a página vai recarregar os dados do Supabase)
    window.location.reload();
  };

  // ========== CUSTOS FIXOS ==========
  const handleAddCustoFixo = async () => {
    if (!user || !nomeFixo || !valorFixo) return;

    const novoCusto = {
      user_id: user.id,
      nome: nomeFixo,
      valor: parseFloat(valorFixo),
    };

    const { data: novo, error } = await supabase
      .from('custos_fixos')
      .insert([novoCusto])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar custo fixo:', error);
      toast.error('Erro ao adicionar custo fixo');
      return;
    }

    const novosCustosFixos = [...(configuracoes.custosFixos || []), novo];
    await updateConfiguracoes({ custosFixos: novosCustosFixos });
    
    setNomeFixo('');
    setValorFixo('');
    toast.success('Custo fixo adicionado com sucesso!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  const handleDeleteCustoFixo = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('custos_fixos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar custo fixo:', error);
      toast.error('Erro ao deletar custo fixo');
      return;
    }

    const novosCustosFixos = (configuracoes.custosFixos || []).filter((c: CustoFixo) => c.id !== id);
    await updateConfiguracoes({ custosFixos: novosCustosFixos });
    toast.success('Custo fixo removido!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  const handleSaveEditFixo = async (id: string) => {
    if (!user || !nomeFixo || !valorFixo) return;

    const { error } = await supabase
      .from('custos_fixos')
      .update({
        nome: nomeFixo,
        valor: parseFloat(valorFixo),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao atualizar custo fixo:', error);
      toast.error('Erro ao atualizar custo fixo');
      return;
    }

    const custosAtualizados = (configuracoes.custosFixos || []).map((custo: CustoFixo) => 
      custo.id === id 
        ? { ...custo, nome: nomeFixo, valor: parseFloat(valorFixo) }
        : custo
    );
    await updateConfiguracoes({ custosFixos: custosAtualizados });
    
    setEditandoFixo(null);
    setNomeFixo('');
    setValorFixo('');
    toast.success('Custo fixo atualizado!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  // ========== CUSTOS VARIÁVEIS ==========
  const handleAddCustoVariavel = async () => {
    if (!user || !nomeVariavel || !valorVariavel) return;

    const novoCusto = {
      user_id: user.id,
      nome: nomeVariavel,
      valor: parseFloat(valorVariavel),
    };

    const { data: novo, error } = await supabase
      .from('custos_variaveis')
      .insert([novoCusto])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar custo variável:', error);
      toast.error('Erro ao adicionar custo variável');
      return;
    }

    const novosCustosVariaveis = [...(configuracoes.custosVariaveis || []), novo];
    await updateConfiguracoes({ custosVariaveis: novosCustosVariaveis });
    
    setNomeVariavel('');
    setValorVariavel('');
    toast.success('Custo variável adicionado!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  const handleDeleteCustoVariavel = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('custos_variaveis')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar custo variável:', error);
      toast.error('Erro ao deletar custo variável');
      return;
    }

    const novosCustosVariaveis = (configuracoes.custosVariaveis || []).filter((c: CustoVariavel) => c.id !== id);
    await updateConfiguracoes({ custosVariaveis: novosCustosVariaveis });
    toast.success('Custo variável removido!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  const handleSaveEditVariavel = async (id: string) => {
    if (!user || !nomeVariavel || !valorVariavel) return;

    const { error } = await supabase
      .from('custos_variaveis')
      .update({
        nome: nomeVariavel,
        valor: parseFloat(valorVariavel),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao atualizar custo variável:', error);
      toast.error('Erro ao atualizar custo variável');
      return;
    }

    const custosAtualizados = (configuracoes.custosVariaveis || []).map((custo: CustoVariavel) => 
      custo.id === id 
        ? { ...custo, nome: nomeVariavel, valor: parseFloat(valorVariavel) }
        : custo
    );
    await updateConfiguracoes({ custosVariaveis: custosAtualizados });
    
    setEditandoVariavel(null);
    setNomeVariavel('');
    setValorVariavel('');
    toast.success('Custo variável atualizado!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  // ========== CATEGORIAS DE CONTAS ==========
  const handleAddCategoriaConta = async () => {
    if (!user || !nome) return;

    const novaCategoria = {
      user_id: user.id,
      nome,
      tipo,
      limite_gasto: limiteGasto ? parseFloat(limiteGasto) : null,
      cor,
    };

    const { error } = await supabase
      .from('categorias_contas')
      .insert([novaCategoria])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar categoria de conta:', error);
      toast.error('Erro ao adicionar categoria');
      return;
    }

    resetCategoriaForm();
    setIsDialogOpen(false);
    toast.success('Categoria adicionada com sucesso!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  const handleSaveEditCategoriaConta = async (id: string) => {
    if (!user || !nome) return;

    const { error } = await supabase
      .from('categorias_contas')
      .update({
        nome,
        tipo,
        limite_gasto: limiteGasto ? parseFloat(limiteGasto) : null,
        cor,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao atualizar categoria de conta:', error);
      toast.error('Erro ao atualizar categoria');
      return;
    }

    setEditandoCategoria(null);
    resetCategoriaForm();
    toast.success('Categoria atualizada!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  const handleDeleteCategoriaConta = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('categorias_contas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar categoria de conta:', error);
      toast.error('Erro ao deletar categoria');
      return;
    }

    toast.success('Categoria deletada!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  // ========== CATEGORIAS DE PRODUTOS ==========
  const handleAddCategoriaProduto = async () => {
    if (!user || !nome || !margemPadrao) return;

    const novaCategoria = {
      user_id: user.id,
      nome,
      margem_padrao: parseFloat(margemPadrao),
      cor,
    };

    const { error } = await supabase
      .from('categorias_produtos')
      .insert([novaCategoria])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar categoria de produto:', error);
      toast.error('Erro ao adicionar categoria');
      return;
    }

    resetCategoriaForm();
    setIsDialogOpen(false);
    toast.success('Categoria adicionada com sucesso!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  const handleSaveEditCategoriaProduto = async (id: string) => {
    if (!user || !nome || !margemPadrao) return;

    const { error } = await supabase
      .from('categorias_produtos')
      .update({
        nome,
        margem_padrao: parseFloat(margemPadrao),
        cor,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao atualizar categoria de produto:', error);
      toast.error('Erro ao atualizar categoria');
      return;
    }

    setEditandoCategoria(null);
    resetCategoriaForm();
    toast.success('Categoria atualizada!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  const handleDeleteCategoriaProduto = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('categorias_produtos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar categoria de produto:', error);
      toast.error('Erro ao deletar categoria');
      return;
    }

    toast.success('Categoria deletada!');
    
    // Recarregar para garantir consistência
    setTimeout(() => reloadData(), 500);
  };

  // ========== TAXAS ==========
  const handleTaxaChange = async (campo: 'pix' | 'debito' | 'credito', valor: string) => {
    const novasTaxas = { ...taxas, [campo]: parseFloat(valor) || 0 };
    setTaxas(novasTaxas);
    
    if (user) {
      await supabase
        .from('configuracoes')
        .upsert({
          user_id: user.id,
          taxas: novasTaxas,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      await updateConfiguracoes({ taxas: novasTaxas });
    }
  };

  // ========== MARGENS ==========
  const handleCmvChange = async (valor: string) => {
    setCmvPercentual(valor);
    const numValor = parseFloat(valor) || 30;
    
    if (user) {
      await supabase
        .from('configuracoes')
        .upsert({
          user_id: user.id,
          cmv_percentual_padrao: numValor,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      await updateConfiguracoes({ cmvPercentualPadrao: numValor });
    }
  };

  const handleMargemChange = async (valor: string) => {
    setMargemLucro(valor);
    const numValor = parseFloat(valor) || 60;
    
    if (user) {
      await supabase
        .from('configuracoes')
        .upsert({
          user_id: user.id,
          margem_lucro_padrao: numValor,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      await updateConfiguracoes({ margemLucroPadrao: numValor });
    }
  };

  // ========== CONFIGURAÇÕES GERAIS ==========
  const handleNomeEstabelecimentoChange = async (valor: string) => {
    setNomeEstabelecimento(valor);
    
    if (user) {
      await supabase
        .from('configuracoes')
        .upsert({
          user_id: user.id,
          nome_estabelecimento: valor,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      await updateConfiguracoes({ nomeEstabelecimento: valor });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setLogoUrl(base64);
      
      await supabase
        .from('configuracoes')
        .upsert({
          user_id: user.id,
          logo_url: base64,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      await updateConfiguracoes({ logoUrl: base64 });
      toast.success('Logo atualizada!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setLogoUrl('');
    if (user) {
      await supabase
        .from('configuracoes')
        .upsert({
          user_id: user.id,
          logo_url: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      await updateConfiguracoes({ logoUrl: undefined });
      toast.success('Logo removida!');
    }
  };

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

  const resetCategoriaForm = () => {
    setNome('');
    setCor('#f472b6');
    setTipo('fixa');
    setLimiteGasto('');
    setMargemPadrao('');
  };

  const openDialog = (type: 'categoriaConta' | 'categoriaProduto') => {
    setDialogType(type);
    resetCategoriaForm();
    setIsDialogOpen(true);
  };

  const colors = [
    '#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa',
    '#f87171', '#22d3ee', '#fb923c', '#e879f9', '#84cc16',
  ];

  const totalFixos = (configuracoes.custosFixos || []).reduce((acc: number, c: CustoFixo) => acc + (c?.valor || 0), 0);
  const totalVariaveis = (configuracoes.custosVariaveis || []).reduce((acc: number, c: CustoVariavel) => acc + (c?.valor || 0), 0);

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
              <>
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
              </>
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

        {/* Aba Geral */}
        <TabsContent value="geral" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-pink-500" />
                Personalização do Estabelecimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Nome do Estabelecimento</Label>
                <Input
                  value={nomeEstabelecimento}
                  onChange={(e) => handleNomeEstabelecimentoChange(e.target.value)}
                  placeholder="Ex: Doce Sabor Confeitaria"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nome será exibido no menu lateral
                </p>
              </div>

              <Separator />

              <div>
                <Label>Logo do Estabelecimento</Label>
                <div className="mt-2 flex items-center gap-4">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
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
                      {logoUrl ? 'Alterar Logo' : 'Upload da Logo'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Máximo 2MB
                    </p>
                    {logoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-red-500"
                        onClick={handleRemoveLogo}
                      >
                        Remover logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-500" />
                Backup Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Faça o download de todos os seus dados em formato JSON
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
                  value={taxas.pix}
                  onChange={(e) => handleTaxaChange('pix', e.target.value)}
                />
              </div>
              <div>
                <Label>Cartão Débito (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxas.debito}
                  onChange={(e) => handleTaxaChange('debito', e.target.value)}
                />
              </div>
              <div>
                <Label>Cartão Crédito (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxas.credito}
                  onChange={(e) => handleTaxaChange('credito', e.target.value)}
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
              <div className="text-sm font-semibold text-blue-600">
                Total: {formatCurrency(totalFixos)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {(configuracoes.custosFixos || []).map((custo: CustoFixo) => (
                  <div key={custo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    {editandoFixo === custo.id ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={nomeFixo}
                          onChange={(e) => setNomeFixo(e.target.value)}
                          placeholder="Nome"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={valorFixo}
                          onChange={(e) => setValorFixo(e.target.value)}
                          placeholder="Valor"
                          className="w-32"
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleSaveEditFixo(custo.id)}>
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditFixo}>
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{custo.nome}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{formatCurrency(custo.valor)}</span>
                          <Button size="sm" variant="ghost" onClick={() => handleEditCustoFixo(custo)}>
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteCustoFixo(custo.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Nome do custo fixo"
                  value={nomeFixo}
                  onChange={(e) => setNomeFixo(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={valorFixo}
                  onChange={(e) => setValorFixo(e.target.value)}
                  className="w-32"
                />
                <Button onClick={handleAddCustoFixo} disabled={!nomeFixo || !valorFixo}>
                  <Plus className="w-4 h-4" />
                </Button>
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
              <div className="text-sm font-semibold text-orange-600">
                Total: {formatCurrency(totalVariaveis)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {(configuracoes.custosVariaveis || []).map((custo: CustoVariavel) => (
                  <div key={custo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    {editandoVariavel === custo.id ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={nomeVariavel}
                          onChange={(e) => setNomeVariavel(e.target.value)}
                          placeholder="Nome"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={valorVariavel}
                          onChange={(e) => setValorVariavel(e.target.value)}
                          placeholder="Valor"
                          className="w-32"
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleSaveEditVariavel(custo.id)}>
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditVariavel}>
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{custo.nome}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{formatCurrency(custo.valor)}</span>
                          <Button size="sm" variant="ghost" onClick={() => handleEditCustoVariavel(custo)}>
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteCustoVariavel(custo.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Nome do custo variável"
                  value={nomeVariavel}
                  onChange={(e) => setNomeVariavel(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={valorVariavel}
                  onChange={(e) => setValorVariavel(e.target.value)}
                  className="w-32"
                />
                <Button onClick={handleAddCustoVariavel} disabled={!nomeVariavel || !valorVariavel}>
                  <Plus className="w-4 h-4" />
                </Button>
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
                  value={cmvPercentual}
                  onChange={(e) => handleCmvChange(e.target.value)}
                />
              </div>
              <div>
                <Label>Margem de Lucro Padrão (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={margemLucro}
                  onChange={(e) => handleMargemChange(e.target.value)}
                />
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
                Nova Categoria
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(categoriasConta || []).map((cat: CategoriaConta) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    {editandoCategoria === cat.id ? (
                      <div className="flex-1 flex flex-wrap gap-2">
                        <Input
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          placeholder="Nome"
                          className="flex-1"
                        />
                        <select 
                          value={tipo} 
                          onChange={(e) => setTipo(e.target.value as 'fixa' | 'variavel')}
                          className="w-32 p-2 border rounded-md"
                        >
                          <option value="fixa">Fixa</option>
                          <option value="variavel">Variável</option>
                        </select>
                        <Input
                          type="number"
                          step="0.01"
                          value={limiteGasto}
                          onChange={(e) => setLimiteGasto(e.target.value)}
                          placeholder="Limite"
                          className="w-32"
                        />
                        <div className="flex items-center gap-1">
                          {colors.slice(0, 4).map((c) => (
                            <button
                              key={c}
                              onClick={() => setCor(c)}
                              className={`w-6 h-6 rounded-full border-2 ${cor === c ? 'border-gray-900' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleSaveEditCategoriaConta(cat.id)}>
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditCategoria}>
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: cat.cor || '#ccc' }}
                          />
                          <span className="font-medium">{cat.nome}</span>
                          <span className="text-xs text-gray-500">({cat.tipo})</span>
                          {cat.limiteGasto && (
                            <span className="text-sm text-gray-500">
                              Limite: {formatCurrency(cat.limiteGasto)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditCategoriaConta(cat)}>
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteCategoriaConta(cat.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </>
                    )}
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
                Nova Categoria
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(categoriasProduto || []).map((cat: CategoriaProduto) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    {editandoCategoria === cat.id ? (
                      <div className="flex-1 flex flex-wrap gap-2">
                        <Input
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          placeholder="Nome"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.1"
                          value={margemPadrao}
                          onChange={(e) => setMargemPadrao(e.target.value)}
                          placeholder="Margem %"
                          className="w-32"
                        />
                        <div className="flex items-center gap-1">
                          {colors.slice(0, 4).map((c) => (
                            <button
                              key={c}
                              onClick={() => setCor(c)}
                              className={`w-6 h-6 rounded-full border-2 ${cor === c ? 'border-gray-900' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleSaveEditCategoriaProduto(cat.id)}>
                          <Save className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditCategoria}>
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: cat.cor || '#ccc' }}
                          />
                          <span className="font-medium">{cat.nome}</span>
                          <span className="text-sm text-gray-500">
                            Margem: {formatPercentage(cat.margemPadrao)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditCategoriaProduto(cat)}>
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteCategoriaProduto(cat.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </>
                    )}
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
