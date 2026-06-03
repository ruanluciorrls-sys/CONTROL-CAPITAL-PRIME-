export interface CasaData {
  id: string;
  nome: string;
  login: string;
  senha: string;
  meta: number;
  media: number;
  prazo: string;
  linkCasa: string;
  linkContaFilha: string;
  status: "ativa" | "finalizada" | "lixeira";
  criadoEm: string;
  dataFim?: string;
}

export interface RelatorioRow {
  numero: number;
  deposito: number;
  redeposito: number;
  saque: number;
  bau: number;
  resultado: number;
  depositoExpr?: string;
  redepositoExpr?: string;
  saqueExpr?: string;
  bauExpr?: string;
}

export interface RelatorioData {
  id: string;
  casaId: string;
  agente: string;
  prazo: string;
  cooperacao: number;
  rows: RelatorioRow[];
  status: "ativo" | "finalizado" | "lixeira";
  criadoEm: string;
  atualizadoEm?: string;
  finalizadoEm?: string;
}

export interface AppState {
  casas: CasaData[];
  relatorios: RelatorioData[];
  totalLucros: number;
  nomeApp: string;
  corPrimaria: string;
  fundoUrl?: string;
  logoUrl?: string;
}
