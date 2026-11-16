import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { aplicarOrdemRelatorios, moverRelatorio } from "@/lib/ordemRelatorios";
import Relatorios from "../Relatorios";

const preferencias = vi.hoisted(() => ({ ordem: [] as string[], salvar: vi.fn() }));

vi.mock("@/contexts/AppContext", () => ({
  useApp: () => ({
    state: {
      casas: [{ id: "casa", nome: "Rede", status: "ativa" }],
      relatorios: ["Ana", "Bia", "Cris"].map((agente, index) => ({
        id: agente, agente, casaId: "casa", rows: [], cooperacao: 0, status: "ativo",
        criadoEm: `2026-11-0${index + 1}T00:00:00Z`,
      })),
    },
    ordemRelatorios: preferencias.ordem,
    salvandoOrdemRelatorios: false,
    reordenarRelatorios: preferencias.salvar,
  }),
}));

it("muda o cartao de posicao e le a ordem salva ao reabrir a tela", () => {
  preferencias.ordem = [];
  preferencias.salvar.mockImplementation(async ids => { preferencias.ordem = ids; return ids; });
  const tela = render(<Relatorios />);
  fireEvent.click(screen.getByRole("button", { name: "Organizar" }));
  expect(screen.getByRole("button", { name: "Mover para frente: Rede-Ana" })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "Mover para frente: Rede-Bia" }));
  expect(preferencias.salvar).toHaveBeenCalledWith(["Bia", "Ana", "Cris"]);
  tela.unmount();

  render(<Relatorios />);
  fireEvent.click(screen.getByRole("button", { name: "Organizar" }));
  expect(screen.getByRole("group", { name: "Posição de Rede-Bia" })).toHaveTextContent("1 de 3");
  expect(screen.getByRole("group", { name: "Posição de Rede-Ana" })).toHaveTextContent("2 de 3");
});

it("ignora IDs fora da lista e acrescenta novos cartoes depois da ordem salva", () => {
  const relatorios = ["a", "b", "novo"].map(id => ({ id }));
  expect(aplicarOrdemRelatorios(relatorios, ["removido", "b", "a"]).map(r => r.id)).toEqual(["b", "a", "novo"]);
  expect(moverRelatorio(["a", "b"], 0, 1)).toEqual(["b", "a"]);
  expect(moverRelatorio(["a", "b"], 1, 1)).toBeNull();
});
