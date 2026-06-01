import { useApp } from "@/contexts/AppContext";
import { Copy, Trash2, Edit2, X, Check } from "lucide-react";
import { useState } from "react";

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
    alert("Relatório reutilizado! Verifique em Relatórios Ativos.");
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
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-90 uppercase tracking-wide">
              Relatórios Finalizados
            </p>
            <p className="text-5xl font-bold mt-3 font-mono">
              {relatoriosFinalizados.length}
            </p>
            <p className="text-sm mt-2 opacity-75">
              Total de relatórios finalizados
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Relatórios */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border">
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
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedRelatorioId === rel.id
                        ? "bg-primary text-white border-primary dark:bg-primary dark:border-primary"
                        : "bg-secondary dark:bg-slate-700 border-border dark:border-slate-600 hover:bg-secondary/80 dark:hover:bg-slate-600"
                    }`}
                  >
                    <p className="font-semibold dark:text-white">{getCasaNome(rel.casaId)}</p>
                    <p className="text-xs opacity-75 dark:text-slate-400">
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
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border dark:border-slate-700">
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
                  <div className="bg-blue-50 dark:bg-slate-700 p-3 rounded-lg">
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
                  <div className="bg-green-50 dark:bg-slate-700 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground dark:text-slate-400">Resultado Total</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      R$ {(calculateTotalResultado(isEditing ? editingData?.rows || [] : selectedRelatorio.rows) + (isEditing ? editingData?.cooperacao || 0 : selectedRelatorio.cooperacao || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela de Dados */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border dark:border-slate-700 overflow-x-auto">
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
              <div className="flex gap-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handleEditClick}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                    >
                      <Edit2 size={20} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleReutilizar(selectedRelatorio.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Copy size={20} />
                      Reutilizar
                    </button>
                    <button
                      onClick={() => {
                        deleteRelatorio(selectedRelatorio.id);
                        setSelectedRelatorioId(null);
                      }}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <Check size={20} />
                      Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      <X size={20} />
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-slate-700 rounded-lg p-8 border border-blue-200 dark:border-slate-600 text-center">
              <p className="text-blue-900 dark:text-slate-200">
                Selecione um relatório para visualizar os detalhes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
