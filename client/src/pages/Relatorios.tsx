import { useApp } from "@/contexts/AppContext";
import { Plus, Trash2, Copy, Clock, ChevronDown, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import RelatorioSpreadsheet from "@/components/RelatorioSpreadsheet";
import AbaProgresso from "@/components/AbaProgresso";
import { usePageTransition } from "@/hooks/usePageTransition";

// Plataformas do calendário (espelhando Calendario.tsx)
const PLATAFORMAS_CALENDARIO = [
  { id: "1", nome: "WE", diasPrazo: 4, dia: "SEGUNDA-FEIRA" },
  { id: "2", nome: "777CLUBE", diasPrazo: 3, dia: "SEGUNDA-FEIRA" },
  { id: "3", nome: "EK", diasPrazo: 4, dia: "TERÇA-FEIRA" },
  { id: "4", nome: "VOY", diasPrazo: 4, dia: "TERÇA-FEIRA" },
  { id: "5", nome: "888", diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "6", nome: "MANGA", diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "7", nome: "ANJO", diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "8", nome: "GAME", diasPrazo: 6, dia: "TERÇA-FEIRA" },
  { id: "9", nome: "91", diasPrazo: 3, dia: "QUARTA-FEIRA" },
  { id: "10", nome: "OKOK", diasPrazo: 3, dia: "QUARTA-FEIRA" },
  { id: "11", nome: "A8", diasPrazo: 7, dia: "QUARTA-FEIRA" },
  { id: "12", nome: "DY", diasPrazo: 4, dia: "QUARTA-FEIRA" },
  { id: "13", nome: "MK", diasPrazo: 4, dia: "QUARTA-FEIRA" },
  { id: "14", nome: "WP", diasPrazo: 7, dia: "QUARTA-FEIRA" },
  { id: "15", nome: "W1", diasPrazo: 3, dia: "QUINTA-FEIRA" },
  { id: "16", nome: "DZ", diasPrazo: 0, dia: "QUINTA-FEIRA" },
  { id: "17", nome: "777CLUBE", diasPrazo: 4, dia: "QUINTA-FEIRA" },
  { id: "18", nome: "WE", diasPrazo: 3, dia: "SEXTA-FEIRA" },
  { id: "19", nome: "MANGA", diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "20", nome: "ANJO", diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "21", nome: "888", diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "22", nome: "VOY", diasPrazo: 3, dia: "SÁBADO" },
  { id: "23", nome: "91", diasPrazo: 4, dia: "SÁBADO" },
  { id: "24", nome: "EK", diasPrazo: 3, dia: "SÁBADO" },
  { id: "25", nome: "W1", diasPrazo: 4, dia: "DOMINGO" },
  { id: "26", nome: "DY", diasPrazo: 3, dia: "DOMINGO" },
  { id: "27", nome: "MK", diasPrazo: 3, dia: "DOMINGO" },
];

const DIAS_SEMANA_MAP: Record<string, number> = {
  "DOMINGO": 0, "SEGUNDA-FEIRA": 1, "TERÇA-FEIRA": 2,
  "QUARTA-FEIRA": 3, "QUINTA-FEIRA": 4, "SEXTA-FEIRA": 5, "SÁBADO": 6,
};

function calcularPrazo(diaSemana: string, diasPrazo: number): string {
  const hoje = new Date();
  const divoAlvo = DIAS_SEMANA_MAP[diaSemana] ?? 0;
  const diaAtual = hoje.getDay();
  let diff = divoAlvo - diaAtual;
  if (diff < 0) diff += 7;
  if (diff === 0) diff = 0; // mesmo dia, conta hoje
  const diaBase = new Date(hoje);
  diaBase.setDate(diaBase.getDate() + diff);
  diaBase.setDate(diaBase.getDate() + diasPrazo);
  return diaBase.toISOString().split("T")[0];
}

function calcCountdown(prazoStr: string): string {
  if (!prazoStr) return "";
  const prazo = new Date(prazoStr + "T23:59:59");
  const agora = new Date();
  const diff = prazo.getTime() - agora.getTime();
  if (diff <= 0) return "Prazo encerrado!";
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const min = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (dias > 0) return `${dias}d ${horas}h ${min}m restantes`;
  return `${horas}h ${min}m restantes`;
}

const COR_DIA: Record<string, string> = {
  "SEGUNDA-FEIRA": "#60a5fa",
  "TERÇA-FEIRA": "#34d399",
  "QUARTA-FEIRA": "#a78bfa",
  "QUINTA-FEIRA": "#f59e0b",
  "SEXTA-FEIRA": "#f87171",
  "SÁBADO": "#fb923c",
  "DOMINGO": "#e879f9",
};

const DIAS_ORDER = ["SEGUNDA-FEIRA","TERÇA-FEIRA","QUARTA-FEIRA","QUINTA-FEIRA","SEXTA-FEIRA","SÁBADO","DOMINGO"];

interface RedesDropdownProps {
  plataformas: any[];
  onSelect: (dia: string, diasPrazo: number, nome: string) => void;
}

function RedesDropdown({ plataformas, onSelect }: RedesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ id?: string; nome: string; diasPrazo: number; dia: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (p: any) => {
    setSelected(p);
    onSelect(p.dia, p.diasPrazo, p.nome);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#d4a017] bg-background text-foreground"
        style={open ? { borderColor: "rgba(212,160,23,0.5)" } : {}}
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COR_DIA[selected.dia] }} />
            <span className="font-bold text-white/90">{selected.nome}</span>
            <span className="text-white/40 text-xs">
              {selected.diasPrazo === 0 ? "Sem prazo" : `+${selected.diasPrazo} dias`}
            </span>
          </span>
        ) : (
          <span className="text-white/30">Selecionar rede / plataforma...</span>
        )}
        <ChevronDown size={14} className={`text-white/40 transition-transform shrink-0 ml-2 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className="absolute z-50 top-full mt-1 left-0 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/12"
          style={{
            background: "linear-gradient(145deg, #070e20, #0f1e45)",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[1px]"
            style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.4), transparent)" }}
          />
          {DIAS_ORDER.map((dia) => {
            const plats = plataformas.filter((p: any) => p.dia === dia);
            if (!plats.length) return null;
            const cor = COR_DIA[dia];
            return (
              <div key={dia}>
                {/* Cabeçalho do dia */}
                <div className="px-4 py-2 flex items-center gap-2 border-b border-white/5 sticky top-0"
                  style={{ background: `${cor}12`, backdropFilter: "blur(8px)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cor }} />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cor }}>
                    {dia}
                  </span>
                </div>
                {/* Opções */}
                {plats.map((p: any) => {
                  const isSelected = selected?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect(p)}
                      className="w-full flex items-center justify-between px-5 py-2.5 text-left transition-all"
                      style={{
                        background: isSelected ? `${cor}18` : "transparent",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span className="font-black text-sm text-white/85">{p.nome}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{
                          background: p.diasPrazo === 0 ? "rgba(255,255,255,0.05)" : `${cor}20`,
                          color: p.diasPrazo === 0 ? "rgba(255,255,255,0.25)" : cor,
                        }}
                      >
                        {p.diasPrazo === 0 ? "Sem prazo" : `+${p.diasPrazo} dias`}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Relatorios() {
  const { state, addRelatorio, updateRelatorio, deleteRelatorio, finalizarRelatorio, duplicarRelatorio, esvaziarLixeira } = useApp();
  const [selectedRelatorioId, setSelectedRelatorioId] = useState<string>("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"relatorio" | "progresso" | "lixeira">("relatorio");
  const { isVisible, renderedValue: renderedTab } = usePageTransition(activeTab);
  const [newRelatorioData, setNewRelatorioData] = useState({
    casaId: "",
    agente: "",
    prazo: "",
  });
  const [countdown, setCountdown] = useState("");
  const [selectedLixeira, setSelectedLixeira] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!newRelatorioData.prazo) { setCountdown(""); return; }
    setCountdown(calcCountdown(newRelatorioData.prazo));
    const interval = setInterval(() => setCountdown(calcCountdown(newRelatorioData.prazo)), 60000);
    return () => clearInterval(interval);
  }, [newRelatorioData.prazo]);

  const casasAtivas = state.casas.filter((c) => c.status === "ativa");
  const relatoriosAtivos = state.relatorios.filter((r) => r.status === "ativo");
  const relatoriosLixeira = state.relatorios.filter((r) => r.status === "lixeira");

  const handleCreateRelatorio = () => {
    if (!newRelatorioData.casaId) {
      toast.error("Selecione uma Meta antes de criar o relatório.");
      return;
    }
    addRelatorio({
      casaId: newRelatorioData.casaId,
      agente: newRelatorioData.agente || "",
      prazo: newRelatorioData.prazo,
      cooperacao: 0,
      rows: [],
      status: "ativo",
    });
    setNewRelatorioData({ casaId: "", agente: "", prazo: "" });
    setShowNewForm(false);
    toast.success("Relatório criado com sucesso!");
  };

  const handleAddRow = (relatorioId: string, row: any) => {
    const relatorio = relatoriosAtivos.find((r) => r.id === relatorioId);
    if (relatorio) {
      updateRelatorio(relatorioId, {
        rows: [...relatorio.rows, row],
      });
    }
  };

  const handleDeleteRow = (relatorioId: string, numero: number) => {
    const relatorio = relatoriosAtivos.find((r) => r.id === relatorioId);
    if (relatorio) {
      // Filtrar a linha deletada e renumerar as restantes
      const filteredRows = relatorio.rows.filter((r) => r.numero !== numero);
      const renumeratedRows = filteredRows.map((r, index) => ({
        ...r,
        numero: index + 1,
      }));
      updateRelatorio(relatorioId, {
        rows: renumeratedRows,
      });
    }
  };

  const handleUpdateRow = (relatorioId: string, numero: number, row: any) => {
    const relatorio = relatoriosAtivos.find((r) => r.id === relatorioId);
    if (relatorio) {
      updateRelatorio(relatorioId, {
        rows: relatorio.rows.map((r) => (r.numero === numero ? row : r)),
      });
    }
  };

  const handleCooperacaoChange = (relatorioId: string, valor: number) => {
    updateRelatorio(relatorioId, { cooperacao: valor });
  };

  const handleDeleteRelatorio = (relatorioId: string) => {
    // Mover para lixeira em vez de deletar permanentemente
    updateRelatorio(relatorioId, { status: "lixeira" });
    if (selectedRelatorioId === relatorioId) {
      setSelectedRelatorioId("");
    }
    toast.success("Relatório movido para a lixeira");
  };

  const handleRestoreRelatorio = (relatorioId: string) => {
    // Restaurar relatório da lixeira
    updateRelatorio(relatorioId, { status: "ativo" });
    toast.success("Relatório restaurado!");
  };

  const handlePermanentlyDeleteRelatorio = (relatorioId: string) => {
    // Deletar permanentemente
    if (confirm("Tem certeza que deseja deletar permanentemente este relatório?")) {
      deleteRelatorio(relatorioId);
      toast.success("Relatório deletado permanentemente");
    }
  };

  const getCasaNome = (casaId: string) => {
    return state.casas.find((c) => c.id === casaId)?.nome || "Casa Desconhecida";
  };

  const getCasaLinks = (casaId: string) => {
    const casa = state.casas.find((c) => c.id === casaId);
    return {
      linkCasa: casa?.linkCasa || "",
      linkContaFilha: casa?.linkContaFilha || "",
    };
  };

  const getCasaPrazo = (casaId: string) => {
    return state.casas.find((c) => c.id === casaId)?.prazo || "";
  };

  const calculateTotalResultado = (rows: any[], cooperacao?: any) => {
    // Calcular resultado como a soma dos resultados de cada linha (igual a RelatorioSpreadsheet)
    const resultado = rows.reduce((sum, row) => sum + (parseFloat(row.resultado) || 0), 0);
    
    // Converter cooperacao para numero
    let cooperacaoValue = 0;
    if (cooperacao !== undefined && cooperacao !== null) {
      if (typeof cooperacao === 'string') {
        cooperacaoValue = parseFloat(cooperacao) || 0;
      } else if (typeof cooperacao === 'number') {
        cooperacaoValue = cooperacao;
      }
    }
    
    // Retornar resultado final + cooperacao (igual a RESULTADO FINAL + COOPERACAO em RelatorioSpreadsheet)
    return resultado + cooperacaoValue;
  };

  const currentRelatorio = selectedRelatorioId ? relatoriosAtivos.find((r) => r.id === selectedRelatorioId) : null;

  // Plataformas do calendário — lê do localStorage e atualiza quando mudar
  const lerPlataformas = () => {
    try {
      const saved = localStorage.getItem("plataformas-calendario-v2");
      return saved ? JSON.parse(saved) : PLATAFORMAS_CALENDARIO;
    } catch { return PLATAFORMAS_CALENDARIO; }
  };
  const [plataformasCalendario, setPlataformasCalendario] = useState(lerPlataformas);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPlataformasCalendario(Array.isArray(detail) ? detail : lerPlataformas());
    };
    window.addEventListener("plataformas-updated", handleUpdate);
    return () => window.removeEventListener("plataformas-updated", handleUpdate);
  }, []);

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Abas de Navegação */}
      <div className="flex gap-1 p-1 rounded-xl border border-white/10 w-fit"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        {[
          { id: "relatorio", label: "Relatório" },
          { id: "progresso", label: "Progresso" },
          { id: "lixeira", label: `Lixeira (${relatoriosLixeira.length})` },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
            style={activeTab === tab.id ? {
              background: "linear-gradient(135deg, #d4a017, #f59e0b)",
              color: "#050b18",
            } : { color: "rgba(255,255,255,0.4)" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`transition-opacity duration-300 ${
        isVisible ? "page-transition-enter" : "page-transition-exit"
      }`}>
        {renderedTab === "relatorio" && (
          <>
            {/* Botão Criar Novo Relatório */}
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold min-h-[44px] w-full md:w-auto text-[#050b18] transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >
              <Plus size={20} />
              Criar Novo Relatório
            </button>

            {/* Formulário de Novo Relatório */}
            {showNewForm && (
              <div className="rounded-2xl p-5 border border-white/8 space-y-4"
                style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)" }}
              >
                <h3 className="text-base font-black text-foreground">Novo Relatório</h3>

                {/* 1. Meta — Selecionar Casa de Criação Meta */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                    Meta
                  </label>
                  <select
                    value={newRelatorioData.casaId}
                    onChange={(e) => {
                      const casaSelecionada = casasAtivas.find((c) => c.id === e.target.value);
                      setNewRelatorioData({
                        ...newRelatorioData,
                        casaId: e.target.value,
                        prazo: casaSelecionada?.prazo || newRelatorioData.prazo,
                      });
                    }}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#d4a017] bg-background text-foreground text-sm"
                  >
                    <option value="">Selecionar Meta</option>
                    {casasAtivas.map((casa) => (
                      <option key={casa.id} value={casa.id}>
                        {casa.nome}{casa.meta ? ` — Meta: R$ ${Number(casa.meta).toFixed(2)}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Nome do Agente | Redes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                      Nome do Agente
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do agente..."
                      value={newRelatorioData.agente}
                      onChange={(e) => setNewRelatorioData({ ...newRelatorioData, agente: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#d4a017] bg-background text-foreground text-sm"
                    />
                    {newRelatorioData.casaId && (
                      <p className="text-[10px] text-white/30 mt-1">
                        Exibido como: <span className="text-[#d4a017] font-bold">
                          {getCasaNome(newRelatorioData.casaId)}{newRelatorioData.agente ? `-${newRelatorioData.agente}` : ""}
                        </span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                      Redes
                    </label>
                    <RedesDropdown
                      plataformas={plataformasCalendario}
                      onSelect={(dia, diasPrazo) => {
                        const prazoCalc = calcularPrazo(dia, diasPrazo);
                        setNewRelatorioData((prev) => ({ ...prev, prazo: prazoCalc }));
                      }}
                    />
                    <p className="text-[10px] text-white/25 mt-1">
                      Selecionar preenche o prazo automaticamente
                    </p>
                  </div>
                </div>

                {/* 3. Prazo + Countdown */}
                {newRelatorioData.prazo ? (
                  <div className="rounded-xl p-4 border border-[#d4a017]/20 flex items-center gap-4"
                    style={{ background: "rgba(212,160,23,0.06)" }}
                  >
                    <Clock size={18} className="text-[#d4a017] shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4a017]/60 mb-0.5">Prazo</p>
                      <p className="text-lg font-black text-[#d4a017]">
                        {new Date(newRelatorioData.prazo + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      {countdown && (
                        <p className="text-xs text-white/40 mt-0.5">{countdown}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl p-3 border border-white/8 text-center text-xs text-white/20">
                    Selecione uma rede para preencher o prazo automaticamente
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleCreateRelatorio}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#050b18] transition-all hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                  >
                    Criar Relatório
                  </button>
                  <button
                    onClick={() => {
                      setShowNewForm(false);
                      setNewRelatorioData({ casaId: "", agente: "", prazo: "" });
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/50 border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Relatórios */}
            {relatoriosAtivos.length > 0 && (
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-black text-white/70 uppercase tracking-wider">Relatórios Criados</h3>
                  <span className="text-[10px] font-bold text-white/25">{relatoriosAtivos.length} ativo(s)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const accentColors = [
                      "#60a5fa", "#34d399", "#a78bfa", "#f472b6",
                      "#d4a017", "#818cf8", "#fb923c", "#22d3ee", "#f87171",
                    ];
                    return relatoriosAtivos.map((rel, index) => {
                      const accent = accentColors[index % accentColors.length];
                      const lucroTotal = calculateTotalResultado(rel.rows, rel.cooperacao);
                      const isSelected = selectedRelatorioId === rel.id;
                      const nomeBase = getCasaNome(rel.casaId).replace(/[\s-]+$/, "").trim();
                      const nome = `${nomeBase}${rel.agente ? `-${rel.agente}` : ""}`;
                      const countdown = rel.prazo ? calcCountdown(rel.prazo) : "";
                      const prazoDate = rel.prazo
                        ? new Date(rel.prazo + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                        : null;
                      const isVencido = rel.prazo ? new Date(rel.prazo + "T23:59:59") < new Date() : false;

                      return (
                        <div
                          key={rel.id}
                          onClick={() => setSelectedRelatorioId(rel.id)}
                          className="group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                          style={{
                            background: isSelected
                              ? `linear-gradient(145deg, ${accent}18, ${accent}06)`
                              : "linear-gradient(145deg, #070e20, #0c1524)",
                            border: `1px solid ${isSelected ? accent + "50" : "rgba(255,255,255,0.08)"}`,
                            boxShadow: isSelected ? `0 0 24px ${accent}20` : "none",
                          }}
                        >
                          {/* Barra de cor no topo */}
                          <div className="h-[2px] w-full" style={{ background: accent }} />

                          <div className="p-5">
                            {/* Nome */}
                            <p className="font-black text-base text-white/90 truncate mb-4" title={nome}>
                              {nome}
                            </p>

                            {/* Stats — 3 colunas maiores */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              {/* Linhas */}
                              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Linhas</p>
                                <p className="font-black text-xl" style={{ color: accent }}>{rel.rows.length}</p>
                              </div>

                              {/* Prazo + Countdown */}
                              <div className="rounded-xl p-3 text-center col-span-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Prazo</p>
                                {prazoDate ? (
                                  <>
                                    <p className="font-black text-base" style={{ color: isVencido ? "#f87171" : accent }}>
                                      {prazoDate}
                                    </p>
                                    <p className="text-[9px] font-bold mt-0.5" style={{ color: isVencido ? "#f87171" : "rgba(255,255,255,0.35)" }}>
                                      {isVencido ? "⚠ Vencido" : countdown}
                                    </p>
                                  </>
                                ) : (
                                  <p className="font-black text-base text-white/20">—</p>
                                )}
                              </div>
                            </div>

                            {/* Lucro — centralizado e chamativo */}
                            <div className="rounded-xl py-4 px-4 flex flex-col items-center justify-center mb-3 relative overflow-hidden"
                              style={{
                                background: lucroTotal >= 0
                                  ? "linear-gradient(145deg, rgba(74,222,128,0.08), rgba(74,222,128,0.04))"
                                  : "linear-gradient(145deg, rgba(248,113,113,0.08), rgba(248,113,113,0.04))",
                                border: `1px solid ${lucroTotal >= 0 ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                              }}
                            >
                              <div className="absolute top-0 left-0 w-full h-[1px]"
                                style={{ background: `linear-gradient(to right, transparent, lucroTotal >= 0 ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)", transparent)` }}
                              />
                              <p className="text-[9px] font-black uppercase tracking-widest mb-1.5"
                                style={{ color: lucroTotal >= 0 ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.5)" }}
                              >Lucro</p>
                              <p className="font-black text-2xl tracking-tight"
                                style={{
                                  color: lucroTotal >= 0 ? "#4ade80" : "#f87171",
                                  textShadow: lucroTotal >= 0 ? "0 0 20px rgba(74,222,128,0.3)" : "0 0 20px rgba(248,113,113,0.3)",
                                }}
                              >
                                {lucroTotal >= 0 ? "+" : ""}R$ {lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); duplicarRelatorio(rel.id); }}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors border border-white/8 text-white/30 hover:text-[#60a5fa] hover:border-[#60a5fa]/30"
                                style={{ background: "rgba(255,255,255,0.04)" }}
                                title="Duplicar"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteRelatorio(rel.id); }}
                                className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors border border-red-500/15 text-red-400/40 hover:text-red-400 hover:border-red-500/30"
                                style={{ background: "rgba(239,68,68,0.04)" }}
                                title="Lixeira"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Planilha de Relatório Selecionado */}
            {currentRelatorio && (
              <>
                <RelatorioSpreadsheet
                  key={`${selectedRelatorioId}-${currentRelatorio.id}`}
                  casaNome={getCasaNome(currentRelatorio.casaId)}
                  agente={currentRelatorio.agente}
                  prazo={currentRelatorio.prazo || ""}

                  cooperacao={currentRelatorio.cooperacao}
                  onCooperacaoChange={(valor) =>
                    handleCooperacaoChange(selectedRelatorioId, valor)
                  }
                  linkContaFilha={getCasaLinks(currentRelatorio.casaId).linkContaFilha}
                  media={state.casas.find((c) => c.id === currentRelatorio.casaId)?.media || 0}
                  meta={state.casas.find((c) => c.id === currentRelatorio.casaId)?.meta || 0}
                  rows={currentRelatorio.rows}
                  onAddRow={(row) => handleAddRow(selectedRelatorioId, row)}
                  onDeleteRow={(numero) => handleDeleteRow(selectedRelatorioId, numero)}
                  onUpdateRow={(numero, row) =>
                    handleUpdateRow(selectedRelatorioId, numero, row)
                  }
                />
                <button
                  onClick={() => {
                    if (selectedRelatorioId) {
                      finalizarRelatorio(selectedRelatorioId);
                      setSelectedRelatorioId("");
                      toast.success("Relatório finalizado! Movido para Relatórios Finalizados.");
                    }
                  }}
                  className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ✓ Finalizar Relatório
                </button>
              </>
            )}

            {/* Mensagem Vazia */}
            {relatoriosAtivos.length === 0 && !showNewForm && (
              <div className="bg-card backdrop-blur-sm border border-border/50 shadow-lg rounded-xl p-8 text-center">
                <p className="text-muted-foreground text-lg">
                  Nenhum relatório criado. Clique em "Criar Novo Relatório" para começar!
                </p>
              </div>
            )}
          </>
        )}

        {renderedTab === "progresso" && currentRelatorio && (
          <AbaProgresso
            meta={state.casas.find((c) => c.id === currentRelatorio.casaId)?.meta || 0}
            media={state.casas.find((c) => c.id === currentRelatorio.casaId)?.media || 0}
            totalDeposito={currentRelatorio.rows.reduce((sum, r) => sum + (r.deposito || 0) + (r.redeposito || 0), 0)}
            totalSaque={currentRelatorio.rows.reduce((sum, r) => sum + r.saque, 0)}
            totalBau={currentRelatorio.rows.reduce((sum, r) => sum + r.bau, 0)}
            cooperacao={currentRelatorio.cooperacao}
            rows={currentRelatorio.rows}
          />
        )}

        {renderedTab === "lixeira" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground dark:text-white">Lixeira</h2>
              {relatoriosLixeira.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Tem certeza que deseja esvaziar a lixeira completamente?")) {
                      esvaziarLixeira();
                      toast.success("Lixeira esvaziada!");
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  Esvaziar Lixeira
                </button>
              )}
            </div>
            
            {relatoriosLixeira.length === 0 ? (
              <div className="bg-card backdrop-blur-sm border border-border/50 shadow-lg rounded-xl p-8 text-center">
                <p className="text-muted-foreground text-lg">
                  Nenhum relatorio na lixeira
                </p>
              </div>
            ) : (
              <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50 shadow-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Casa</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Agente</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Prazo</th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground dark:text-white">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatoriosLixeira.map((relatorio) => (
                      <tr key={relatorio.id} className="border-b border-border dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <td className="py-3 px-4 text-foreground dark:text-white">
                          {getCasaNome(relatorio.casaId)}
                        </td>
                        <td className="py-3 px-4 text-foreground dark:text-white">
                          {relatorio.agente}
                        </td>
                        <td className="py-3 px-4 text-foreground dark:text-white">
                          {relatorio.prazo ? new Date(relatorio.prazo).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleRestoreRelatorio(relatorio.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                            >
                              Restaurar
                            </button>
                            <button
                              onClick={() => handlePermanentlyDeleteRelatorio(relatorio.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                            >
                              Deletar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
