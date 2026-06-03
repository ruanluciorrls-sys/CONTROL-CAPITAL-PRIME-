import { useApp } from "@/contexts/AppContext";
import { Copy, Trash2, Edit2, X, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function RelatoriosFinalizados() {
  const { state, deleteRelatorio, reutilizarRelatorio, updateRelatorio } = useApp();
  const [selectedRelatorioId, setSelectedRelatorioId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const relatoriosFinalizados = state.relatorios.filter((r) => r.status === "finalizado");
  const [filtroNomeInicial, setFiltroNomeInicial] = useState("");

  const getCasaNome = (casaId: string) => {
    return state.casas.find((c) => c.id === casaId)?.nome || "Casa não encontrada";
  };

  const getNomeInicial = (nome: string) => {
    const palavras = nome.trim().split(/\s+/);
    return palavras[0].toUpperCase();
  };

  const relatoriosAgrupados = () => {
    const grupos: { [key: string]: any[] } = {};
    relatoriosFinalizados.forEach((rel) => {
      const casaNome = getCasaNome(rel.casaId);
      const nomeInicial = getNomeInicial(casaNome);
      if (!grupos[nomeInicial]) {
        grupos[nomeInicial] = [];
      }
      grupos[nomeInicial].push(rel);
    });
    Object.keys(grupos).forEach((key) => {
      grupos[key].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    });
    return grupos;
  };

  const grupos = relatoriosAgrupados();
  const nomesIniciais = Object.keys(grupos).sort();
  const relatoriosFiltrados = filtroNomeInicial === ""
    ? relatoriosFinalizados.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    : (grupos[filtroNomeInicial] || []);

  const selectedRelatorio = selectedRelatorioId
    ? relatoriosFiltrados.find((r) => r.id === selectedRelatorioId)
    : null;

  const calculateTotalResultado = (rows: any[]) => {
    return rows.reduce((sum, r) => sum + r.resultado, 0);
  };

  const handleReutilizar = (relatorioId: string) => {
    reutilizarRelatorio(relatorioId);
    toast.success("Relatório reutilizado! Verifique em Operação CPA.");
  };

  const handleEditClick = () => {
    if (selectedRelatorio) {
      setEditingData(JSON.parse(JSON.stringify(selectedRelatorio)));
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editingData && selectedRelatorio) {
      updateRelatorio(selectedRelatorio.id, editingData);
      setIsEditing(false);
      setEditingData(null);
      toast.success("Relatório atualizado com sucesso!");
    }
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
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-6 border border-white/8"
        style={{ background: "linear-gradient(145deg, #070e20, #0f1e45)" }}
      >
        <div className="absolute top-0 left-0 w-full h-[1px]"
          style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5), transparent)" }}
        />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">
            Relatórios Finalizados
          </p>
          <p className="text-5xl font-black tracking-tighter font-mono"
            style={{ color: "#d4a017" }}
          >
            {relatoriosFinalizados.length}
          </p>
          <p className="text-white/30 text-xs mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4a017] animate-pulse"></span>
            Total de relatórios finalizados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Relatórios */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl p-5 border border-white/8" style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}>
            <h3 className="text-lg font-bold text-foreground dark:text-white mb-4">
              Filtrar por Nomenclatura
            </h3>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              <button
                onClick={() => setFiltroNomeInicial("")}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-colors text-sm ${filtroNomeInicial === "" ? "bg-primary text-white border-primary" : "bg-secondary dark:bg-slate-700 border-border"}`}
              >
                Todos ({relatoriosFinalizados.length})
              </button>
              {nomesIniciais.map((nome) => (
                <button
                  key={nome}
                  onClick={() => setFiltroNomeInicial(nome)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors text-sm ${filtroNomeInicial === nome ? "bg-primary text-white border-primary" : "bg-secondary dark:bg-slate-700 border-border"}`}
                >
                  {nome} ({grupos[nome].length})
                </button>
              ))}
            </div>
            <hr className="my-4" />
            <h3 className="text-lg font-bold text-foreground dark:text-white mb-4">
              Relatórios
            </h3>
            {relatoriosFiltrados.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum relatório finalizado ainda
              </p>
            ) : (
              <div className="space-y-2">
                {relatoriosFiltrados.map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => {
                      setSelectedRelatorioId(rel.id);
                      setIsEditing(false);
                    }}
                    className="w-full text-left p-3 rounded-xl border transition-all text-sm"
                  style={selectedRelatorioId === rel.id ? {
                    background: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.08))",
                    borderColor: "rgba(212,160,23,0.35)",
                  } : {
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                  >
                    <p className="font-bold text-white/80 text-sm">{getCasaNome(rel.casaId)}{rel.agente ? `-${rel.agente}` : ""}</p>
                    <p className="text-xs opacity-60 text-white/40">
                      {rel.agente} • {new Date(rel.criadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalhes do Relatório */}
        <div className="lg:col-span-2">
          {selectedRelatorio ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground dark:text-white">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingData?.agente || ""}
                          onChange={(e) => handleFieldChange("agente", e.target.value)}
                          className="w-full px-2 py-1 border border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-white"
                        />
                      ) : (
                        getCasaNome(selectedRelatorio.casaId)
                      )}
                    </h3>
                    <p className="text-muted-foreground dark:text-slate-400 mt-1">
                      Agente: {isEditing ? (
                        <input
                          type="text"
                          value={editingData?.agente || ""}
                          onChange={(e) => handleFieldChange("agente", e.target.value)}
                          className="px-2 py-1 border border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-white"
                        />
                      ) : (
                        selectedRelatorio.agente
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">Prazo</p>
                    <p className="text-lg font-semibold dark:text-white">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editingData?.prazo?.split("T")[0] || ""}
                          onChange={(e) => handleFieldChange("prazo", e.target.value)}
                          className="px-2 py-1 border border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-white"
                        />
                      ) : (
                        new Date(selectedRelatorio.prazo).toLocaleDateString("pt-BR")
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="rounded-xl p-3 border border-blue-500/15" style={{ background: "rgba(96,165,250,0.05)" }}>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">Cooperação</p>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingData?.cooperacao || 0}
                        onChange={(e) => handleFieldChange("cooperacao", e.target.value)}
                        className="w-full px-2 py-1 border border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-white"
                      />
                    ) : (
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        R$ {(selectedRelatorio.cooperacao || 0).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl p-3 border border-emerald-500/15" style={{ background: "rgba(74,222,128,0.05)" }}>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">Resultado Total</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      R$ {(calculateTotalResultado(isEditing ? editingData?.rows || [] : selectedRelatorio.rows) + (isEditing ? editingData?.cooperacao || 0 : selectedRelatorio.cooperacao || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela de Dados */}
              <div className="bg-card backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg overflow-x-auto">
                <h4 className="font-semibold text-foreground dark:text-white mb-4">Dados do Relatório</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border dark:border-slate-700">
                      <th className="text-left py-2 px-2 dark:text-slate-300">#</th>
                      <th className="text-left py-2 px-2 dark:text-slate-300">Depósito</th>
                      <th className="text-left py-2 px-2 dark:text-slate-300">Saque</th>
                      <th className="text-left py-2 px-2 dark:text-slate-300">Baú</th>
                      <th className="text-left py-2 px-2 dark:text-slate-300">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isEditing ? editingData?.rows || [] : selectedRelatorio.rows).map((row: any) => (
                      <tr key={row.numero} className="border-b border-border dark:border-slate-700 hover:bg-secondary dark:hover:bg-slate-700">
                        <td className="py-2 px-2 dark:text-slate-300">{row.numero}</td>
                        <td className="py-2 px-2 dark:text-slate-300">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={row.deposito}
                              onChange={(e) => handleRowChange(row.numero, "deposito", e.target.value)}
                              className="w-20 px-2 py-1 border border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-white"
                            />
                          ) : (
                            `R$ ${(row.deposito || 0).toFixed(2)}`
                          )}
                        </td>
                        <td className="py-2 px-2 dark:text-slate-300">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={row.saque}
                              onChange={(e) => handleRowChange(row.numero, "saque", e.target.value)}
                              className="w-20 px-2 py-1 border border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-white"
                            />
                          ) : (
                            `R$ ${(row.saque || 0).toFixed(2)}`
                          )}
                        </td>
                        <td className="py-2 px-2 dark:text-slate-300">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={row.bau}
                              onChange={(e) => handleRowChange(row.numero, "bau", e.target.value)}
                              className="w-20 px-2 py-1 border border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-white"
                            />
                          ) : (
                            `R$ ${(row.bau || 0).toFixed(2)}`
                          )}
                        </td>
                        <td className={`py-2 px-2 font-semibold ${row.resultado >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={row.resultado}
                              onChange={(e) => handleRowChange(row.numero, "resultado", e.target.value)}
                              className="w-20 px-2 py-1 border border-border rounded-lg bg-white dark:bg-slate-700 text-foreground dark:text-white"
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

              {/* Ações */}
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <button onClick={handleEditClick}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.01]"
                      style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    <button onClick={() => handleReutilizar(selectedRelatorio.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white/60 border border-white/12 hover:bg-white/5 transition-colors"
                    >
                      <Copy size={16} /> Reutilizar
                    </button>
                    <button onClick={() => { deleteRelatorio(selectedRelatorio.id); setSelectedRelatorioId(null); toast.success("Relatório excluído"); }}
                      className="px-4 py-2.5 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                      style={{ background: "rgba(239,68,68,0.05)" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.01]"
                      style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                    >
                      <Check size={16} /> Salvar
                    </button>
                    <button onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white/50 border border-white/12 hover:bg-white/5 transition-colors"
                    >
                      <X size={16} /> Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-12 text-center border border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-white/25 text-sm">Selecione um relatório para visualizar os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
