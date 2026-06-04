import React, { useState, useEffect } from "react";
import { Search, Flame, Award, Heart, Check, Copy, RefreshCw, Layers, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../_core/hooks/useAuth";
import slotsData from "./slots_data.json";
import { trpc } from "@/lib/trpc";

interface SlotGame {
  provider: string;
  performance: string; // "ALTA" | "MEDIA" | "BAIXA"
  name: string;
  tag: string;
  image?: string;
}

export default function Slots() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState<"catalogo" | "favoritos">("catalogo");
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("TODOS");
  const [selectedPerformance, setSelectedPerformance] = useState("TODOS");
  
  // Load custom slots from the database (refetching every 5 seconds to sync all users in real-time)
  const slotsQuery = trpc.slots.list.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Combine static slots with DB-stored slots
  const dbGames = slotsQuery.data || [];
  const games = React.useMemo(() => {
    const allGames = [...slotsData];
    dbGames.forEach((cg) => {
      if (!allGames.some(g => g.name.toLowerCase() === cg.name.toLowerCase())) {
        allGames.push({
          provider: cg.provider,
          performance: cg.performance,
          name: cg.name,
          tag: cg.tag ?? "",
          image: cg.image ?? "",
        });
      }
    });
    return allGames;
  }, [dbGames]);

  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("slots-favoritos-v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mouseDownOnBackdrop, setMouseDownOnBackdrop] = useState(false);
  const [newGame, setNewGame] = useState<SlotGame>({
    name: "",
    provider: "PG",
    performance: "ALTA",
    tag: "",
    image: ""
  });

  const providers = ["TODOS", "PG", "PP", "WG", "MG", "JILI", "JDB", "FC", "PESCARIA"];
  const performances = [
    { value: "TODOS", label: "Todas Performances" },
    { value: "ALTA", label: "Alta Performance" },
    { value: "MEDIA", label: "Média" },
    { value: "BAIXA", label: "Baixa" }
  ];

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("slots-favoritos-v1", JSON.stringify(favoritos));
  }, [favoritos]);

  const toggleFavorito = (gameName: string) => {
    if (favoritos.includes(gameName)) {
      setFavoritos(favoritos.filter((n) => n !== gameName));
      toast.success("Removido dos favoritos");
    } else {
      setFavoritos([...favoritos, gameName]);
      toast.success("Adicionado aos favoritos!");
    }
  };

  const copyGameName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success(`Nome "${name}" copiado para o teclado!`);
  };

  const addGameMutation = trpc.slots.create.useMutation({
    onSuccess: () => {
      toast.success("Novo jogo adicionado com sucesso!");
      slotsQuery.refetch();
      setIsAddModalOpen(false);
      setNewGame({
        name: "",
        provider: "PG",
        performance: "ALTA",
        tag: "",
        image: ""
      });
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao adicionar o jogo");
    }
  });

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGame.name.trim()) {
      toast.error("Por favor, insira o nome do jogo");
      return;
    }

    if (games.some(g => g.name.toLowerCase() === newGame.name.trim().toLowerCase())) {
      toast.error("Já existe um jogo com este nome!");
      return;
    }

    addGameMutation.mutate({
      name: newGame.name.trim(),
      provider: newGame.provider,
      performance: newGame.performance,
      tag: newGame.tag.trim(),
      image: newGame.image?.trim() || undefined,
    });
  };

  // Filter games logic
  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(search.toLowerCase()) || 
                          game.tag.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = selectedProvider === "TODOS" || game.provider.toUpperCase() === selectedProvider.toUpperCase();
    const matchesPerformance = selectedPerformance === "TODOS" || game.performance.toUpperCase() === selectedPerformance.toUpperCase();
    const matchesTab = activeTab === "catalogo" || favoritos.includes(game.name);

    return matchesSearch && matchesProvider && matchesPerformance && matchesTab;
  });

  const getPerformanceStyles = (perf: string) => {
    switch (perf.toUpperCase()) {
      case "ALTA":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          dot: "bg-emerald-400"
        };
      case "MEDIA":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          dot: "bg-amber-400"
        };
      case "BAIXA":
        return {
          bg: "bg-red-500/10 border-red-500/20 text-red-400",
          dot: "bg-red-400"
        };
      default:
        return {
          bg: "bg-white/5 border-white/10 text-white/50",
          dot: "bg-white/30"
        };
    }
  };

  const totalPorPerformance = (perf: string) => {
    return games.filter(g => g.performance.toUpperCase() === perf.toUpperCase()).length;
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-white/8"
          style={{
            background: "linear-gradient(135deg, rgba(7,14,32,0.95) 0%, rgba(15,30,69,0.9) 100%)",
            backdropFilter: "blur(12px)"
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/40 to-transparent" />
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#d4a017]/5 blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#d4a017] mb-2">Rollover & Estratégias</p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Slots Premium
              </h1>
              <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">
                {games.length} jogos testados para rollover · atualizado semanalmente
              </p>
            </div>
            
            <div className="flex gap-3">
              {[
                { id: "ALTA", count: totalPorPerformance("ALTA"), color: "text-emerald-400" },
                { id: "MEDIA", count: totalPorPerformance("MEDIA"), color: "text-amber-400" },
                { id: "BAIXA", count: totalPorPerformance("BAIXA"), color: "text-red-400" }
              ].map(item => (
                <div key={item.id} className="rounded-xl px-4 py-2 border border-white/6 bg-white/[0.02] text-center min-w-[70px]">
                  <p className="text-[9px] font-bold text-white/30 tracking-wider">{item.id}</p>
                  <p className={`text-lg font-black mt-0.5 ${item.color}`}>{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Headers and search/filters */}
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          
          {/* Main Tabs */}
          <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
            <div className="flex gap-1 p-1 rounded-xl border border-white/8 bg-white/[0.02] w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("catalogo")}
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "catalogo" ? "bg-[#d4a017] text-[#050b18]" : "text-white/40 hover:text-white/70"
                }`}
              >
                Catálogo Oficial ({games.length})
              </button>
              <button
                onClick={() => setActiveTab("favoritos")}
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "favoritos" ? "bg-[#d4a017] text-[#050b18]" : "text-white/40 hover:text-white/70"
                }`}
              >
                <Heart size={13} className={activeTab === "favoritos" ? "fill-[#050b18]" : ""} />
                Meus Jogos ({favoritos.length})
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 rounded-lg text-xs font-black bg-[#d4a017]/10 text-[#d4a017] hover:bg-[#d4a017] hover:text-[#050b18] border border-[#d4a017]/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus size={13} />
                Adicionar Jogo
              </button>
            )}
          </div>

          {/* Search bar & performance selector */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="text"
                placeholder="Pesquisar jogo ou tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-white/10 bg-black/25 text-xs font-medium text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4a017]/70"
              />
            </div>
            
            <select
              value={selectedPerformance}
              onChange={(e) => setSelectedPerformance(e.target.value)}
              className="h-10 px-4 rounded-xl border border-white/10 bg-[#0a1428] text-xs font-bold text-white/75 focus:outline-none focus:border-[#d4a017]/70"
            >
              {performances.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Provider horizontal selector */}
        <div className="overflow-x-auto flex gap-2 pb-2 scrollbar-thin">
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedProvider(p)}
              className={`h-9 px-4 rounded-xl text-xs font-black transition-all shrink-0 border ${
                selectedProvider === p 
                  ? "bg-[#d4a017] text-[#050b18] border-transparent" 
                  : "bg-black/25 border-white/8 text-white/40 hover:text-white/70"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Game cards grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGames.map((game, idx) => {
              const perfStyles = getPerformanceStyles(game.performance);
              const isFav = favoritos.includes(game.name);
              return (
                <div
                  key={idx}
                  className="group rounded-2xl border border-white/8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-[#d4a017]/30 hover:shadow-[0_0_20px_rgba(212,160,23,0.15)] hover:-translate-y-1"
                  style={{
                    background: "rgba(3, 7, 18, 0.45)",
                    backdropFilter: "blur(12px)"
                  }}
                >
                  {/* Image Container with 16:10 aspect ratio */}
                  <div className="relative aspect-[16/10] w-full bg-white/[0.02] overflow-hidden border-b border-white/8">
                    {game.image ? (
                      <img 
                        src={game.image} 
                        alt={game.name} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/10">
                        <Layers size={32} />
                      </div>
                    )}
                    
                    {/* Dark gradient overlay for visual hierarchy */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Badge Container */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                      <span className="rounded-lg bg-black/60 border border-white/10 px-2.5 py-1 text-[10px] font-black text-[#d4a017] backdrop-blur-md">
                        {game.provider}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                      <span className={`rounded-lg border px-2.5 py-1 text-[9px] font-black flex items-center gap-1.5 backdrop-blur-md bg-black/40 ${perfStyles.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${perfStyles.dot}`} />
                        {game.performance}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorito(game.name);
                      }}
                      className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 bg-black/60 text-white/50 hover:text-red-400 hover:bg-black/85 transition-colors backdrop-blur-md"
                      title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <Heart size={14} className={isFav ? "fill-red-400 text-red-400" : ""} />
                    </button>
                  </div>

                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div className="mb-4">
                      <h3 className="font-extrabold text-white text-base leading-tight group-hover:text-[#d4a017] transition-colors">{game.name}</h3>
                      <p className="text-[10px] font-bold text-white/30 mt-1 uppercase tracking-wider">{game.tag}</p>
                    </div>

                    <button
                      onClick={() => copyGameName(game.name)}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-[#d4a017]/20 bg-[#d4a017]/5 text-xs font-bold text-[#d4a017] hover:bg-[#d4a017] hover:text-[#050b18] transition-all"
                    >
                      <Copy size={12} />
                      Copiar Nome
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center rounded-2xl border border-dashed border-white/8 bg-white/[0.01]">
            <Layers className="mx-auto mb-3 text-white/20" size={32} />
            <p className="text-white/40 text-sm font-medium">Nenhum slot encontrado para estes filtros</p>
            <button
              onClick={() => { setSearch(""); setSelectedProvider("TODOS"); setSelectedPerformance("TODOS"); }}
              className="mt-3 text-xs font-bold text-[#d4a017] hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Add Game Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setMouseDownOnBackdrop(true);
            }
          }}
          onMouseUp={(e) => {
            if (e.target === e.currentTarget && mouseDownOnBackdrop) {
              setIsAddModalOpen(false);
            }
            setMouseDownOnBackdrop(false);
          }}
        >
          <div className="rounded-3xl p-6 max-w-md w-full space-y-5 relative overflow-hidden border border-white/10"
            style={{
              background: "linear-gradient(135deg, rgba(7,14,32,0.98) 0%, rgba(15,30,69,0.95) 100%)",
              boxShadow: "0 25px 50px -12px rgba(212,160,23,0.25)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017]/40 to-transparent" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#d4a017]/10 text-[#d4a017] border border-[#d4a017]/30">
                  <Plus size={16} />
                </div>
                <h3 className="text-base font-black tracking-tight text-white">Adicionar Novo Slot</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddGame} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Nome do Jogo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fortune Tiger"
                  value={newGame.name}
                  onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-black/35 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4a017]/70"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Provedor</label>
                  <select
                    value={newGame.provider}
                    onChange={(e) => setNewGame({ ...newGame, provider: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-white/10 bg-[#0a1428] text-xs text-white/80 focus:outline-none focus:border-[#d4a017]/70"
                  >
                    {providers.filter(p => p !== "TODOS").map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Performance</label>
                  <select
                    value={newGame.performance}
                    onChange={(e) => setNewGame({ ...newGame, performance: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-white/10 bg-[#0a1428] text-xs text-white/80 focus:outline-none focus:border-[#d4a017]/70"
                  >
                    <option value="ALTA">Alta Performance</option>
                    <option value="MEDIA">Média</option>
                    <option value="BAIXA">Baixa</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Categoria / Tag</label>
                <input
                  type="text"
                  placeholder="Ex: Tigre, Frutas, Clássico"
                  value={newGame.tag}
                  onChange={(e) => setNewGame({ ...newGame, tag: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-black/35 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4a017]/70"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">URL da Imagem (Opcional)</label>
                <input
                  type="url"
                  placeholder="Ex: https://dominio.com/imagem.png"
                  value={newGame.image}
                  onChange={(e) => setNewGame({ ...newGame, image: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-black/35 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#d4a017]/70"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 mt-4 rounded-xl bg-[#d4a017] text-[#050b18] hover:bg-[#c39010] text-xs font-black tracking-wider uppercase transition-all shadow-[0_4px_12px_rgba(212,160,23,0.2)]"
              >
                Confirmar e Adicionar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
