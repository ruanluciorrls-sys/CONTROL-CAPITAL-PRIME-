import { Search, X, Filter } from "lucide-react";
import { useState } from "react";

interface SearchFilterProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  filterOptions?: Array<{
    key: string;
    label: string;
    type: "text" | "select" | "date" | "number";
    options?: Array<{ value: string; label: string }>;
  }>;
}

export default function SearchFilter({
  placeholder = "Buscar...",
  onSearch,
  onFilterChange,
  filterOptions = [],
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({});
    onSearch("");
    onFilterChange?.({});
  };

  const hasActiveFilters = searchQuery || Object.values(filters).some((v) => v);

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          aria-label="Buscar"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Limpar busca"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      {filterOptions.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-foreground"
            aria-label="Alternar filtros"
          >
            <Filter size={18} />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded-full">
                {Object.values(filters).filter((v) => v).length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Limpar filtros"
            >
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Filter Options */}
      {showFilters && filterOptions.length > 0 && (
        <div className="bg-secondary/50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3 animate-in fade-in">
          {filterOptions.map((option) => (
            <div key={option.key} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">{option.label}</label>
              {option.type === "text" && (
                <input
                  type="text"
                  value={filters[option.key] || ""}
                  onChange={(e) => handleFilterChange(option.key, e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                  placeholder={`Filtrar por ${option.label.toLowerCase()}`}
                />
              )}
              {option.type === "select" && (
                <select
                  value={filters[option.key] || ""}
                  onChange={(e) => handleFilterChange(option.key, e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                >
                  <option value="">Todos</option>
                  {option.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {option.type === "date" && (
                <input
                  type="date"
                  value={filters[option.key] || ""}
                  onChange={(e) => handleFilterChange(option.key, e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                />
              )}
              {option.type === "number" && (
                <input
                  type="number"
                  value={filters[option.key] || ""}
                  onChange={(e) => handleFilterChange(option.key, e.target.value ? parseFloat(e.target.value) : "")}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                  placeholder={`Filtrar por ${option.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
