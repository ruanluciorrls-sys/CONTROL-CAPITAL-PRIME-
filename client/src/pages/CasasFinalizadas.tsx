import { useApp } from "@/contexts/AppContext";
import { Trash2, Edit2, RotateCcw, Eye, EyeOff, CheckSquare2, Square } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function CasasFinalizadas() {
  const { state, deleteCasa, updateCasa, deletePermanentementeCasa, esvaziarLixeiraCasas } = useApp();
  const { data: totalGastosProxy = 0 } = trpc.gastosProxy.total.useQuery();
  const [editingCasa, setEditingCasa] = useState<any>(null);
  const [editData, setEditData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"finalizadas" | "lixeira">("finalizadas");
  const [filtroNomeInicial, setFiltroNomeInicial] = useState("");
  const [filtroMes, setFiltroMes] = useState<string | null>(null);
  const [selectedLixeira, setSelectedLixeira] = useState<Set<string>>(new Set());

  // Extrair nome inicial (primeira palavra) de cada casa
  const getNomeInicial = (nome: string) => {
    const palavras = nome.trim().split(/\s+/);
    return palavras[0].toUpperCase();
  };

  const casasFinalizadas = state.casas.filter((c) => c.status === "finalizada");
  const casasLixeira = state.casas.filter((c) => c.status === "lixeira");

  const getMesesDisponiveis = () => {
    const meses: string[] = [];
    const hoje = new Date();
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      meses.push(mesKey);
    }
    return meses;
  };

  const mesesDisponiveis = getMesesDisponiveis();

  const getCasasMes = (mesKey: string) => {
    return casasFinalizadas.filter((casa) => {
      if (!casa.dataFim) return false;
      const dataCasa = new Date(casa.dataFim);
      const casaMesKey = `${dataCasa.getFullYear()}-${String(dataCasa.getMonth() + 1).padStart(2, '0')}`;
      return casaMesKey === mesKey;
    });
  };

  const casasFiltradas = filtroMes === null || filtroMes === "todas"
    ? casasFinalizadas
    : getCasasMes(filtroMes);

  const casasFiltroNome = filtroNomeInicial === ""
    ? casasFiltradas
    : casasFiltradas.filter((casa) => getNomeInicial(casa.nome) === filtroNomeInicial);

  const calculateCasaLucros = (casaId: string) => {
    const relatoriosCasa = state.relatorios.filter((r) => r.casaId === casaId && r.status === "finalizado");
    const totalResultado = relatoriosCasa.reduce((total, r) => total + r.rows.reduce((sum, row) => sum + row.resultado, 0), 0);
    const totalCooperacao = relatoriosCasa.reduce((total, r) => total + r.cooperacao, 0);
    return totalResultado + totalCooperacao;
  };

  const totalLucrosFinalizados = casasFiltroNome.reduce((total, casa) => {
    return total + calculateCasaLucros(casa.id);
  }, 0);

  const totalLucrosTodosFiltrados = casasFiltroNome.reduce((total, casa) => {
    return total + calculateCasaLucros(casa.id);
  }, 0);

  const handleEditClick = (casa: any) => {
    setEditingCasa(casa);
    setEditData({ ...casa });
  };

  const handleSaveEdit = () => {
    if (editData) {
      updateCasa(editData.id, editData);
      setEditingCasa(null);
      setEditData(null);
    }
  };

  const handleReactivate = (casaId: string) => {
    updateCasa(casaId, { status: "ativa" });
  };

  const toggleSelectAll = () => {
    if (selectedLixeira.size === casasLixeira.length) {
      setSelectedLixeira(new Set());
    } else {
      setSelectedLixeira(new Set(casasLixeira.map((c) => c.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedLixeira);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLixeira(newSelected);
  };

  const handleDeleteMultiple = () => {
    if (confirm(`Deletar permanentemente ${selectedLixeira.size} casa(s)?`)) {
      selectedLixeira.forEach((id) => deletePermanentementeCasa(id));
      setSelectedLixeira(new Set());
    }
  };

  const handleEsvaziarLixeira = () => {
    if (confirm(`Esvaziar lixeira? ${casasLixeira.length} casa(s) serão deletada(s) permanentemente.`)) {
      esvaziarLixeiraCasas();
    }
  };

  const handleRecoverMultiple = () => {
    if (selectedLixeira.size === 0) return;
    if (confirm(`Recuperar ${selectedLixeira.size} casa(s)? Serão movidas para 'Casas Ativas'.`)) {
      selectedLixeira.forEach((id) => {
        updateCasa(id, { status: "ativa" });
      });
      setSelectedLixeira(new Set());
    }
  };

  // Agrupar casas por nome inicial
  const casasAgrupadasPorNomeInicial = Array.from(
    new Set(casasFinalizadas.map((c) => getNomeInicial(c.nome)))
  )
    .sort()
    .map((nomeInicial) => ({
      nomeInicial,
      casas: casasFinalizadas.filter((c) => getNomeInicial(c.nome) === nomeInicial),
    }));

  // Nomes iniciais únicos para filtro
  const nomesIniciais = casasAgrupadasPorNomeInicial.map((g) => g.nomeInicial);

  const handleExportarCasas = () => {
    const casasParaExportar = activeTab === "finalizadas" ? casasFiltradas : Array.from(selectedLixeira).map((id) => casasLixeira.find((c) => c.id === id)).filter(Boolean);
    if (casasParaExportar.length === 0) {
      alert("Nenhuma casa para exportar!");
      return;
    }
    const csv = [
      ["Nome", "Login", "Senha", "Status", "Lucro", "Criada em"],
      ...casasParaExportar.map((casa: any) => [
        casa.nome,
        casa.login || "-",
        casa.senha || "-",
        casa.status,
        calculateCasaLucros(casa.id).toFixed(2),
        casa.criadoEm ? new Date(casa.criadoEm).toLocaleDateString("pt-BR") : "-",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `casas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Abas */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("finalizadas")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "finalizadas"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Casas Finalizadas ({casasFinalizadas.length})
        </button>
        <button
          onClick={() => setActiveTab("lixeira")}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === "lixeira"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🗑️ Lixeira ({casasLixeira.length})
        </button>
      </div>

      {activeTab === "finalizadas" && (
        <>
          {/* Total de Casas Finalizadas */}
          <div className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-8 shadow-2xl group transition-all duration-500 hover:border-emerald-500/30 hover:shadow-emerald-900/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-900/20 opacity-60"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-xs md:text-sm tracking-[0.2em] font-semibold mb-3 uppercase">
                  Lucro Total - Casas Finalizadas
                </p>
                <p className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 to-teal-200 drop-shadow-sm mt-3 font-mono">
                  R$ {(totalLucrosTodosFiltrados || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-muted-foreground/70 text-xs mt-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {casasFiltradas.length} casas {filtroNomeInicial ? "filtradas" : "finalizadas"}
                </p>
              </div>
            </div>
          </div>

          {/* Lucro com Desconto de Proxy */}
          {totalGastosProxy > 0 && (
            <div className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-8 shadow-2xl group transition-all duration-500 hover:border-orange-500/30 hover:shadow-orange-900/20 mt-6">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-900/20 opacity-60"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs md:text-sm tracking-[0.2em] font-semibold mb-3 uppercase">
                    Lucro (Com Desconto de Proxy)
                  </p>
                  <p className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-orange-400 to-red-200 drop-shadow-sm mt-3 font-mono">
                    R$ {((totalLucrosTodosFiltrados || 0) - totalGastosProxy).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-muted-foreground/70 text-xs mt-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    Desconto de Proxy: R$ {totalGastosProxy.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botão de Exportação */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleExportarCasas}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              📥 Exportar CSV
            </button>
          </div>

          {/* Filtro por Mês — elegante */}
          <div className="rounded-2xl p-4 border border-white/8"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Filtrar por Mês</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroMes("todas")}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={filtroMes === "todas" || filtroMes === null ? {
                  background: "linear-gradient(135deg, #d4a017, #f59e0b)",
                  color: "#050b18",
                  boxShadow: "0 4px 12px rgba(212,160,23,0.3)",
                } : {
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Todas ({casasFinalizadas.length})
              </button>
              {mesesDisponiveis.filter(m => getCasasMes(m).length > 0).map((mesKey) => {
                const [ano, mes] = mesKey.split('-');
                const data = new Date(parseInt(ano), parseInt(mes) - 1);
                const mesLabel = data.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
                const casasMes = getCasasMes(mesKey);
                const isActive = filtroMes === mesKey;
                return (
                  <button
                    key={mesKey}
                    onClick={() => setFiltroMes(mesKey)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize"
                    style={isActive ? {
                      background: "linear-gradient(135deg, #d4a017, #f59e0b)",
                      color: "#050b18",
                      boxShadow: "0 4px 12px rgba(212,160,23,0.3)",
                    } : {
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {mesLabel} <span className="opacity-60">({casasMes.length})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por Nome */}
          <div className="bg-card backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg">
            <label className="block text-sm font-medium text-foreground mb-3">
              Filtrar por Nome da Casa
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroNomeInicial("")}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                  filtroNomeInicial === ""
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-foreground hover:bg-gray-200 dark:hover:bg-slate-600"
                }`}
              >
                Todas
              </button>
              {nomesIniciais.map((nomeInicial: string) => {
                const casasDoGrupo = casasFinalizadas.filter((c) => getNomeInicial(c.nome) === nomeInicial);
                return (
                  <button
                    key={nomeInicial}
                    onClick={() => setFiltroNomeInicial(nomeInicial)}
                    className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                      filtroNomeInicial === nomeInicial
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-slate-700 text-foreground hover:bg-gray-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {nomeInicial} ({casasDoGrupo.length})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de Casas Finalizadas */}
          <div className="bg-card backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Histórico de Casas
            </h3>
            {casasFiltroNome.length === 0 ? (
              <p className="text-muted-foreground">
                {filtroNomeInicial ? "Nenhuma casa encontrada com esse nome inicial" : "Nenhuma casa finalizada ainda"}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const colors = [
                    "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/50",
                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/50",
                    "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:border-purple-500/50",
                    "bg-pink-500/10 border-pink-500/20 text-pink-400 hover:border-pink-500/50",
                    "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:border-amber-500/50",
                    "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/50",
                    "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:border-rose-500/50",
                    "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/50",
                    "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:border-orange-500/50",
                  ];
                  return casasFiltroNome.map((casa, index) => {
                    const lucrosCasa = calculateCasaLucros(casa.id);
                    const isLucro = lucrosCasa > 0;
                    const bgColor = colors[index % colors.length];

                    return (
                      <div
                        key={casa.id}
                        className={`p-4 ${bgColor} rounded-lg border-2 transition-all hover:shadow-lg`}
                      >
                        <h4 className="font-bold text-foreground text-lg truncate mb-2">
                          {casa.nome}
                        </h4>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded inline-block mb-3 ${
                            isLucro
                              ? "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100"
                              : "bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100"
                          }`}
                        >
                          {isLucro ? "✓ Lucro" : "✗ Prejuízo"}
                        </span>
                        <div className="mb-3 pb-3 border-b border-current border-opacity-20">
                          <p className="text-xs font-semibold text-foreground opacity-70">LUCRO</p>
                          <p className={`font-bold text-lg ${
                            isLucro
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}>
                            R$ {(lucrosCasa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-foreground opacity-70">FINALIZADA EM</p>
                          <p className="text-sm font-mono text-foreground">
                            {casa.dataFim
                              ? new Date(casa.dataFim).toLocaleDateString("pt-BR")
                              : "N/A"}
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditClick(casa)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                            title="Editar casa"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleReactivate(casa.id)}
                            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors"
                            title="Reativar casa"
                          >
                            <RotateCcw size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Tem certeza que deseja mover esta casa para a lixeira?")) {
                                updateCasa(casa.id, { status: "lixeira" });
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
                            title="Mover para lixeira"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "lixeira" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-2xl font-bold text-foreground dark:text-white">Lixeira de Casas</h2>
            {casasLixeira.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedLixeira.size > 0 && (
                  <>
                    <button
                      onClick={handleRecoverMultiple}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Recuperar {selectedLixeira.size}
                    </button>
                    <button
                      onClick={handleDeleteMultiple}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      Deletar {selectedLixeira.size}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {casasLixeira.length === 0 ? (
            <div className="bg-card backdrop-blur-sm border border-border/50 shadow-lg rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-lg">
                Nenhuma casa na lixeira
              </p>
            </div>
          ) : (
            <div className="bg-card backdrop-blur-sm rounded-xl border border-border/50 shadow-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
                    <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white w-12">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                      >
                        {selectedLixeira.size === casasLixeira.length && casasLixeira.length > 0 ? (
                          <CheckSquare2 size={18} className="text-primary" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Agente</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground dark:text-white">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {casasLixeira.map((casa) => (
                    <tr key={casa.id} className="border-b border-border dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="py-3 px-4 text-foreground dark:text-white w-12">
                        <button
                          onClick={() => toggleSelectItem(casa.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                        >
                          {selectedLixeira.has(casa.id) ? (
                            <CheckSquare2 size={18} className="text-primary" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-foreground dark:text-white">
                        {casa.nome}
                      </td>
                      <td className="py-3 px-4 text-foreground dark:text-white">
                        -
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditClick(casa)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Editar casa"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              updateCasa(casa.id, { status: "ativa" });
                            }}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Recuperar casa"
                          >
                            <RotateCcw size={18} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Tem certeza que deseja deletar permanentemente esta casa?")) {
                                deletePermanentementeCasa(casa.id);
                              }
                            }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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

      {/* Modal de Edição */}
      {editingCasa && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card backdrop-blur-sm rounded-xl p-6 max-w-md w-full space-y-4 border border-border/50 shadow-2xl">
            <h3 className="text-xl font-bold text-foreground">Editar Casa</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nome da Casa
                </label>
                <input
                  type="text"
                  value={editData.nome || ""}
                  onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Login
                </label>
                <input
                  type="text"
                  value={editData.login || ""}
                  onChange={(e) => setEditData({ ...editData, login: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={editData.senha || ""}
                    onChange={(e) => setEditData({ ...editData, senha: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Agente
                </label>
                <input
                  type="text"
                  value={editData.agente || ""}
                  onChange={(e) => setEditData({ ...editData, agente: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Meta
                </label>
                <input
                  type="number"
                  value={editData.meta || 0}
                  onChange={(e) => setEditData({ ...editData, meta: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditingCasa(null);
                  setEditData(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-slate-600 transition-colors font-medium"
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
