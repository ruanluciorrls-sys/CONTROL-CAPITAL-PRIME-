import { useState } from "react";
import Relatorios from "./Relatorios";
import RelatoriosFinalizados from "./RelatoriosFinalizados";
import CasasFinalizadas from "./CasasFinalizadas";
import GerenciarCasas from "./GerenciarCasas";
import { FileText, CheckCircle, Home, List } from "lucide-react";

export default function MinhasOperacoes() {
  const [activeSubTab, setActiveSubTab] = useState<string>("operacao-cpa");

  const subTabs = [
    { id: "operacao-cpa", label: "Operação CPA", icon: <FileText size={16} /> },
    { id: "gerenciar-casas", label: "Criação Meta", icon: <Home size={16} /> },
    { id: "casas-finalizadas", label: "Casas Finalizadas", icon: <CheckCircle size={16} /> },
    { id: "relatorios-finalizados", label: "Relatórios Finalizados", icon: <List size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Abas Superiores */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border hide-scrollbar">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeSubTab === tab.id
                ? "bg-[#d4a017] text-[#050b18] shadow-md shadow-[#d4a017]/20"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="flex-1 overflow-y-auto">
        {activeSubTab === "operacao-cpa" && <Relatorios />}
        {activeSubTab === "gerenciar-casas" && <GerenciarCasas />}
        {activeSubTab === "casas-finalizadas" && <CasasFinalizadas />}
        {activeSubTab === "relatorios-finalizados" && <RelatoriosFinalizados />}
      </div>
    </div>
  );
}
