import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CasaData, RelatorioData } from "@/lib/types";
import CasasFinalizadas from "../CasasFinalizadas";

const { state, updateCasa, deletePermanentementeCasa, esvaziarLixeiraCasas, confirm } = vi.hoisted(() => ({
  state: { casas: [] as CasaData[], relatorios: [] as RelatorioData[] },
  updateCasa: vi.fn(),
  deletePermanentementeCasa: vi.fn(),
  esvaziarLixeiraCasas: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("@/contexts/AppContext", () => ({
  useApp: () => ({ state, updateCasa, deletePermanentementeCasa, esvaziarLixeiraCasas }),
}));
vi.mock("@/lib/trpc", () => ({ trpc: { gastosProxy: { list: { useQuery: () => ({ data: [] }) } } } }));
vi.mock("@/hooks/useConfirm", () => ({ useConfirm: () => ({ confirm, confirmEl: null }) }));

const casaFinalizada: CasaData = {
  id: "casa-finalizada", nome: "Casa Norte", login: "login", senha: "senha", meta: 10, media: 0,
  prazo: "", linkCasa: "", linkContaFilha: "https://example.com/antigo", status: "finalizada",
  criadoEm: "2026-01-01T12:00:00", dataFim: "2026-02-15T12:00:00",
};
const casaLixeira: CasaData = { ...casaFinalizada, id: "casa-lixeira", nome: "Casa Sul", status: "lixeira" };

beforeEach(() => {
  vi.resetAllMocks();
  state.casas = [casaFinalizada, casaLixeira];
  state.relatorios = [];
  updateCasa.mockResolvedValue(true);
  confirm.mockResolvedValue(true);
});

describe("Casas Finalizadas", () => {
  it("salva e limpa o link da conta-filha via updateCasa, sem reativar a casa", async () => {
    updateCasa.mockImplementation(async (id: string, updates: Partial<CasaData>) => {
      state.casas = state.casas.map((casa) => casa.id === id ? { ...casa, ...updates } : casa);
      return true;
    });
    render(<CasasFinalizadas />);
    expect(screen.getByRole("link", { name: "Abrir conta-filha" })).toHaveAttribute("href", casaFinalizada.linkContaFilha);
    fireEvent.click(screen.getByRole("button", { name: "Editar casa" }));
    const link = screen.getByRole("textbox", { name: "Link da conta-filha" });
    expect(link).toHaveValue(casaFinalizada.linkContaFilha);
    fireEvent.change(link, { target: { value: "https://example.com/novo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Abrir conta-filha" })).toHaveAttribute("href", "https://example.com/novo"));
    expect(updateCasa).toHaveBeenLastCalledWith(casaFinalizada.id, expect.objectContaining({ linkContaFilha: "https://example.com/novo" }));
    expect(updateCasa.mock.lastCall?.[1]).not.toHaveProperty("status");

    fireEvent.click(screen.getByRole("button", { name: "Editar casa" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Link da conta-filha" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(screen.queryByRole("link", { name: "Abrir conta-filha" })).not.toBeInTheDocument());
    expect(updateCasa).toHaveBeenLastCalledWith(casaFinalizada.id, expect.objectContaining({ linkContaFilha: "" }));
  });

  it("rejeita link inseguro e mantém o editor aberto quando o salvamento falha", async () => {
    updateCasa.mockResolvedValue(false);
    render(<CasasFinalizadas />);
    fireEvent.click(screen.getByRole("button", { name: "Editar casa" }));
    const link = screen.getByRole("textbox", { name: "Link da conta-filha" });
    fireEvent.change(link, { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(updateCasa).not.toHaveBeenCalled();

    fireEvent.change(link, { target: { value: "https://example.com/novo" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(updateCasa).toHaveBeenCalledTimes(1));
    expect(link).toBeInTheDocument();
  });

  it("não oferece reativação nem recuperação, mas permite editar e excluir", async () => {
    render(<CasasFinalizadas />);
    expect(screen.queryByRole("button", { name: /reativar|recuperar|reutilizar/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mover para lixeira" }));
    await waitFor(() => expect(updateCasa).toHaveBeenCalledWith(casaFinalizada.id, { status: "lixeira" }));

    fireEvent.click(screen.getByRole("button", { name: "Lixeira (1)" }));
    expect(screen.getByRole("button", { name: "Editar casa" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reativar|recuperar|reutilizar/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todas as casas da lixeira" }));
    expect(screen.queryByRole("button", { name: /reativar|recuperar|reutilizar/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Deletar 1" }));
    await waitFor(() => expect(deletePermanentementeCasa).toHaveBeenCalledWith(casaLixeira.id));
    fireEvent.click(screen.getByRole("button", { name: "Deletar permanentemente" }));
    await waitFor(() => expect(deletePermanentementeCasa).toHaveBeenCalledTimes(2));
  });

  it("soma só o reembolso concluído no lucro da casa", () => {
    const relatorio: RelatorioData = {
      id: "rel-1", casaId: casaFinalizada.id, agente: "Ana", prazo: "", cooperacao: 10, rows: [],
      status: "finalizado", criadoEm: "2026-02-15T12:00:00", reembolso: "concluido", valorReembolso: 65,
    };
    state.relatorios = [relatorio, { ...relatorio, id: "rel-2", reembolso: "pendente", cooperacao: 0, valorReembolso: 99 }];
    render(<CasasFinalizadas />);
    expect(screen.getByText("Reembolso recebido: R$ 65,00")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 75,00")).toHaveLength(2);
  });
});
