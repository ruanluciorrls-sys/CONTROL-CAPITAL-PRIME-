import { createContext, useContext, useEffect, useState } from "react";
import { supabase, supabaseService } from "@/lib/supabase";
import { AppState, CasaData, RelatorioData } from "@/lib/types";

interface SupabaseContextType {
  isConnected: boolean;
  isSyncing: boolean;
  syncToSupabase: (state: AppState) => Promise<void>;
  loadFromSupabase: () => Promise<AppState | null>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Verificar conexão com Supabase
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("casas")
          .select("count", { count: "exact", head: true });

        if (error) {
          console.log("Tabelas do Supabase nao existem ainda. Execute o SQL em supabase_schema.sql");
          setIsConnected(false);
        } else {
          console.log("Conectado ao Supabase");
          setIsConnected(true);
        }
      } catch (error: any) {
        console.log("Supabase nao disponivel. Usando apenas localStorage.");
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  // Sincronizar estado local com Supabase
  const syncToSupabase = async (state: AppState) => {
    if (!isConnected) {
      return;
    }

    setIsSyncing(true);
    try {
      // Sincronizar casas
      for (const casa of state.casas) {
        try {
          const { data: existing } = await supabase
            .from("casas")
            .select("id")
            .eq("id", casa.id)
            .single();

          if (existing) {
            await supabaseService.updateCasa(casa.id, casa as any);
          } else {
            await supabaseService.addCasa(casa as any);
          }
        } catch (error) {
          // Silenciosamente ignorar erros de sincronização
        }
      }

      // Sincronizar relatórios
      for (const relatorio of state.relatorios) {
        try {
          const { data: existing } = await supabase
            .from("relatorios")
            .select("id")
            .eq("id", relatorio.id)
            .single();

          if (existing) {
            await supabaseService.updateRelatorio(relatorio.id, relatorio as any);
          } else {
            await supabaseService.addRelatorio(relatorio as any);
          }
        } catch (error) {
          // Silenciosamente ignorar erros de sincronização
        }
      }

      console.log("Dados sincronizados com Supabase");
    } catch (error) {
      console.log("Nao foi possivel sincronizar com Supabase");
    } finally {
      setIsSyncing(false);
    }
  };

  // Carregar dados do Supabase
  const loadFromSupabase = async (): Promise<AppState | null> => {
    if (!isConnected) {
      return null;
    }

    try {
      setIsSyncing(true);

      const casas = await supabaseService.getCasas();
      const relatorios = await supabaseService.getRelatorios();

      // Se nenhum dado foi retornado, Supabase nao esta disponivel
      if (casas.length === 0 && relatorios.length === 0) {
        return null;
      }

      const state: AppState = {
        casas: casas as CasaData[],
        relatorios: relatorios as RelatorioData[],
        totalLucros: 0,
        nomeApp: "RUAN DARK CPA",
        corPrimaria: "#2563EB",
        fundoUrl: "",
        logoUrl: "",
      };

      console.log("Dados carregados do Supabase");
      return state;
    } catch (error) {
      console.log("Nao foi possivel carregar do Supabase");
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        isConnected,
        isSyncing,
        syncToSupabase,
        loadFromSupabase,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase deve ser usado dentro de SupabaseProvider");
  }
  return context;
}
