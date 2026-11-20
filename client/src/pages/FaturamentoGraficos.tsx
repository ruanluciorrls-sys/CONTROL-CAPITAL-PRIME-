import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

type PontoEvolucao = { label: string; lucro: number; prejuizo: number; resultado: number };
type PontoHistorico = { label: string; lucro: number };

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function GraficoResultado({ data }: { data: PontoEvolucao[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 18, right: 20, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="faturamentoResultado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d4a017" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#d4a017" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.055)" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(168,188,232,0.55)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "rgba(168,188,232,0.55)" }} axisLine={false} tickLine={false}
          tickFormatter={(value) => `R$${Number(value).toLocaleString("pt-BR", { notation: "compact" })}`}
        />
        <Tooltip
          contentStyle={{ background: "#070e20", border: "1px solid rgba(212,160,23,0.35)", borderRadius: 12, color: "#fff", fontSize: 12 }}
          formatter={(value: any) => [formatCurrency(Number(value)), "Resultado"]}
        />
        <Area type="monotone" dataKey="resultado" stroke="#d4a017" strokeWidth={2} fill="url(#faturamentoResultado)" dot={{ r: 3, fill: "#d4a017" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GraficoComparativo({ data }: { data: PontoEvolucao[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.055)" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(168,188,232,0.55)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "rgba(168,188,232,0.55)" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#070e20", border: "1px solid rgba(212,160,23,0.35)", borderRadius: 12, color: "#fff", fontSize: 12 }}
          formatter={(value: any, name: any) => [formatCurrency(Number(value)), name === "lucro" ? "Lucro" : "Prejuizo"]}
        />
        <Bar dataKey="lucro" radius={[6, 6, 0, 0]} fill="#4ade80" />
        <Bar dataKey="prejuizo" radius={[6, 6, 0, 0]} fill="#f87171" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoLucroHistorico({ data }: { data: PontoHistorico[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
  );
}
