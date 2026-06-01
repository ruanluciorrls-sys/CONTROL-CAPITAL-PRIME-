import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, casas, relatorios, contas, userSettings, gastosProxy, Casa, Relatorio, InsertCasa, InsertRelatorio, Conta, InsertConta, UserSettings, GastoProxy, InsertGastoProxy } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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
  await db.update(casas).set(data).where(eq(casas.id, id));
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
  await db.update(relatorios).set(data).where(eq(relatorios.id, id));
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

// TODO: add feature queries here as your schema grows.
