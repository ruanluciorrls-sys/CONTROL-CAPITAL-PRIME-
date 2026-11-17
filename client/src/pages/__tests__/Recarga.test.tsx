import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AbaProgresso from "@/components/AbaProgresso";
import RelatorioSpreadsheet from "@/components/RelatorioSpreadsheet";
import GerenciarCasas from "../GerenciarCasas";

const addCasa = vi.hoisted(() => vi.fn().mockResolvedValue(true));

vi.mock("@/contexts/AppContext", () => ({
  useApp: () => ({ state: { casas: [], relatorios: [] }, addCasa }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: { plataformas: { list: { useQuery: () => ({ data: [] }) } } },
}));

describe("Recarga", () => {
  it("troca Meta e Media por um campo e envia o montante escolhido", async () => {
    render(<GerenciarCasas />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Nova Casa" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Meta" }), { target: { value: "40" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Média" }), { target: { value: "50" } });
    const seletor = screen.getByRole("switch", { name: "Recarga" });
    fireEvent.click(seletor);
    expect(seletor).toBeChecked();
    expect(screen.queryByRole("spinbutton", { name: "Meta", exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton", { name: "Média" })).not.toBeInTheDocument();
    fireEvent.click(seletor);
    expect(screen.getByRole("spinbutton", { name: "Meta" })).toHaveValue(40);
    expect(screen.getByRole("spinbutton", { name: "Média" })).toHaveValue(50);

    fireEvent.click(seletor);
    fireEvent.change(screen.getByPlaceholderText("Ex: Casa 1, VOY, W1"), { target: { value: "Rede teste" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Meta - Recarga (R$)" }), { target: { value: "10000.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar 1 Casa" }));
    await waitFor(() => expect(addCasa).toHaveBeenCalledWith(expect.objectContaining({
      nome: "Rede teste", metaRecarga: 10000.5, meta: 0, media: 0,
    })));
  });

  it("usa o alvo direto e registra salario sem alterar o fluxo normal da planilha", () => {
    const onCooperacaoChange = vi.fn();
    const props = {
      casaNome: "Rede teste", agente: "Ana", prazo: "", meta: 40, media: 50, cooperacao: 0, onCooperacaoChange,
      rows: [], onAddRow: vi.fn(), onDeleteRow: vi.fn(), onUpdateRow: vi.fn(),
    };
    const { rerender } = render(<RelatorioSpreadsheet {...props} />);
    expect(screen.getByText("Quantidade de DEP")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*2\.000,00/)).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Cooperação" })).toBeInTheDocument();

    rerender(<RelatorioSpreadsheet {...props} metaRecarga={8000} />);
    expect(screen.queryByText("Quantidade de DEP")).not.toBeInTheDocument();
    expect(screen.getByText(/^R\$\s*8\.000,00$/)).toBeInTheDocument();
    expect(screen.getByText(/faltam R\$\s*8\.000,00/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Salário recebido" }), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onCooperacaoChange).toHaveBeenCalledWith(300);
  });

  it("conclui o progresso de recarga pelo montante, sem exigir quantidade de DEPs", () => {
    render(<AbaProgresso meta={40} media={50} metaRecarga={10000} totalDeposito={10000}
      totalSaque={0} totalBau={0} cooperacao={300} rows={[]} />);
    expect(screen.queryByText("DEPs Realizados")).not.toBeInTheDocument();
    expect(screen.getByText("Montante Atingido")).toBeInTheDocument();
    expect(screen.getByText("✓ Completo")).toBeInTheDocument();
  });
});
