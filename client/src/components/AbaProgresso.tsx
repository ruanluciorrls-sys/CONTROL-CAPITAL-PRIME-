import { ArrowRight } from "lucide-react";

interface AbaProgressoProps {
  meta: number;
  media: number;
  totalDeposito: number;
  totalSaque: number;
  totalBau: number;
  cooperacao: number;
  rows: Array<{ numero: number }>;
}

export default function AbaProgresso({
  meta,
  media,
  totalDeposito,
  totalSaque,
  totalBau,
  cooperacao,
  rows,
}: AbaProgressoProps) {
  const montanteTotal = meta * media;
  const percentualMontante = isNaN((totalDeposito / montanteTotal) * 100) ? 0 : (totalDeposito / montanteTotal) * 100;
  const percentualDEP = isNaN((rows.length / meta) * 100) ? 0 : (rows.length / meta) * 100;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Acompanhamento de Progresso</h2>

      {/* Card de Progresso do Montante */}
      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">Montante a Atingir</p>
            <p className="text-3xl font-bold text-green-600">
              R$ {totalDeposito.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              de R$ {isNaN(montanteTotal) ? '0.00' : montanteTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-green-600">{percentualMontante.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Completo</p>
          </div>
        </div>

        {/* Barra de Progresso Montante */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(percentualMontante, 100)}%`,
            }}
          ></div>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold">Total Depósito</p>
            <p className="text-lg font-bold text-blue-600 mt-1">
              R$ {totalDeposito.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold">Total Saque</p>
            <p className="text-lg font-bold text-red-600 mt-1">
              R$ {totalSaque.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold">Baú</p>
            <p className="text-lg font-bold text-purple-600 mt-1">
              R$ {totalBau.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Card de Progresso de DEPs */}
      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">DEPs Realizados</p>
            <p className="text-3xl font-bold text-blue-600">{rows.length}</p>
            <p className="text-xs text-muted-foreground mt-1">de {meta} DEPs necessários</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-blue-600">{percentualDEP.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Completo</p>
          </div>
        </div>

        {/* Barra de Progresso DEPs */}
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(percentualDEP, 100)}%`,
            }}
          ></div>
        </div>

        {/* Informações Adicionais */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold">Faltam</p>
            <p className="text-lg font-bold text-yellow-600 mt-1">{Math.max(0, meta - rows.length)}</p>
            <p className="text-xs text-muted-foreground mt-1">DEPs</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold">Cooperação</p>
            <p className="text-lg font-bold text-green-600 mt-1">
              R$ {cooperacao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Resumo Final */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-sm">
        <h3 className="text-lg font-bold mb-4">Resumo do Progresso</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ArrowRight size={16} />
              Montante Atingido
            </span>
            <span className="font-bold">{percentualMontante.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ArrowRight size={16} />
              DEPs Realizados
            </span>
            <span className="font-bold">{percentualDEP.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/20">
            <span className="flex items-center gap-2">
              <ArrowRight size={16} />
              Status Geral
            </span>
            <span className="font-bold">
              {percentualMontante >= 100 && percentualDEP >= 100 ? "✓ Completo" : "Em Andamento"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
