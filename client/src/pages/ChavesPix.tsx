import React, { useState, useMemo, useRef, useEffect } from "react";
import { Copy, Trash2, Upload, Download, Search, Plus, X, Tag as TagIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type PixType = "TELEFONE" | "CPF" | "EMAIL" | "EVP" | "DESCONHECIDO";

const CORES_TAG = ["#d4a017", "#4ade80", "#60a5fa", "#a78bfa", "#fb923c", "#f87171", "#22d3ee", "#f472b6", "#e879f9", "#94a3b8"];

const detectPixType = (key: string): PixType => {
  const cleanKey = key.trim();
  if (!cleanKey) return "DESCONHECIDO";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanKey)) return "EMAIL";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanKey)) return "EVP";
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cleanKey)) return "CPF";
  const digitos = cleanKey.replace(/\D/g, "");
  const temFormatoTelefone = /[()+\s-]/.test(cleanKey);
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return "TELEFONE";
  if (digitos.length === 10) return "TELEFONE";
  if (digitos.length === 11) {
    const ddd = parseInt(digitos.slice(0, 2), 10);
    const ehCelular = digitos[2] === "9" && ddd >= 11 && ddd <= 99;
    if (temFormatoTelefone || ehCelular) return "TELEFONE";
    return "CPF";
  }
  if (temFormatoTelefone && digitos.length >= 8 && digitos.length <= 15) return "TELEFONE";
  return "DESCONHECIDO";
};

const CORES_TIPO: Record<string, string> = {
  TELEFONE: "#60a5fa", CPF: "#fb923c", EMAIL: "#a78bfa", EVP: "#d4a017", DESCONHECIDO: "#ffffff60",
};

interface DbChave { id: string; chave: string; tipo: string; banco?: string | null; tagId?: string | null }
interface DbTag { id: string; nome: string; cor: string }

