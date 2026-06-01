import React from "react";

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * ResponsiveGrid - Grid responsivo otimizado para mobile
 * Padrão: 1 coluna em mobile, 2 em tablet, 3 em desktop
 */
export default function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md",
  className = "",
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: "gap-3",
    md: "gap-4 md:gap-6",
    lg: "gap-6 md:gap-8",
  };

  const colClasses = `grid grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop} ${gapClasses[gap]}`;

  return (
    <div
      className={`grid grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop} ${gapClasses[gap]} ${className}`}
    >
      {children}
    </div>
  );
}
