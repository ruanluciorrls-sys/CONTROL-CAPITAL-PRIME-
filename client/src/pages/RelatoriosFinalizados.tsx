import { useApp } from "@/contexts/AppContext";
import {
  Check,
  Copy,
  Edit2,
  FileText,
  ListFilter,
  ReceiptText,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function RelatoriosFinalizados() {
  const { state, deleteRelatorio, reutilizarRelatorio, updateRelatorio } = useApp();
  const [selectedRelatorioId, setSelectedRelatorioId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [filtroNomeInicial, setFiltroNomeInicial] = useState("");

  const relatoriosFinalizados = state.relatorios.filter((relatorio) => relatorio.status === "finalizado");

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

  const getCasaNome = (casaId: string) => {
    return state.casas.find((casa) => casa.id === casaId)?.nome || "Casa nao encontrada";
  };

  const getNomeInicial = (nome: string) => nome.trim().split(/\s+/)[0].toUpperCase();

  const relatoriosAgrupados = () => {
    const grupos: { [key: string]: any[] } = {};
    relatoriosFinalizados.forEach((relatorio) => {
      const nomeInicial = getNomeInicial(getCasaNome(relatorio.casaId));
      if (!grupos[nomeInicial]) grupos[nomeInicial] = [];
      grupos[nomeInicial].push(relatorio);
    });
    Object.keys(grupos).forEach((key) => {
      grupos[key].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    });
    return grupos;
  };

  const grupos = relatoriosAgrupados();
  const nomesIniciais = Object.keys(grupos).sort();
  const relatoriosFiltrados =
    filtroNomeInicial === ""
      ? [...relatoriosFinalizados].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
      : grupos[filtroNomeInicial] || [];

  const selectedRelatorio = selectedRelatorioId
    ? relatoriosFiltrados.find((relatorio) => relatorio.id === selectedRelatorioId)
    : null;

  const calculateTotalResultado = (rows: any[]) => rows.reduce((sum, row) => sum + row.resultado, 0);

  const getRelatorioTotal = (relatorio: any) => {
    return calculateTotalResultado(relatorio.rows || []) + (relatorio.cooperacao || 0);
  };

  const totalFinalizado = relatoriosFinalizados.reduce((total, relatorio) => total + getRelatorioTotal(relatorio), 0);

  const handleReutilizar = (relatorioId: string) => {
    reutilizarRelatorio(relatorioId);
    toast.success("Relatorio reutilizado! Verifique em Operacao CPA.");
  };

  const handleEditClick = () => {
    if (!selectedRelatorio) return;
    setEditingData(JSON.parse(JSON.stringify(selectedRelatorio)));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editingData || !selectedRelatorio) return;
    updateRelatorio(selectedRelatorio.id, editingData);
    setIsEditing(false);
    setEditingData(null);
    toast.success("Relatorio atualizado com sucesso!");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingData(null);
  };

  const handleRowChange = (numero: number, field: string, value: string) => {
    setEditingData((prev: any) => ({
      ...prev,
      rows: prev.rows.map((row: any) =>
        row.numero === numero
          ? {
              ...row,
              [field]: parseFloat(value) || 0,
            }
          : row
      ),
    }));
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditingData((prev: any) => ({
      ...prev,
      [field]: field === "cooperacao" ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="space-y-8">
      <div
        className="relative overflow-hidden rounded-3xl border border-[#d4a017]/18 p-7 shadow-[0_22px_74px_rgba(0,0,0,0.3)]"
        style={{ background: "linear-gradient(135deg, rgba(7,14,32,0.94), rgba(15,30,69,0.9))" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/50 to-transparent" />
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#d4a017]/10 blur-3xl" />
        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/38">
              Relatorios Finalizados
            </p>
            <div className="flex flex-wrap items-end gap-5">
              <p className="font-mono text-5xl font-black tracking-tighter text-[#d4a017]">
                {relatoriosFinalizados.length}
              </p>
              <div className="pb-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/35">Resultado arquivado</p>
                <p className="mt-1 font-mono text-xl font-black text-emerald-300">
                  R$ {totalFinalizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-white/35">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d4a017] animate-pulse" />
              Total de relatorios finalizados
            </p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-[#d4a017]/20 bg-[#d4a017]/10 text-[#f6c64a] sm:flex">
            <FileText size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className={`${panelClass} p-5`}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/30 to-transparent" />
            <div className="mb-4 flex items-center gap-2">
              <ListFilter size={16} className="text-[#d4a017]" />
              <h3 className="text-lg font-bold text-white">Filtrar por Nomenclatura</h3>
            </div>

            <div className="mb-5 max-h-64 space-y-2 overflow-y-auto pr-1">
              <button
                onClick={() => setFiltroNomeInicial("")}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all"
                style={filtroNomeInicial === "" ? goldButtonStyle : ghostButtonStyle}
              >
                Todos ({relatoriosFinalizados.length})
              </button>
              {nomesIniciais.map((nome) => (
                <button
                  key={nome}
                  onClick={() => setFiltroNomeInicial(nome)}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-all"
                  style={filtroNomeInicial === nome ? goldButtonStyle : ghostButtonStyle}
                >
                  {nome} ({grupos[nome].length})
                </button>
              ))}
            </div>

            <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="mb-4 flex items-center gap-2">
              <ReceiptText size={16} className="text-[#d4a017]" />
              <h3 className="text-lg font-bold text-white">Relatorios</h3>
            </div>

            {relatoriosFiltrados.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/45">
                Nenhum relatorio finalizado ainda
              </p>
            ) : (
              <div className="space-y-2">
                {relatoriosFiltrados.map((relatorio) => {
                  const isSelected = selectedRelatorioId === relatorio.id;
                  const relatorioTotal = getRelatorioTotal(relatorio);
                  return (
                    <button
                      key={relatorio.id}
                      onClick={() => {
                        setSelectedRelatorioId(relatorio.id);
                        setIsEditing(false);
                      }}
                      className="group w-full rounded-2xl border p-4 text-left text-sm transition-all hover:-translate-y-0.5"
                      style={
                        isSelected
                          ? {
                              background: "linear-gradient(135deg, rgba(212,160,23,0.16), rgba(212,160,23,0.07))",
                              borderColor: "rgba(212,160,23,0.42)",
                              boxShadow: "0 12px 30px rgba(212,160,23,0.1)",
                            }
                          : {
                              background: "rgba(255,255,255,0.035)",
                              borderColor: "rgba(255,255,255,0.09)",
                            }
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-black text-white/88">
                            {getCasaNome(relatorio.casaId).replace(/[\s-]+$/, "").trim()}
                            {relatorio.agente ? ` - ${relatorio.agente}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-white/38">
                            {relatorio.agente || "Sem agente"} - {new Date(relatorio.criadoEm).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 font-mono text-[11px] font-black text-emerald-300">
                          R$ {relatorioTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRelatorio ? (
            <div className="space-y-4">
              <div className={`${panelClass} p-6`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/30 to-transparent" />
                <div className="relative mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Relatorio selecionado</p>
                    <h3 className="mt-1 text-2xl font-black text-white">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData?.agente || ""}
                          onChange={(e) => handleFieldChange("agente", e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white outline-none focus:border-[#d4a017]/60"
                        />
                      ) : (
                        getCasaNome(selectedRelatorio.casaId).replace(/[\s-]+$/, "").trim()
                      )}
                    </h3>
                    <p className="mt-2 text-sm text-white/50">
                      Agente:{" "}
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData?.agente || ""}
                          onChange={(e) => handleFieldChange("agente", e.target.value)}
                          className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-white outline-none focus:border-[#d4a017]/60"
                        />
                      ) : (
                        selectedRelatorio.agente || "-"
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left sm:text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/35">Prazo</p>
                    <p className="mt-1 text-lg font-black text-white">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editingData?.prazo?.split("T")[0] || ""}
                          onChange={(e) => handleFieldChange("prazo", e.target.value)}
                          className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-white outline-none focus:border-[#d4a017]/60"
                        />
                      ) : (
                        new Date(selectedRelatorio.prazo).toLocaleDateString("pt-BR")
                      )}
                    </p>
                  </div>
                </div>

                <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-300/15 bg-blue-300/[0.055] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-200/45">Cooperacao</p>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingData?.cooperacao || 0}
                        onChange={(e) => handleFieldChange("cooperacao", e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white outline-none focus:border-[#d4a017]/60"
                      />
                    ) : (
                      <p className="mt-2 font-mono text-xl font-black text-blue-300">
                        R$ {(selectedRelatorio.cooperacao || 0).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.055] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-200/45">Resultado Total</p>
                    <p className="mt-2 font-mono text-xl font-black text-emerald-300">
                      R${" "}
                      {(
                        calculateTotalResultado(isEditing ? editingData?.rows || [] : selectedRelatorio.rows) +
                        (isEditing ? editingData?.cooperacao || 0 : selectedRelatorio.cooperacao || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${subtlePanelClass} overflow-x-auto p-6`}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                <h4 className="mb-4 font-bold text-white">Dados do Relatorio</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-2 py-3 text-left font-bold text-white/55">#</th>
                      <th className="px-2 py-3 text-left font-bold text-white/55">Deposito</th>
                      <th className="px-2 py-3 text-left font-bold text-white/55">Saque</th>
                      <th className="px-2 py-3 text-left font-bold text-white/55">Bau</th>
                      <th className="px-2 py-3 text-left font-bold text-white/55">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditing ? editingData?.rows || [] : selectedRelatorio.rows).map((row: any) => (
                      <tr key={row.numero} className="border-b border-white/8 transition-colors hover:bg-white/[0.035]">
                        <td className="px-2 py-3 text-white/70">{row.numero}</td>
                        {["deposito", "saque", "bau"].map((field) => (
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
                        toast.success("Relatorio excluido");
                      }}
                      className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-red-300 transition-colors hover:bg-red-400/18"
                    >
                      <Trash2 size={16} />
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
            <div className={`${subtlePanelClass} p-12 text-center`}>
              <FileText size={32} className="mx-auto mb-4 text-[#d4a017]/65" />
              <p className="text-sm text-white/35">Selecione um relatorio para visualizar os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
