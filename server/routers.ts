import { COOKIE_NAME } from "@shared/const";
import { concluirReembolsoRelatorio, salvarValorReembolso } from "./db";
import { META_RECARGA_DECIMAL } from "@shared/recarga";
import { valorRecebidoDoReembolso } from "@shared/reembolso";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { getCasasByUserId, createCasa, updateCasa, deleteCasa, getRelatoriosByUserId, getRelatorioById, createRelatorio, updateRelatorio, deleteRelatorio, getContasByUserId, createConta, updateConta, deleteConta, getUserSettings, getPrimaryAdminId, updateUserSettings, getGastosProxyByUserId, createGastoProxy, updateGastoProxy, deleteGastoProxy, getTotalGastosProxy, verifyUserPassword, createUserWithPassword, listAllUsers, updateUserSubscription, toggleUserActive, updateUserPassword, getUserById, getSlots, createSlot, updateSlot, deleteSlot, hideSlotByName, getPixTags, createPixTag, deletePixTag, getChavesPix, createChavesPix, deleteChavesPix, setTagChaves, getPlataformas, createPlataforma, updatePlataforma, deletePlataforma } from "./db";
import { getJogosDaRede, getRedeNotas, publicarAvisoDaRede } from "./db";
import { savePushSubscription, deletePushSubscription, acumularCicloDia, getPushSoCelular, setPushSoCelular, logPush, getPushLog, getPlataformasPessoais, importarPlataformasCompartilhadas } from "./db";
import { getReceitasByUserId, createReceita, updateReceita, deleteReceita } from "./db";
import { getIdsRelatoriosReordenaveis, getOrdemRelatorios, salvarOrdemRelatorios } from "./db";
import { getPushPublicKey, sendPushToUser, fmtBRL, nomeDaMeta, enviarResumoDiaTeste, enviarLancamentosTeste, enviarPlataformasTeste } from "./push";
import { supabaseUploadJSON } from "./storage";
import { InsertRelatorio } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { sdk } from "./_core/sdk";
import fs from "fs";
import path from "path";
import { TRPCError } from "@trpc/server";

const plataformaInput = z.object({
  nome: z.string().trim().min(1).max(150).transform(nome => nome.toUpperCase()),
  diasPrazo: z.number().int().nonnegative().max(2147483647),
  dia: z.string().trim().toUpperCase().refine(
    dia => ["SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO", "DOMINGO"].includes(dia),
    "Selecione um dia da semana válido."
  ),
});
const plataformaId = z.string().trim().min(1).max(128);
const redeFeedInput = z.string().trim().toUpperCase().min(1).max(80)
  .refine(rede => !rede.includes("@"), "Informe uma rede válida.");
const metaRecargaInput = z.string().regex(META_RECARGA_DECIMAL)
  .refine(valor => Number(valor) > 0, "Informe um valor de recarga maior que zero.")
  .nullable().optional();

async function isPrimaryAdmin(user: { id: number; role: string }) {
  return user.role === "admin" && await getPrimaryAdminId() === user.id;
}

