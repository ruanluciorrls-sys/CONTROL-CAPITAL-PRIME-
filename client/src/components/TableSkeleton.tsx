export default function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3 p-4 bg-secondary/50 rounded-lg animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-secondary rounded flex-1"
              style={{
                width: colIndex === 0 ? "20%" : colIndex === columns - 1 ? "15%" : "auto",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
