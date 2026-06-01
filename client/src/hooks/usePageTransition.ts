import { useState, useEffect } from 'react';

export function usePageTransition(dependency: string) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade out
    setIsVisible(false);
    
    // Pequeno delay para permitir fade out antes de mudar conteúdo
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [dependency]);

  return isVisible;
}
