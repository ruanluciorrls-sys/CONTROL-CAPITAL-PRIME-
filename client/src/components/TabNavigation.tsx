import { Home, CheckCircle, FileText, Settings, Edit3, Menu, X } from "lucide-react";
import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 right-4 z-40 md:hidden p-2 rounded-xl bg-[#0f1e45] text-white hover:bg-[#1a3a8f] transition-all duration-300 shadow-lg border border-white/10"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Tabs */}
      <div className="hidden md:flex border-b border-border bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 transition-all duration-300">
        <div className="flex overflow-x-auto px-4 gap-1 py-1 max-w-7xl mx-auto w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 my-1.5 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all duration-300 whitespace-nowrap outline-none relative group ${
                  isActive
                    ? "bg-[#0f1e45]/5 dark:bg-white/5 text-[#d4a017]"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <span className={`transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? "text-[#d4a017]" : "text-muted-foreground"
                }`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-gradient-to-r from-[#1a3a8f] via-[#d4a017] to-[#1a3a8f] rounded-full shadow-[0_0_10px_rgba(212,160,23,0.6)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Tabs */}
      {isMobileOpen && (
        <div className="fixed inset-0 top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg md:hidden border-b border-border transition-all duration-300">
          <div className="flex flex-col p-4 gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMobileOpen(false);
                  }}
                  className={`flex items-center gap-3 px-6 py-4 font-semibold text-sm rounded-xl transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-[#0f1e45] to-[#1a3a8f] text-white border-l-4 border-[#d4a017] shadow-md"
                      : "border-transparent text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className={isActive ? "text-[#d4a017]" : ""}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
