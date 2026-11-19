import { useApp } from "@/contexts/AppContext";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit2,
  FileText,
  ListFilter,
  ReceiptText,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { RelatorioData, RelatorioRow } from "@/lib/types";
import { valorRecebidoDoReembolso } from "@shared/reembolso";
import { toast } from "sonner";

const RELATORIOS_POR_PAGINA = 6;
const MESES_LBL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const normalizarBusca = (texto: string) => texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const formatarValor = (valor: number) => valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getMesKey(relatorio: RelatorioData) {
  const data = new Date(relatorio.finalizadoEm || relatorio.criadoEm);
  return isNaN(data.getTime()) ? "" : `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function mesLabel(key: string) {
  const [ano, mes] = key.split("-");
  return `${MESES_LBL[Number(mes) - 1]}/${ano}`;
}

const calculateTotalResultado = (rows: RelatorioRow[]) => rows.reduce((sum, row) => sum + row.resultado, 0);
const getRelatorioTotal = (relatorio: RelatorioData) =>
  calculateTotalResultado(relatorio.rows || []) + (relatorio.cooperacao || 0) + valorRecebidoDoReembolso(relatorio);
const temReembolsoRecebido = (relatorio: RelatorioData) =>
  relatorio.reembolso === "concluido" && relatorio.valorReembolso != null;

export default function RelatoriosFinalizados() {
  const { state, deleteRelatorio, reutilizarRelatorio, restaurarCasa, updateCasa, updateRelatorio } = useApp();
  const [selectedRelatorioId, setSelectedRelatorioId] = useState<string | null>(null);
  const [reutilizarDialogId, setReutilizarDialogId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<RelatorioData | null>(null);
  const isEditing = editingData !== null;
  const [filtroNomeInicial, setFiltroNomeInicial] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const detalhesRef = useRef<HTMLDivElement>(null);
  const detalhesId = useId();

  const relatoriosFinalizadosTodos = state.relatorios.filter((relatorio) => relatorio.status === "finalizado");

  const mesesDisponiveis = Array.from(new Set(relatoriosFinalizadosTodos.map(getMesKey).filter(Boolean))).sort().reverse();

  const relatoriosFinalizados = filtroMes
    ? relatoriosFinalizadosTodos.filter((r) => getMesKey(r) === filtroMes)
    : relatoriosFinalizadosTodos;

  const panelClass =
    "relative overflow-hidden rounded-2xl border border-white/10 bg-[#071226]/82 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl";
  const subtlePanelClass =
    "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_14px_42px_rgba(0,0,0,0.22)] backdrop-blur-xl";
  const goldButtonStyle = {
    background: "linear-gradient(135deg, #d4a017, #f6b51b)",
    color: "#050b18",
    boxShadow: "0 10px 24px rgba(212,160,23,0.24)",
  };
  const ghostButtonStyle = {
    background: "rgba(255,255,255,0.055)",
    color: "rgba(255,255,255,0.68)",
    border: "1px solid rgba(255,255,255,0.10)",
  };

  const nomesCasas = new Map(state.casas.map((casa) => [casa.id, casa.nome.replace(/[\s-]+$/, "").trim()]));
  const getCasaNome = (casaId: string) => nomesCasas.get(casaId) || "Casa não encontrada";
  const getNomeInicial = (casaId: string) => getCasaNome(casaId).split(/\s+/)[0].toUpperCase();
  const grupos = new Map<string, number>();
  for (const relatorio of relatoriosFinalizados) {
    const nome = getNomeInicial(relatorio.casaId);
    grupos.set(nome, (grupos.get(nome) || 0) + 1);
  }
  const nomesIniciais = [...grupos.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const termos = normalizarBusca(busca.trim()).split(/\s+/).filter(Boolean);
  const relatoriosFiltrados = relatoriosFinalizados.filter((relatorio) => {
    if (filtroNomeInicial && getNomeInicial(relatorio.casaId) !== filtroNomeInicial) return false;
    const texto = normalizarBusca(`${getCasaNome(relatorio.casaId)} ${relatorio.agente || ""}`);
    return termos.every((termo) => texto.includes(termo));
  }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const totalPaginas = Math.max(1, Math.ceil(relatoriosFiltrados.length / RELATORIOS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicioPagina = (paginaAtual - 1) * RELATORIOS_POR_PAGINA;
  const relatoriosDaPagina = relatoriosFiltrados.slice(inicioPagina, inicioPagina + RELATORIOS_POR_PAGINA);
  const selectedRelatorio = relatoriosDaPagina.find((relatorio) => relatorio.id === selectedRelatorioId);
  const relatorioExibido = editingData || selectedRelatorio;
  const totalSelecionado = relatorioExibido ? getRelatorioTotal(relatorioExibido) : 0;
  const temFiltros = Boolean(filtroMes || filtroNomeInicial || busca);

  useEffect(() => {
    if (pagina !== paginaAtual) setPagina(paginaAtual);
  }, [pagina, paginaAtual]);

  useEffect(() => {
    if (selectedRelatorioId && window.matchMedia?.("(width < 64rem)").matches) {
      detalhesRef.current?.scrollIntoView?.({ block: "start" });
    }
  }, [selectedRelatorioId]);

  const totalFinalizado = relatoriosFinalizados.reduce((total, relatorio) => total + getRelatorioTotal(relatorio), 0);

  const mudarPagina = (proximaPagina: number) => {
    setPagina(proximaPagina);
    setSelectedRelatorioId(null);
    setEditingData(null);
  };

  const handleReutilizar = (relatorioId: string) => {
    setReutilizarDialogId(relatorioId);
  };

  const executarReutilizar = async (comCasa: boolean) => {
    const id = reutilizarDialogId;
    if (!id) return;
    const rel = relatoriosFinalizadosTodos.find((r) => r.id === id);
    const casa = rel ? state.casas.find((c) => c.id === rel.casaId) : undefined;
    const reativarCasa = comCasa && casa?.status === "finalizada";
    if (reativarCasa && casa.reembolso === "concluido") {
      if (!(await updateCasa(casa.id, { status: "ativa", reembolso: null, reembolsadoEm: null }))) {
        toast.error("Não foi possível reativar a meta.");
        return;
      }
    } else if (reativarCasa) {
      restaurarCasa(casa.id);
    }
    reutilizarRelatorio(id);
    setReutilizarDialogId(null);
    setSelectedRelatorioId(null);
    if (rel?.reembolso === "concluido") {
      toast.success(reativarCasa ? "Relatório reaberto em Reembolso e meta reativada." : "Relatório reaberto em Reembolso.");
    } else {
      toast.success(reativarCasa ? "Relatório e meta reativados!" : "Relatório reativado em Operação CPA.");
    }
  };

  const handleEditClick = () => {
    if (!selectedRelatorio) return;
    setEditingData(selectedRelatorio);
  };

  const handleSaveEdit = () => {
    if (!editingData || !selectedRelatorio) return;
    const { agente, prazo, cooperacao, rows } = editingData;
    updateRelatorio(selectedRelatorio.id, { agente, prazo, cooperacao, rows });
    setEditingData(null);
    toast.success("Relatório atualizado com sucesso!");
  };

  const handleCancelEdit = () => {
    setEditingData(null);
  };

  const handleRowChange = (numero: number, field: "deposito" | "saque" | "bau" | "resultado", value: string) => {
    setEditingData((prev) => prev && ({
      ...prev,
      rows: prev.rows.map((row) => {
        if (row.numero === numero) {
          const updatedRow = {
            ...row,
            [field]: parseFloat(value) || 0,
          };
          if (field !== "resultado") {
            const d = updatedRow.deposito || 0;
            const r = updatedRow.redeposito || 0;
            const s = updatedRow.saque || 0;
            const b = updatedRow.bau || 0;
            updatedRow.resultado = s - d - r + b;
          }
          return updatedRow;
        }
        return row;
      }),
    }));
  };

  const handleFieldChange = (field: "agente" | "prazo" | "cooperacao", value: string) => {
    setEditingData((prev) => prev && ({
      ...prev,
      [field]: field === "cooperacao" ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="min-w-0 space-y-5">
      <div
        className="relative overflow-hidden rounded-3xl border border-[#d4a017]/18 p-4 shadow-[0_22px_74px_rgba(0,0,0,0.3)] sm:p-7"
        style={{ background: "linear-gradient(135deg, rgba(7,14,32,0.94), rgba(15,30,69,0.9))" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/50 to-transparent" />
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#d4a017]/10 blur-3xl" />
        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/38">
              Relatórios Finalizados
            </p>
            <div className="flex flex-wrap items-end gap-5">
              <p className="font-mono text-5xl font-black tracking-tighter text-[#d4a017]">
                {relatoriosFinalizados.length}
              </p>
              <div className="pb-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/35">Resultado do período</p>
                <p className={`mt-1 font-mono text-xl font-black ${totalFinalizado < 0 ? "text-red-300" : "text-emerald-300"}`}>
                  R$ {formatarValor(totalFinalizado)}
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-white/35">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4a017] animate-pulse" />
              {filtroMes ? `Relatórios finalizados em ${mesLabel(filtroMes)}` : "Total de relatórios finalizados"}
            </p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-[#d4a017]/20 bg-[#d4a017]/10 text-[#f6c64a] sm:flex">
            <FileText size={24} />
          </div>
        </div>
      </div>

      <div className={`${panelClass} p-4 sm:p-5`}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/30 to-transparent" />
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <ListFilter size={16} className="text-[#d4a017]" /> Filtros do arquivo
          </h3>
          {temFiltros && (
            <button type="button" className="min-h-11 text-sm font-semibold text-[#f3d078] hover:underline" onClick={() => {
              setBusca("");
              setFiltroMes("");
              setFiltroNomeInicial("");
              mudarPagina(1);
            }}>Limpar filtros</button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="min-w-0 text-sm font-semibold text-white/65 sm:col-span-2 lg:col-span-1">
            Buscar relatórios
            <span className="relative mt-1.5 block">
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#d4a017]" />
              <input type="search" value={busca} placeholder="Nome da casa ou agente"
                onChange={(e) => { setBusca(e.target.value); mudarPagina(1); }}
                className="min-h-11 w-full min-w-0 rounded-xl border border-white/15 bg-[#0d1c3c] py-2 pl-9 pr-3 text-base text-white outline-none placeholder:text-white/45 focus:border-[#d4a017]"
              />
            </span>
          </label>
          <label className="min-w-0 text-sm font-semibold text-white/65">
            <span className="flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" className="text-[#d4a017]" /> Mês</span>
            <select value={filtroMes} onChange={(e) => {
              setFiltroMes(e.target.value);
              setFiltroNomeInicial("");
              mudarPagina(1);
            }} className="mt-1.5 min-h-11 w-full rounded-xl border border-white/15 bg-[#0d1c3c] px-3 py-2 text-base text-white outline-none focus:border-[#d4a017]">
              <option value="">Todos os meses</option>
              {filtroMes && !mesesDisponiveis.includes(filtroMes) && <option value={filtroMes}>{mesLabel(filtroMes)}</option>}
              {mesesDisponiveis.map((mes) => <option key={mes} value={mes}>{mesLabel(mes)}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-sm font-semibold text-white/65">
            Nomenclatura da casa
            <select value={filtroNomeInicial}
              onChange={(e) => { setFiltroNomeInicial(e.target.value); mudarPagina(1); }}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-white/15 bg-[#0d1c3c] px-3 py-2 text-base text-white outline-none focus:border-[#d4a017]">
              <option value="">Todas as casas</option>
              {filtroNomeInicial && !grupos.has(filtroNomeInicial) && <option value={filtroNomeInicial}>{filtroNomeInicial} (0)</option>}
              {nomesIniciais.map((nome) => <option key={nome} value={nome}>{nome} ({grupos.get(nome)})</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className={`${panelClass} min-w-0 p-4 sm:p-5`} aria-label="Lista de relatórios finalizados">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/30 to-transparent" />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <ReceiptText size={16} className="text-[#d4a017]" /> Relatórios
            </h3>
            <p role="status" className="text-xs text-white/60">
              {relatoriosFiltrados.length > 0
                ? `${inicioPagina + 1} a ${inicioPagina + relatoriosDaPagina.length} de ${relatoriosFiltrados.length}`
                : "0 resultados"}
            </p>
          </div>

          {relatoriosDaPagina.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/55">
              {temFiltros ? "Nenhum relatório encontrado com esses filtros." : "Nenhum relatório finalizado ainda."}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {relatoriosDaPagina.map((relatorio) => {
                const isSelected = selectedRelatorio?.id === relatorio.id;
                const nomeCasa = getCasaNome(relatorio.casaId);
                const total = getRelatorioTotal(relatorio);
                return (
                  <li key={relatorio.id} className="min-w-0">
                    <button type="button" aria-pressed={isSelected} aria-controls={detalhesId}
                      onClick={() => {
                        if (isSelected) return;
                        setSelectedRelatorioId(relatorio.id);
                        setEditingData(null);
                      }}
                      className={`group flex h-full w-full flex-col gap-3 rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#d4a017] ${isSelected
                        ? "border-[#d4a017]/55 bg-gradient-to-br from-[#d4a017]/20 to-[#d4a017]/5"
                        : "border-white/10 bg-white/[0.035] hover:border-[#d4a017]/35"}`}
                    >
                      <span className="flex items-start gap-2.5">
                        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4a017]/15 text-sm font-black text-[#f3d078]">
                          {nomeCasa[0]?.toUpperCase() || "?"}
                        </span>
                        <span className="min-w-0">
                          <span className="block break-words text-sm font-black text-white">{nomeCasa}</span>
                          <span className="block break-words text-xs text-white/55">{relatorio.agente || "Sem agente"}</span>
                        </span>
                      </span>
                      <span className="mt-auto flex w-full flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                        <span className="text-xs text-white/55">{new Date(relatorio.finalizadoEm || relatorio.criadoEm).toLocaleDateString("pt-BR")}</span>
                        <span className={`rounded-lg px-2 py-1 font-mono text-xs font-black ${total < 0 ? "bg-red-300/10 text-red-300" : "bg-emerald-300/10 text-emerald-300"}`}>
                          R$ {formatarValor(total)}
                        </span>
                      </span>
                      {temReembolsoRecebido(relatorio) && (
                        <span className="text-xs text-blue-200">Reembolso recebido: R$ {formatarValor(valorRecebidoDoReembolso(relatorio))}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {totalPaginas > 1 && (
            <nav aria-label="Paginação dos relatórios" className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
              <button type="button" onClick={() => mudarPagina(paginaAtual - 1)} disabled={paginaAtual === 1}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-white/15 px-2 text-sm font-bold text-white/85 hover:bg-white/10 disabled:opacity-40 sm:px-3"
              ><ChevronLeft size={16} aria-hidden="true" /> Anterior</button>
              <span className="grow text-center text-xs text-white/65">Página {paginaAtual} de {totalPaginas}</span>
              <button type="button" onClick={() => mudarPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas}
                className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-white/15 px-2 text-sm font-bold text-white/85 hover:bg-white/10 disabled:opacity-40 sm:px-3"
              >Próxima <ChevronRight size={16} aria-hidden="true" /></button>
            </nav>
          )}
        </section>

        <div ref={detalhesRef} id={detalhesId} className="min-w-0 scroll-mt-3">
          {selectedRelatorio ? (
            <div className="space-y-4">
              <div className={`${panelClass} p-4 sm:p-6`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/30 to-transparent" />
                <div className="relative mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Relatório selecionado</p>
                    <h3 className="mt-1 break-words text-2xl font-black text-white">{getCasaNome(selectedRelatorio.casaId)}</h3>
                    <p className="mt-2 text-sm text-white/50">
                      Agente:{" "}
                      {isEditing ? (
                        <input
                          type="text"
                          aria-label="Agente"
                          value={editingData?.agente || ""}
                          onChange={(e) => handleFieldChange("agente", e.target.value)}
                          className="min-h-11 max-w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-base text-white outline-none focus:border-[#d4a017]/60"
                        />
                      ) : (
                        selectedRelatorio.agente || "-"
                      )}
                    </p>
                    {/* Etiquetas */}
                    {selectedRelatorio.etiqueta && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {String(selectedRelatorio.etiqueta).split(",").map((t: string) => t.trim()).filter(Boolean).map((t: string, i: number) => (
                          <span key={i} className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                            style={{ background: "rgba(212,160,23,0.18)", color: "#f3d078", border: "1px solid rgba(212,160,23,0.4)" }}
                          >{t}</span>
                        ))}
                      </div>
                    )}
                    {/* Jogos feitos */}
                    {selectedRelatorio.jogos && (
                      <p className="mt-2 text-sm text-white/50">🎰 Jogos: <span className="font-medium text-white/75">{selectedRelatorio.jogos}</span></p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left sm:text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/35">Prazo</p>
                    <p className="mt-1 text-lg font-black text-white">
                      {isEditing ? (
                        <input
                          type="date"
                          aria-label="Prazo"
                          value={editingData?.prazo?.split("T")[0] || ""}
                          onChange={(e) => handleFieldChange("prazo", e.target.value)}
                          className="min-h-11 max-w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-base text-white outline-none focus:border-[#d4a017]/60"
                        />
                      ) : (
                        new Date(selectedRelatorio.prazo).toLocaleDateString("pt-BR")
                      )}
                    </p>
                  </div>
                </div>

                <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-300/15 bg-blue-300/[0.055] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-200/45">Cooperação</p>
                    {isEditing ? (
                      <input
                        type="number"
                        aria-label="Cooperação"
                        step="0.01"
                        value={editingData?.cooperacao || 0}
                        onChange={(e) => handleFieldChange("cooperacao", e.target.value)}
                        className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-base text-white outline-none focus:border-[#d4a017]/60"
                      />
                    ) : (
                      <p className="mt-2 font-mono text-xl font-black text-blue-300">
                        R$ {formatarValor(selectedRelatorio.cooperacao || 0)}
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-200/45">Resultado Total</p>
                    <p className={`mt-2 font-mono text-xl font-black ${totalSelecionado < 0 ? "text-red-300" : "text-emerald-300"}`}>
                      R$ {formatarValor(totalSelecionado)}
                    </p>
                  </div>
                  {temReembolsoRecebido(selectedRelatorio) && (
                    <p className="rounded-xl border border-blue-300/15 bg-blue-300/[0.055] px-4 py-3 text-sm text-blue-200 sm:col-span-2">
                      Reembolso recebido: R$ {formatarValor(valorRecebidoDoReembolso(selectedRelatorio))}
                    </p>
                  )}
                </div>
              </div>

              <div className={`${subtlePanelClass} overflow-x-auto p-4 sm:p-6`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                <h4 className="mb-4 font-bold text-white">Dados do relatório</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-2 py-3 text-left font-bold text-white/55">#</th>
                      <th className="px-2 py-3 text-left font-bold text-white/55">Depósito</th>
                      <th className="px-2 py-3 text-left font-bold text-white/55">Saque</th>
                      <th className="px-2 py-3 text-left font-bold text-white/55">Baú</th>
                      <th className="px-2 py-3 text-left font-bold text-white/55">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(editingData?.rows || selectedRelatorio.rows).map((row) => (
                      <tr key={row.numero} className="border-b border-white/8 transition-colors hover:bg-white/[0.035]">
                        <td className="px-2 py-3 text-white/70">{row.numero}</td>
                        {(["deposito", "saque", "bau"] as const).map((field) => (
                          <td key={field} className="px-2 py-3 text-white/70">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={row[field]}
                                onChange={(e) => handleRowChange(row.numero, field, e.target.value)}
                                className="w-24 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-white outline-none focus:border-[#d4a017]/60"
                              />
                            ) : (
                              `R$ ${(row[field] || 0).toFixed(2)}`
                            )}
                          </td>
                        ))}
                        <td className={`px-2 py-3 font-black ${row.resultado >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={row.resultado}
                              onChange={(e) => handleRowChange(row.numero, "resultado", e.target.value)}
                              className="w-24 rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-white outline-none focus:border-[#d4a017]/60"
                            />
                          ) : (
                            `R$ ${(row.resultado || 0).toFixed(2)}`
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handleEditClick}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all hover:scale-[1.01]"
                      style={goldButtonStyle}
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    <button
                      onClick={() => handleReutilizar(selectedRelatorio.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors hover:bg-white/8"
                      style={ghostButtonStyle}
                    >
                      <Copy size={16} /> Reutilizar
                    </button>
                    <button
                      onClick={() => {
                        deleteRelatorio(selectedRelatorio.id);
                        setSelectedRelatorioId(null);
                        toast.success("Relatório excluído");
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300 transition-colors hover:bg-red-400/18"
                    >
                      <Trash2 size={16} /> Excluir
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all hover:scale-[1.01]"
                      style={goldButtonStyle}
                    >
                      <Check size={16} /> Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors hover:bg-white/8"
                      style={ghostButtonStyle}
                    >
                      <X size={16} /> Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={`${subtlePanelClass} hidden min-h-[320px] flex-col items-center justify-center p-12 text-center lg:flex`}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/30 to-transparent" />
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#d4a017]/20"
                style={{ background: "radial-gradient(circle at 50% 30%, rgba(212,160,23,0.18), rgba(212,160,23,0.04))" }}
              >
                <FileText size={34} className="text-[#d4a017]/75" />
              </div>
              <p className="text-base font-bold text-white/55">Nenhum relatório selecionado</p>
              <p className="mt-1 text-sm text-white/45">Escolha um cartão para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo: reutilizar também a meta vinculada? */}
      {reutilizarDialogId && (() => {
        const rel = relatoriosFinalizadosTodos.find((r) => r.id === reutilizarDialogId);
        const casa = rel ? state.casas.find((c) => c.id === rel.casaId) : null;
        const nomeCasa = (casa?.nome || "a meta").replace(/[\s-]+$/, "").trim();
        const casaFinalizada = casa?.status === "finalizada";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setReutilizarDialogId(null); }}
          >
            <div role="dialog" aria-modal="true" aria-label="Reutilizar relatório" className="w-full max-w-md rounded-2xl p-6 space-y-5"
              style={{ background: "linear-gradient(145deg, #070e20, #0f1e45)", border: "1px solid rgba(212,160,23,0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[#050b18]"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                ><Copy size={16} /></div>
                <h3 className="text-base font-black text-white">Reutilizar Relatório</h3>
              </div>
              {rel?.reembolso === "concluido" && (
                <p className="text-sm text-blue-200">O relatório voltará para Reembolso como pendente. O valor só volta a contar quando o reembolso for concluído de novo.</p>
              )}
              <p className="text-sm text-white/70">
                Deseja reativar <b className="text-white">também a meta</b> vinculada
                (<span className="font-bold text-[#d4a017]">{nomeCasa}</span>)?
                <br />
                <span className="text-xs text-white/40">
                  {casaFinalizada
                    ? "Reativar a meta tira ela de Casas Finalizadas e volta para Operação CPA."
                    : "Obs: essa meta não está finalizada (continua como está)."}
                </span>
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={() => executarReutilizar(true)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                >Sim — reativar relatório e meta</button>
                <button onClick={() => executarReutilizar(false)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white/80 border border-white/15 hover:bg-white/5 transition-colors"
                >Não — só o relatório</button>
                <button onClick={() => setReutilizarDialogId(null)}
                  className="w-full py-2 rounded-xl text-xs font-medium text-white/40 hover:text-white/60 transition-colors"
                >Cancelar</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
