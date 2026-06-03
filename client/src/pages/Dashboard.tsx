import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import { Calendar, Home, FileText, DollarSign, Wallet, TrendingUp, Clock, Zap, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import DashboardCalendar from "@/components/DashboardCalendar";
import { navigateToTab } from "@/lib/navigate";

interface Plataforma {
  id: string;
  nome: string;
  diasPrazo: number;
  dia: string;
}

export default function Dashboard() {
  const { state } = useApp();
  const { data: totalGastosProxy = 0 } = trpc.gastosProxy.total.useQuery();
  const { data: gastosProxyList = [] } = trpc.gastosProxy.list.useQuery();
  const { data: contasData = [] } = trpc.contas.list.useQuery();

  const lerPlataformas = (): Plataforma[] => {
    try {
      const saved = localStorage.getItem("plataformas-calendario-v2");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
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
  };

  const [plataformas, setPlataformas] = useState<Plataforma[]>(lerPlataformas);

  // Atualiza quando o Gerenciamento de Plataformas salvar algo novo
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) {
        setPlataformas(detail);
      } else {
        setPlataformas(lerPlataformas());
      }
    };
    window.addEventListener("plataformas-updated", handleUpdate);
    return () => window.removeEventListener("plataformas-updated", handleUpdate);
  }, []);

  // Dados
  const relatoriosFinalizados = state.relatorios.filter((r) => r.status === "finalizado");
  const lucroCaixa = relatoriosFinalizados.reduce((total, rel) => {
    if (!Array.isArray(rel.rows)) return total;
    const resultado = rel.rows.reduce((s, row) => s + (Number(row.resultado || 0) || 0), 0);
    const coop = Number(rel.cooperacao || 0);
    return total + resultado + (isNaN(coop) ? 0 : coop);
  }, 0);

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const gastosDoMes = (gastosProxyList as any[]).reduce((sum, g) => {
    const d = new Date(g.data + "T12:00:00");
    if (d >= inicioMes) return sum + parseFloat(g.valor?.toString() || "0");
    return sum;
  }, 0);
  const lucroRealMes = lucroCaixa - gastosDoMes;

  const diasSemana = ["DOMINGO","SEGUNDA-FEIRA","TERÇA-FEIRA","QUARTA-FEIRA","QUINTA-FEIRA","SEXTA-FEIRA","SÁBADO"];
  const diaSemanaHoje = diasSemana[hoje.getDay()];
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const diasF = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const dataFormatada = `${diasF[hoje.getDay()]}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;

  const plataformasDeHoje = plataformas
    .filter((p) => p.dia === diaSemanaHoje)
    .sort((a, b) => b.diasPrazo - a.diasPrazo);

  const COR_DIA: Record<string, string> = {
    "SEGUNDA-FEIRA": "#60a5fa", "TERÇA-FEIRA": "#34d399", "QUARTA-FEIRA": "#a78bfa",
    "QUINTA-FEIRA": "#f59e0b", "SEXTA-FEIRA": "#f87171", "SÁBADO": "#fb923c", "DOMINGO": "#e879f9",
  };
  const corHoje = COR_DIA[diaSemanaHoje] || "#d4a017";

  // Métricas
  const metricas = [
    {
      title: "Operação CPA",
      value: state.casas.filter((c) => c.status === "ativa").length,
      icon: Home,
      color: "#60a5fa",
      tab: "gerenciar-casas",
      desc: "casas ativas",
    },
    {
      title: "Casas Finalizadas",
      value: state.casas.filter((c) => c.status === "finalizada").length,
      icon: TrendingUp,
      color: "#4ade80",
      tab: "gerenciar-casas",
      desc: "histórico",
    },
    {
      title: "Relatórios Criados",
      value: state.relatorios.filter((r) => r.status !== "finalizado" && r.status !== "lixeira").length,
      icon: FileText,
      color: "#a78bfa",
      tab: "gerenciar-casas",
      desc: "em andamento",
    },
    {
      title: "Contas para Sacar",
      value: (contasData as any[]).filter((c) => c.status !== "bloqueado").length,
      icon: Wallet,
      color: "#f472b6",
      tab: "contas",
      desc: "pendentes",
    },
    {
      title: "Gastos / Despesas",
      value: `R$ ${Number(totalGastosProxy).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: Zap,
      color: "#f59e0b",
      tab: "gasto-proxy",
      desc: "total registrado",
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">


        {/* Lucro em Caixa — card principal */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-emerald-500/15 group transition-all duration-300 hover:border-emerald-500/25"
          style={{ background: "linear-gradient(145deg, #070e20 0%, #071a12 100%)" }}
        >
          {/* Linhas decorativas */}
          <div className="absolute top-0 left-0 w-full h-[1px]"
            style={{ background: "linear-gradient(to right, transparent, rgba(74,222,128,0.4), transparent)" }} />
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-5 pointer-events-none"
            style={{ background: "radial-gradient(circle, #4ade80, transparent)" }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400/60">Lucro em Caixa</p>
              </div>
              <p className="text-5xl md:text-6xl font-black tracking-tighter mb-2"
                style={{ color: "#4ade80", textShadow: "0 0 40px rgba(74,222,128,0.25)" }}
              >
                R$ {lucroCaixa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-white/25">Soma de todos os relatórios finalizados</p>

              {/* Proxy + Lucro Real */}
              {gastosDoMes > 0 && (
                <div className="flex flex-wrap items-center gap-5 mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400/50" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Proxy (mês)</span>
                    <span className="text-xs font-bold text-red-400/60">– R$ {gastosDoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full" style={{ background: lucroRealMes >= 0 ? "#4ade8060" : "#f8717160" }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Lucro Real</span>
                    <span className="text-xs font-bold" style={{ color: lucroRealMes >= 0 ? "#4ade8090" : "#f8717190" }}>
                      R$ {lucroRealMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Ícone decorativo */}
            <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-2xl border border-emerald-500/20 group-hover:scale-105 transition-transform duration-500"
              style={{ background: "rgba(74,222,128,0.06)" }}
            >
              <DollarSign size={36} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
            <h2 className="text-sm font-black text-white/70 uppercase tracking-wider">Métricas Principais</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {metricas.map((m, i) => {
              const Icon = m.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigateToTab(m.tab)}
                  className="group relative text-left rounded-2xl p-4 border border-white/8 transition-all duration-200 hover:-translate-y-1 hover:border-opacity-30 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = m.color + "40"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  {/* Barra de cor no topo */}
                  <div className="absolute top-0 left-0 w-full h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ background: m.color }} />

                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/8"
                      style={{ background: m.color + "15", color: m.color }}
                    >
                      <Icon size={15} />
                    </div>
                    <ArrowRight size={12} className="text-white/15 group-hover:text-white/40 transition-colors mt-1" />
                  </div>

                  <p className="text-[9px] font-black uppercase tracking-widest text-white/35 mb-1">{m.title}</p>
                  <p className="text-2xl font-black text-white">{m.value}</p>
                  <p className="text-[9px] text-white/20 mt-0.5">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lançamentos de Hoje */}
        <div className="rounded-2xl p-5 border border-white/8 relative overflow-hidden"
          style={{ 
            background: "linear-gradient(135deg, rgba(8, 14, 32, 0.95) 0%, rgba(12, 21, 36, 0.85) 100%)",
            backdropFilter: "blur(10px)"
          }}
        >
          {/* Decorative multi-color gradient line at the top */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 via-rose-400 to-indigo-400" />

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10"
                style={{ 
                  background: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(245,158,11,0.05))", 
                  color: "#d4a017",
                  boxShadow: "0 0 10px rgba(212,160,23,0.2)"
                }}
              >
                <Calendar size={16} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white" style={{ textShadow: "0 0 10px rgba(255,255,255,0.1)" }}>Lançamentos de Hoje</h2>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{dataFormatada}</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-[#d4a017]/20"
              style={{ 
                background: "rgba(212,160,23,0.08)", 
                color: "#d4a017",
                boxShadow: "0 0 10px rgba(212,160,23,0.05)"
              }}
            >
              {plataformasDeHoje.length} plataforma{plataformasDeHoje.length !== 1 ? "s" : ""}
            </span>
          </div>

          {plataformasDeHoje.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {(() => {
                const CORES_DIVERSAS = [
                  { text: "#38bdf8", bg: "rgba(56, 189, 248, 0.08)", border: "rgba(56, 189, 248, 0.25)" }, // Blue
                  { text: "#4ade80", bg: "rgba(74, 222, 128, 0.08)", border: "rgba(74, 222, 128, 0.25)" }, // Green
                  { text: "#fb7185", bg: "rgba(251, 113, 133, 0.08)", border: "rgba(251, 113, 133, 0.25)" }, // Pink/Rose
                  { text: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)" }, // Gold
                  { text: "#a78bfa", bg: "rgba(167, 139, 250, 0.08)", border: "rgba(167, 139, 250, 0.25)" }, // Purple
                  { text: "#22d3ee", bg: "rgba(34, 211, 238, 0.08)", border: "rgba(34, 211, 238, 0.25)" }, // Cyan
                  { text: "#f43f5e", bg: "rgba(244, 63, 94, 0.08)", border: "rgba(244, 63, 94, 0.25)" }, // Red
                  { text: "#fb923c", bg: "rgba(251, 146, 60, 0.08)", border: "rgba(251, 146, 60, 0.25)" }, // Orange
                ];
                return plataformasDeHoje.map((plat, idx) => {
                  const colorConfig = CORES_DIVERSAS[idx % CORES_DIVERSAS.length];
                  return (
                    <div key={plat.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 hover:-translate-y-0.5"
                      style={{ 
                        background: "rgba(255,255,255,0.02)", 
                        borderColor: colorConfig.border,
                        boxShadow: `0 4px 20px -8px ${colorConfig.text}10`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
                          style={{ background: colorConfig.bg, color: colorConfig.text, border: `1px solid ${colorConfig.border}` }}
                        >
                          {plat.nome.slice(0, 2)}
                        </div>
                        <span className="font-extrabold text-sm text-white/90">{plat.nome}</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-1 rounded-lg border"
                        style={{
                          background: plat.diasPrazo === 0 ? "rgba(255,255,255,0.03)" : colorConfig.bg,
                          color: plat.diasPrazo === 0 ? "rgba(255,255,255,0.4)" : colorConfig.text,
                          borderColor: plat.diasPrazo === 0 ? "rgba(255,255,255,0.08)" : colorConfig.border
                        }}
                      >
                        {plat.diasPrazo === 0 ? "Imediato" : `+${plat.diasPrazo}d`}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="py-10 text-center rounded-xl border border-dashed border-white/8">
              <p className="text-white/20 text-sm">✨ Nenhum lançamento agendado para hoje</p>
            </div>
          )}
        </div>

        {/* Calendário */}
        <DashboardCalendar plataformas={plataformas} />
      </div>
    </div>
  );
}
