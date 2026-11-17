export const META_RECARGA_MAXIMA = 99_999_999.99;
export const META_RECARGA_DECIMAL = /^\d{1,8}(?:\.\d{1,2})?$/;

export function metaRecargaValida(valor: number): boolean {
  return valor > 0 && META_RECARGA_DECIMAL.test(String(valor));
}

export function montanteDaOperacao(meta: number, media: number, metaRecarga?: number | null): number {
  return metaRecarga ?? meta * media;
}
