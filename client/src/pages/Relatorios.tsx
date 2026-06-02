import { useApp } from "@/contexts/AppContext";
import { Plus, Trash2, Copy, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import RelatorioSpreadsheet from "@/components/RelatorioSpreadsheet";
import AbaProgresso from "@/components/AbaProgresso";

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

      {activeTab === "relatorio" && (
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
            <div className="rounded-2xl p-5 border border-white/8 space-y-5"
              style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)" }}
            >
              <h3 className="text-base font-black text-foreground">Novo Relatório</h3>

              {/* Seletor de Plataforma do Calendário */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                  Plataforma do Calendário
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-44 overflow-y-auto pr-1">
                  {/* Opção manual */}
                  <button
                    type="button"
                    onClick={() => {
                      setNewRelatorioData({ casaId: "", agente: "", prazo: "" });
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold transition-all border text-center"
                    style={!newRelatorioData.casaId && !newRelatorioData.prazo ? {
                      background: "linear-gradient(135deg, #d4a017, #f59e0b)",
                      color: "#050b18", border: "none",
                    } : {
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.5)",
                      borderColor: "rgba(255,255,255,0.08)",
                    }}
                  >
                    Manual
                  </button>
                  {PLATAFORMAS_CALENDARIO.map((plat) => {
                    const casaMatch = casasAtivas.find((c) =>
                      c.nome.toUpperCase().startsWith(plat.nome.toUpperCase())
                    );
                    const prazoCalc = calcularPrazo(plat.dia, plat.diasPrazo);
                    const isSelected = newRelatorioData.casaId === (casaMatch?.id || plat.id) &&
                      newRelatorioData.prazo === prazoCalc;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => {
                          setNewRelatorioData({
                            casaId: casaMatch?.id || "",
                            agente: "",
                            prazo: prazoCalc,
                          });
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-bold transition-all border text-center"
                        style={isSelected ? {
                          background: "linear-gradient(135deg, #d4a017, #f59e0b)",
                          color: "#050b18", border: "none",
                          boxShadow: "0 4px 12px rgba(212,160,23,0.3)",
                        } : {
                          background: "rgba(255,255,255,0.04)",
                          color: casaMatch ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                          borderColor: casaMatch ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                        }}
                        title={`${plat.dia} — prazo: ${plat.diasPrazo}d${casaMatch ? " ✓ Casa vinculada" : " (sem casa ativa)"}`}
                      >
                        {plat.nome}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-white/25 mt-1.5">
                  Botões em destaque = casa ativa vinculada encontrada. Plataformas pálidas = sem casa ativa correspondente.
                </p>
              </div>

              {/* Casa + Sufixo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                    Casa Ativa (ou selecione acima)
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
                    <option value="">Selecionar Casa</option>
                    {casasAtivas.map((casa) => (
                      <option key={casa.id} value={casa.id}>{casa.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                    Sufixo após o nome (ex: VOY-<span className="text-[#d4a017]">Ruan</span>)
                  </label>
                  <input
                    type="text"
                    placeholder="Identificador, agente..."
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
              </div>

              {/* Prazo + Countdown */}
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
                <div className="rounded-xl p-4 border border-white/8 text-center text-xs text-white/25">
                  Selecione uma plataforma do calendário para ver o prazo automaticamente
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
            <div className="bg-card backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg">
              <h3 className="text-lg font-bold mb-6">Relatórios Criados</h3>
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
                              {getCasaNome(rel.casaId)}{rel.agente ? `-${rel.agente}` : ""}
                            </h4>
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
            <div className="bg-card backdrop-blur-sm border border-border/50 shadow-lg rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-lg">
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
  );
}
