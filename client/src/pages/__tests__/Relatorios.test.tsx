import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { aplicarOrdemRelatorios, moverRelatorio } from "@/lib/ordemRelatorios";
import { prazoDeRelatorio, progressoRecarga } from "@/lib/visaoRelatorios";
import Relatorios from "../Relatorios";

const preferencias = vi.hoisted(() => ({
  ordem: [] as string[], salvar: vi.fn(), comReembolso: false, registrar: vi.fn(), finalizar: vi.fn(),
}));

vi.mock("@/components/RelatorioSpreadsheet", () => ({
  default: ({ agente, ocultarValores }: { agente: string; ocultarValores?: boolean }) =>
    <div data-testid="planilha">{agente}: {ocultarValores ? "Valores ocultos" : "Planilha aberta"}</div>,
}));
vi.mock("@/components/SeletorJogos", () => ({
  default: ({ onChange }: { onChange: (jogos: string) => void }) =>
    <button type="button" onClick={() => onChange("Jogo de exemplo")}>Escolher jogo de exemplo</button>,
}));

vi.mock("@/contexts/AppContext", () => ({
  useApp: () => ({
    state: {
      casas: [
        { id: "casa", nome: "Rede", redeNome: "REDE", status: "ativa", meta: 10, media: 100 },
        { id: "recarga", nome: "Rede", status: "ativa", metaRecarga: 2000 },
      ],
      relatorios: ["Ana", "Bia", "Cris"].map((agente, index) => ({
        id: agente, agente, casaId: agente === "Bia" ? "recarga" : "casa",
        rows: agente === "Bia" ? [{ numero: 1, deposito: 1000, redeposito: 250, saque: 0, bau: 0, resultado: 0 }] : [],
        cooperacao: 0, status: "ativo",
        reembolso: preferencias.comReembolso && agente === "Ana" ? "pendente" : null,
        criadoEm: `2026-11-0${index + 1}T00:00:00Z`,
      })),
    },
    registrarReembolso: preferencias.registrar,
    finalizarRelatorioComJogos: preferencias.finalizar,
    ordemRelatorios: preferencias.ordem,
    salvandoOrdemRelatorios: false,
    reordenarRelatorios: preferencias.salvar,
  }),
}));

beforeEach(() => {
  sessionStorage.clear();
  preferencias.ordem = [];
  preferencias.salvar.mockClear();
  preferencias.registrar.mockReset();
  preferencias.finalizar.mockReset();
  preferencias.comReembolso = false;
});

it("mantém a confirmação do baú e envia só o jogo e a observação marcados para compartilhar", async () => {
  preferencias.finalizar.mockResolvedValue(true);
  render(<Relatorios />);
  fireEvent.click(screen.getByRole("button", { name: "Abrir Rede-Ana" }));
  fireEvent.click(screen.getByRole("button", { name: /Finalizar Relatório/ }));
  const finalizar = screen.getByRole("button", { name: /só o relatório/i });
  expect(finalizar).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Escolher jogo de exemplo" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Observação pública da plataforma" }), { target: { value: "Bom hoje" } });
  fireEvent.click(screen.getByRole("button", { name: /já sacou o baú/i }));
  fireEvent.click(finalizar);
  await waitFor(() => expect(preferencias.finalizar).toHaveBeenCalledWith("Ana", "Jogo de exemplo", { texto: "Bom hoje" }, false));
});

it("exibe o salvamento, impede cliques repetidos e permite tentar de novo sem perder os jogos", async () => {
  let responder!: (ok: boolean) => void;
  preferencias.finalizar.mockReturnValueOnce(new Promise<boolean>(resolve => { responder = resolve; })).mockResolvedValueOnce(true);
  render(<Relatorios />);
  fireEvent.click(screen.getByRole("button", { name: "Abrir Rede-Ana" }));
  fireEvent.click(screen.getByRole("button", { name: /Finalizar Relatório/ }));
  const dialogo = within(screen.getByRole("dialog", { name: "Finalizar Relatório" }));
  fireEvent.click(dialogo.getByRole("button", { name: "Escolher jogo de exemplo" }));
  fireEvent.click(dialogo.getByRole("button", { name: /já sacou o baú/i }));
  const finalizar = dialogo.getByRole("button", { name: /finalizar relatório e meta/i });
  fireEvent.click(finalizar);
  expect(dialogo.getByRole("status")).toHaveTextContent("Salvando finalização...");
  expect(finalizar).toBeDisabled();
  fireEvent.click(finalizar);
  expect(preferencias.finalizar).toHaveBeenCalledTimes(1);
  responder(false);
  await waitFor(() => expect(finalizar).toBeEnabled());
  fireEvent.click(finalizar);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(preferencias.finalizar.mock.calls).toEqual([
    ["Ana", "Jogo de exemplo", { texto: "" }, true], ["Ana", "Jogo de exemplo", { texto: "" }, true],
  ]);
});

