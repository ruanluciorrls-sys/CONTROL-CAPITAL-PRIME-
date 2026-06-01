import { useState } from "react";

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

// Cores para cada plataforma
const coresPorPlataforma: { [key: string]: string } = {
  WE: "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700",
  "777CLUBE": "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700",
  EK: "bg-pink-100 dark:bg-pink-900 border-pink-300 dark:border-pink-700",
  VOY: "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700",
  "888": "bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700",
  MANGA: "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700",
  ANJO: "bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700",
  GAME: "bg-cyan-100 dark:bg-cyan-900 border-cyan-300 dark:border-cyan-700",
  "91": "bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700",
  OKOK: "bg-teal-100 dark:bg-teal-900 border-teal-300 dark:border-teal-700",
  A8: "bg-lime-100 dark:bg-lime-900 border-lime-300 dark:border-lime-700",
  DY: "bg-emerald-100 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-700",
  MK: "bg-violet-100 dark:bg-violet-900 border-violet-300 dark:border-violet-700",
  WP: "bg-fuchsia-100 dark:bg-fuchsia-900 border-fuchsia-300 dark:border-fuchsia-700",
  W1: "bg-sky-100 dark:bg-sky-900 border-sky-300 dark:border-sky-700",
  DZ: "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700",
};

export default function DashboardCalendar() {
  const [plataformas] = useState<Plataforma[]>(plataformasInicial);

  const plataformasPorDia = diasSemana.map((dia) => ({
    dia,
    plataformas: plataformas.filter((p) => p.dia === dia),
  }));

  const getCorPlataforma = (nome: string): string => {
    return coresPorPlataforma[nome] || "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700";
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">📅 Calendário de Casas</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plataformasPorDia.map((dia) => (
          <div
            key={dia.dia}
            className="bg-card dark:bg-slate-800 rounded-lg border border-border p-4"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">{dia.dia}</h3>
            
            {dia.plataformas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {dia.plataformas.map((plat) => (
                  <div
                    key={plat.id}
                    className={`${getCorPlataforma(plat.nome)} border-2 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-all hover:shadow-md cursor-pointer`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{plat.nome}</span>
                      <span className="text-xs bg-foreground/20 rounded-full px-2 py-0.5">
                        {plat.diasPrazo}d
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma casa agendada</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
