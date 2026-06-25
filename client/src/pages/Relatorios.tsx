import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Copy, Clock, ChevronDown, X, Check, CheckCircle2, Circle, CheckCheck, Tag } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import RelatorioSpreadsheet from "@/components/RelatorioSpreadsheet";
import AbaProgresso from "@/components/AbaProgresso";
import { usePageTransition } from "@/hooks/usePageTransition";
import { useConfirm } from "@/hooks/useConfirm";

// ----- Sub-component: card individual de relatório -----
interface RelatorioCardProps {
  rel: any;
  accent: string;
  isSelected: boolean;
  nome: string;
  loginCasa: string;
  lucroTotal: number;
  prazoDate: string | null;
  isVencido: boolean;
  countdown: string;
  onSelect: () => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onEtiqueta?: (e: React.MouseEvent) => void;
  selectMode?: boolean;
  checked?: boolean;
  onToggleCheck?: (e: React.MouseEvent) => void;
}

function RelatorioCard({
  rel, accent, isSelected, nome, loginCasa, lucroTotal,
  prazoDate, isVencido, countdown, onSelect, onDuplicate, onDelete, onEtiqueta,
  selectMode, checked, onToggleCheck,
}: RelatorioCardProps) {
  const [loginCopiado, setLoginCopiado] = useState(false);

  const copyLogin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loginCasa) return;
    navigator.clipboard.writeText(loginCasa);
    setLoginCopiado(true);
    setTimeout(() => setLoginCopiado(false), 2000);
  };

  return (
    <div
      onClick={(e) => { if (selectMode && onToggleCheck) { onToggleCheck(e); } else { onSelect(); } }}
      className="group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: isSelected
          ? `linear-gradient(145deg, ${accent}18, ${accent}06)`
          : "linear-gradient(145deg, #070e20, #0c1524)",
        border: `1px solid ${checked ? "#d4a017" : isSelected ? accent + "50" : "rgba(255,255,255,0.08)"}`,
        boxShadow: checked ? "0 0 24px rgba(212,160,23,0.25)" : isSelected ? `0 0 24px ${accent}20` : "none",
      }}
    >
      {/* Checkbox de seleção múltipla */}
      {selectMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCheck?.(e); }}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ color: checked ? "#d4a017" : "rgba(255,255,255,0.45)", background: "rgba(0,0,0,0.4)" }}
          title={checked ? "Desmarcar" : "Selecionar"}
        >
          {checked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>
      )}

      {/* Barra de cor no topo */}
      <div className="h-[2px] w-full" style={{ background: accent }} />

      {/* Etiquetas (várias) na frente do card */}
      {rel.etiqueta && (
        <div className="px-5 pt-3 flex flex-wrap gap-1.5">
          {String(rel.etiqueta).split(",").map((t: string) => t.trim()).filter(Boolean).map((t: string, i: number) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
              style={{ background: "rgba(212,160,23,0.18)", color: "#f3d078", border: "1px solid rgba(212,160,23,0.4)" }}
            >
              <Tag size={9} /> {t}
            </span>
          ))}
        </div>
      )}

      <div className="p-5">
        {/* Nome */}
        <p className="font-black text-base text-white/90 truncate mb-1" title={nome}>
          {nome}
        </p>

        {/* Login */}
        {loginCasa && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[9px] font-bold text-white/35 uppercase tracking-widest">Login:</span>
            <span className="text-[10px] font-mono text-[#d4a017]/80 truncate flex-1">{loginCasa}</span>
            <button
              onClick={copyLogin}
              title={loginCopiado ? "Copiado!" : "Copiar login"}
              className="flex items-center justify-center w-4 h-4 rounded transition-all shrink-0"
              style={{
                background: loginCopiado ? "rgba(212,160,23,0.25)" : "rgba(212,160,23,0.08)",
                border: "1px solid rgba(212,160,23,0.2)",
                color: loginCopiado ? "#d4a017" : "rgba(212,160,23,0.5)",
              }}
            >
              {loginCopiado ? <Check size={8} /> : <Copy size={8} />}
            </button>
          </div>
        )}

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

        {/* Lucro */}
        <div className="rounded-xl py-4 px-4 flex flex-col items-center justify-center mb-3 relative overflow-hidden"
          style={{
            background: lucroTotal >= 0
              ? "linear-gradient(145deg, rgba(74,222,128,0.08), rgba(74,222,128,0.04))"
              : "linear-gradient(145deg, rgba(248,113,113,0.08), rgba(248,113,113,0.04))",
            border: `1px solid ${lucroTotal >= 0 ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
          }}
        >
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
          {onEtiqueta && (
            <button
              onClick={onEtiqueta}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors border border-white/8 text-white/30 hover:text-[#d4a017] hover:border-[#d4a017]/30"
              style={{ background: "rgba(255,255,255,0.04)" }}
              title="Etiqueta"
            >
              <Tag size={14} />
            </button>
          )}
          <button
            onClick={onDuplicate}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors border border-white/8 text-white/30 hover:text-[#60a5fa] hover:border-[#60a5fa]/30"
            style={{ background: "rgba(255,255,255,0.04)" }}
            title="Duplicar"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onDelete}
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
}

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
  // Prazo conta a partir do DIA DE LANÇAMENTO real da plataforma (o dia da semana dela),
  // usando a ocorrência mais próxima de hoje (a que acabou de passar OU a que está chegando).
  // Ex: hoje é DOMINGO, VOY lança no SÁBADO -> conta a partir do sábado (ontem) + diasPrazo.
  // Usa data local (meio-dia) para evitar erro de fuso horário.
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const alvo = DIAS_SEMANA_MAP[diaSemana];

  const d = new Date(hoje);
  if (alvo !== undefined) {
    const atual = hoje.getDay();
    const paraFrente = (alvo - atual + 7) % 7;  // dias até a próxima ocorrência do lançamento
    const paraTras = (atual - alvo + 7) % 7;    // dias desde a ocorrência anterior do lançamento
    // pega a ocorrência mais próxima (passada ou futura) = o dia de lançamento real
    const offset = paraFrente <= paraTras ? paraFrente : -paraTras;
    d.setDate(d.getDate() + offset);            // vai até o dia de lançamento
  }
  d.setDate(d.getDate() + diasPrazo);           // soma os dias de prazo a partir do lançamento

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const atualizarPosicao = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  };

  const abrir = () => { atualizarPosicao(); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => atualizarPosicao();
    const onClickFora = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    document.addEventListener("mousedown", onClickFora);
    return () => {
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
      document.removeEventListener("mousedown", onClickFora);
    };
  }, [open]);

  const handleSelect = (p: any) => {
    setSelected(p);
    onSelect(p.dia, p.diasPrazo, p.nome);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : abrir())}
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

      {/* Dropdown Panel — renderizado em portal acima de tudo */}
      {open && coords && createPortal(
        <div
          ref={panelRef}
          className="rounded-2xl overflow-hidden shadow-2xl border border-white/12"
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
            background: "#070e20",
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
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
                  style={{ background: "#0a1428" }}
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
                      style={{ background: isSelected ? `${cor}22` : "#070e20" }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#070e20"; }}
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
        </div>,
        document.body
      )}
    </>
  );
}

export default function Relatorios() {
  const { state, addRelatorio, updateRelatorio, deleteRelatorio, finalizarRelatorio, finalizarCasa, duplicarRelatorio, esvaziarLixeira } = useApp();
  const { confirm, confirmEl } = useConfirm();
  const [finalizarDialogId, setFinalizarDialogId] = useState<string | null>(null);
  const [jogosTexto, setJogosTexto] = useState("");
  const [etiquetaDialogId, setEtiquetaDialogId] = useState<string | null>(null);
  const [etiquetaTexto, setEtiquetaTexto] = useState("");
  const [novaTag, setNovaTag] = useState("");
  const tagsEtiqueta = etiquetaTexto.split(",").map((t) => t.trim()).filter(Boolean);
  const adicionarTag = () => {
    const t = novaTag.trim();
    if (!t) return;
    setEtiquetaTexto([...tagsEtiqueta, t].join(", "));
    setNovaTag("");
  };
  const removerTag = (i: number) => setEtiquetaTexto(tagsEtiqueta.filter((_, idx) => idx !== i).join(", "));
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
  const [selectMode, setSelectMode] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });
  };

  const finalizarSelecionados = () => {
    const ids = [...selecionados];
    if (ids.length === 0) return;
    ids.forEach((id) => finalizarRelatorio(id));
    toast.success(`${ids.length} relatório(s) finalizado(s)!`);
    setSelecionados(new Set());
    setSelectMode(false);
  };

  const excluirSelecionados = async () => {
    const ids = [...selecionados];
    if (ids.length === 0) return;
    if (!(await confirm({ mensagem: `Mover ${ids.length} relatório(s) para a lixeira?`, confirmar: "Mover", perigo: true }))) return;
    ids.forEach((id) => updateRelatorio(id, { status: "lixeira" }));
    toast.success(`${ids.length} relatório(s) movido(s) para a lixeira.`);
    setSelecionados(new Set());
    setSelectMode(false);
  };

  const salvarEtiqueta = () => {
    if (!etiquetaDialogId) return;
    const pendente = novaTag.trim();
    const valor = [...tagsEtiqueta, ...(pendente ? [pendente] : [])].join(", ");
    updateRelatorio(etiquetaDialogId, { etiqueta: valor });
    setEtiquetaDialogId(null);
    setEtiquetaTexto("");
    setNovaTag("");
    toast.success(valor ? "Etiquetas salvas!" : "Etiquetas removidas.");
  };

  const abrirEtiqueta = (id: string) => {
    const rel = state.relatorios.find((r) => r.id === id);
    setEtiquetaTexto(rel?.etiqueta || "");
    setNovaTag("");
    setEtiquetaDialogId(id);
  };

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

  const handlePermanentlyDeleteRelatorio = async (relatorioId: string) => {
    if (await confirm({ mensagem: "Deletar permanentemente este relatório?", confirmar: "Deletar", perigo: true })) {
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

  const getCasaLogin = (casaId: string) => {
    return state.casas.find((c) => c.id === casaId)?.login || "";
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
              <div className="rounded-2xl p-5 border border-white/8 space-y-4 relative z-30"
                style={{ background: "linear-gradient(145deg, rgba(7,14,32,0.95), rgba(12,21,36,0.95))" }}
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

                {/* 2. Nome do Agente */}
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

                {/* 3. Prazo + Countdown (vem da rede escolhida na Meta) */}
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
                    O prazo vem da rede escolhida ao criar a Meta (em Criação de Meta)
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
                <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-white/70 uppercase tracking-wider">Relatórios Criados</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white/25">{relatoriosAtivos.length} ativo(s)</span>
                    <button
                      onClick={() => { setSelectMode((v) => !v); setSelecionados(new Set()); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                      style={selectMode
                        ? { background: "rgba(212,160,23,0.15)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.35)" }
                        : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <CheckCheck size={13} /> {selectMode ? "Cancelar" : "Selecionar vários"}
                    </button>
                  </div>
                </div>

                {/* Barra de ação em massa */}
                {selectMode && (
                  <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl flex-wrap"
                    style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)" }}
                  >
                    <span className="text-xs font-bold text-white/70">
                      {selecionados.size} selecionado(s)
                      <button
                        onClick={() => setSelecionados(new Set(relatoriosAtivos.map((r) => r.id)))}
                        className="ml-3 text-[10px] font-bold text-[#d4a017] hover:underline"
                      >Marcar todos</button>
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={excluirSelecionados}
                        disabled={selecionados.size === 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black text-red-300 border border-red-500/30 transition-all hover:bg-red-500/10 disabled:opacity-40"
                        style={{ background: "rgba(239,68,68,0.08)" }}
                      >
                        <Trash2 size={14} /> Excluir selecionados
                      </button>
                      <button
                        onClick={finalizarSelecionados}
                        disabled={selecionados.size === 0}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black text-[#050b18] transition-all hover:scale-[1.02] disabled:opacity-40"
                        style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                      >
                        <Check size={14} /> Finalizar selecionados
                      </button>
                    </div>
                  </div>
                )}
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
                        <RelatorioCard
                          key={rel.id}
                          rel={rel}
                          accent={accent}
                          isSelected={isSelected}
                          nome={nome}
                          loginCasa={getCasaLogin(rel.casaId)}
                          lucroTotal={lucroTotal}
                          prazoDate={prazoDate}
                          isVencido={isVencido}
                          countdown={countdown}
                          onSelect={() => setSelectedRelatorioId(rel.id)}
                          onDuplicate={(e) => { e.stopPropagation(); duplicarRelatorio(rel.id); }}
                          onDelete={(e) => { e.stopPropagation(); handleDeleteRelatorio(rel.id); }}
                          onEtiqueta={(e) => { e.stopPropagation(); abrirEtiqueta(rel.id); }}
                          selectMode={selectMode}
                          checked={selecionados.has(rel.id)}
                          onToggleCheck={() => toggleSelecionado(rel.id)}
                        />
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
                  login={getCasaLogin(currentRelatorio.casaId)}

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
                  onRestoreRows={(rows) => updateRelatorio(selectedRelatorioId, { rows })}
                />
                <button
                  onClick={() => {
                    if (selectedRelatorioId) {
                      const rel = relatoriosAtivos.find((r) => r.id === selectedRelatorioId);
                      setJogosTexto(rel?.jogos || "");
                      setFinalizarDialogId(selectedRelatorioId);
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
                  onClick={async () => {
                    if (await confirm({ mensagem: "Esvaziar a lixeira completamente? Os relatórios serão apagados de vez.", confirmar: "Esvaziar", perigo: true })) {
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

        {confirmEl}

        {/* Modal: etiqueta do relatório */}
        {etiquetaDialogId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setEtiquetaDialogId(null); }}
          >
            <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
              style={{ background: "linear-gradient(145deg, #070e20, #0f1e45)", border: "1px solid rgba(212,160,23,0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[#050b18]"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                ><Tag size={16} /></div>
                <h3 className="text-base font-black text-white">Etiqueta do relatório</h3>
              </div>
              <p className="text-xs text-white/45">Notas curtas que aparecem na frente do card. Ex.: "Só falta sacar", "Gates of Olympus". Pode colocar várias.</p>

              {/* Etiquetas atuais (chips) */}
              {tagsEtiqueta.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tagsEtiqueta.map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold"
                      style={{ background: "rgba(212,160,23,0.15)", color: "#f3d078", border: "1px solid rgba(212,160,23,0.35)" }}
                    >
                      {t}
                      <button onClick={() => removerTag(i)} className="text-white/40 hover:text-red-400"><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  maxLength={40}
                  placeholder="Nova etiqueta..."
                  value={novaTag}
                  onChange={(e) => setNovaTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") adicionarTag(); }}
                  className="flex-1 px-3 py-2.5 border border-white/15 rounded-lg text-sm bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-[#d4a017]"
                />
                <button onClick={adicionarTag}
                  className="px-4 rounded-lg text-sm font-bold text-[#050b18]"
                  style={{ background: "rgba(212,160,23,0.85)" }}
                >+ Add</button>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setEtiquetaDialogId(null)}
                  className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white/50 border border-white/12 hover:bg-white/5"
                >Cancelar</button>
                <button onClick={salvarEtiqueta}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                >Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Diálogo: finalizar também a meta vinculada? */}
        {finalizarDialogId && (() => {
          const rel = relatoriosAtivos.find((r) => r.id === finalizarDialogId);
          const casa = rel ? state.casas.find((c) => c.id === rel.casaId) : null;
          const nomeCasa = (casa?.nome || "a meta").replace(/[\s-]+$/, "").trim();
          const casaJaFinalizada = casa?.status !== "ativa";
          const finalizar = (comCasa: boolean) => {
            if (jogosTexto.trim() !== (rel?.jogos || "")) updateRelatorio(finalizarDialogId, { jogos: jogosTexto.trim() });
            finalizarRelatorio(finalizarDialogId);
            if (comCasa && rel?.casaId) finalizarCasa(rel.casaId);
            setSelectedRelatorioId("");
            setFinalizarDialogId(null);
            setJogosTexto("");
            toast.success(comCasa ? "Relatório e meta finalizados!" : "Relatório finalizado!");
          };
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
              onMouseDown={(e) => { if (e.target === e.currentTarget) setFinalizarDialogId(null); }}
            >
              <div className="w-full max-w-md rounded-2xl p-6 space-y-5"
                style={{ background: "linear-gradient(145deg, #070e20, #0f1e45)", border: "1px solid rgba(212,160,23,0.25)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[#050b18]"
                    style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                  >✓</div>
                  <h3 className="text-base font-black text-white">Finalizar Relatório</h3>
                </div>
                <p className="text-sm text-white/70">
                  Deseja finalizar <b className="text-white">também a meta</b> vinculada
                  (<span className="font-bold text-[#d4a017]">{nomeCasa}</span>)?
                  <br />
                  <span className="text-xs text-white/40">
                    {casaJaFinalizada
                      ? "Obs: essa meta já não está ativa."
                      : "Finalizar a meta tira ela da Operação CPA e move para Casas Finalizadas."}
                  </span>
                </p>

                {/* Quais jogos você fez nessa cooperação? */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#d4a017]/70 block mb-1">🎰 Quais jogos você fez?</label>
                  <textarea
                    rows={2}
                    placeholder="Ex.: Gates of Olympus, Touro, Fortune Tiger..."
                    value={jogosTexto}
                    onChange={(e) => setJogosTexto(e.target.value)}
                    className="w-full px-3 py-2.5 border border-white/15 rounded-lg text-sm bg-transparent text-white focus:outline-none focus:ring-1 focus:ring-[#d4a017] resize-none"
                  />
                  <p className="text-[10px] text-white/30 mt-1">Fica salvo no relatório pra você consultar depois e ver os melhores jogos.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => finalizar(true)}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.01]"
                    style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                  >Sim — finalizar relatório e meta</button>
                  <button onClick={() => finalizar(false)}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-white/80 border border-white/15 hover:bg-white/5 transition-colors"
                  >Não — só o relatório</button>
                  <button onClick={() => setFinalizarDialogId(null)}
                    className="w-full py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/60 transition-colors"
                  >Cancelar</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
