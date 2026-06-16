import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, casas, relatorios, contas, userSettings, gastosProxy, Casa, Relatorio, InsertCasa, InsertRelatorio, Conta, InsertConta, UserSettings, GastoProxy, InsertGastoProxy, slots, Slot, InsertSlot, plataformas, PlataformaDb, InsertPlataforma, pushConfig, PushConfig, pushSubscriptions, PushSubscriptionRow, InsertPushSubscription } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { ssl: "require" });
      _db = drizzle(client);
      
      // Auto-create slots table if it does not exist
      _db.execute(sql`
        CREATE TABLE IF NOT EXISTS slots (
          id SERIAL PRIMARY KEY,
          provider TEXT NOT NULL,
          performance TEXT NOT NULL,
          name TEXT NOT NULL UNIQUE,
          tag TEXT NOT NULL DEFAULT '',
          image TEXT,
          "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `).catch(err => console.error("[Database] Failed to auto-create slots table:", err));

      // Auto-create plataformas table if it does not exist
      _db.execute(sql`
        CREATE TABLE IF NOT EXISTS plataformas (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL,
          "diasPrazo" INTEGER NOT NULL,
          dia TEXT NOT NULL,
          "criadoEm" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `).then(async () => {
        // Seed default platforms and missing custom platforms to ensure 36 platforms are active
        const defaultPlats = [
          { id: "1",  nome: "WE",      diasPrazo: 4, dia: "SEGUNDA-FEIRA" },
          { id: "2",  nome: "777CLUBE",diasPrazo: 3, dia: "SEGUNDA-FEIRA" },
          { id: "3",  nome: "EK",      diasPrazo: 4, dia: "TERÇA-FEIRA" },
          { id: "4",  nome: "VOY",     diasPrazo: 4, dia: "TERÇA-FEIRA" },
          { id: "5",  nome: "888",     diasPrazo: 3, dia: "TERÇA-FEIRA" },
          { id: "6",  nome: "MANGA",   diasPrazo: 3, dia: "TERÇA-FEIRA" },
          { id: "7",  nome: "ANJO",    diasPrazo: 3, dia: "TERÇA-FEIRA" },
          { id: "8",  nome: "GAME",    diasPrazo: 6, dia: "TERÇA-FEIRA" },
          { id: "9",  nome: "91",      diasPrazo: 3, dia: "QUARTA-FEIRA" },
          { id: "10", nome: "OKOK",    diasPrazo: 3, dia: "QUARTA-FEIRA" },
          { id: "11", nome: "A8",      diasPrazo: 7, dia: "QUARTA-FEIRA" },
          { id: "12", nome: "DY",      diasPrazo: 4, dia: "QUARTA-FEIRA" },
          { id: "13", nome: "MK",      diasPrazo: 4, dia: "QUARTA-FEIRA" },
          { id: "14", nome: "WP",      diasPrazo: 7, dia: "QUARTA-FEIRA" },
          { id: "15", nome: "W1",      diasPrazo: 3, dia: "QUINTA-FEIRA" },
          { id: "16", nome: "DZ",      diasPrazo: 0, dia: "QUINTA-FEIRA" },
          { id: "17", nome: "777CLUBE",diasPrazo: 4, dia: "QUINTA-FEIRA" },
          { id: "18", nome: "WE",      diasPrazo: 3, dia: "SEXTA-FEIRA" },
          { id: "19", nome: "MANGA",   diasPrazo: 4, dia: "SEXTA-FEIRA" },
          { id: "20", nome: "ANJO",    diasPrazo: 4, dia: "SEXTA-FEIRA" },
          { id: "21", nome: "888",     diasPrazo: 4, dia: "SEXTA-FEIRA" },
          { id: "22", nome: "VOY",     diasPrazo: 3, dia: "SÁBADO" },
          { id: "23", nome: "91",      diasPrazo: 4, dia: "SÁBADO" },
          { id: "24", nome: "EK",      diasPrazo: 3, dia: "SÁBADO" },
          { id: "25", nome: "W1",      diasPrazo: 4, dia: "DOMINGO" },
          { id: "26", nome: "DY",      diasPrazo: 3, dia: "DOMINGO" },
          { id: "27", nome: "MK",      diasPrazo: 3, dia: "DOMINGO" },
          // As 9 plataformas adicionadas pelo administrador reconstruídas da primeira screenshot
          { id: "101", nome: "COROA",     diasPrazo: 5, dia: "SEGUNDA-FEIRA" },
          { id: "102", nome: "EQUIPE 777",diasPrazo: 5, dia: "SEGUNDA-FEIRA" },
          { id: "103", nome: "BOI",        diasPrazo: 6, dia: "QUARTA-FEIRA" },
          { id: "104", nome: "M9",         diasPrazo: 3, dia: "QUARTA-FEIRA" },
          { id: "105", nome: "EQUIPE 777",diasPrazo: 3, dia: "QUINTA-FEIRA" },
          { id: "106", nome: "COROA",     diasPrazo: 3, dia: "QUINTA-FEIRA" },
          { id: "107", nome: "COROA",     diasPrazo: 3, dia: "SEXTA-FEIRA" },
          { id: "108", nome: "EQUIPE 777",diasPrazo: 3, dia: "SÁBADO" },
          { id: "109", nome: "COROA",     diasPrazo: 3, dia: "DOMINGO" },
        ];
        console.log("[Database] Checking / Seeding default and custom platforms...");
        for (const plat of defaultPlats) {
          const exists = await _db!.select().from(plataformas).where(
            sql`nome = ${plat.nome} AND dia = ${plat.dia}`
          ).limit(1);
          if (exists.length === 0) {
            await _db!.insert(plataformas).values(plat);
          }
        }
      }).catch(err => console.error("[Database] Failed to auto-create / seed plataformas table:", err));
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function createUserWithPassword(data: {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const passwordHash = await bcrypt.hash(data.password, 12);
  const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash,
    openId,
    role: data.role ?? 'user',
    subscriptionStatus: 'trial',
    isActive: 1,
    lastSignedIn: new Date(),
  } as any);
  return getUserByEmail(data.email);
}

