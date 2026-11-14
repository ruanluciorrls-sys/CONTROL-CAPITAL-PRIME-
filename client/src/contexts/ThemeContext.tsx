import React, { createContext, useContext, useEffect, useState } from "react";
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
  const [legacyTheme, setLegacyTheme] = useState<Theme>(() => {
    try { return localStorage.getItem("theme") === "light" ? "light" : defaultTheme; } catch { return defaultTheme; }
  });
  const hasSharedTheme = typeof settings.data?.tema === "string";
  const legacyBackend = !!auth.data && typeof auth.data.isPrimaryAdmin !== "boolean";
  const theme = settings.data?.tema ?? (shared && legacyBackend ? legacyTheme : defaultTheme);
  const switchable = shared && (legacyBackend || (hasSharedTheme && auth.data?.isPrimaryAdmin === true));

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
        const nextTheme = theme === "light" ? "dark" : "light";
        if (legacyBackend) {
          setLegacyTheme(nextTheme);
          try { localStorage.setItem("theme", nextTheme); } catch {}
        } else if (!update.isPending) {
          update.mutate({ tema: nextTheme });
        }
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
