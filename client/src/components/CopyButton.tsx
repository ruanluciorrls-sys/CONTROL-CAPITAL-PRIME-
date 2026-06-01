import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function CopyButton({
  text,
  label = "Copiar",
  className = "",
  size = "sm",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Resetar estado após 2 segundos
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
    }
  };

  const sizeClasses = {
    sm: "h-8 px-2 text-xs",
    md: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base",
  };

  return (
    <Button
      onClick={handleCopy}
      variant={copied ? "default" : "outline"}
      className={`${sizeClasses[size]} gap-2 transition-all ${className}`}
      title={`Copiar: ${text}`}
    >
      {copied ? (
        <>
          <Check size={16} className="text-green-600" />
          <span className="text-green-600">Copiado!</span>
        </>
      ) : (
        <>
          <Copy size={16} />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
