// @ts-ignore - web-push não tem tipos embutidos
import webpush from "web-push";
import { getPushSubscriptionsByUser, getAllPushSubscriptions, deletePushSubscription, getCasasByUserId, getPushSoCelular, getUsuariosComResumoDia, getResumoDia, getResumoFinalizadosPeriodo, diaBrasil } from "./db";

// Chaves VAPID — usa variáveis de ambiente (Fly secrets) se existirem,
// senão usa as chaves padrão (geradas para este app).
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "BKkNJlVPzuoYdnk4vYBWBnVPZ5idLEvXF6YrRTBprWC5miJn5V7pmgX3IQdlJyXWqxgD96aBe7538eE9adVBR0g";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "1Mg0jsh1eEN8ZptSU2zdY3kFZNkqw9gPgTTx43gVCws";

let vapidConfigurado = false;

/** Garante que o web-push está configurado com as chaves VAPID. */
async function garantirVapid(): Promise<boolean> {
  if (vapidConfigurado) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  try {
    webpush.setVapidDetails("mailto:admin@capitalprime.com", VAPID_PUBLIC, VAPID_PRIVATE);
    vapidConfigurado = true;
    return true;
  } catch (e) {
    console.error("[Push] Falha ao configurar VAPID:", e);
    return false;
  }
}

export async function getPushPublicKey(): Promise<string | null> {
  return VAPID_PUBLIC || null;
}

