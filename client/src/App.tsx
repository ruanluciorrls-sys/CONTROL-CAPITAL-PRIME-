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
import MinhasOperacoes from "@/pages/MinhasOperacoes";
import Relatorios from "@/pages/Relatorios";
import RelatoriosFinalizados from "@/pages/RelatoriosFinalizados";
import Calendario from "@/pages/Calendario";
import Faturamento from "@/pages/Faturamento";
import GastoProxy from "@/pages/GastoProxy";
import AdminPanel from "@/pages/AdminPanel";
import Login from "@/pages/Login";
import Slots from "@/pages/Slots";
import ChavesPix from "@/pages/ChavesPix";
import { CheckCircle, Edit3, Home, FileText, Moon, Sun, LogOut, Zap, Shield, Crown, Wallet, Key, DollarSign, RefreshCw, CalendarDays, Flame, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { setNavigateFn } from "@/lib/navigate";
import { usePageTransition } from "@/hooks/usePageTransition";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

const publicTabs = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
  { id: "faturamento", label: "Faturamento", icon: <DollarSign size={20} /> },
  { id: "gasto-proxy", label: "Gastos / Despesas", icon: <Zap size={20} /> },
  { id: "gerenciar-casas", label: "MINHAS OPERAÇÃO", icon: <Home size={20} /> },
  { id: "contas", label: "Contas Não Sacadas", icon: <Wallet size={20} /> },
  { id: "chaves-pix", label: "Chaves PIX", icon: <Key size={20} /> },
  { id: "slots", label: "Slots Premium", icon: <Flame size={20} /> },
  { id: "editar-dados", label: "Plataformas", icon: <CalendarDays size={20} /> },
];

const adminTab = { id: "admin", label: "Painel Admin", icon: <Shield size={20} /> };

