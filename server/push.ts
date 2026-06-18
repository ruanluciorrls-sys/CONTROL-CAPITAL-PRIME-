// @ts-ignore - web-push não tem tipos embutidos
import webpush from "web-push";
import { getPushSubscriptionsByUser, getAllPushSubscriptions, deletePushSubscription, getCasasByUserId } from "./db";

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
  const subs = await getPushSubscriptionsByUser(userId);
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

/** Inicia o agendador: checa de hora em hora; envia o resumo diário às ~9h. */
export function iniciarAgendadorPush(): void {
  const tick = async () => {
    try {
      const agora = new Date();
      // servidor usa UTC; 12h UTC ≈ 9h no Brasil (UTC-3). Trava diária evita repetição.
      if (agora.getUTCHours() >= 12) {
        await checarPrazosEEnviar();
      }
    } catch (e) {
      console.error("[Push] Erro no agendador:", e);
    }
  };
  // primeira checagem após 1 min, depois a cada 60 min
  setTimeout(tick, 60 * 1000);
  setInterval(tick, 60 * 60 * 1000);
  console.log("[Push] Agendador de notificações iniciado.");
}
