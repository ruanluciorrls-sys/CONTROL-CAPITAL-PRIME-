import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "./AppContext";

const api = vi.hoisted(() => ({
  relatorios: { data: [{ id: "r", casaId: "c", status: "ativo", rows: [] }], refetch: vi.fn() },
  casas: { data: [{ id: "c", status: "ativa" }], refetch: vi.fn() },
  gravar: vi.fn(), gravarCasa: vi.fn(), relCache: vi.fn(), casaCache: vi.fn(), invalidarFeed: vi.fn(),
}));

vi.mock("@/lib/trpc", () => {
  const semMutation = { useMutation: () => ({ mutateAsync: vi.fn() }) };
  return { trpc: {
    casas: { list: { useQuery: () => api.casas }, create: semMutation, update: { useMutation: () => ({ mutateAsync: api.gravarCasa }) }, delete: semMutation },
    relatorios: {
      list: { useQuery: () => api.relatorios }, ordem: { useQuery: () => ({}) }, reordenar: semMutation,
      create: semMutation, update: { useMutation: () => ({ mutateAsync: api.gravar }) }, delete: semMutation,
    },
    settings: { get: { useQuery: () => ({}) }, update: semMutation },
    useUtils: () => ({
      casas: { list: { cancel: vi.fn(), setData: api.casaCache } },
      relatorios: { list: { cancel: vi.fn(), setData: api.relCache } },
      notasRede: { invalidate: api.invalidarFeed },
    }),
  } };
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

it("atualiza relatorio e meta confirmados sem pedir listas inteiras nem gravar duas vezes", async () => {
  const data = new Date("2026-11-20T14:00:00Z");
  const resposta = { success: true, finalizacao: { casaId: "c", finalizadoEm: data, atualizadoEm: data, dataFimMeta: "2026-11-20" } };
  let confirmar!: (valor: typeof resposta) => void;
  api.gravar.mockReturnValueOnce(new Promise(resolve => { confirmar = resolve; }));
  const { result } = renderHook(useApp, { wrapper: AppProvider });
  await waitFor(() => expect(result.current.state.relatorios[0]?.status).toBe("ativo"));

  let salvamento!: Promise<boolean>;
  act(() => { salvamento = result.current.finalizarRelatorioComJogos("r", "Jogo", { texto: "" }, true); });
  await waitFor(() => expect(api.gravar).toHaveBeenCalledWith({
    id: "r", status: "finalizado", jogos: "Jogo", compartilharJogos: { texto: "" }, finalizarMeta: true,
  }));
  expect(result.current.state.relatorios[0].status).toBe("ativo");
  expect(result.current.state.casas[0].status).toBe("ativa");

  await act(async () => {
    confirmar(resposta);
    await expect(salvamento).resolves.toBe(true);
  });
  expect(result.current.state.relatorios[0]).toMatchObject({ status: "finalizado", jogos: "Jogo", finalizadoEm: data.toISOString() });
  expect(result.current.state.casas[0]).toMatchObject({ status: "finalizada", dataFim: "2026-11-20" });
  expect(api.relCache.mock.calls[0][1](api.relatorios.data)[0]).toMatchObject({ status: "finalizado", finalizadoEm: data });
  expect(api.casaCache.mock.calls[0][1](api.casas.data)[0]).toMatchObject({ status: "finalizada", dataFim: "2026-11-20" });
  expect(api.invalidarFeed).toHaveBeenCalledTimes(1);
  expect(api.gravarCasa).not.toHaveBeenCalled();
  expect(api.relatorios.refetch).not.toHaveBeenCalled();
  expect(api.casas.refetch).not.toHaveBeenCalled();
});
