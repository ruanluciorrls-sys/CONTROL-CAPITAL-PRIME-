// Auto-update: detecta quando uma nova versão foi publicada e recarrega o app
// automaticamente — assim TODOS os usuários pegam as atualizações sem precisar
// limpar cache. Compara o arquivo principal (hash do Vite) da página carregada
// com o do index.html publicado agora.
import { toast } from "sonner";
import { isEditingActive } from "./syncLock";

let assetAtual: string | null = null;
let recarregando = false;

function extrairAsset(texto: string): string | null {
  const m = texto.match(/assets\/index-[\w-]+\.js/);
  return m ? m[0] : null;
}

async function checarAtualizacao(): Promise<void> {
  if (recarregando || typeof window === "undefined") return;
  try {
    const html = await fetch("/?_v=" + Date.now(), { cache: "no-store" }).then((r) => r.text());
    const publicado = extrairAsset(html);
    if (!publicado || !assetAtual) return;
    if (publicado !== assetAtual) {
      // Nova versão publicada — não interrompe quem está editando
      if (isEditingActive()) return;
      recarregando = true;
      toast.success("Nova versão disponível — atualizando...", { duration: 2500 });
      setTimeout(() => window.location.reload(), 2500);
    }
  } catch {
    /* falha de rede: ignora e tenta no próximo ciclo */
  }
}

export function iniciarAutoUpdate(): void {
  if (typeof document === "undefined") return;
  // Descobre o arquivo principal que ESTA página carregou
  assetAtual = Array.from(document.querySelectorAll("script"))
    .map((s) => extrairAsset((s as HTMLScriptElement).src || ""))
    .find((x): x is string => !!x) || null;

  // Checa a cada 1 min e ao voltar para a aba
  setInterval(checarAtualizacao, 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checarAtualizacao();
  });
  // Primeira checagem após 15s (dá tempo de carregar)
  setTimeout(checarAtualizacao, 15 * 1000);
}
