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
    toast.success("Chave removida!");
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
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-1 tracking-tight" style={{ fontFamily: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}>
              Chaves PIX
            </h1>
            <p className="text-sm text-gray-400">Gerencie e importe chaves em lote - detecção automática</p>
          </div>
          <button 
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111111] border border-white/10 hover:bg-[#1a1a1a] transition-colors text-sm"
          >
            <RefreshCw size={14} className="text-gray-400" />
            <span className="text-gray-300">Sync</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-[#0f0f13] border border-[#2a2a35] rounded-xl p-4 flex flex-col justify-center border-l-4 border-l-gray-300">
            <span className="text-2xl font-bold">{stats.total}</span>
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Total</span>
          </div>
          <div className="bg-[#091515] border border-[#162a2a] rounded-xl p-4 flex flex-col justify-center border-l-4 border-l-emerald-500">
            <span className="text-2xl font-bold text-emerald-400">{stats.validas}</span>
            <span className="text-[10px] uppercase text-emerald-700 font-bold tracking-wider">Válidas</span>
          </div>
          <div className="bg-[#0f131a] border border-[#1a2333] rounded-xl p-4 flex flex-col justify-center border-l-4 border-l-blue-500">
            <span className="text-2xl font-bold text-blue-400">{stats.telefone}</span>
            <span className="text-[10px] uppercase text-blue-700 font-bold tracking-wider">Telefone</span>
          </div>
          <div className="bg-[#15120d] border border-[#2d2516] rounded-xl p-4 flex flex-col justify-center border-l-4 border-l-orange-500">
            <span className="text-2xl font-bold text-orange-400">{stats.cpf}</span>
            <span className="text-[10px] uppercase text-orange-700 font-bold tracking-wider">CPF</span>
          </div>
          <div className="bg-[#130d15] border border-[#25182a] rounded-xl p-4 flex flex-col justify-center border-l-4 border-l-purple-500">
            <span className="text-2xl font-bold text-purple-400">{stats.email}</span>
            <span className="text-[10px] uppercase text-purple-700 font-bold tracking-wider">Email</span>
          </div>
          <div className="bg-[#160d0d] border border-[#331818] rounded-xl p-4 flex flex-col justify-center border-l-4 border-l-red-500">
            <span className="text-2xl font-bold text-red-400">{stats.evp}</span>
            <span className="text-[10px] uppercase text-red-700 font-bold tracking-wider">EVP</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Import */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Import Box */}
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-red-500 font-bold">+</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-white">Importar chaves</h3>
                  <p className="text-xs text-gray-500">1 chave por linha - detecta tipo automaticamente</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-2 block">Chaves PIX</label>
                  <textarea 
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    className="w-full h-32 bg-[#121212] border border-[#2a2a2a] rounded-xl p-4 text-sm text-gray-300 focus:outline-none focus:border-red-500/50 resize-none font-mono placeholder:text-gray-600"
                    placeholder="11999887766&#10;111.456.789-00&#10;operador@email.com&#10;chave.evp.uuid..."
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-2 block">Banco (Opcional)</label>
                  <input 
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-red-500/50 placeholder:text-gray-600"
                    placeholder="Ex: Nubank, Inter, C6..."
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleImport}
                    className="flex-1 bg-[#1a2e1e] hover:bg-[#203a25] text-[#4ade80] border border-[#2a452f] rounded-xl py-3 text-sm font-medium transition-colors"
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
                    className="bg-[#121212] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 flex items-center justify-center transition-colors"
                    title="Importar de arquivo .txt"
                  >
                    <Upload size={16} className="text-gray-300" />
                    <span className="text-xs font-bold text-gray-300 ml-1">.txt</span>
                  </button>
                </div>

                <div className="bg-[#121612] border border-[#1e2a20] rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#4ade80]">{importText.split('\n').filter(l=>l.trim()).length} chave(s) pronta(s)</span>
                </div>
              </div>
            </div>

            {/* General Actions */}
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-6">
              <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-4 block">Ações gerais</label>
              
              <div className="space-y-3">
                <button 
                  onClick={handleCopyAllValid}
                  className="w-full bg-white hover:bg-gray-100 text-black rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                >
                  <Copy size={16} />
                  Copiar todas válidas ({stats.validas})
                </button>
                
                <button 
                  onClick={handleExportTxt}
                  className="w-full bg-transparent hover:bg-white/5 border border-white/10 text-white rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                >
                  <Download size={16} />
                  Exportar .txt
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Bar: Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              <div className="relative w-full sm:w-1/2">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar chave, banco..." 
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gray-500 text-gray-200 placeholder:text-gray-600"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
                {(["TODOS", "TELEFONE", "CPF", "EMAIL", "EVP"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider transition-colors whitespace-nowrap ${
                      filterType === type 
                        ? type === "TODOS" ? "bg-white text-black" : "bg-red-500/20 text-red-500 border border-red-500/30"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

            </div>

            <p className="text-xs text-gray-500">{filteredKeys.length} chave(s) encontrada(s)</p>

            {/* List Items */}
            <div className="space-y-3">
              {filteredKeys.length === 0 ? (
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl p-12 text-center text-gray-500">
                  Nenhuma chave encontrada com os filtros atuais.
                </div>
              ) : (
                filteredKeys.map((item) => (
                  <div key={item.id} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4 flex items-center justify-between group hover:border-[#333] transition-colors">
                    
                    <div className="flex items-center gap-4">
                      {/* Icon Container based on type */}
                      <div className="w-10 h-10 rounded-lg bg-[#111111] border border-white/5 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{
                          item.type === "TELEFONE" ? "TEL" :
                          item.type === "DESCONHECIDO" ? "?" :
                          item.type
                        }</span>
                      </div>
                      
                      <div>
                        <p className="font-mono text-sm text-gray-200 font-medium">{item.key}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                            item.type === "TELEFONE" ? "bg-blue-500/10 text-blue-400" :
                            item.type === "CPF" ? "bg-orange-500/10 text-orange-400" :
                            item.type === "EMAIL" ? "bg-purple-500/10 text-purple-400" :
                            item.type === "EVP" ? "bg-red-500/10 text-red-400" :
                            "bg-gray-500/10 text-gray-400"
                          }`}>
                            {item.type.toLowerCase()}
                          </span>
                          {item.bank && (
                            <span className="text-[10px] text-gray-500">• {item.bank}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCopy(item.key)}
                        className="w-8 h-8 rounded-lg bg-[#111111] hover:bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-gray-400 transition-colors"
                        title="Copiar"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
