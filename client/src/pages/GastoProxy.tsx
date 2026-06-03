import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, X, Edit2, Trash2, Zap, DollarSign, Calendar, TrendingDown, Wifi, MessageSquare, Camera, Bot, Server, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Tipos de custo ──────────────────────────────────────────
const TIPOS = [
  { id: "Proxy",                icon: Wifi,            color: "#60a5fa" },
  { id: "SMS",                  icon: MessageSquare,   color: "#34d399" },
  { id: "Postagem Instagram",   icon: Camera,          color: "#e879f9" },
  { id: "Bot / Automação",      icon: Bot,             color: "#f59e0b" },
  { id: "VPS / Servidor",       icon: Server,          color: "#a78bfa" },
  { id: "Outros",               icon: MoreHorizontal,  color: "#94a3b8" },
] as const;

type TipoId = typeof TIPOS[number]["id"];

// Guardar tipo na descricao com separador
const encodeTipo = (tipo: TipoId, nota: string) => `${tipo}:::${nota}`;
const decodeTipo = (descricao: string | null): { tipo: TipoId; nota: string } => {
  if (!descricao) return { tipo: "Outros", nota: "" };
  const idx = descricao.indexOf(":::");
  if (idx === -1) return { tipo: "Proxy", nota: descricao };
  return { tipo: descricao.slice(0, idx) as TipoId, nota: descricao.slice(idx + 3) };
};

const getTipoConfig = (id: string) => TIPOS.find((t) => t.id === id) ?? TIPOS[TIPOS.length - 1];

