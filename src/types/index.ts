// Tipos de Unidade
export type UnidadeMedida = 'kg' | 'g' | 'L' | 'ml' | 'un' | 'cm' | 'm';

export type CategoriaPagamento = 'fixa' | 'variavel' | 'fornecedor' | 'outros';

export type FormaPagamento = 'dinheiro' | 'pix' | 'debito' | 'credito';

export type TipoMeta = 'faturamento' | 'investimento';

export type TipoProduto = 'receita_base' | 'produto_final';

export type TipoTransacao = 'receita' | 'despesa';

// Ingrediente
export interface Ingrediente {
  id: string;
  nome: string;
  quantidadeEmbalagem: number;
  unidade: UnidadeMedida;
  precoEmbalagem: number;
  custoUnidade: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  tipo: 'ingrediente' | 'embalagem';
  createdAt: string;
  updatedAt: string;
}

// Item de Ficha Técnica
export interface ItemFichaTecnica {
  ingredienteId: string;
  quantidade: number;
  unidade: UnidadeMedida;
  custo: number;
}

// Ficha Técnica
export interface FichaTecnica {
  id: string;
  nome: string;
  tipo: TipoProduto;
  categoriaId: string;
  receitaBaseId?: string; // Para produtos finais que usam receita base
  itens: ItemFichaTecnica[]; // Ingredientes adicionais (além da receita base)
  itensEmbalagem: ItemFichaTecnica[]; // Itens de embalagem
  rendimentoQuantidade: number;
  rendimentoUnidade: UnidadeMedida;
  custoTotal: number;
  custoUnidade: number;
  precoVenda: number;
  margemLucro: number;
  cmvPercentual: number;
  tempoPreparo?: number;
  validadeDias?: number; // Dias de validade do produto
  descricao?: string;
  createdAt: string;
  updatedAt: string;
}

// Categoria de Produto
export interface CategoriaProduto {
  id: string;
  nome: string;
  margemPadrao: number;
  cor: string;
}

// Produção
export interface Producao {
  id: string;
  fichaTecnicaId: string;
  quantidadeProduzida: number;
  dataProducao: string;
  dataValidade?: string; // Data de validade da produção
  custoTotal: number;
  observacao?: string;
  createdAt: string;
}

// Transação Diária (novo modelo simplificado)
export interface TransacaoDiaria {
  id: string;
  data: string;
  tipo: TipoTransacao; // 'receita' ou 'despesa'
  descricao: string;
  valor: number;
  formaPagamento: FormaPagamento;
  taxaDescontada: number; // Valor da taxa descontada automaticamente
  valorLiquido: number; // Valor após desconto de taxas
  categoriaId?: string; // Opcional para despesas
  createdAt: string;
}

// Conta a Pagar
export interface ContaPagar {
  id: string;
  descricao: string;
  categoriaId: string;
  valor: number;
  dataVencimento: string;
  pago: boolean;
  dataPagamento?: string;
  recorrente: boolean;
  createdAt: string;
}

// Categoria de Conta
export interface CategoriaConta {
  id: string;
  nome: string;
  tipo: 'fixa' | 'variavel';
  limiteGasto?: number;
  cor: string;
}

// Meta
export interface Meta {
  id: string;
  tipo: TipoMeta;
  nome: string;
  valorMeta: number;
  valorAcumulado: number;
  dataInicio: string;
  dataFim?: string;
  contribuicaoMensal: number;
  ativa: boolean;
  createdAt: string;
}

// Configurações
export interface Configuracoes {
  taxas: {
    pix: number;
    debito: number;
    credito: number;
  };
  cmvPercentualPadrao: number; // % padrão de CMV para cálculos
  margemLucroPadrao: number; // % padrão de margem de lucro
  custosFixos: CustoFixo[];
  custosVariaveis: CustoVariavel[]; // Agora como valores, não percentuais
  nomeEstabelecimento?: string; // Nome personalizado do estabelecimento
  logoUrl?: string; // URL da logo no Supabase Storage
}

export interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
}

export interface CustoVariavel {
  id: string;
  nome: string;
  valor: number; // Valor fixo mensal, não percentual
}

// Dados do Sistema
export interface SistemaData {
  ingredientes: Ingrediente[];
  fichasTecnicas: FichaTecnica[];
  categoriasProduto: CategoriaProduto[];
  producoes: Producao[];
  transacoes: TransacaoDiaria[]; // Novo: substitui vendas e despesas
  contasPagar: ContaPagar[];
  categoriasConta: CategoriaConta[];
  metas: Meta[];
  configuracoes: Configuracoes;
}

// Dashboard
export interface DashboardData {
  faturamentoDia: number;
  faturamentoMes: number;
  despesasMes: number;
  lucroPrejuizo: number;
  margemLucro: number;
  contasVencendo: ContaPagar[];
  ingredientesEstoqueBaixo: Ingrediente[];
  progressoMetas: { meta: Meta; percentual: number }[];
  resumoPorFormaPagamento: Record<FormaPagamento, number>;
}

// Resultado Mensal
export interface ResultadoMensal {
  mes: string;
  faturamento: number;
  faturamentoLiquido: number; // Após taxas
  custosFixos: number;
  custosVariaveis: number;
  cmv: number; // Custo da Mercadoria Vendida (percentual aplicado)
  lucro: number;
  margem: number;
  pontoEquilibrio: number;
}

// Lista de Compras
export interface ItemListaCompras {
  ingredienteId: string;
  nome: string;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  quantidadeComprar: number;
  unidade: UnidadeMedida;
  custoEstimado: number;
}
