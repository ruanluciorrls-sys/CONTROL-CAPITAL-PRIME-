import { useApp } from "@/contexts/AppContext";
import { Plus, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import RelatorioSpreadsheet from "@/components/RelatorioSpreadsheet";
import AbaProgresso from "@/components/AbaProgresso";

export default function Relatorios() {
  const { state, addRelatorio, updateRelatorio, deleteRelatorio, finalizarRelatorio, duplicarRelatorio, esvaziarLixeira } = useApp();
  const [selectedRelatorioId, setSelectedRelatorioId] = useState<string>("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"relatorio" | "progresso" | "lixeira">("relatorio");
  const [newRelatorioData, setNewRelatorioData] = useState({
    casaId: "",
    agente: "",
    prazo: "",
  });
  const [selectedLixeira, setSelectedLixeira] = useState<Set<string>>(new Set());

  const casasAtivas = state.casas.filter((c) => c.status === "ativa");
  const relatoriosAtivos = state.relatorios.filter((r) => r.status === "ativo");
  const relatoriosLixeira = state.relatorios.filter((r) => r.status === "lixeira");

  const handleCreateRelatorio = () => {
    if (newRelatorioData.casaId && newRelatorioData.agente) {
      addRelatorio({
        casaId: newRelatorioData.casaId,
        agente: newRelatorioData.agente,
        prazo: newRelatorioData.prazo,
        cooperacao: 0,
        rows: [],
        status: "ativo",
      });
      setNewRelatorioData({ casaId: "", agente: "", prazo: "" });
      setShowNewForm(false);
    }
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
    // Feedback visual
    const relatorio = relatoriosAtivos.find((r) => r.id === relatorioId);
    if (relatorio) {
      console.log(`Relatório "${getCasaNome(relatorio.casaId)}" movido para lixeira`);
    }
  };

  const handleRestoreRelatorio = (relatorioId: string) => {
    // Restaurar relatório da lixeira
    updateRelatorio(relatorioId, { status: "ativo" });
    const relatorio = relatoriosLixeira.find((r) => r.id === relatorioId);
    if (relatorio) {
      console.log(`Relatório "${getCasaNome(relatorio.casaId)}" restaurado da lixeira`);
    }
  };

  const handlePermanentlyDeleteRelatorio = (relatorioId: string) => {
    // Deletar permanentemente
    if (confirm("Tem certeza que deseja deletar permanentemente este relatório?")) {
      deleteRelatorio(relatorioId);
      console.log(`Relatório deletado permanentemente`);
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

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Abas de Navegação */}
      <div className="flex gap-2 md:gap-4 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("relatorio")}
          className={`px-4 md:px-6 py-3 font-semibold transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "relatorio" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Relatório
        </button>
        <button
          onClick={() => setActiveTab("progresso")}
          className={`px-4 md:px-6 py-3 font-semibold transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "progresso" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Progresso
        </button>
        <button
          onClick={() => setActiveTab("lixeira")}
          className={`px-4 md:px-6 py-3 font-semibold transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "lixeira" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          🗑️ Lixeira ({relatoriosLixeira.length})
        </button>
      </div>

      {activeTab === "relatorio" && (
        <>
          {/* Botão Criar Novo Relatório */}
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium min-h-[44px] w-full md:w-auto"
          >
            <Plus size={20} />
            Criar Novo Relatório
          </button>

          {/* Formulário de Novo Relatório */}
          {showNewForm && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border space-y-4">
              <h3 className="text-lg font-bold">Novo Relatório</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <select
                  value={newRelatorioData.casaId}
                  onChange={(e) => {
                    const casaSelecionada = casasAtivas.find((c) => c.id === e.target.value);
                    setNewRelatorioData({
                      ...newRelatorioData,
                      casaId: e.target.value,
                      prazo: casaSelecionada?.prazo || "",
                    });
                  }}
                  className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecionar Casa</option>
                  {casasAtivas.map((casa) => (
                    <option key={casa.id} value={casa.id}>
                      {casa.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Nome do Agente"
                  value={newRelatorioData.agente}
                  onChange={(e) =>
                    setNewRelatorioData({
                      ...newRelatorioData,
                      agente: e.target.value,
                    })
                  }
                  className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {/* Exibição do Prazo */}
              <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700">
                <p className="text-sm text-yellow-700 dark:text-yellow-200 font-semibold">PRAZO:</p>
                <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                  {newRelatorioData.prazo
                    ? new Date(newRelatorioData.prazo).toLocaleDateString('pt-BR')
                    : 'Selecione uma casa para ver o prazo'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateRelatorio}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Criar Relatório
                </button>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de Relatórios */}
          {relatoriosAtivos.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border">
              <h3 className="text-lg font-bold mb-6">Relatórios Criados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
                  const colors = [
                    "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700",
                    "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700",
                    "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700",
                    "bg-pink-100 dark:bg-pink-900 border-pink-300 dark:border-pink-700",
                    "bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700",
                    "bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700",
                    "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700",
                    "bg-cyan-100 dark:bg-cyan-900 border-cyan-300 dark:border-cyan-700",
                    "bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700",
                  ];
                  return relatoriosAtivos.map((rel, index) => {
                    const bgColor = colors[index % colors.length];
                    return (
                      <div
                        key={rel.id}
                        className={`p-4 ${bgColor} rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                          selectedRelatorioId === rel.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => setSelectedRelatorioId(rel.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-foreground text-lg truncate">
                              {getCasaNome(rel.casaId)}
                            </h4>
                            <p className="text-xs font-semibold text-foreground opacity-70 mt-1">
                              AGENTE: {rel.agente}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 mb-3 pb-3 border-b border-current border-opacity-20">
                          <p className="text-xs font-semibold text-foreground opacity-70">LINHAS</p>
                          <p className="font-bold text-foreground text-lg">{rel.rows.length}</p>
                        </div>
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-foreground opacity-70">PRAZO</p>
                          <p className="text-sm font-mono text-foreground">
                            {getCasaPrazo(rel.casaId) ? new Date(getCasaPrazo(rel.casaId)).toLocaleDateString('pt-BR') : 'Sem prazo'}
                          </p>
                        </div>
                        <div className="mb-4 pb-4 border-b border-current border-opacity-20">
                          <p className="text-xs font-semibold text-foreground opacity-70">LUCRO</p>
                          {(() => {
                            const lucroTotal = calculateTotalResultado(rel.rows, rel.cooperacao);
                            return (
                              <p className={`font-bold text-lg ${
                                lucroTotal >= 0
                                  ? 'text-green-700 dark:text-green-400'
                                  : 'text-red-700 dark:text-red-400'
                              }`}>
                                R$ {lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            );
                          })()}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicarRelatorio(rel.id);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                            title="Duplicar relatório"
                            aria-label="Duplicar relatório"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRelatorio(rel.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
                            title="Mover para lixeira"
                            aria-label="Mover relatório para lixeira"
                          >
                            <Trash2 size={18} />
                          </button>
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
                prazo={getCasaPrazo(currentRelatorio.casaId)}

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
                    alert("Relatório finalizado! Movido para Relatórios Finalizados.");
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
            <div className="bg-blue-50 rounded-lg p-8 border border-blue-200 text-center">
              <p className="text-blue-900">
                Nenhum relatório criado. Clique em "Criar Novo Relatório" para começar!
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === "progresso" && currentRelatorio && (
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

      {activeTab === "lixeira" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground dark:text-white">Lixeira</h2>
            {relatoriosLixeira.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Tem certeza que deseja esvaziar a lixeira completamente?")) {
                    esvaziarLixeira();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Esvaziar Lixeira
              </button>
            )}
          </div>
          
          {relatoriosLixeira.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-8 border border-border dark:border-slate-700 text-center">
              <p className="text-muted-foreground dark:text-slate-400">
                Nenhum relatorio na lixeira
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-border dark:border-slate-700 overflow-x-auto">
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
  );
}
