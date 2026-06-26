import { useMemo, useState } from "react";
import { Search, Check, Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import slotsData from "../pages/slots_data.json";

interface Jogo { name: string; image?: string; provider?: string }

interface Props {
  /** Nomes separados por vírgula (compatível com o que já é salvo em rel.jogos) */
  value: string;
  onChange: (v: string) => void;
  /** Jogos da última vez nesta rede (sugestões de 1 clique) */
  sugestoes?: string[];
}

/** Seletor visual de jogos com capas dos slots premium (+ digitação manual). */
export default function SeletorJogos({ value, onChange, sugestoes = [] }: Props) {
  const [busca, setBusca] = useState("");
  const [manual, setManual] = useState("");
  const slotsQuery = trpc.slots.list.useQuery();

  const catalogo: Jogo[] = useMemo(() => {
    const all: Jogo[] = (slotsData as any[]).map((s) => ({ name: s.name, image: s.image, provider: s.provider }));
    (slotsQuery.data || []).forEach((cg: any) => {
      if (!all.some((g) => g.name.toLowerCase() === cg.name.toLowerCase())) {
        all.push({ name: cg.name, image: cg.image, provider: cg.provider });
      }
    });
    return all;
  }, [slotsQuery.data]);

  const selecionados = useMemo(() => value.split(",").map((s) => s.trim()).filter(Boolean), [value]);
  const selSet = useMemo(() => new Set(selecionados.map((s) => s.toLowerCase())), [selecionados]);

  const emitir = (arr: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    arr.forEach((n) => { const k = n.trim().toLowerCase(); if (n.trim() && !seen.has(k)) { seen.add(k); out.push(n.trim()); } });
    onChange(out.join(", "));
  };

  const toggle = (name: string) => {
    if (selSet.has(name.toLowerCase())) emitir(selecionados.filter((s) => s.toLowerCase() !== name.toLowerCase()));
    else emitir([...selecionados, name]);
  };
  const remover = (name: string) => emitir(selecionados.filter((s) => s.toLowerCase() !== name.toLowerCase()));
  const addManual = () => { const n = manual.trim(); if (!n) return; emitir([...selecionados, n]); setManual(""); };

  const imgDe = (name: string) => catalogo.find((g) => g.name.toLowerCase() === name.toLowerCase())?.image;

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? catalogo.filter((g) => g.name.toLowerCase().includes(q)) : catalogo;
  }, [busca, catalogo]);

  const sugestoesNovas = sugestoes.map((s) => s.trim()).filter(Boolean).filter((s) => !selSet.has(s.toLowerCase()));

  return (
    <div className="space-y-3">
      {/* Sugestões: jogos da última vez */}
      {sugestoesNovas.length > 0 && (
        <div className="rounded-xl p-2.5 border border-[#d4a017]/25" style={{ background: "rgba(212,160,23,0.06)" }}>
          <p className="text-[9px] font-black uppercase tracking-wider text-[#d4a017]/70 mb-1.5">🕑 Da última vez você usou — toque para reaproveitar</p>
          <div className="flex flex-wrap gap-1.5">
            {sugestoesNovas.map((s, i) => (
              <button key={i} type="button" onClick={() => emitir([...selecionados, s])}
                className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-lg text-[11px] font-bold text-[#f3d078] border border-[#d4a017]/30 hover:bg-[#d4a017]/15 transition-colors"
              >
                {imgDe(s)
                  ? <img src={imgDe(s)} alt="" className="w-4 h-4 rounded object-cover" />
                  : <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[8px]">🎰</span>}
                {s} <Plus size={11} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selecionados */}
      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selecionados.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-lg text-[11px] font-bold text-white border border-[#d4a017]/40"
              style={{ background: "rgba(212,160,23,0.18)" }}
            >
              {imgDe(s)
                ? <img src={imgDe(s)} alt="" className="w-5 h-5 rounded object-cover" />
                : <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[9px]">🎰</span>}
              {s}
              <button type="button" onClick={() => remover(s)} className="text-white/50 hover:text-white"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar jogo pela capa..."
          className="w-full pl-8 pr-3 py-2 rounded-lg text-sm bg-transparent text-white border border-white/15 focus:outline-none focus:border-[#d4a017]"
        />
      </div>

      {/* Grade de capas */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
        {filtrados.map((g) => {
          const sel = selSet.has(g.name.toLowerCase());
          return (
            <button key={g.name} type="button" onClick={() => toggle(g.name)}
              className="relative rounded-lg overflow-hidden border transition-all hover:-translate-y-0.5"
              style={{ borderColor: sel ? "#d4a017" : "rgba(255,255,255,0.1)", boxShadow: sel ? "0 0 0 1px #d4a017" : "none" }}
            >
              <div className="aspect-square bg-white/5">
                {g.image
                  ? <img src={g.image} loading="lazy" alt={g.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  : <div className="w-full h-full flex items-center justify-center text-lg">🎰</div>}
              </div>
              {sel && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(212,160,23,0.4)" }}>
                  <Check size={20} className="text-white" />
                </div>
              )}
              <p className="px-1 py-1 text-[8px] font-bold text-white/80 truncate text-center leading-tight">{g.name}</p>
            </button>
          );
        })}
        {filtrados.length === 0 && (
          <p className="col-span-full text-center text-xs text-white/30 py-4">Nenhum jogo encontrado</p>
        )}
      </div>

      {/* Digitar manualmente */}
      <div className="flex gap-2">
        <input value={manual} onChange={(e) => setManual(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManual(); } }}
          placeholder="Ou digite um jogo manualmente..."
          className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent text-white border border-white/15 focus:outline-none focus:border-[#d4a017]"
        />
        <button type="button" onClick={addManual}
          className="px-3 py-2 rounded-lg text-xs font-black text-[#050b18]"
          style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
        >Add</button>
      </div>
    </div>
  );
}
