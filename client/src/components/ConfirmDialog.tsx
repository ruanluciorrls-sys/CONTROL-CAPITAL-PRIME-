import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function ConfirmDialog({
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false,
  onConfirm,
  onCancel,
  isOpen,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl p-6 max-w-sm w-full mx-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 border border-border/50">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${isDestructive ? "bg-red-100 dark:bg-red-900" : "bg-blue-100 dark:bg-blue-900"}`}>
            <AlertCircle size={24} className={isDestructive ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{description}</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onCancel}
                className="dark:border-slate-600 dark:hover:bg-slate-800"
              >
                {cancelText}
              </Button>
              <Button
                onClick={onConfirm}
                className={isDestructive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary hover:bg-primary/90"}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
