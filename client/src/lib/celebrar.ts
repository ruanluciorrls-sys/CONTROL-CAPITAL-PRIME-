// Dispara a animação de comemoração (confete + mensagem) de qualquer lugar do app.
export type CelebrarDetail = { valor?: number; mensagem?: string };

export function celebrar(detail: CelebrarDetail = {}) {
  try {
    window.dispatchEvent(new CustomEvent("cpa-celebrar", { detail }));
  } catch {
    // ambiente sem window (SSR) — ignora
  }
}
