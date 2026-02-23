import { useState } from 'react';
import { Plus, Trash2, Target, TrendingUp, PiggyBank, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProgressBar } from '@/components/ui-custom/ProgressBar';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Meta, TipoMeta } from '@/types';
import { differenceInMonths } from 'date-fns';
import { useStorage } from '@/hooks/useStorage';
import { toast } from 'sonner';

export function Metas() {
  const { data, addMeta, updateMeta, deleteMeta } = useStorage();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddValorOpen, setIsAddValorOpen] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  
  // Form states
  const [tipo, setTipo] = useState<TipoMeta>('faturamento');
  const [nome, setNome] = useState('');
  const [valorMeta, setValorMeta] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState('');
  const [contribuicaoMensal, setContribuicaoMensal] = useState('');
  
  // Add valor form
  const [valorAdicionar, setValorAdicionar] = useState('');

  const metasAtivas = (data?.metas || []).filter(m => m.ativa);
  const metasConcluidas = (data?.metas || []).filter(m => !m.ativa);

  const handleSubmit = async () => {
    if (!nome || !valorMeta || !dataInicio) return;
    
    await addMeta({
      tipo,
      nome,
      valorMeta: parseFloat(valorMeta),
      valorAcumulado: 0,
      dataInicio,
      dataFim: dataFim || undefined,
      contribuicaoMensal: parseFloat(contribuicaoMensal) || 0,
      ativa: true,
    });
    
    setNome('');
    setValorMeta('');
    setDataFim('');
    setContribuicaoMensal('');
    setIsDialogOpen(false);
  };

  const handleAddValor = async () => {
    if (!metaSelecionada || !valorAdicionar) return;
    
    const novoValor = metaSelecionada.valorAcumulado + parseFloat(valorAdicionar);
    await updateMeta(metaSelecionada.id, {
      valorAcumulado: novoValor,
      ativa: novoValor < metaSelecionada.valorMeta,
    });
    
    setValorAdicionar('');
    setIsAddValorOpen(false);
    setMetaSelecionada(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMeta(id);
  };

  const openAddValor = (meta: Meta) => {
    setMetaSelecionada(meta);
    setIsAddValorOpen(true);
  };

  const calcularProgresso = (meta: Meta) => {
    return meta.valorMeta > 0 ? (meta.valorAcumulado / meta.valorMeta) * 100 : 0;
  };

  const calcularMesesRestantes = (meta: Meta) => {
    if (!meta.dataFim) return null;
    const hoje = new Date();
    const fim = new Date(meta.dataFim);
    return Math.max(0, differenceInMonths(fim, hoje));
  };

  const MetaCard = ({ meta }: { meta: Meta }) => {
    const progresso = calcularProgresso(meta);
    const mesesRestantes = calcularMesesRestantes(meta);
    const falta = meta.valorMeta - meta.valorAcumulado;
    
    return (
      <Card className={`${progresso >= 100 ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200' : ''}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                meta.tipo === 'faturamento' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'
              }`}>
                {meta.tipo === 'faturamento' ? <TrendingUp className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{meta.nome}</p>
                <p className="text-xs text-gray-500">
                  {meta.tipo === 'faturamento' ? 'Meta de Faturamento' : 'Meta de Investimento'}
                </p>
              </div>
            </div>
            {progresso >= 100 && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                Concluída!
              </span>
            )}
          </div>

          <ProgressBar
            value={meta.valorAcumulado}
            max={meta.valorMeta}
            color={progresso >= 100 ? 'green' : meta.tipo === 'faturamento' ? 'blue' : 'purple'}
            showPercentage={true}
          />

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-gray-500">Acumulado</p>
              <p className="font-semibold text-gray-900">{formatCurrency(meta.valorAcumulado)}</p>
            </div>
            <div>
              <p className="text-gray-500">Meta</p>
              <p className="font-semibold text-gray-900">{formatCurrency(meta.valorMeta)}</p>
            </div>
            <div>
              <p className="text-gray-500">Falta</p>
              <p className="font-semibold text-orange-600">{formatCurrency(Math.max(0, falta))}</p>
            </div>
            <div>
              <p className="text-gray-500">Contribuição Mensal</p>
              <p className="font-semibold text-gray-900">{formatCurrency(meta.contribuicaoMensal)}</p>
            </div>
          </div>

          {meta.dataFim && (
            <p className="text-xs text-gray-500 mt-3">
              Prazo: {formatDate(meta.dataFim)}
              {mesesRestantes !== null && ` (${mesesRestantes} meses restantes)`}
            </p>
          )}

          {progresso < 100 && (
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => openAddValor(meta)}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Adicionar Valor
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(meta.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Metas</h2>
          <p className="text-gray-500">Acompanhe seus objetivos financeiros</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Tipo de Meta</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMeta)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faturamento">Meta de Faturamento</SelectItem>
                    <SelectItem value="investimento">Meta de Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome da Meta</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={tipo === 'faturamento' ? 'Ex: Faturar R$ 10.000' : 'Ex: Comprar Freezer'}
                />
              </div>
              <div>
                <Label>Valor da Meta</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valorMeta}
                  onChange={(e) => setValorMeta(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Data Fim (opcional)</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Contribuição Mensal Esperada</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={contribuicaoMensal}
                  onChange={(e) => setContribuicaoMensal(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
                  onClick={handleSubmit}
                  disabled={!nome || !valorMeta || !dataInicio}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metas Ativas */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-500" />
          Metas em Andamento
        </h3>
        {metasAtivas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Nenhuma meta ativa. Crie uma nova meta para começar!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metasAtivas.map((meta) => (
              <MetaCard key={meta.id} meta={meta} />
            ))}
          </div>
        )}
      </div>

      {/* Metas Concluídas */}
      {metasConcluidas.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Metas Concluídas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metasConcluidas.map((meta) => (
              <MetaCard key={meta.id} meta={meta} />
            ))}
          </div>
        </div>
      )}

      {/* Dialog Adicionar Valor */}
      <Dialog open={isAddValorOpen} onOpenChange={setIsAddValorOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Valor à Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {metaSelecionada && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{metaSelecionada.nome}</p>
                <p className="text-sm text-gray-500">
                  Acumulado: {formatCurrency(metaSelecionada.valorAcumulado)} / {formatCurrency(metaSelecionada.valorMeta)}
                </p>
              </div>
            )}
            <div>
              <Label>Valor a Adicionar</Label>
              <Input
                type="number"
                step="0.01"
                value={valorAdicionar}
                onChange={(e) => setValorAdicionar(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddValorOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
                onClick={handleAddValor}
                disabled={!valorAdicionar}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
