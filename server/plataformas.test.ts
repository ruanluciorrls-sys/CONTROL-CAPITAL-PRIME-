// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  getPrimaryAdminId: vi.fn(),
  getPlataformas: vi.fn(),
  getPlataformasPessoais: vi.fn(),
  createPlataforma: vi.fn(),
  updatePlataforma: vi.fn(),
  deletePlataforma: vi.fn(),
  getUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
  getSlots: vi.fn(),
  listAllUsers: vi.fn(),
  getIdsRelatoriosReordenaveis: vi.fn(),
  getOrdemRelatorios: vi.fn(),
  salvarOrdemRelatorios: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({ ...await importOriginal<typeof import("./db")>(), ...db }));

import { appRouter } from "./routers";

function caller(id: number, role: "admin" | "user") {
  const now = new Date();
  return appRouter.createCaller({
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: {
      id, role, name: "Conta de teste", openId: `teste-${id}`, email: null,
      passwordHash: "hash-sintetico", loginMethod: null,
      subscriptionStatus: "active", subscriptionExpiresAt: null, isActive: 1,
      createdAt: now, updatedAt: now, lastSignedIn: now,
    },
  });
}

const plataforma = { nome: "REDE DE TESTE", dia: "SEGUNDA-FEIRA", diasPrazo: 4 };

beforeEach(() => {
  vi.resetAllMocks();
  db.getPrimaryAdminId.mockResolvedValue(1);
});

describe("Ordem dos relatorios por conta", () => {
  it("salva a ordem na conta autenticada sem publicar a preferencia em settings", async () => {
    const ordens = new Map<number, string[]>();
    db.getIdsRelatoriosReordenaveis.mockImplementation(async (id, ids) => id === 2 ? ids : []);
    db.salvarOrdemRelatorios.mockImplementation(async (id, ids) => { ordens.set(id, ids); });
    db.getOrdemRelatorios.mockImplementation(async id => ordens.get(id) ?? []);

    await expect(caller(2, "user").relatorios.reordenar({ ids: ["dois", "um"] })).resolves.toEqual(["dois", "um"]);
    await expect(caller(2, "user").relatorios.ordem()).resolves.toEqual(["dois", "um"]);
    await expect(caller(1, "admin").relatorios.ordem()).resolves.toEqual([]);
    expect(db.salvarOrdemRelatorios).toHaveBeenCalledWith(2, ["dois", "um"]);
    expect(db.updateUserSettings).not.toHaveBeenCalled();
  });

  it("rejeita IDs repetidos e IDs que nao pertencem aos relatorios ativos da conta", async () => {
    const usuario = caller(2, "user");
    await expect(usuario.relatorios.reordenar({ ids: ["um", "um"] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.getIdsRelatoriosReordenaveis).not.toHaveBeenCalled();

    db.getIdsRelatoriosReordenaveis.mockResolvedValue(["um"]);
    await expect(usuario.relatorios.reordenar({ ids: ["um", "de-outra-conta"] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.getIdsRelatoriosReordenaveis).toHaveBeenCalledWith(2, ["um", "de-outra-conta"]);
    expect(db.salvarOrdemRelatorios).not.toHaveBeenCalled();
  });
});

describe("Configurações compartilhadas", () => {
  it("entrega as plataformas globais a todos e as pessoais só ao dono", async () => {
    db.getPlataformas.mockResolvedValue([{ ...plataforma, id: "global" }]);
    db.getPlataformasPessoais.mockImplementation(async id => id === 2 ? [{ ...plataforma, id: "pessoal" }] : []);

    expect(await caller(2, "user").plataformas.list()).toMatchObject([
      { id: "global", pessoal: false }, { id: "pessoal", pessoal: true },
    ]);
    expect(await caller(3, "user").plataformas.list()).toMatchObject([{ id: "global", pessoal: false }]);
  });

  it("deriva o escopo das escritas da sessão e rejeita alterações fora da conta", async () => {
    db.createPlataforma.mockImplementation(async item => item);
    db.updatePlataforma.mockImplementation(async (id, userId) => userId === null || id === "pessoal" ? { id } : undefined);
    db.deletePlataforma.mockResolvedValue(undefined);
    const admin = caller(1, "admin");
    const usuario = caller(2, "user");

    expect(await admin.plataformas.create(plataforma)).toMatchObject({ pessoal: false });
    expect(await usuario.plataformas.create(plataforma)).toMatchObject({ pessoal: true });
    expect(db.createPlataforma.mock.calls.map(([, owner]) => owner)).toEqual([null, 2]);
    await admin.plataformas.update({ id: "global", diasPrazo: 5 });
    await usuario.plataformas.update({ id: "pessoal", diasPrazo: 2 });
    await expect(usuario.plataformas.update({ id: "global", diasPrazo: 6 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(usuario.plataformas.delete({ id: "global" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.updatePlataforma).toHaveBeenCalledWith("global", null, { diasPrazo: 5 });
    expect(db.deletePlataforma).toHaveBeenCalledWith("global", 2);
  });

  it("compartilha jogos e aparência e reserva a administração ao admin principal", async () => {
    db.getSlots.mockResolvedValue([{ id: 17, name: "Jogo de teste" }]);
    db.getUserSettings.mockResolvedValue({ nomeApp: "Capital Prime", tema: "light" });
    db.listAllUsers.mockResolvedValue([{ id: 2, passwordHash: "hash-sintetico" }]);
    const admin = caller(1, "admin");
    const outroAdmin = caller(3, "admin");
    const usuario = caller(2, "user");

    expect(await usuario.slots.list()).toMatchObject([{ id: 17 }]);
    expect(await usuario.settings.get()).toMatchObject({ nomeApp: "Capital Prime", tema: "light" });
    expect(db.getUserSettings).toHaveBeenCalledWith(1);
    await expect(outroAdmin.admin.users.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(usuario.settings.update({ tema: "dark" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await admin.admin.users.list()).toEqual([{ id: 2 }]);
    expect(await admin.auth.me()).toMatchObject({ isPrimaryAdmin: true });
    expect(await admin.auth.me()).not.toHaveProperty("passwordHash");
  });
});
