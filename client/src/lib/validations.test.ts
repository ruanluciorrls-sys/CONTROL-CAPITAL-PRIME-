import { describe, it, expect } from "vitest";
import { validations } from "./validations";

describe("validations", () => {
  describe("isValidCurrency", () => {
    it("deve validar valores monetários válidos", () => {
      expect(validations.isValidCurrency(100)).toBe(true);
      expect(validations.isValidCurrency("100.50")).toBe(true);
      expect(validations.isValidCurrency(0)).toBe(true);
    });

    it("deve rejeitar valores inválidos", () => {
      expect(validations.isValidCurrency(null)).toBe(false);
      expect(validations.isValidCurrency(undefined)).toBe(false);
      expect(validations.isValidCurrency("")).toBe(false);
      expect(validations.isValidCurrency("abc")).toBe(false);
      expect(validations.isValidCurrency(-100)).toBe(false);
    });
  });

  describe("formatCurrency", () => {
    it("deve formatar valores monetários corretamente", () => {
      expect(validations.formatCurrency(100)).toBe("R$ 100,00");
      expect(validations.formatCurrency(1000.50)).toBe("R$ 1.000,50");
      expect(validations.formatCurrency(0)).toBe("R$ 0,00");
    });

    it("deve retornar R$ 0.00 para valores inválidos", () => {
      expect(validations.formatCurrency(null)).toBe("R$ 0,00");
      expect(validations.formatCurrency(undefined)).toBe("R$ 0,00");
      expect(validations.formatCurrency("abc")).toBe("R$ 0,00");
    });
  });

  describe("isValidDate", () => {
    it("deve validar datas válidas", () => {
      expect(validations.isValidDate("2026-01-10")).toBe(true);
      expect(validations.isValidDate("2025-12-31")).toBe(true);
    });

    it("deve rejeitar datas inválidas", () => {
      expect(validations.isValidDate("")).toBe(false);
      expect(validations.isValidDate("invalid")).toBe(false);
    });
  });

  describe("isDateExpired", () => {
    it("deve identificar datas expiradas", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(validations.isDateExpired(yesterday.toISOString().split("T")[0])).toBe(true);
    });

    it("deve identificar datas futuras como não expiradas", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(validations.isDateExpired(tomorrow.toISOString().split("T")[0])).toBe(false);
    });
  });

  describe("formatDate", () => {
    it("deve formatar datas corretamente", () => {
      expect(validations.formatDate("2026-01-10")).toBe("10/01/2026");
      expect(validations.formatDate("2025-12-31")).toBe("31/12/2025");
    });

    it("deve retornar mensagem de erro para datas inválidas", () => {
      expect(validations.formatDate("invalid")).toBe("Data inválida");
    });
  });

  describe("isValidText", () => {
    it("deve validar textos válidos", () => {
      expect(validations.isValidText("hello")).toBe(true);
      expect(validations.isValidText("a")).toBe(true);
    });

    it("deve rejeitar textos inválidos", () => {
      expect(validations.isValidText("")).toBe(false);
      expect(validations.isValidText("   ")).toBe(false);
      expect(validations.isValidText(null)).toBe(false);
    });

    it("deve respeitar limites de comprimento", () => {
      expect(validations.isValidText("hello", 1, 10)).toBe(true);
      expect(validations.isValidText("hello", 10, 20)).toBe(false);
    });
  });

  describe("isValidEmail", () => {
    it("deve validar emails válidos", () => {
      expect(validations.isValidEmail("test@example.com")).toBe(true);
      expect(validations.isValidEmail("user.name+tag@example.co.uk")).toBe(true);
    });

    it("deve rejeitar emails inválidos", () => {
      expect(validations.isValidEmail("invalid")).toBe(false);
      expect(validations.isValidEmail("@example.com")).toBe(false);
      expect(validations.isValidEmail("test@")).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("deve validar senhas válidas", () => {
      expect(validations.isValidPassword("123456")).toBe(true);
      expect(validations.isValidPassword("longerpassword")).toBe(true);
    });

    it("deve rejeitar senhas muito curtas", () => {
      expect(validations.isValidPassword("12345")).toBe(false);
      expect(validations.isValidPassword("")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("deve validar URLs válidas", () => {
      expect(validations.isValidUrl("https://example.com")).toBe(true);
      expect(validations.isValidUrl("http://localhost:3000")).toBe(true);
    });

    it("deve rejeitar URLs inválidas", () => {
      expect(validations.isValidUrl("not a url")).toBe(false);
      expect(validations.isValidUrl("")).toBe(false);
    });
  });

  describe("isInRange", () => {
    it("deve validar números dentro do intervalo", () => {
      expect(validations.isInRange(50, 0, 100)).toBe(true);
      expect(validations.isInRange(0, 0, 100)).toBe(true);
      expect(validations.isInRange(100, 0, 100)).toBe(true);
    });

    it("deve rejeitar números fora do intervalo", () => {
      expect(validations.isInRange(150, 0, 100)).toBe(false);
      expect(validations.isInRange(-10, 0, 100)).toBe(false);
    });
  });
});
