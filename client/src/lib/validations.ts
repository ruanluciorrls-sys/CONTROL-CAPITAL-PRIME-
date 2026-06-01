import React from "react";

/**
 * Validações robustas para o sistema CPA Report 2026
 */

export const validations = {
  /**
   * Valida se um valor é um número monetário válido
   */
  isValidCurrency(value: any): boolean {
    if (value === null || value === undefined || value === "") return false;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  },

  /**
   * Formata valor monetário com validação
   */
  formatCurrency(value: any): string {
    if (!this.isValidCurrency(value)) return "R$ 0.00";
    const num = parseFloat(value);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  },

  /**
   * Valida se uma data é válida e não está no futuro
   */
  isValidDate(dateString: string): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    // Permitir datas futuras para prazos
    return true;
  },

  /**
   * Valida se uma data está vencida
   */
  isDateExpired(dateString: string): boolean {
    if (!this.isValidDate(dateString)) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  },

  /**
   * Formata data para exibição (dd/mm/yyyy)
   */
  formatDate(dateString: string): string {
    if (!this.isValidDate(dateString)) return "Data inválida";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Valida campo de texto obrigatório
   */
  isValidText(value: any, minLength = 1, maxLength = 255): boolean {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    return trimmed.length >= minLength && trimmed.length <= maxLength;
  },

  /**
   * Valida email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida senha (mínimo 6 caracteres)
   */
  isValidPassword(password: string): boolean {
    return typeof password === "string" && password.length >= 6;
  },

  /**
   * Valida se um número está dentro de um intervalo
   */
  isInRange(value: any, min: number, max: number): boolean {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  },

  /**
   * Valida URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Retorna mensagem de erro amigável
   */
  getErrorMessage(field: string, type: string): string {
    const messages: Record<string, Record<string, string>> = {
      currency: {
        invalid: `${field} deve ser um valor monetário válido`,
        negative: `${field} não pode ser negativo`,
      },
      date: {
        invalid: `${field} deve ser uma data válida`,
        expired: `${field} já expirou`,
      },
      text: {
        required: `${field} é obrigatório`,
        tooShort: `${field} é muito curto`,
        tooLong: `${field} é muito longo`,
      },
      email: {
        invalid: `${field} deve ser um email válido`,
      },
      password: {
        tooShort: `${field} deve ter pelo menos 6 caracteres`,
      },
      url: {
        invalid: `${field} deve ser uma URL válida`,
      },
    };

    return messages[field]?.[type] || `${field} é inválido`;
  },
};

/**
 * Hook para validação de formulários
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => void
) {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Limpar erro ao editar
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof T, string>> = {};

    // Validar campos
    Object.entries(values).forEach(([key, value]) => {
      if (!value) {
        newErrors[key as keyof T] = `${key} é obrigatório`;
      }
    });

    if (Object.keys(newErrors).length === 0) {
      onSubmit(values);
    } else {
      setErrors(newErrors);
    }
  };

  return { values, errors, handleChange, handleSubmit, setValues };
}
