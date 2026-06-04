import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, X, Check, Calendar, Lock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface Plataforma {
  id: string;
  nome: string;
  diasPrazo: number;
  dia: string;
}

const STORAGE_KEY = "plataformas-calendario-v2";

const DIAS_SEMANA = [
  "SEGUNDA-FEIRA",
  "TERÇA-FEIRA",
  "QUARTA-FEIRA",
  "QUINTA-FEIRA",
  "SEXTA-FEIRA",
  "SÁBADO",
  "DOMINGO",
];

const DIAS_CURTOS: Record<string, string> = {
  "SEGUNDA-FEIRA": "SEG",
  "TERÇA-FEIRA": "TER",
  "QUARTA-FEIRA": "QUA",
  "QUINTA-FEIRA": "QUI",
  "SEXTA-FEIRA": "SEX",
  "SÁBADO": "SÁB",
  "DOMINGO": "DOM",
};

const COR_DIA: Record<string, string> = {
  "SEGUNDA-FEIRA": "#60a5fa",
  "TERÇA-FEIRA": "#34d399",
  "QUARTA-FEIRA": "#a78bfa",
  "QUINTA-FEIRA": "#f59e0b",
  "SEXTA-FEIRA": "#f87171",
  "SÁBADO": "#fb923c",
  "DOMINGO": "#e879f9",
};

const PLATAFORMAS_PADRAO: Plataforma[] = [
  { id: "1",  nome: "WE",      diasPrazo: 4, dia: "SEGUNDA-FEIRA" },
  { id: "2",  nome: "777CLUBE",diasPrazo: 3, dia: "SEGUNDA-FEIRA" },
  { id: "3",  nome: "EK",      diasPrazo: 4, dia: "TERÇA-FEIRA" },
  { id: "4",  nome: "VOY",     diasPrazo: 4, dia: "TERÇA-FEIRA" },
  { id: "5",  nome: "888",     diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "6",  nome: "MANGA",   diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "7",  nome: "ANJO",    diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "8",  nome: "GAME",    diasPrazo: 6, dia: "TERÇA-FEIRA" },
  { id: "9",  nome: "91",      diasPrazo: 3, dia: "QUARTA-FEIRA" },
  { id: "10", nome: "OKOK",    diasPrazo: 3, dia: "QUARTA-FEIRA" },
  { id: "11", nome: "A8",      diasPrazo: 7, dia: "QUARTA-FEIRA" },
  { id: "12", nome: "DY",      diasPrazo: 4, dia: "QUARTA-FEIRA" },
  { id: "13", nome: "MK",      diasPrazo: 4, dia: "QUARTA-FEIRA" },
  { id: "14", nome: "WP",      diasPrazo: 7, dia: "QUARTA-FEIRA" },
  { id: "15", nome: "W1",      diasPrazo: 3, dia: "QUINTA-FEIRA" },
  { id: "16", nome: "DZ",      diasPrazo: 0, dia: "QUINTA-FEIRA" },
  { id: "17", nome: "777CLUBE",diasPrazo: 4, dia: "QUINTA-FEIRA" },
  { id: "18", nome: "WE",      diasPrazo: 3, dia: "SEXTA-FEIRA" },
  { id: "19", nome: "MANGA",   diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "20", nome: "ANJO",    diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "21", nome: "888",     diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "22", nome: "VOY",     diasPrazo: 3, dia: "SÁBADO" },
  { id: "23", nome: "91",      diasPrazo: 4, dia: "SÁBADO" },
  { id: "24", nome: "EK",      diasPrazo: 3, dia: "SÁBADO" },
  { id: "25", nome: "W1",      diasPrazo: 4, dia: "DOMINGO" },
  { id: "26", nome: "DY",      diasPrazo: 3, dia: "DOMINGO" },
  { id: "27", nome: "MK",      diasPrazo: 3, dia: "DOMINGO" },
];

function carregarPlataformas(): Plataforma[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return PLATAFORMAS_PADRAO;
}

