import React from "react";
import { cn } from "@/lib/utils";

interface MobileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * MobileInput - Input otimizado para mobile
 * Altura mínima de toque: 44px
 * Fonte grande para melhor legibilidade
 * Suporta label e mensagens de erro
 */
export default function MobileInput({
  label,
  error,
  icon,
  fullWidth = true,
  className,
  ...props
}: MobileInputProps) {
  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex-shrink-0">
            {icon}
          </span>
        )}

        <input
          className={cn(
            "w-full px-4 py-3 text-base rounded-lg border border-border",
            "bg-white dark:bg-slate-800 text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-[44px]",
            icon && "pl-10",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