export default function ChavesPix() {
  const utils = trpc.useUtils();
  const keysQuery = trpc.chavesPix.list.useQuery();
  const tagsQuery = trpc.pixTags.list.useQuery();
  const keysList: DbChave[] = (keysQuery.data as any[]) || [];
  const tags: DbTag[] = (tagsQuery.data as any[]) || [];

  const importMutation = trpc.chavesPix.importMany.useMutation({ onSuccess: () => utils.chavesPix.list.invalidate() });
  const deleteMutation = trpc.chavesPix.delete.useMutation({ onSuccess: () => utils.chavesPix.list.invalidate() });
  const setTagMutation = trpc.chavesPix.setTag.useMutation({ onSuccess: () => utils.chavesPix.list.invalidate() });
  const createTagMutation = trpc.pixTags.create.useMutation({ onSuccess: () => utils.pixTags.list.invalidate() });
  const deleteTagMutation = trpc.pixTags.delete.useMutation({ onSuccess: () => { utils.pixTags.list.invalidate(); utils.chavesPix.list.invalidate(); } });

  const [importText, setImportText] = useState("");
  const [bankName, setBankName] = useState("");
  const [filterType, setFilterType] = useState<PixType | "TODOS">("TODOS");
  const [filterTag, setFilterTag] = useState<string>("TODAS"); // "TODAS" | "SEM" | tagId
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Criação de tag
  const [novaTagNome, setNovaTagNome] = useState("");
  const [novaTagCor, setNovaTagCor] = useState(CORES_TAG[0]);
  const [showTagMenu, setShowTagMenu] = useState(false);

  // ── Migração única do localStorage antigo para o banco ──
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current || keysQuery.isLoading) return;
    try {
      if (localStorage.getItem("chaves-pix-migrated-v2")) { migratedRef.current = true; return; }
      const old = JSON.parse(localStorage.getItem("chaves-pix-v1") || "[]");
      if (Array.isArray(old) && old.length > 0) {
        const chaves = old.map((k: any) => ({ chave: k.key, tipo: k.type || detectPixType(k.key), banco: k.bank || undefined }));
        importMutation.mutate({ chaves }, {
          onSuccess: () => {
            localStorage.setItem("chaves-pix-migrated-v2", "1");
            localStorage.removeItem("chaves-pix-v1");
            toast.success(`${chaves.length} chave(s) antigas salvas no painel`);
          },
        });
      } else {
        localStorage.setItem("chaves-pix-migrated-v2", "1");
      }
      migratedRef.current = true;
    } catch { migratedRef.current = true; }
  }, [keysQuery.isLoading]); // eslint-disable-line

  const tagDe = (id?: string | null) => tags.find((t) => t.id === id);

  const handleImport = () => {
    if (!importText.trim()) { toast.error("Insira as chaves para importar"); return; }
    const lines = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    const chaves = lines.map((l) => ({ chave: l, tipo: detectPixType(l), banco: bankName.trim() || undefined }));
    importMutation.mutate({ chaves }, {
      onSuccess: () => { setImportText(""); setBankName(""); toast.success(`${chaves.length} chave(s) salva(s) no painel`); },
      onError: () => toast.error("Erro ao salvar as chaves"),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const chaves: { chave: string; tipo: string; banco?: string }[] = [];
    for (const file of Array.from(files)) {
      try {
        const content = await file.text();
        const banco = file.name.replace(/\.[^.]+$/, "").trim();
        content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).forEach((linha) => {
          chaves.push({ chave: linha, tipo: detectPixType(linha), banco: banco || undefined });
        });
      } catch { toast.error(`Não foi possível ler "${file.name}".`); }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (chaves.length === 0) { toast.error("Nenhuma chave encontrada nos arquivos."); return; }
    importMutation.mutate({ chaves }, { onSuccess: () => toast.success(`${chaves.length} chave(s) salva(s) — banco = nome do arquivo`) });
  };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Chave copiada!"); };
  const handleDelete = (id: string) => {
    deleteMutation.mutate({ ids: [id] }, { onSuccess: () => toast.success("Chave removida!") });
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  };

  const toggleSelect = (id: string) => setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleCopySelected = () => {
    const keys = keysList.filter((k) => selectedIds.has(k.id)).map((k) => k.chave);
    if (!keys.length) return;
    navigator.clipboard.writeText(keys.join("\n"));
    toast.success(`${keys.length} chave(s) copiada(s)!`);
  };
  const handleDeleteSelected = () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    deleteMutation.mutate({ ids }, { onSuccess: () => { toast.success(`${ids.length} chave(s) removida(s)!`); setSelectedIds(new Set()); } });
  };
  const aplicarTag = (tagId: string | null) => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setTagMutation.mutate({ ids, tagId }, { onSuccess: () => { toast.success(tagId ? "Tag aplicada!" : "Tag removida!"); setShowTagMenu(false); } });
  };

  const handleCopyAllValid = () => {
    const valid = keysList.filter((k) => k.tipo !== "DESCONHECIDO");
    if (!valid.length) { toast.error("Nenhuma chave válida para copiar"); return; }
    navigator.clipboard.writeText(valid.map((k) => k.chave).join("\n"));
    toast.success(`${valid.length} chave(s) copiada(s)`);
  };
  const handleExportTxt = () => {
    if (keysList.length === 0) { toast.error("Nenhuma chave para exportar"); return; }
    const blob = new Blob([keysList.map((k) => k.chave).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "chaves_pix.txt"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo exportado");
  };

  const criarTag = () => {
    const nome = novaTagNome.trim();
    if (!nome) { toast.error("Dê um nome para a tag"); return; }
    createTagMutation.mutate({ nome, cor: novaTagCor }, {
      onSuccess: () => { setNovaTagNome(""); setNovaTagCor(CORES_TAG[0]); toast.success("Tag criada!"); },
      onError: () => toast.error("Erro ao criar a tag"),
    });
  };
  const excluirTag = (id: string) => {
    deleteTagMutation.mutate({ id }, { onSuccess: () => { toast.success("Tag excluída"); if (filterTag === id) setFilterTag("TODAS"); } });
  };

  const filteredKeys = useMemo(() => {
    return keysList.filter((k) => {
      const matchesType = filterType === "TODOS" || k.tipo === filterType;
      const matchesTag = filterTag === "TODAS" || (filterTag === "SEM" ? !k.tagId : k.tagId === filterTag);
      const q = searchQuery.toLowerCase();
      const matchesSearch = k.chave.toLowerCase().includes(q) || (k.banco || "").toLowerCase().includes(q);
      return matchesType && matchesTag && matchesSearch;
    });
  }, [keysList, filterType, filterTag, searchQuery]);

  const stats = useMemo(() => ({
    total: keysList.length,
    validas: keysList.filter((k) => k.tipo !== "DESCONHECIDO").length,
    telefone: keysList.filter((k) => k.tipo === "TELEFONE").length,
    cpf: keysList.filter((k) => k.tipo === "CPF").length,
    email: keysList.filter((k) => k.tipo === "EMAIL").length,
    evp: keysList.filter((k) => k.tipo === "EVP").length,
  }), [keysList]);

  const tagCount = (id: string) => keysList.filter((k) => k.tagId === id).length;
  const semTagCount = keysList.filter((k) => !k.tagId).length;

  return (
    <div className="min-h-screen text-white p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight"
            style={{ background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >Chaves PIX</h1>
          <p className="text-xs text-white/40 mt-0.5 uppercase tracking-widest">Salvas na sua conta · tags coloridas · detecção automática</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total, color: "#d4a017" },
            { label: "Válidas", value: stats.validas, color: "#4ade80" },
            { label: "Telefone", value: stats.telefone, color: "#60a5fa" },
            { label: "CPF", value: stats.cpf, color: "#fb923c" },
            { label: "Email", value: stats.email, color: "#a78bfa" },
            { label: "EVP", value: stats.evp, color: "#f87171" },
          ].map((s) => (
            <div key={s.label} className="relative overflow-hidden rounded-2xl p-4 flex flex-col justify-center border border-white/8 transition-all hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${s.color}` }}
            >
              <div className="absolute -right-6 -top-6 w-16 h-16 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${s.color}1f, transparent 70%)` }} />
              <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-4 space-y-4">

            {/* Import Box */}
            <div className="rounded-2xl p-5 border border-white/8" style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#050b18] font-black text-lg" style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}>+</div>
                <div>
                  <h3 className="text-sm font-black text-white">Importar chaves</h3>
                  <p className="text-[10px] text-white/30">1 chave por linha — salva no painel automaticamente</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase text-white/30 font-bold tracking-wider mb-2 block">Chaves PIX</label>
                  <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
                    className="w-full h-32 rounded-xl p-4 text-sm text-white/80 focus:outline-none resize-none font-mono placeholder:text-white/20 border border-white/10"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                    placeholder={"11999887766\n111.456.789-00\noperador@email.com\nchave.evp.uuid..."}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-white/30 font-bold tracking-wider mb-2 block">Banco (Opcional)</label>
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-[#d4a017] placeholder:text-white/20 border border-white/10 bg-transparent"
                    placeholder="Ex: Nubank, Inter, C6..."
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleImport} disabled={importMutation.isPending}
                    className="flex-1 rounded-xl py-3 text-sm font-bold transition-all hover:scale-[1.02] text-[#050b18] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                  >Importar chaves</button>
                  <input type="file" accept=".txt" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl px-4 flex items-center justify-center transition-colors border border-white/10 hover:bg-white/5"
                    title="Importar 1 ou vários arquivos .txt (o nome de cada arquivo vira o banco)"
                  >
                    <Upload size={15} className="text-white/50" />
                    <span className="text-xs font-bold text-white/50 ml-1">.txt</span>
                  </button>
                </div>
                <div className="rounded-xl p-3 flex items-center justify-between border border-white/8" style={{ background: "rgba(212,160,23,0.06)" }}>
                  <span className="text-sm font-bold text-[#d4a017]">{importText.split("\n").filter((l) => l.trim()).length} chave(s) pronta(s)</span>
                </div>
              </div>
            </div>

            {/* Tags Manager */}
            <div className="rounded-2xl p-5 border border-white/8" style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}>
              <div className="flex items-center gap-2 mb-4">
                <TagIcon size={14} className="text-[#d4a017]" />
                <label className="text-[10px] uppercase text-white/40 font-black tracking-wider">Minhas tags</label>
              </div>

              {/* Criar tag */}
              <div className="space-y-2.5 mb-4">
                <div className="flex gap-2">
                  <input value={novaTagNome} onChange={(e) => setNovaTagNome(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); criarTag(); } }}
                    placeholder="Nome da tag (ex: Usada)"
                    className="flex-1 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-[#d4a017] placeholder:text-white/20 border border-white/10 bg-transparent"
                  />
                  <button onClick={criarTag} className="px-3 rounded-lg text-xs font-black text-[#050b18] flex items-center gap-1" style={{ background: novaTagCor }}>
                    <Plus size={13} /> Criar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CORES_TAG.map((c) => (
                    <button key={c} onClick={() => setNovaTagCor(c)}
                      className="w-6 h-6 rounded-full transition-all"
                      style={{ background: c, outline: novaTagCor === c ? "2px solid #fff" : "none", outlineOffset: 1 }}
                      title="Escolher cor"
                    />
                  ))}
                </div>
              </div>

              {/* Lista de tags */}
              {tags.length === 0 ? (
                <p className="text-[11px] text-white/25">Nenhuma tag ainda. Crie uma acima pra marcar suas chaves. 🏷️</p>
              ) : (
                <div className="space-y-1.5">
                  {tags.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 border" style={{ borderColor: `${t.cor}40`, background: `${t.cor}12` }}>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.cor, boxShadow: `0 0 6px ${t.cor}` }} />
                        <span className="text-xs font-bold text-white/85 truncate">{t.nome}</span>
                        <span className="text-[10px] text-white/30">({tagCount(t.id)})</span>
                      </span>
                      <button onClick={() => excluirTag(t.id)} className="text-white/30 hover:text-red-400 transition-colors shrink-0" title="Excluir tag"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Actions */}
            <div className="rounded-2xl p-5 border border-white/8" style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}>
              <label className="text-[10px] uppercase text-white/30 font-bold tracking-wider mb-4 block">Ações gerais</label>
              <div className="space-y-3">
                <button onClick={handleCopyAllValid} className="w-full rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold transition-all hover:scale-[1.01] text-[#050b18]" style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}>
                  <Copy size={15} /> Copiar todas válidas ({stats.validas})
                </button>
                <button onClick={handleExportTxt} className="w-full rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors border border-white/10 hover:bg-white/5 text-white/60">
                  <Download size={15} /> Exportar .txt
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-8 space-y-4">

            {/* Search + Type filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-1/2">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar chave, banco..."
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#d4a017] text-white/70 placeholder:text-white/20 border border-white/10"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                />
              </div>
              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
                {(["TODOS", "TELEFONE", "CPF", "EMAIL", "EVP"] as const).map((type) => (
                  <button key={type} onClick={() => setFilterType(type)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all whitespace-nowrap"
                    style={filterType === type ? { background: "linear-gradient(135deg, #d4a017, #f59e0b)", color: "#050b18" } : { color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)" }}
                  >{type}</button>
                ))}
              </div>
            </div>

            {/* Tag filters */}
            <div className="flex gap-1.5 flex-wrap items-center">
              <span className="text-[9px] uppercase font-black tracking-widest text-white/25 mr-1">Tags:</span>
              <button onClick={() => setFilterTag("TODAS")}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={filterTag === "TODAS" ? { background: "rgba(255,255,255,0.9)", color: "#050b18" } : { color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
              >Todas</button>
              <button onClick={() => setFilterTag("SEM")}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={filterTag === "SEM" ? { background: "rgba(255,255,255,0.9)", color: "#050b18" } : { color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
              >Sem tag ({semTagCount})</button>
              {tags.map((t) => {
                const active = filterTag === t.id;
                return (
                  <button key={t.id} onClick={() => setFilterTag(t.id)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5"
                    style={active ? { background: t.cor, color: "#050b18" } : { color: t.cor, background: `${t.cor}1a`, border: `1px solid ${t.cor}40` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? "#050b18" : t.cor }} />
                    {t.nome} ({tagCount(t.id)})
                  </button>
                );
              })}
            </div>

            {/* Selection bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[10px] text-white/25 uppercase font-bold tracking-widest">
                {filteredKeys.length} chave(s) · {selectedIds.size > 0 ? `${selectedIds.size} selecionada(s)` : "nenhuma selecionada"}
              </p>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  {/* Aplicar tag */}
                  <div className="relative">
                    <button onClick={() => setShowTagMenu((v) => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white/80 border border-white/15 hover:bg-white/5 transition-colors"
                    ><TagIcon size={12} /> Aplicar tag</button>
                    {showTagMenu && (
                      <div className="absolute right-0 mt-1 z-20 w-48 rounded-xl border border-white/10 p-1.5 shadow-2xl" style={{ background: "#0a1428" }}>
                        {tags.length === 0 && <p className="text-[11px] text-white/30 px-2 py-2">Crie uma tag primeiro (coluna esquerda).</p>}
                        {tags.map((t) => (
                          <button key={t.id} onClick={() => aplicarTag(t.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.cor }} />
                            <span className="text-xs font-bold text-white/80 truncate">{t.nome}</span>
                          </button>
                        ))}
                        <button onClick={() => aplicarTag(null)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left text-white/40">
                          <X size={12} /> <span className="text-xs font-bold">Remover tag</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button onClick={handleCopySelected} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#050b18] transition-all hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}>
                    <Copy size={12} /> Copiar {selectedIds.size}
                  </button>
                  <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-colors" style={{ background: "rgba(239,68,68,0.05)" }}>
                    <Trash2 size={12} /> Apagar {selectedIds.size}
                  </button>
                  <button onClick={() => setSelectedIds(new Set())} className="px-2.5 py-1.5 rounded-xl text-xs text-white/30 border border-white/10 hover:bg-white/5 transition-colors">✕</button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="space-y-2">
              {keysQuery.isLoading ? (
                <div className="rounded-2xl p-12 text-center text-white/25 border border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>Carregando...</div>
              ) : filteredKeys.length === 0 ? (
                <div className="rounded-2xl p-12 text-center text-white/25 border border-white/8" style={{ background: "rgba(255,255,255,0.02)" }}>Nenhuma chave encontrada com os filtros atuais.</div>
              ) : (
                filteredKeys.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const tipo = item.tipo as PixType;
                  const cor = CORES_TIPO[tipo] || "#ffffff60";
                  const tag = tagDe(item.tagId);
                  return (
                    <div key={item.id}
                      className="rounded-xl p-4 flex items-center justify-between group transition-all border hover:border-white/12"
                      style={{ background: isSelected ? "rgba(212,160,23,0.06)" : "rgba(255,255,255,0.03)", borderColor: isSelected ? "rgba(212,160,23,0.3)" : "rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/8 shrink-0" style={{ background: `${cor}14` }}>
                          <span className="text-[9px] font-black uppercase" style={{ color: cor }}>{tipo === "TELEFONE" ? "TEL" : tipo === "DESCONHECIDO" ? "?" : tipo}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-sm text-white/80 font-medium truncate">{item.chave}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md" style={{ color: cor, background: "rgba(255,255,255,0.05)" }}>{tipo.toLowerCase()}</span>
                            {item.banco && <span className="text-[10px] text-white/25">• {item.banco}</span>}
                            {tag && (
                              <span className="text-[10px] font-black tracking-wide px-2 py-0.5 rounded-md flex items-center gap-1" style={{ color: tag.cor, background: `${tag.cor}1f`, border: `1px solid ${tag.cor}55` }}>
                                <Check size={9} /> {tag.nome}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleSelect(item.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all shrink-0"
                          style={isSelected ? { background: "rgba(212,160,23,0.2)", borderColor: "rgba(212,160,23,0.5)", color: "#d4a017" } : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.2)" }}
                          title={isSelected ? "Desmarcar" : "Selecionar"}
                        >{isSelected ? <span className="text-xs font-black">✓</span> : <span className="text-xs">○</span>}</button>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleCopy(item.chave)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors border border-white/8 hover:border-[#d4a017]/40 text-white/30 hover:text-[#d4a017]" style={{ background: "rgba(255,255,255,0.04)" }} title="Copiar"><Copy size={12} /></button>
                          <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors border border-red-500/15 hover:border-red-500/40 text-red-400/40 hover:text-red-400" style={{ background: "rgba(239,68,68,0.04)" }} title="Excluir"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
