import React, { useState, useRef, useEffect } from "react";

interface EditableCellProps {
  value: number;
  onChange: (value: number) => void;
  onSave?: () => void;
  className?: string;
  format?: "currency" | "number";
  fieldId?: string;
  onTabNext?: () => void;
  onTabPrev?: () => void;
  onEdit?: (fieldId: string, oldValue: number, newValue: number, expression: string) => void;
  rowNumber?: number;
}

function evaluateExpression(expr: string): number {
  try {
    expr = expr.trim();
    
    if (!/^[\d+\-*/().\s]+$/.test(expr)) {
      return NaN;
    }
    
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${expr}`)();
    
    if (typeof result === "number" && !isNaN(result)) {
      return result;
    }
    return NaN;
  } catch {
    return NaN;
  }
}

// Armazenar expressões por fieldId (para mostrar ao editar)
const fieldExpressions = new Map<string, string>();

export default function EditableCell({
  value,
  onChange,
  onSave,
  className = "",
  format = "currency",
  fieldId = "default",
  onTabNext,
  onTabPrev,
  onEdit,
  rowNumber,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value === undefined || value === null ? "0" : value.toString());
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    setIsEditing(true);
    // Mostrar a expressao salva, ou o valor se nao houver expressao
    const savedExpression = fieldExpressions.get(fieldId);
    if (savedExpression) {
      setInputValue(savedExpression);
    } else {
      setInputValue(value === undefined || value === null ? "0" : value.toString());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const validateValue = (numValue: number): boolean => {
    if (numValue < 0) {
      setWarningMessage("⚠️ Valor negativo detectado!");
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return false;
    }
    return true;
  };

  const handleBlur = () => {
    let numValue = evaluateExpression(inputValue);
    
    if (isNaN(numValue)) {
      numValue = parseFloat(inputValue);
    }
    
    if (!isNaN(numValue)) {
      if (validateValue(numValue)) {
        // Salvar a expressão para mostrar ao editar novamente
        fieldExpressions.set(fieldId, inputValue);
        
        // Chamar callback de histórico global
        if (onEdit) {
          onEdit(fieldId, value, numValue, inputValue);
        }
        
        onChange(numValue);
      }
    }
    setIsEditing(false);
    onSave?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleBlur();
      setTimeout(() => {
        if (e.shiftKey) {
          onTabPrev?.();
        } else {
          onTabNext?.();
        }
      }, 50);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const formatValue = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) {
      return "R$ 0.00";
    }
    if (format === "currency") {
      return `R$ ${Math.abs(val).toFixed(2)}`;
    }
    return val.toFixed(2);
  };

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Digite um número ou expressão (ex: 72 + 72)"
          className={`w-full px-2 py-1 border border-blue-500 rounded text-right bg-white dark:bg-slate-700 dark:border-blue-400 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
        />
        {showWarning && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-sm whitespace-nowrap">
            {warningMessage}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors select-none text-right font-semibold relative group ${className}`}
      title="Clique para editar"
    >
      {formatValue(value)}
    </div>
  );
}
