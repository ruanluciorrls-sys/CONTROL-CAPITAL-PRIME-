import { integer, pgEnum, pgTable, serial, text, timestamp, varchar, decimal, jsonb, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums PostgreSQL
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const subscriptionStatusEnum = pgEnum("subscriptionStatus", ["active", "inactive", "trial"]);
export const casaStatusEnum = pgEnum("casa_status", ["ativa", "finalizada", "lixeira"]);
export const relatorioStatusEnum = pgEnum("relatorio_status", ["ativo", "finalizado", "lixeira"]);
export const contaStatusEnum = pgEnum("conta_status", ["sacado", "sacando", "bloqueado"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** Legacy OAuth identifier. Kept for compatibility. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  /** Subscription status: active = liberado, inactive = bloqueado, trial = período de teste */
  subscriptionStatus: subscriptionStatusEnum("subscriptionStatus").default("trial").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de casas
export const casas = pgTable("casas", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("userId").notNull(),
  nome: text("nome").notNull(),
  login: text("login"),
  senha: text("senha"),
  redeNome: text("redeNome"), // rede do calendário (VOY, EK...) — usada pra lembrar jogos por rede (ALTER automático)
  media: text("media"),
  linkCasa: text("linkCasa"),
  linkContaFina: text("linkContaFina"),
  meta: decimal("meta", { precision: 10, scale: 2 }),
  prazo: text("prazo"),
  dataInicio: date("dataInicio"),
  dataFim: date("dataFim"),
  status: casaStatusEnum("status").default("ativa").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type Casa = typeof casas.$inferSelect;
export type InsertCasa = Omit<typeof casas.$inferInsert, 'id' | 'userId' | 'criadoEm' | 'atualizadoEm'> & {
  id: string;
  userId: number;
};

// Tabela de relatórios
export const relatorios = pgTable("relatorios", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("userId").notNull(),
  casaId: varchar("casaId", { length: 64 }).notNull(),
  agente: text("agente").notNull(),
  status: relatorioStatusEnum("status").default("ativo").notNull(),
  prazo: text("prazo"), // coluna criada via ALTER automático (ensureRelatorioPrazo)
  finalizadoEm: timestamp("finalizadoEm"), // quando foi finalizado (ALTER automático)
  etiqueta: text("etiqueta"), // etiquetas (separadas por vírgula) exibidas no card (ALTER automático)
  jogos: text("jogos"), // jogos feitos na cooperação, anotados ao finalizar (ALTER automático)
  rows: jsonb("rows").$type<Array<Record<string, unknown>>>().notNull(),
  cooperacao: decimal("cooperacao", { precision: 10, scale: 2 }).default("0").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
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
  user: one(users, { fields: [casas.userId], references: [users.id] }),
  relatorios: many(relatorios),
}));

export const relatoriosRelations = relations(relatorios, ({ one }) => ({
  user: one(users, { fields: [relatorios.userId], references: [users.id] }),
  casa: one(casas, { fields: [relatorios.casaId], references: [casas.id] }),
}));

// Tabela de contas
export const contas = pgTable("contas", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("userId").notNull(),
  usuario: text("usuario").notNull(),
  senha: text("senha"),
  valor: decimal("valor", { precision: 10, scale: 2 }),
  casa: text("casa"),
  status: contaStatusEnum("status").default("sacando").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type Conta = typeof contas.$inferSelect;
export type InsertConta = Omit<typeof contas.$inferInsert, 'id' | 'userId' | 'criadoEm' | 'atualizadoEm'> & {
  id: string;
  userId: number;
  casa?: string;
};

export const contasRelations = relations(contas, ({ one }) => ({
  user: one(users, { fields: [contas.userId], references: [users.id] }),
}));

// Tabela de configuracoes do usuario
export const userSettings = pgTable("userSettings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  nomeApp: text("nomeApp").default("CAPITAL PRIME CONTROL"),
  corPrimaria: varchar("corPrimaria", { length: 7 }).default("#1a3a8f"),
  fundoUrl: text("fundoUrl"),
  logoUrl: text("logoUrl"),
  nomeColorido: text("nomeColorido").default("Capital Prime"),
  coresColorido: jsonb("coresColorido").$type<string[]>().default([]),
  emojisColorido: jsonb("emojisColorido").$type<string[]>().default([]),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));

// Tabela de gastos com proxy
export const gastosProxy = pgTable("gastosProxy", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("userId").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  descricao: text("descricao"),
  data: date("data").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type GastoProxy = typeof gastosProxy.$inferSelect;
export type InsertGastoProxy = Omit<typeof gastosProxy.$inferInsert, 'id' | 'userId' | 'criadoEm' | 'atualizadoEm'> & {
  id: string;
  userId: number;
};

export const gastosProxyRelations = relations(gastosProxy, ({ one }) => ({
  user: one(users, { fields: [gastosProxy.userId], references: [users.id] }),
}));

export const usersRelationsFull = relations(users, ({ many }) => ({
  casas: many(casas),
  relatorios: many(relatorios),
  contas: many(contas),
  gastosProxy: many(gastosProxy),
}));

// Tabela de receitas manuais (bônus, ganhos avulsos) — soma no lucro
export const receitas = pgTable("receitas", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("userId").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  descricao: text("descricao"),
  data: date("data").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});

export type Receita = typeof receitas.$inferSelect;
export type InsertReceita = Omit<typeof receitas.$inferInsert, 'id' | 'userId' | 'criadoEm'> & {
  id: string;
  userId: number;
};

// Tabela de slots / jogos adicionados
export const slots = pgTable("slots", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  performance: text("performance").notNull(),
  name: text("name").notNull().unique(),
  tag: text("tag").default("").notNull(),
  image: text("image"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});

export type Slot = typeof slots.$inferSelect;
export type InsertSlot = typeof slots.$inferInsert;

// Tabela de plataformas para regras do calendário
export const plataformas = pgTable("plataformas", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  diasPrazo: integer("diasPrazo").notNull(),
  dia: text("dia").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});

export type PlataformaDb = typeof plataformas.$inferSelect;
export type InsertPlataforma = typeof plataformas.$inferInsert;

// Config de push (chaves VAPID) — uma linha global
export const pushConfig = pgTable("push_config", {
  id: integer("id").primaryKey().default(1),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
});
export type PushConfig = typeof pushConfig.$inferSelect;

// Inscrições de push por usuário (cada aparelho gera uma)
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  endpoint: text("endpoint").notNull().unique(),
  subscription: jsonb("subscription").$type<Record<string, unknown>>().notNull(),
  device: text("device"), // 'mobile' | 'desktop' — para a opção "só celular"
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;