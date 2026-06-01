import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TrendChartProps {
  data: Array<{
    periodo: string;
    lucro: number;
    depositos: number;
    saques: number;
  }>;
  tipo?: "linha" | "barra";
  titulo?: string;
}

export default function TrendChart({ data, tipo = "linha", titulo = "Evolução de Lucro" }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border dark:border-slate-700 text-center">
        <p className="text-muted-foreground dark:text-slate-400">
          Sem dados disponíveis para exibir o gráfico
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border dark:border-slate-700">
      <h3 className="text-lg font-bold text-foreground dark:text-white mb-4">{titulo}</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        {tipo === "linha" ? (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis 
              dataKey="periodo" 
              stroke="#6b7280"
              className="dark:stroke-slate-400"
            />
            <YAxis 
              stroke="#6b7280"
              className="dark:stroke-slate-400"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="lucro" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6 }}
              name="Lucro"
            />
            <Line 
              type="monotone" 
              dataKey="depositos" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
              name="Depósitos"
            />
            <Line 
              type="monotone" 
              dataKey="saques" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: "#ef4444", r: 4 }}
              activeDot={{ r: 6 }}
              name="Saques"
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
            <XAxis 
              dataKey="periodo" 
              stroke="#6b7280"
              className="dark:stroke-slate-400"
            />
            <YAxis 
              stroke="#6b7280"
              className="dark:stroke-slate-400"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => `R$ ${value.toFixed(2)}`}
            />
            <Legend />
            <Bar dataKey="lucro" fill="#10b981" name="Lucro" />
            <Bar dataKey="depositos" fill="#3b82f6" name="Depósitos" />
            <Bar dataKey="saques" fill="#ef4444" name="Saques" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
