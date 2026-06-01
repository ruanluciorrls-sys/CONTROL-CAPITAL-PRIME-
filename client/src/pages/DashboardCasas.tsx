import { useApp } from "@/contexts/AppContext";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";

export default function DashboardCasas() {
  const { state, updateCasa } = useApp();
  const [filtroLucro, setFiltroLucro] = useState<"todos" | "lucro" | "prejuizo">("todos");
  const [filtroData, setFiltroData] = useState("");
  const [filtroAgente, setFiltroAgente] = useState("");
  const [selectedCasas, setSelectedCasas] = useState<Set<string>>(new Set());

  const casasFinalizadas = state.casas.filter((c) => c.status === "finalizada");

  const calculateCasaLucros = (casaId: string) => {
    const relatoriosCasa = state.relatorios.filter((r) => r.casaId === casaId && r.status === "finalizado");
    const totalResultado = relatoriosCasa.reduce((total, r) => total + r.rows.reduce((sum, row) => sum + row.resultado, 0), 0);
    const totalCooperacao = relatoriosCasa.reduce((total, r) => total + r.cooperacao, 0);
    return totalResultado + totalCooperacao;
  };

  const casasComLucro = casasFinalizadas.map((casa) => ({
    ...casa,
    lucro: calculateCasaLucros(casa.id),
  }));

  const casasFiltradas = useMemo(() => {
    return casasComLucro.filter((casa) => {
      const lucroOk =
        filtroLucro === "todos" ||
        (filtroLucro === "lucro" && casa.lucro > 0) ||
        (filtroLucro === "prejuizo" && casa.lucro < 0);

      const dataOk = !filtroData || (casa.dataFim && new Date(casa.dataFim).toLocaleDateString("pt-BR").includes(filtroData));

      return lucroOk && dataOk;
    });
  }, [casasComLucro, filtroLucro, filtroData]);

  const totalLucro = casasFiltradas.reduce((sum, casa) => sum + casa.lucro, 0);
  const mediaLucro = casasFiltradas.length > 0 ? totalLucro / casasFiltradas.length : 0;
  const melhorCasa = casasFiltradas.length > 0 ? casasFiltradas.reduce((max, casa) => (casa.lucro > max.lucro ? casa : max)) : null;
  const piorCasa = casasFiltradas.length > 0 ? casasFiltradas.reduce((min, casa) => (casa.lucro < min.lucro ? casa : min)) : null;

  const agentes: string[] = [];

  const toggleSelectCasa = (id: string) => {
    const newSelected = new Set(selectedCasas);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCasas(newSelected);
  };

  const handleReativarMultiplos = () => {
    if (selectedCasas.size === 0) return;
    if (confirm(`Reativar ${selectedCasas.size} casa(s)?`)) {
      selectedCasas.forEach((id) => {
        updateCasa(id, { status: "ativa" });
      });
      setSelectedCasas(new Set());
    }
  };

  const handleDuplicarMultiplos = () => {
    if (selectedCasas.size === 0) return;
    if (confirm(`Duplicar ${selectedCasas.size} casa(s)? Serão criadas cópias com status 'ativa'.`)) {
      selectedCasas.forEach((id) => {
        const casaOriginal = casasComLucro.find((c) => c.id === id);
        if (casaOriginal) {
          const novaCasa = {
            ...casaOriginal,
            id: `${casaOriginal.id}-copia-${Date.now()}`,
            status: "ativa" as any,
          };
          updateCasa(novaCasa.id, novaCasa);
        }
      });
      setSelectedCasas(new Set());
    }
  };

  return (
    <div className="space-y-8">
      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total de Casas</p>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{casasFiltradas.length}</p>
        </div>

        <div className={`rounded-lg p-6 border ${totalLucro > 0 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"}`}>
          <p className={`text-sm font-medium ${totalLucro > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            Lucro Total
          </p>
          <p className={`text-3xl font-bold mt-2 ${totalLucro > 0 ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"}`}>
            R$ {totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Média de Lucro</p>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
            R$ {mediaLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-700">
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Casas Selecionadas</p>
          <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">{selectedCasas.size}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border space-y-4">
        <h3 className="text-lg font-bold text-foreground">Filtros Inteligentes</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro de Lucro */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Por Resultado</label>
            <select
              value={filtroLucro}
              onChange={(e) => setFiltroLucro(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
            >
              <option value="todos">Todas as casas</option>
              <option value="lucro">Apenas com lucro</option>
              <option value="prejuizo">Apenas com prejuízo</option>
            </select>
          </div>



          {/* Limpar Filtros */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFiltroLucro("todos");
                setFiltroData("");
              }}
              className="w-full px-4 py-2 bg-gray-300 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Melhores e Piores Casas */}
      {melhorCasa && piorCasa && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              <h4 className="text-lg font-bold text-green-900 dark:text-green-100">Melhor Casa</h4>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{melhorCasa.nome}</p>
            <p className="text-lg font-mono text-green-700 dark:text-green-300 mt-2">
              R$ {melhorCasa.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="text-red-600 dark:text-red-400" size={24} />
              <h4 className="text-lg font-bold text-red-900 dark:text-red-100">Pior Casa</h4>
            </div>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{piorCasa.nome}</p>
            <p className="text-lg font-mono text-red-700 dark:text-red-300 mt-2">
              R$ {piorCasa.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Ações em Lote */}
      {selectedCasas.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
            {selectedCasas.size} casa(s) selecionada(s)
          </h4>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleReativarMultiplos}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Reativar {selectedCasas.size}
            </button>
            <button
              onClick={handleDuplicarMultiplos}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Duplicar {selectedCasas.size}
            </button>
            <button
              onClick={() => setSelectedCasas(new Set())}
              className="px-6 py-2 bg-gray-300 dark:bg-slate-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              Cancelar Seleção
            </button>
          </div>
        </div>
      )}

      {/* Lista de Casas */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
              <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white w-8">
                <input
                  type="checkbox"
                  checked={selectedCasas.size === casasFiltradas.length && casasFiltradas.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCasas(new Set(casasFiltradas.map((c) => c.id)));
                    } else {
                      setSelectedCasas(new Set());
                    }
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Casa</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground dark:text-white">Agente</th>
              <th className="text-right py-3 px-4 font-semibold text-foreground dark:text-white">Lucro</th>
              <th className="text-center py-3 px-4 font-semibold text-foreground dark:text-white">Status</th>
            </tr>
          </thead>
          <tbody>
            {casasFiltradas.map((casa) => (
              <tr key={casa.id} className="border-b border-border dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedCasas.has(casa.id)}
                    onChange={() => toggleSelectCasa(casa.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="py-3 px-4 font-semibold text-foreground dark:text-white">{casa.nome}</td>
                <td className="py-3 px-4 text-foreground dark:text-white">-</td>
                <td className={`py-3 px-4 text-right font-mono font-bold ${casa.lucro > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  R$ {casa.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    casa.lucro > 0
                      ? "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100"
                      : "bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100"
                  }`}>
                    {casa.lucro > 0 ? "✓ Lucro" : "✗ Prejuízo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {casasFiltradas.length === 0 && (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-8 border border-border text-center">
          <BarChart3 size={48} className="mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground dark:text-slate-400">
            Nenhuma casa encontrada com os filtros selecionados
          </p>
        </div>
      )}
    </div>
  );
}
