import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import SeletorJogos from "../SeletorJogos";

vi.mock("@/lib/trpc", () => ({ trpc: { slots: { list: { useQuery: () => ({ data: [] }) } } } }));

it("mostra adição manual antes das capas e usa a busca quando não encontra o jogo", () => {
  const onChange = vi.fn();
  render(<SeletorJogos value="" onChange={onChange} />);
  const busca = screen.getByRole("textbox", { name: "Pesquisar jogo" });
  fireEvent.change(busca, { target: { value: "Jogo de exemplo que não está no catálogo" } });
  const manual = screen.getByRole("button", { name: "Adicionar manualmente" });
  const vazio = screen.getByText(/Nenhum jogo encontrado/);
  expect(manual.compareDocumentPosition(vazio) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(manual);
  expect(onChange).toHaveBeenCalledWith("Jogo de exemplo que não está no catálogo");
});
