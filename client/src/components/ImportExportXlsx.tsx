import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useApp } from "@/contexts/AppContext";
import { Download, Upload } from "lucide-react";
import { CasaData, RelatorioData } from "@/lib/types";

export default function ImportExportXlsx() {
  const { state, addCasa, addRelatorio } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exibe mensagens por 5 segundos
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Exportar Casas
      if (state.casas.length > 0) {
        const casasSheet = XLSX.utils.json_to_sheet(state.casas);
        XLSX.utils.book_append_sheet(wb, casasSheet, "Casas");
      }

      // Exportar Relatorios
      if (state.relatorios.length > 0) {
        // Expandir as rows dos relatorios para ficar mais plano, ou exportar em JSON mesmo (como texto)
        const relatoriosFormatados = state.relatorios.map((rel) => ({
          ...rel,
          rows: JSON.stringify(rel.rows),
        }));
        const relatoriosSheet = XLSX.utils.json_to_sheet(relatoriosFormatados);
        XLSX.utils.book_append_sheet(wb, relatoriosSheet, "Relatorios");
      }

      // Baixar arquivo
      XLSX.writeFile(wb, "backup_dados.xlsx");
      showMessage("success", "Dados exportados com sucesso!");
    } catch (error) {
      console.error(error);
      showMessage("error", "Erro ao exportar dados.");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        
        // Se for JSON
        if (file.name.endsWith('.json')) {
          const text = data as string;
          const parsed = JSON.parse(text);
          
          let countCasas = 0;
          let countRelatorios = 0;

          // Se for um array de casas
          const items = Array.isArray(parsed) ? parsed : (parsed.casas || []);
          for (const item of items) {
            const exists = state.casas.find((c) => c.id === item.id || c.nome === item.nome);
            if (!exists) {
              const { id, criadoEm, ...payload } = item;
              addCasa(payload);
              countCasas++;
            }
          }

          // Se tiver relatorios
          if (parsed.relatorios && Array.isArray(parsed.relatorios)) {
             for (const rel of parsed.relatorios) {
               const exists = state.relatorios.find((r) => r.id === rel.id);
               if (!exists) {
                 const { id, criadoEm, ...payload } = rel;
                 addRelatorio(payload);
                 countRelatorios++;
               }
             }
          }
          
          showMessage("success", `Importado via JSON: ${countCasas} casas e ${countRelatorios} relatórios!`);
          return;
        }

        // Se for Excel (XLSX)
        const workbook = XLSX.read(data, { type: "binary" });

        let importedCasas = 0;
        let importedRelatorios = 0;

        // Importar Casas (procura a aba 'Casas' ou usa a primeira aba)
        const casasSheetName = workbook.SheetNames.includes("Casas") ? "Casas" : workbook.SheetNames[0];
        if (casasSheetName) {
          const rawCasas = XLSX.utils.sheet_to_json<any>(workbook.Sheets[casasSheetName]);
          for (const raw of rawCasas) {
            // Normaliza as chaves da planilha para minúsculo E SEM ACENTOS para aceitar 'Usuário', 'Nome da Casa', etc.
            const row: any = {};
            for (const key in raw) {
              if (Object.prototype.hasOwnProperty.call(raw, key)) {
                // Ex: "Usuário" -> "usuario", "Data de Criação" -> "data de criacao"
                const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                row[normalizedKey] = raw[key];
              }
            }

            // O 'nome' é obrigatório no servidor, então ignoramos linhas vazias
            const nome = row["nome"] || row["casa"] || row["nome da casa"] || row["name"];
            if (!nome || String(nome).trim() === "") continue;

            // Extrai as outras propriedades lidando com variações de nomes de colunas
            const statusParse = String(row["status"] || "").toLowerCase();
            const statusValido = ["ativa", "finalizada", "lixeira"].includes(statusParse) ? statusParse : "ativa";

            const casaPayload = {
              nome: String(nome),
              login: String(row["login"] || row["usuario"] || row["user"] || ""),
              senha: String(row["senha"] || row["password"] || row["pass"] || ""),
              meta: Number(row["meta"] || row["target"] || row["valor"]) || 0,
              media: Number(row["media"] || row["average"]) || 0,
              prazo: String(row["prazo"] || row["dias"] || row["periodo"] || ""),
              linkCasa: String(row["linkcasa"] || row["link casa"] || row["link_casa"] || row["link"] || ""),
              linkContaFilha: String(row["linkcontafilha"] || row["link conta filha"] || row["conta filha"] || ""),
              status: statusValido as "ativa" | "finalizada" | "lixeira",
            };

            const exists = state.casas.find((c) => c.nome === casaPayload.nome);
            if (!exists) {
              addCasa(casaPayload);
              importedCasas++;
            }
          }
        }

        // Importar Relatorios
        if (workbook.SheetNames.includes("Relatorios")) {
          const relatoriosData = XLSX.utils.sheet_to_json<any>(workbook.Sheets["Relatorios"]);
          for (const rel of relatoriosData) {
            const exists = state.relatorios.find((r) => r.id === rel.id);
            if (!exists) {
              const { id, criadoEm, ...relPayload } = rel;
              if (typeof relPayload.rows === "string") {
                try { relPayload.rows = JSON.parse(relPayload.rows); } catch { relPayload.rows = []; }
              }
              addRelatorio(relPayload);
              importedRelatorios++;
            }
          }
        }

        showMessage("success", `Dados importados com sucesso! Casas: ${importedCasas}, Relatórios: ${importedRelatorios}`);
      } catch (error) {
        console.error(error);
        showMessage("error", "Erro ao processar o arquivo. Verifique o formato.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border space-y-6">
      <h3 className="text-xl font-bold text-foreground">Importar e Exportar Dados</h3>
      <p className="text-sm text-muted-foreground">
        Você pode gerar um arquivo .xlsx com todos os dados atuais do sistema ou fazer o upload de um arquivo para importar registros novos.
      </p>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-100 border-green-300 dark:border-green-700"
              : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-100 border-red-300 dark:border-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Download size={20} />
          Exportar XLSX
        </button>

        <input
          type="file"
          accept=".xlsx,.json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-secondary dark:bg-slate-700 text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border"
        >
          <Upload size={20} />
          {loading ? "Processando..." : "Importar XLSX"}
        </button>
      </div>
    </div>
  );
}
