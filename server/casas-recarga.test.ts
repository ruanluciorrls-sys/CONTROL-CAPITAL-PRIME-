// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({ createCasa: vi.fn(), updateCasa: vi.fn() }));
vi.mock("./db", async importOriginal => ({ ...await importOriginal<typeof import("./db")>(), ...db }));
vi.mock("./storage", () => ({ supabaseUploadJSON: vi.fn() }));

import { appRouter } from "./routers";

const now = new Date();
const caller = appRouter.createCaller({
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
  user: {
    id: 7, role: "user", name: "Teste", openId: "teste", email: null, passwordHash: null,
    loginMethod: null, subscriptionStatus: "active", subscriptionExpiresAt: null, isActive: 1,
    createdAt: now, updatedAt: now, lastSignedIn: now,
  },
});

describe("Meta de recarga", () => {
  it("grava o valor separado na conta ativa e aceita o CPA anterior", async () => {
    db.createCasa.mockImplementation(async input => input);
    await expect(caller.casas.create({ nome: "Recarga", metaRecarga: "8000.50" })).resolves.toMatchObject({ userId: 7, metaRecarga: "8000.50" });
    await expect(caller.casas.create({ nome: "CPA", meta: "40", media: "50" })).resolves.toMatchObject({ userId: 7, meta: "40", media: "50" });
  });

  it("permite voltar ao CPA e rejeita valores fora do formato monetario", async () => {
    for (const metaRecarga of ["0", "-10", "10.001", "100000000", "NaN"]) {
      await expect(caller.casas.update({ id: "casa", metaRecarga })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(db.updateCasa).not.toHaveBeenCalled();
    await caller.casas.update({ id: "casa", metaRecarga: null });
    expect(db.updateCasa).toHaveBeenCalledWith("casa", 7, { metaRecarga: null });
  });
});
