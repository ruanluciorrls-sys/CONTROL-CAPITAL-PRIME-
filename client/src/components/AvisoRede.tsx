import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";
import { AutorDataFeedRede, JogosCompartilhadosRede } from "./JogosCompartilhadosRede";

const TONS = {
  bom: { label: "Bom", cor: "#4ade80", emoji: "🟢" },
  ruim: { label: "Ruim / Cuidado", cor: "#f87171", emoji: "🔴" },
  neutro: { label: "Neutro", cor: "#94a3b8", emoji: "⚪" },
} as const;

type Tom = keyof typeof TONS;

export default function AvisoRede({ rede }: { rede?: string }) {
  const chave = rede?.trim().toUpperCase();
  if (!chave || chave.length > 80 || chave.includes("@")) return null;
  return <FeedRede key={chave} rede={chave} />;
}

function FeedRede({ rede }: { rede: string }) {
  const utils = trpc.useUtils();
  const avisos = trpc.notasRede.avisos.useQuery({ rede });
  const publicar = trpc.notasRede.upsert.useMutation({
    onSuccess: (_, input) => {
      void utils.notasRede.avisos.invalidate({ rede: input.rede });
      void utils.notasRede.list.invalidate();
    },
  });
  const [editing, setEditing] = useState(false);
  const [texto, setTexto] = useState("");
  const [tom, setTom] = useState<Tom>("neutro");

  const fechar = () => {
    setEditing(false);
    setTexto("");
    setTom("neutro");
  };

  const salvar = () => {
    if (!texto.trim() || publicar.isPending) return;
    publicar.mutate({ rede, texto: texto.trim(), tom }, {
      onSuccess: () => {
        fechar();
        toast.success("Aviso publicado para todos os operadores.");
      },
      onError: () => toast.error("Não foi possível publicar o aviso."),
    });
  };

  const [ultimo, ...anteriores] = avisos.data ?? [];
  return (
    <section className="min-w-0 space-y-2" aria-label={`Compartilhado na rede ${rede}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <p className="min-w-0 text-[10px] font-black uppercase tracking-wider text-[#d4a017] [overflow-wrap:anywhere]">
          Avisos da {rede}
        </p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex min-h-11 items-center gap-1.5 text-xs font-bold text-white/65 hover:text-[#d4a017]"
          >
            <Plus size={14} aria-hidden /> Novo aviso
          </button>
        )}
      </div>

      {editing && (
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-3">
          <label className="block text-xs font-semibold text-white/75">
            Seu aviso
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              maxLength={2000}
              autoFocus
              placeholder="O que os outros operadores precisam saber?"
              className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-transparent p-2 text-base text-white focus:outline-none focus:border-[#d4a017]"
            />
          </label>
          <p className="mt-1 text-[11px] text-white/55">Visível a todos os operadores. Não inclua dados de operação ou de contato.</p>
          <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Tom do aviso">
            {(["bom", "neutro", "ruim"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTom(t)}
                aria-pressed={tom === t}
                className="min-h-11 rounded-lg px-2.5 text-xs font-bold"
                style={tom === t
                  ? { background: TONS[t].cor, color: "#050b18" }
                  : { color: TONS[t].cor, background: `${TONS[t].cor}1a`, border: `1px solid ${TONS[t].cor}40` }}
              >
                {TONS[t].label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={fechar} disabled={publicar.isPending}
              className="min-h-11 rounded-lg border border-white/15 px-3 text-xs text-white/75 disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" onClick={salvar} disabled={publicar.isPending || !texto.trim()}
              className="flex min-h-11 items-center gap-1.5 rounded-lg bg-gradient-to-br from-[#d4a017] to-[#f59e0b] px-3 text-xs font-black text-[#050b18] disabled:opacity-50">
              <Check size={14} aria-hidden /> {publicar.isPending ? "Publicando..." : "Publicar aviso"}
            </button>
          </div>
        </div>
      )}

      {avisos.isPending && <p className="text-xs text-white/55" role="status">Carregando avisos...</p>}
      {avisos.isError && (
        <button type="button" className="min-h-11 text-left text-xs text-[#d4a017]" onClick={() => void avisos.refetch()}>
          Não foi possível carregar os avisos. Tentar novamente.
        </button>
      )}
      {ultimo && <CartaoAviso nota={ultimo} />}
      {anteriores.length > 0 && (
        <details>
          <summary className="min-h-11 cursor-pointer content-center text-xs font-semibold text-white/65 hover:text-[#d4a017]">
            {anteriores.length === 1 ? "Ver aviso anterior" : `Ver ${anteriores.length} avisos anteriores`}
          </summary>
          <div className="space-y-2">
            {anteriores.map(nota => <CartaoAviso key={nota.id} nota={nota} />)}
          </div>
        </details>
      )}
      <JogosCompartilhadosRede rede={rede} />
    </section>
  );
}

function CartaoAviso({ nota }: { nota: { texto: string; tom: string; atualizadoPor: string; atualizadoEm: Date } }) {
  const tinfo = nota.tom === "bom" || nota.tom === "ruim" ? TONS[nota.tom] : TONS.neutro;
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-xl border p-2.5"
      style={{ borderColor: `${tinfo.cor}40`, background: `${tinfo.cor}12` }}>
      <span className="mt-0.5 shrink-0 text-sm leading-none" role="img" aria-label={tinfo.label}>{tinfo.emoji}</span>
      <div className="min-w-0">
        <p className="whitespace-pre-wrap text-xs text-white/85 [overflow-wrap:anywhere]">{nota.texto}</p>
        <AutorDataFeedRede autor={nota.atualizadoPor} criadoEm={nota.atualizadoEm} />
      </div>
    </div>
  );
}
