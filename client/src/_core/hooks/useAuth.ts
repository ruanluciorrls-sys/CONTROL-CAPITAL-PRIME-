import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    // Tenta de novo em falhas temporárias (deploy/cold start/rede) — evita
    // deslogar "do nada". Mantém a sessão válida em vários aparelhos.
    retry: 4,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      window.location.href = "/login";
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (logoutMutation.isPending) return;
    // Só redireciona quando o servidor CONFIRMOU que não há sessão (resposta ok com user nulo).
    // Falha de rede/servidor (deploy, cold start) NÃO desloga — react-query tenta de novo.
    if (!meQuery.isSuccess) return;
    if (meQuery.data) return;
    if (typeof window === "undefined") return;
    // Já está na página de login, não redirecionar
    if (window.location.pathname === "/login") return;
    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isSuccess,
    meQuery.data,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
