import React, { createContext, useContext, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  shared?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  shared = false,
}: ThemeProviderProps) {
  const utils = trpc.useUtils();
  const auth = trpc.auth.me.useQuery(undefined, { enabled: shared, staleTime: 5 * 60 * 1000 });
  const settings = trpc.settings.get.useQuery(undefined, { enabled: shared && !!auth.data });
  const update = trpc.settings.update.useMutation({
    onSuccess: () => utils.settings.get.invalidate(),
    onError: () => toast.error("Não foi possível salvar o tema compartilhado."),
  });
  const theme = settings.data?.tema ?? defaultTheme;
  const switchable = shared && auth.data?.isPrimaryAdmin === true;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

  }, [theme]);

  const toggleTheme = switchable
    ? () => {
        if (!update.isPending) update.mutate({ tema: theme === "light" ? "dark" : "light" });
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
