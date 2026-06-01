import { RelatorioData } from "@/lib/types";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import TrendChart from "./TrendChart";

interface RelatoriosPeriodosProps {
  relatorios: RelatorioData[];
}

export default function RelatoriosPeriodicos({ relatorios }: RelatoriosPeriodosProps) {
  const [periodo, setPeriodo] = useState<"semanal" | "mensal" | "anual">("semanal");
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string | null>(null);

  // Gerar lista de períodos disponíveis
  const gerarPeriodos = () => {
    const periodos: { id: string; label: string; dataInicio: Date; dataFim: Date }[] = [];
    const hoje = new Date();

    if (periodo === "semanal") {
      // Últimas 12 semanas
      for (let i = 11; i >= 0; i--) {
        const dataFim = new Date(hoje);
        dataFim.setDate(dataFim.getDate() - i * 7);
        const dataInicio = new Date(dataFim);
        dataInicio.setDate(dataInicio.getDate() - 6);

        const id = `semana-${i}`;
        const label = `${dataInicio.toLocaleDateString("pt-BR")} a ${dataFim.toLocaleDateString("pt-BR")}`;
        periodos.push({ id, label, dataInicio, dataFim });
      }
    } else if (periodo === "mensal") {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const id = `mes-${data.getFullYear()}-${data.getMonth()}`;
        const label = data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

        const dataInicio = new Date(data.getFullYear(), data.getMonth(), 1);
        const dataFim = new Date(data.getFullYear(), data.getMonth() + 1, 0);

        periodos.push({ id, label, dataInicio, dataFim });
      }
    } else {
      // Últimos 5 anos
      for (let i = 4; i >= 0; i--) {
        const ano = hoje.getFullYear() - i;
        const id = `ano-${ano}`;
        const label = `${ano}`;
        const dataInicio = new Date(ano, 0, 1);
        const dataFim = new Date(ano, 11, 31);

        periodos.push({ id, label, dataInicio, dataFim });
      }
    }

    return periodos;
  };

  const periodos = gerarPeriodos();
  const periodosDisponiveis = periodos.filter((p) =>
    relatorios.some((rel) => {
      const dataCriacao = new Date(rel.criadoEm);
      return dataCriacao >= p.dataInicio && dataCriacao <= p.dataFim;
    })
  );

  // Selecionar primeiro período com dados automaticamente
  const periodoCom = periodosDisponiveis.length > 0 ? periodosDisponiveis[0] : null;
  const periodoAtivo = periodoSelecionado
    ? periodos.find((p) => p.id === periodoSelecionado)
    : periodoCom;

  const relatoriosFiltrados = periodoAtivo
    ? relatorios.filter((rel) => {
        const dataCriacao = new Date(rel.criadoEm);
        return rel.status !== "lixeira" && dataCriacao >= periodoAtivo.dataInicio && dataCriacao <= periodoAtivo.dataFim;
      })
    : [];

  const calcularTotais = () => {
    let totalLucro = 0;
    let totalRelatorios = 0;
    let totalCasas = new Set<string>();

    relatoriosFiltrados.forEach((rel) => {
      totalRelatorios++;
      totalCasas.add(rel.casaId);
      const resultadoTotal = rel.rows.reduce((sum, row) => {
        const resultado = Number(row.resultado || 0);
        return sum + (isNaN(resultado) ? 0 : resultado);
      }, 0);
      const cooperacao = Number(rel.cooperacao || 0);
      const cooperacaoValid = isNaN(cooperacao) ? 0 : cooperacao;
      const lucro = resultadoTotal + cooperacaoValid;
      totalLucro += lucro;
    });

    return {
      totalLucro,
      totalRelatorios,
      totalCasas: totalCasas.size,
      mediaLucro: totalRelatorios > 0 ? totalLucro / totalRelatorios : 0,
    };
  };

  const totais = calcularTotais();

  // Gerar dados para o gráfico de tendências
  const gerarDadosGrafico = () => {
    const dados: Array<{ periodo: string; lucro: number; depositos: number; saques: number }> = [];
    
    if (periodo === "semanal") {
      for (let i = 11; i >= 0; i--) {
        const dataFim = new Date();
        dataFim.setDate(dataFim.getDate() - i * 7);
        const dataInicio = new Date(dataFim);
        dataInicio.setDate(dataInicio.getDate() - 6);
        
        const relatoriosSemana = relatorios.filter((rel) => {
          const dataCriacao = new Date(rel.criadoEm);
          return dataCriacao >= dataInicio && dataCriacao <= dataFim;
        });
        
        let lucro = 0;
        let depositos = 0;
        let saques = 0;
        
        relatoriosSemana.forEach((rel) => {
          const resultadoTotal = rel.rows.reduce((sum, row) => sum + (row.resultado || 0), 0);
          const cooperacao = typeof rel.cooperacao === "number" ? rel.cooperacao : 0;
          lucro += resultadoTotal + cooperacao;
          depositos += rel.rows.reduce((sum, row) => sum + (row.deposito || 0) + (row.redeposito || 0), 0);
          saques += rel.rows.reduce((sum, row) => sum + (row.saque || 0), 0);
        });
        
        dados.push({
          periodo: `Sem ${12 - i}`,
          lucro: parseFloat(lucro.toFixed(2)),
          depositos: parseFloat(depositos.toFixed(2)),
          saques: parseFloat(saques.toFixed(2)),
        });
      }
    } else if (periodo === "mensal") {
      const hoje = new Date();
      for (let i = 11; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const dataInicio = new Date(data.getFullYear(), data.getMonth(), 1);
        const dataFim = new Date(data.getFullYear(), data.getMonth() + 1, 0);
        
        const relatoriosMes = relatorios.filter((rel) => {
          const dataCriacao = new Date(rel.criadoEm);
          return dataCriacao >= dataInicio && dataCriacao <= dataFim;
        });
        
        let lucro = 0;
        let depositos = 0;
        let saques = 0;
        
        relatoriosMes.forEach((rel) => {
          lucro += rel.rows.reduce((sum, row) => sum + row.resultado, 0) + rel.cooperacao;
          depositos += rel.rows.reduce((sum, row) => sum + (row.deposito || 0) + (row.redeposito || 0), 0);
          saques += rel.rows.reduce((sum, row) => sum + row.saque, 0);
        });
        
        dados.push({
          periodo: data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
          lucro: parseFloat(lucro.toFixed(2)),
          depositos: parseFloat(depositos.toFixed(2)),
          saques: parseFloat(saques.toFixed(2)),
        });
      }
    } else {
      const hoje = new Date();
      for (let i = 4; i >= 0; i--) {
        const ano = hoje.getFullYear() - i;
        const dataInicio = new Date(ano, 0, 1);
        const dataFim = new Date(ano, 11, 31);
        
        const relatoriosAno = relatorios.filter((rel) => {
          const dataCriacao = new Date(rel.criadoEm);
          return dataCriacao >= dataInicio && dataCriacao <= dataFim;
        });
        
        let lucro = 0;
        let depositos = 0;
        let saques = 0;
        
        relatoriosAno.forEach((rel) => {
          lucro += rel.rows.reduce((sum, row) => sum + row.resultado, 0) + rel.cooperacao;
          depositos += rel.rows.reduce((sum, row) => sum + (row.deposito || 0) + (row.redeposito || 0), 0);
          saques += rel.rows.reduce((sum, row) => sum + row.saque, 0);
        });
        
        dados.push({
          periodo: `${ano}`,
          lucro: parseFloat(lucro.toFixed(2)),
          depositos: parseFloat(depositos.toFixed(2)),
          saques: parseFloat(saques.toFixed(2)),
        });
      }
    }
    
    return dados;
  };

  const dadosGrafico = gerarDadosGrafico();

  return (
    <div className="space-y-4">
      {/* Seletor de Tipo de Período */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setPeriodo("semanal");
            setPeriodoSelecionado(null);
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            periodo === "semanal"
              ? "bg-primary text-white"
              : "bg-secondary dark:bg-slate-700 text-foreground hover:bg-secondary/80 dark:hover:bg-slate-600"
          }`}
        >
          Semanal
        </button>
        <button
          onClick={() => {
            setPeriodo("mensal");
            setPeriodoSelecionado(null);
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            periodo === "mensal"
              ? "bg-primary text-white"
              : "bg-secondary dark:bg-slate-700 text-foreground hover:bg-secondary/80 dark:hover:bg-slate-600"
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => {
            setPeriodo("anual");
            setPeriodoSelecionado(null);
          }}
          className={`px-4 py-2 rounded-lg transition-colors ${
            periodo === "anual"
              ? "bg-primary text-white"
              : "bg-secondary dark:bg-slate-700 text-foreground hover:bg-secondary/80 dark:hover:bg-slate-600"
          }`}
        >
          Anual
        </button>
      </div>

      {/* Lista de Períodos Disponíveis */}
      {periodosDisponiveis.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-border">
          <p className="text-sm font-semibold text-foreground mb-3">
            Selecione o {periodo === "semanal" ? "período" : periodo === "mensal" ? "mês" : "ano"}:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {periodosDisponiveis.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodoSelecionado(p.id)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors border ${
                  periodoAtivo?.id === p.id
                    ? "bg-primary text-white border-primary"
                    : "bg-secondary dark:bg-slate-700 text-foreground border-border hover:bg-secondary/80 dark:hover:bg-slate-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico de Tendências */}
      <TrendChart 
        data={dadosGrafico} 
        tipo="linha"
        titulo={`Evolução de Lucro - ${periodo === "semanal" ? "Últimas 12 Semanas" : periodo === "mensal" ? "Últimos 12 Meses" : "Últimos 5 Anos"}`}
      />

      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total de Lucro</p>
          <p className="text-2xl font-bold text-primary">
            R$ {(totais.totalLucro || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Relatórios</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totais.totalRelatorios}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Casas Ativas</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totais.totalCasas}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Média por Relatório</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            R$ {(totais.mediaLucro || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Lista de Relatórios */}
      {relatoriosFiltrados.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-border">
          <h4 className="font-semibold text-foreground mb-3">
            Relatórios do Período
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {relatoriosFiltrados.map((rel) => (
              <div
                key={rel.id}
                className="p-3 bg-secondary dark:bg-slate-700 rounded-lg border border-border text-sm"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-foreground">{rel.agente}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(rel.criadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className="font-bold text-primary">
                    R$ {(rel.rows.reduce((sum, r) => {
                      const resultado = Number(r.resultado || 0);
                      return sum + (isNaN(resultado) ? 0 : resultado);
                    }, 0) + (isNaN(Number(rel.cooperacao)) ? 0 : Number(rel.cooperacao))).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            Nenhum relatório neste período
          </p>
        </div>
      )}
    </div>
  );
}
