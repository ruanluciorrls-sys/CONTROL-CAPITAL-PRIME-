interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export default function MetricCard({
  label,
  value,
  icon,
  trend = "neutral",
}: MetricCardProps) {
  const displayValue = typeof value === 'number' && isNaN(value) ? '0' : String(value);
  
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">{label}</p>
          <p className="metric-value mt-2">{displayValue}</p>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </div>
  );
}
