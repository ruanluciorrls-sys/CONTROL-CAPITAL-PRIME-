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

  // Cores para os cards
  const colors = [
    "bg-blue-100 border-blue-300 hover:bg-blue-200 dark:bg-blue-900 dark:border-blue-700 dark:hover:bg-blue-800",
    "bg-green-100 border-green-300 hover:bg-green-200 dark:bg-green-900 dark:border-green-700 dark:hover:bg-green-800",
    "bg-purple-100 border-purple-300 hover:bg-purple-200 dark:bg-purple-900 dark:border-purple-700 dark:hover:bg-purple-800",
    "bg-pink-100 border-pink-300 hover:bg-pink-200 dark:bg-pink-900 dark:border-pink-700 dark:hover:bg-pink-800",
    "bg-yellow-100 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900 dark:border-yellow-700 dark:hover:bg-yellow-800",
  ];


  
  const resumoCards = [
    {
      title: "Casas Ativas",
      value: casasAtivas,
      icon: Home,
      color: colors[0],
      href: "/relatorios",
    },
    {
      title: "Casas Finalizadas",
      value: casasFinalizadas,
      icon: TrendingUp,
      color: colors[1],
      href: "/casas-finalizadas",
    },
    {
      title: "Relatórios Criados",
      value: relatoriosCriados,
      icon: FileText,
      color: colors[2],
      href: "/relatorios",
    },
    {
      title: "Contas para Sacar",
      value: contasParaSacar,
      icon: Wallet,
      color: colors[3],
      href: "/contas",
    },
    {
      title: "Gasto com Proxy",
      value: `R$ ${totalGastosProxy.toFixed(2)}`,
      icon: DollarSign,
      color: colors[4],
      href: "/gasto-proxy",
    },
  ];

  // Cores para as plataformas
  const coresPlataformas = [
    "bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400",
    "bg-green-50 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400",
    "bg-purple-50 dark:bg-purple-900 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400",
    "bg-pink-50 dark:bg-pink-900 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400",
    "bg-yellow-50 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400",
    "bg-red-50 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400",
    "bg-indigo-50 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400",
    "bg-cyan-50 dark:bg-cyan-900 border-cyan-300 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Dashboard CPA</h1>
          <p className="text-slate-600 dark:text-slate-400">Resumo de todas as suas operações</p>
        </div>

        {/* Card de Lucro em Caixa */}
        <Card className="bg-gradient-to-r from-green-400 to-green-600 dark:from-green-700 dark:to-green-900 text-white mb-8 p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-lg mb-2">LUCRO EM CAIXA</p>
              <p className="text-5xl font-bold">R$ {lucroCaixa.toFixed(2)}</p>
              <p className="text-green-100 text-sm mt-2">Soma de todos os relatórios finalizados</p>
            </div>
            <DollarSign size={64} className="opacity-20" />
          </div>
        </Card>

        {/* Seção de Resumo em Quadradinhos */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Resumo Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumoCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Link
                  key={index}
                  href={card.href}
                  className={`${card.color} border-2 rounded-lg p-6 transition-all hover:shadow-lg hover:scale-105 cursor-pointer text-left block`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg">{card.title}</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{card.value}</p>
                    </div>
                    <Icon size={32} className="text-slate-600 dark:text-slate-400 opacity-60" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Seção de Lançamentos de Hoje */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar size={28} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Lançamentos de Hoje</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 ml-auto">{dataFormatada}</p>
          </div>

          {plataformasDeHoje.length > 0 ? (
            <div className="space-y-2">
              {plataformasDeHoje.map((plat, index) => {
                const corClasses = coresPlataformas[index % coresPlataformas.length];
                return (
                  <div key={plat.id} className={`${corClasses} border rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-3">
                      <Clock size={18} className={corClasses.split(" ").slice(-3).join(" ")} />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{plat.nome}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {plat.diasPrazo === 0 ? "Sem prazo" : `${plat.diasPrazo} dias`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400 text-lg">Nenhum lançamento para hoje</p>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Calendário */}
      <DashboardCalendar />
    </div>
  );
}
