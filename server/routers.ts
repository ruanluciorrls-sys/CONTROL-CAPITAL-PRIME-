import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getCasasByUserId, createCasa, updateCasa, deleteCasa, getRelatoriosByUserId, createRelatorio, updateRelatorio, deleteRelatorio, getContasByUserId, createConta, updateConta, deleteConta, getUserSettings, updateUserSettings, getGastosProxyByUserId, createGastoProxy, updateGastoProxy, deleteGastoProxy, getTotalGastosProxy, verifyUserPassword, createUserWithPassword, listAllUsers, updateUserSubscription, toggleUserActive, updateUserPassword, getUserById } from "./db";
import { supabaseUploadJSON } from "./storage";
import { InsertRelatorio } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { sdk } from "./_core/sdk";

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
        const relatorio = await createRelatorio({
          id: nanoid(),
          userId: ctx.user.id,
          casaId: input.casaId,
          agente: input.agente,
          prazo: input.prazo || null,
          rows: input.rows,
          status: "ativo",
          cooperacao: input.cooperacao || "0",
        } as any);
        return relatorio || { success: false };
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
        if (input.prazo !== undefined) (updateData as any).prazo = input.prazo;
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
      const settings = await getUserSettings(ctx.user.id);
      return settings || {
        userId: ctx.user.id,
        nomeApp: "RUAN DARK CPA",
        corPrimaria: "#2563EB",
        fundoUrl: null,
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
          data: new Date(input.data),
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
        if (updateData.data) {
          updateData.data = new Date(updateData.data);
        }
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
});

export type AppRouter = typeof appRouter;
