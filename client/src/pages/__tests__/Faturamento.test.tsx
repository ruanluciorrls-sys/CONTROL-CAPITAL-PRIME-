import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import Faturamento from "../Faturamento";

const graficos = vi.hoisted(() => ({ importar: vi.fn() }));

vi.mock("recharts", () => {
  graficos.importar();
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
    AreaChart: ({ data }: { data: { resultado: number }[] }) => (
      <div>Resultado no gráfico: {data[0]?.resultado}</div>
    ),
    BarChart: () => <div>Gráfico de comparação</div>,
    Area: () => null,
    Bar: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});
vi.mock("@/contexts/AppContext", () => ({
  useApp: () => ({
    state: {
      casas: [{ id: "casa", nome: "Exemplo", status: "finalizada" }],
      relatorios: [{
        id: "rel", casaId: "casa", agente: "Ana", status: "finalizado", cooperacao: 0,
        finalizadoEm: new Date().toISOString(),
        rows: [{ numero: 1, deposito: 100, redeposito: 0, saque: 135, bau: 0, resultado: 35 }],
      }],
    },
  }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({}),
    gastosProxy: { list: { useQuery: () => ({ data: [] }) } },
    receitas: {
      list: { useQuery: () => ({ data: [] }) },
      create: { useMutation: () => ({}) },
      update: { useMutation: () => ({}) },
      delete: { useMutation: () => ({}) },
    },
  },
}));

it("só carrega a biblioteca de gráficos na aba Evolução e passa os mesmos valores", async () => {
  render(<Faturamento />);
  expect(screen.getByRole("button", { name: "Visão Geral" })).toBeInTheDocument();
  expect(graficos.importar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Histórico" }));
  expect(graficos.importar).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Evolução" }));
  expect(await screen.findByText("Resultado no gráfico: 35")).toBeInTheDocument();
  expect(screen.getByText("Gráfico de comparação")).toBeInTheDocument();
  expect(graficos.importar).toHaveBeenCalledTimes(1);
});
