import { useCallback, useState } from "react";
import { AlertTriangle } from "lucide-react";

type ConfirmOpts = { titulo?: string; mensagem: string; confirmar?: string; perigo?: boolean };
type Pendente = ConfirmOpts & { resolve: (v: boolean) => void };

/** Modal de confirmação bonito (substitui o confirm() do navegador). */
export function useConfirm() {
  const [pendente, setPendente] = useState<Pendente | null>(null);

  const confirm = useCallback((opts: ConfirmOpts | string) => {
    const o = typeof opts === "string" ? { mensagem: opts } : opts;
    return new Promise<boolean>((resolve) => setPendente({ ...o, resolve }));
  }, []);

  const fechar = (v: boolean) => { pendente?.resolve(v); setPendente(null); };

  const confirmEl = pendente ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={() => fechar(false)}
    >
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: "linear-gradient(145deg, #070e20, #0f1e45)", border: `1px solid ${pendente.perigo ? "rgba(248,113,113,0.3)" : "rgba(212,160,23,0.25)"}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: pendente.perigo ? "rgba(248,113,113,0.15)" : "rgba(212,160,23,0.15)", color: pendente.perigo ? "#f87171" : "#f3d078" }}
          >
            <AlertTriangle size={18} />
          </div>
          <h3 className="text-base font-black text-white">{pendente.titulo || "Confirmar"}</h3>
        </div>
        <p className="text-sm text-white/70">{pendente.mensagem}</p>
        <div className="flex gap-2 pt-1">
          <button onClick={() => fechar(false)}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white/50 border border-white/12 hover:bg-white/5 transition-colors"
          >Cancelar</button>
          <button onClick={() => fechar(true)}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]"
            style={pendente.perigo
              ? { background: "rgba(239,68,68,0.9)", color: "#fff" }
              : { background: "linear-gradient(135deg, #d4a017, #f59e0b)", color: "#050b18" }}
          >{pendente.confirmar || "Confirmar"}</button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, confirmEl };
}
