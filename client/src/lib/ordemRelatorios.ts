export function aplicarOrdemRelatorios<T extends { id: string }>(relatorios: T[], ordem: readonly string[]): T[] {
  const posicoes = new Map(ordem.map((id, index) => [id, index]));
  return [...relatorios].sort((a, b) =>
    (posicoes.get(a.id) ?? ordem.length) - (posicoes.get(b.id) ?? ordem.length)
  );
}

export function moverRelatorio(ids: string[], index: number, direcao: -1 | 1): string[] | null {
  const destino = index + direcao;
  if (index < 0 || index >= ids.length || destino < 0 || destino >= ids.length) return null;
  const novaOrdem = [...ids];
  [novaOrdem[index], novaOrdem[destino]] = [novaOrdem[destino], novaOrdem[index]];
  return novaOrdem;
}
