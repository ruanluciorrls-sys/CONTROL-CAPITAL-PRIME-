// Helpers de notificação push (Web Push) no navegador/celular

export function pushSuportado(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSuportado()) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch (e) {
    console.error("[Push] Falha ao registrar service worker:", e);
    return null;
  }
}

/** Pede permissão, registra o SW e cria a inscrição. Retorna o objeto de inscrição (JSON). */
export async function assinarPush(publicKey: string): Promise<any | null> {
  if (!pushSuportado()) throw new Error("Seu dispositivo não suporta notificações push.");
  if (!publicKey) throw new Error("Servidor sem chave de notificação configurada.");

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") throw new Error("Permissão de notificação negada.");

  const reg = (await navigator.serviceWorker.ready) || (await registrarServiceWorker());
  if (!reg) throw new Error("Não foi possível registrar o serviço de notificação.");

  // Reaproveita inscrição existente, se houver
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }
  return sub.toJSON();
}

export async function getInscricaoAtual(): Promise<PushSubscription | null> {
  if (!pushSuportado()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch { return null; }
}

/** Cancela a inscrição local. Retorna o endpoint removido (para avisar o servidor). */
export async function desassinarPush(): Promise<string | null> {
  const sub = await getInscricaoAtual();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  try { await sub.unsubscribe(); } catch {}
  return endpoint;
}

export function permissaoAtual(): NotificationPermission | "indisponivel" {
  if (!pushSuportado()) return "indisponivel";
  return Notification.permission;
}

/** No iPhone, o push só funciona com o app instalado na tela inicial (modo standalone). */
export function precisaInstalarIOS(): boolean {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  return ios && !standalone;
}
