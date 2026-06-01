import React from "react";
import { cn } from "@/lib/utils";

interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * MobileButton - Botão otimizado para mobile
 * Tamanho mínimo de toque: 44x44px
 * Suporta ícone e texto
 */
export default function MobileButton({
  variant = "primary",
  size = "md",
  icon,
  children,
  fullWidth = false,
  className,
  ...props
}: MobileButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary:
      "bg-primary text-white hover:bg-primary/90 active:scale-95 focus:ring-primary",
    secondary:
      "bg-secondary text-foreground hover:bg-secondary/80 active:scale-95 dark:bg-slate-700 dark:hover:bg-slate-600",
    danger:
      "bg-red-500 text-white hover:bg-red-600 active:scale-95 focus:ring-red-500",
    ghost:
      "bg-transparent text-foreground hover:bg-secondary dark:hover:bg-slate-700 active:scale-95",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-h-[40px]",
    md: "px-4 py-3 text-base min-h-[44px]",
    lg: "px-6 py-4 text-lg min-h-[48px]",
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}
