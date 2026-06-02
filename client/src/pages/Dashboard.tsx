import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Calendar, Home, FileText, DollarSign, Wallet, TrendingUp, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import DashboardCalendar from "@/components/DashboardCalendar";

interface Plataforma {
  id: string;
  nome: string;
  diasPrazo: number;
  dia: string;
}

export default function Dashboard() {
  const { state } = useApp();
  const [, navigate] = useLocation();
  const { data: totalGastosProxy = 0 } = trpc.gastosProxy.total.useQuery();
  const { data: contasData = [] } = trpc.contas.list.useQuery();
  
  // Estado para plataformas do calendário
  const [plataformas, setPlataformas] = useState<Plataforma[]>([
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
  ]);
  
  // Contar dados
  const casasAtivas = state.casas.filter((c) => c.status === "ativa").length;
  const casasFinalizadas = state.casas.filter((c) => c.status === "finalizada").length;
  const relatoriosCriados = state.relatorios.filter((r) => r.status !== "finalizado" && r.status !== "lixeira").length;
  const relatoriosFinalizados = state.relatorios.filter((r) => r.status === "finalizado");
  const contasParaSacar = contasData.filter((c: any) => c.status !== "bloqueado").length;
  
  // Calcular lucro em caixa
  const lucroCaixa = relatoriosFinalizados.reduce((total, rel) => {
    if (!Array.isArray(rel.rows)) return total;
    const resultadoTotal = rel.rows.reduce((sum, row) => {
      const resultado = Number(row.resultado || 0);
      return sum + (isNaN(resultado) ? 0 : resultado);
    }, 0);
    const cooperacao = Number(rel.cooperacao || 0);
    const cooperacaoValid = isNaN(cooperacao) ? 0 : cooperacao;
    return total + resultadoTotal + cooperacaoValid;
  }, 0);

  // Cores de destaque para os cards
  const colors = [
    "from-blue-500/20 to-transparent border-blue-500/50 text-blue-400",
    "from-emerald-500/20 to-transparent border-emerald-500/50 text-emerald-400",
    "from-purple-500/20 to-transparent border-purple-500/50 text-purple-400",
    "from-rose-500/20 to-transparent border-rose-500/50 text-rose-400",
    "from-amber-500/20 to-transparent border-amber-500/50 text-amber-400",
  ];

  const resumoCards = [
    { title: "Casas Ativas", value: casasAtivas, icon: Home, color: colors[0], href: "/relatorios" },
    { title: "Casas Finalizadas", value: casasFinalizadas, icon: TrendingUp, color: colors[1], href: "/casas-finalizadas" },
    { title: "Relatórios Criados", value: relatoriosCriados, icon: FileText, color: colors[2], href: "/relatorios" },
    { title: "Contas para Sacar", value: contasParaSacar, icon: Wallet, color: colors[3], href: "/contas" },
    { title: "Gasto com Proxy", value: `R$ ${totalGastosProxy.toFixed(2)}`, icon: DollarSign, color: colors[4], href: "/gasto-proxy" },
  ];

  // Cores luxuosas para as plataformas
  const coresPlataformas = [
    { bg: "bg-blue-500/10", border: "border-blue-500/20 border-l-blue-500", text: "text-blue-400" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/20 border-l-emerald-500", text: "text-emerald-400" },
    { bg: "bg-purple-500/10", border: "border-purple-500/20 border-l-purple-500", text: "text-purple-400" },
    { bg: "bg-rose-500/10", border: "border-rose-500/20 border-l-rose-500", text: "text-rose-400" },
    { bg: "bg-amber-500/10", border: "border-amber-500/20 border-l-amber-500", text: "text-amber-400" },
    { bg: "bg-cyan-500/10", border: "border-cyan-500/20 border-l-cyan-500", text: "text-cyan-400" },
  ];
  
  // Obter plataformas de hoje do calendário
  const hoje = new Date();
  const diasSemana = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];
  const diaSemanaHoje = diasSemana[hoje.getDay()];
  
  const plataformasDeHoje = plataformas
    .filter((p) => p.dia === diaSemanaHoje)
    .sort((a, b) => b.diasPrazo - a.diasPrazo); // Maior prazo primeiro

  // Formatar data de hoje
  const diasSemanaFormatado = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const diaSemanaHojeFormatado = diasSemanaFormatado[hoje.getDay()];
  const dataFormatada = `${diaSemanaHojeFormatado}, ${hoje.getDate()} de ${[
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ][hoje.getMonth()]}`;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard CPA</h1>
          <p className="text-muted-foreground">Visão geral elegante e detalhada de suas operações.</p>
        </div>

        {/* Card de Lucro em Caixa */}
        <div className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-8 shadow-2xl group transition-all duration-500 hover:border-emerald-500/30 hover:shadow-emerald-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-900/10 opacity-60"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-muted-foreground text-xs md:text-sm tracking-[0.2em] font-semibold mb-3 uppercase">
                Lucro em Caixa
              </p>
              <p className="text-5xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-emerald-400 to-teal-200 drop-shadow-sm">
                R$ {lucroCaixa.toFixed(2)}
              </p>
              <p className="text-muted-foreground/70 text-xs mt-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Soma de todos os relatórios finalizados
              </p>
            </div>
            
            <div className="hidden md:flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
              <DollarSign size={40} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Seção de Resumo em Quadradinhos */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Métricas Principais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {resumoCards.map((card, index) => {
              const Icon = card.icon;
              const accentColor = card.color.split(' ').pop();
              return (
                <Link
                  key={index}
                  href={card.href}
                  className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer text-left block relative overflow-hidden group border border-white/8"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${card.color.split(' ')[0]} ${card.color.split(' ')[1]} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-white/40 font-medium text-xs uppercase tracking-widest">{card.title}</p>
                    <div className="p-2 rounded-lg border border-white/8" style={{ background: "rgba(255,255,255,0.05)" }}>
                       <Icon size={16} className={accentColor} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-white tracking-tight">{card.value}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Seção de Lançamentos de Hoje */}
        <div className="rounded-2xl p-6 relative overflow-hidden border border-white/8" style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}>
          {/* Fundo sutil decorativo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-[#d4a017]/20" style={{ background: "rgba(212,160,23,0.08)" }}>
                <Calendar size={20} className="text-[#d4a017]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white/90">Lançamentos de Hoje</h2>
                <p className="text-xs text-white/30">{dataFormatada}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            {plataformasDeHoje.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {plataformasDeHoje.map((plat, index) => {
                  const cor = coresPlataformas[index % coresPlataformas.length];
                  return (
                    <div key={plat.id} className={`bg-background/40 backdrop-blur-sm border ${cor.border} border-l-4 rounded-xl p-4 flex items-center gap-4 hover:bg-muted/30 transition-all duration-300 hover:shadow-md`}>
                      <div className={`${cor.bg} p-2.5 rounded-lg border border-white/5`}>
                        <Clock size={18} className={cor.text} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground tracking-wide">{plat.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {plat.diasPrazo === 0 ? "Imediato / Sem prazo" : `Prazo: ${plat.diasPrazo} dias`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-background/50 border border-border/50 border-dashed rounded-xl p-8 text-center">
                <p className="text-muted-foreground text-sm font-medium">✨ O dia está livre. Nenhum lançamento agendado para hoje.</p>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Calendário */}
        <DashboardCalendar />
      </div>
    </div>
  );
}
