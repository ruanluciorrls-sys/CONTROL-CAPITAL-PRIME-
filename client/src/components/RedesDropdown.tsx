import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { COR_DIA, DIAS_ORDER } from "@/lib/prazo";

interface RedesDropdownProps {
  plataformas: any[];
  onSelect: (dia: string, diasPrazo: number, nome: string) => void;
  /** Valor já selecionado (para exibir ao reabrir/editar) */
  value?: { nome: string; diasPrazo: number; dia: string } | null;
}

export default function RedesDropdown({ plataformas, onSelect, value }: RedesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ id?: string; nome: string; diasPrazo: number; dia: string } | null>(value ?? null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (value !== undefined) setSelected(value); }, [value]);

  const atualizarPosicao = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, left: r.left, width: r.width });
  };

  const abrir = () => { atualizarPosicao(); setOpen(true); };

  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => atualizarPosicao();
    const onClickFora = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    document.addEventListener("mousedown", onClickFora);
    return () => {
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
      document.removeEventListener("mousedown", onClickFora);
    };
  }, [open]);

  const handleSelect = (p: any) => {
    setSelected(p);
    onSelect(p.dia, p.diasPrazo, p.nome);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : abrir())}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/15 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#d4a017] bg-transparent text-foreground"
        style={open ? { borderColor: "rgba(212,160,23,0.5)" } : {}}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COR_DIA[selected.dia] }} />
            <span className="font-bold text-white/90 truncate">{selected.nome}</span>
            <span className="text-white/40 text-xs shrink-0">
              {selected.diasPrazo === 0 ? "Sem prazo" : `+${selected.diasPrazo}d`}
            </span>
          </span>
        ) : (
          <span className="text-white/30">Selecionar rede...</span>
        )}
        <ChevronDown size={14} className={`text-white/40 transition-transform shrink-0 ml-2 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && coords && createPortal(
        <div
          ref={panelRef}
          className="rounded-2xl overflow-hidden shadow-2xl border border-white/12"
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
            background: "#070e20",
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[1px]"
            style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.4), transparent)" }}
          />
          {DIAS_ORDER.map((dia) => {
            const plats = plataformas.filter((p: any) => p.dia === dia);
            if (!plats.length) return null;
            const cor = COR_DIA[dia];
            return (
              <div key={dia}>
                <div className="px-4 py-2 flex items-center gap-2 border-b border-white/5 sticky top-0"
                  style={{ background: "#0a1428" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cor }} />
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: cor }}>
                    {dia}
                  </span>
                </div>
                {plats.map((p: any) => {
                  const isSelected = selected?.id === p.id || (selected?.nome === p.nome && selected?.dia === p.dia);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect(p)}
                      className="w-full flex items-center justify-between px-5 py-2.5 text-left transition-all"
                      style={{ background: isSelected ? `${cor}22` : "#070e20" }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#070e20"; }}
                    >
                      <span className="font-black text-sm text-white/85">{p.nome}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                        style={{
                          background: p.diasPrazo === 0 ? "rgba(255,255,255,0.05)" : `${cor}20`,
                          color: p.diasPrazo === 0 ? "rgba(255,255,255,0.25)" : cor,
                        }}
                      >
                        {p.diasPrazo === 0 ? "Sem prazo" : `+${p.diasPrazo} dias`}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
