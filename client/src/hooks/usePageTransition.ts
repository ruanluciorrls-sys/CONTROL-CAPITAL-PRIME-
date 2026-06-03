import { useState, useEffect } from 'react';

export function usePageTransition(dependency: string) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out
    setIsVisible(false);
    
    // Pequeno delay para permitir fade out antes de mudar conteúdo
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 20);

    return () => clearTimeout(timer);
  }, [dependency]);

  return isVisible;
}