export default function Calendario() {
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Plataforma | null>(null);
  const [lixeira, setLixeira] = useState<Plataforma[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<"plataformas" | "lixeira">("plataformas");
  const [showForm, setShowForm] = useState(false);
  const [novaPlat, setNovaPlat] = useState({ nome: "", diasPrazo: 3, dia: "SEGUNDA-FEIRA" });

  const utils = trpc.useUtils();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // ── Fonte de dados GLOBAL: banco de dados (compartilhado por todos os usuários) ──
  const listQuery = trpc.plataformas.list.useQuery();
  const seedMutation = trpc.plataformas.seed.useMutation({
    onSuccess: () => utils.plataformas.list.invalidate(),
  });

  // Sincroniza o estado local com os dados do banco
  useEffect(() => {
    if (listQuery.data) {
      // Cache local para o Dashboard/Relatorios lerem instantaneamente
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(listQuery.data)); } catch {}
      window.dispatchEvent(new CustomEvent("plataformas-updated", { detail: listQuery.data }));
      setPlataformas(listQuery.data as Plataforma[]);
    }
  }, [listQuery.data]);

  // Na primeira vez (banco vazio), insere as plataformas padrão globalmente — apenas uma vez
  useEffect(() => {
    if (listQuery.isSuccess && Array.isArray(listQuery.data) && listQuery.data.length === 0 && !seedMutation.isPending) {
      seedMutation.mutate({ defaults: PLATAFORMAS_PADRAO });
    }
  }, [listQuery.isSuccess, listQuery.data]);

  const createMutation = trpc.plataformas.create.useMutation({
    onSuccess: () => utils.plataformas.list.invalidate(),
  });
  const updateMutation = trpc.plataformas.update.useMutation({
    onSuccess: () => utils.plataformas.list.invalidate(),
  });
  const deleteMutation = trpc.plataformas.delete.useMutation({
    onSuccess: () => utils.plataformas.list.invalidate(),
  });

  const handleAdicionar = async () => {
    if (!novaPlat.nome.trim()) {
      toast.error("Nome da plataforma é obrigatório");
      return;
    }
    const id = Date.now().toString();
    const nome = novaPlat.nome.trim().toUpperCase();
    const diasPrazo = novaPlat.diasPrazo;
    const dia = novaPlat.dia;

    // Eager update to keep UI fast
    const nova: Plataforma = { id, nome, diasPrazo, dia };
    setPlataformas([...plataformas, nova]);
    setNovaPlat({ nome: "", diasPrazo: 3, dia: "SEGUNDA-FEIRA" });
    setShowForm(false);

    try {
      await createMutation.mutateAsync({ id, nome, diasPrazo, dia });
      toast.success(`${nome} adicionada com sucesso!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar plataforma");
      // Rollback
      setPlataformas(plataformas);
    }
  };

  const handleDeletar = async (id: string) => {
    const plat = plataformas.find((p) => p.id === id);
    if (!plat) return;
    setLixeira([...lixeira, plat]);
    setPlataformas(plataformas.filter((p) => p.id !== id));

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success(`${plat.nome} movida para lixeira`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar plataforma");
      // Rollback
      setPlataformas(plataformas);
      setLixeira(lixeira.filter((p) => p.id !== id));
    }
  };

  const handleRestaurar = async (id: string) => {
    const plat = lixeira.find((p) => p.id === id);
    if (!plat) return;
    setPlataformas([...plataformas, plat]);
    setLixeira(lixeira.filter((p) => p.id !== id));

    try {
      await createMutation.mutateAsync({
        id: plat.id,
        nome: plat.nome,
        diasPrazo: plat.diasPrazo,
        dia: plat.dia
      });
      toast.success(`${plat.nome} restaurada!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao restaurar plataforma");
      // Rollback
      setPlataformas(plataformas.filter((p) => p.id !== id));
      setLixeira([...lixeira, plat]);
    }
  };

  const handleDeletarPermanente = (id: string) => {
    setLixeira(lixeira.filter((p) => p.id !== id));
    toast.success("Removida permanentemente");
  };

  const handleEditarSalvar = async () => {
    if (!editData) return;
    const oldPlataformas = plataformas;
    setPlataformas(plataformas.map((p) => (p.id === editData.id ? editData : p)));
    setEditandoId(null);
    setEditData(null);

    try {
      await updateMutation.mutateAsync({
        id: editData.id,
        nome: editData.nome,
        diasPrazo: editData.diasPrazo,
        dia: editData.dia
      });
      toast.success("Salvo!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar alterações");
      setPlataformas(oldPlataformas);
    }
  };

  const plataformasPorDia = DIAS_SEMANA.map((dia) => ({
    dia,
    cor: COR_DIA[dia],
    plats: plataformas.filter((p) => p.dia === dia),
  }));

  const inputClass = "w-full px-3 py-2 rounded-xl bg-transparent border border-white/15 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#d4a017] placeholder:text-white/20";
  const selectClass = "w-full px-3 py-2 rounded-xl bg-[#0a1428] border border-white/15 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#d4a017]";

  return (
    <div className="space-y-5">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white/95 dark:text-white">Gerenciamento de Plataformas</h2>
          <p className="text-[10px] text-white/60 dark:text-white/35 uppercase tracking-widest mt-0.5">
            Calendário GLOBAL — compartilhado com todos os usuários · prazos contam a partir do dia seguinte
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-[#050b18] transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >
              <Plus size={14} />
              Nova Plataforma
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white/40 border border-white/10"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <Lock size={12} /> Somente leitura
            </div>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 rounded-xl border border-white/10 w-fit"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        {[
          { id: "plataformas", label: `Plataformas (${plataformas.length})` },
          { id: "lixeira", label: `Lixeira (${lixeira.length})` },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setAbaAtiva(tab.id as any)}
            className="px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
            style={abaAtiva === tab.id ? {
              background: "linear-gradient(135deg, #d4a017, #f59e0b)",
              color: "#050b18",
            } : { color: "rgba(255,255,255,0.4)" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Formulário de Adição */}
      {showForm && abaAtiva === "plataformas" && (
        <div className="rounded-2xl p-5 border border-[#d4a017]/20 space-y-4"
          style={{ background: "rgba(212,160,23,0.04)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
            <h3 className="text-sm font-black text-white/80">Nova Plataforma</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Nome *</label>
              <input
                type="text"
                placeholder="Ex: VOY"
                value={novaPlat.nome}
                onChange={(e) => setNovaPlat({ ...novaPlat, nome: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Dias de Prazo</label>
              <input
                type="number"
                min={0}
                placeholder="3"
                value={novaPlat.diasPrazo || ""}
                onChange={(e) => setNovaPlat({ ...novaPlat, diasPrazo: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Dia da Semana</label>
              <select
                value={novaPlat.dia}
                onChange={(e) => setNovaPlat({ ...novaPlat, dia: e.target.value })}
                className={selectClass}
              >
                {DIAS_SEMANA.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleAdicionar}
                className="flex-1 py-2 rounded-xl font-bold text-xs text-[#050b18] transition-all hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
              >
                Adicionar
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-3 py-2 rounded-xl text-white/40 border border-white/12 hover:bg-white/5 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ABA PLATAFORMAS ===== */}
      {abaAtiva === "plataformas" && (
        <>
          {/* Grid de Colunas por Dia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plataformasPorDia.map(({ dia, cor, plats }) => (
              <div key={dia} className="rounded-2xl overflow-hidden border"
                style={{ background: "var(--card-bg-gradient)", borderColor: "var(--card-border-highlight)" }}
              >
                {/* Header do dia */}
                <div className="px-4 py-3 flex items-center justify-between border-b"
                  style={{ background: `${cor}10`, borderColor: "var(--card-border-highlight)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: cor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: cor }}
                    >
                      {DIAS_CURTOS[dia]}
                    </span>
                    <span className="text-[10px] text-white/55 dark:text-white/40 hidden sm:block">
                      {dia.split("-")[0]}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-white/55 dark:text-white/40 tabular-nums">
                    {plats.length}
                  </span>
                </div>

                {/* Lista de plataformas */}
                <div className="p-2 space-y-1 min-h-[60px]">
                  {plats.length === 0 ? (
                    <p className="text-[10px] text-white/45 dark:text-white/30 text-center py-4 italic">vazio</p>
                  ) : (
                    plats.map((plat) => (
                      <div key={plat.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl group transition-all border border-transparent"
                        style={{ background: "rgba(255,255,255,0.03)" }}
                      >
                        {/* Nome + Prazo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white/90 dark:text-white truncate">{plat.nome}</span>
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{
                                background: plat.diasPrazo === 0 ? "rgba(255,255,255,0.05)" : `${cor}18`,
                                color: plat.diasPrazo === 0 ? "rgba(255,255,255,0.4)" : cor,
                              }}
                            >
                              {plat.diasPrazo === 0 ? "—" : `+${plat.diasPrazo}d`}
                            </span>
                          </div>
                          <p className="text-[9px] text-white/50 dark:text-white/35 mt-0.5">
                            {plat.diasPrazo === 0
                              ? "Sem prazo"
                              : `${plat.diasPrazo} dia${plat.diasPrazo > 1 ? "s" : ""} após lançamento`}
                          </p>
                        </div>

                        {/* Ações — aparecem no hover (somente admin) */}
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => { setEditandoId(plat.id); setEditData({ ...plat }); }}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-[#d4a017] hover:bg-[#d4a01710] transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeletar(plat.id)}
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Mover para lixeira"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Card Total */}
            <div className="rounded-2xl p-4 border flex flex-col justify-between"
              style={{ background: "rgba(212,160,23,0.04)", borderColor: "var(--card-border-highlight)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-[#d4a017]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#d4a017]/70">Resumo</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/60 dark:text-white/35">Total plataformas</span>
                  <span className="text-sm font-black text-[#d4a017]">{plataformas.length}</span>
                </div>
                {DIAS_SEMANA.map((dia) => {
                  const count = plataformas.filter((p) => p.dia === dia).length;
                  if (count === 0) return null;
                  return (
                    <div key={dia} className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase" style={{ color: COR_DIA[dia] + "CC" }}>
                        {DIAS_CURTOS[dia]}
                      </span>
                      <span className="text-[10px] font-bold text-white/60 dark:text-white/45">{count}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-white/50 dark:text-white/30 mt-4 pt-3 border-t border-white/6 italic">
                ⚠ Prazos contam a partir do dia seguinte ao lançamento
              </p>
            </div>
          </div>

          {/* Tabela completa (visão alternativa) */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: "var(--card-bg-gradient)", borderColor: "var(--card-border-highlight)" }}
          >
            <div className="px-5 py-3 border-b flex items-center gap-2"
              style={{ borderColor: "var(--card-border-highlight)" }}
            >
              <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60 dark:text-white/45">Todas as plataformas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--card-border-highlight)", background: "rgba(255,255,255,0.02)" }}>
                    {["Plataforma", "Dia da Semana", "Prazo (dias)", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60 dark:text-white/40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...plataformas].sort((a, b) => DIAS_SEMANA.indexOf(a.dia) - DIAS_SEMANA.indexOf(b.dia)).map((plat) => (
                    <tr key={plat.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--card-border-highlight)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td className="px-5 py-3 font-black text-white/90 dark:text-white">{plat.nome}</td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                          style={{
                            background: `${COR_DIA[plat.dia]}15`,
                            color: COR_DIA[plat.dia],
                          }}
                        >
                          {plat.dia}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-black text-white/80 dark:text-white/90">
                          {plat.diasPrazo === 0 ? "—" : `+${plat.diasPrazo} dias`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {isAdmin ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setEditandoId(plat.id); setEditData({ ...plat }); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/8 text-white/30 hover:text-[#d4a017] hover:border-[#d4a017]/30 transition-colors"
                              style={{ background: "rgba(255,255,255,0.03)" }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeletar(plat.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center border border-red-500/12 text-red-400/40 hover:text-red-400 hover:border-red-500/30 transition-colors"
                              style={{ background: "rgba(239,68,68,0.03)" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end"><Lock size={12} className="text-white/15" /></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== ABA LIXEIRA ===== */}
      {abaAtiva === "lixeira" && (
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: "var(--card-bg-gradient)", borderColor: "var(--card-border-highlight)" }}
        >
          {lixeira.length === 0 ? (
            <div className="p-12 text-center text-white/20 text-sm">Lixeira vazia</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(239,68,68,0.03)" }}>
                  {["Plataforma", "Dia", "Prazo", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lixeira.map((plat) => (
                  <tr key={plat.id}
                    className="opacity-60"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td className="px-5 py-3 font-black text-white/50 line-through">{plat.nome}</td>
                    <td className="px-5 py-3 text-white/30 text-xs">{plat.dia}</td>
                    <td className="px-5 py-3 text-white/30 text-xs">{plat.diasPrazo}d</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleRestaurar(plat.id)}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-[#050b18] transition-all hover:scale-[1.02]"
                          style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => handleDeletarPermanente(plat.id)}
                          className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                          style={{ background: "rgba(239,68,68,0.05)" }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal de Edição */}
      {editandoId && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => { setEditandoId(null); setEditData(null); }}
        >
          <div className="rounded-2xl p-6 max-w-sm w-full space-y-4 relative border"
            style={{
              background: "var(--card-bg-gradient)",
              borderColor: "var(--card-border-highlight)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-[1px]"
              style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5), transparent)" }}
            />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white/90">Editar Plataforma</h3>
              <button onClick={() => { setEditandoId(null); setEditData(null); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/8 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Nome</label>
                <input type="text" value={editData.nome}
                  onChange={(e) => setEditData({ ...editData, nome: e.target.value.toUpperCase() })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Dias de Prazo</label>
                <input type="number" min={0} value={editData.diasPrazo}
                  onChange={(e) => setEditData({ ...editData, diasPrazo: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Dia da Semana</label>
                <select value={editData.dia}
                  onChange={(e) => setEditData({ ...editData, dia: e.target.value })}
                  className={selectClass}
                >
                  {DIAS_SEMANA.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleEditarSalvar}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
              >
                <Check size={14} /> Salvar
              </button>
              <button onClick={() => { setEditandoId(null); setEditData(null); }}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white/40 border border-white/12 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
