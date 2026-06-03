// Utilitário de navegação global entre abas
// Permite que qualquer componente navegue para uma aba sem prop drilling

let _navigateFn: ((tab: string) => void) | null = null;

export const setNavigateFn = (fn: (tab: string) => void): void => {
  _navigateFn = fn;
};

export const navigateToTab = (tab: string): void => {
  if (_navigateFn) {
    _navigateFn(tab);
  }
};
