import { useState } from 'react';
import { 
  LayoutDashboard, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Target, 
  ShoppingBag, 
  FileText, 
  Factory, 
  Tag, 
  BarChart3, 
  Settings,
  Menu,
  Store,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { Configuracoes } from '@/types';

export type ModuleType = 
  | 'dashboard' 
  | 'caixa' 
  | 'contas' 
  | 'resultado' 
  | 'metas' 
  | 'ingredientes' 
  | 'fichatecnica' 
  | 'producao' 
  | 'precificacao' 
  | 'relatorios' 
  | 'configuracoes';

interface MainLayoutProps {
  children: React.ReactNode;
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  configuracoes?: Configuracoes;
  onLogout?: () => void;
}

const menuItems = [
  { id: 'dashboard' as ModuleType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'caixa' as ModuleType, label: 'Caixa Diário', icon: DollarSign },
  { id: 'contas' as ModuleType, label: 'Contas a Pagar', icon: CreditCard },
  { id: 'resultado' as ModuleType, label: 'Resultado Mensal', icon: TrendingUp },
  { id: 'metas' as ModuleType, label: 'Metas', icon: Target },
  { id: 'ingredientes' as ModuleType, label: 'Ingredientes', icon: ShoppingBag },
  { id: 'fichatecnica' as ModuleType, label: 'Ficha Técnica', icon: FileText },
  { id: 'producao' as ModuleType, label: 'Produção', icon: Factory },
  { id: 'precificacao' as ModuleType, label: 'Precificação', icon: Tag },
  { id: 'relatorios' as ModuleType, label: 'Relatórios', icon: BarChart3 },
  { id: 'configuracoes' as ModuleType, label: 'Configurações', icon: Settings },
];

export function MainLayout({ children, currentModule, onModuleChange, configuracoes, onLogout }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const nomeEstabelecimento = configuracoes?.nomeEstabelecimento || 'DoceGestão';
  const logoUrl = configuracoes?.logoUrl;

  const LogoDisplay = () => (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt="Logo"
          className="w-10 h-10 rounded-xl object-cover shadow-lg"
        />
      ) : (
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200">
          <Store className="w-6 h-6 text-white" />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="font-bold text-lg text-gray-900 truncate">{nomeEstabelecimento}</h1>
        <p className="text-xs text-gray-500">Sistema de Gestão</p>
      </div>
    </div>
  );

  const MobileLogoDisplay = () => (
    <div className="flex items-center gap-2">
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt="Logo"
          className="w-8 h-8 rounded-lg object-cover"
        />
      ) : (
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
      )}
      <span className="font-bold text-gray-900 truncate max-w-[150px]">{nomeEstabelecimento}</span>
    </div>
  );

  const MenuContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-6 border-b border-pink-100">
        <LogoDisplay />
      </div>
      
      <nav className="flex-1 overflow-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onModuleChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200' 
                  : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-pink-100 space-y-2">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </button>
        )}
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 text-center">
            Controle sua doceria com inteligência
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-pink-100 fixed h-full shadow-sm z-10">
        <MenuContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-pink-100 z-20 flex items-center justify-between px-4">
        <MobileLogoDisplay />
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <MenuContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