// ─── Modal de Novo/Editar Custo ──────────────────────────────
function ModalCusto({
  onClose,
  editItem,
  onSuccess,
}: {
  onClose: () => void;
  editItem?: any;
  onSuccess: () => void;
}) {
  const decoded = editItem ? decodeTipo(editItem.descricao) : { tipo: "Proxy" as TipoId, nota: "" };
  const [tipo, setTipo] = useState<TipoId>(decoded.tipo);
  const [valor, setValor] = useState(editItem ? editItem.valor.toString() : "");
  const [data, setData] = useState(editItem ? editItem.data : format(new Date(), "yyyy-MM-dd"));
  const [nota, setNota] = useState(decoded.nota);

  const createMutation = trpc.gastosProxy.create.useMutation({ onSuccess: () => { onSuccess(); onClose(); toast.success("Custo adicionado!"); } });
  const updateMutation = trpc.gastosProxy.update.useMutation({ onSuccess: () => { onSuccess(); onClose(); toast.success("Custo atualizado!"); } });

  const handleSubmit = () => {
    if (!valor || !data) return toast.error("Preencha valor e data.");
    const descricao = encodeTipo(tipo, nota);
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, valor, descricao, data });
    } else {
      createMutation.mutate({ valor, descricao, data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div className="rounded-2xl p-6 w-full max-w-sm space-y-5 relative"
        style={{
          background: "linear-gradient(145deg, #070e20, #0f1e45)",
          border: "1px solid rgba(212,160,23,0.25)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-[1px]"
          style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5), transparent)" }}
        />

        {/* Header modal */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#050b18]"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white/90">{editItem ? "Editar custo" : "Novo custo"}</h3>
              <p className="text-[10px] text-white/30">Registre um gasto operacional</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/8 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tipo */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-2">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(({ id, icon: Icon, color }) => (
              <button key={id} type="button" onClick={() => setTipo(id)}
                className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-[10px] font-bold transition-all"
                style={tipo === id ? {
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                  color,
                  boxShadow: `0 0 12px ${color}15`,
                } : {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                <Icon size={14} />
                <span className="text-center leading-tight">{id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Valor */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-1">Valor (R$)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-bold">R$</span>
            <input
              type="number" step="0.01" placeholder="0,00" value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-transparent border border-white/15 text-white text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#d4a017] placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Data */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-1">Data</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/15 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#d4a017]"
          />
        </div>

        {/* Nota */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/35 block mb-1">Nota (opcional)</label>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3}
            placeholder="Descrição do custo..."
            className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/15 text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#d4a017] placeholder:text-white/20"
          />
        </div>

        {/* Botão */}
        <button onClick={handleSubmit} disabled={isPending}
          className="w-full py-3 rounded-xl font-black text-sm text-[#050b18] transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
        >
          <Plus size={16} />
          {isPending ? "Salvando..." : editItem ? "Salvar alterações" : "Adicionar custo"}
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function GastoProxy() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const { data: gastos = [], refetch } = trpc.gastosProxy.list.useQuery();
  const deleteMutation = trpc.gastosProxy.delete.useMutation({ onSuccess: () => refetch() });

  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const custoHoje = useMemo(() =>
    (gastos as any[]).filter((g) => new Date(g.data + "T00:00:00") >= inicioHoje)
      .reduce((s, g) => s + Number(g.valor), 0), [gastos]);

  const custoMes = useMemo(() =>
    (gastos as any[]).filter((g) => new Date(g.data + "T00:00:00") >= inicioMes)
      .reduce((s, g) => s + Number(g.valor), 0), [gastos]);

  const totalGeral = useMemo(() =>
    (gastos as any[]).reduce((s, g) => s + Number(g.valor), 0), [gastos]);

  const mediaDia = custoMes > 0 ? custoMes / Math.max(hoje.getDate(), 1) : 0;

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black"
            style={{
              background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >Gastos / Despesas</h1>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Controle de custos operacionais</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
        >
          <Plus size={16} /> Adicionar custo
        </button>
      </div>

      {/* Três cards de sumário */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Custo do Dia */}
        <div className="rounded-2xl p-5 border border-white/8 relative overflow-hidden"
          style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
        >
          <div className="absolute left-0 top-0 w-[3px] h-full rounded-l-2xl" style={{ background: "#f87171" }} />
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Custo do Dia</p>
          <p className="text-3xl font-black" style={{ color: "#f87171" }}>{fmt(custoHoje)}</p>
          <p className="text-[10px] text-white/25 mt-2">
            {custoHoje === 0 ? "sem custo registrado hoje" : `${(gastos as any[]).filter((g) => new Date(g.data + "T00:00:00") >= inicioHoje).length} lançamento(s)`}
          </p>
        </div>

        {/* Lucro vs Custo Hoje */}
        <div className="rounded-2xl p-5 border border-white/8"
          style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
        >
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Resumo de Custos (Mês)</p>
          <div className="space-y-2">
            {TIPOS.map(({ id, color }) => {
              const v = (gastos as any[])
                .filter((g) => { const d = decodeTipo(g.descricao); return d.tipo === id && new Date(g.data + "T00:00:00") >= inicioMes; })
                .reduce((s, g) => s + Number(g.valor), 0);
              if (v === 0) return null;
              return (
                <div key={id} className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/40">{id}</span>
                  <span className="text-xs font-black" style={{ color }}>– {fmt(v)}</span>
                </div>
              );
            })}
            <div className="border-t border-white/8 pt-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Total mês</span>
              <span className="text-sm font-black text-white/80">{fmt(custoMes)}</span>
            </div>
          </div>
        </div>

        {/* Custo do Mês */}
        <div className="rounded-2xl p-5 border border-white/8 relative overflow-hidden"
          style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
        >
          <div className="absolute left-0 top-0 w-[3px] h-full rounded-l-2xl" style={{ background: "#d4a017" }} />
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Custo do Mês</p>
          <p className="text-3xl font-black" style={{ color: "#d4a017" }}>{fmt(custoMes)}</p>
          <p className="text-[10px] text-white/25 mt-2">Média de {fmt(mediaDia)}/dia</p>
        </div>
      </div>

      {/* Histórico */}
      <div className="rounded-2xl border border-white/8 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
      >
        <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
            <h3 className="text-sm font-black text-white/90">Histórico de custos</h3>
          </div>
          <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">{(gastos as any[]).length} registro(s) · Total: {fmt(totalGeral)}</span>
        </div>

        {(gastos as any[]).length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/8"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <DollarSign size={24} className="text-white/15" />
            </div>
            <div className="text-center">
              <p className="text-white/30 text-sm font-bold">Adicione seu primeiro custo</p>
              <p className="text-white/15 text-xs mt-1">e entenda para onde seu dinheiro está indo</p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#050b18]"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >
              <Plus size={15} /> Adicionar custo
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {[...(gastos as any[])].sort((a, b) => b.data.localeCompare(a.data)).map((g) => {
              const { tipo, nota } = decodeTipo(g.descricao);
              const cfg = getTipoConfig(tipo);
              const Icon = cfg.icon;
              return (
                <div key={g.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  {/* Ícone do tipo */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/6"
                    style={{ background: cfg.color + "12", color: cfg.color }}
                  >
                    <Icon size={15} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white/80">{tipo}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: cfg.color + "15", color: cfg.color }}
                      >
                        {format(new Date(g.data + "T12:00:00"), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                    {nota && <p className="text-[10px] text-white/25 truncate mt-0.5">{nota}</p>}
                  </div>

                  {/* Valor */}
                  <span className="font-black text-sm shrink-0" style={{ color: "#f87171" }}>
                    – {fmt(Number(g.valor))}
                  </span>

                  {/* Ações */}
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => { setEditItem(g); setShowModal(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/8 text-white/25 hover:text-[#d4a017] hover:border-[#d4a017]/30 transition-colors"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => deleteMutation.mutate({ id: g.id })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-red-500/12 text-red-400/35 hover:text-red-400 hover:border-red-500/30 transition-colors"
                      style={{ background: "rgba(239,68,68,0.04)" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <ModalCusto
          onClose={() => { setShowModal(false); setEditItem(null); }}
          editItem={editItem}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
