// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { lerValorReembolso, valorRecebidoDoReembolso } from "@shared/reembolso";

const db = vi.hoisted(() => ({
  getRelatorioById: vi.fn(), concluirReembolsoRelatorio: vi.fn(), salvarValorReembolso: vi.fn(),
}));
vi.mock("./db", async original => ({ ...await original<typeof import("./db")>(), ...db }));
vi.mock("./storage", () => ({ supabaseUploadJSON: vi.fn() }));
vi.mock("./push", async original => ({
  ...await original<typeof import("./push")>(), nomeDaMeta: vi.fn(async () => "Rede"),
  sendPushToUser: vi.fn(async () => {}),
}));

import { appRouter } from "./routers";
import { sendPushToUser } from "./push";

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
