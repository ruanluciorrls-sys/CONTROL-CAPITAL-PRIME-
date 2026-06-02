import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Trash2, Edit2, Plus, X, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GastoProxy() {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: gastos = [], refetch } = trpc.gastosProxy.list.useQuery();
  const { data: totalGastos = 0 } = trpc.gastosProxy.total.useQuery();

  const createMutation = trpc.gastosProxy.create.useMutation({
    onSuccess: () => { refetch(); setValor(""); setDescricao(""); setData(format(new Date(), "yyyy-MM-dd")); },
  });

  const updateMutation = trpc.gastosProxy.update.useMutation({
    onSuccess: () => { refetch(); setValor(""); setDescricao(""); setData(format(new Date(), "yyyy-MM-dd")); setEditingId(null); },
  });

  const deleteMutation = trpc.gastosProxy.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || !data) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, valor, descricao: descricao || undefined, data });
    } else {
      await createMutation.mutateAsync({ valor, descricao: descricao || undefined, data });
    }
  };

  const handleEdit = (gasto: any) => {
    setEditingId(gasto.id);
    setValor(gasto.valor.toString());
    setDescricao(gasto.descricao || "");
    setData(gasto.data);
  };

  const handleCancel = () => {
    setEditingId(null);
    setValor("");
    setDescricao("");
    setData(format(new Date(), "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black"
          style={{
            background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Gasto com Proxy
        </h1>
        <p className="text-xs text-white/30 mt-0.5 uppercase tracking-widest">Registre e acompanhe seus gastos</p>
      </div>

      {/* Card Total */}
      <div className="relative overflow-hidden rounded-2xl p-6 border border-white/8"
        style={{ background: "linear-gradient(145deg, #070e20, #0f1e45)" }}
      >
        <div className="absolute top-0 left-0 w-full h-[1px]"
          style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5), transparent)" }}
        />
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-[#d4a017]/20"
            style={{ background: "rgba(212,160,23,0.08)" }}
          >
            <Zap size={14} className="text-[#d4a017]" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Total de Gastos com Proxy</p>
        </div>
        <p className="text-4xl md:text-5xl font-black tracking-tighter font-mono"
          style={{ color: "#f87171" }}
        >
          R$ {Number(totalGastos).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl p-5 border border-white/8"
        style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
          <h3 className="text-sm font-black text-white/90">
            {editingId ? "Editar Gasto" : "Adicionar Novo Gasto"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-transparent border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-[#d4a017] text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Data *</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-transparent border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-[#d4a017] text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Proxy servidor X"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-transparent border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-[#d4a017] text-sm placeholder:text-white/20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >
              <Plus size={16} />
              {editingId ? "Atualizar" : "Adicionar"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 border border-white/12 hover:bg-white/5 transition-colors"
              >
                <X size={14} /> Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de Gastos */}
      <div className="rounded-2xl border border-white/8 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
      >
        <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
            <h3 className="text-sm font-black text-white/90">Histórico de Gastos</h3>
          </div>
          <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">{gastos.length} registro(s)</span>
        </div>

        {gastos.length === 0 ? (
          <div className="p-12 text-center text-white/25 text-sm">Nenhum gasto registrado ainda</div>
        ) : (
          <div className="divide-y divide-white/5">
            {gastos.map((gasto: any) => (
              <div key={gasto.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-black text-[#f87171]">
                    R$ {Number(gasto.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {format(new Date(gasto.data + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    {gasto.descricao && ` — ${gasto.descricao}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(gasto)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/8 text-white/40 hover:text-[#d4a017] hover:border-[#d4a017]/30 transition-colors"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutateAsync({ id: gasto.id })}
                    disabled={deleteMutation.isPending}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-red-500/15 text-red-400/50 hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-40"
                    style={{ background: "rgba(239,68,68,0.04)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
