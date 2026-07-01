import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";

const TONS = {
  bom: { label: "Bom", cor: "#4ade80", emoji: "🟢" },
  ruim: { label: "Ruim / Cuidado", cor: "#f87171", emoji: "🔴" },
  neutro: { label: "Neutro", cor: "#94a3b8", emoji: "⚪" },
} as const;

type Tom = keyof typeof TONS;

/** Aviso/observação COMPARTILHADO de uma rede (todos os operadores veem e podem editar). */
export default function AvisoRede({ rede }: { rede?: string }) {
  const key = (rede || "").trim().toUpperCase();
  const utils = trpc.useUtils();
  const { data: notas = [] } = trpc.notasRede.list.useQuery(undefined, { enabled: !!key });
  const nota = (notas as any[]).find((n) => (n.rede || "").toUpperCase() === key);
  const upsert = trpc.notasRede.upsert.useMutation({ onSuccess: () => utils.notasRede.list.invalidate() });

  const [editing, setEditing] = useState(false);
  const [texto, setTexto] = useState("");
  const [tom, setTom] = useState<Tom>("neutro");

  if (!key) return null;

  const abrir = () => { setTexto(nota?.texto || ""); setTom((nota?.tom as Tom) || "neutro"); setEditing(true); };
  const salvar = () => {
    upsert.mutate({ rede: key, texto: texto.trim(), tom }, {
      onSuccess: () => { setEditing(false); toast.success("Aviso da rede salvo — todos os operadores veem!"); },
      onError: () => toast.error("Erro ao salvar o aviso"),
    });
  };

  if (editing) {
    return (
      <div className="rounded-xl p-3 border border-white/12" style={{ background: "rgba(255,255,255,0.03)" }}>
        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5">✍️ Aviso compartilhado — {key} (todos veem)</p>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} autoFocus
          placeholder="Ex.: Look tá bom · Gates rendeu · terça ruim, cuidado..."
          className="w-full rounded-lg p-2 text-sm bg-transparent text-white border border-white/15 focus:outline-none focus:border-[#d4a017] resize-none"
        />
        <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
          <div className="flex gap-1">
            {(["bom", "neutro", "ruim"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTom(t)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={tom === t ? { background: TONS[t].cor, color: "#050b18" } : { color: TONS[t].cor, background: `${TONS[t].cor}1a`, border: `1px solid ${TONS[t].cor}40` }}
              >{TONS[t].emoji} {TONS[t].label}</button>
            ))}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={salvar} disabled={upsert.isPending}
              className="px-2.5 py-1 rounded-lg text-[10px] font-black text-[#050b18] flex items-center gap-1 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#d4a017,#f59e0b)" }}
            ><Check size={11} /> Salvar</button>
            <button type="button" onClick={() => setEditing(false)} className="px-2 py-1 rounded-lg text-[10px] text-white/40 border border-white/10"><X size={11} /></button>
          </div>
        </div>
      </div>
    );
  }

  if (!nota || !nota.texto) {
    return (
      <button type="button" onClick={abrir} className="text-[10px] font-bold text-white/35 hover:text-[#d4a017] transition-colors flex items-center gap-1">
        <Pencil size={10} /> Adicionar aviso compartilhado da {key}
      </button>
    );
  }

  const tinfo = TONS[(nota.tom as Tom) || "neutro"] || TONS.neutro;
  return (
    <div className="rounded-xl p-2.5 border flex items-start gap-2" style={{ borderColor: `${tinfo.cor}40`, background: `${tinfo.cor}12` }}>
      <span className="text-sm leading-none mt-0.5">{tinfo.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: tinfo.cor }}>Aviso da {key} · todos veem</p>
        <p className="text-[12px] text-white/85 whitespace-pre-wrap break-words">{nota.texto}</p>
        {nota.atualizadoPor && <p className="text-[9px] text-white/25 mt-1">por {nota.atualizadoPor}</p>}
      </div>
      <button type="button" onClick={abrir} className="text-white/30 hover:text-[#d4a017] shrink-0" title="Editar aviso"><Pencil size={12} /></button>
    </div>
  );
}