function AppContent() {
  const { state } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("lastActiveTab") || "dashboard";
  });
  const { user, loading, isAuthenticated, logout } = useAuth({ redirectOnUnauthenticated: true });

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mouseDownOnBackdrop, setMouseDownOnBackdrop] = useState(false);

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Senha atualizada com sucesso!");
      setIsChangePasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar senha");
    }
  });

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }
    changePasswordMutation.mutate({ newPassword });
  };

  const handleRefreshSite = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    toast.success("Dados atualizados!");
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Tabs visíveis para este usuário
  const tabs = user?.role === "admin" ? [...publicTabs, adminTab] : publicTabs;

  useEffect(() => {
    localStorage.setItem("lastActiveTab", activeTab);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Registra função de navegação global
  useEffect(() => {
    setNavigateFn(handleTabChange);
  }, []);

  const isVisible = usePageTransition(activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard />;
      case "faturamento": return <Faturamento />;
      case "gasto-proxy": return <GastoProxy />;
      case "gerenciar-casas": return <MinhasOperacoes />;
      case "contas": return <Contas />;
      case "chaves-pix": return <ChavesPix />;
      case "calendario": return <Calendario />;
      case "editar-dados": return <EditarDados />;
      case "slots": return <Slots />;
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
      className="min-h-screen bg-background flex flex-col md:flex-row w-full"
      style={{
        backgroundImage: `url(${state.fundoUrl || "/fundo.png"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

      {/* ── MOBILE HEADER (ONLY VISIBLE ON MOBILE SCREENS) ── */}
      <div className="md:hidden w-full sticky top-0 z-20">
        <HeaderWithThemeToggle
          nomeApp={state.nomeApp || "CAPITAL PRIME CONTROL"}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={tabs}
          onRefresh={handleRefreshSite}
          isRefreshing={isRefreshing}
          onChangePasswordClick={() => setIsChangePasswordOpen(true)}
        />
      </div>

      {/* ── DESKTOP SIDEBAR (ONLY VISIBLE ON DESKTOP SCREENS) ── */}
      <aside className="hidden md:flex w-72 h-screen sticky top-0 flex-col flex-shrink-0 z-20" style={{
        background: "linear-gradient(180deg, #070e20 0%, #0f1e45 70%, #050b18 100%)",
        borderRight: "2px solid rgba(212,160,23,0.35)",
        boxShadow: "4px 0 30px rgba(0,0,0,0.3)",
      }}>
        {/* Sidebar Header branding */}
        <div className="p-6 flex flex-col items-center text-center border-b border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d4a017] to-transparent opacity-85" />
          
          <div className="relative group cursor-pointer mb-4">
            {/* Glow externo pulsante */}
            <div className="absolute -inset-2 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition duration-700 animate-pulse"
              style={{ background: "linear-gradient(135deg, #d4a017, #f97316)" }}
            />
            {/* Anel decorativo */}
            <div className="absolute -inset-1 rounded-2xl opacity-40 group-hover:opacity-70 transition duration-500"
              style={{ background: "conic-gradient(from 0deg, #d4a017, #f97316, #d4a017)", padding: "1px", borderRadius: 16 }}
            />
            {/* Corpo do logo */}
            <div className="relative flex items-center justify-center"
              style={{
                width: 56, height: 56,
                background: "linear-gradient(145deg, #1a0a00, #0d0500)",
                borderRadius: 16,
                border: "1.5px solid rgba(212,160,23,0.5)",
                boxShadow: "0 0 20px rgba(212,160,23,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {/* Brilho interno */}
              <div className="absolute top-1 left-3 right-3 h-[1px]"
                style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)" }}
              />
              <Crown style={{
                color: "#f3d078",
                filter: "drop-shadow(0 0 8px rgba(212,160,23,0.8))",
              }} size={26} strokeWidth={2} className="group-hover:scale-110 transition duration-300" />
            </div>
          </div>

          <h1 className="font-extrabold tracking-[0.2em] uppercase transition-all duration-300 text-white" style={{
            fontSize: "1.45rem",
            textShadow: "0 0 15px rgba(212,160,23,0.3)",
            background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
          }}>
            CAPITAL PRIME
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-5 h-[1px]" style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5))" }}></span>
            <p className="text-[#d4a017] text-[0.68rem] tracking-[0.45em] font-extrabold">
              CONTROL
            </p>
            <span className="w-5 h-[1px]" style={{ background: "linear-gradient(to left, transparent, rgba(212,160,23,0.5))" }}></span>
          </div>
        </div>

        {/* Sidebar Scrollable Vertical Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-[10px] uppercase tracking-wider transition-all duration-300 relative group text-left ${
                  isActive
                    ? "bg-[#d4a017]/10 text-[#d4a017] border-l-4 border-[#d4a017]"
                    : "text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                }`}
              >
                <span className={`transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? "text-[#d4a017]" : "text-white/40 group-hover:text-white"
                }`}>
                  {tab.icon}
                </span>
                <span className="truncate">{tab.label}</span>
                
                {/* Active indicator card glow */}
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 bg-[#d4a017] rounded-full shadow-[0_0_8px_rgba(212,160,23,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with user info & quick actions */}
        <div className="p-3 border-t border-white/5 flex flex-col gap-2.5"
          style={{ background: "linear-gradient(180deg, transparent, rgba(5,11,24,0.8))", backdropFilter: "blur(12px)" }}
        >
          {/* User card */}
          {user && (
            <div className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border border-white/8"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-[#050b18] shrink-0"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                >
                  {(user.email || user.name || "?")[0].toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-white/25 uppercase tracking-widest font-black leading-tight">Logado como</span>
                  <span className="text-[11px] font-bold text-white/70 truncate leading-tight">{user.email || user.name}</span>
                </div>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 text-white/55 hover:text-[#d4a017] hover:border-[#d4a017]/30 hover:bg-[#d4a017]/10 transition-all shrink-0"
                title="Alterar Senha"
              >
                <Key size={13} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRefreshSite}
              disabled={isRefreshing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider text-[#050b18] transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)", boxShadow: "0 4px 14px rgba(212,160,23,0.25)" }}
              title="Atualizar dados"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              Atualizar
            </button>

            <button
              onClick={logout}
              className="w-11 shrink-0 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-[1.05] border border-red-500/20 text-red-400 hover:text-red-300 hover:border-red-500/40"
              style={{ background: "rgba(239,68,68,0.08)" }}
              title="Fazer logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        <main
          key={refreshKey}
          className={`relative z-10 flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full transition-opacity duration-300 ${
            isVisible && !isRefreshing ? "page-transition-enter" : "page-transition-exit"
          }`}
        >
          {renderContent()}
        </main>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setMouseDownOnBackdrop(true);
            }
          }}
          onMouseUp={(e) => {
            if (e.target === e.currentTarget && mouseDownOnBackdrop) {
              setIsChangePasswordOpen(false);
            }
            setMouseDownOnBackdrop(false);
          }}
        >
          <div className="rounded-3xl p-6 max-w-md w-full space-y-5 relative overflow-hidden border border-white/10"
            style={{
              background: "linear-gradient(135deg, rgba(7,14,32,0.98) 0%, rgba(15,30,69,0.95) 100%)",
              boxShadow: "0 25px 50px -12px rgba(212,160,23,0.25)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/40 to-transparent" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#d4a017]/10 text-[#d4a017] border border-[#d4a017]/30">
                  <Key size={16} />
                </div>
                <h3 className="text-base font-black tracking-tight text-white">Alterar Minha Senha</h3>
              </div>
              <button 
                onClick={() => setIsChangePasswordOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-black/35 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4a017]/70"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-black/35 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4a017]/70"
                />
              </div>

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full h-11 mt-4 rounded-xl bg-[#d4a017] text-[#050b18] hover:bg-[#c39010] text-xs font-black tracking-wider uppercase transition-all shadow-[0_4px_12px_rgba(212,160,23,0.2)] disabled:opacity-50"
              >
                {changePasswordMutation.isPending ? "Salvando..." : "Confirmar Alteração"}
              </button>
            </form>
          </div>
        </div>
      )}

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
  onRefresh,
  isRefreshing,
  onChangePasswordClick,
}: {
  nomeApp: string;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: typeof publicTabs;
  onRefresh: () => void;
  isRefreshing: boolean;
  onChangePasswordClick: () => void;
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
          <div className="relative group cursor-pointer shrink-0">
            <div className="absolute -inset-1.5 rounded-xl blur-lg opacity-30 group-hover:opacity-60 transition duration-500"
              style={{ background: "linear-gradient(135deg, #d4a017, #f97316)" }}
            />
            <div className="relative flex items-center justify-center"
              style={{
                width: 42, height: 42,
                background: "linear-gradient(145deg, #1a0a00, #0d0500)",
                borderRadius: 12,
                border: "1.5px solid rgba(212,160,23,0.5)",
                boxShadow: "0 0 14px rgba(212,160,23,0.2)",
                flexShrink: 0,
              }}
            >
              <Crown style={{ color: "#f3d078", filter: "drop-shadow(0 0 6px rgba(212,160,23,0.7))" }}
                size={20} strokeWidth={2} className="group-hover:scale-110 transition duration-300"
              />
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
        <div className="flex items-center gap-2 w-full md:w-1/4 justify-center md:justify-end">
          {user && (
            <div className="hidden sm:flex flex-col text-right mr-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Logado como</span>
              <span className="text-xs font-semibold text-white/80">{user.email || user.name}</span>
            </div>
          )}

          <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>

          {user && (
            <button
              onClick={onChangePasswordClick}
              className="p-2 rounded-xl transition-all duration-300 min-h-[42px] min-w-[42px] flex items-center justify-center hover:scale-105 active:scale-95"
              style={{
                color: "#d4a017",
                background: "rgba(212,160,23,0.08)",
                border: "1px solid rgba(212,160,23,0.2)",
              }}
              title="Alterar Senha"
              aria-label="Alterar Senha"
            >
              <Key size={18} />
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl transition-all duration-300 min-h-[42px] min-w-[42px] flex items-center justify-center hover:scale-105 active:scale-95"
            style={{
              color: "#d4a017",
              background: "rgba(212,160,23,0.08)",
              border: "1px solid rgba(212,160,23,0.2)",
            }}
            title="Atualizar dados"
            aria-label="Atualizar"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>

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
