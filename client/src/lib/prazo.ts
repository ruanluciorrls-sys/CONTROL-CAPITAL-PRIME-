// Cálculo de prazo e utilitários do calendário de plataformas (compartilhado entre telas)

export const DIAS_SEMANA_MAP: Record<string, number> = {
  "DOMINGO": 0, "SEGUNDA-FEIRA": 1, "TERÇA-FEIRA": 2,
  "QUARTA-FEIRA": 3, "QUINTA-FEIRA": 4, "SEXTA-FEIRA": 5, "SÁBADO": 6,
};

export const COR_DIA: Record<string, string> = {
  "SEGUNDA-FEIRA": "#60a5fa",
  "TERÇA-FEIRA": "#34d399",
  "QUARTA-FEIRA": "#a78bfa",
  "QUINTA-FEIRA": "#f59e0b",
  "SEXTA-FEIRA": "#f87171",
  "SÁBADO": "#fb923c",
  "DOMINGO": "#e879f9",
};

export const DIAS_ORDER = [
  "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA",
  "SEXTA-FEIRA", "SÁBADO", "DOMINGO",
];

/**
 * Prazo conta a partir do DIA DE LANÇAMENTO real da plataforma (dia da semana dela),
 * usando a ocorrência mais próxima de hoje (a que acabou de passar OU a que está chegando).
 * Ex: hoje é DOMINGO, VOY lança no SÁBADO -> conta a partir do sábado (ontem) + diasPrazo.
 */
export function calcularPrazo(diaSemana: string, diasPrazo: number): string {
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const alvo = DIAS_SEMANA_MAP[diaSemana];

  const d = new Date(hoje);
  if (alvo !== undefined) {
    const atual = hoje.getDay();
    const paraFrente = (alvo - atual + 7) % 7;
    const paraTras = (atual - alvo + 7) % 7;
    const offset = paraFrente <= paraTras ? paraFrente : -paraTras;
    d.setDate(d.getDate() + offset);
  }
  d.setDate(d.getDate() + diasPrazo);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Contagem regressiva legível até o prazo. */
export function calcCountdown(prazoStr: string): string {
  if (!prazoStr) return "";
  const prazo = new Date(prazoStr + "T23:59:59");
  const agora = new Date();
  const diff = prazo.getTime() - agora.getTime();
  if (diff <= 0) return "Prazo encerrado!";
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const min = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (dias > 0) return `${dias}d ${horas}h ${min}m restantes`;
  return `${horas}h ${min}m restantes`;
}