export async function verifyUserPassword(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) return null;
  if (!user.isActive) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) return;
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash } as any).where(eq(users.id, userId));
}

export async function updateUserSubscription(userId: number, data: {
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionExpiresAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data as any).where(eq(users.id, userId));
}

export async function toggleUserActive(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isActive: isActive ? 1 : 0 } as any).where(eq(users.id, userId));
}

// Casas queries
export async function getCasasByUserId(userId: number): Promise<Casa[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(casas).where(eq(casas.userId, userId));
}

export async function createCasa(casa: InsertCasa): Promise<Casa | null> {
  const db = await getDb();
  if (!db) return null;
  await db.insert(casas).values(casa);
  return db.select().from(casas).where(eq(casas.id, casa.id)).limit(1).then(r => r[0] || null);
}

export async function updateCasa(id: string, data: Partial<InsertCasa>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(casas).set({ ...data, atualizadoEm: new Date() } as any).where(eq(casas.id, id));
}

export async function deleteCasa(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(casas).where(eq(casas.id, id));
}

// Relatórios queries
export async function getRelatoriosByUserId(userId: number): Promise<Relatorio[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(relatorios).where(eq(relatorios.userId, userId));
}

export async function createRelatorio(relatorio: InsertRelatorio): Promise<Relatorio | null> {
  const db = await getDb();
  if (!db) return null;
  await db.insert(relatorios).values(relatorio);
  return db.select().from(relatorios).where(eq(relatorios.id, relatorio.id)).limit(1).then(r => r[0] || null);
}

export async function updateRelatorio(id: string, data: Partial<InsertRelatorio>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(relatorios).set({ ...data, atualizadoEm: new Date() } as any).where(eq(relatorios.id, id));
}

export async function deleteRelatorio(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(relatorios).where(eq(relatorios.id, id));
}

// Contas queries
export async function getContasByUserId(userId: number): Promise<Conta[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contas).where(eq(contas.userId, userId));
}

export async function createConta(conta: InsertConta): Promise<Conta | null> {
  const db = await getDb();
  if (!db) return null;
  await db.insert(contas).values(conta);
  return db.select().from(contas).where(eq(contas.id, conta.id)).limit(1).then(r => r[0] || null);
}

export async function updateConta(id: string, data: Partial<InsertConta>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(contas).set(data).where(eq(contas.id, id));
}

export async function deleteConta(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(contas).where(eq(contas.id, id));
}

// Funcoes de configuracoes de usuario
export async function getUserSettings(userId: number): Promise<UserSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0] || null;
}

export async function getAdminSettings(): Promise<UserSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const adminUser = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (!adminUser[0]) return null;
  return getUserSettings(adminUser[0].id);
}

