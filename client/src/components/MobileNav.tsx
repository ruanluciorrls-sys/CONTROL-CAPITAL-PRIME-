import React from "react";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import InstallButton from "@/components/InstallButton";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * MobileNav - Componente de navegação otimizado para mobile
 * Fornece menu hamburger com overlay completo
 * Otimizado para toque com botões de 44x44px mínimo
 */
export default function MobileNav({
  tabs,
  activeTab,
  onTabChange,
}: MobileNavProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fechar menu ao mudar de aba
  useEffect(() => {
    setIsMobileOpen(false);
  }, [activeTab]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden p-2 rounded-xl transition-all min-h-[42px] min-w-[42px] flex items-center justify-center hover:scale-105 active:scale-95"
        style={{ color: "#d4a017", background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)" }}
        aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="fixed left-0 right-0 top-0 z-50 md:hidden overflow-y-auto max-h-screen"
            style={{
              background: "linear-gradient(180deg, #070e20, #0a1628)",
              borderBottom: "2px solid rgba(212,160,23,0.35)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header do menu */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8"
              style={{ background: "rgba(212,160,23,0.05)" }}
            >
              <span className="text-sm font-black tracking-widest uppercase"
                style={{ background: "linear-gradient(135deg, #ffffff, #f3d078)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >Menu</span>
              <button onClick={() => setIsMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Instalar app (celular) */}
            <div className="px-3 pt-3">
              <InstallButton />
            </div>

            <nav className="flex flex-col p-2 gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-left min-h-[52px]"
                    style={isActive ? {
                      background: "rgba(212,160,23,0.12)",
                      color: "#d4a017",
                      borderLeft: "3px solid #d4a017",
                    } : {
                      color: "rgba(255,255,255,0.6)",
                      borderLeft: "3px solid transparent",
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="flex-shrink-0" style={{ color: isActive ? "#d4a017" : "rgba(255,255,255,0.4)" }}>{tab.icon}</span>
                    <span className="flex-1">{tab.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017]" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