const primaryAdminProcedure = adminProcedure.use(async ({ ctx, next }) => {
  if (!await isPrimaryAdmin(ctx.user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso exclusivo do administrador principal." });
  }
  return next();
});

function publicUser<T extends { passwordHash: unknown }>(user: T) {
  const { passwordHash, ...profile } = user;
  return profile;
}

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
    me: publicProcedure.query(async ({ ctx }) => ctx.user && ({
      ...publicUser(ctx.user),
      isPrimaryAdmin: await isPrimaryAdmin(ctx.user),
    })),
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
        return { success: true, user: publicUser(user) };
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
      list: primaryAdminProcedure.query(async () => {
        return (await listAllUsers()).map(publicUser);
      }),
      create: primaryAdminProcedure
        .input(z.object({
          name: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["user", "admin"]).default("user"),
        }))
        .mutation(async ({ input }) => {
          const user = await createUserWithPassword(input);
          return user && publicUser(user);
        }),
      updateSubscription: primaryAdminProcedure
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
      resetPassword: primaryAdminProcedure
        .input(z.object({
          userId: z.number(),
          newPassword: z.string().min(6),
        }))
        .mutation(async ({ input }) => {
          await updateUserPassword(input.userId, input.newPassword);
          return { success: true };
        }),
      toggleActive: primaryAdminProcedure
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
        redeNome: z.string().optional(),
        media: z.string().optional(),
        linkCasa: z.string().optional(),
        linkContaFina: z.string().optional(),
        meta: z.string().optional(),
        metaRecarga: metaRecargaInput,
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
        redeNome: z.string().optional(),
        media: z.string().optional(),
        linkCasa: z.string().optional(),
        linkContaFina: z.string().optional(),
        meta: z.string().optional(),
        metaRecarga: metaRecargaInput,
        prazo: z.string().optional(),
        status: z.enum(["ativa", "finalizada", "lixeira"]).optional(),
        dataFim: z.string().optional(),
        reembolso: z.string().nullish(),
        reembolsadoEm: z.string().nullish(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...fields } = input;
        const updateData: any = { ...fields };
        if (input.reembolsadoEm !== undefined) updateData.reembolsadoEm = input.reembolsadoEm ? new Date(input.reembolsadoEm) : null;
        await updateCasa(id, ctx.user.id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCasa(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // Relatórios router
  relatorios: router({
    list: protectedProcedure.query(({ ctx }) =>
      getRelatoriosByUserId(ctx.user.id)
    ),
    ordem: protectedProcedure.query(({ ctx }) =>
      getOrdemRelatorios(ctx.user.id)
    ),
    reordenar: protectedProcedure
      .input(z.object({
        ids: z.array(z.string().min(1).max(128)).min(2).max(5000)
          .refine(ids => new Set(ids).size === ids.length, "A ordem nao pode repetir relatorios."),
      }))
      .mutation(async ({ ctx, input }) => {
        const permitidos = await getIdsRelatoriosReordenaveis(ctx.user.id, input.ids);
        if (permitidos.length !== input.ids.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A lista de relatorios ativos mudou." });
        }
        await salvarOrdemRelatorios(ctx.user.id, input.ids);
        return input.ids;
      }),
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
        etiqueta: z.string().optional(),
        jogos: z.string().optional(),
        compartilharJogos: z.object({ texto: z.string().trim().max(500) }).optional(),
        finalizadoEm: z.string().optional(), // usado na migração do localStorage
        valorReembolso: z.number().min(0).max(99999999.99).refine(n => n === Number(n.toFixed(2))).optional(),
        concluirReembolso: z.boolean().optional(),
        rows: z.array(z.record(z.string(), z.any())).optional(),
        cooperacao: z.string().optional(),
        status: z.enum(["ativo", "finalizado", "lixeira"]).optional(),
        reembolso: z.string().nullish(),
        reembolsadoEm: z.string().nullish(),
      }))
      .mutation(async ({ ctx, input }) => {
        const antes = await getRelatorioById(input.id, ctx.user.id);
        if (!antes) throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado." });

        if (input.valorReembolso !== undefined || input.concluirReembolso) {
          const valor = input.valorReembolso;
          if (valor === undefined || antes.status !== "ativo" || antes.reembolso !== "pendente") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Informe um valor para um reembolso pendente." });
          }
          const concluido = input.concluirReembolso ? await concluirReembolsoRelatorio(input.id, ctx.user.id, valor) : null;
          const ok = input.concluirReembolso ? Boolean(concluido) : await salvarValorReembolso(input.id, ctx.user.id, valor);
          if (!ok) throw new TRPCError({ code: "CONFLICT", message: "O reembolso já mudou. Recarregue os dados." });
          if (concluido) {
            try {
              const nome = await nomeDaMeta(concluido.userId, concluido.casaId, concluido.agente);
              const lucro = concluido.rows.reduce((s, r) => s + (Number(r.resultado) || 0), 0)
                + (Number(concluido.cooperacao) || 0) + valorRecebidoDoReembolso(concluido);
              await sendPushToUser(concluido.userId, {
                title: "Reembolso finalizado", body: `${nome} · Resultado: ${fmtBRL(lucro)}`,
                tag: `meta-fim-${concluido.id}`, url: "/",
              });
            } catch (e) { console.error("[Push] finalização de reembolso:", e); }
          }
          return { success: true };
        }

        const updateData: Partial<InsertRelatorio> = {};
        if (input.agente !== undefined) updateData.agente = input.agente;
        if (input.prazo !== undefined) updateData.prazo = input.prazo || null;
        if (input.etiqueta !== undefined) (updateData as any).etiqueta = input.etiqueta || null;
        if (input.jogos !== undefined) (updateData as any).jogos = input.jogos || null;
        if (input.rows !== undefined) updateData.rows = input.rows;
        if (input.cooperacao !== undefined) updateData.cooperacao = input.cooperacao;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.reembolso !== undefined) (updateData as any).reembolso = input.reembolso || null;
        if (input.reembolsadoEm !== undefined) (updateData as any).reembolsadoEm = input.reembolsadoEm ? new Date(input.reembolsadoEm) : null;
        // finalizadoEm: registra ao finalizar; limpa ao reutilizar; ou define o da migração
        if (input.status === "finalizado" && antes?.status !== "finalizado") {
          (updateData as any).finalizadoEm = new Date();
        } else if (input.status === "ativo") {
          (updateData as any).finalizadoEm = null;
        } else if (input.finalizadoEm !== undefined && !(antes as any)?.finalizadoEm) {
          (updateData as any).finalizadoEm = new Date(input.finalizadoEm);
        }
        if (input.compartilharJogos) {
          await updateRelatorio(input.id, ctx.user.id, updateData, { compartilharJogos: input.compartilharJogos });
        } else {
          await updateRelatorio(input.id, ctx.user.id, updateData);
        }

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
      .mutation(async ({ ctx, input }) => {
        await deleteRelatorio(input.id, ctx.user.id);
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
        maquina: z.string().optional(),
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
          maquina: input.maquina || undefined,
          status: input.status || "sacando",
        } as any);
        return conta || { success: false };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        usuario: z.string().optional(),
        senha: z.string().optional(),
        valor: z.string().optional(),
        casa: z.string().optional(),
        maquina: z.string().optional(),
        status: z.enum(["sacado", "sacando", "bloqueado"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: Record<string, unknown> = {};
        if (input.usuario !== undefined) updateData.usuario = input.usuario;
        if (input.senha !== undefined) updateData.senha = input.senha;
        if (input.valor !== undefined) updateData.valor = input.valor;
        if (input.casa !== undefined) updateData.casa = input.casa;
        if (input.maquina !== undefined) updateData.maquina = input.maquina;
        if (input.status !== undefined) updateData.status = input.status;
        await updateConta(input.id, ctx.user.id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deleteConta(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  settings: router({
    get: protectedProcedure.query(async () => {
      const adminId = await getPrimaryAdminId();
      const settings = adminId === undefined ? null : await getUserSettings(adminId);
      return {
        nomeApp: settings?.nomeApp ?? "RUAN DARK CPA",
        corPrimaria: settings?.corPrimaria ?? "#2563EB",
        fundoUrl: settings?.fundoUrl || defaultFundoUrl,
        logoUrl: settings?.logoUrl ?? null,
        tema: settings?.tema === "light" ? "light" as const : "dark" as const,
        nomeColorido: settings?.nomeColorido ?? "Juan Dark",
        coresColorido: settings?.coresColorido ?? [],
        emojisColorido: settings?.emojisColorido ?? [],
      };
    }),
    update: primaryAdminProcedure
      .input(z.object({
        nomeApp: z.string().optional(),
        corPrimaria: z.string().optional(),
        fundoUrl: z.string().optional(),
        logoUrl: z.string().optional(),
        tema: z.enum(["light", "dark"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateUserSettings(ctx.user.id, input);
        return { success: true };
      }),
    updateColorfulName: primaryAdminProcedure
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
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        valor: z.string().optional(),
        descricao: z.string().optional(),
        data: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateReceita(id, data as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await deleteReceita(input.id);
        return { success: true };
      }),
  }),

  // Slots router (catálogo compartilhado)
  slots: router({
    list: protectedProcedure.query(async () => {
      return getSlots();
    }),
    create: primaryAdminProcedure
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
    update: primaryAdminProcedure
      .input(z.object({
        id: z.number(),
        provider: z.string().optional(),
        performance: z.string().optional(),
        name: z.string().optional(),
        tag: z.string().optional(),
        image: z.string().optional(),
        hidden: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSlot(id, data);
        return { success: true };
      }),
    delete: primaryAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSlot(input.id);
        return { success: true };
      }),
    hide: primaryAdminProcedure
      .input(z.object({ name: z.string(), provider: z.string(), performance: z.string() }))
      .mutation(async ({ input }) => {
        await hideSlotByName(input.name, input.provider, input.performance);
        return { success: true };
      }),
  }),

  // Tags das Chaves PIX (por usuário)
  pixTags: router({
    list: protectedProcedure.query(({ ctx }) => getPixTags(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({ nome: z.string().min(1), cor: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return createPixTag({ id: nanoid(), userId: ctx.user.id, nome: input.nome, cor: input.cor });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deletePixTag(ctx.user.id, input.id);
        return { success: true };
      }),
  }),

  // Chaves PIX salvas (por usuário)
  chavesPix: router({
    list: protectedProcedure.query(({ ctx }) => getChavesPix(ctx.user.id)),
    importMany: protectedProcedure
      .input(z.object({
        chaves: z.array(z.object({
          chave: z.string(),
          tipo: z.string(),
          banco: z.string().optional(),
          tagId: z.string().nullish(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const list = input.chaves.map((c) => ({
          id: nanoid(), userId: ctx.user.id, chave: c.chave, tipo: c.tipo,
          banco: c.banco || null, tagId: c.tagId || null,
        }));
        await createChavesPix(list);
        return { count: list.length };
      }),
    delete: protectedProcedure
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        await deleteChavesPix(ctx.user.id, input.ids);
        return { success: true };
      }),
    setTag: protectedProcedure
      .input(z.object({ ids: z.array(z.string()), tagId: z.string().nullable() }))
      .mutation(async ({ ctx, input }) => {
        await setTagChaves(ctx.user.id, input.ids, input.tagId);
        return { success: true };
      }),
  }),

  // Feed global por plataforma, acessível apenas a usuários autenticados.
  notasRede: router({
    list: protectedProcedure.query(() => getRedeNotas()),
    avisos: protectedProcedure
      .input(z.object({ rede: redeFeedInput }))
      .query(({ input }) => getRedeNotas(input.rede)),
    jogos: protectedProcedure
      .input(z.object({ rede: redeFeedInput }))
      .query(({ input }) => getJogosDaRede(input.rede)),
    // O nome da rota é mantido para clientes antigos. Sempre cria um novo aviso.
    upsert: protectedProcedure
      .input(z.object({ rede: redeFeedInput, texto: z.string().trim().min(1).max(2000), tom: z.enum(["bom", "ruim", "neutro"]) }))
      .mutation(async ({ ctx, input }) => {
        await publicarAvisoDaRede(input.rede, input.texto, input.tom, ctx.user.name);
        return { success: true };
      }),
  }),

  // Plataformas (Calendário) router
  plataformas: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const [compartilhadas, pessoais] = await Promise.all([
        getPlataformas(), getPlataformasPessoais(ctx.user.id),
      ]);
      return [
        ...compartilhadas.map(item => ({ ...item, pessoal: false })),
        ...pessoais.map(item => ({ ...item, pessoal: true })),
      ];
    }),
    importarDoNavegador: primaryAdminProcedure
      .input(z.array(plataformaInput).max(500))
      .mutation(async ({ input }) => ({ total: await importarPlataformasCompartilhadas(input, nanoid) })),
    create: protectedProcedure
      .input(plataformaInput.extend({ id: plataformaId.optional() }))
      .mutation(async ({ ctx, input }) => {
        const userId = await isPrimaryAdmin(ctx.user) ? null : ctx.user.id;
        const item = await createPlataforma({ ...input, id: input.id ?? nanoid() }, userId);
        return { ...item, pessoal: userId !== null };
      }),
    update: protectedProcedure
      .input(plataformaInput.partial().extend({ id: plataformaId }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        if (!Object.keys(data).length) return;
        const userId = await isPrimaryAdmin(ctx.user) ? null : ctx.user.id;
        if (!await updatePlataforma(id, userId, data)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Plataforma não encontrada no seu calendário editável." });
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: plataformaId }))
      .mutation(async ({ ctx, input }) => {
        const userId = await isPrimaryAdmin(ctx.user) ? null : ctx.user.id;
        if (!await deletePlataforma(input.id, userId)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Plataforma não encontrada no seu calendário editável." });
        }
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
    // Teste: envia AGORA o resumo do dia (lucro real) para o próprio usuário
    testResumoDia: protectedProcedure.mutation(async ({ ctx }) => {
      return enviarResumoDiaTeste(ctx.user.id);
    }),
    // Teste: envia AGORA o aviso de lançamentos do dia
    testLancamentos: protectedProcedure.mutation(async ({ ctx }) => {
      return enviarLancamentosTeste(ctx.user.id);
    }),
    // Teste: envia AGORA as plataformas que lançam hoje (calendário)
    testPlataformas: protectedProcedure.mutation(async ({ ctx }) => {
      return enviarPlataformasTeste(ctx.user.id);
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
