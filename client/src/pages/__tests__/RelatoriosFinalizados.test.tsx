import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CasaData, RelatorioData } from "@/lib/types";
import RelatoriosFinalizados from "../RelatoriosFinalizados";

const { state, deleteRelatorio, reutilizarRelatorio, restaurarCasa, updateRelatorio } = vi.hoisted(() => ({
  state: { casas: [] as CasaData[], relatorios: [] as RelatorioData[] },
  deleteRelatorio: vi.fn(),
  reutilizarRelatorio: vi.fn(),
  restaurarCasa: vi.fn(),
  updateRelatorio: vi.fn(),
}));

vi.mock("@/contexts/AppContext", () => ({
  useApp: () => ({ state, deleteRelatorio, reutilizarRelatorio, restaurarCasa, updateRelatorio }),
}));

const casaAurora: CasaData = {
  id: "aurora", nome: "Áurora Norte", login: "", senha: "", meta: 0, media: 0, prazo: "",
  linkCasa: "", linkContaFilha: "", status: "finalizada", criadoEm: "2026-01-01T12:00:00",
};
const casaBrisa: CasaData = { ...casaAurora, id: "brisa", nome: "Brisa Sul" };
const criarRelatorio = (dia: number, props: Partial<RelatorioData> = {}): RelatorioData => ({
  id: `relatorio-${dia}`, casaId: casaAurora.id, agente: `Agente ${dia}`, prazo: "2026-04-15",
  criadoEm: `2026-02-${String(dia).padStart(2, "0")}T12:00:00`, status: "finalizado",
  rows: [{ numero: 1, deposito: 50, redeposito: 10, saque: 90, bau: 0, resultado: 30 }], cooperacao: 10,
  ...props,
});

const lista = () => within(screen.getByRole("region", { name: "Lista de relatórios finalizados" }));
const abrirRelatorio = (name: RegExp) => fireEvent.click(lista().getByRole("button", { name }));

beforeEach(() => {
  vi.resetAllMocks();
  state.casas = [casaAurora, casaBrisa];
  state.relatorios = [];
});

describe("Relatórios Finalizados", () => {
  it("pagina os cartões, combina busca sem acentos com mês e nomenclatura e limpa os filtros", () => {
    state.relatorios = [
      criarRelatorio(1), criarRelatorio(2), criarRelatorio(3), criarRelatorio(4),
      criarRelatorio(5), criarRelatorio(6), criarRelatorio(7, { agente: "João", finalizadoEm: "2026-03-07T12:00:00" }),
      criarRelatorio(8, { casaId: casaBrisa.id, agente: "João", finalizadoEm: "2026-03-08T12:00:00" }),
      criarRelatorio(9, { status: "ativo" }),
    ];
    render(<RelatoriosFinalizados />);
    expect(lista().getAllByRole("listitem")).toHaveLength(6);
    expect(lista().getByRole("status")).toHaveTextContent("1 a 6 de 8");
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(lista().getByText("Página 2 de 2")).toBeInTheDocument();
    expect(lista().getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar relatórios" }), { target: { value: "JOAO" } });
    expect(lista().getAllByRole("listitem")).toHaveLength(2);
    expect(lista().getByRole("status")).toHaveTextContent("1 a 2 de 2");
    fireEvent.change(screen.getByRole("combobox", { name: "Mês" }), { target: { value: "2026-03" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Nomenclatura da casa" }), { target: { value: "ÁURORA" } });
    expect(lista().getAllByRole("listitem")).toHaveLength(1);
    expect(lista().getByRole("button", { name: /Áurora Norte.*João/i })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "aurora joao" } });
    expect(lista().getAllByRole("listitem")).toHaveLength(1);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "inexistente" } });
    expect(lista().getByText("Nenhum relatório encontrado com esses filtros.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(lista().getByRole("status")).toHaveTextContent("1 a 6 de 8");
    expect(screen.getByRole("combobox", { name: "Mês" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Nomenclatura da casa" })).toHaveValue("");
  });

  it("retorna à última página disponível se o único cartão da página for excluído", () => {
    state.relatorios = Array.from({ length: 7 }, (_, index) => criarRelatorio(index + 1));
    deleteRelatorio.mockImplementation((id: string) => {
      state.relatorios = state.relatorios.filter((relatorio) => relatorio.id !== id);
    });
    render(<RelatoriosFinalizados />);
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    abrirRelatorio(/Agente 1/);
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    expect(deleteRelatorio).toHaveBeenCalledWith("relatorio-1");
    expect(lista().getByRole("status")).toHaveTextContent("1 a 6 de 6");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
  });

  it("mantém a edição e a reutilização com opção de reativar a meta vinculada", () => {
    state.relatorios = [criarRelatorio(1)];
    render(<RelatoriosFinalizados />);
    abrirRelatorio(/Agente 1/);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Agente" }), { target: { value: "Maria" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(updateRelatorio).toHaveBeenCalledWith("relatorio-1", expect.objectContaining({ agente: "Maria" }));

    fireEvent.click(screen.getByRole("button", { name: "Reutilizar" }));
    const dialog = within(screen.getByRole("dialog", { name: "Reutilizar relatório" }));
    fireEvent.click(dialog.getByRole("button", { name: /sim.*reativar relatório e meta/i }));
    expect(reutilizarRelatorio).toHaveBeenCalledWith("relatorio-1");
    expect(restaurarCasa).toHaveBeenCalledWith(casaAurora.id);
  });

  it("contabiliza o reembolso concluído no cartão, no detalhe e no período, sem somar o pendente", () => {
    state.relatorios = [
      criarRelatorio(1, { reembolso: "concluido", valorReembolso: 60 }),
      criarRelatorio(2, { reembolso: "pendente", valorReembolso: 500 }),
    ];
    render(<RelatoriosFinalizados />);
    const concluido = within(lista().getByRole("button", { name: /Agente 1/ }));
    expect(concluido.getByText("R$ 100,00")).toBeInTheDocument();
    expect(concluido.getByText("Reembolso recebido: R$ 60,00")).toBeInTheDocument();
    const pendente = within(lista().getByRole("button", { name: /Agente 2/ }));
    expect(pendente.getByText("R$ 40,00")).toBeInTheDocument();
    expect(pendente.queryByText(/Reembolso recebido/)).not.toBeInTheDocument();
    expect(screen.getByText("R$ 140,00")).toBeInTheDocument();

    abrirRelatorio(/Agente 1/);
    expect(screen.getAllByText("R$ 100,00")).toHaveLength(2);
    expect(screen.getAllByText("Reembolso recebido: R$ 60,00")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Cooperação" }), { target: { value: "20" } });
    expect(screen.getByText("R$ 110,00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    fireEvent.click(screen.getByRole("button", { name: "Reutilizar" }));
    const dialog = within(screen.getByRole("dialog", { name: "Reutilizar relatório" }));
    expect(dialog.getByText(/voltará para Reembolso como pendente/)).toBeInTheDocument();
    fireEvent.click(dialog.getByRole("button", { name: /não.*só o relatório/i }));
    expect(reutilizarRelatorio).toHaveBeenCalledWith("relatorio-1");
    expect(restaurarCasa).not.toHaveBeenCalled();
    expect(updateRelatorio).not.toHaveBeenCalled();
  });
});
