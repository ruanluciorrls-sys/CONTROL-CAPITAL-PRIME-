// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { lerValorReembolso, valorRecebidoDoReembolso } from "@shared/reembolso";

const db = vi.hoisted(() => ({
  getRelatorioById: vi.fn(), concluirReembolsoRelatorio: vi.fn(), salvarValorReembolso: vi.fn(),
  updateRelatorio: vi.fn(), logPush: vi.fn(), acumularCicloDia: vi.fn(),
}));
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), ...db }));
vi.mock("./storage", () => ({ supabaseUploadJSON: vi.fn() }));
vi.mock("./push", async original => ({
  ...await original<typeof import("./push")>(), nomeDaMeta: vi.fn(async () => "Rede"),
  sendPushToUser: vi.fn(async () => {}),
}));

import { appRouter } from "./routers";
import { nomeDaMeta, sendPushToUser } from "./push";

const now = new Date();
const caller = appRouter.createCaller({
  req: {} as TrpcContext["req"], res: {} as TrpcContext["res"],
  user: {
    id: 7, role: "user", name: "Ana", openId: "ana", email: "ana@example.test", passwordHash: null,
    loginMethod: null, subscriptionStatus: "active", subscriptionExpiresAt: null, isActive: 1,
    createdAt: now, updatedAt: now, lastSignedIn: now,
  },
});

describe("reembolso do relatório", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.getRelatorioById.mockResolvedValue({ status: "ativo", reembolso: "pendente" });
  });

  it("salva o valor para a conta autenticada sem finalizar", async () => {
    db.salvarValorReembolso.mockResolvedValue(true);
    await expect(caller.relatorios.update({ id: "r", valorReembolso: 100.25 })).resolves.toEqual({ success: true });
    expect(db.salvarValorReembolso).toHaveBeenCalledWith("r", 7, 100.25);
    expect(db.concluirReembolsoRelatorio).not.toHaveBeenCalled();
  });

  it("conclui numa operação de servidor e considera o reembolso no resultado", async () => {
    db.concluirReembolsoRelatorio.mockResolvedValue({
      id: "r", userId: 7, casaId: "c", agente: "Ana", rows: [{ resultado: -120 }],
      cooperacao: "10", valorReembolso: "100", reembolso: "concluido",
    });
    await expect(caller.relatorios.update({ id: "r", valorReembolso: 100, concluirReembolso: true })).resolves.toEqual({ success: true });
    expect(db.concluirReembolsoRelatorio).toHaveBeenCalledWith("r", 7, 100);
    expect(sendPushToUser).toHaveBeenCalledWith(7, expect.objectContaining({ body: expect.stringMatching(/-R\$\s*10,00/) }));
  });

  it("rejeita valor inválido, outro dono e relatório que não está pendente", async () => {
    for (const valorReembolso of [-1, 100000000, 0.123]) {
      await expect(caller.relatorios.update({ id: "r", valorReembolso })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    db.getRelatorioById.mockResolvedValueOnce(null).mockResolvedValueOnce({ status: "finalizado", reembolso: "concluido" });
    await expect(caller.relatorios.update({ id: "outro", valorReembolso: 10 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.relatorios.update({ id: "r", valorReembolso: 10, concluirReembolso: true })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.concluirReembolsoRelatorio).not.toHaveBeenCalled();
  });

  it("aceita decimal brasileiro e ignora rascunhos e registros antigos sem valor", () => {
    expect(lerValorReembolso("100,25")).toBe(100.25);
    expect(lerValorReembolso("")).toBeNull();
    expect(lerValorReembolso("-100")).toBeNull();
    expect(valorRecebidoDoReembolso({ reembolso: "pendente", valorReembolso: 100 })).toBe(0);
    expect(valorRecebidoDoReembolso({ reembolso: "concluido" })).toBe(0);
  });
});

describe("notificações ao editar o relatório", () => {
  const ciclo = { numero: 1, deposito: 50, redeposito: 0, saque: 100, bau: 0, resultado: 50 };

  beforeEach(() => {
    vi.clearAllMocks();
    db.getRelatorioById.mockResolvedValue({
      id: "r", userId: 7, casaId: "c", agente: "Ana", status: "ativo", rows: [ciclo], cooperacao: "0",
    });
  });

  it("não consulta a meta nem gera avisos em edições sem alteração de ciclo", async () => {
    await caller.relatorios.update({ id: "r", cooperacao: "10" });
    await caller.relatorios.update({ id: "r", rows: [ciclo] });
    expect(db.updateRelatorio).toHaveBeenCalledTimes(2);
    expect(nomeDaMeta).not.toHaveBeenCalled();
    expect(sendPushToUser).not.toHaveBeenCalled();
    expect(db.acumularCicloDia).not.toHaveBeenCalled();
  });

  it("consulta a meta uma vez e preserva avisos e totais de ciclos que mudaram", async () => {
    await caller.relatorios.update({
      id: "r",
      rows: [
        { ...ciclo, saque: 110, resultado: 60 },
        { ...ciclo, numero: 2 },
      ],
      status: "finalizado",
    });
    expect(nomeDaMeta).toHaveBeenCalledTimes(1);
    expect(nomeDaMeta).toHaveBeenCalledWith(7, "c", "Ana");
    expect(sendPushToUser).toHaveBeenCalledTimes(3);
    expect(db.logPush).toHaveBeenCalledTimes(2);
    expect(db.acumularCicloDia.mock.calls).toEqual([[7, 10, 0], [7, 50, 1]]);
    expect(sendPushToUser).toHaveBeenLastCalledWith(7, expect.objectContaining({ tag: "meta-fim-r" }));
  });
});
