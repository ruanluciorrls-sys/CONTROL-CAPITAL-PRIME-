import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getCasasByUserId, createCasa, updateCasa, deleteCasa, getRelatoriosByUserId, getRelatorioById, createRelatorio, updateRelatorio, deleteRelatorio, getContasByUserId, createConta, updateConta, deleteConta, getUserSettings, getAdminSettings, updateUserSettings, getGastosProxyByUserId, createGastoProxy, updateGastoProxy, deleteGastoProxy, getTotalGastosProxy, verifyUserPassword, createUserWithPassword, listAllUsers, updateUserSubscription, toggleUserActive, updateUserPassword, getUserById, getSlots, createSlot, getPlataformas, createPlataforma, updatePlataforma, deletePlataforma, seedPlataformasIfEmpty } from "./db";
import { savePushSubscription, deletePushSubscription, acumularCicloDia, getPushSoCelular, setPushSoCelular, logPush, getPushLog } from "./db";
import { getReceitasByUserId, createReceita, deleteReceita } from "./db";
import { getPushPublicKey, sendPushToUser, fmtBRL, nomeDaMeta } from "./push";
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
        const relatorio = await createRelatorio({
          id: nanoid(),
          userId: ctx.user.id,
          casaId: input.casaId,
          agente: input.agente,
          prazo: input.prazo || null,
          rows: input.rows,
          status: "ativo",
          cooperacao: input.cooperacao || "0",
        });
        // Push: meta iniciada (no servidor — sempre roda a versão nova, independe do cache do celular)
        try {
          const nome = await nomeDaMeta(ctx.user.id, input.casaId, input.agente);
          await sendPushToUser(ctx.user.id, {
            title: "🚀 Meta iniciada",
            body: `${nome} começou agora.`,
            tag: `meta-iniciada-${relatorio?.id ?? Date.now()}`,
            url: "/",
          });
        } catch (e) { console.error("[Push] meta iniciada:", e); }
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
      .mutation(async ({ ctx, input }) => {
        const antes = await getRelatorioById(input.id);

        const updateData: Partial<InsertRelatorio> = {};
        if (input.agente !== undefined) updateData.agente = input.agente;
        if (input.prazo !== undefined) updateData.prazo = input.prazo || null;
        if (input.rows !== undefined) updateData.rows = input.rows;
        if (input.cooperacao !== undefined) updateData.cooperacao = input.cooperacao;
        if (input.status !== undefined) updateData.status = input.status;
        await updateRelatorio(input.id, updateData);

        // Push (no servidor — confiável, independe do cache do celular)
        if (antes) {
          try {
            const nome = await nomeDaMeta(antes.userId, antes.casaId, antes.agente);

            // 1) Ciclo com RESULTADO = linha com SAQUE preenchido (o que importa é o resultado).
            //    Notifica quando o saque é posto e DE NOVO se o resultado mudar depois
            //    (ex.: esqueceu o baú e editou). Não dispara em exclusão (renumera as linhas).
            const naoDiminuiu = (input.rows?.length ?? 0) >= ((antes.rows as any[])?.length ?? 0);
            if (input.rows && naoDiminuiu) {
              const antesPorNumero = new Map<number, any>(
                ((antes.rows as any[]) || []).map((r) => [r.numero, r])
              );
              for (const ciclo of input.rows as any[]) {
                const temSaque = (Number(ciclo?.saque) || 0) > 0;
                if (!temSaque) continue; // sem saque ainda não há resultado pra avisar
                const rowAntes = antesPorNumero.get(ciclo.numero);
                const tinhaSaqueAntes = rowAntes ? (Number(rowAntes.saque) || 0) > 0 : false;
                const resultadoAntes = rowAntes ? (Number(rowAntes.resultado) || 0) : 0;
                const resultado = Number(ciclo?.resultado) || 0;
                const avisar = async () => {
                  await sendPushToUser(antes.userId, {
                    title: resultado >= 0 ? "💰 Lucro no ciclo" : "🔻 Prejuízo no ciclo",
                    body: `${nome} · Ciclo ${ciclo?.numero}: ${fmtBRL(resultado)}`,
                    tag: `ciclo-${input.id}-${ciclo?.numero}`,
                    url: "/",
                  });
                  await logPush(antes.userId, nome, `Ciclo ${ciclo?.numero}: ${fmtBRL(resultado)}`, resultado >= 0 ? "#4ade80" : "#f87171");
                };
                if (!tinhaSaqueAntes) {
                  // ciclo novo concluído -> avisa e soma no total do dia
                  await avisar();
                  await acumularCicloDia(antes.userId, resultado, 1);
                } else if (resultado !== resultadoAntes) {
                  // resultado mudou numa edição -> reavisa e ajusta o total do dia pelo delta
                  await avisar();
                  await acumularCicloDia(antes.userId, resultado - resultadoAntes, 0);
                }
              }
            }

            // 2) Meta finalizada -> lucro total (soma dos ciclos + cooperação)
            if (input.status === "finalizado" && antes.status !== "finalizado") {
              const rowsFinais = (input.rows as any[]) ?? (antes.rows as any[]) ?? [];
              const somaCiclos = rowsFinais.reduce((s, r) => s + (Number(r?.resultado) || 0), 0);
              const coop = Number(input.cooperacao ?? antes.cooperacao) || 0;
              const lucro = somaCiclos + coop;
              await sendPushToUser(antes.userId, {
                title: "🏁 Meta finalizada",
                body: `${nome} · Lucro total: ${fmtBRL(lucro)}`,
                tag: `meta-fim-${input.id}`,
                url: "/",
              });
            }
          } catch (e) { console.error("[Push] eventos de relatório:", e); }
        }

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

  // Receitas manuais (bônus / ganhos avulsos)
  receitas: router({
    list: protectedProcedure.query(({ ctx }) => getReceitasByUserId(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        valor: z.string(),
        descricao: z.string().optional(),
        data: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const receita = await createReceita({
          id: nanoid(),
          userId: ctx.user.id,
          valor: input.valor,
          descricao: input.descricao,
          data: input.data as any,
        });
        return receita || { success: false };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await deleteReceita(input.id);
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

  // Notificações Push (celular)
  push: router({
    publicKey: protectedProcedure.query(async () => {
      const key = await getPushPublicKey();
      return { publicKey: key };
    }),
    subscribe: protectedProcedure
      .input(z.object({ subscription: z.any(), device: z.enum(["mobile", "desktop"]).optional() }))
      .mutation(async ({ ctx, input }) => {
        await savePushSubscription(ctx.user.id, input.subscription, input.device);
        return { success: true };
      }),
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ input }) => {
        await deletePushSubscription(input.endpoint);
        return { success: true };
      }),
    test: protectedProcedure.mutation(async ({ ctx }) => {
      const r = await sendPushToUser(ctx.user.id, {
        title: "✅ Notificações ativadas!",
        body: "Você vai receber avisos de metas e ciclos aqui no celular.",
        url: "/",
        tag: `teste-${Date.now()}`,
      });
      return r; // { total, sent, failed, removed, lastError }
    }),
    // Disparo em tempo real (meta iniciada / ciclo / meta finalizada)
    notify: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        tag: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await sendPushToUser(ctx.user.id, {
          title: input.title,
          body: input.body,
          tag: input.tag,
          url: "/",
        });
        return { success: true };
      }),
    // Histórico de avisos (ciclos) para o sino
    historico: protectedProcedure.query(async ({ ctx }) => {
      return getPushLog(ctx.user.id, 30);
    }),
    // Preferência "só celular" (não enviar para desktops)
    soCelular: protectedProcedure.query(async ({ ctx }) => {
      return { soCelular: await getPushSoCelular(ctx.user.id) };
    }),
    setSoCelular: protectedProcedure
      .input(z.object({ soCelular: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await setPushSoCelular(ctx.user.id, input.soCelular);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
