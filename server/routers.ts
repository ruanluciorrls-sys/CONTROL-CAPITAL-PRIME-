import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getCasasByUserId, createCasa, updateCasa, deleteCasa, getRelatoriosByUserId, createRelatorio, updateRelatorio, deleteRelatorio, getContasByUserId, createConta, updateConta, deleteConta, getUserSettings, getAdminSettings, updateUserSettings, getGastosProxyByUserId, createGastoProxy, updateGastoProxy, deleteGastoProxy, getTotalGastosProxy, verifyUserPassword, createUserWithPassword, listAllUsers, updateUserSubscription, toggleUserActive, updateUserPassword, getUserById, getSlots, createSlot, getPlataformas, createPlataforma, updatePlataforma, deletePlataforma, seedPlataformasIfEmpty } from "./db";
import { supabaseUploadJSON } from "./storage";
import { InsertRelatorio } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { sdk } from "./_core/sdk";
import fs from "fs";
import path from "path";

let defaultFundoUrl = "";
try {
  const filePath = path.join(process.cwd(), "fundo.txt");
  if (fs.existsSync(filePath)) {
    defaultFundoUrl = fs.readFileSync(filePath, "utf8").trim();
  }
} catch (err) {
  console.error("Failed to load default background image from fundo.txt:", err);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await verifyUserPassword(input.email, input.password);
        if (!user) {
          throw new Error("Email ou senha incorretos");
        }
        // Check subscription
        if (user.subscriptionStatus === 'inactive' && user.role !== 'admin') {
          throw new Error("Sua assinatura está inativa. Entre em contato com o administrador.");
        }
        const token = await sdk.createSessionToken(user.openId ?? `local_${user.id}`, {
          name: user.name ?? user.email ?? "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        return { success: true, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    changePassword: protectedProcedure
      .input(z.object({
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserPassword(ctx.user.id, input.newPassword);
        return { success: true };
      }),
  }),

  // Admin router — apenas admins podem usar
  admin: router({
    users: router({
      list: adminProcedure.query(async () => {
        return listAllUsers();
      }),
      create: adminProcedure
        .input(z.object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["user", "admin"]).default("user"),
        }))
        .mutation(async ({ input }) => {
          const user = await createUserWithPassword(input);
          return user;
        }),
      updateSubscription: adminProcedure
        .input(z.object({
          userId: z.number(),
          subscriptionStatus: z.enum(["active", "inactive", "trial"]),
          subscriptionExpiresAt: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          await updateUserSubscription(input.userId, {
            subscriptionStatus: input.subscriptionStatus,
            subscriptionExpiresAt: input.subscriptionExpiresAt
              ? new Date(input.subscriptionExpiresAt)
              : null,
          });
          return { success: true };
        }),
      resetPassword: adminProcedure
        .input(z.object({
          userId: z.number(),
          newPassword: z.string().min(6),
        }))
        .mutation(async ({ input }) => {
          await updateUserPassword(input.userId, input.newPassword);
          return { success: true };
        }),
      toggleActive: adminProcedure
        .input(z.object({
          userId: z.number(),
          isActive: z.boolean(),
        }))
        .mutation(async ({ input }) => {
          await toggleUserActive(input.userId, input.isActive);
          return { success: true };
        }),
    }),
  }),

  // Casas router
  casas: router({
    list: protectedProcedure.query(({ ctx }) =>
      getCasasByUserId(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        login: z.string().optional(),
        senha: z.string().optional(),
        media: z.string().optional(),
        linkCasa: z.string().optional(),
        linkContaFina: z.string().optional(),
        meta: z.string().optional(),
        prazo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const casaId = nanoid();
        const casa = await createCasa({
          id: casaId,
          userId: ctx.user.id,
          ...input,
          status: "ativa",
        });
        
        if (casa) {
          try {
            const fileName = `${ctx.user.id}/${casaId}.json`;
            await supabaseUploadJSON("casas", casa, fileName);
          } catch (error) {
            console.error("Error uploading casa to Supabase:", error);
          }
        }
        
        return casa || { success: false };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        nome: z.string().optional(),
        login: z.string().optional(),
        senha: z.string().optional(),
        media: z.string().optional(),
        linkCasa: z.string().optional(),
        linkContaFina: z.string().optional(),
        meta: z.string().optional(),
        prazo: z.string().optional(),
        status: z.enum(["ativa", "finalizada", "lixeira"]).optional(),
        dataFim: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = { ...input };
        await updateCasa(input.id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await deleteCasa(input.id);
        return { success: true };
      }),
  }),

  // Relatórios router
  relatorios: router({
    list: protectedProcedure.query(({ ctx }) =>
      getRelatoriosByUserId(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        casaId: z.string(),
        agente: z.string(),
        prazo: z.string().optional(),
        rows: z.array(z.record(z.string(), z.any())),
        cooperacao: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // NOTA: coluna 'prazo' adicionada ao schema local mas migration pendente no Supabase.
        // Prazo é salvo/lido via localStorage no cliente (AppContext.tsx).
        // Para ativar no banco, rodar no Supabase SQL Editor:
        //   ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS prazo text;
        const relatorio = await createRelatorio({
          id: nanoid(),
          userId: ctx.user.id,
          casaId: input.casaId,
          agente: input.agente,
          rows: input.rows,
          status: "ativo",
          cooperacao: input.cooperacao || "0",
        });
        // Retorna com prazo do input para o cliente salvar no localStorage
        return relatorio ? { ...relatorio, prazoInput: input.prazo || null } : { success: false };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        agente: z.string().optional(),
        prazo: z.string().optional(),
        rows: z.array(z.record(z.string(), z.any())).optional(),
        cooperacao: z.string().optional(),
        status: z.enum(["ativo", "finalizado", "lixeira"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: Partial<InsertRelatorio> = {};
        if (input.agente !== undefined) updateData.agente = input.agente;
        // prazo omitido intencionalmente — coluna não existe no banco ainda
        // SQL para ativar: ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS prazo text;
        if (input.rows !== undefined) updateData.rows = input.rows;
        if (input.cooperacao !== undefined) updateData.cooperacao = input.cooperacao;
        if (input.status !== undefined) updateData.status = input.status;
        await updateRelatorio(input.id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await deleteRelatorio(input.id);
        return { success: true };
      }),
  }),

  contas: router({
    list: protectedProcedure.query(({ ctx }) =>
      getContasByUserId(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        usuario: z.string(),
        senha: z.string().optional(),
        valor: z.string().optional(),
        casa: z.string().optional(),
        status: z.enum(["sacado", "sacando", "bloqueado"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conta = await createConta({
          id: nanoid(),
          userId: ctx.user.id,
          usuario: input.usuario,
          senha: input.senha || undefined,
          valor: input.valor || undefined,
          casa: input.casa || undefined,
          status: input.status || "sacando",
        });
        return conta || { success: false };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        usuario: z.string().optional(),
        senha: z.string().optional(),
        valor: z.string().optional(),
        casa: z.string().optional(),
        status: z.enum(["sacado", "sacando", "bloqueado"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: Record<string, unknown> = {};
        if (input.usuario !== undefined) updateData.usuario = input.usuario;
        if (input.senha !== undefined) updateData.senha = input.senha;
        if (input.valor !== undefined) updateData.valor = input.valor;
        if (input.casa !== undefined) updateData.casa = input.casa;
        if (input.status !== undefined) updateData.status = input.status;
        await updateConta(input.id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await deleteConta(input.id);
        return { success: true };
      }),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const isRegularUser = ctx.user.role !== "admin";
      let settings = null;
      if (isRegularUser) {
        settings = await getAdminSettings();
      }
      if (!settings) {
        settings = await getUserSettings(ctx.user.id);
      }
      if (settings) {
        return {
          ...settings,
          fundoUrl: settings.fundoUrl || defaultFundoUrl
        };
      }
      return {
        userId: ctx.user.id,
        nomeApp: "RUAN DARK CPA",
        corPrimaria: "#2563EB",
        fundoUrl: defaultFundoUrl,
        logoUrl: null,
        nomeColorido: "Juan Dark",
        coresColorido: [],
        emojisColorido: [],
      };
    }),
    update: protectedProcedure
      .input(z.object({
        nomeApp: z.string().optional(),
        corPrimaria: z.string().optional(),
        fundoUrl: z.string().optional(),
        logoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserSettings(ctx.user.id, input);
        return { success: true };
      }),
    updateColorfulName: protectedProcedure
      .input(z.object({
        nomeColorido: z.string(),
        coresColorido: z.array(z.string()),
        emojisColorido: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Gastos Proxy router
  gastosProxy: router({
    list: protectedProcedure.query(({ ctx }) =>
      getGastosProxyByUserId(ctx.user.id)
    ),
    total: protectedProcedure.query(({ ctx }) =>
      getTotalGastosProxy(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({
        valor: z.string(),
        descricao: z.string().optional(),
        data: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const gastoId = nanoid();
        const gasto = await createGastoProxy({
          id: gastoId,
          userId: ctx.user.id,
          valor: input.valor,
          descricao: input.descricao,
          data: input.data as any, // string "yyyy-MM-dd" que o PostgreSQL date aceita
        });
        return gasto || { success: false };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        valor: z.string().optional(),
        descricao: z.string().optional(),
        data: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = { ...input };
        delete updateData.id;
        // data já vem como string "yyyy-MM-dd" — não converter para Date
        await updateGastoProxy(input.id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await deleteGastoProxy(input.id);
        return { success: true };
      }),
  }),

  // Slots router (catálogo GLOBAL — admin controla, todos visualizam)
  slots: router({
    list: protectedProcedure.query(async () => {
      return getSlots();
    }),
    create: adminProcedure
      .input(z.object({
        provider: z.string(),
        performance: z.string(),
        name: z.string(),
        tag: z.string().optional().default(""),
        image: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createSlot(input);
      }),
  }),

  // Plataformas (Calendário) router
  plataformas: router({
    list: protectedProcedure.query(async () => {
      return getPlataformas();
    }),
    seed: protectedProcedure
      .input(z.object({
        defaults: z.array(z.object({
          id: z.string(),
          nome: z.string(),
          diasPrazo: z.number(),
          dia: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        return seedPlataformasIfEmpty(input.defaults);
      }),
    // Edição restrita ao admin — apenas o admin controla a lista global; todos visualizam
    create: adminProcedure
      .input(z.object({
        id: z.string(),
        nome: z.string(),
        diasPrazo: z.number(),
        dia: z.string(),
      }))
      .mutation(async ({ input }) => {
        return createPlataforma(input);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.string(),
        nome: z.string().optional(),
        diasPrazo: z.number().optional(),
        dia: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePlataforma(id, data);
      }),
    delete: adminProcedure
      .input(z.object({
        id: z.string(),
      }))
      .mutation(async ({ input }) => {
        return deletePlataforma(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