export async function updateUserSettings(userId: number, data: Partial<UserSettings>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Verificar se ja existe registro
  const existing = await getUserSettings(userId);
  
  if (existing) {
    // Atualizar
    await db.update(userSettings).set(data).where(eq(userSettings.userId, userId));
  } else {
    // Inserir novo
    await db.insert(userSettings).values({
      userId,
      ...data,
    } as any);
  }
}

// Gastos Proxy queries
export async function getGastosProxyByUserId(userId: number): Promise<GastoProxy[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gastosProxy).where(eq(gastosProxy.userId, userId)).orderBy(desc(gastosProxy.data));
}

export async function createGastoProxy(gasto: InsertGastoProxy): Promise<GastoProxy | null> {
  const db = await getDb();
  if (!db) return null;
  await db.insert(gastosProxy).values(gasto);
  return db.select().from(gastosProxy).where(eq(gastosProxy.id, gasto.id)).limit(1).then(r => r[0] || null);
}

export async function updateGastoProxy(id: string, data: Partial<InsertGastoProxy>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(gastosProxy).set(data).where(eq(gastosProxy.id, id));
}

export async function deleteGastoProxy(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(gastosProxy).where(eq(gastosProxy.id, id));
}

export async function getTotalGastosProxy(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(gastosProxy).where(eq(gastosProxy.userId, userId));
  return result.reduce((sum, gasto) => sum + parseFloat(gasto.valor.toString()), 0);
}

// Queries para slots
export async function getSlots(): Promise<Slot[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(slots).orderBy(desc(slots.criadoEm));
}

export async function createSlot(slot: InsertSlot): Promise<Slot | null> {
  const db = await getDb();
  if (!db) return null;
  await db.insert(slots).values(slot);
  return db.select().from(slots).where(eq(slots.name, slot.name)).limit(1).then(r => r[0] || null);
}

// Queries para plataformas
export async function getPlataformas(): Promise<PlataformaDb[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plataformas);
}

export async function createPlataforma(plat: InsertPlataforma): Promise<PlataformaDb | null> {
  const db = await getDb();
  if (!db) return null;
  await db.insert(plataformas).values(plat);
  return db.select().from(plataformas).where(eq(plataformas.id, plat.id)).limit(1).then(r => r[0] || null);
}

export async function updatePlataforma(id: string, data: Partial<InsertPlataforma>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(plataformas).set(data).where(eq(plataformas.id, id));
}

export async function deletePlataforma(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(plataformas).where(eq(plataformas.id, id));
}

/** Insere as plataformas padrão somente se a tabela estiver vazia (primeira inicialização global). */
export async function seedPlataformasIfEmpty(defaults: InsertPlataforma[]): Promise<PlataformaDb[]> {
  const db = await getDb();
  if (!db) return [];
  const existing = await db.select().from(plataformas);
  if (existing.length > 0) return existing;
  if (defaults.length > 0) {
    await db.insert(plataformas).values(defaults);
  }
  return db.select().from(plataformas);
}

// ── Push Notifications ──
/** Cria a tabela de inscrições de push automaticamente (sem precisar de SQL manual). */
export async function ensurePushTable(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      endpoint text NOT NULL UNIQUE,
      subscription jsonb NOT NULL,
      criado_em timestamp DEFAULT now() NOT NULL
    )`);
    console.log("[Push] Tabela push_subscriptions pronta.");
  } catch (e) {
    console.error("[Push] Falha ao criar tabela push_subscriptions:", e);
  }
}

export async function getPushConfig(): Promise<PushConfig | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const r = await db.select().from(pushConfig).limit(1);
    return r[0] || null;
  } catch { return null; }
}

export async function savePushSubscription(userId: number, sub: any): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const endpoint = sub?.endpoint;
  if (!endpoint) return;
  try {
    await db.insert(pushSubscriptions)
      .values({ userId, endpoint, subscription: sub } as InsertPushSubscription)
      .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId, subscription: sub } });
  } catch (e) {
    console.error("[Push] Falha ao salvar inscrição:", e);
  }
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try { await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)); } catch {}
}

export async function getPushSubscriptionsByUser(userId: number): Promise<PushSubscriptionRow[]> {
  const db = await getDb();
  if (!db) return [];
  try { return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)); } catch { return []; }
}

export async function getAllPushSubscriptions(): Promise<PushSubscriptionRow[]> {
  const db = await getDb();
  if (!db) return [];
  try { return db.select().from(pushSubscriptions); } catch { return []; }
}

// TODO: add feature queries here as your schema grows.