it("edita e finaliza na aba de reembolso, com resultado previsto e confirmação", async () => {
  preferencias.comReembolso = true;
  preferencias.registrar.mockResolvedValue(true);
  render(<Relatorios />);
  expect(screen.queryByRole("button", { name: /Progresso|Processo/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Reembolso \(1\)/ }));
  fireEvent.click(await screen.findByRole("button", { name: "Editar reembolso" }));
  expect(screen.getByTestId("planilha")).toHaveTextContent("Ana: Planilha aberta");
  const editor = screen.getByRole("region", { name: "Editar reembolso" });
  fireEvent.change(within(editor).getByRole("textbox", { name: "Valor recebido (R$)" }), { target: { value: "100,25" } });
  expect(within(editor).getByText(/R\$\s*100,25/)).toBeInTheDocument();
  fireEvent.click(within(editor).getByRole("button", { name: "Salvar reembolso" }));
  await waitFor(() => expect(preferencias.registrar).toHaveBeenCalledWith("Ana", 100.25, false));
  await waitFor(() => expect(within(editor).getByRole("button", { name: "Finalizar reembolso e meta" })).toBeEnabled());
  fireEvent.click(within(editor).getByRole("button", { name: "Finalizar reembolso e meta" }));
  expect(preferencias.registrar).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Finalizar", exact: true }));
  await waitFor(() => expect(preferencias.registrar).toHaveBeenCalledWith("Ana", 100.25, true));
  expect(await screen.findByText("Nenhum reembolso concluído ainda.")).toBeInTheDocument();
});

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

it("filtra e compacta sem gravar uma ordem diferente", () => {
  preferencias.ordem = ["Cris", "Bia", "Ana"];
  render(<Relatorios />);
  const lista = () => screen.getAllByRole("article").map(card => card.getAttribute("aria-label"));
  expect(lista()).toEqual(["Rede-Cris", "Rede-Bia", "Rede-Ana"]);
  fireEvent.change(screen.getByRole("combobox", { name: "Tipo de operação" }), { target: { value: "recarga" } });
  expect(lista()).toEqual(["Rede-Bia"]);
  expect(screen.queryByRole("button", { name: "Organizar" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Selecionar vários" }));
  fireEvent.click(screen.getByRole("button", { name: "Marcar visíveis" }));
  expect(screen.getByText("1 selecionado(s)")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
  fireEvent.click(screen.getByRole("button", { name: "Modo compacto" }));
  expect(lista()).toEqual(["Rede-Cris", "Rede-Bia", "Rede-Ana"]);
  expect(screen.queryByText("Montante a atingir")).not.toBeInTheDocument();
  expect(preferencias.salvar).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar casa ou agente" }), { target: { value: "  bíA  " } });
  expect(lista()).toEqual(["Rede-Bia"]);
});

it("mostra o resumo em leitura, oculta valores e reabre o ultimo relatorio", () => {
  const tela = render(<Relatorios />);
  const recarga = screen.getByRole("article", { name: "Rede-Bia" });
  expect(within(recarga).getByText(/faltam R\$\s*750,00/)).toBeInTheDocument();
  fireEvent.click(within(recarga).getByRole("button", { name: "Ver resumo de Rede-Bia" }));
  expect(within(screen.getByRole("dialog")).getByText(/Resumo sem editar/)).toBeInTheDocument();
  expect(screen.queryByTestId("planilha")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Fechar resumo" }));
  fireEvent.click(screen.getByRole("button", { name: "Abrir Rede-Bia" }));
  expect(within(recarga).getByText("Em edição")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ocultar valores" }));
  expect(within(recarga).getByText("Valor oculto")).toBeInTheDocument();
  expect(screen.getByTestId("planilha")).toHaveTextContent("Bia: Valores ocultos");
  tela.unmount();
  render(<Relatorios />);
  fireEvent.click(screen.getByRole("button", { name: "Último relatório" }));
  expect(screen.getByTestId("planilha")).toHaveTextContent("Bia: Planilha aberta");
});

it("usa dias de calendario para o prazo e mantem a regra do total da recarga", () => {
  const agora = new Date(2026, 10, 17, 23);
  expect(prazoDeRelatorio("2026-11-16", agora)).toBe("atrasado");
  expect(prazoDeRelatorio("2026-11-17", agora)).toBe("hoje");
  expect(prazoDeRelatorio("2026-11-18", agora)).toBe("amanha");
  expect(prazoDeRelatorio("2026-02-30", agora)).toBe("sem-prazo");
  expect(progressoRecarga([{ numero: 1, deposito: 1500, redeposito: 600, saque: 150, bau: 0, resultado: 0 }], 2000))
    .toEqual({ realizado: 2100, falta: 0, percentual: 100 });
});

it("mantem as acoes no menu compacto do celular", () => {
  render(<Relatorios />);
  fireEvent.keyDown(screen.getByRole("button", { name: "Mais ações de Rede-Ana" }), { key: "Enter" });
  const menu = screen.getByRole("menu");
  for (const name of ["Ver resumo", "Etiqueta", "Duplicar", "Mover para Reembolso", "Lixeira"]) {
    expect(within(menu).getByRole("menuitem", { name: new RegExp(name) })).toBeInTheDocument();
  }
  fireEvent.click(within(menu).getByRole("menuitem", { name: "Ver resumo" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.queryByTestId("planilha")).not.toBeInTheDocument();
});
