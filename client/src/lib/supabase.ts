import { createClient } from "@supabase/supabase-js";

// Credenciais do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://clmmijcxcxiiregyzlqe.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ngCUw6J_gAH7mywmdwqMeg_xWqFSSoY";

// Verificar se as credenciais estão configuradas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Credenciais do Supabase não configuradas. Usando apenas localStorage.");
}

// Criar cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funções de upload para Supabase Storage
export async function uploadFileToSupabase(
  bucket: string,
  file: File,
  path: string
): Promise<{ url: string; path: string } | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

export async function deleteFileFromSupabase(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error(`Error deleting from ${bucket}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Tipos para as tabelas
export interface CasaSupabase {
  id: string;
  nome: string;
  login: string;
  senha: string;
  meta: number;
  media: number;
  prazo: string;
  linkCasa: string;
  linkContaFilha: string;
  status: "ativa" | "finalizada";
  criadoEm: string;
  finalizadoEm?: string;
}

export interface RelatorioSupabase {
  id: string;
  casaId: string;
  agente: string;
  prazo: string;
  cooperacao: number;
  rows: RelatorioRow[];
  status: "ativo" | "finalizado";
  criadoEm: string;
  finalizadoEm?: string;
}

export interface RelatorioRow {
  numero: number;
  deposito: number;
  saque: number;
  bau: number;
  resultado: number;
}

// Funções para sincronizar com Supabase
export const supabaseService = {
  // Casas
  async getCasas() {
    try {
      if (!SUPABASE_ANON_KEY) {
        console.log("Supabase não configurado. Usando apenas localStorage.");
        return [];
      }
      const { data, error } = await supabase
        .from("casas")
        .select("*")
        .order("criadoEm", { ascending: false });

      if (error) {
        console.warn("Aviso ao buscar casas do Supabase:", error.message);
        return [];
      }
      return data || [];
    } catch (error: any) {
      console.warn("Supabase não disponível. Usando localStorage.", error?.message);
      return [];
    }
  },

  async addCasa(casa: Omit<CasaSupabase, "id">) {
    try {
      if (!SUPABASE_ANON_KEY) return null;
      const { data, error } = await supabase
        .from("casas")
        .insert([{ ...casa, id: Date.now().toString() }])
        .select()
        .single();

      if (error) {
        console.warn("Aviso ao adicionar casa:", error.message);
        return null;
      }
      return data;
    } catch (error: any) {
      console.warn("Não foi possível sincronizar com Supabase:", error?.message);
      return null;
    }
  },

  async updateCasa(id: string, updates: Partial<CasaSupabase>) {
    try {
      if (!SUPABASE_ANON_KEY) return null;
      const { data, error } = await supabase
        .from("casas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.warn("Aviso ao atualizar casa:", error.message);
        return null;
      }
      return data;
    } catch (error: any) {
      console.warn("Não foi possível sincronizar com Supabase:", error?.message);
      return null;
    }
  },

  async deleteCasa(id: string) {
    try {
      if (!SUPABASE_ANON_KEY) return false;
      const { error } = await supabase.from("casas").delete().eq("id", id);

      if (error) {
        console.warn("Aviso ao deletar casa:", error.message);
        return false;
      }
      return true;
    } catch (error: any) {
      console.warn("Não foi possível sincronizar com Supabase:", error?.message);
      return false;
    }
  },

  // Relatórios
  async getRelatorios() {
    try {
      if (!SUPABASE_ANON_KEY) {
        console.log("Supabase não configurado. Usando apenas localStorage.");
        return [];
      }
      const { data, error } = await supabase
        .from("relatorios")
        .select("*")
        .order("criadoEm", { ascending: false });

      if (error) {
        console.warn("Aviso ao buscar relatórios do Supabase:", error.message);
        return [];
      }
      return data || [];
    } catch (error: any) {
      console.warn("Supabase não disponível. Usando localStorage.", error?.message);
      return [];
    }
  },

  async addRelatorio(relatorio: Omit<RelatorioSupabase, "id">) {
    try {
      if (!SUPABASE_ANON_KEY) return null;
      const { data, error } = await supabase
        .from("relatorios")
        .insert([{ ...relatorio, id: Date.now().toString() }])
        .select()
        .single();

      if (error) {
        console.warn("Aviso ao adicionar relatório:", error.message);
        return null;
      }
      return data;
    } catch (error: any) {
      console.warn("Não foi possível sincronizar com Supabase:", error?.message);
      return null;
    }
  },

  async updateRelatorio(id: string, updates: Partial<RelatorioSupabase>) {
    try {
      if (!SUPABASE_ANON_KEY) return null;
      const { data, error } = await supabase
        .from("relatorios")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.warn("Aviso ao atualizar relatório:", error.message);
        return null;
      }
      return data;
    } catch (error: any) {
      console.warn("Não foi possível sincronizar com Supabase:", error?.message);
      return null;
    }
  },

  async deleteRelatorio(id: string) {
    try {
      if (!SUPABASE_ANON_KEY) return false;
      const { error } = await supabase
        .from("relatorios")
        .delete()
        .eq("id", id);

      if (error) {
        console.warn("Aviso ao deletar relatório:", error.message);
        return false;
      }
      return true;
    } catch (error: any) {
      console.warn("Não foi possível sincronizar com Supabase:", error?.message);
      return false;
    }
  },
};
