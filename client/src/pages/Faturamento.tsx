import React, { useState } from "react";
import { 
  Play, 
  RefreshCw, 
  Filter, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Activity, 
  TrendingDown, 
  Target, 
  Edit3 
} from "lucide-react";

export default function Faturamento() {
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [period, setPeriod] = useState("hoje");

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-1" style={{ fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}>
              Faturamento
            </h1>
            <p className="text-sm text-gray-500">Painel financeiro</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#111] transition-colors text-xs font-semibold text-gray-400">
              <Play size={14} className="text-gray-500" />
              Apresentação
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#111] transition-colors text-xs font-semibold text-gray-400">
              <RefreshCw size={14} className="text-gray-500" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2">
          {["Visão Geral", "Evolução", "Histórico"].map((tab, idx) => {
            const id = tab.toLowerCase().replace(" ", "-").replace("ã", "a");
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-colors border ${
                  isActive 
                    ? "bg-[#111] border-[#333] text-white" 
                    : "bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#0a0a0a]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div className="bg-[#050505] border border-[#111] rounded-2xl p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-[#222]">
            <Filter size={16} className="text-red-500" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Filtros</span>
          </div>

          <div className="flex gap-1 bg-[#0a0a0a] p-1 rounded-xl border border-[#111]">
            {[
              { id: "hoje", label: "Hoje" },
              { id: "ontem", label: "Ontem" },
              { id: "7dias", label: "7 dias" },
              { id: "30dias", label: "30 dias" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  period === p.id 
                    ? "bg-white text-black" 
                    : "bg-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-3 py-1.5 text-gray-400">
              <span className="text-xs">dd/mm/aaaa</span>
              <CalendarIcon size={14} />
            </div>
            <span className="text-gray-600">-</span>
            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-3 py-1.5 text-gray-400">
              <span className="text-xs">dd/mm/aaaa</span>
              <CalendarIcon size={14} />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#111]">
              Todos operadores <ChevronDown size={14} className="text-gray-500" />
            </button>
            <button className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#111]">
              Todas redes <ChevronDown size={14} className="text-gray-500" />
            </button>
            <button className="flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-1.5 text-xs font-medium text-gray-300 hover:bg-[#111]">
              Lucro + Prejuízo <ChevronDown size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Top Grid: Main Revenue + 4 Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Revenue Card */}
          <div className="lg:col-span-2 bg-[#0a0e17] rounded-3xl border border-[#162032] p-8 relative overflow-hidden flex flex-col justify-between" style={{ background: "linear-gradient(145deg, #070a11 0%, #0c1524 100%)" }}>
            
            {/* Background subtle curve line simulation */}
            <div className="absolute bottom-0 left-0 w-full h-1/3 opacity-20 pointer-events-none">
              <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="w-full h-full text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M0,80 Q200,20 400,60 T800,40 T1000,10 L1000,100 L0,100 Z" fill="currentColor" fillOpacity="0.05" stroke="none" />
                <path d="M0,80 Q200,20 400,60 T800,40 T1000,10" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                <h2 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Receita Consolidada</h2>
              </div>
              <p className="text-xs text-gray-500 mb-6">Lucro final da operação — após custos</p>

              <h3 className="text-5xl md:text-6xl font-extrabold text-[#4ade80] tracking-tight mb-2">
                R$ 0,00
              </h3>
              <p className="text-xs text-gray-600 mb-12">Sem variação significativa vs semana anterior</p>
            </div>

            <div className="relative z-10 flex items-center gap-8 border-t border-white/5 pt-6 mt-auto">
              <div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-1">Pacotes</p>
                <p className="font-bold text-gray-300">0</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-1">Carrinho</p>
                <p className="font-bold text-gray-300">0</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-1">Operações</p>
                <p className="font-bold text-gray-300">0</p>
              </div>
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-rows-4 gap-4">
            <div className="bg-[#050505] border border-[#111] rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-emerald-500 group hover:border-[#222] transition-colors">
              <div>
                <h4 className="text-xs font-bold text-gray-300 mb-1">Lucro bruto</h4>
                <p className="text-[10px] text-gray-600">Soma de lucros</p>
              </div>
              <span className="font-bold font-mono text-gray-200">R$ 0,00</span>
            </div>

            <div className="bg-[#050505] border border-[#111] rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-blue-500 group hover:border-[#222] transition-colors">
              <div>
                <h4 className="text-xs font-bold text-gray-300 mb-1">Total depositado</h4>
                <p className="text-[10px] text-gray-600">Volume em entradas</p>
              </div>
              <span className="font-bold font-mono text-gray-200">R$ 0,00</span>
            </div>

            <div className="bg-[#050505] border border-[#111] rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-blue-500 group hover:border-[#222] transition-colors">
              <div>
                <h4 className="text-xs font-bold text-gray-300 mb-1">Total sacado</h4>
                <p className="text-[10px] text-gray-600">Volume em saídas</p>
              </div>
              <span className="font-bold font-mono text-gray-200">R$ 0,00</span>
            </div>

            <div className="bg-[#050505] border border-[#111] rounded-2xl p-5 flex items-center justify-between border-l-4 border-l-blue-500 group hover:border-[#222] transition-colors">
              <div>
                <h4 className="text-xs font-bold text-gray-300 mb-1">Taxa de acerto</h4>
                <p className="text-[10px] text-gray-600">Retornos positivos</p>
              </div>
              <span className="font-bold font-mono text-gray-200">0%</span>
            </div>
          </div>

        </div>

        {/* Middle Grid: Intelligence & Meta */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Inteligência da Operação */}
          <div className="bg-[#070a11] border border-[#162032] rounded-3xl p-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Activity size={14} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-200 text-sm">Inteligência da operação</h3>
                  <p className="text-[10px] text-gray-500">Análises sobre metas definidas</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded bg-white/5 border border-white/10 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Ao Vivo</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#030508] border border-[#111827] rounded-xl p-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-3">Tendência</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center">
                    <TrendingDown size={14} className="text-red-500" />
                  </div>
                  <span className="text-xs font-bold text-gray-300">Estável</span>
                </div>
              </div>

              <div className="bg-[#030508] border border-[#111827] rounded-xl p-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-3">Lucro Final Real</p>
                <p className="text-sm font-bold text-[#4ade80] mb-1">+R$ 0,00</p>
                <p className="text-[9px] text-gray-600">0 metas · Média: R$ 0,00/meta</p>
              </div>

              <div className="bg-[#030508] border border-[#111827] rounded-xl p-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-3">Alerta</p>
                <p className="text-xs font-medium text-gray-400">Sem alertas</p>
              </div>
            </div>
          </div>

          {/* Meta Global */}
          <div className="bg-[#070a11] border border-[#162032] rounded-3xl p-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Target size={14} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-200 text-sm">Meta global</h3>
                  <p className="text-[10px] text-gray-500">Objetivo R$ 100.000,00</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0f1a] border border-[#162032] hover:bg-[#0f172a] transition-colors text-xs font-medium text-gray-400">
                <Edit3 size={12} />
                Editar
              </button>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-extrabold text-[#4ade80]">0%</span>
                <span className="text-xs font-medium text-gray-500 mb-1.5">concluído</span>
              </div>
              <div className="w-full h-2 bg-[#0a0f1a] rounded-full overflow-hidden border border-[#162032]">
                <div className="h-full bg-[#4ade80] w-0"></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#030508] border border-[#111827] rounded-xl p-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-1">Atingido</p>
                <p className="text-xs font-bold text-[#4ade80]">R$ 0,00</p>
              </div>

              <div className="bg-[#030508] border border-[#111827] rounded-xl p-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-1">Falta</p>
                <p className="text-xs font-bold text-gray-300">R$ 100.000,00</p>
              </div>

              <div className="bg-[#030508] border border-[#111827] rounded-xl p-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-1">Previsão</p>
                <p className="text-xs font-bold text-gray-400">N/A</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Grid: Leitura & Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-200">Leitura da operação</h3>
              <div className="px-3 py-1 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] text-[10px] font-bold text-gray-400">
                Operação estabilizada
              </div>
            </div>
            <div className="bg-[#050505] border border-[#111] rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                <p className="text-xs text-gray-400">Operação estável em relação a semana anterior</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-200">Alertas e atenção</h3>
            <div className="bg-[#050505] border border-[#111] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-gray-500">Nenhum alerta no momento</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
