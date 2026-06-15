import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Bell, Clock, AlertTriangle, CheckCircle2, X, Trophy, Smartphone, BellRing } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { pushSuportado, assinarPush, desassinarPush, getInscricaoAtual, permissaoAtual } from "@/lib/push";

const LIDAS_KEY = "notificacoes-lidas-v1";

interface Notificacao {
  id: string;
  titulo: string;
  msg: string;
  cor: string;
  ordem: number; // menor = mais urgente / mais recente
  icone: "vencido" | "hoje" | "proximo" | "finalizada";
}

function carregarLidas(): Set<string> {
  try {
    const raw = localStorage.getItem(LIDAS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function salvarLidas(set: Set<string>) {
  try { localStorage.setItem(LIDAS_KEY, JSON.stringify([...set])); } catch {}
}

export default function NotificationCenter() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);
  const [lidas, setLidas] = useState<Set<string>>(carregarLidas);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Push (celular) ──
  const [pushAtivo, setPushAtivo] = useState(false);
  const [pushCarregando, setPushCarregando] = useState(false);
  const publicKeyQuery = trpc.push.publicKey.useQuery(undefined, { retry: false });
  const subscribeMut = trpc.push.subscribe.useMutation();
  const unsubscribeMut = trpc.push.unsubscribe.useMutation();
  const testMut = trpc.push.test.useMutation();

  useEffect(() => {
    getInscricaoAtual().then((s) => setPushAtivo(!!s && permissaoAtual() === "granted"));
  }, []);

  const handleAtivarPush = async () => {
    const publicKey = publicKeyQuery.data?.publicKey;
    if (!publicKey) {
      toast.error("Notificações push ainda não configuradas no servidor.");
      return;
    }
    setPushCarregando(true);
    try {
      const subscription = await assinarPush(publicKey);
      await subscribeMut.mutateAsync({ subscription });
      setPushAtivo(true);
      toast.success("Notificações ativadas neste aparelho!");
      try { await testMut.mutateAsync(); } catch {}
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível ativar as notificações.");
    } finally {
      setPushCarregando(false);
    }
  };

  const handleDesativarPush = async () => {
    setPushCarregando(true);
    try {
      const endpoint = await desassinarPush();
      if (endpoint) await unsubscribeMut.mutateAsync({ endpoint });
      setPushAtivo(false);
      toast.success("Notificações desativadas neste aparelho.");
    } catch (e: any) {
      toast.error("Não foi possível desativar.");
    } finally {
      setPushCarregando(false);
    }
  };

  // Gera notificações: metas finalizadas (com lucro) + prazos vencendo
  const notificacoes = useMemo<Notificacao[]>(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const finalizadas: Notificacao[] = [];
    const prazos: Notificacao[] = [];
    const SETE_DIAS = 7 * 86400000;

    const getCasaNome = (casaId: string) =>
      (state.casas.find((c) => c.id === casaId)?.nome || "Meta").replace(/[\s-]+$/, "").trim();

    // 1) Metas finalizadas recentemente (últimos 7 dias) — mostra o lucro
    for (const rel of state.relatorios.filter((r) => r.status === "finalizado")) {
      const fimMs = rel.finalizadoEm ? new Date(rel.finalizadoEm).getTime() : 0;
      if (!fimMs || (Date.now() - fimMs) > SETE_DIAS) continue; // só recentes
      const lucro = (Array.isArray(rel.rows) ? rel.rows.reduce((s, row) => s + (Number(row.resultado) || 0), 0) : 0) + (Number(rel.cooperacao) || 0);
      const nome = `${getCasaNome(rel.casaId)}${rel.agente ? `-${rel.agente}` : ""}`;
      finalizadas.push({
        id: `meta-fim-${rel.id}`,
        titulo: nome,
        msg: `Meta finalizada · Lucro ${lucro >= 0 ? "+" : ""}R$ ${lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        cor: lucro >= 0 ? "#4ade80" : "#f87171",
        ordem: -fimMs, // mais recente primeiro
        icone: "finalizada",
      });
    }
    finalizadas.sort((a, b) => a.ordem - b.ordem);

    // 2) Prazos das casas ativas (vencido / hoje / próximos)
    for (const casa of state.casas.filter((c) => c.status === "ativa" && c.prazo)) {
      const prazo = new Date(casa.prazo + "T00:00:00");
      if (isNaN(prazo.getTime())) continue;
      const diff = Math.round((prazo.getTime() - hoje.getTime()) / 86400000);
      if (diff < 0) {
        prazos.push({ id: `casa-${casa.id}-${casa.prazo}`, titulo: casa.nome, msg: `Prazo vencido há ${Math.abs(diff)} dia${Math.abs(diff) > 1 ? "s" : ""}`, cor: "#f87171", ordem: diff, icone: "vencido" });
      } else if (diff === 0) {
        prazos.push({ id: `casa-${casa.id}-${casa.prazo}`, titulo: casa.nome, msg: "Vence HOJE!", cor: "#fb923c", ordem: diff, icone: "hoje" });
      } else if (diff <= 2) {
        prazos.push({ id: `casa-${casa.id}-${casa.prazo}`, titulo: casa.nome, msg: `Vence em ${diff} dia${diff > 1 ? "s" : ""}`, cor: "#f59e0b", ordem: diff, icone: "proximo" });
      }
    }
    prazos.sort((a, b) => a.ordem - b.ordem);

    // Finalizadas (boas notícias) no topo, depois os prazos
    return [...finalizadas, ...prazos];
  }, [state.casas, state.relatorios]);

  const naoLidas = notificacoes.filter((n) => !lidas.has(n.id));
  const totalNaoLidas = naoLidas.length;

  const atualizarPosicao = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const PAINEL_ALTURA = 420; // altura estimada do painel

    // Horizontal: sino na metade esquerda -> abre para a DIREITA; senão para a ESQUERDA
    const horiz: { left?: number; right?: number } =
      r.left < window.innerWidth / 2
        ? { left: Math.max(r.left, 8) }
        : { right: Math.max(window.innerWidth - r.right, 8) };

    // Vertical: pouco espaço abaixo (sino no rodapé) -> abre para CIMA
    const espacoAbaixo = window.innerHeight - r.bottom;
    const vert: { top?: number; bottom?: number } =
      espacoAbaixo < PAINEL_ALTURA && r.top > espacoAbaixo
        ? { bottom: window.innerHeight - r.top + 8 }
        : { top: r.bottom + 8 };

    setCoords({ ...horiz, ...vert });
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

  const marcarTodasLidas = () => {
    const novo = new Set(lidas);
    notificacoes.forEach((n) => novo.add(n.id));
    setLidas(novo);
    salvarLidas(novo);
  };

  const Icone = ({ tipo }: { tipo: Notificacao["icone"] }) => {
    if (tipo === "finalizada") return <Trophy size={14} />;
    if (tipo === "vencido") return <AlertTriangle size={14} />;
    return <Clock size={14} />;
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : abrir())}
        className="relative p-2 rounded-xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
        style={{
          color: totalNaoLidas > 0 ? "#d4a017" : "rgba(255,255,255,0.6)",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        title="Notificações"
        aria-label="Notificações"
      >
        <Bell size={18} className={totalNaoLidas > 0 ? "animate-pulse" : ""} />
        {totalNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-black text-[#050b18]"
            style={{ background: "#f87171", boxShadow: "0 0 8px rgba(248,113,113,0.6)" }}
          >
            {totalNaoLidas > 9 ? "9+" : totalNaoLidas}
          </span>
        )}
      </button>

      {open && coords && createPortal(
        <div
          ref={panelRef}
          className="rounded-2xl overflow-hidden shadow-2xl border border-white/12"
          style={{
            position: "fixed",
            ...(coords.top !== undefined ? { top: coords.top } : { bottom: coords.bottom }),
            ...(coords.left !== undefined ? { left: coords.left } : { right: coords.right }),
            width: 320,
            maxWidth: "calc(100vw - 16px)",
            zIndex: 9999,
            background: "#070e20",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          }}
        >
          <div className="absolute top-0 left-0 w-full h-[1px]"
            style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5), transparent)" }}
          />
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8"
            style={{ background: "rgba(212,160,23,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[#d4a017]" />
              <span className="text-sm font-black text-white/90">Notificações</span>
            </div>
            <div className="flex items-center gap-2">
              {totalNaoLidas > 0 && (
                <button onClick={marcarTodasLidas}
                  className="text-[10px] font-bold text-[#d4a017] hover:text-[#f3d078] transition-colors"
                >
                  Marcar lidas
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/8 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[360px] overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                <CheckCircle2 size={28} className="text-emerald-400/50" />
                <p className="text-xs text-white/40">Tudo em dia!</p>
                <p className="text-[10px] text-white/20">Nenhum aviso no momento</p>
              </div>
            ) : (
              notificacoes.map((n) => {
                const lida = lidas.has(n.id);
                return (
                  <div key={n.id}
                    className="flex items-start gap-3 px-4 py-3 border-b border-white/5 transition-colors"
                    style={{ background: lida ? "transparent" : `${n.cor}0a` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = lida ? "transparent" : `${n.cor}0a`)}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/8"
                      style={{ background: `${n.cor}15`, color: n.cor }}
                    >
                      <Icone tipo={n.icone} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white/85 truncate">{n.titulo}</p>
                      <p className="text-[11px] font-bold" style={{ color: n.cor }}>{n.msg}</p>
                    </div>
                    {!lida && <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: n.cor }} />}
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé: ativar notificações no celular */}
          {pushSuportado() && (
            <div className="px-4 py-3 border-t border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>
              {pushAtivo ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                    <BellRing size={13} /> Avisos no celular ativos
                  </span>
                  <button onClick={handleDesativarPush} disabled={pushCarregando}
                    className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
                  >
                    Desativar
                  </button>
                </div>
              ) : (
                <button onClick={handleAtivarPush} disabled={pushCarregando}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-[#050b18] transition-all hover:scale-[1.01] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                >
                  <Smartphone size={14} />
                  {pushCarregando ? "Ativando..." : "Ativar notificações no celular"}
                </button>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
