import React, { useState, useMemo, useRef } from "react";
import { Copy, Trash2, Upload, Download, Search, RefreshCw, Key } from "lucide-react";
import { toast } from "sonner";

type PixType = "TELEFONE" | "CPF" | "EMAIL" | "EVP" | "DESCONHECIDO";

interface PixKey {
  id: string;
  key: string;
  type: PixType;
  bank?: string;
}

const detectPixType = (key: string): PixType => {
  const cleanKey = key.trim();
  
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cleanKey) || /^\d{11}$/.test(cleanKey)) {
    return "CPF";
  }
  
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanKey)) {
    return "EMAIL";
  }
  
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanKey)) {
    return "EVP";
  }
  
  const phoneDigits = cleanKey.replace(/\D/g, '');
  if (phoneDigits.length >= 10 && phoneDigits.length <= 15 && /^[\+\(\)0-9-\s]+$/.test(cleanKey)) {
    return "TELEFONE";
  }
  
  return "DESCONHECIDO";
};

export default function ChavesPix() {
  const [keysList, setKeysList] = useState<PixKey[]>([]);
  const [importText, setImportText] = useState("");
  const [bankName, setBankName] = useState("");
  const [filterType, setFilterType] = useState<PixType | "TODOS">("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error("Insira as chaves para importar");
      return;
    }

    const lines = importText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const newKeys: PixKey[] = lines.map(line => ({
      id: crypto.randomUUID(),
      key: line,
      type: detectPixType(line),
      bank: bankName.trim() || undefined
    }));

    setKeysList(prev => [...prev, ...newKeys]);
    setImportText("");
    setBankName("");
    toast.success(`${newKeys.length} chave(s) importada(s) com sucesso`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        toast.info("Arquivo lido com sucesso, clique em Importar para processar.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Chave copiada!");
  };

  const handleDelete = (id: string) => {
    setKeysList(prev => prev.filter(k => k.id !== id));
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    toast.success("Chave removida!");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    if (ids.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ids));
    }
  };

  const handleCopySelected = () => {
    const keys = keysList.filter(k => selectedIds.has(k.id)).map(k => k.key);
    if (!keys.length) return;
    navigator.clipboard.writeText(keys.join('\n'));
    toast.success(`${keys.length} chave(s) copiada(s)!`);
  };

  const handleDeleteSelected = () => {
    setKeysList(prev => prev.filter(k => !selectedIds.has(k.id)));
    toast.success(`${selectedIds.size} chave(s) removida(s)!`);
    setSelectedIds(new Set());
  };

  const handleCopyAllValid = () => {
    const validKeys = keysList.filter(k => k.type !== "DESCONHECIDO");
    if (validKeys.length === 0) {
      toast.error("Nenhuma chave válida para copiar");
      return;
    }
    const text = validKeys.map(k => k.key).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`${validKeys.length} chave(s) copiada(s)`);
  };

  const handleExportTxt = () => {
    if (keysList.length === 0) {
      toast.error("Nenhuma chave para exportar");
      return;
    }
    const text = keysList.map(k => k.key).join('\n');
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chaves_pix.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo exportado");
  };

  const filteredKeys = useMemo(() => {
    return keysList.filter(k => {
      const matchesType = filterType === "TODOS" || k.type === filterType;
      const matchesSearch = k.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (k.bank && k.bank.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [keysList, filterType, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: keysList.length,
      validas: keysList.filter(k => k.type !== "DESCONHECIDO").length,
      telefone: keysList.filter(k => k.type === "TELEFONE").length,
      cpf: keysList.filter(k => k.type === "CPF").length,
      email: keysList.filter(k => k.type === "EMAIL").length,
      evp: keysList.filter(k => k.type === "EVP").length,
    };
  }, [keysList]);

  return (
    <div className="min-h-screen text-white p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Chaves PIX
          </h1>
          <p className="text-xs text-white/40 mt-0.5 uppercase tracking-widest">Gerencie e importe chaves em lote — detecção automática</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total, color: "#d4a017" },
            { label: "Válidas", value: stats.validas, color: "#4ade80" },
            { label: "Telefone", value: stats.telefone, color: "#60a5fa" },
            { label: "CPF", value: stats.cpf, color: "#fb923c" },
            { label: "Email", value: stats.email, color: "#a78bfa" },
            { label: "EVP", value: stats.evp, color: "#f87171" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 flex flex-col justify-center border border-white/8"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderLeft: `3px solid ${s.color}`,
              }}
            >
              <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Import */}
          <div className="lg:col-span-4 space-y-4">

            {/* Import Box */}
            <div className="rounded-2xl p-5 border border-white/8"
              style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[#050b18] font-black text-lg"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                >+</div>
                <div>
                  <h3 className="text-sm font-black text-white">Importar chaves</h3>
                  <p className="text-[10px] text-white/30">1 chave por linha — detecta tipo automaticamente</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase text-white/30 font-bold tracking-wider mb-2 block">Chaves PIX</label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full h-32 rounded-xl p-4 text-sm text-white/80 focus:outline-none resize-none font-mono placeholder:text-white/20 border border-white/10 bg-transparent"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                    placeholder={"11999887766\n111.456.789-00\noperador@email.com\nchave.evp.uuid..."}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-white/30 font-bold tracking-wider mb-2 block">Banco (Opcional)</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-[#d4a017] placeholder:text-white/20 border border-white/10 bg-transparent"
                    placeholder="Ex: Nubank, Inter, C6..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleImport}
                    className="flex-1 rounded-xl py-3 text-sm font-bold transition-all hover:scale-[1.02] text-[#050b18]"
                    style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                  >
                    Importar chaves
                  </button>

                  <input
                    type="file"
                    accept=".txt"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl px-4 flex items-center justify-center transition-colors border border-white/10 hover:bg-white/5"
                    title="Importar de arquivo .txt"
                  >
                    <Upload size={15} className="text-white/50" />
                    <span className="text-xs font-bold text-white/50 ml-1">.txt</span>
                  </button>
                </div>

                <div className="rounded-xl p-3 flex items-center justify-between border border-white/8"
                  style={{ background: "rgba(212,160,23,0.06)" }}
                >
                  <span className="text-sm font-bold text-[#d4a017]">
                    {importText.split('\n').filter(l => l.trim()).length} chave(s) pronta(s)
                  </span>
                </div>
              </div>
            </div>

            {/* General Actions */}
            <div className="rounded-2xl p-5 border border-white/8"
              style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
            >
              <label className="text-[10px] uppercase text-white/30 font-bold tracking-wider mb-4 block">Ações gerais</label>

              <div className="space-y-3">
                <button
                  onClick={handleCopyAllValid}
                  className="w-full rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold transition-all hover:scale-[1.01] text-[#050b18]"
                  style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                >
                  <Copy size={15} />
                  Copiar todas válidas ({stats.validas})
                </button>

                <button
                  onClick={handleExportTxt}
                  className="w-full rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors border border-white/10 hover:bg-white/5 text-white/60"
                >
                  <Download size={15} />
                  Exportar .txt
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-8 space-y-4">

            {/* Top Bar: Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-1/2">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar chave, banco..."
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#d4a017] text-white/70 placeholder:text-white/20 border border-white/10 bg-transparent"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                />
              </div>

              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
                {(["TODOS", "TELEFONE", "CPF", "EMAIL", "EVP"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all whitespace-nowrap"
                    style={filterType === type ? {
                      background: "linear-gradient(135deg, #d4a017, #f59e0b)",
                      color: "#050b18",
                    } : {
                      color: "rgba(255,255,255,0.35)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de seleção em massa */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[10px] text-white/25 uppercase font-bold tracking-widest">
                {filteredKeys.length} chave(s) · {selectedIds.size > 0 ? `${selectedIds.size} selecionada(s)` : "nenhuma selecionada"}
              </p>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button onClick={handleCopySelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#050b18] transition-all hover:scale-[1.02]"
                    style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                  >
                    <Copy size={12} /> Copiar {selectedIds.size}
                  </button>
                  <button onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-colors"
                    style={{ background: "rgba(239,68,68,0.05)" }}
                  >
                    <Trash2 size={12} /> Apagar {selectedIds.size}
                  </button>
                  <button onClick={() => setSelectedIds(new Set())}
                    className="px-2.5 py-1.5 rounded-xl text-xs text-white/30 border border-white/10 hover:bg-white/5 transition-colors"
                  >✕</button>
                </div>
              )}
            </div>

            {/* List Items */}
            <div className="space-y-2">
              {filteredKeys.length === 0 ? (
                <div className="rounded-2xl p-12 text-center text-white/25 border border-white/8"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  Nenhuma chave encontrada com os filtros atuais.
                </div>
              ) : (
                filteredKeys.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                  <div key={item.id}
                    className="rounded-xl p-4 flex items-center justify-between group transition-all border hover:border-white/12"
                    style={{
                      background: isSelected ? "rgba(212,160,23,0.06)" : "rgba(255,255,255,0.03)",
                      borderColor: isSelected ? "rgba(212,160,23,0.3)" : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/8"
                        style={{
                          background: item.type === "TELEFONE" ? "rgba(96,165,250,0.08)" :
                            item.type === "CPF" ? "rgba(251,146,60,0.08)" :
                            item.type === "EMAIL" ? "rgba(167,139,250,0.08)" :
                            item.type === "EVP" ? "rgba(212,160,23,0.08)" :
                            "rgba(255,255,255,0.04)",
                        }}
                      >
                        <span className="text-[9px] font-black uppercase"
                          style={{
                            color: item.type === "TELEFONE" ? "#60a5fa" :
                              item.type === "CPF" ? "#fb923c" :
                              item.type === "EMAIL" ? "#a78bfa" :
                              item.type === "EVP" ? "#d4a017" : "#ffffff60",
                          }}
                        >
                          {item.type === "TELEFONE" ? "TEL" : item.type === "DESCONHECIDO" ? "?" : item.type}
                        </span>
                      </div>

                      <div>
                        <p className="font-mono text-sm text-white/80 font-medium">{item.key}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md"
                            style={{
                              color: item.type === "TELEFONE" ? "#60a5fa" :
                                item.type === "CPF" ? "#fb923c" :
                                item.type === "EMAIL" ? "#a78bfa" :
                                item.type === "EVP" ? "#d4a017" : "#ffffff40",
                              background: "rgba(255,255,255,0.05)",
                            }}
                          >
                            {item.type.toLowerCase()}
                          </span>
                          {item.bank && (
                            <span className="text-[10px] text-white/25">• {item.bank}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Checkbox de seleção */}
                      <button
                        onClick={() => toggleSelect(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all shrink-0"
                        style={isSelected ? {
                          background: "rgba(212,160,23,0.2)",
                          borderColor: "rgba(212,160,23,0.5)",
                          color: "#d4a017",
                        } : {
                          background: "rgba(255,255,255,0.03)",
                          borderColor: "rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.2)",
                        }}
                        title={isSelected ? "Desmarcar" : "Selecionar"}
                      >
                        {isSelected ? <span className="text-xs font-black">✓</span> : <span className="text-xs">○</span>}
                      </button>

                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(item.key)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors border border-white/8 hover:border-[#d4a017]/40 text-white/30 hover:text-[#d4a017]"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                          title="Copiar"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors border border-red-500/15 hover:border-red-500/40 text-red-400/40 hover:text-red-400"
                          style={{ background: "rgba(239,68,68,0.04)" }}
                          title="Excluir"
                        >
                          <Trash2 size={12} />
                        </button>
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
