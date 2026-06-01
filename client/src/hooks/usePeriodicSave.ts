import { useEffect, useRef, useCallback } from "react";

interface UsePeriodicSaveOptions {
  onSave: () => Promise<void>;
  interval?: number; // em milissegundos, padrão 30000 (30 segundos)
  onSaving?: (isSaving: boolean) => void;
}

/**
 * Hook para salvamento automático periódico
 * Salva a cada intervalo especificado, independentemente de mudanças
 * Útil para garantir que dados não sejam perdidos
 */
export function usePeriodicSave({
  onSave,
  interval = 30000, // 30 segundos por padrão
  onSaving,
}: UsePeriodicSaveOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const startPeriodicSave = useCallback(() => {
    // Cancelar intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Iniciar novo intervalo periódico
    intervalRef.current = setInterval(async () => {
      try {
        isSavingRef.current = true;
        onSaving?.(true);
        
        await onSave();
        
        isSavingRef.current = false;
        onSaving?.(false);
      } catch (error) {
        console.error("Erro ao salvar periodicamente:", error);
        isSavingRef.current = false;
        onSaving?.(false);
      }
    }, interval);
  }, [onSave, interval, onSaving]);

  // Iniciar salvamento periódico ao montar
  useEffect(() => {
    startPeriodicSave();

    // Limpar intervalo ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startPeriodicSave]);

  return { isSaving: isSavingRef.current };
}
