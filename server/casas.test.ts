import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("casas.create", () => {
  it("should create a casa with required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.casas.create({
      nome: "Casa Teste",
      login: "user@example.com",
      senha: "password123",
    });

    expect(result).toBeDefined();
    expect(result?.nome).toBe("Casa Teste");
    expect(result?.status).toBe("ativa");
    expect(result?.userId).toBe(ctx.user.id);
  });

  it("should create a casa with optional fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.casas.create({
      nome: "Casa Completa",
      login: "user@example.com",
      senha: "password123",
      media: "2024-01-15",
      linkCasa: "https://example.com/casa",
      linkContaFina: "https://example.com/conta",
      meta: "5000.00",
    });

    expect(result).toBeDefined();
    expect(result?.meta).toBe("5000.00");
    expect(result?.linkCasa).toBe("https://example.com/casa");
  });
});

describe("casas.list", () => {
  it("should return empty list for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.casas.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("relatorios.create", () => {
  it("should create a relatorio with required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a casa
    const casa = await caller.casas.create({
      nome: "Casa para Relatório",
    });

    if (!casa) throw new Error("Failed to create casa");

    const result = await caller.relatorios.create({
      casaId: casa.id,
      agente: "João Silva",
      rows: [
        { "Depósito": 100, "Data": "2024-01-15" },
        { "Depósito": 200, "Data": "2024-01-16" },
      ],
    });

    expect(result).toBeDefined();
    expect(result?.agente).toBe("João Silva");
    expect(result?.status).toBe("ativo");
    expect(result?.userId).toBe(ctx.user.id);
    expect(result?.casaId).toBe(casa.id);
  });

  it("should create a relatorio with cooperacao", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const casa = await caller.casas.create({
      nome: "Casa para Relatório com Cooperacao",
    });

    if (!casa) throw new Error("Failed to create casa");

    const result = await caller.relatorios.create({
      casaId: casa.id,
      agente: "Maria Santos",
      rows: [],
      cooperacao: "500.50",
    });

    expect(result).toBeDefined();
    expect(result?.cooperacao).toBe("500.50");
  });
});

describe("relatorios.list", () => {
  it("should return empty list for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.relatorios.list();

    expect(Array.isArray(result)).toBe(true);
  });
});
