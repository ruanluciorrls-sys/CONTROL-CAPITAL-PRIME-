import type { RelatorioData } from "@/lib/types";

export const moedaRelatorio = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function normalizarBuscaRelatorio(texto: string) {
  return texto.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function prazoDeRelatorio(prazo?: string, agora = new Date()) {
  if (!prazo || !/^\d{4}-\d{2}-\d{2}$/.test(prazo)) return "sem-prazo";
  const data = new Date(prazo + "T12:00:00");
  if (!Number.isFinite(data.getTime()) || data.getDate() !== Number(prazo.slice(8))) return "sem-prazo";
  const diaUtc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const dias = (diaUtc(data) - diaUtc(agora)) / 86400000;
  return dias < 0 ? "atrasado" : dias === 0 ? "hoje" : dias === 1 ? "amanha" : "futuro";
}

export function progressoRecarga(rows: RelatorioData["rows"], meta: number) {
  const realizado = rows.reduce((soma, linha) => soma + (Number(linha.deposito) || 0) + (Number(linha.redeposito) || 0), 0);
  const falta = Math.max(0, Math.round((meta - realizado) * 100) / 100);
  const percentual = meta > 0 ? Math.min(100, Math.max(0, (realizado / meta) * 100)) : 0;
  return { realizado, falta, percentual };
}
