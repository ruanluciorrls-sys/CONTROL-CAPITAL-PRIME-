export function valorRecebidoDoReembolso(rel: { reembolso?: string | null; valorReembolso?: number | string | null }): number {
  return rel.reembolso === "concluido" ? Number(rel.valorReembolso) || 0 : 0;
}

export function lerValorReembolso(texto: string): number | null {
  const valor = texto.trim().replace(",", ".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(valor)) return null;
  return Number(valor);
}
