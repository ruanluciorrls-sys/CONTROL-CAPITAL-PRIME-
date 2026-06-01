import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  id?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (id: string) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 mb-6 text-sm" aria-label="Breadcrumb">
      <button
        onClick={() => onNavigate?.("dashboard")}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Ir para Dashboard"
      >
        <Home size={16} />
        <span>Dashboard</span>
      </button>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight size={16} className="text-muted-foreground" />
          {item.id && onNavigate ? (
            <button
              onClick={() => onNavigate(item.id!)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Ir para ${item.label}`}
            >
              {item.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
