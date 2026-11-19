// @vitest-environment node
import { createRequire } from "node:module";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

// The integration cases use a disposable in-memory Postgres, never DATABASE_URL.
type ExecutorSql = {
  query: <T>(sql: string, params?: unknown[], options?: {
    rowMode: "array" | "object";
    parsers: Record<number, (value: string) => string>;
  }) => Promise<{ rows: T[] }>;
};
type PostgresLocal = ExecutorSql & {
  exec: (sql: string) => Promise<unknown>;
  transaction: <T>(run: (tx: ExecutorSql) => Promise<T>) => Promise<T>;
  close: () => Promise<void>;
};
const local = vi.hoisted(() => ({ client: null as PostgresLocal | null }));
vi.mock("postgres", () => ({ default: () => {
  if (!local.client) throw new Error("Este teste nao pode acessar um banco externo.");
  const client = local.client;
  return {
    ...driverLocal(client),
    begin: <T>(run: (tx: ReturnType<typeof driverLocal>) => Promise<T>) => (
      client.transaction(tx => run(driverLocal(tx)))
    ),
  };
} }));
vi.mock("./push", async importOriginal => ({
  ...await importOriginal<typeof import("./push")>(),
  nomeDaMeta: vi.fn(async () => "Meta de teste"),
  sendPushToUser: vi.fn(),
}));

function driverLocal(executor: ExecutorSql) {
  const texto = (value: string) => value;
  return {
    options: { parsers: {}, serializers: {} },
    unsafe(sql: string, params: unknown[]) {
      const run = (rowMode: "array" | "object") => executor.query(sql, params, {
        rowMode,
        parsers: { 1114: texto, 1184: texto },
      }).then(result => result.rows);
      return {
        then: (resolve: (rows: unknown[]) => unknown, reject: (error: unknown) => unknown) => run("object").then(resolve, reject),
        // Ignore the unrelated background seed on the single in-memory connection.
        values: () => sql.includes('from "plataformas" where nome =') ? Promise.resolve([[]]) : run("array"),
      };
    },
  };
}

import { concluirReembolsoRelatorio, updateRelatorio } from "./db";
import { appRouter } from "./routers";

function caller(id: number | null, name = "Ana") {
  const now = new Date();
  return appRouter.createCaller({
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    user: id === null ? null : {
      id, name, email: "privado@example.test", openId: null, loginMethod: null,
      passwordHash: null, role: "user", subscriptionStatus: "active",
      subscriptionExpiresAt: null, isActive: 1, createdAt: now, updatedAt: now, lastSignedIn: now,
    },
  });
}

