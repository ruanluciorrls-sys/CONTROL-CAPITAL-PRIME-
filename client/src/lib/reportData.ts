// Função para calcular lucros totais consolidados
export const calculateTotalProfits = (data: Record<string, Record<string, any>[]>): number => {
  let total = 0;
  Object.values(data).forEach((report) => {
    report.forEach((row) => {
      const resultado = row["Resultado"] || 0;
      if (typeof resultado === "number") {
        total += resultado;
      }
    });
  });
  return total;
};

// Dados dos relatórios CPA 2026
export const reportData: Record<string, Record<string, any>[]> = {
  "Relatório 1": [
    { "#": 1, "Depósito": 79, "Saque": 63, "Baú": 100, "Cooperação": 850, "Resultado": 934 },
    { "#": 2, "Depósito": 98, "Saque": 81, "Baú": 100, "Cooperação": 0, "Resultado": 83 },
    { "#": 3, "Depósito": 104, "Saque": 188, "Baú": 50, "Cooperação": 0, "Resultado": 134 },
    { "#": 4, "Depósito": 87, "Saque": 48, "Baú": 100, "Cooperação": 0, "Resultado": 61 },
    { "#": 5, "Depósito": 113, "Saque": 166, "Baú": 26, "Cooperação": 0, "Resultado": 79 },
    { "#": 6, "Depósito": 102, "Saque": 125, "Baú": 34, "Cooperação": 0, "Resultado": 57 },
    { "#": 7, "Depósito": 88, "Saque": 75, "Baú": 100, "Cooperação": 0, "Resultado": 113 },
    { "#": 8, "Depósito": 93, "Saque": 96, "Baú": 100, "Cooperação": 0, "Resultado": 97 },
  ],
  "Relatório 2": [
    { "#": 1, "Depósito": 76, "Saque": 45, "Baú": 80, "Cooperação": 700, "Resultado": 811 },
    { "#": 2, "Depósito": 71, "Saque": 62, "Baú": 90, "Cooperação": 0, "Resultado": 99 },
    { "#": 3, "Depósito": 90, "Saque": 102, "Baú": 75, "Cooperação": 0, "Resultado": 63 },
    { "#": 4, "Depósito": 93, "Saque": 58, "Baú": 85, "Cooperação": 0, "Resultado": 120 },
    { "#": 5, "Depósito": 82, "Saque": 73, "Baú": 95, "Cooperação": 0, "Resultado": 104 },
  ],
  "Relatório 3": [
    { "#": 1, "Depósito": 202, "Saque": 150, "Baú": 120, "Cooperação": 1200, "Resultado": 1272 },
    { "#": 2, "Depósito": 127, "Saque": 98, "Baú": 110, "Cooperação": 0, "Resultado": 139 },
    { "#": 3, "Depósito": 150, "Saque": 125, "Baú": 130, "Cooperação": 0, "Resultado": 155 },
    { "#": 4, "Depósito": 170, "Saque": 145, "Baú": 140, "Cooperação": 0, "Resultado": 165 },
  ],
  "Relatório 4": [
    { "#": 1, "Depósito": 28, "Saque": 15, "Baú": 20, "Cooperação": 200, "Resultado": 213 },
    { "#": 2, "Depósito": 13, "Saque": 8, "Baú": 10, "Cooperação": 0, "Resultado": 15 },
    { "#": 3, "Depósito": 15, "Saque": 10, "Baú": 12, "Cooperação": 0, "Resultado": 17 },
    { "#": 4, "Depósito": 26, "Saque": 18, "Baú": 22, "Cooperação": 0, "Resultado": 30 },
  ],
  "Relatório 5": [
    { "#": 1, "Depósito": 82, "Saque": 65, "Baú": 75, "Cooperação": 800, "Resultado": 892 },
    { "#": 2, "Depósito": 96, "Saque": 78, "Baú": 85, "Cooperação": 0, "Resultado": 103 },
    { "#": 3, "Depósito": 99, "Saque": 82, "Baú": 90, "Cooperação": 0, "Resultado": 107 },
    { "#": 4, "Depósito": 70, "Saque": 55, "Baú": 65, "Cooperação": 0, "Resultado": 80 },
  ],
};
