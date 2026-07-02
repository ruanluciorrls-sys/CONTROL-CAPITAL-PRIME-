import { createContext, useContext, useState, useEffect, useRef } from "react";
import { AppState, CasaData, RelatorioData } from "@/lib/types";
import { trpc } from "@/lib/trpc";

interface AppContextType {
  state: AppState;
  addCasa: (casa: Omit<CasaData, "id" | "criadoEm">) => void;
  updateCasa: (id: string, casa: Partial<CasaData>) => void;
  deleteCasa: (id: string) => void;
  finalizarCasa: (id: string) => void;
  restaurarCasa: (id: string) => void;
  esvaziarLixeiraCasas: () => void;
  deletePermanentementeCasa: (id: string) => void;
  addRelatorio: (relatorio: Omit<RelatorioData, "id" | "criadoEm">) => void;
  updateRelatorio: (id: string, relatorio: Partial<RelatorioData>) => void;
  deleteRelatorio: (id: string) => void;
  finalizarRelatorio: (id: string) => void;
  reutilizarRelatorio: (id: string) => void;
  duplicarRelatorio: (id: string) => void;
  esvaziarLixeira: () => void;
  updateAppName: (nome: string) => void;
  updateCorPrimaria: (cor: string) => void;
  updateFundo: (url: string) => void;
  updateLogo: (url: string) => void;
  calculateTotalLucros: () => number;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "cpa-app-state";
const RELATORIOS_FINALIZADOS_EM_KEY = "relatorios-finalizados-em-v1";

const initialState: AppState = {
  casas: [],
  relatorios: [],
  totalLucros: 0,
  nomeApp: "RUAN DARK CPA",
  corPrimaria: "#2563EB",
  fundoUrl: "/fundo.png",
  logoUrl: "",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  
  // Queries tRPC
  const casasQuery = trpc.casas.list.useQuery(undefined, {
    enabled: true,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
  
  const relatoriosQuery = trpc.relatorios.list.useQuery(undefined, {
    enabled: true,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: true,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    refetchOnWindowFocus: false,
  });

  // Sincroniza o calendário entre usuários (30s é suficiente e alivia MUITO o banco)
  const plataformasQuery = trpc.plataformas.list.useQuery(undefined, {
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  const createPlataformaMutation = trpc.plataformas.create.useMutation();

  useEffect(() => {
    if (plataformasQuery.data) {
      const savedStr = localStorage.getItem("plataformas-calendario-v2");
      
      // Auto-migrate local platforms to the database if they are not present yet
      if (savedStr) {
        try {
          const localPlats = JSON.parse(savedStr);
          if (Array.isArray(localPlats) && localPlats.length > 0) {
            const dbIds = new Set(plataformasQuery.data.map((p) => p.id));
            const missing = localPlats.filter((p: any) => p && p.id && !dbIds.has(p.id));
            if (missing.length > 0) {
              console.log("Migrating local platforms to database:", missing);
              Promise.all(missing.map(plat => 
                createPlataformaMutation.mutateAsync({
                  id: plat.id,
                  nome: plat.nome,
                  diasPrazo: plat.diasPrazo,
                  dia: plat.dia,
                })
              )).then(() => {
                plataformasQuery.refetch();
              }).catch(err => {
                console.error("Error migrating platforms:", err);
              });
            }
          }
        } catch (e) {
          console.error("Failed to parse local platforms for migration:", e);
        }
      }

      // Wait for any missing local platforms to be migrated first to prevent race-condition overwrite
      let isMigrating = false;
      if (savedStr) {
        try {
          const localPlats = JSON.parse(savedStr);
          if (Array.isArray(localPlats)) {
            const dbIds = new Set(plataformasQuery.data.map((p) => p.id));
            isMigrating = localPlats.some((p: any) => p && p.id && !dbIds.has(p.id));
          }
        } catch {}
      }

      if (!isMigrating) {
        const currentDataStr = JSON.stringify(plataformasQuery.data);
        if (savedStr !== currentDataStr) {
          localStorage.setItem("plataformas-calendario-v2", currentDataStr);
          window.dispatchEvent(new CustomEvent("plataformas-updated", { detail: plataformasQuery.data }));
        }
      }
    }
  }, [plataformasQuery.data]);



  // Mutations tRPC
  const createCasaMutation = trpc.casas.create.useMutation();
  const updateCasaMutation = trpc.casas.update.useMutation();
  const deleteCasaMutation = trpc.casas.delete.useMutation();
  
  const createRelatorioMutation = trpc.relatorios.create.useMutation();
  const updateRelatorioMutation = trpc.relatorios.update.useMutation();
  const deleteRelatorioMutation = trpc.relatorios.delete.useMutation();
  
  const updateSettingsMutation = trpc.settings.update.useMutation();

  // Sincroniza o CACHE do tRPC junto com as atualizações otimistas — evita que uma
  // recarga de outra entidade (casas/settings) reconstrua a lista a partir de dados
  // antigos e faça os ciclos salvos "sumirem".
  const utils = trpc.useUtils();
  const patchRelCache = (id: string, patch: Record<string, unknown>) =>
    utils.relatorios.list.setData(undefined, (old: any) =>
      (old || []).map((r: any) => (r.id === id ? { ...r, ...patch } : r))
    );
  const removeRelCache = (id: string) =>
    utils.relatorios.list.setData(undefined, (old: any) => (old || []).filter((r: any) => r.id !== id));
  const patchCasaCache = (id: string, patch: Record<string, unknown>) =>
    utils.casas.list.setData(undefined, (old: any) =>
      (old || []).map((c: any) => (c.id === id ? { ...c, ...patch } : c))
    );
  const removeCasaCache = (id: string) =>
    utils.casas.list.setData(undefined, (old: any) => (old || []).filter((c: any) => c.id !== id));

  // NOTA: as notificações push (meta iniciada / ciclo finalizado / meta finalizada)
  // são disparadas no SERVIDOR (server/routers.ts), não aqui. Isso garante entrega
  // confiável independente do cache do PWA e funciona a partir de qualquer dispositivo.

  // Carregar dados do tRPC
  useEffect(() => {
    if (casasQuery.isLoading || relatoriosQuery.isLoading || settingsQuery.isLoading) {
      setIsLoading(true);
      return;
    }

    const casas = (casasQuery.data || []).map((casa: any) => ({
      ...casa,
      meta: casa.meta ? Number(casa.meta) : 0,
      media: casa.media ? Number(casa.media) : 0,
      redeNome: casa.redeNome || "",
      prazo: casa.prazo || "",
      linkContaFilha: casa.linkContaFina || "",
      criadoEm: casa.criadoEm instanceof Date ? casa.criadoEm.toISOString() : casa.criadoEm,
    })) as CasaData[];
    
    // Carregar prazos locais (salvo em localStorage por ID do relatório)
    const prazosLocais: Record<string, string> = (() => {
      try { return JSON.parse(localStorage.getItem("relatorio-prazos-v1") || "{}"); } catch { return {}; }
    })();

    const finalizadosEmLocais: Record<string, string> = (() => {
      try { return JSON.parse(localStorage.getItem(RELATORIOS_FINALIZADOS_EM_KEY) || "{}"); } catch { return {}; }
    })();

    const relatorios = (relatoriosQuery.data || []).map((rel: any) => ({
      ...rel,
      cooperacao: rel.cooperacao ? Number(rel.cooperacao) : 0,
      // Usa prazo do DB se existir, senão usa o salvo localmente
      prazo: rel.prazo || prazosLocais[rel.id] || "",
      finalizadoEm: (rel.finalizadoEm instanceof Date ? rel.finalizadoEm.toISOString() : rel.finalizadoEm)
        || finalizadosEmLocais[rel.id] || undefined,
      rows: rel.rows || [],
      criadoEm: rel.criadoEm instanceof Date ? rel.criadoEm.toISOString() : rel.criadoEm,
      atualizadoEm: rel.atualizadoEm instanceof Date ? rel.atualizadoEm.toISOString() : rel.atualizadoEm,
    })) as RelatorioData[];

    const settings = (settingsQuery.data || {}) as any;

    setState((prev) => ({
      ...prev,
      casas,
      relatorios,
      nomeApp: settings.nomeApp || "RUAN DARK CPA",
      corPrimaria: settings.corPrimaria || "#2563EB",
      fundoUrl: settings.fundoUrl || "",
      logoUrl: settings.logoUrl || "",
    }));

    setIsLoading(false);
  }, [casasQuery.data, relatoriosQuery.data, settingsQuery.data, casasQuery.isLoading, relatoriosQuery.isLoading, settingsQuery.isLoading]);

  // Migração única: envia para o banco os prazos e finalizadoEm que só existiam no localStorage
  const prazosMigrados = useRef(false);
  useEffect(() => {
    if (prazosMigrados.current) return;
    if (!relatoriosQuery.data) return;
    let prazosLocais: Record<string, string> = {};
    let finalizadosLocais: Record<string, string> = {};
    try { prazosLocais = JSON.parse(localStorage.getItem("relatorio-prazos-v1") || "{}"); } catch {}
    try { finalizadosLocais = JSON.parse(localStorage.getItem(RELATORIOS_FINALIZADOS_EM_KEY) || "{}"); } catch {}

    const pendentes = (relatoriosQuery.data as any[])
      .map((rel) => {
        const patch: any = { id: rel.id };
        let temAlgo = false;
        if (!rel.prazo && prazosLocais[rel.id]) { patch.prazo = prazosLocais[rel.id]; temAlgo = true; }
        if (!rel.finalizadoEm && finalizadosLocais[rel.id]) { patch.finalizadoEm = finalizadosLocais[rel.id]; temAlgo = true; }
        return temAlgo ? patch : null;
      })
      .filter(Boolean) as any[];

    if (pendentes.length === 0) { prazosMigrados.current = true; return; }
    prazosMigrados.current = true;
    Promise.allSettled(
      pendentes.map((patch) => updateRelatorioMutation.mutateAsync(patch))
    ).then(() => { relatoriosQuery.refetch(); });
  }, [relatoriosQuery.data]);

  const addCasa = async (casa: Omit<CasaData, "id" | "criadoEm">) => {
    try {
      const result = await createCasaMutation.mutateAsync({
        nome: casa.nome,
        login: casa.login,
        senha: casa.senha,
        redeNome: casa.redeNome,
        media: casa.media?.toString(),
        linkCasa: casa.linkCasa,
        linkContaFina: casa.linkContaFilha,
        meta: casa.meta?.toString(),
        prazo: casa.prazo,
      });
      // Anexa a casa nova ao cache (sem refetch da lista toda = bem mais rápido)
      if (result && (result as any).id) {
        utils.casas.list.setData(undefined, (old: any) => {
          const lista = old || [];
          return lista.some((c: any) => c.id === (result as any).id) ? lista : [...lista, result];
        });
      } else {
        await casasQuery.refetch();
      }
    } catch (error) {
      console.error("Erro ao criar casa:", error);
    }
  };

  const updateCasa = async (id: string, updates: Partial<CasaData>) => {
    // ATUALIZAÇÃO OTIMISTA: aplica as mudanças na hora
    setState((prev) => ({
      ...prev,
      casas: prev.casas.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    patchCasaCache(id, {
      ...(updates.nome !== undefined ? { nome: updates.nome } : {}),
      ...(updates.login !== undefined ? { login: updates.login } : {}),
      ...(updates.senha !== undefined ? { senha: updates.senha } : {}),
      ...(updates.redeNome !== undefined ? { redeNome: updates.redeNome } : {}),
      ...(updates.media !== undefined ? { media: updates.media?.toString() } : {}),
      ...(updates.linkCasa !== undefined ? { linkCasa: updates.linkCasa } : {}),
      ...(updates.linkContaFilha !== undefined ? { linkContaFina: updates.linkContaFilha } : {}),
      ...(updates.meta !== undefined ? { meta: updates.meta?.toString() } : {}),
      ...(updates.prazo !== undefined ? { prazo: updates.prazo } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
    });
    updateCasaMutation.mutateAsync({
      id,
      nome: updates.nome,
      login: updates.login,
      senha: updates.senha,
      redeNome: updates.redeNome,
      media: updates.media?.toString(),
      linkCasa: updates.linkCasa,
      linkContaFina: updates.linkContaFilha,
      meta: updates.meta?.toString(),
      prazo: updates.prazo,
      status: updates.status,
    }).catch((error) => {
      console.error("Erro ao atualizar casa:", error);
      casasQuery.refetch();
    });
  };

  // Muda só o status da casa na hora (deletar/restaurar/finalizar) — tela + cache
  const setCasaStatusOtimista = (id: string, status: string, extra?: Partial<CasaData>) => {
    setState((prev) => ({
      ...prev,
      casas: prev.casas.map((c) => (c.id === id ? { ...c, status: status as any, ...extra } : c)),
    }));
    patchCasaCache(id, { status, ...(extra as Record<string, unknown>) });
  };

  const deleteCasa = async (id: string) => {
    setCasaStatusOtimista(id, "lixeira");
    updateCasaMutation.mutateAsync({ id, status: "lixeira" as any }).catch((error) => {
      console.error("Erro ao deletar casa:", error);
      casasQuery.refetch();
    });
  };

  const restaurarCasa = async (id: string) => {
    setCasaStatusOtimista(id, "ativa");
    updateCasaMutation.mutateAsync({ id, status: "ativa" }).catch((error) => {
      console.error("Erro ao restaurar casa:", error);
      casasQuery.refetch();
    });
  };

  const deletePermanentementeCasa = async (id: string) => {
    setState((prev) => ({ ...prev, casas: prev.casas.filter((c) => c.id !== id) }));
    removeCasaCache(id);
    deleteCasaMutation.mutateAsync({ id }).catch((error) => {
      console.error("Erro ao deletar permanentemente casa:", error);
      casasQuery.refetch();
    });
  };

  const esvaziarLixeiraCasas = async () => {
    try {
      const casasLixeira = state.casas.filter((c) => c.status === "lixeira");
      for (const casa of casasLixeira) {
        await deleteCasaMutation.mutateAsync({ id: casa.id });
      }
      await casasQuery.refetch();
    } catch (error) {
      console.error("Erro ao esvaziar lixeira de casas:", error);
    }
  };


  const finalizarCasa = async (id: string) => {
    const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    setCasaStatusOtimista(id, "finalizada", { dataFim: hoje } as any);
    updateCasaMutation.mutateAsync({ id, status: "finalizada", dataFim: hoje }).catch((error) => {
      console.error("Erro ao finalizar casa:", error);
      casasQuery.refetch();
    });
  };

  const addRelatorio = async (relatorio: Omit<RelatorioData, "id" | "criadoEm">) => {
    try {
      // Deep copy dos rows para evitar compartilhamento
      const rowsCopy = JSON.parse(JSON.stringify(relatorio.rows));
      const result = await createRelatorioMutation.mutateAsync({
        casaId: relatorio.casaId,
        agente: relatorio.agente,
        prazo: relatorio.prazo || undefined,
        cooperacao: relatorio.cooperacao.toString(),
        rows: rowsCopy as any,
      });

      // Salvar prazo em localStorage mapeado pelo ID do relatório criado
      const relId = (result as any).id;
      if (relatorio.prazo && relId) {
        try {
          const prazos = JSON.parse(localStorage.getItem("relatorio-prazos-v1") || "{}");
          prazos[relId] = relatorio.prazo;
          localStorage.setItem("relatorio-prazos-v1", JSON.stringify(prazos));
        } catch {}
      }

      // Anexa o novo relatório ao cache (sem refetch da lista toda, que poderia
      // sobrescrever edições de ciclo ainda não recarregadas).
      if (relId) {
        const { prazoInput, ...novo } = result as any;
        utils.relatorios.list.setData(undefined, (old: any) => {
          const lista = old || [];
          return lista.some((r: any) => r.id === relId) ? lista : [...lista, novo];
        });
      } else {
        await relatoriosQuery.refetch();
      }
    } catch (error) {
      console.error("Erro ao criar relatório:", error);
    }
  };

  const updateRelatorio = async (id: string, relatorio: Partial<RelatorioData>) => {
    try {
      // Salvar prazo em localStorage se fornecido
      if (relatorio.prazo !== undefined) {
        try {
          const prazos = JSON.parse(localStorage.getItem("relatorio-prazos-v1") || "{}");
          prazos[id] = relatorio.prazo;
          localStorage.setItem("relatorio-prazos-v1", JSON.stringify(prazos));
        } catch {}
      }

      // ATUALIZAÇÃO OTIMISTA: muda a tela na hora, sem esperar o servidor
      setState((prev) => ({
        ...prev,
        relatorios: prev.relatorios.map((r) =>
          r.id === id
            ? {
                ...r,
                ...(relatorio.rows !== undefined ? { rows: relatorio.rows } : {}),
                ...(relatorio.cooperacao !== undefined ? { cooperacao: relatorio.cooperacao } : {}),
                ...(relatorio.agente !== undefined ? { agente: relatorio.agente } : {}),
                ...(relatorio.status !== undefined ? { status: relatorio.status } : {}),
                ...(relatorio.prazo !== undefined ? { prazo: relatorio.prazo } : {}),
                ...(relatorio.etiqueta !== undefined ? { etiqueta: relatorio.etiqueta } : {}),
                ...(relatorio.jogos !== undefined ? { jogos: relatorio.jogos } : {}),
              }
            : r
        ),
      }));
      // Mantém o cache do tRPC em sincronia (server-shaped) para não "sumir" ao recarregar
      patchRelCache(id, {
        ...(relatorio.rows !== undefined ? { rows: relatorio.rows } : {}),
        ...(relatorio.cooperacao !== undefined ? { cooperacao: relatorio.cooperacao.toString() } : {}),
        ...(relatorio.agente !== undefined ? { agente: relatorio.agente } : {}),
        ...(relatorio.status !== undefined ? { status: relatorio.status } : {}),
        ...(relatorio.etiqueta !== undefined ? { etiqueta: relatorio.etiqueta } : {}),
        ...(relatorio.jogos !== undefined ? { jogos: relatorio.jogos } : {}),
      });

      // Deep copy dos rows para evitar compartilhamento
      const rowsCopy = relatorio.rows ? JSON.parse(JSON.stringify(relatorio.rows)) : undefined;
      // Sincroniza com o servidor em segundo plano (não trava a UI; sem refetch da lista inteira)
      updateRelatorioMutation.mutateAsync({
        id,
        agente: relatorio.agente,
        prazo: relatorio.prazo,
        etiqueta: relatorio.etiqueta,
        jogos: relatorio.jogos,
        cooperacao: relatorio.cooperacao?.toString(),
        rows: rowsCopy as any,
        status: relatorio.status,
      }).catch((error) => {
        console.error("Erro ao atualizar relatório:", error);
        relatoriosQuery.refetch(); // em caso de erro, reconcilia com o servidor
      });
    } catch (error) {
      console.error("Erro ao atualizar relatório:", error);
    }
  };

  const deleteRelatorio = async (id: string) => {
    // ATUALIZAÇÃO OTIMISTA: remove da tela na hora
    setState((prev) => ({ ...prev, relatorios: prev.relatorios.filter((r) => r.id !== id) }));
    removeRelCache(id);
    deleteRelatorioMutation.mutateAsync({ id }).catch((error) => {
      console.error("Erro ao deletar relatório:", error);
      relatoriosQuery.refetch();
    });
  };

  const finalizarRelatorio = async (id: string) => {
    try {
      try {
        const finalizadosEm = JSON.parse(localStorage.getItem(RELATORIOS_FINALIZADOS_EM_KEY) || "{}");
        finalizadosEm[id] = new Date().toISOString();
        localStorage.setItem(RELATORIOS_FINALIZADOS_EM_KEY, JSON.stringify(finalizadosEm));
      } catch {}
      // ATUALIZAÇÃO OTIMISTA: marca como finalizado na hora
      setState((prev) => ({
        ...prev,
        relatorios: prev.relatorios.map((r) =>
          r.id === id ? { ...r, status: "finalizado", finalizadoEm: new Date().toISOString() } : r
        ),
      }));
      patchRelCache(id, { status: "finalizado" });
      // Sincroniza em segundo plano — envia a data de finalização pra ela sempre ficar salva no banco
      updateRelatorioMutation.mutateAsync({ id, status: "finalizado", finalizadoEm: new Date().toISOString() }).catch((error) => {
        console.error("Erro ao finalizar relatório:", error);
        relatoriosQuery.refetch();
      });
    } catch (error) {
      console.error("Erro ao finalizar relatório:", error);
    }
  };

  const reutilizarRelatorio = async (id: string) => {
    const relatorioParaReutilizar = state.relatorios.find((r) => r.id === id);
    if (relatorioParaReutilizar) {
      // ATUALIZAÇÃO OTIMISTA: volta para "ativo" na hora
      setState((prev) => ({
        ...prev,
        relatorios: prev.relatorios.map((r) => (r.id === id ? { ...r, status: "ativo" } : r)),
      }));
      patchRelCache(id, { status: "ativo" });
      updateRelatorioMutation.mutateAsync({ id, status: "ativo" }).catch((error) => {
        console.error("Erro ao reutilizar relatório:", error);
        relatoriosQuery.refetch();
      });
    }
  };

  const duplicarRelatorio = async (id: string) => {
    const relatorioDuplicar = state.relatorios.find((r) => r.id === id);
    if (relatorioDuplicar) {
      try {
        // Deep copy dos rows para evitar compartilhamento
        const rowsCopy = JSON.parse(JSON.stringify(relatorioDuplicar.rows));
        await createRelatorioMutation.mutateAsync({
          casaId: relatorioDuplicar.casaId,
          agente: relatorioDuplicar.agente,
          cooperacao: relatorioDuplicar.cooperacao.toString(),
          rows: rowsCopy as any,
        });
        await relatoriosQuery.refetch();
      } catch (error) {
        console.error("Erro ao duplicar relatório:", error);
      }
    }
  };

  const esvaziarLixeira = async () => {
    const relatoriosLixeira = state.relatorios.filter((r) => r.status === "lixeira");
    try {
      for (const rel of relatoriosLixeira) {
        await deleteRelatorioMutation.mutateAsync({ id: rel.id });
      }
      await relatoriosQuery.refetch();
    } catch (error) {
      console.error("Erro ao esvaziar lixeira:", error);
    }
  };

  const updateAppName = async (nome: string) => {
    setState((prev) => ({
      ...prev,
      nomeApp: nome,
    }));
    try {
      await updateSettingsMutation.mutateAsync({ nomeApp: nome });
    } catch (error) {
      console.error("Erro ao salvar nome:", error);
    }
  };

  const updateCorPrimaria = async (cor: string) => {
    setState((prev) => ({
      ...prev,
      corPrimaria: cor,
    }));
    try {
      await updateSettingsMutation.mutateAsync({ corPrimaria: cor });
    } catch (error) {
      console.error("Erro ao salvar cor:", error);
    }
  };

  const updateFundo = async (url: string) => {
    setState((prev) => ({
      ...prev,
      fundoUrl: url,
    }));
    try {
      await updateSettingsMutation.mutateAsync({ fundoUrl: url });
    } catch (error) {
      console.error("Erro ao salvar fundo:", error);
    }
  };

  const updateLogo = async (url: string) => {
    setState((prev) => ({
      ...prev,
      logoUrl: url,
    }));
    try {
      await updateSettingsMutation.mutateAsync({ logoUrl: url });
    } catch (error) {
      console.error("Erro ao salvar logo:", error);
    }
  };

  const calculateTotalLucros = () => {
    return state.relatorios
      .filter((r) => r.status === "finalizado")
      .reduce((total, r) => {
        if (!Array.isArray(r.rows)) {
          return total;
        }
        const resultadosTotal = r.rows.reduce((sum, row) => {
          const resultado = Number(row.resultado || 0);
          return sum + (isNaN(resultado) ? 0 : resultado);
        }, 0);
        const cooperacaoTotal = Number(r.cooperacao || 0);
        const cooperacaoValid = isNaN(cooperacaoTotal) ? 0 : cooperacaoTotal;
        return total + resultadosTotal + cooperacaoValid;
      }, 0);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        addCasa,
        updateCasa,
        deleteCasa,
        finalizarCasa,
        restaurarCasa,
        esvaziarLixeiraCasas,
        deletePermanentementeCasa,
        addRelatorio,
        updateRelatorio,
        deleteRelatorio,
        finalizarRelatorio,
        reutilizarRelatorio,
        duplicarRelatorio,
        esvaziarLixeira,
        updateAppName,
        updateCorPrimaria,
        updateFundo,
        updateLogo,
        calculateTotalLucros,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp deve ser usado dentro de AppProvider");
  }
  return context;
}
