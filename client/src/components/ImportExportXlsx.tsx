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
        const workbook = XLSX.read(data, { type: "binary" });

        // Importar Casas
        if (workbook.SheetNames.includes("Casas")) {
          const casasData = XLSX.utils.sheet_to_json<CasaData>(workbook.Sheets["Casas"]);
          for (const casa of casasData) {
            // Verifica se a casa já existe
            const exists = state.casas.find((c) => c.id === casa.id);
            if (!exists) {
              const { id, criadoEm, ...casaPayload } = casa;
              addCasa(casaPayload);
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
                try {
                  relPayload.rows = JSON.parse(relPayload.rows);
                } catch {
                  relPayload.rows = [];
                }
              }
              addRelatorio(relPayload);
            }
          }
        }

        showMessage("success", "Dados importados com sucesso!");
      } catch (error) {
        console.error(error);
        showMessage("error", "Erro ao processar o arquivo. Verifique o formato.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
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
          accept=".xlsx"
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
