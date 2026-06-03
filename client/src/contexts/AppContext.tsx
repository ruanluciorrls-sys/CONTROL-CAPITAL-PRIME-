import { createContext, useContext, useState, useEffect } from "react";
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

  // Mutations tRPC
  const createCasaMutation = trpc.casas.create.useMutation();
  const updateCasaMutation = trpc.casas.update.useMutation();
  const deleteCasaMutation = trpc.casas.delete.useMutation();
  
  const createRelatorioMutation = trpc.relatorios.create.useMutation();
  const updateRelatorioMutation = trpc.relatorios.update.useMutation();
  const deleteRelatorioMutation = trpc.relatorios.delete.useMutation();
  
  const updateSettingsMutation = trpc.settings.update.useMutation();

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
      finalizadoEm: rel.finalizadoEm || finalizadosEmLocais[rel.id] || undefined,
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

  const addCasa = async (casa: Omit<CasaData, "id" | "criadoEm">) => {
    try {
      await createCasaMutation.mutateAsync({
        nome: casa.nome,
        login: casa.login,
        senha: casa.senha,
        media: casa.media?.toString(),
        linkCasa: casa.linkCasa,
        linkContaFina: casa.linkContaFilha,
        meta: casa.meta?.toString(),
        prazo: casa.prazo,
      });
      await casasQuery.refetch();
    } catch (error) {
      console.error("Erro ao criar casa:", error);
    }
  };

  const updateCasa = async (id: string, updates: Partial<CasaData>) => {
    try {
      await updateCasaMutation.mutateAsync({
        id,
        nome: updates.nome,
        login: updates.login,
        senha: updates.senha,
        media: updates.media?.toString(),
        linkCasa: updates.linkCasa,
        linkContaFina: updates.linkContaFilha,
        meta: updates.meta?.toString(),
        prazo: updates.prazo,
        status: updates.status,
      });
      await casasQuery.refetch();
    } catch (error) {
      console.error("Erro ao atualizar casa:", error);
    }
  };

  const deleteCasa = async (id: string) => {
    try {
      await updateCasaMutation.mutateAsync({
        id,
        status: "lixeira" as any,
      });
      await casasQuery.refetch();
    } catch (error) {
      console.error("Erro ao deletar casa:", error);
    }
  };

  const restaurarCasa = async (id: string) => {
    try {
      await updateCasaMutation.mutateAsync({
        id,
        status: "ativa",
      });
      await casasQuery.refetch();
    } catch (error) {
      console.error("Erro ao restaurar casa:", error);
    }
  };

  const deletePermanentementeCasa = async (id: string) => {
    try {
      await deleteCasaMutation.mutateAsync({ id });
      await casasQuery.refetch();
    } catch (error) {
      console.error("Erro ao deletar permanentemente casa:", error);
    }
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
    try {
      const hoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      await updateCasaMutation.mutateAsync({
        id,
        status: "finalizada",
        dataFim: hoje,
      });
      await casasQuery.refetch();
    } catch (error) {
      console.error("Erro ao finalizar casa:", error);
    }
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

      // Recarregar relatórios
      await relatoriosQuery.refetch();
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

      // Deep copy dos rows para evitar compartilhamento
      const rowsCopy = relatorio.rows ? JSON.parse(JSON.stringify(relatorio.rows)) : undefined;
      await updateRelatorioMutation.mutateAsync({
        id,
        agente: relatorio.agente,
        prazo: relatorio.prazo,
        cooperacao: relatorio.cooperacao?.toString(),
        rows: rowsCopy as any,
        status: relatorio.status,
      });
      // Recarregar relatórios
      await relatoriosQuery.refetch();
    } catch (error) {
      console.error("Erro ao atualizar relatório:", error);
    }
  };

  const deleteRelatorio = async (id: string) => {
    try {
      await deleteRelatorioMutation.mutateAsync({ id });
      // Recarregar relatórios
      await relatoriosQuery.refetch();
    } catch (error) {
      console.error("Erro ao deletar relatório:", error);
    }
  };

  const finalizarRelatorio = async (id: string) => {
    try {
      try {
        const finalizadosEm = JSON.parse(localStorage.getItem(RELATORIOS_FINALIZADOS_EM_KEY) || "{}");
        finalizadosEm[id] = new Date().toISOString();
        localStorage.setItem(RELATORIOS_FINALIZADOS_EM_KEY, JSON.stringify(finalizadosEm));
      } catch {}
      await updateRelatorioMutation.mutateAsync({
        id,
        status: "finalizado",
      });
      await relatoriosQuery.refetch();
    } catch (error) {
      console.error("Erro ao finalizar relatório:", error);
    }
  };

  const reutilizarRelatorio = async (id: string) => {
    const relatorioParaReutilizar = state.relatorios.find((r) => r.id === id);
    if (relatorioParaReutilizar) {
      try {
        // Mudar o status de "finalizado" para "ativo"
        await updateRelatorioMutation.mutateAsync({
          id: relatorioParaReutilizar.id,
          status: "ativo",
        });
        // Recarregar relatórios
        await relatoriosQuery.refetch();
      } catch (error) {
        console.error("Erro ao reutilizar relatório:", error);
      }
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
