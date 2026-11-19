import { createContext, useContext, useState, useEffect, useRef } from "react";
import { AppState, CasaData, RelatorioData } from "@/lib/types";
import { trpc } from "@/lib/trpc";
import { celebrar } from "@/lib/celebrar";
import { criarFilaSalvamentoRelatorios, type SalvamentoRelatorios } from "@/lib/salvamentoRelatorios";
import { isEditingActive } from "@/lib/syncLock";
import { valorRecebidoDoReembolso } from "@shared/reembolso";

interface AppContextType {
  state: AppState;
  addCasa: (casa: Omit<CasaData, "id" | "criadoEm">) => Promise<boolean>;
  updateCasa: (id: string, casa: Partial<CasaData>) => Promise<boolean>;
  deleteCasa: (id: string) => void;
  finalizarCasa: (id: string) => void;
  restaurarCasa: (id: string) => void;
  esvaziarLixeiraCasas: () => void;
  deletePermanentementeCasa: (id: string) => void;
  addRelatorio: (relatorio: Omit<RelatorioData, "id" | "criadoEm">) => void;
  updateRelatorio: (id: string, relatorio: Partial<RelatorioData>) => void;
  registrarReembolso: (id: string, valor: number, concluir: boolean) => Promise<boolean>;
  salvamentoRelatorios?: SalvamentoRelatorios;
  deleteRelatorio: (id: string) => void;
  finalizarRelatorio: (id: string) => void;
  finalizarRelatorioComJogos: (id: string, jogos: string, compartilhamento?: { texto: string }) => Promise<boolean>;
  reutilizarRelatorio: (id: string) => void;
  duplicarRelatorio: (id: string) => void;
  ordemRelatorios: string[] | undefined;
  salvandoOrdemRelatorios: boolean;
  reordenarRelatorios: (ids: string[]) => Promise<string[]>;
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
  const [salvamentoRelatorios, setSalvamentoRelatorios] = useState<SalvamentoRelatorios>({});
  const temGravacaoPendente = Object.values(salvamentoRelatorios).some(salvamento => salvamento?.status === "salvando");
  
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
    refetchOnReconnect: !temGravacaoPendente,
    refetchInterval: () => (temGravacaoPendente || isEditingActive() ? false : 12000),
  });

  const settingsQuery = trpc.settings.get.useQuery();
  const ordemRelatoriosQuery = trpc.relatorios.ordem.useQuery(undefined, { retry: false });

  // Mutations tRPC
  const createCasaMutation = trpc.casas.create.useMutation();
  const updateCasaMutation = trpc.casas.update.useMutation();
  const deleteCasaMutation = trpc.casas.delete.useMutation();
  
  const createRelatorioMutation = trpc.relatorios.create.useMutation();
  const updateRelatorioMutation = trpc.relatorios.update.useMutation();
  const deleteRelatorioMutation = trpc.relatorios.delete.useMutation();
  const [filaSalvamentoRelatorios] = useState(() =>
    criarFilaSalvamentoRelatorios<Parameters<typeof updateRelatorioMutation.mutateAsync>[0]>(
      (id, salvamento) => setSalvamentoRelatorios(atual => ({ ...atual, [id]: salvamento })),
      () => { void relatoriosQuery.refetch(); },
    ),
  );
  const gravarRelatorio = (patch: Parameters<typeof updateRelatorioMutation.mutateAsync>[0]) =>
    filaSalvamentoRelatorios.enfileirar(patch, updateRelatorioMutation.mutateAsync);
  
  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSettled: () => utils.settings.get.invalidate(),
  });

  // Sincroniza o CACHE do tRPC junto com as atualizações otimistas — evita que uma
  // recarga de outra entidade (casas/settings) reconstrua a lista a partir de dados
  // antigos e faça os ciclos salvos "sumirem".
  const utils = trpc.useUtils();
  const reordenarRelatoriosMutation = trpc.relatorios.reordenar.useMutation({
    onMutate: async ({ ids }) => {
      await utils.relatorios.ordem.cancel();
      const anterior = utils.relatorios.ordem.getData();
      utils.relatorios.ordem.setData(undefined, ids);
      return { anterior };
    },
    onError: (_error, _input, context) => {
      if (context?.anterior) utils.relatorios.ordem.setData(undefined, context.anterior);
    },
    onSuccess: async ids => {
      await utils.relatorios.ordem.cancel();
      utils.relatorios.ordem.setData(undefined, ids);
    },
  });
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
      metaRecarga: casa.metaRecarga == null ? null : Number(casa.metaRecarga),
      media: casa.media ? Number(casa.media) : 0,
      redeNome: casa.redeNome || "",
      reembolso: casa.reembolso || null,
      reembolsadoEm: casa.reembolsadoEm instanceof Date ? casa.reembolsadoEm.toISOString() : casa.reembolsadoEm,
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
      valorReembolso: rel.valorReembolso == null ? null : Number(rel.valorReembolso),
      // Usa prazo do DB se existir, senão usa o salvo localmente
      prazo: rel.prazo || prazosLocais[rel.id] || "",
      finalizadoEm: (rel.finalizadoEm instanceof Date ? rel.finalizadoEm.toISOString() : rel.finalizadoEm)
        || finalizadosEmLocais[rel.id] || undefined,
      rows: rel.rows || [],
      reembolso: rel.reembolso || null,
      reembolsadoEm: rel.reembolsadoEm instanceof Date ? rel.reembolsadoEm.toISOString() : rel.reembolsadoEm,
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
    void utils.relatorios.list.cancel();
    pendentes.forEach(gravarRelatorio);
    filaSalvamentoRelatorios.solicitarReconciliacao();
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
        metaRecarga: casa.metaRecarga == null ? casa.metaRecarga : String(casa.metaRecarga),
        prazo: casa.prazo,
      });
      // Anexa a casa nova ao cache (sem refetch da lista toda = bem mais rápido)
      if (result && (result as any).id) {
        utils.casas.list.setData(undefined, (old: any) => {
          const lista = old || [];
          return lista.some((c: any) => c.id === (result as any).id) ? lista : [...lista, result];
        });
        return true;
      }
      await casasQuery.refetch();
      return false;
    } catch (error) {
      console.error("Erro ao criar casa:", error);
      return false;
    }
  };

  const updateCasa = async (id: string, updates: Partial<CasaData>) => {
    const metaRecarga = updates.metaRecarga == null ? updates.metaRecarga : String(updates.metaRecarga);
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
      ...(metaRecarga !== undefined ? { metaRecarga } : {}),
      ...(updates.prazo !== undefined ? { prazo: updates.prazo } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.reembolso !== undefined ? { reembolso: updates.reembolso } : {}),
    });
    return updateCasaMutation.mutateAsync({
      id,
      nome: updates.nome,
      login: updates.login,
      senha: updates.senha,
      redeNome: updates.redeNome,
      media: updates.media?.toString(),
      linkCasa: updates.linkCasa,
      linkContaFina: updates.linkContaFilha,
      meta: updates.meta?.toString(),
      metaRecarga,
      prazo: updates.prazo,
      status: updates.status,
      reembolso: updates.reembolso,
      reembolsadoEm: updates.reembolsadoEm,
    }).then(() => true).catch((error) => {
      console.error("Erro ao atualizar casa:", error);
      void casasQuery.refetch();
      return false;
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
        filaSalvamentoRelatorios.solicitarReconciliacao();
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

      // Uma leitura anterior a esta alteracao nao deve substituir o cache otimista.
      void utils.relatorios.list.cancel();
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
                ...(relatorio.reembolso !== undefined ? { reembolso: relatorio.reembolso } : {}),
                ...(relatorio.reembolsadoEm !== undefined ? { reembolsadoEm: relatorio.reembolsadoEm } : {}),
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
        ...(relatorio.prazo !== undefined ? { prazo: relatorio.prazo } : {}),
        ...(relatorio.etiqueta !== undefined ? { etiqueta: relatorio.etiqueta } : {}),
        ...(relatorio.jogos !== undefined ? { jogos: relatorio.jogos } : {}),
        ...(relatorio.reembolso !== undefined ? { reembolso: relatorio.reembolso } : {}),
        ...(relatorio.reembolsadoEm !== undefined ? { reembolsadoEm: relatorio.reembolsadoEm ? new Date(relatorio.reembolsadoEm) : null } : {}),
      });

      // Deep copy dos rows para evitar compartilhamento
      const rowsCopy = relatorio.rows ? JSON.parse(JSON.stringify(relatorio.rows)) : undefined;
      // Sincroniza com o servidor em segundo plano (não trava a UI; sem refetch da lista inteira)
      void gravarRelatorio({
        id,
        agente: relatorio.agente,
        prazo: relatorio.prazo,
        etiqueta: relatorio.etiqueta,
        jogos: relatorio.jogos,
        cooperacao: relatorio.cooperacao?.toString(),
        rows: rowsCopy as any,
        status: relatorio.status,
        reembolso: relatorio.reembolso,
        reembolsadoEm: relatorio.reembolsadoEm,
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
      filaSalvamentoRelatorios.solicitarReconciliacao();
    });
  };

  const finalizarRelatorio = async (id: string) => {
    try {
      const finalizadoEm = new Date().toISOString();
      // 🎉 Comemora se o relatório deu lucro
      try {
        const rel = state.relatorios.find((r) => r.id === id);
        if (rel) {
          const lucro = (rel.rows || []).reduce((s, row) => s + (Number(row.resultado) || 0), 0) + (Number(rel.cooperacao) || 0);
          if (lucro > 0) celebrar({ valor: lucro });
        }
      } catch {}
      try {
        const finalizadosEm = JSON.parse(localStorage.getItem(RELATORIOS_FINALIZADOS_EM_KEY) || "{}");
        finalizadosEm[id] = finalizadoEm;
        localStorage.setItem(RELATORIOS_FINALIZADOS_EM_KEY, JSON.stringify(finalizadosEm));
      } catch {}
      void utils.relatorios.list.cancel();
      // ATUALIZAÇÃO OTIMISTA: marca como finalizado na hora
      setState((prev) => ({
        ...prev,
        relatorios: prev.relatorios.map((r) =>
          r.id === id ? { ...r, status: "finalizado", finalizadoEm } : r
        ),
      }));
      patchRelCache(id, { status: "finalizado", finalizadoEm: new Date(finalizadoEm) });
      // Sincroniza em segundo plano — envia a data de finalização pra ela sempre ficar salva no banco
      void gravarRelatorio({ id, status: "finalizado", finalizadoEm });
    } catch (error) {
      console.error("Erro ao finalizar relatório:", error);
    }
  };

  const reutilizarRelatorio = async (id: string) => {
    const relatorioParaReutilizar = state.relatorios.find((r) => r.id === id);
    if (relatorioParaReutilizar) {
      if (relatorioParaReutilizar.reembolso === "concluido") {
        updateRelatorio(id, { status: "ativo", reembolso: "pendente", reembolsadoEm: null });
        return;
      }
      void utils.relatorios.list.cancel();
      // ATUALIZAÇÃO OTIMISTA: volta para "ativo" na hora
      setState((prev) => ({
        ...prev,
        relatorios: prev.relatorios.map((r) => (r.id === id ? { ...r, status: "ativo" } : r)),
      }));
      patchRelCache(id, { status: "ativo" });
      void gravarRelatorio({ id, status: "ativo" });
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
        filaSalvamentoRelatorios.solicitarReconciliacao();
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
      filaSalvamentoRelatorios.solicitarReconciliacao();
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
        return total + resultadosTotal + cooperacaoValid + valorRecebidoDoReembolso(r);
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
        registrarReembolso: async (id, valorReembolso, concluir) => {
          const salvo = await gravarRelatorio({ id, valorReembolso, concluirReembolso: concluir });
          if (!salvo) return false;
          await Promise.all([relatoriosQuery.refetch(), ...(concluir ? [casasQuery.refetch()] : [])]);
          return true;
        },
        salvamentoRelatorios,
        deleteRelatorio,
        finalizarRelatorio,
        finalizarRelatorioComJogos: async (id, jogos, compartilharJogos) => {
          const salvo = await gravarRelatorio({ id, status: "finalizado", jogos, compartilharJogos });
          if (!salvo) return false;
          await relatoriosQuery.refetch();
          if (compartilharJogos) void utils.notasRede.invalidate();
          const rel = state.relatorios.find(r => r.id === id);
          if (rel) {
            const lucro = rel.rows.reduce((s, row) => s + (Number(row.resultado) || 0), 0) + (Number(rel.cooperacao) || 0);
            if (lucro > 0) celebrar({ valor: lucro });
          }
          return true;
        },
        reutilizarRelatorio,
        duplicarRelatorio,
        ordemRelatorios: ordemRelatoriosQuery.data,
        salvandoOrdemRelatorios: reordenarRelatoriosMutation.isPending,
        reordenarRelatorios: ids => reordenarRelatoriosMutation.mutateAsync({ ids }),
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
