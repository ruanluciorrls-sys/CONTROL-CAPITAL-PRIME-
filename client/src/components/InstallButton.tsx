import { useState, useEffect } from "react";
import { Download, Share, Plus } from "lucide-react";
import { toast } from "sonner";

function estaInstalado(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

function ehIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

interface InstallButtonProps {
  variant?: "full" | "compact";
}

export default function InstallButton({ variant = "full" }: InstallButtonProps) {
  const [deferred, setDeferred] = useState<any>(() => (window as any).__deferredInstallPrompt || null);
  const [instalado, setInstalado] = useState(estaInstalado());
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    const onInstallable = () => setDeferred((window as any).__deferredInstallPrompt || null);
    const onInstalled = () => { setInstalado(true); setDeferred(null); };
    window.addEventListener("pwa-installable", onInstallable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwa-installable", onInstallable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Já instalado -> não mostra
  if (instalado) return null;

  const ios = ehIOS();
  // Se não dá pra instalar (sem prompt) e não é iOS, não mostra
  if (!deferred && !ios) return null;

  const handleClick = async () => {
    if (deferred) {
      deferred.prompt();
      try {
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") {
          setInstalado(true);
          toast.success("App instalado! Procure o ícone na tela inicial.");
        }
      } catch {}
      (window as any).__deferredInstallPrompt = null;
      setDeferred(null);
    } else if (ios) {
      setShowIOS(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 rounded-xl font-black uppercase tracking-wider text-[#050b18] transition-all duration-300 hover:scale-[1.02] ${
          variant === "full" ? "w-full py-2.5 text-[10px]" : "px-3 py-2 text-[10px]"
        }`}
        style={{ background: "linear-gradient(135deg, #34d399, #059669)", boxShadow: "0 4px 14px rgba(52,211,153,0.25)" }}
        title="Instalar app no aparelho"
      >
        <Download size={14} />
        Instalar app
      </button>

      {/* Instruções iOS */}
      {showIOS && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowIOS(false)}
        >
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ background: "linear-gradient(145deg, #070e20, #0f1e45)", border: "1px solid rgba(212,160,23,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-black text-white/90">Instalar no iPhone</h3>
            <div className="space-y-3 text-xs text-white/70">
              <p className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[#050b18] font-black shrink-0" style={{ background: "#d4a017" }}>1</span>
                Toque no botão <Share size={14} className="inline text-[#60a5fa]" /> <b>Compartilhar</b> (na barra do Safari)
              </p>
              <p className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[#050b18] font-black shrink-0" style={{ background: "#d4a017" }}>2</span>
                Escolha <Plus size={14} className="inline text-white/70" /> <b>Adicionar à Tela de Início</b>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[#050b18] font-black shrink-0" style={{ background: "#d4a017" }}>3</span>
                Abra o app pelo ícone novo e ative as notificações no sininho 🔔
              </p>
            </div>
            <button onClick={() => setShowIOS(false)}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-[#050b18]"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >Entendi</button>
          </div>
        </div>
      )}
    </>
  );
}
