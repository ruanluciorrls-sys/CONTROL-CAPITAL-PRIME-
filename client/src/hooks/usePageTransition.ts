import { useState, useEffect } from 'react';

export function usePageTransition<T>(activeValue: T, delayMs: number = 150) {
  const [renderedValue, setRenderedValue] = useState<T>(activeValue);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (activeValue === renderedValue) return;

    // Inicia o fade out
    setIsVisible(false);
    
    // Pequeno delay para permitir fade out antes de mudar o conteúdo renderizado
    const timer = setTimeout(() => {
      setRenderedValue(activeValue);
      setIsVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [activeValue, renderedValue, delayMs]);

  return { isVisible, renderedValue };
}

