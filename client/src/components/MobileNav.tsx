import React from "react";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

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
      {/* Mobile Menu Button - Fixed position no header */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden p-2.5 rounded-lg hover:bg-secondary transition-colors text-foreground"
        aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="fixed left-0 right-0 top-16 z-50 bg-white dark:bg-slate-900 md:hidden border-b border-border shadow-lg max-h-[calc(100vh-64px)] overflow-y-auto">
            <nav className="flex flex-col">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 font-medium transition-all text-left border-l-4 min-h-[56px] ${
                    activeTab === tab.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  } ${index !== tabs.length - 1 ? "border-b border-border/50" : ""}`}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  <span className="flex-shrink-0">{tab.icon}</span>
                  <span className="flex-1">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
