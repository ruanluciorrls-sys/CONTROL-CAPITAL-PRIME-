import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import AvisoRede from "../AvisoRede";

const mocks = vi.hoisted(() => ({
  avisos: vi.fn(),
  jogos: vi.fn(),
  publicar: vi.fn(),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({}),
    notasRede: {
      avisos: { useQuery: mocks.avisos },
      jogos: { useQuery: mocks.jogos },
      upsert: { useMutation: () => ({ mutate: mocks.publicar, isPending: false }) },
    },
  },
}));

const data = new Date("2026-11-19T20:30:00Z");
beforeEach(() => {
  vi.clearAllMocks();
  mocks.avisos.mockReturnValue({ data: [
    { id: "novo", texto: "Primeiro aviso", tom: "bom", atualizadoPor: "Ana", atualizadoEm: data },
    { id: "legado", texto: "Aviso legado", tom: "neutro", atualizadoPor: "Bruno", atualizadoEm: data },
  ] });
  mocks.jogos.mockReturnValue({
    isSuccess: true,
    data: [{ jogos: "", texto: "Observação sem jogos", autor: "Bruno", criadoEm: data }],
  });
});

it("abre uma nova contribuicao sem preencher com o aviso de outro operador", () => {
  render(<AvisoRede rede=" voy " />);
  expect(mocks.avisos).toHaveBeenCalledWith({ rede: "VOY" });
  expect(screen.getByText("Primeiro aviso")).toBeVisible();
  const historico = screen.getByText("Ver aviso anterior").closest("details")!;
  expect(within(historico).getByText("Aviso legado")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Novo aviso" }));
  const campo = screen.getByRole("textbox", { name: "Seu aviso" });
  expect(campo).toHaveValue("");
  expect(screen.getByRole("button", { name: "Publicar aviso" })).toBeDisabled();
  fireEvent.change(campo, { target: { value: "  Outra contribuição  " } });
  fireEvent.click(screen.getByRole("button", { name: "Publicar aviso" }));
  expect(mocks.publicar).toHaveBeenCalledWith(
    { rede: "VOY", texto: "Outra contribuição", tom: "neutro" },
    expect.any(Object),
  );
});

it("carrega jogos ao abrir e mostra observacao com autor e data sem paragrafo vazio", async () => {
  render(<AvisoRede rede="VOY" />);
  expect(mocks.jogos).toHaveBeenLastCalledWith({ rede: "VOY" }, { enabled: false });
  const resumo = screen.getByText("Jogos compartilhados da rede");
  fireEvent.click(resumo);
  await waitFor(() => expect(mocks.jogos).toHaveBeenLastCalledWith({ rede: "VOY" }, { enabled: true }));
  const detalhes = resumo.closest("details")!;
  expect(within(detalhes).getByText("Observação sem jogos")).toBeVisible();
  expect(within(detalhes).getByText(/Bruno/)).toBeVisible();
  expect(detalhes.querySelector("time")).toHaveAttribute("datetime", data.toISOString());
  expect(detalhes.querySelectorAll("p")).toHaveLength(2);
});
