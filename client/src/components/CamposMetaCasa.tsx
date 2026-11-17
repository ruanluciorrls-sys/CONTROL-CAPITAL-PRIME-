import { META_RECARGA_MAXIMA } from "@shared/recarga";

const labelClass = "block text-[10px] font-bold uppercase tracking-wider text-white/40";
const inputClass = "mt-1 w-full rounded-lg border border-white/15 bg-transparent px-3 py-2.5 text-base text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a017]";

export function BotaoRecarga({ ativa, onToggle }: { ativa: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={ativa} onClick={onToggle}
      className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs font-bold ${ativa ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200" : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"}`}>
      <span aria-hidden="true" className={`inline-flex h-4 w-7 items-center rounded-full px-0.5 ${ativa ? "justify-end bg-emerald-400/45" : "bg-white/15"}`}>
        <span className="h-3 w-3 rounded-full bg-current" />
      </span>
      Recarga
    </button>
  );
}

type CamposMetaCasaProps = {
  meta: number;
  media: number;
  metaRecarga: number | null;
  erroRecarga?: string;
  onChange: (campo: "meta" | "media" | "metaRecarga", valor: number) => void;
};

export default function CamposMetaCasa({ meta, media, metaRecarga, erroRecarga, onChange }: CamposMetaCasaProps) {
  if (metaRecarga !== null) {
    return (
      <div>
        <label className={labelClass}>
          Meta - Recarga (R$)
          <input type="number" inputMode="decimal" min="0.01" max={META_RECARGA_MAXIMA} step="0.01" required
            value={metaRecarga || ""} placeholder="Ex.: 10000" aria-invalid={Boolean(erroRecarga)}
            onChange={e => onChange("metaRecarga", Number(e.target.value) || 0)} className={inputClass} />
        </label>
        {erroRecarga && <p className="mt-1 text-xs text-red-400">{erroRecarga}</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className={labelClass}>
        Meta
        <input type="number" placeholder="0.00" value={meta || ""}
          onChange={e => onChange("meta", Number(e.target.value) || 0)} className={inputClass} />
      </label>
      <label className={labelClass}>
        Média
        <input type="number" placeholder="0.00" value={media || ""}
          onChange={e => onChange("media", Number(e.target.value) || 0)} className={inputClass} />
      </label>
    </div>
  );
}
