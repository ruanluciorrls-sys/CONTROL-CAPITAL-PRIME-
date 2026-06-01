interface ReportTableProps {
  data: Record<string, any>[];
  title?: string;
}

export default function ReportTable({ data, title }: ReportTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  const columns = Object.keys(data[0] || {}).filter(
    (col) => col !== "Unnamed: 0" && col !== "Unnamed: 1"
  );

  return (
    <div className="metric-card">
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}
      <div className="overflow-x-auto">
        <table className="dashboard-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={`${idx}-${col}`}>
                    {typeof row[col] === "number"
                      ? row[col].toFixed(2)
                      : row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
