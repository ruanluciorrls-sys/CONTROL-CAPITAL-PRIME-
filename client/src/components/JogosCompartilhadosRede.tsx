import { useState } from "react";
import { trpc } from "@/lib/trpc";

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function AutorDataFeedRede({ autor, criadoEm }: { autor: string; criadoEm: Date }) {
  return (
    <p className="mt-1 text-[11px] text-white/55 [overflow-wrap:anywhere]">
      {autor} <span aria-hidden>·</span> <time dateTime={criadoEm.toISOString()}>{formatoData.format(criadoEm)}</time>
    </p>
  );
}

export function JogosCompartilhadosRede({ rede }: { rede: string }) {
  const [aberto, setAberto] = useState(false);
  const feed = trpc.notasRede.jogos.useQuery({ rede }, { enabled: aberto });

  return (
    <details onToggle={(event) => setAberto(event.currentTarget.open)}>
      <summary className="min-h-11 cursor-pointer content-center text-xs font-semibold text-white/65 hover:text-[#d4a017]">
        Jogos compartilhados da rede
      </summary>
      {aberto && (
        <div className="space-y-2">
          {feed.isPending && <p className="text-xs text-white/55" role="status">Carregando jogos...</p>}
          {feed.isError && (
            <button type="button" className="min-h-11 text-left text-xs text-[#d4a017]" onClick={() => void feed.refetch()}>
              Não foi possível carregar os jogos. Tentar novamente.
            </button>
          )}
          {feed.isSuccess && feed.data.length === 0 && (
            <p className="text-xs text-white/55">Nenhum jogo compartilhado nesta rede ainda.</p>
          )}
          {feed.data?.map(({ jogos, texto, autor, criadoEm }, index) => (
            <div key={`${criadoEm.toISOString()}-${index}`} className="min-w-0 rounded-xl border border-white/15 bg-white/[0.03] p-2.5">
              {jogos && <p className="whitespace-pre-wrap text-xs font-semibold text-white/85 [overflow-wrap:anywhere]">{jogos}</p>}
              {texto && <p className={`${jogos ? "mt-1 " : ""}whitespace-pre-wrap text-xs text-white/70 [overflow-wrap:anywhere]`}>{texto}</p>}
              <AutorDataFeedRede autor={autor} criadoEm={criadoEm} />
            </div>
          ))}
        </div>
      )}
    </details>
  );
}
