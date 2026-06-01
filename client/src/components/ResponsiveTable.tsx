import React from "react";

interface ResponsiveTableProps {
  headers: string[];
  rows: React.ReactNode[][];
  className?: string;
  mobileCardView?: boolean;
}

/**
 * ResponsiveTable - Tabela responsiva que vira cards em mobile
 * Em mobile (< 768px): Exibe como cards empilhados
 * Em desktop: Exibe como tabela tradicional
 */
export default function ResponsiveTable({
  headers,
  rows,
  className = "",
  mobileCardView = true,
}: ResponsiveTableProps) {
  if (!mobileCardView) {
    // Modo tabela tradicional
    return (
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${className}`}>
          <thead>
            <tr className="border-b border-border bg-secondary dark:bg-slate-700">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left font-semibold text-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-border hover:bg-secondary/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-3 text-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Modo responsivo: Cards em mobile, tabela em desktop
  return (
    <>
      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-border shadow-sm"
          >
            {headers.map((header, cellIdx) => (
              <div
                key={cellIdx}
                className="flex justify-between items-start py-2 border-b border-border/50 last:border-b-0"
              >
                <span className="font-semibold text-foreground text-sm">
                  {header}
                </span>
                <span className="text-muted-foreground text-right">
                  {row[cellIdx]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`w-full text-sm ${className}`}>
          <thead>
            <tr className="border-b border-border bg-secondary dark:bg-slate-700">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left font-semibold text-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-border hover:bg-secondary/50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-4 py-3 text-foreground"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
