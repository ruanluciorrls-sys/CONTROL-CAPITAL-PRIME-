import { useState, useEffect } from "react";

interface Plataforma {
  id: string;
  nome: string;
  diasPrazo: number;
  dia: string;
}

const diasSemana = [
  "SEGUNDA-FEIRA",
  "TERÇA-FEIRA",
  "QUARTA-FEIRA",
  "QUINTA-FEIRA",
  "SEXTA-FEIRA",
  "SÁBADO",
  "DOMINGO",
];

const plataformasInicial: Plataforma[] = [
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

// Cores para cada plataforma (Design Elegante/Translucido)
const coresPorPlataforma: { [key: string]: string } = {
  WE: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50",
  "777CLUBE": "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50",
  EK: "bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-400 hover:bg-pink-500/20 hover:border-pink-500/50",
  VOY: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50",
  "888": "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50",
  MANGA: "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50",
  ANJO: "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50",
  GAME: "bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50",
  "91": "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50",
  OKOK: "bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400 hover:bg-teal-500/20 hover:border-teal-500/50",
  A8: "bg-lime-500/10 border-lime-500/30 text-lime-700 dark:text-lime-400 hover:bg-lime-500/20 hover:border-lime-500/50",
  DY: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-500/20 hover:border-green-500/50",
  MK: "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/50",
  WP: "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-400 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/50",
  W1: "bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/50",
  DZ: "bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-400 hover:bg-slate-500/20 hover:border-slate-500/50",
};

interface DashboardCalendarProps {
  plataformas?: Plataforma[];
}

export default function DashboardCalendar({ plataformas: plataformasProp }: DashboardCalendarProps) {
  const lerPlataformas = (): Plataforma[] => {
    try {
      const saved = localStorage.getItem("plataformas-calendario-v2");
      if (saved) return JSON.parse(saved);
    } catch {}
    return plataformasInicial;
  };

  const [plataformas, setPlataformas] = useState<Plataforma[]>(plataformasProp || lerPlataformas);

  useEffect(() => {
    if (plataformasProp) {
      setPlataformas(plataformasProp);
    }
  }, [plataformasProp]);

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

  const plataformasPorDia = diasSemana.map((dia) => ({
    dia,
    plataformas: plataformas.filter((p) => p.dia === dia),
  }));

  const getCorPlataforma = (nome: string): string => {
    return coresPorPlataforma[nome] || "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted";
  };

  // Cor por dia da semana (combina com o resto do dashboard)
  const COR_DIA: Record<string, string> = {
    "SEGUNDA-FEIRA": "#60a5fa", "TERÇA-FEIRA": "#34d399", "QUARTA-FEIRA": "#a78bfa",
    "QUINTA-FEIRA": "#f59e0b", "SEXTA-FEIRA": "#f87171", "SÁBADO": "#fb923c", "DOMINGO": "#e879f9",
  };
  const diasJS = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];
  const hojeDia = diasJS[new Date().getDay()];

  return (
    <div className="relative mt-8 overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      style={{ background: "linear-gradient(145deg, rgba(7,14,32,0.92), rgba(12,21,36,0.85))" }}
    >
      {/* Linha multicolor no topo */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 via-rose-400 to-fuchsia-400" />

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10"
          style={{ background: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(245,158,11,0.05))", color: "#d4a017", boxShadow: "0 0 10px rgba(212,160,23,0.2)" }}
        >
          📅
        </div>
        <div>
          <h2 className="text-base font-black text-white">Calendário de Casas</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/35">Lançamentos da semana</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plataformasPorDia.map((dia) => {
          const cor = COR_DIA[dia.dia] || "#d4a017";
          const isHoje = dia.dia === hojeDia;
          return (
            <div
              key={dia.dia}
              className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: isHoje ? `linear-gradient(145deg, ${cor}14, rgba(255,255,255,0.02))` : "rgba(255,255,255,0.022)",
                borderColor: isHoje ? `${cor}66` : "rgba(255,255,255,0.08)",
                boxShadow: isHoje ? `0 12px 34px ${cor}1f` : "none",
              }}
            >
              {/* Acento de cor no topo */}
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(to right, transparent, ${cor}, transparent)`, opacity: isHoje ? 1 : 0.4 }} />

              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-black tracking-widest" style={{ color: cor }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
                  {dia.dia}
                </h3>
                {isHoje && (
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                    style={{ background: `${cor}22`, color: cor, border: `1px solid ${cor}55` }}
                  >
                    Hoje
                  </span>
                )}
              </div>

              {dia.plataformas.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {dia.plataformas.map((plat) => (
                    <div
                      key={plat.id}
                      className={`${getCorPlataforma(plat.nome)} flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg`}
                    >
                      <span className="tracking-wide">{plat.nome}</span>
                      <span className="rounded-full bg-background/30 px-2 py-0.5 opacity-90">
                        {plat.diasPrazo}d
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-white/25">Nenhuma casa agendada</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
