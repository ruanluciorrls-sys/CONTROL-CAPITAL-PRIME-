import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RelatorioSpreadsheet from "@/components/RelatorioSpreadsheet";

function propriedades() {
  return {
    casaNome: "Rede teste",
    agente: "Ana",
    prazo: "",
    meta: 167,
    media: 91,
    cooperacao: 432.19,
    rows: [{ numero: 1, deposito: 1234.56, redeposito: 12.3, saque: 34.56, bau: 78.9, resultado: -1133.4 }],
    onCooperacaoChange: vi.fn(),
    onAddRow: vi.fn(),
    onDeleteRow: vi.fn(),
    onUpdateRow: vi.fn(),
    onRestoreRows: vi.fn(),
  };
}

afterEach(() => vi.useRealTimers());

describe("leitura e acoes da planilha", () => {
  it("mantem os alvos de tipografia e a edicao das linhas com os mesmos calculos", () => {
    const props = propriedades();
    const { container } = render(<RelatorioSpreadsheet {...props} />);
    expect(container.querySelector(".operacoes-planilha")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Lançamentos do relatório" })).toHaveClass("planilha-tabela");
    expect(screen.getByText("Ana")).toHaveClass("planilha-titulo-agente");
    expect(screen.getByText("Agente / Blogueira")).toBeInTheDocument();
    expect(screen.queryByText("%", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText("Rede teste")).toHaveClass("planilha-titulo-casa");
    expect(screen.getByText("Ana").closest(".planilha-cartao")).toBeInTheDocument();
    expect(container.querySelectorAll(".planilha-cabecalho .planilha-cartao")).toHaveLength(2);
    expect(container.querySelectorAll(".planilha-metricas .planilha-cartao")).toHaveLength(3);
    expect(container.querySelector(".planilha-resumo")).toBeInTheDocument();
    const editar = screen.getByRole("button", { name: "Editar linha 1" });
    const excluir = screen.getByRole("button", { name: "Excluir linha 1" });
    expect(editar).toHaveClass("planilha-acao-editar");
    expect(excluir).toHaveClass("planilha-acao-excluir");
    expect(editar.querySelector("svg")).toHaveAttribute("width", "18");
    expect(excluir.querySelector("svg")).toHaveAttribute("width", "18");
    expect(editar.closest("tr")).toHaveClass("planilha-linha-dados");
    fireEvent.click(screen.getByRole("button", { name: "Editar linha 1" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Editar deposito da linha 1" }), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(props.onUpdateRow).toHaveBeenCalledWith(1, expect.objectContaining({
      deposito: 200, redeposito: 12.3, saque: 34.56, bau: 78.9,
      resultado: 34.56 - 200 - 12.3 + 78.9,
    }));
  });

  it("mantem a inclusao por teclado e a exclusao com os botoes maiores", () => {
    const props = propriedades();
    const { rerender } = render(<RelatorioSpreadsheet {...props} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Novo deposito" }), { target: { value: "100" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Novo saque" }), { target: { value: "135" } });
    fireEvent.keyDown(screen.getByRole("spinbutton", { name: "Novo saque" }), { key: "Enter" });
    expect(props.onAddRow).toHaveBeenCalledWith(expect.objectContaining({ numero: 2, deposito: 100, saque: 135, resultado: 35 }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir linha 1" }));
    expect(props.onDeleteRow).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("button", { name: "Cancelar edição" })).not.toBeInTheDocument();
    rerender(<RelatorioSpreadsheet {...props} ocultarValores />);
    expect(screen.queryByRole("button", { name: "Excluir linha 1" })).not.toBeInTheDocument();
  });

  it.each(["deposito", "redeposito", "saque", "bau"] as const)(
    "salva e desce na mesma coluna de %s, inclusive para a linha nova",
    campo => {
      const props = propriedades();
      const primeira = props.rows[0];
      const segunda = { ...primeira, numero: 3 };
      const { rerender } = render(<RelatorioSpreadsheet {...props} rows={[primeira, segunda]} />);
      fireEvent.click(screen.getByRole("button", { name: "Editar linha 1" }));
      expect(screen.getByRole("spinbutton", { name: "Editar deposito da linha 1" })).toHaveFocus();

      const atual = screen.getByRole("spinbutton", { name: `Editar ${campo} da linha 1` });
      atual.focus();
      fireEvent.change(atual, { target: { value: "200" } });
      fireEvent.keyDown(atual, { key: "Enter" });
      expect(props.onUpdateRow).toHaveBeenCalledTimes(1);
      const salvo = { ...primeira, [campo]: 200 };
      expect(props.onUpdateRow).toHaveBeenCalledWith(1, {
        ...salvo, resultado: salvo.saque - salvo.deposito - salvo.redeposito + salvo.bau,
      });

      const abaixo = screen.getByRole("spinbutton", { name: `Editar ${campo} da linha 3` });
      expect(abaixo).toHaveFocus();
      fireEvent.keyDown(abaixo, { key: "Enter" });
      expect(props.onUpdateRow).toHaveBeenCalledTimes(2);
      expect(props.onUpdateRow).toHaveBeenLastCalledWith(3, expect.objectContaining({ numero: 3 }));

      const novoCampo = screen.getByRole("spinbutton", { name: `Novo ${campo}` });
      expect(novoCampo).toHaveFocus();
      fireEvent.change(novoCampo, { target: { value: "75" } });
      fireEvent.keyDown(novoCampo, { key: "Enter" });
      expect(props.onAddRow).toHaveBeenCalledTimes(1);
      expect(props.onAddRow).toHaveBeenCalledWith(expect.objectContaining({ numero: 4, [campo]: 75 }));
      rerender(<RelatorioSpreadsheet {...props} rows={[primeira, segunda, props.onAddRow.mock.calls[0][0]]} />);
      expect(screen.getByRole("spinbutton", { name: `Novo ${campo}` })).toHaveFocus();
      expect(screen.getByRole("spinbutton", { name: `Novo ${campo}` })).toHaveValue(null);
    },
  );
});

describe("salvamento da planilha", () => {
  it("separa debounce local, envio, erro e horario confirmado", () => {
    vi.useFakeTimers();
    const props = propriedades();
    const salvoEm = "2026-11-17T14:15:16.000Z";
    const { rerender } = render(<RelatorioSpreadsheet {...props} />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(props.onCooperacaoChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    rerender(<RelatorioSpreadsheet {...props} salvamento={{ status: "salvo", salvoEm }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Salvo às");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Cooperação" }), { target: { value: "567" } });
    expect(screen.getByRole("status")).toHaveTextContent("Aguardando envio");
    expect(screen.getByRole("status")).not.toHaveTextContent("Salvo às");
    act(() => { vi.advanceTimersByTime(799); });
    expect(props.onCooperacaoChange).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(props.onCooperacaoChange.mock.calls).toEqual([[567]]);

    rerender(<RelatorioSpreadsheet {...props} cooperacao={567} salvamento={{ status: "salvando" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Salvando no servidor");
    expect(screen.getByRole("status")).not.toHaveTextContent("Salvo às");
    rerender(<RelatorioSpreadsheet {...props} cooperacao={567} salvamento={{ status: "erro" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Não foi possível confirmar o salvamento.");
    rerender(<RelatorioSpreadsheet {...props} cooperacao={567} salvamento={{ status: "salvo", salvoEm }} />);
    expect(screen.getByRole("status").querySelector("time")).toHaveAttribute("datetime", salvoEm);
  });

  it("envia uma unica vez quando OK antecipa o debounce", () => {
    vi.useFakeTimers();
    const props = propriedades();
    render(<RelatorioSpreadsheet {...props} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Cooperação" }), { target: { value: "987" } });
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(props.onCooperacaoChange.mock.calls).toEqual([[987]]);
  });
});

describe("privacidade da planilha", () => {
  it("remove inputs, quantias, porcentagens e sinais financeiros, e pausa o rascunho", () => {
    vi.useFakeTimers();
    const props = propriedades();
    const { container, rerender } = render(<RelatorioSpreadsheet {...props} />);
    expect(screen.getAllByText(/1\.234,56/).length).toBeGreaterThan(0);
    expect(screen.getByText(/do montante/)).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("table")).getByText("1"));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Cooperação" }), { target: { value: "987.65" } });

    rerender(<RelatorioSpreadsheet {...props} ocultarValores />);
    expect(container.querySelector("input")).toBeNull();
    expect(container.innerHTML).not.toMatch(/1\.234,56|987\.65|432,19|>167<|R\$|lucide-trending|width: [\d.]+%/);
    expect(screen.queryByText(/do montante/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Adicionar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeDisabled();
    expect(screen.getAllByText("••••").length).toBeGreaterThan(10);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(props.onCooperacaoChange).not.toHaveBeenCalled();
    const htmlOculto = container.innerHTML;
    rerender(<RelatorioSpreadsheet {...props} ocultarValores cooperacao={20} rows={[{ ...props.rows[0], resultado: 2000 }]} />);
    expect(container.innerHTML).toBe(htmlOculto);

    rerender(<RelatorioSpreadsheet {...props} />);
    expect(screen.getByRole("spinbutton", { name: "Cooperação" })).toHaveValue(987.65);
    act(() => { vi.advanceTimersByTime(800); });
    expect(props.onCooperacaoChange.mock.calls).toEqual([[987.65]]);
  });

  it("mostra o progresso monetario apenas na recarga visivel e limita a falta a zero", () => {
    const props = propriedades();
    const { rerender } = render(<RelatorioSpreadsheet {...props} />);
    expect(screen.queryByText(/lançados · faltam/)).not.toBeInTheDocument();

    rerender(<RelatorioSpreadsheet {...props} metaRecarga={1300.01} />);
    expect(screen.getByText(/R\$\s*1\.246,86 lançados · faltam R\$\s*53,15/)).toBeInTheDocument();

    rerender(<RelatorioSpreadsheet {...props} metaRecarga={1000} />);
    expect(screen.getByText(/lançados · faltam R\$\s*0,00/)).toBeInTheDocument();

    rerender(<RelatorioSpreadsheet {...props} metaRecarga={1000} ocultarValores />);
    expect(screen.queryByText(/lançados · faltam/)).not.toBeInTheDocument();
  });
});
