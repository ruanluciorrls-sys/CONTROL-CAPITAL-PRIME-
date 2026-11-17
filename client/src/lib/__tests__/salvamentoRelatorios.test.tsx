import { describe, expect, it, vi } from "vitest";
import { criarFilaSalvamentoRelatorios } from "@/lib/salvamentoRelatorios";

type Patch = { id: string; rows?: number[]; cooperacao?: string };

function respostaPendente() {
  let resolver!: (resposta: { success: boolean }) => void;
  let rejeitar!: (erro: Error) => void;
  const promise = new Promise<{ success: boolean }>((resolve, reject) => {
    resolver = resolve;
    rejeitar = reject;
  });
  return { promise, resolver, rejeitar };
}

describe("fila de salvamento de relatorios", () => {
  it("serializa gravacoes do mesmo relatorio, sem bloquear IDs distintos nem confirmar uma edicao antiga", async () => {
    const publicar = vi.fn();
    const reconciliar = vi.fn();
    const fila = criarFilaSalvamentoRelatorios<Patch>(publicar, reconciliar);
    const antigo = respostaPendente();
    const novo = respostaPendente();
    const outro = respostaPendente();
    const gravar = vi.fn()
      .mockReturnValueOnce(antigo.promise)
      .mockReturnValueOnce(outro.promise)
      .mockReturnValueOnce(novo.promise);

    const tarefaAntiga = fila.enfileirar({ id: "a", rows: [1] }, gravar);
    const tarefaNova = fila.enfileirar({ id: "a", rows: [2] }, gravar);
    const tarefaOutro = fila.enfileirar({ id: "b", rows: [3] }, gravar);
    await Promise.resolve();
    expect(gravar.mock.calls).toEqual([[{ id: "a", rows: [1] }], [{ id: "b", rows: [3] }]]);

    outro.resolver({ success: true });
    await tarefaOutro;
    expect(publicar).toHaveBeenLastCalledWith("b", { status: "salvo", salvoEm: expect.any(String) });

    antigo.resolver({ success: true });
    await tarefaAntiga;
    expect(gravar).toHaveBeenLastCalledWith({ id: "a", rows: [2] });
    expect(publicar).not.toHaveBeenCalledWith("a", expect.objectContaining({ status: "salvo" }));

    novo.resolver({ success: true });
    await tarefaNova;
    expect(publicar).toHaveBeenLastCalledWith("a", { status: "salvo", salvoEm: expect.any(String) });
    expect(reconciliar).not.toHaveBeenCalled();
  });

  it("nao confirma gravacao rejeitada nem deixa outro campo apagar o erro", async () => {
    const publicar = vi.fn();
    const reconciliar = vi.fn();
    const fila = criarFilaSalvamentoRelatorios<Patch>(publicar, reconciliar);
    const linhas = respostaPendente();
    const cooperacao = respostaPendente();
    const gravar = vi.fn().mockReturnValueOnce(linhas.promise).mockReturnValueOnce(cooperacao.promise);
    const a = fila.enfileirar({ id: "a", rows: [1] }, gravar);
    const b = fila.enfileirar({ id: "a", cooperacao: "2" }, gravar);
    linhas.rejeitar(new Error("falha de rede"));
    await a;
    expect(reconciliar).not.toHaveBeenCalled();
    cooperacao.resolver({ success: true });
    await b;
    expect(publicar).toHaveBeenLastCalledWith("a", { status: "erro" });
    expect(reconciliar).toHaveBeenCalledTimes(1);

    await fila.enfileirar({ id: "a", rows: [3] }, async () => ({ success: false }));
    expect(publicar).toHaveBeenLastCalledWith("a", { status: "erro" });

    await fila.enfileirar({ id: "a", rows: [4] }, async () => ({ success: true }));
    expect(publicar).toHaveBeenLastCalledWith("a", { status: "salvo", salvoEm: expect.any(String) });
  });
});
