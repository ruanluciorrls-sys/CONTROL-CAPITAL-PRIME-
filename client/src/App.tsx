import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import TabNavigation from "@/components/TabNavigation";
import MobileNav from "@/components/MobileNav";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import Login from "@/pages/Login";
// Páginas carregadas sob demanda (code-splitting) — deixa a 1ª carga mais leve
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Faturamento = lazy(() => import("@/pages/Faturamento"));
const GastoProxy = lazy(() => import("@/pages/GastoProxy"));
const MinhasOperacoes = lazy(() => import("@/pages/MinhasOperacoes"));
const Contas = lazy(() => import("@/pages/Contas"));
const ChavesPix = lazy(() => import("@/pages/ChavesPix"));
const Calendario = lazy(() => import("@/pages/Calendario"));
const EditarDados = lazy(() => import("@/pages/EditarDados"));
const Slots = lazy(() => import("@/pages/Slots"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
import { CheckCircle, Edit3, Home, FileText, Moon, Sun, LogOut, Zap, Shield, Crown, Wallet, Key, DollarSign, RefreshCw, CalendarDays, Flame, X } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { setNavigateFn } from "@/lib/navigate";
import NotificationCenter from "@/components/NotificationCenter";
import InstallButton from "@/components/InstallButton";
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

  const { isVisible, renderedValue: renderedTab } = usePageTransition(activeTab);

  const renderContent = (tab: string) => {
    switch (tab) {
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
        background: "linear-gradient(180deg, rgba(7, 14, 32, 0.75) 0%, rgba(15, 30, 69, 0.65) 70%, rgba(5, 11, 24, 0.8) 100%)",
        backdropFilter: "blur(16px)",
        borderRight: "2px solid rgba(212,160,23,0.35)",
        boxShadow: "4px 0 30px rgba(0,0,0,0.3)",
      }}>
        {/* Sidebar Header branding */}
        <div className="p-6 flex flex-col items-center text-center border-b border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d4a017] to-transparent opacity-85" />
          
          <div className="relative group cursor-pointer mb-4">
            {/* Glow externo pulsante */}
            <div className="absolute -inset-2 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition duration-700 animate-pulse"
              style={{ background: "linear-gradient(135deg, #f3d078, #f97316)" }}
            />
            {/* Anel decorativo */}
            <div className="absolute -inset-1 rounded-2xl opacity-60 group-hover:opacity-90 transition duration-500"
              style={{ background: "conic-gradient(from 0deg, #f3d078, #f97316, #f3d078)", padding: "1px", borderRadius: 16 }}
            />
            {/* Corpo do logo */}
            <div className="relative flex items-center justify-center"
              style={{
                width: 56, height: 56,
                background: "linear-gradient(145deg, #241400, #0d0500)",
                borderRadius: 16,
                border: "1.5px solid rgba(243,208,120,0.65)",
                boxShadow: "0 0 28px rgba(212,160,23,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {/* Brilho interno */}
              <div className="absolute top-1 left-3 right-3 h-[1px]"
                style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.45), transparent)" }}
              />
              <Crown style={{
                color: "#ffe9a8",
                filter: "drop-shadow(0 0 14px rgba(243,208,120,0.95)) drop-shadow(0 0 4px rgba(255,255,255,0.5))",
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
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 custom-scrollbar">
          <p className="px-3 mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-white/25">Menu</p>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`group relative w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 text-left ${
                  isActive ? "text-[#f3d078]" : "text-white/55 hover:text-white"
                }`}
                style={isActive ? {
                  background: "linear-gradient(90deg, rgba(212,160,23,0.16) 0%, rgba(212,160,23,0.04) 60%, transparent 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                } : undefined}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.035)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Barra de destaque (ativo) */}
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-300 ${
                  isActive ? "h-6 shadow-[0_0_10px_rgba(212,160,23,0.85)]" : "h-0"
                }`} style={{ background: isActive ? "linear-gradient(180deg, #f3d078, #d4a017)" : "transparent" }} />

                {/* Ícone em caixinha */}
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isActive ? "text-[#050b18]" : "text-white/45 group-hover:text-white bg-white/[0.04] group-hover:bg-white/[0.09]"
                }`}
                  style={isActive ? { background: "linear-gradient(135deg, #f3d078, #d4a017)", boxShadow: "0 3px 12px rgba(212,160,23,0.4)" } : undefined}
                >
                  {tab.icon}
                </span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with user info & quick actions */}
        <div className="p-3 border-t border-white/8 flex flex-col gap-2.5"
          style={{ background: "linear-gradient(180deg, transparent, rgba(5,11,24,0.9))", backdropFilter: "blur(12px)" }}
        >
          {/* User card */}
          {user && (
            <div className="relative flex items-center gap-3 px-3 py-3 rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(212,160,23,0.10), rgba(255,255,255,0.02))",
                border: "1px solid rgba(212,160,23,0.18)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* brilho decorativo no canto */}
              <div className="absolute -top-8 -right-6 w-24 h-24 rounded-full opacity-30 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(212,160,23,0.55), transparent 70%)" }} />

              {/* avatar com indicador online */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-[#050b18]"
                  style={{ background: "linear-gradient(135deg, #f3d078, #d4a017)", boxShadow: "0 4px 12px rgba(212,160,23,0.45)" }}
                >
                  {(user.email || user.name || "?")[0].toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#070e20]"
                  style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.9)" }} />
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[8px] text-[#d4a017]/80 uppercase tracking-[0.18em] font-black leading-tight">Logado como</span>
                <span className="text-[11px] font-bold text-white/85 truncate leading-tight">{user.email || user.name}</span>
              </div>

              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="relative w-7 h-7 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 text-white/55 hover:text-[#d4a017] hover:border-[#d4a017]/40 hover:bg-[#d4a017]/10 transition-all shrink-0"
                title="Alterar Senha"
              >
                <Key size={13} />
              </button>
            </div>
          )}

          {/* Botão de instalar o app (aparece quando instalável) */}
          <InstallButton />

          <div className="flex gap-2">
            <button
              onClick={handleRefreshSite}
              disabled={isRefreshing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] text-[#050b18] transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f3d078, #d4a017)", boxShadow: "0 4px 16px rgba(212,160,23,0.35)" }}
              title="Atualizar dados"
            >
              <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              Atualizar
            </button>

            <NotificationCenter />

            <button
              onClick={logout}
              className="w-11 shrink-0 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-[1.05] border border-red-500/25 text-red-400 hover:text-red-300 hover:border-red-500/50 hover:bg-red-500/15"
              style={{ background: "rgba(239,68,68,0.08)" }}
              title="Fazer logout"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* status: online + atualizações globais automáticas */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.9)" }} />
            <span className="text-[9px] text-white/35 font-semibold tracking-wide">online · atualizações globais automáticas</span>
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
          <Suspense fallback={
            <div className="flex items-center justify-center py-24">
              <div style={{ width: 36, height: 36, border: "3px solid rgba(212,160,23,0.2)", borderTopColor: "#d4a017", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          }>
            {renderContent(renderedTab)}
          </Suspense>
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
      <ThemeProvider defaultTheme="dark" switchable={true}>
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
    <div className="relative z-20 border-b border-border sticky top-0" style={{
      background: "linear-gradient(135deg, rgba(7, 14, 32, 0.8) 0%, rgba(15, 30, 69, 0.7) 50%, rgba(21, 39, 87, 0.75) 100%)",
      backdropFilter: "blur(16px)",
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
                background: "linear-gradient(145deg, #241400, #0d0500)",
                borderRadius: 12,
                border: "1.5px solid rgba(243,208,120,0.65)",
                boxShadow: "0 0 20px rgba(212,160,23,0.45)",
                flexShrink: 0,
              }}
            >
              <Crown style={{ color: "#ffe9a8", filter: "drop-shadow(0 0 12px rgba(243,208,120,0.95))" }}
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
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-1/4 justify-center md:justify-end">
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

          <NotificationCenter />

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
