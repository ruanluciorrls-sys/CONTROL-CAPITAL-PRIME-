import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Play,
  Filter,
  Calendar as CalendarIcon,
  Activity,
  TrendingDown,
  TrendingUp,
  Target,
  Edit3,
  X,
  BarChart3,
  Crown,
  DollarSign,
  Zap,
  ChevronDown,
  Clock,
  Award,
  Percent,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const HISTORICO_KEY = "faturamento-historico-v1";
const META_KEY = "faturamento-meta-v1";

interface HistoricoMes {
  mes: string; // "2026-06"
  label: string; // "Jun 2026"
  lucro: number;
  depositos: number;
  saques: number;
  operacoes: number;
}

const MESES_NOMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function getMesLabel(mesKey: string): string {
  const [ano, mes] = mesKey.split("-");
  return `${MESES_NOMES[parseInt(mes) - 1]} ${ano}`;
}

function getMesAtual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function parseLocalDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const normalized = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T12:00:00`)
    : new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function Faturamento() {
  const { state } = useApp();
  const { data: gastosProxyList = [] } = trpc.gastosProxy.list.useQuery();
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [period, setPeriod] = useState("mes");
  const [showApresentacao, setShowApresentacao] = useState(false);
  const [metaGlobal, setMetaGlobal] = useState<number>(() => {
    try { return JSON.parse(localStorage.getItem(META_KEY) || "100000"); } catch { return 100000; }
  });
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaTemp, setMetaTemp] = useState(metaGlobal);
  const [historico, setHistorico] = useState<HistoricoMes[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORICO_KEY) || "[]"); } catch { return []; }
  });
  const [novoMes, setNovoMes] = useState({
    mes: getMesAtual(),
    lucro: 0,
    depositos: 0,
    saques: 0,
    operacoes: 0,
  });
  const [showAddMes, setShowAddMes] = useState(false);
  const [financeFilterQuick, setFinanceFilterQuick] = useState<"hoje" | "ontem" | "7dias" | "30dias" | "todos" | "custom">("todos");
  const [financeStartDate, setFinanceStartDate] = useState("");
  const [financeEndDate, setFinanceEndDate] = useState("");
  const [financeOperator, setFinanceOperator] = useState("todos");
  const [financeNetwork, setFinanceNetwork] = useState("todos");
  const [financeResultType, setFinanceResultType] = useState<"todos" | "lucro" | "prejuizo">("todos");
  const [financeGranularity, setFinanceGranularity] = useState<"diario" | "semanal" | "mensal">("diario");

  // Calcular lucros do sistema
  const relatoriosFinalizados = state.relatorios.filter((r) => r.status === "finalizado");

  const calcLucro = (relatorios: typeof relatoriosFinalizados) =>
    relatorios.reduce((total, rel) => {
      const resultado = rel.rows.reduce((s, r) => s + (Number(r.resultado) || 0), 0);
      return total + resultado + (Number(rel.cooperacao) || 0);
    }, 0);

  const hoje = new Date();
  const inicioHoje = startOfDay(hoje);
  const fimHoje = endOfDay(hoje);
  const inicio7Dias = startOfDay(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6));
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const getDataFaturamento = (relatorio: typeof relatoriosFinalizados[number]) => {
    return (
      parseLocalDate(relatorio.finalizadoEm) ||
      parseLocalDate(relatorio.criadoEm) ||
      parseLocalDate(relatorio.atualizadoEm)
    );
  };

  const isRelatorioNoPeriodo = (relatorio: typeof relatoriosFinalizados[number], inicio: Date) => {
    const data = getDataFaturamento(relatorio);
    return !!data && data >= inicio && data <= fimHoje;
  };

  const relHoje = relatoriosFinalizados.filter((r) => isRelatorioNoPeriodo(r, inicioHoje));
  const rel7Dias = relatoriosFinalizados.filter((r) => isRelatorioNoPeriodo(r, inicio7Dias));
  const relMes = relatoriosFinalizados.filter((r) => isRelatorioNoPeriodo(r, inicioMes));

  const lucroHoje = calcLucro(relHoje);
  const lucro7Dias = calcLucro(rel7Dias);
  const lucroMes = calcLucro(relMes);
  const lucroTotal = calcLucro(relatoriosFinalizados);

  const lucroExibido =
    period === "hoje" ? lucroHoje :
    period === "7dias" ? lucro7Dias :
    period === "mes" ? lucroMes : lucroTotal;

  const relExibidos =
    period === "hoje" ? relHoje :
    period === "7dias" ? rel7Dias :
    period === "mes" ? relMes : relatoriosFinalizados;

  const percentMeta = metaGlobal > 0 ? Math.min((lucroTotal / metaGlobal) * 100, 100) : 0;

  const saveHistorico = (novoHistorico: HistoricoMes[]) => {
    setHistorico(novoHistorico);
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(novoHistorico));
  };

  const handleAddMes = () => {
    const label = getMesLabel(novoMes.mes);
    const exists = historico.find((h) => h.mes === novoMes.mes);
    const entry: HistoricoMes = { ...novoMes, label };
    if (exists) {
      saveHistorico(historico.map((h) => (h.mes === novoMes.mes ? entry : h)));
    } else {
      saveHistorico([...historico, entry].sort((a, b) => a.mes.localeCompare(b.mes)));
    }
    setNovoMes({ mes: getMesAtual(), lucro: 0, depositos: 0, saques: 0, operacoes: 0 });
    setShowAddMes(false);
  };

  const saveMeta = () => {
    setMetaGlobal(metaTemp);
    localStorage.setItem(META_KEY, JSON.stringify(metaTemp));
    setEditandoMeta(false);
  };

  const dadosEvolucao = historico.length > 0 ? historico : [
    { label: "Sem dados", lucro: 0, depositos: 0, saques: 0, operacoes: 0, mes: "" },
  ];

  const corLucro = lucroExibido >= 0 ? "#4ade80" : "#f87171";

  // Gastos proxy filtrados pelo período
  const gastosNoPeriodo = (gastosProxyList as any[]).reduce((sum, g) => {
    const d = parseLocalDate(g.data);
    if (!d) return sum;
    const limite =
      period === "hoje" ? inicioHoje :
      period === "7dias" ? inicio7Dias :
      period === "mes" ? inicioMes : new Date(0);
    if (d >= limite && d <= fimHoje) return sum + parseFloat(g.valor?.toString() || "0");
    return sum;
  }, 0);
  const lucroRealPeriodo = lucroExibido - gastosNoPeriodo;

  return (
    <div className="min-h-screen text-white p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight"
              style={{
                background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Faturamento
            </h1>
            <p className="text-xs text-white/40 mt-0.5 uppercase tracking-widest">Painel financeiro premium</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApresentacao(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #d4a017, #f59e0b)",
                color: "#050b18",
                boxShadow: "0 0 20px rgba(212,160,23,0.3)",
              }}
            >
              <Play size={14} />
              Apresentação
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 p-1 rounded-xl border border-white/10"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {[
            { id: "visao-geral", label: "Visão Geral" },
            { id: "evolucao", label: "Evolução" },
            { id: "historico", label: "Histórico" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "text-[#050b18]"
                  : "text-white/40 hover:text-white/70"
              }`}
              style={activeTab === tab.id ? {
                background: "linear-gradient(135deg, #d4a017, #f59e0b)",
              } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        {activeTab === "visao-geral" && (
          <div className="rounded-2xl p-3 flex flex-wrap items-center gap-3 border border-white/8"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex items-center gap-2 pr-3 border-r border-white/10">
              <Filter size={14} className="text-[#d4a017]" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Período</span>
            </div>
            <div className="flex gap-1 rounded-xl p-1 border border-white/8"
              style={{ background: "rgba(0,0,0,0.3)" }}
            >
              {[
                { id: "hoje", label: "Hoje" },
                { id: "7dias", label: "7 dias" },
                { id: "mes", label: "Mês Atual" },
                { id: "total", label: "Total" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === p.id
                      ? "bg-[#d4a017] text-[#050b18]"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== VISÃO GERAL ===== */}
        {activeTab === "visao-geral" && (
          <>
            {/* Top Grid: Main + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Main Revenue Card */}
              <div className="lg:col-span-2 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px]"
                style={{
                  background: "linear-gradient(145deg, #070e20 0%, #0f1e45 100%)",
                  border: "1px solid rgba(212,160,23,0.2)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div className="absolute top-0 left-0 w-full h-[1px]"
                  style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.6), transparent)" }}
                />
                <div className="absolute bottom-0 left-0 w-full h-1/3 pointer-events-none opacity-10">
                  <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,80 Q200,20 400,60 T800,40 T1000,10" stroke="#d4a017" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
                    <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
                      {period === "hoje" ? "Lucro de Hoje" :
                       period === "7dias" ? "Lucro — Últimos 7 Dias" :
                       period === "mes" ? "Lucro do Mês Atual" : "Lucro Total"}
                    </span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter mt-2 mb-1"
                    style={{ color: corLucro }}
                  >
                    R$ {lucroExibido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-white/30">
                    {relExibidos.length} relatório(s) finalizado(s) no período
                  </p>
                </div>
                <div className="relative z-10 flex items-center gap-6 border-t border-white/5 pt-4 mt-4">
                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-white/30 mb-1">Hoje</p>
                    <p className="font-bold text-sm" style={{ color: lucroHoje >= 0 ? "#4ade80" : "#f87171" }}>
                      R$ {lucroHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-white/30 mb-1">7 Dias</p>
                    <p className="font-bold text-sm" style={{ color: lucro7Dias >= 0 ? "#4ade80" : "#f87171" }}>
                      R$ {lucro7Dias.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-white/30 mb-1">Mês</p>
                    <p className="font-bold text-sm" style={{ color: lucroMes >= 0 ? "#4ade80" : "#f87171" }}>
                      R$ {lucroMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Linha sutil: gastos proxy + lucro real */}
                {gastosNoPeriodo > 0 && (
                  <div className="relative z-10 mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-400/50"></span>
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Proxy</span>
                      <span className="text-[11px] font-bold text-red-400/60">
                        – R$ {gastosNoPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full" style={{ background: lucroRealPeriodo >= 0 ? "#4ade8066" : "#f8717166" }}></span>
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">Lucro Real</span>
                      <span className="text-[11px] font-bold" style={{ color: lucroRealPeriodo >= 0 ? "#4ade8099" : "#f8717199" }}>
                        R$ {lucroRealPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Stats */}
              <div className="grid grid-rows-4 gap-3">
                {[
                  { label: "Rel. finalizados", sub: "no período", value: relExibidos.length, color: "#4ade80", icon: <Award size={14} /> },
                  { label: "Total casas ativas", sub: "no sistema", value: state.casas.filter(c => c.status === "ativa").length, color: "#60a5fa", icon: <BarChart3 size={14} /> },
                  { label: "Casas finalizadas", sub: "histórico", value: state.casas.filter(c => c.status === "finalizada").length, color: "#a78bfa", icon: <CheckCircleIcon /> },
                  { label: "Meta global", sub: `${percentMeta.toFixed(1)}% atingido`, value: `${percentMeta.toFixed(0)}%`, color: "#f59e0b", icon: <Target size={14} /> },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl p-4 flex items-center justify-between transition-all hover:border-opacity-50"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid rgba(255,255,255,0.06)`,
                      borderLeft: `3px solid ${s.color}`,
                    }}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white/70 mb-0.5">{s.label}</h4>
                      <p className="text-[10px] text-white/30">{s.sub}</p>
                    </div>
                    <span className="font-black font-mono text-lg" style={{ color: s.color }}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: Intelligence + Meta */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Inteligência */}
              <div className="rounded-3xl p-5 border border-white/8"
                style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border border-[#d4a017]/20"
                      style={{ background: "rgba(212,160,23,0.08)" }}
                    >
                      <Activity size={14} className="text-[#d4a017]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white/90 text-sm">Performance da Operação</h3>
                      <p className="text-[10px] text-white/30">Análise em tempo real</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded flex items-center gap-1.5 border border-white/10"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Ao Vivo</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: "Tendência",
                      content: (
                        <div className="flex items-center gap-2">
                          {lucroMes >= 0
                            ? <TrendingUp size={14} className="text-emerald-400" />
                            : <TrendingDown size={14} className="text-red-400" />
                          }
                          <span className="text-xs font-bold text-white/70">
                            {lucroMes >= 0 ? "Positiva" : "Negativa"}
                          </span>
                        </div>
                      ),
                    },
                    {
                      label: "Lucro Real",
                      content: (
                        <>
                          <p className="text-sm font-black" style={{ color: lucroMes >= 0 ? "#4ade80" : "#f87171" }}>
                            {lucroMes >= 0 ? "+" : ""}R$ {lucroMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[9px] text-white/30">{relatoriosFinalizados.length} metas · mês atual</p>
                        </>
                      ),
                    },
                    {
                      label: "Alerta",
                      content: (
                        <p className="text-xs font-medium text-white/40">
                          {lucroMes < 0 ? "⚠️ Prejuízo este mês" : "Sem alertas"}
                        </p>
                      ),
                    },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl p-3 border border-white/6"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <p className="text-[9px] uppercase font-bold tracking-widest text-white/30 mb-2">{item.label}</p>
                      {item.content}
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta Global */}
              <div className="rounded-3xl p-5 border border-white/8"
                style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border border-emerald-500/20"
                      style={{ background: "rgba(74,222,128,0.06)" }}
                    >
                      <Target size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white/90 text-sm">Meta Global</h3>
                      <p className="text-[10px] text-white/30">
                        Objetivo: R$ {metaGlobal.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMetaTemp(metaGlobal); setEditandoMeta(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 transition-colors border border-white/8"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <Edit3 size={11} />
                    Editar
                  </button>
                </div>
                {editandoMeta && (
                  <div className="mb-4 flex gap-2">
                    <input
                      type="number"
                      value={metaTemp}
                      onChange={(e) => setMetaTemp(Number(e.target.value))}
                      className="flex-1 px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                      placeholder="Ex: 100000"
                    />
                    <button onClick={saveMeta}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-[#050b18]"
                      style={{ background: "#d4a017" }}
                    >Salvar</button>
                    <button onClick={() => setEditandoMeta(false)}
                      className="px-3 py-2 rounded-lg text-xs text-white/40 border border-white/10"
                    >✕</button>
                  </div>
                )}
                <div className="mb-6">
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-black" style={{ color: "#4ade80" }}>
                      {percentMeta.toFixed(1)}%
                    </span>
                    <span className="text-xs text-white/30 mb-1">concluído</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden border border-white/8"
                    style={{ background: "rgba(0,0,0,0.4)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percentMeta}%`,
                        background: "linear-gradient(to right, #4ade80, #22c55e)",
                        boxShadow: "0 0 12px rgba(74,222,128,0.4)",
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Atingido", value: `R$ ${lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "#4ade80" },
                    { label: "Falta", value: `R$ ${Math.max(0, metaGlobal - lucroTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, color: "#f87171" },
                    { label: "Previsão", value: lucroMes > 0 ? `${Math.ceil((metaGlobal - lucroTotal) / lucroMes)} mes(es)` : "N/A", color: "#f59e0b" },
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl p-3 border border-white/6"
                      style={{ background: "rgba(0,0,0,0.3)" }}
                    >
                      <p className="text-[9px] uppercase font-bold tracking-widest text-white/30 mb-1">{item.label}</p>
                      <p className="text-xs font-bold" style={{ color: item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== EVOLUÇÃO ===== */}
        {activeTab === "evolucao" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white/90">Evolução Mensal</h2>
                <p className="text-xs text-white/30">Histórico de faturamento por mês</p>
              </div>
              <button
                onClick={() => setShowAddMes(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#050b18] transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
              >
                + Registrar Mês
              </button>
            </div>

            {showAddMes && (
              <div className="rounded-2xl p-5 border border-[#d4a017]/20 space-y-4"
                style={{ background: "rgba(212,160,23,0.05)" }}
              >
                <h3 className="text-sm font-bold text-white/80">Registrar Faturamento do Mês</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Mês</label>
                    <input
                      type="month"
                      value={novoMes.mes}
                      onChange={(e) => setNovoMes({ ...novoMes, mes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Lucro (R$)</label>
                    <input
                      type="number"
                      value={novoMes.lucro || ""}
                      onChange={(e) => setNovoMes({ ...novoMes, lucro: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Operações</label>
                    <input
                      type="number"
                      value={novoMes.operacoes || ""}
                      onChange={(e) => setNovoMes({ ...novoMes, operacoes: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Depósitos (R$)</label>
                    <input
                      type="number"
                      value={novoMes.depositos || ""}
                      onChange={(e) => setNovoMes({ ...novoMes, depositos: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Saques (R$)</label>
                    <input
                      type="number"
                      value={novoMes.saques || ""}
                      onChange={(e) => setNovoMes({ ...novoMes, saques: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleAddMes}
                    className="px-6 py-2 rounded-xl text-xs font-bold text-[#050b18]"
                    style={{ background: "#d4a017" }}
                  >Salvar</button>
                  <button onClick={() => setShowAddMes(false)}
                    className="px-4 py-2 rounded-xl text-xs text-white/40 border border-white/10"
                  >Cancelar</button>
                </div>
              </div>
            )}

            {historico.length > 0 ? (
              <div className="rounded-3xl p-5 border border-white/8"
                style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
              >
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dadosEvolucao} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4a017" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ background: "#070e20", border: "1px solid rgba(212,160,23,0.3)", borderRadius: 12, color: "#fff", fontSize: 12 }}
                      formatter={(v: any) => [`R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Lucro"]}
                    />
                    <Area type="monotone" dataKey="lucro" stroke="#d4a017" strokeWidth={2} fill="url(#colorLucro)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-3xl p-12 border border-white/8 text-center"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <BarChart3 size={40} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Nenhum dado histórico ainda.</p>
                <p className="text-white/20 text-xs mt-1">Clique em "Registrar Mês" para começar.</p>
              </div>
            )}
          </div>
        )}

        {/* ===== HISTÓRICO ===== */}
        {activeTab === "historico" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white/90">Histórico de Faturamento</h2>
                <p className="text-xs text-white/30">{historico.length} meses registrados</p>
              </div>
              <button
                onClick={() => setShowAddMes(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#050b18]"
                style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
              >
                + Registrar Mês
              </button>
            </div>

            {showAddMes && (
              <div className="rounded-2xl p-5 border border-[#d4a017]/20 space-y-4"
                style={{ background: "rgba(212,160,23,0.05)" }}
              >
                <h3 className="text-sm font-bold text-white/80">Registrar Faturamento do Mês</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Mês</label>
                    <input type="month" value={novoMes.mes}
                      onChange={(e) => setNovoMes({ ...novoMes, mes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Lucro (R$)</label>
                    <input type="number" value={novoMes.lucro || ""}
                      onChange={(e) => setNovoMes({ ...novoMes, lucro: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Operações</label>
                    <input type="number" value={novoMes.operacoes || ""}
                      onChange={(e) => setNovoMes({ ...novoMes, operacoes: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Depósitos (R$)</label>
                    <input type="number" value={novoMes.depositos || ""}
                      onChange={(e) => setNovoMes({ ...novoMes, depositos: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider block mb-1">Saques (R$)</label>
                    <input type="number" value={novoMes.saques || ""}
                      onChange={(e) => setNovoMes({ ...novoMes, saques: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleAddMes}
                    className="px-6 py-2 rounded-xl text-xs font-bold text-[#050b18]"
                    style={{ background: "#d4a017" }}
                  >Salvar</button>
                  <button onClick={() => setShowAddMes(false)}
                    className="px-4 py-2 rounded-xl text-xs text-white/40 border border-white/10"
                  >Cancelar</button>
                </div>
              </div>
            )}

            {historico.length > 0 ? (
              <div className="rounded-3xl border border-white/8 overflow-hidden"
                style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(212,160,23,0.05)" }}>
                      {["Mês", "Lucro", "Depósitos", "Saques", "Operações", ""].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...historico].reverse().map((h, i) => (
                      <tr key={h.mes}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td className="px-5 py-4 font-bold text-white/80">{h.label}</td>
                        <td className="px-5 py-4 font-black" style={{ color: h.lucro >= 0 ? "#4ade80" : "#f87171" }}>
                          R$ {h.lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 text-white/50">R$ {h.depositos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-4 text-white/50">R$ {h.saques.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="px-5 py-4 text-white/50">{h.operacoes}</td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => saveHistorico(historico.filter((x) => x.mes !== h.mes))}
                            className="text-red-400/50 hover:text-red-400 transition-colors text-xs"
                          >✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(212,160,23,0.05)" }}>
                      <td className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/30">TOTAL</td>
                      <td className="px-5 py-3 font-black text-sm" style={{ color: "#d4a017" }}>
                        R$ {historico.reduce((s, h) => s + h.lucro, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-white/40 text-xs">
                        R$ {historico.reduce((s, h) => s + h.depositos, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-white/40 text-xs">
                        R$ {historico.reduce((s, h) => s + h.saques, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-white/40 text-xs">
                        {historico.reduce((s, h) => s + h.operacoes, 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="rounded-3xl p-12 border border-white/8 text-center"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <Clock size={40} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Nenhum histórico registrado ainda.</p>
                <p className="text-white/20 text-xs mt-1">Registre os faturamentos mensais para ver o histórico aqui.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== MODAL DE APRESENTAÇÃO ===== */}
      {showApresentacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={() => setShowApresentacao(false)}
        >
          <div
            className="relative max-w-lg w-full rounded-3xl p-8 text-center overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #070e20 0%, #0f1e45 50%, #070e20 100%)",
              border: "1px solid rgba(212,160,23,0.35)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,160,23,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top border glow */}
            <div className="absolute top-0 left-0 w-full h-[2px]"
              style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.8), transparent)" }}
            />

            <button
              onClick={() => setShowApresentacao(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Logo */}
            <div className="relative inline-flex mb-6">
              <div className="absolute -inset-3 rounded-2xl blur-2xl opacity-40 animate-pulse"
                style={{ background: "linear-gradient(135deg, #d4a017, #f97316)" }}
              />
              <div className="absolute -inset-[3px] rounded-2xl opacity-50"
                style={{ background: "conic-gradient(from 0deg, #d4a017, #f97316, #d4a017)", padding: "2px", borderRadius: 20 }}
              />
              <div className="relative w-18 h-18 flex items-center justify-center"
                style={{
                  width: 72, height: 72,
                  background: "linear-gradient(145deg, #1a0a00, #0d0500)",
                  borderRadius: 20,
                  border: "2px solid rgba(212,160,23,0.6)",
                  boxShadow: "0 0 30px rgba(212,160,23,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}
              >
                <div className="absolute top-1.5 left-4 right-4 h-[1px]"
                  style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)" }}
                />
                <Crown style={{ color: "#f3d078", filter: "drop-shadow(0 0 12px rgba(212,160,23,0.9))" }}
                  size={34} strokeWidth={2}
                />
              </div>
            </div>

            <h2 className="text-2xl font-black tracking-[0.2em] uppercase mb-1"
              style={{
                background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >CAPITAL PRIME</h2>
            <p className="text-[#d4a017] text-xs tracking-[0.4em] font-bold uppercase mb-8">CONTROL</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Lucro Hoje", value: lucroHoje, color: "#4ade80" },
                { label: "Últimos 7 Dias", value: lucro7Dias, color: "#60a5fa" },
                { label: "Mês Atual", value: lucroMes, color: "#d4a017" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl p-4 border border-white/8"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">{item.label}</p>
                  <p className="text-lg font-black" style={{ color: item.color }}>
                    R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4 border border-white/8 mb-4"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Lucro Total Acumulado</p>
              <p className="text-3xl font-black"
                style={{ color: lucroTotal >= 0 ? "#4ade80" : "#f87171" }}
              >
                R$ {lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden border border-white/10"
                style={{ background: "rgba(0,0,0,0.4)" }}
              >
                <div className="h-full rounded-full"
                  style={{
                    width: `${percentMeta}%`,
                    background: "linear-gradient(to right, #4ade80, #22c55e)",
                  }}
                />
              </div>
              <p className="text-[10px] text-white/30 mt-1">{percentMeta.toFixed(1)}% da meta de R$ {metaGlobal.toLocaleString("pt-BR")}</p>
            </div>

            <p className="text-[10px] text-white/20 uppercase tracking-widest">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
