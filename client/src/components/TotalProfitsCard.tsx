import { DollarSign } from "lucide-react";

interface TotalProfitsCardProps {
  value: number;
}

export default function TotalProfitsCard({ value }: TotalProfitsCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-lg p-8 text-white shadow-lg border border-primary/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-90 uppercase tracking-wide">
            Lucro Total Consolidado
          </p>
          <p className="text-5xl font-bold mt-3 font-mono">
            {value.toFixed(2)}
          </p>
          <p className="text-sm mt-2 opacity-75">
            Soma de todos os resultados
          </p>
        </div>
        <div className="p-3 bg-white/20 rounded-lg">
          <DollarSign size={32} />
        </div>
      </div>
    </div>
  );
}
