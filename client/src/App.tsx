import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import TabNavigation from "@/components/TabNavigation";
import MobileNav from "@/components/MobileNav";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import CasasFinalizadas from "@/pages/CasasFinalizadas";
import Contas from "@/pages/Contas";
import Dashboard from "@/pages/Dashboard";
import EditarDados from "@/pages/EditarDados";
import GerenciarCasas from "@/pages/GerenciarCasas";
import Relatorios from "@/pages/Relatorios";
import RelatoriosFinalizados from "@/pages/RelatoriosFinalizados";
import Calendario from "@/pages/Calendario";
import GastoProxy from "@/pages/GastoProxy";
import { CheckCircle, Edit3, Home, Settings, FileText, Moon, Sun, LogOut, Calendar, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTransition } from "@/hooks/usePageTransition";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
  {
    id: "casas-finalizadas",
    label: "Casas Finalizadas",
    icon: <CheckCircle size={20} />,
  },
  {
    id: "gasto-proxy",
    label: "Gasto com Proxy",
    icon: <Zap size={20} />,
  },
  {
    id: "gerenciar-casas",
    label: "Gerenciar Casas",
    icon: <Settings size={20} />,
  },
  { id: "relatorios", label: "Relatórios Ativos", icon: <FileText size={20} /> },
  { id: "contas", label: "Contas", icon: <FileText size={20} /> },
  { id: "relatorios-finalizados", label: "Relatórios Finalizados", icon: <CheckCircle size={20} /> },
  { id: "calendario", label: "Calendário", icon: <Calendar size={20} /> },
  { id: "editar-dados", label: "Editar Dados", icon: <Edit3 size={20} /> },
];

function AppContent() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState(() => {
    // Restaurar tab salva no localStorage ou usar dashboard como padrão
    return localStorage.getItem("lastActiveTab") || "dashboard";
  });
  const { user, loading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });

  // Salvar tab ativa no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("lastActiveTab", activeTab);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const isVisible = usePageTransition(activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "casas-finalizadas":
        return <CasasFinalizadas />;
      case "gasto-proxy":
        return <GastoProxy />;
      case "gerenciar-casas":
        return <GerenciarCasas />;
      case "relatorios":
        return <Relatorios />;
      case "contas":
        return <Contas />;
      case "relatorios-finalizados":
        return <RelatoriosFinalizados />;
      case "calendario":
        return <Calendario />;
      case "editar-dados":
        return <EditarDados />;
      default:
        return <Dashboard />;
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, o hook já redirecionou para login
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{
        backgroundImage: state.fundoUrl ? `url(${state.fundoUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay para melhorar legibilidade */}
      {state.fundoUrl && (
        <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />
      )}

      {/* Header com navegação mobile integrada */}
      <HeaderWithThemeToggle 
        nomeApp={state.nomeApp} 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Tab Navigation - Desktop */}
      <div className="relative z-10 hidden md:block">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Content */}
      <main 
        className={`relative z-0 md:z-10 flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full transition-opacity duration-300 ${
          isVisible ? 'page-transition-enter' : 'page-transition-exit'
        }`}
      >
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <SupabaseProvider>
            <AppProvider>
              <Toaster />
              <AppContent />
            </AppProvider>
          </SupabaseProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function HeaderWithThemeToggle({ 
  nomeApp, 
  activeTab,
  onTabChange
}: { 
  nomeApp: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  
  return (
    <div className="relative z-10 bg-white dark:bg-slate-900 border-b border-border sticky top-0">
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
          {nomeApp}
        </h1>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg hover:bg-secondary transition-colors text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={`Alternar para modo ${theme === 'light' ? 'noturno' : 'claro'}`}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            onClick={logout}
            className="p-2.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-600 dark:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Fazer logout"
            aria-label="Fazer logout"
          >
            <LogOut size={20} />
          </button>
          <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">2026</span>
          
          {/* Mobile Menu */}
          <div className="md:hidden">
            <MobileNav tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
