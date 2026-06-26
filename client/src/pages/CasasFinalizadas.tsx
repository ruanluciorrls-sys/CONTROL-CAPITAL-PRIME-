import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  CalendarDays,
  CheckSquare2,
  Edit2,
  Eye,
  EyeOff,
  RotateCcw,
  Square,
  Trash2,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";

export default function CasasFinalizadas() {
  const { state, updateCasa, deletePermanentementeCasa, esvaziarLixeiraCasas } = useApp();
  const { confirm, confirmEl } = useConfirm();
  const { data: totalGastosProxy = 0 } = trpc.gastosProxy.total.useQuery();
  const [editingCasa, setEditingCasa] = useState<any>(null);
  const [editData, setEditData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"finalizadas" | "lixeira">("finalizadas");
  const [filtroNomeInicial, setFiltroNomeInicial] = useState("");
  const [filtroMes, setFiltroMes] = useState<string | null>(null);
  const [selectedLixeira, setSelectedLixeira] = useState<Set<string>>(new Set());

  const panelClass =
    "relative overflow-hidden rounded-2xl border border-white/10 bg-[#071226]/80 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl";
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

  // Agente da casa = puxado do relatório vinculado (mais recente). A casa não guarda agente.
  const getAgenteCasa = (casaId: string): string => {
    const rels = state.relatorios.filter((r) => r.casaId === casaId && r.agente);
    if (rels.length === 0) return "";
    rels.sort((a, b) => new Date(b.finalizadoEm || b.criadoEm).getTime() - new Date(a.finalizadoEm || a.criadoEm).getTime());
    return rels[0].agente || "";
  };

  const getNomeInicial = (nome: string) => nome.trim().split(/\s+/)[0].toUpperCase();

  const casasFinalizadas = state.casas.filter((c) => c.status === "finalizada");
  const casasLixeira = state.casas.filter((c) => c.status === "lixeira");

  const getMesesDisponiveis = () => {
    const meses: string[] = [];
    const hoje = new Date();
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      meses.push(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`);
    }
    return meses;
  };

  const getCasasMes = (mesKey: string) => {
    return casasFinalizadas.filter((casa) => {
      if (!casa.dataFim) return false;
      const dataCasa = new Date(casa.dataFim);
      const casaMesKey = `${dataCasa.getFullYear()}-${String(dataCasa.getMonth() + 1).padStart(2, "0")}`;
      return casaMesKey === mesKey;
    });
  };

  const casasFiltradas =
    filtroMes === null || filtroMes === "todas" ? casasFinalizadas : getCasasMes(filtroMes);

  const casasFiltroNome =
    filtroNomeInicial === ""
      ? casasFiltradas
      : casasFiltradas.filter((casa) => getNomeInicial(casa.nome) === filtroNomeInicial);

  const calculateCasaLucros = (casaId: string) => {
    const relatoriosCasa = state.relatorios.filter(
      (relatorio) => relatorio.casaId === casaId && relatorio.status === "finalizado"
    );
    const totalResultado = relatoriosCasa.reduce(
      (total, relatorio) =>
        total + relatorio.rows.reduce((sum, row) => sum + row.resultado, 0),
      0
    );
    const totalCooperacao = relatoriosCasa.reduce(
      (total, relatorio) => total + relatorio.cooperacao,
      0
    );
    return totalResultado + totalCooperacao;
  };

  const totalLucrosTodosFiltrados = casasFiltroNome.reduce((total, casa) => {
    return total + calculateCasaLucros(casa.id);
  }, 0);

  const nomesIniciais = Array.from(new Set(casasFinalizadas.map((casa) => getNomeInicial(casa.nome)))).sort();
  const mesesDisponiveis = getMesesDisponiveis();

  const handleEditClick = (casa: any) => {
    setEditingCasa(casa);
    // Pré-preenche o agente vindo do relatório vinculado (a casa não guarda agente)
    setEditData({ ...casa, agente: casa.agente || getAgenteCasa(casa.id) });
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    updateCasa(editData.id, editData);
    setEditingCasa(null);
    setEditData(null);
    toast.success("Casa atualizada com sucesso!");
  };

  const handleReactivate = (casaId: string) => {
    updateCasa(casaId, { status: "ativa" });
    toast.success("Casa reativada com sucesso!");
  };

  const toggleSelectAll = () => {
    setSelectedLixeira(
      selectedLixeira.size === casasLixeira.length ? new Set() : new Set(casasLixeira.map((casa) => casa.id))
    );
  };

  const toggleSelectItem = (id: string) => {
    const nextSelected = new Set(selectedLixeira);
    if (nextSelected.has(id)) {
      nextSelected.delete(id);
    } else {
      nextSelected.add(id);
    }
    setSelectedLixeira(nextSelected);
  };

  const handleDeleteMultiple = async () => {
    if (await confirm({ mensagem: `Deletar permanentemente ${selectedLixeira.size} casa(s)?`, confirmar: "Deletar", perigo: true })) {
      const quantidade = selectedLixeira.size;
      selectedLixeira.forEach((id) => deletePermanentementeCasa(id));
      setSelectedLixeira(new Set());
      toast.success(`${quantidade} casa(s) deletada(s) permanentemente`);
    }
  };

  const handleEsvaziarLixeira = async () => {
    if (await confirm({ mensagem: `Esvaziar lixeira? ${casasLixeira.length} casa(s) serão deletadas permanentemente.`, confirmar: "Esvaziar", perigo: true })) {
      esvaziarLixeiraCasas();
      toast.success("Lixeira esvaziada com sucesso!");
    }
  };

  const handleRecoverMultiple = async () => {
    if (selectedLixeira.size === 0) return;
    if (await confirm({ mensagem: `Recuperar ${selectedLixeira.size} casa(s)? Serão movidas para Casas Ativas.`, confirmar: "Recuperar" })) {
      const quantidade = selectedLixeira.size;
      selectedLixeira.forEach((id) => updateCasa(id, { status: "ativa" }));
      setSelectedLixeira(new Set());
      toast.success(`${quantidade} casa(s) recuperada(s)!`);
    }
  };

  return (
    <div className="space-y-8">
      {confirmEl}
      <div
        className="flex w-fit gap-1.5 rounded-2xl border border-white/10 p-1.5 shadow-[0_10px_34px_rgba(0,0,0,0.24)]"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.025))" }}
      >
        {[
          { id: "finalizadas", label: `Casas Finalizadas (${casasFinalizadas.length})` },
          { id: "lixeira", label: `Lixeira (${casasLixeira.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="rounded-xl px-5 py-2.5 text-xs font-black transition-all whitespace-nowrap"
            style={
              activeTab === tab.id
                ? goldButtonStyle
                : { color: "rgba(255,255,255,0.45)" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "finalizadas" && (
        <>
          <div className={`grid grid-cols-1 ${totalGastosProxy > 0 ? "md:grid-cols-2" : ""} gap-4`}>
            <div
              className="relative overflow-hidden rounded-3xl border border-emerald-400/20 p-7 shadow-[0_20px_70px_rgba(6,95,70,0.18)]"
              style={{ background: "linear-gradient(135deg, rgba(6,26,28,0.94), rgba(7,33,56,0.9))" }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300/55">
                    Lucro Total - Casas Finalizadas
                  </p>
                  <p className="font-mono text-4xl font-black tracking-tighter text-emerald-300 sm:text-5xl">
                    R$ {(totalLucrosTodosFiltrados || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="mt-4 flex items-center gap-2 text-xs text-emerald-200/45">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    {casasFiltradas.length} casas {filtroNomeInicial ? "filtradas" : "finalizadas"}
                  </p>
                </div>
                <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 sm:flex">
                  <Trophy size={22} />
                </div>
              </div>
            </div>

            {totalGastosProxy > 0 && (
              <div
                className="relative overflow-hidden rounded-3xl border border-orange-400/20 p-7 shadow-[0_20px_70px_rgba(251,146,60,0.14)]"
                style={{ background: "linear-gradient(135deg, rgba(34,18,10,0.94), rgba(47,27,10,0.88))" }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/45 to-transparent" />
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-orange-300/55">
                  Lucro Real (desconto gasto/despesas)
                </p>
                <p className="font-mono text-4xl font-black tracking-tighter text-orange-300 sm:text-5xl">
                  R$ {((totalLucrosTodosFiltrados || 0) - totalGastosProxy).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="mt-4 flex items-center gap-2 text-xs text-orange-200/45">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-300 animate-pulse" />
                  Gasto/Despesas: - R$ {totalGastosProxy.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          <div className={`${subtlePanelClass} p-5`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/35 to-transparent" />
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={15} className="text-[#d4a017]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/45">Filtrar por Mes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroMes("todas")}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
                style={filtroMes === "todas" || filtroMes === null ? goldButtonStyle : ghostButtonStyle}
              >
                Todas ({casasFinalizadas.length})
              </button>
              {mesesDisponiveis
                .filter((mes) => getCasasMes(mes).length > 0)
                .map((mesKey) => {
                  const [ano, mes] = mesKey.split("-");
                  const data = new Date(parseInt(ano), parseInt(mes) - 1);
                  const mesLabel = data.toLocaleString("pt-BR", { month: "short", year: "numeric" });
                  const casasMes = getCasasMes(mesKey);
                  const isActive = filtroMes === mesKey;
                  return (
                    <button
                      key={mesKey}
                      onClick={() => setFiltroMes(mesKey)}
                      className="rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all"
                      style={isActive ? goldButtonStyle : ghostButtonStyle}
                    >
                      {mesLabel} <span className="opacity-60">({casasMes.length})</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className={`${subtlePanelClass} p-5`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/25 to-transparent" />
            <label className="mb-3 block text-sm font-bold text-white/85">Filtrar por Nome da Casa</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFiltroNomeInicial("")}
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
                style={filtroNomeInicial === "" ? goldButtonStyle : ghostButtonStyle}
              >
                Todas
              </button>
              {nomesIniciais.map((nomeInicial) => {
                const casasDoGrupo = casasFinalizadas.filter((casa) => getNomeInicial(casa.nome) === nomeInicial);
                return (
                  <button
                    key={nomeInicial}
                    onClick={() => setFiltroNomeInicial(nomeInicial)}
                    className="rounded-xl px-4 py-2 text-xs font-bold transition-all"
                    style={filtroNomeInicial === nomeInicial ? goldButtonStyle : ghostButtonStyle}
                  >
                    {nomeInicial} ({casasDoGrupo.length})
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`${panelClass} p-6`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/30 to-transparent" />
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Arquivo Operacional</p>
                <h3 className="mt-1 text-xl font-bold text-white">Historico de Casas</h3>
              </div>
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#d4a017] sm:flex">
                <Archive size={18} />
              </div>
            </div>

            {casasFiltroNome.length === 0 ? (
              <p className="text-white/45">
                {filtroNomeInicial ? "Nenhuma casa encontrada com esse nome inicial" : "Nenhuma casa finalizada ainda"}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {casasFiltroNome.map((casa) => {
                  const lucrosCasa = calculateCasaLucros(casa.id);
                  const isLucro = lucrosCasa > 0;

                  return (
                    <div
                      key={casa.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1c3c]/90 to-[#071226]/92 p-5 shadow-[0_12px_34px_rgba(0,0,0,0.24)] transition-all hover:-translate-y-1 hover:border-[#d4a017]/35 hover:shadow-[0_20px_46px_rgba(0,0,0,0.34)]"
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-[#d4a017]/8 blur-2xl" />
                      <div className="relative">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black text-[#050b18]"
                              style={{ background: "linear-gradient(135deg, #f3d078, #d4a017)", boxShadow: "0 4px 14px rgba(212,160,23,0.35)" }}
                            >
                              {casa.nome.trim()[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Casa</p>
                              <h4 className="truncate text-lg font-black text-white">{casa.nome}</h4>
                              {getAgenteCasa(casa.id) && (
                                <p className="truncate text-[11px] font-semibold text-[#d4a017]/70">👤 {getAgenteCasa(casa.id)}</p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                              isLucro
                                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-300"
                                : "border-red-300/20 bg-red-300/10 text-red-300"
                            }`}
                          >
                            {isLucro ? "Lucro" : "Prejuizo"}
                          </span>
                        </div>

                        <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Lucro</p>
                          <p className={`mt-1 font-mono text-2xl font-black ${isLucro ? "text-emerald-300" : "text-red-300"}`}>
                            R$ {(lucrosCasa || 0).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Finalizada em</p>
                            <p className="mt-1 text-sm font-bold text-white/80">
                              {casa.dataFim ? new Date(casa.dataFim).toLocaleDateString("pt-BR") : "N/A"}
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEditClick(casa)}
                              className="h-9 w-9 rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-300 transition-colors hover:bg-blue-400/18"
                              title="Editar casa"
                            >
                              <Edit2 size={16} className="mx-auto" />
                            </button>
                            <button
                              onClick={() => handleReactivate(casa.id)}
                              className="h-9 w-9 rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 transition-colors hover:bg-emerald-400/18"
                              title="Reativar casa"
                            >
                              <RotateCcw size={16} className="mx-auto" />
                            </button>
                            <button
                              onClick={async () => {
                                if (await confirm({ mensagem: "Mover esta casa para a lixeira?", confirmar: "Mover", perigo: true })) {
                                  updateCasa(casa.id, { status: "lixeira" });
                                  toast.success("Casa movida para a lixeira");
                                }
                              }}
                              className="h-9 w-9 rounded-xl border border-red-400/20 bg-red-400/10 text-red-300 transition-colors hover:bg-red-400/18"
                              title="Mover para lixeira"
                            >
                              <Trash2 size={16} className="mx-auto" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "lixeira" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Casas removidas</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Lixeira de Casas</h2>
            </div>
            {casasLixeira.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedLixeira.size > 0 && (
                  <>
                    <button
                      onClick={handleRecoverMultiple}
                      className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-400/18"
                    >
                      Recuperar {selectedLixeira.size}
                    </button>
                    <button
                      onClick={handleDeleteMultiple}
                      className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-300 transition-colors hover:bg-red-400/18"
                    >
                      Deletar {selectedLixeira.size}
                    </button>
                  </>
                )}
                <button
                  onClick={handleEsvaziarLixeira}
                  className="rounded-xl border border-white/12 bg-white/[0.035] px-4 py-2 text-sm font-bold text-white/65 transition-colors hover:bg-white/8"
                >
                  Esvaziar lixeira
                </button>
              </div>
            )}
          </div>

          {casasLixeira.length === 0 ? (
            <div className={`${subtlePanelClass} p-10 text-center`}>
              <p className="text-lg text-white/45">Nenhuma casa na lixeira</p>
            </div>
          ) : (
            <div className={`${panelClass} overflow-x-auto`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    <th className="w-12 px-4 py-3 text-left font-semibold text-white/70">
                      <button onClick={toggleSelectAll} className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10">
                        {selectedLixeira.size === casasLixeira.length && casasLixeira.length > 0 ? (
                          <CheckSquare2 size={18} className="text-[#d4a017]" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-white/70">Nome</th>
                    <th className="px-4 py-3 text-left font-semibold text-white/70">Agente</th>
                    <th className="px-4 py-3 text-center font-semibold text-white/70">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {casasLixeira.map((casa) => (
                    <tr key={casa.id} className="border-b border-white/8 transition-colors hover:bg-white/[0.035]">
                      <td className="w-12 px-4 py-3 text-white/75">
                        <button onClick={() => toggleSelectItem(casa.id)} className="rounded-lg p-1 transition-colors hover:bg-white/10">
                          {selectedLixeira.has(casa.id) ? (
                            <CheckSquare2 size={18} className="text-[#d4a017]" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-bold text-white/85">{casa.nome}</td>
                      <td className="px-4 py-3 text-white/55">{getAgenteCasa(casa.id) || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(casa)}
                            className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-2 text-blue-300 transition-colors hover:bg-blue-400/18"
                            title="Editar casa"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              updateCasa(casa.id, { status: "ativa" });
                              toast.success("Casa recuperada!");
                            }}
                            className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-300 transition-colors hover:bg-emerald-400/18"
                            title="Recuperar casa"
                          >
                            <RotateCcw size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              if (await confirm({ mensagem: "Deletar permanentemente esta casa?", confirmar: "Deletar", perigo: true })) {
                                deletePermanentementeCasa(casa.id);
                                toast.success("Casa deletada permanentemente");
                              }
                            }}
                            className="rounded-xl border border-red-400/20 bg-red-400/10 p-2 text-red-300 transition-colors hover:bg-red-400/18"
                            title="Deletar permanentemente"
                          >
                            <Trash2 size={18} />
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

      {editingCasa && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#071226]/95 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Editar Casa</h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">Nome da Casa</label>
                <input
                  type="text"
                  value={editData.nome || ""}
                  onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white outline-none transition focus:border-[#d4a017]/60 focus:ring-2 focus:ring-[#d4a017]/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">Login</label>
                <input
                  type="text"
                  value={editData.login || ""}
                  onChange={(e) => setEditData({ ...editData, login: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white outline-none transition focus:border-[#d4a017]/60 focus:ring-2 focus:ring-[#d4a017]/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={editData.senha || ""}
                    onChange={(e) => setEditData({ ...editData, senha: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 pr-10 text-white outline-none transition focus:border-[#d4a017]/60 focus:ring-2 focus:ring-[#d4a017]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 transition-colors hover:text-white/80"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">Agente <span className="text-[10px] text-white/30">(do relatório vinculado)</span></label>
                <input
                  type="text"
                  readOnly
                  value={editData.agente || "—"}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-white/60 outline-none cursor-default"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">Meta</label>
                <input
                  type="number"
                  value={editData.meta || 0}
                  onChange={(e) => setEditData({ ...editData, meta: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white outline-none transition focus:border-[#d4a017]/60 focus:ring-2 focus:ring-[#d4a017]/15"
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-white/10 pt-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 rounded-xl px-4 py-2 font-bold transition-all hover:scale-[1.01]"
                style={goldButtonStyle}
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditingCasa(null);
                  setEditData(null);
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 font-bold text-white/65 transition-colors hover:bg-white/8"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
