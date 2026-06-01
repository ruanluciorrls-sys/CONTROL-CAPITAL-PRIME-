import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de casas
export const casas = mysqlTable("casas", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  nome: text("nome").notNull(),
  login: text("login"),
  senha: text("senha"),
  media: text("media"),
  linkCasa: text("linkCasa"),
  linkContaFina: text("linkContaFina"),
  meta: decimal("meta", { precision: 10, scale: 2 }),
  prazo: text("prazo"),
  dataInicio: date("dataInicio"),
  dataFim: date("dataFim"),
  status: mysqlEnum("status", ["ativa", "finalizada", "lixeira"]).default("ativa").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type Casa = typeof casas.$inferSelect;
export type InsertCasa = Omit<typeof casas.$inferInsert, 'id' | 'userId' | 'criadoEm' | 'atualizadoEm'> & {
  id: string;
  userId: number;
};

// Tabela de relatórios
export const relatorios = mysqlTable("relatorios", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  casaId: varchar("casaId", { length: 64 }).notNull(),
  agente: text("agente").notNull(),
  status: mysqlEnum("status", ["ativo", "finalizado", "lixeira"]).default("ativo").notNull(),
  rows: json("rows").$type<Array<Record<string, unknown>>>().notNull(),
  cooperacao: decimal("cooperacao", { precision: 10, scale: 2 }).default("0").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type Relatorio = typeof relatorios.$inferSelect;
export type InsertRelatorio = Omit<typeof relatorios.$inferInsert, 'id' | 'userId' | 'criadoEm' | 'atualizadoEm'> & {
  id: string;
  userId: number;
};

// Relações
export const usersRelations = relations(users, ({ many }) => ({
  casas: many(casas),
  relatorios: many(relatorios),
}));

export const casasRelations = relations(casas, ({ one, many }) => ({
  user: one(users, {
    fields: [casas.userId],
    references: [users.id],
  }),
  relatorios: many(relatorios),
}));

export const relatoriosRelations = relations(relatorios, ({ one }) => ({
  user: one(users, {
    fields: [relatorios.userId],
    references: [users.id],
  }),
  casa: one(casas, {
    fields: [relatorios.casaId],
    references: [casas.id],
  }),
}));

// Tabela de contas
export const contas = mysqlTable("contas", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  usuario: text("usuario").notNull(),
  senha: text("senha"),
  valor: decimal("valor", { precision: 10, scale: 2 }),
  casa: text("casa"), // Nome da casa que a conta pertence
  status: mysqlEnum("status", ["sacado", "sacando", "bloqueado"]).default("sacando").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type Conta = typeof contas.$inferSelect;
export type InsertConta = Omit<typeof contas.$inferInsert, 'id' | 'userId' | 'criadoEm' | 'atualizadoEm'> & {
  id: string;
  userId: number;
  casa?: string;
};

// Relação de contas
export const contasRelations = relations(contas, ({ one }) => ({
  user: one(users, {
    fields: [contas.userId],
    references: [users.id],
  }),
}));

// Atualizar relação de usuários
export const usersRelationsUpdated = relations(users, ({ many }) => ({
  casas: many(casas),
  relatorios: many(relatorios),
  contas: many(contas),
}));

// Tabela de configuracoes do usuario
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  nomeApp: text("nomeApp").default("RUAN DARK CPA"),
  corPrimaria: varchar("corPrimaria", { length: 7 }).default("#2563EB"),
  fundoUrl: text("fundoUrl"),
  logoUrl: text("logoUrl"),
  nomeColorido: text("nomeColorido").default("Juan Dark"),
  coresColorido: json("coresColorido").$type<string[]>().default([]),
  emojisColorido: json("emojisColorido").$type<string[]>().default([]),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// Relacao de user settings
export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Tabela de gastos com proxy
export const gastosProxy = mysqlTable("gastosProxy", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  descricao: text("descricao"),
  data: date("data").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});

export type GastoProxy = typeof gastosProxy.$inferSelect;
export type InsertGastoProxy = Omit<typeof gastosProxy.$inferInsert, 'id' | 'userId' | 'criadoEm' | 'atualizadoEm'> & {
  id: string;
  userId: number;
};

// Relação de gastos proxy
export const gastosProxyRelations = relations(gastosProxy, ({ one }) => ({
  user: one(users, {
    fields: [gastosProxy.userId],
    references: [users.id],
  }),
}));

// Atualizar relação de usuários
export const usersRelationsFinal = relations(users, ({ many }) => ({
  casas: many(casas),
  relatorios: many(relatorios),
  contas: many(contas),
  gastosProxy: many(gastosProxy),
}));

// TODO: Add your tables here