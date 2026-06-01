import { useEffect, useRef, useCallback } from "react";

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  delay?: number;
  onSaving?: (isSaving: boolean) => void;
}

/**
 * Hook para salvamento automático com debounce
 * Aguarda o delay especificado antes de chamar onSave
 * Se houver mudanças durante o delay, o timer é resetado
 */
export function useAutoSave({
  onSave,
  delay = 1000,
  onSaving,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const triggerSave = useCallback(async () => {
    // Cancelar timer anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Definir novo timer com debounce
    timeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        onSaving?.(true);
        
        await onSave();
        
        isSavingRef.current = false;
        onSaving?.(false);
      } catch (error) {
        console.error("Erro ao salvar automaticamente:", error);
        isSavingRef.current = false;
        onSaving?.(false);
      }
    }, delay);
  }, [onSave, delay, onSaving]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { triggerSave, isSaving: isSavingRef.current };
}