/** Formata valor em R$ com sinal (+/-). Ex.: +R$ 1.756,00 */
export function fmtBRL(v: number): string {
  return `${v >= 0 ? "+" : "-"}R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Monta o nome de exibição da meta: "CASA-agente" (sem traço/espaço sobrando). */
export async function nomeDaMeta(userId: number, casaId: string, agente?: string | null): Promise<string> {
  const casas = await getCasasByUserId(userId);
  const base = (casas.find((c) => c.id === casaId)?.nome || "Meta").replace(/[\s-]+$/, "").trim();
  return `${base}${agente ? `-${agente}` : ""}`;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushResult {
  total: number;   // aparelhos inscritos
  sent: number;    // entregues com sucesso
  failed: number;  // falharam
  removed: number; // inscrições expiradas removidas
  lastError?: string;
}

/** Envia uma notificação push para todos os aparelhos de um usuário. Retorna o resumo da entrega. */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<PushResult> {
  const result: PushResult = { total: 0, sent: 0, failed: 0, removed: 0 };
  if (!(await garantirVapid())) {
    result.lastError = "VAPID não configurado no servidor";
    return result;
  }
  let subs = await getPushSubscriptionsByUser(userId);
  // Opção "só celular": não envia para dispositivos marcados como desktop
  // (mantém celular e inscrições antigas sem device definido).
  if (await getPushSoCelular(userId)) {
    subs = subs.filter((s) => (s as any).device !== "desktop");
  }
  result.total = subs.length;
  const data = JSON.stringify(payload);
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(s.subscription as any, data);
      result.sent++;
    } catch (err: any) {
      // 404/410 = inscrição expirada -> remove
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await deletePushSubscription(s.endpoint);
        result.removed++;
      } else {
        result.failed++;
        result.lastError = `${err?.statusCode || ""} ${err?.body || err?.message || "erro desconhecido"}`.trim();
        console.error("[Push] Erro ao enviar:", err?.statusCode || err?.message);
      }
    }
  }));
  return result;
}

// ── Agendador de avisos de prazo ──
let ultimoEnvioDiario = "";

/** Verifica prazos das casas e envia push (1x ao dia por aparelho). */
async function checarPrazosEEnviar(): Promise<void> {
  const hojeStr = new Date().toISOString().slice(0, 10);
  if (ultimoEnvioDiario === hojeStr) return; // já enviou hoje

  if (!(await garantirVapid())) return;
  const subs = await getAllPushSubscriptions();
  if (subs.length === 0) return;

  const usuariosComPush = Array.from(new Set(subs.map((s) => s.userId)));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  for (const userId of usuariosComPush) {
    try {
      const casas = await getCasasByUserId(userId);
      const ativas = casas.filter((c) => c.status === "ativa" && c.prazo);
      const venceHoje: string[] = [];
      const vencidas: string[] = [];

      for (const casa of ativas) {
        const prazo = new Date((casa.prazo as string) + "T00:00:00");
        if (isNaN(prazo.getTime())) continue;
        const diff = Math.round((prazo.getTime() - hoje.getTime()) / 86400000);
        if (diff === 0) venceHoje.push(casa.nome);
        else if (diff < 0) vencidas.push(casa.nome);
      }

      if (venceHoje.length === 0 && vencidas.length === 0) continue;

      let body = "";
      if (venceHoje.length) body += `Vence hoje: ${venceHoje.slice(0, 4).join(", ")}${venceHoje.length > 4 ? "..." : ""}. `;
      if (vencidas.length) body += `Vencidas: ${vencidas.slice(0, 4).join(", ")}${vencidas.length > 4 ? "..." : ""}.`;

      await sendPushToUser(userId, {
        title: "⏰ Prazos de metas",
        body: body.trim(),
        url: "/",
      });
    } catch (e) {
      console.error("[Push] Erro ao checar prazos do usuário", userId, e);
    }
  }

  ultimoEnvioDiario = hojeStr;
  console.log("[Push] Avisos diários de prazo enviados:", hojeStr);
}

let ultimoResumoDiario = "";

/** Resumo do dia: "Hoje você lucrou R$ X em N ciclos" — enviado uma vez à noite. */
async function enviarResumoDiario(): Promise<void> {
  const dia = diaBrasil();
  if (ultimoResumoDiario === dia) return; // já enviou hoje
  const usuarios = await getUsuariosComResumoDia(dia);
  for (const userId of usuarios) {
    try {
      const r = await getResumoDia(userId, dia);
      if (!r || r.ciclos === 0) continue;
      const sinal = r.lucro >= 0 ? "lucrou" : "teve prejuízo de";
      await sendPushToUser(userId, {
        title: r.lucro >= 0 ? "📊 Resumo do dia" : "📊 Resumo do dia",
        body: `Hoje você ${sinal} ${fmtBRL(r.lucro)} em ${r.ciclos} ciclo${r.ciclos > 1 ? "s" : ""}.`,
        tag: `resumo-${dia}`,
        url: "/",
      });
    } catch (e) {
      console.error("[Push] Erro no resumo diário do usuário", userId, e);
    }
  }
  ultimoResumoDiario = dia;
  console.log("[Push] Resumo diário enviado:", dia);
}

// ── Helpers de horário de Brasília (UTC-3) ──
function brtAgora(): Date { return new Date(Date.now() - 3 * 3600 * 1000); }
function brtData(diaStr: string, hora: string): Date { return new Date(`${diaStr}T${hora}-03:00`); }

// Travas em memória (resetam a cada dia pela chave). Evitam reenvio no mesmo ciclo.
const locks = new Set<string>();
function travar(key: string): boolean {
  if (locks.has(key)) return true;
  locks.add(key);
  if (locks.size > 1000) locks.clear();
  return false;
}

/** Roda uma função para cada usuário que tem push ativo. */
async function paraCadaUsuarioComPush(fn: (userId: number) => Promise<void>): Promise<void> {
  if (!(await garantirVapid())) return;
  const subs = await getAllPushSubscriptions();
  const usuarios = Array.from(new Set(subs.map((s) => s.userId)));
  for (const userId of usuarios) {
    try { await fn(userId); } catch (e) { console.error("[Push] erro usuário", userId, e); }
  }
}

/** 8h/12h/17h — resumo dos lançamentos do dia. */
async function enviarLancamentosDia(hora: number): Promise<void> {
  const dia = diaBrasil();
  if (travar(`lanc-${dia}-${hora}`)) return;
  const ini = brtData(dia, "00:00:00");
  const fim = brtData(dia, "23:59:59");
  await paraCadaUsuarioComPush(async (userId) => {
    const ciclosDia = (await getResumoDia(userId, dia))?.ciclos || 0;
    const fin = await getResumoFinalizadosPeriodo(userId, ini, fim);
    if (ciclosDia === 0 && fin.metas === 0) return; // sem atividade hoje
    await sendPushToUser(userId, {
      title: "🗒️ Lançamentos de hoje",
      body: `${ciclosDia} ciclo(s) · ${fin.metas} meta(s) finalizada(s) · Lucro ${fmtBRL(fin.lucro)}`,
      tag: `lanc-${dia}-${hora}`,
      url: "/",
    });
  });
}

/** Relatório de período (dia/semana/mês) — lucro real das metas finalizadas. */
async function enviarResumoFinalizados(titulo: string, prefixo: string, ini: Date, fim: Date, lockKey: string): Promise<void> {
  if (travar(lockKey)) return;
  await paraCadaUsuarioComPush(async (userId) => {
    const fin = await getResumoFinalizadosPeriodo(userId, ini, fim);
    if (fin.metas === 0) return;
    await sendPushToUser(userId, {
      title: titulo,
      body: `${prefixo}: ${fin.metas} meta(s) · ${fin.lucro >= 0 ? "Lucro" : "Prejuízo"} ${fmtBRL(fin.lucro)}`,
      tag: lockKey,
      url: "/",
    });
  });
}

/** Agendador: prazos ~9h · lançamentos 8/12/17h · resumo 20h+23:59 · semanal (dom) · mensal. */
export function iniciarAgendadorPush(): void {
  const tick = async () => {
    try {
      const b = brtAgora();
      const h = b.getUTCHours();       // hora de Brasília
      const wd = b.getUTCDay();        // 0 = domingo
      const dia = diaBrasil();

      if (h >= 9) await checarPrazosEEnviar();                  // prazos das metas (~9h)
      if (h === 8 || h === 12 || h === 17) await enviarLancamentosDia(h); // lançamentos do dia
      if (h >= 20) await enviarResumoDiario();                  // resumo de ciclos (~20h, mantido)

      if (h === 23) {
        const ini = brtData(dia, "00:00:00");
        const fim = brtData(dia, "23:59:59");
        // Relatório do dia (lucro real)
        await enviarResumoFinalizados("📊 Relatório do dia", "Hoje", ini, fim, `dia2359-${dia}`);
        // Semanal — domingo (semana seg→dom)
        if (wd === 0) {
          const seg = new Date(b.getTime() - 6 * 86400000).toISOString().slice(0, 10);
          await enviarResumoFinalizados("📈 Resultado da semana", "Esta semana", brtData(seg, "00:00:00"), fim, `sem-${dia}`);
        }
        // Mensal — último dia do mês
        const amanha = new Date(b.getTime() + 86400000);
        if (amanha.getUTCMonth() !== b.getUTCMonth()) {
          const primeiro = dia.slice(0, 8) + "01";
          await enviarResumoFinalizados("🏆 Resultado do mês", "Este mês", brtData(primeiro, "00:00:00"), fim, `mes-${dia}`);
        }
      }
    } catch (e) {
      console.error("[Push] Erro no agendador:", e);
    }
  };
  setTimeout(tick, 60 * 1000);
  setInterval(tick, 15 * 60 * 1000); // a cada 15 min (pega todos os horários)
  console.log("[Push] Agendador de notificações iniciado.");
}
