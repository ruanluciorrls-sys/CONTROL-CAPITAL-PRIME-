interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
}

export default function StatusBadge({ status, variant = "default", size = "md" }: StatusBadgeProps) {
  const variantClasses = {
    default: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
    success: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    warning: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    danger: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    info: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const statusVariantMap: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    ativa: "success",
    ativo: "success",
    finalizada: "info",
    finalizado: "info",
    lixeira: "danger",
    bloqueado: "danger",
    sacado: "success",
    sacando: "warning",
  };

  const displayVariant = statusVariantMap[status.toLowerCase()] || variant;

  return (
    <span className={`inline-block rounded-full font-medium ${variantClasses[displayVariant]} ${sizeClasses[size]}`}>
      {status}
    </span>
  );
}
