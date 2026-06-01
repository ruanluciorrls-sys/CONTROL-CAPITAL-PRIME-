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
    <div className="relative z-20 bg-white dark:bg-slate-900 border-b border-border sticky top-0" style={{
      background: "linear-gradient(135deg, #070e20 0%, #0f1e45 50%, #152757 100%)",
      borderBottom: "2px solid rgba(212,160,23,0.35)",
      boxShadow: "0 4px 30px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05)",
    }}>
      {/* Glossy top-border highlight */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d4a017] to-transparent opacity-80" />
      
      <div className="px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
        
        {/* Left Side: Hexagonal Premium Logo and Badge */}
        <div className="flex items-center gap-3 w-full md:w-1/4 justify-center md:justify-start">
          <div className="relative group cursor-pointer">
            {/* Soft gold glow behind the logo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1a3a8f] to-[#d4a017] rounded-xl blur opacity-45 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative" style={{
              width: 42, height: 42,
              background: "linear-gradient(135deg, #101e40, #1c3570)",
              border: "1.5px solid rgba(212,160,23,0.6)",
              borderRadius: 11,
              display: "flex", alignItems: "center", justifyItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="group-hover:rotate-12 transition duration-300">
                <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="#d4a017" opacity="0.95"/>
                <path d="M12 6L17 9V15L12 18L7 15V9L12 6Z" fill="#0f1e45"/>
              </svg>
            </div>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#d4a017]">Premium Client</span>
            <span className="text-[11px] text-white/60 font-medium">Dashboard v2026</span>
          </div>
        </div>

        {/* Center: Large, Elegant & Professional Title */}
        <div className="flex flex-col items-center justify-center text-center flex-1 w-full md:w-2/4">
          <div className="relative group">
            <h1 className="font-extrabold tracking-[0.25em] uppercase transition-all duration-300 hover:scale-[1.02]" style={{
              color: "#ffffff",
              fontSize: "clamp(1.5rem, 3.5vw, 2.4rem)",
              textShadow: "0 0 20px rgba(212,160,23,0.35)",
              background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.1,
              fontWeight: 900,
            }}>
              CAPITAL PRIME
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="w-8 h-[1px]" style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5))" }}></span>
            <p className="text-[#d4a017]" style={{
              fontSize: "clamp(0.65rem, 1.2vw, 0.8rem)",
              letterSpacing: "0.5em",
              fontWeight: 800,
              textTransform: "uppercase",
              textShadow: "0 0 10px rgba(212,160,23,0.5)",
              marginRight: "-0.5em" /* Compensa o letter-spacing da última letra */
            }}>
              CONTROL
            </p>
            <span className="w-8 h-[1px]" style={{ background: "linear-gradient(to left, transparent, rgba(212,160,23,0.5))" }}></span>
          </div>
        </div>

        {/* Right Side: Account and Utility Actions */}
        <div className="flex items-center gap-3 w-full md:w-1/4 justify-center md:justify-end">
          {user && (
            <div className="hidden sm:flex flex-col text-right mr-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Logado como</span>
              <span className="text-xs font-semibold text-white/80">{user.email || user.name}</span>
            </div>
          )}
          
          <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all duration-300 min-h-[42px] min-w-[42px] flex items-center justify-center hover:bg-white/10 hover:scale-105 active:scale-95"
            style={{ 
              color: "rgba(255,255,255,0.85)", 
              background: "rgba(255,255,255,0.05)", 
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
            title={`Alternar para modo ${theme === "light" ? "noturno" : "claro"}`}
            aria-label="Alternar tema"
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          
          <button
            onClick={logout}
            className="p-2 rounded-xl transition-all duration-300 min-h-[42px] min-w-[42px] flex items-center justify-center hover:bg-red-500/20 hover:scale-105 active:scale-95"
            style={{ 
              color: "#ff6b6b", 
              background: "rgba(229,62,62,0.08)", 
              border: "1px solid rgba(229,62,62,0.2)",
              boxShadow: "0 4px 12px rgba(229,62,62,0.05)"
            }}
            title="Fazer logout"
            aria-label="Fazer logout"
          >
            <LogOut size={19} />
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