describe("notasRede sem banco", () => {
  it("exige sessao para consultar ou publicar", async () => {
    const visitante = caller(null);
    const rede = "VOY";
    await expect(visitante.notasRede.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(visitante.notasRede.avisos({ rede })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(visitante.notasRede.jogos({ rede })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(visitante.notasRede.upsert({ rede, texto: "Aviso", tom: "bom" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejeita campos invalidos antes de acessar o banco", async () => {
    const { notasRede } = caller(1);
    await expect(notasRede.jogos({ rede: " " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(notasRede.jogos({ rede: "privado@example.test" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(notasRede.upsert({ rede: "VOY", texto: " ", tom: "neutro" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

const pglitePath = process.env.FEED_REDE_PGLITE;
describe.skipIf(!pglitePath)("feed de rede e reembolso em Postgres local", () => {
  beforeAll(async () => {
    const { PGlite } = createRequire(import.meta.url)(pglitePath!) as { PGlite: new () => PostgresLocal };
    local.client = new PGlite();
    vi.stubEnv("DATABASE_URL", "postgres://in-memory-test");
    await local.client.exec(`
      CREATE TABLE users (id integer PRIMARY KEY, name text);
      CREATE TABLE casas (
        id varchar(64) PRIMARY KEY, "userId" integer, "redeNome" text, nome text,
        status text DEFAULT 'ativa', reembolso text, "dataFim" date, "reembolsadoEm" timestamp, "atualizadoEm" timestamp
      );
      CREATE TABLE relatorios (
        id varchar(64) PRIMARY KEY, "userId" integer, "casaId" varchar(64),
        status text, jogos text, "atualizadoEm" timestamp, rows jsonb,
        agente text, prazo text, "finalizadoEm" timestamp, etiqueta text, "valorReembolso" numeric(10,2),
        reembolso text, "reembolsadoEm" timestamp, cooperacao numeric, "criadoEm" timestamp
      );
      CREATE TABLE rede_notas (
        rede varchar(80) PRIMARY KEY, texto text, tom text, "atualizadoPor" text, "atualizadoEm" timestamp
      );
      INSERT INTO users VALUES (1, 'Ana <ana@example.test>'), (2, 'bruno@example.test');
      INSERT INTO casas (id, "userId", "redeNome", nome) VALUES
        ('a', 1, ' voy ', 'META PRIVADA'), ('b', 2, 'EK', 'OUTRA META'),
        ('sem-rede', 1, NULL, 'NOME QUE NAO PODE VIRAR REDE');
      INSERT INTO casas (id, "userId", nome, status, reembolso, "atualizadoEm") VALUES
        ('casa-reembolso', 1, 'REEMBOLSO', 'ativa', 'pendente', '2025-01-01'),
        ('casa-reembolso-alheia', 2, 'OUTRO REEMBOLSO', 'ativa', 'pendente', '2025-01-01');
      INSERT INTO relatorios (id, "userId", "casaId", status, jogos, "atualizadoEm", rows) VALUES
        ('legado', 1, 'a', 'finalizado', 'HISTORICO PRIVADO', now(), '[]'),
        ('a1', 1, 'a', 'ativo', NULL, now(), '[]'),
        ('a2', 1, 'a', 'ativo', 'JOGOS ANTERIORES PRIVADOS', now(), '[]'),
        ('a3', 1, 'a', 'ativo', 'JOGOS ANTERIORES PRIVADOS', now(), '[]'),
        ('b1', 2, 'b', 'ativo', NULL, now(), '[]'),
        ('b2-rota', 2, 'b', 'ativo', 'PRIVADO ANTERIOR', now(), '[]'),
        ('sem-rede', 1, 'sem-rede', 'ativo', NULL, now(), '[]'),
        ('casa-alheia', 1, 'b', 'ativo', NULL, now(), '[]');
      INSERT INTO relatorios (id, "userId", "casaId", status, reembolso, "valorReembolso", "atualizadoEm", rows) VALUES
        ('reembolso', 1, 'casa-reembolso', 'ativo', 'pendente', 25, '2025-01-01', '[]'),
        ('reembolso-casa-alheia', 1, 'casa-reembolso-alheia', 'ativo', 'pendente', 25, '2025-01-01', '[]');
      INSERT INTO rede_notas VALUES (' voy ', 'Aviso legado', 'ruim', 'Legado <privado@example.test>', '2025-01-02');
    `);
  }, 20_000);

  afterAll(async () => {
    await local.client?.close();
    vi.unstubAllEnvs();
  });

  it("mantem o aviso legado com data e acumula contribuicoes de duas contas", async () => {
    const ana = caller(1, "Ana <ana@example.test>");
    const bruno = caller(2, "Bruno");
    await ana.notasRede.upsert({ rede: "  voy ", texto: "Aviso da Ana", tom: "bom" });
    await bruno.notasRede.upsert({ rede: "VOY", texto: "Aviso do Bruno", tom: "neutro" });
    const avisos = await ana.notasRede.avisos({ rede: "voy" });
    expect(avisos.map(nota => [nota.texto, nota.atualizadoPor])).toEqual([
      ["Aviso do Bruno", "Bruno"], ["Aviso da Ana", "Ana"], ["Aviso legado", "Legado"],
    ]);
    expect(avisos[2].atualizadoEm).toEqual(new Date("2025-01-02T00:00:00Z"));
    expect(await bruno.notasRede.avisos({ rede: "VOY" })).toEqual(avisos);
    expect(await bruno.notasRede.list()).toEqual([avisos[0]]);
    expect(await bruno.notasRede.avisos({ rede: "EK" })).toEqual([]);
  });

  it("nao faz backfill nem publica ao salvar jogos sem adesao", async () => {
    await updateRelatorio("legado", 1, { status: "finalizado", jogos: "PRIVADO ATUALIZADO" });
    await expect(caller(2).notasRede.jogos({ rede: "VOY" })).resolves.toEqual([]);
  });

  it("publica apenas durante a transicao ativa, na rede da casa e com retorno minimo", async () => {
    const data = { status: "finalizado", jogos: "  Jogo da Ana  ", rows: [{ saque: 12345, login: "PRIVADO" }] } as const;
    await updateRelatorio("a1", 1, { ...data, rows: [...data.rows] }, { compartilharJogos: { texto: "Bom, ana@example.test" } });
    await expect(updateRelatorio("a1", 1, { status: "finalizado", jogos: "Repetido" }, {
      compartilharJogos: { texto: "" },
    })).rejects.toMatchObject({ code: "CONFLICT" });
    await updateRelatorio("b1", 2, { status: "finalizado", jogos: "" }, { compartilharJogos: { texto: "Observação sem jogos" } });
    expect(await caller(2).notasRede.jogos({ rede: " voy " })).toEqual([
      { jogos: "Jogo da Ana", autor: "Ana", criadoEm: expect.any(Date), texto: "Bom, [e-mail removido]" },
    ]);
    expect(await caller(1).notasRede.jogos({ rede: "EK" })).toEqual([
      { jogos: "", autor: "Operador", criadoEm: expect.any(Date), texto: "Observação sem jogos" },
    ]);
    await updateRelatorio("a2", 1, { status: "finalizado", jogos: "Novo jogo" }, { compartilharJogos: { texto: " " } });
    expect((await caller(2).notasRede.jogos({ rede: "VOY" }))[0]).toEqual({
      jogos: "Novo jogo", autor: "Ana", criadoEm: expect.any(Date), texto: null,
    });
  });

  it("reverte a finalizacao se a casa nao tem rede ou nao pertence a conta", async () => {
    const optIn = { compartilharJogos: { texto: "Dica" } };
    const update = { status: "finalizado", jogos: "Jogo" } as const;
    await expect(updateRelatorio("sem-rede", 1, update, optIn)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(updateRelatorio("casa-alheia", 1, update, optIn)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(updateRelatorio("a3", 2, update, optIn)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(updateRelatorio("a3", 1, { status: "finalizado" }, optIn)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const { rows } = await local.client!.query<{ status: string }>(
      "SELECT status FROM relatorios WHERE id IN ('sem-rede', 'casa-alheia', 'a3')",
    );
    expect(rows).toEqual([{ status: "ativo" }, { status: "ativo" }, { status: "ativo" }]);
  });

  it("aceita observacao sem jogos no contrato de relatorios.update", async () => {
    const bruno = caller(2);
    await expect(bruno.relatorios.update({
      id: "b2-rota", status: "finalizado", jogos: "", compartilharJogos: { texto: "Somente via rota" },
    })).resolves.toEqual({ success: true });
    expect((await caller(1).notasRede.jogos({ rede: "EK" }))[0]).toEqual({
      jogos: "", autor: "Operador", criadoEm: expect.any(Date), texto: "Somente via rota",
    });
  });

  it("nao deixa o feed exposto pela API direta do banco", async () => {
    await local.client!.exec(`
      CREATE ROLE feed_leitor;
      GRANT SELECT ON rede_notas, rede_avisos, rede_jogos TO feed_leitor;
    `);
    await local.client!.transaction(async tx => {
      await tx.query("SET LOCAL ROLE feed_leitor");
      const { rows } = await tx.query<{ total: number }>(`
        SELECT (SELECT count(*) FROM rede_notas)
          + (SELECT count(*) FROM rede_avisos) + (SELECT count(*) FROM rede_jogos) AS total
      `);
      expect(Number(rows[0].total)).toBe(0);
    });
  });

  describe("concluirReembolsoRelatorio", () => {
    it("confirma R$ 100 e finaliza o relatorio e a casa vinculada na mesma transacao", async () => {
      const concluido = await concluirReembolsoRelatorio("reembolso", 1, 100);
      expect(concluido).toMatchObject({
        status: "finalizado", reembolso: "concluido", valorReembolso: "100.00",
        reembolsadoEm: expect.any(Date), finalizadoEm: expect.any(Date),
      });
      const instante = concluido!.reembolsadoEm!;
      const dia = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(instante);
      const { rows } = await local.client!.query(`
        SELECT r.status AS "statusRelatorio", r.reembolso AS "reembolsoRelatorio",
          r."valorReembolso"::text AS valor, r."finalizadoEm" AT TIME ZONE 'UTC' AS "finalizadoEm",
          r."reembolsadoEm" AT TIME ZONE 'UTC' AS "dataRelatorio",
          c.status AS "statusCasa", c.reembolso AS "reembolsoCasa", c."dataFim"::text AS "dataFim",
          c."reembolsadoEm" AT TIME ZONE 'UTC' AS "dataCasa"
        FROM relatorios r JOIN casas c ON c.id = r."casaId"
        WHERE r.id = 'reembolso'
      `);
      expect(rows).toEqual([{
        statusRelatorio: "finalizado", reembolsoRelatorio: "concluido", valor: "100.00",
        finalizadoEm: instante, dataRelatorio: instante, statusCasa: "finalizada",
        reembolsoCasa: "concluido", dataFim: dia, dataCasa: instante,
      }]);
    });

    it("reverte a alteracao do relatorio se a casa vinculada for de outra conta", async () => {
      const lerEstado = async () => (await local.client!.query(`
        SELECT to_jsonb(r) AS relatorio, to_jsonb(c) AS casa
        FROM relatorios r JOIN casas c ON c.id = r."casaId"
        WHERE r.id = 'reembolso-casa-alheia'
      `)).rows;
      const antes = await lerEstado();
      expect(antes).toMatchObject([{
        relatorio: { userId: 1, status: "ativo", reembolso: "pendente", valorReembolso: 25 },
        casa: { userId: 2, status: "ativa", reembolso: "pendente" },
      }]);
      await expect(concluirReembolsoRelatorio("reembolso-casa-alheia", 1, 100)).rejects.toThrow(/meta vinculada/);
      expect(await lerEstado()).toEqual(antes);
    });
  });
});
