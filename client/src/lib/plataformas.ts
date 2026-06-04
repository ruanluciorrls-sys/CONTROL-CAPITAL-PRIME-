// Plataformas do calendário — fonte de dados GLOBAL (compartilhada por todos os usuários)
// Os dados reais vêm do banco via trpc.plataformas.list.
// Esta lista é apenas o "seed" inicial usado na primeira vez que o banco está vazio.

export interface Plataforma {
  id: string;
  nome: string;
  diasPrazo: number;
  dia: string;
}

export const PLATAFORMAS_PADRAO: Plataforma[] = [
  { id: "1",  nome: "WE",       diasPrazo: 4, dia: "SEGUNDA-FEIRA" },
  { id: "2",  nome: "777CLUBE", diasPrazo: 3, dia: "SEGUNDA-FEIRA" },
  { id: "3",  nome: "EK",       diasPrazo: 4, dia: "TERÇA-FEIRA" },
  { id: "4",  nome: "VOY",      diasPrazo: 4, dia: "TERÇA-FEIRA" },
  { id: "5",  nome: "888",      diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "6",  nome: "MANGA",    diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "7",  nome: "ANJO",     diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "8",  nome: "GAME",     diasPrazo: 6, dia: "TERÇA-FEIRA" },
  { id: "9",  nome: "91",       diasPrazo: 3, dia: "QUARTA-FEIRA" },
  { id: "10", nome: "OKOK",     diasPrazo: 3, dia: "QUARTA-FEIRA" },
  { id: "11", nome: "A8",       diasPrazo: 7, dia: "QUARTA-FEIRA" },
  { id: "12", nome: "DY",       diasPrazo: 4, dia: "QUARTA-FEIRA" },
  { id: "13", nome: "MK",       diasPrazo: 4, dia: "QUARTA-FEIRA" },
  { id: "14", nome: "WP",       diasPrazo: 7, dia: "QUARTA-FEIRA" },
  { id: "15", nome: "W1",       diasPrazo: 3, dia: "QUINTA-FEIRA" },
  { id: "16", nome: "DZ",       diasPrazo: 0, dia: "QUINTA-FEIRA" },
  { id: "17", nome: "777CLUBE", diasPrazo: 4, dia: "QUINTA-FEIRA" },
  { id: "18", nome: "WE",       diasPrazo: 3, dia: "SEXTA-FEIRA" },
  { id: "19", nome: "MANGA",    diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "20", nome: "ANJO",     diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "21", nome: "888",      diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "22", nome: "VOY",      diasPrazo: 3, dia: "SÁBADO" },
  { id: "23", nome: "91",       diasPrazo: 4, dia: "SÁBADO" },
  { id: "24", nome: "EK",       diasPrazo: 3, dia: "SÁBADO" },
  { id: "25", nome: "W1",       diasPrazo: 4, dia: "DOMINGO" },
  { id: "26", nome: "DY",       diasPrazo: 3, dia: "DOMINGO" },
  { id: "27", nome: "MK",       diasPrazo: 3, dia: "DOMINGO" },
];
