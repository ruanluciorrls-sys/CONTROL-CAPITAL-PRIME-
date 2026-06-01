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
import AdminPanel from "@/pages/AdminPanel";
import Login from "@/pages/Login";
import { CheckCircle, Edit3, Home, Settings, FileText, Moon, Sun, LogOut, Calendar, Zap, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePageTransition } from "@/hooks/usePageTransition";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

const publicTabs = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
  { id: "casas-finalizadas", label: "Casas Finalizadas", icon: <CheckCircle size={20} /> },
  { id: "gasto-proxy", label: "Gasto com Proxy", icon: <Zap size={20} /> },
  { id: "gerenciar-casas", label: "Gerenciar Casas", icon: <Settings size={20} /> },
  { id: "relatorios", label: "Relatórios Ativos", icon: <FileText size={20} /> },
  { id: "contas", label: "Contas", icon: <FileText size={20} /> },
  { id: "relatorios-finalizados", label: "Relatórios Finalizados", icon: <CheckCircle size={20} /> },
  { id: "calendario", label: "Calendário", icon: <Calendar size={20} /> },
  { id: "editar-dados", label: "Editar Dados", icon: <Edit3 size={20} /> },
];

const adminTab = { id: "admin", label: "Painel Admin", icon: <Shield size={20} /> };

function AppContent() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("lastActiveTab") || "dashboard";
  });
  const { user, loading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });

  // Tabs visíveis para este usuário
  const tabs = user?.role === "admin" ? [...publicTabs, adminTab] : publicTabs;

  useEffect(() => {
    localStorage.setItem("lastActiveTab", activeTab);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const isVisible = usePageTransition(activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "casas-finalizadas": return <CasasFinalizadas />;
      case "gasto-proxy": return <GastoProxy />;
      case "gerenciar-casas": return <GerenciarCasas />;
      case "relatorios": return <Relatorios />;
      case "contas": return <Contas />;
      case "relatorios-finalizados": return <RelatoriosFinalizados />;
      case "calendario": return <Calendario />;
      case "editar-dados": return <EditarDados />;
      case "admin": return <AdminPanel />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div style={{
            width: 48, height: 48,
            border: "3px solid rgba(26,58,143,0.2)",
            borderTopColor: "#1a3a8f",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p className="text-foreground font-medium">Capital Prime Control</p>
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

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
      {state.fundoUrl && (
        <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />
      )}

      <HeaderWithThemeToggle
        nomeApp={state.nomeApp || "CAPITAL PRIME CONTROL"}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={tabs}
      />

      <div className="relative z-10 hidden md:block">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      <main
        className={`relative z-0 md:z-10 flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full transition-opacity duration-300 ${
          isVisible ? "page-transition-enter" : "page-transition-exit"
        }`}
      >
        {renderContent()}
      </main>
    </div>
  );
}

function App() {
  // Check if we're on the login page
  const isLoginPage = typeof window !== "undefined" && window.location.pathname === "/login";

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          {isLoginPage ? (
            <Login />
          ) : (
            <SupabaseProvider>
              <AppProvider>
                <Toaster />
                <AppContent />
              </AppProvider>
            </SupabaseProvider>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function HeaderWithThemeToggle({
  nomeApp,
  activeTab,
  onTabChange,
  tabs,
}: {
  nomeApp: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: typeof publicTabs;
}) {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  return (
    <div className="relative z-10 bg-white dark:bg-slate-900 border-b border-border sticky top-0" style={{
      background: "linear-gradient(135deg, #0f1e45 0%, #1a3a8f 100%)",
      borderBottom: "1px solid rgba(212,160,23,0.2)",
    }}>
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo hexagonal */}
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #1a3a8f, #d4a017)",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="white" opacity="0.9"/>
              <path d="M12 6L17 9V15L12 18L7 15V9L12 6Z" fill="rgba(212,160,23,0.6)"/>
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold truncate" style={{
              color: "white",
              fontSize: "clamp(0.9rem, 2vw, 1.2rem)",
              letterSpacing: "0.04em",
              lineHeight: 1.1,
            }}>
              CAPITAL PRIME
            </h1>
            <p style={{ color: "#d4a017", fontSize: "0.6rem", letterSpacing: "0.2em", fontWeight: 700 }}>
              CONTROL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {user && (
            <span className="hidden sm:inline text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {user.email || user.name}
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            style={{ color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.08)" }}
            title={`Alternar para modo ${theme === "light" ? "noturno" : "claro"}`}
            aria-label="Alternar tema"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            style={{ color: "rgba(255,100,100,0.9)", background: "rgba(229,62,62,0.1)" }}
            title="Fazer logout"
            aria-label="Fazer logout"
          >
            <LogOut size={18} />
          </button>
          <div className="md:hidden">
            <MobileNav tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
