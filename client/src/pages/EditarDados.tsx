import { useApp } from "@/contexts/AppContext";
import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import Calendario from "./Calendario";
import { Settings, Calendar } from "lucide-react";

export default function EditarDados() {
  const { state, updateFundo } = useApp();
  const [fundoUrl, setFundoUrl] = useState(state.fundoUrl || "");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"configuracoes" | "calendario">("configuracoes");

  const handleSave = () => {
    updateFundo(fundoUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-foreground">Configurações</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Personalize o painel e gerencie o calendário de plataformas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl border border-white/10 w-fit"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        {[
          { id: "configuracoes", label: "Configurações", icon: <Settings size={14} /> },
          { id: "calendario", label: "Calendário", icon: <Calendar size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id ? "text-[#050b18]" : "text-white/40 hover:text-white/70"
            }`}
            style={activeTab === tab.id ? {
              background: "linear-gradient(135deg, #d4a017, #f59e0b)",
            } : {}}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "configuracoes" && (
        <div className="space-y-6">
          {/* Notificação de Sucesso */}
          {saved && (
            <div className="p-4 rounded-xl border border-emerald-500/30 text-emerald-400 text-sm"
              style={{ background: "rgba(74,222,128,0.06)" }}
            >
              ✓ Configurações salvas com sucesso!
            </div>
          )}

          {/* Imagem de Fundo */}
          <div className="rounded-2xl p-6 border border-white/8 space-y-4"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Imagem de Fundo</h3>
            </div>
            <ImageUpload
              label="Imagem de Fundo (Background)"
              value={fundoUrl}
              onChange={setFundoUrl}
              onRemove={() => setFundoUrl("")}
            />
            <p className="text-xs text-muted-foreground">
              Selecione ou arraste uma imagem para usar como fundo do dashboard
            </p>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#050b18] transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {activeTab === "calendario" && (
        <Calendario />
      )}
    </div>
  );
}
