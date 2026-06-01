import { useApp } from "@/contexts/AppContext";
import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import ColorfulNameEditor from "@/components/ColorfulNameEditor";
import ImportExportXlsx from "@/components/ImportExportXlsx";

export default function EditarDados() {
  const { state, updateAppName, updateCorPrimaria, updateFundo, updateLogo } = useApp();
  const [nomeApp, setNomeApp] = useState(state.nomeApp);
  const [corPrimaria, setCorPrimaria] = useState(state.corPrimaria);
  const [fundoUrl, setFundoUrl] = useState(state.fundoUrl || "");
  const [logoUrl, setLogoUrl] = useState(state.logoUrl || "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateAppName(nomeApp);
    updateCorPrimaria(corPrimaria);
    updateFundo(fundoUrl);
    updateLogo(logoUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Notificação de Sucesso */}
      {saved && (
        <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-100 rounded-lg border border-green-300 dark:border-green-700">
          ✓ Dados salvos com sucesso!
        </div>
      )}



      {/* Importação e Exportação XLSX */}
      <ImportExportXlsx />

      {/* Configurações do App */}
      <div className="bg-card backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg space-y-6">
        <h3 className="text-xl font-bold text-foreground">
          Configurações Gerais
        </h3>

        {/* Nome do App */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nome do Aplicativo
          </label>
          <input
            type="text"
            value={nomeApp}
            onChange={(e) => setNomeApp(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 text-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Este nome aparecerá no cabeçalho do aplicativo
          </p>
        </div>

        {/* Cor Primária */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Cor Primária
          </label>
          <div className="flex gap-4 items-center">
            <input
              type="color"
              value={corPrimaria}
              onChange={(e) => setCorPrimaria(e.target.value)}
              className="w-16 h-10 rounded-lg cursor-pointer border border-border"
            />
            <input
              type="text"
              value={corPrimaria}
              onChange={(e) => setCorPrimaria(e.target.value)}
              className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono bg-white dark:bg-slate-700 text-foreground"
              placeholder="#2563EB"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Use formato hexadecimal (ex: #2563EB)
          </p>
        </div>

        {/* Upload de Fundo */}
        <div>
          <ImageUpload
            label="Imagem de Fundo (Background)"
            value={fundoUrl}
            onChange={setFundoUrl}
            onRemove={() => setFundoUrl("")}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Selecione ou arraste uma imagem para usar como fundo do dashboard
          </p>
        </div>

        {/* Upload de Logo */}
        <div>
          <ImageUpload
            label="Logo do Aplicativo"
            value={logoUrl}
            onChange={setLogoUrl}
            onRemove={() => setLogoUrl("")}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Selecione ou arraste uma imagem para usar como logo
          </p>
        </div>

        {/* Botão Salvar */}
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Salvar Configurações
        </button>
      </div>



      {/* Informações de Armazenamento */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
          💾 Armazenamento de Dados
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Todos os seus dados são salvos automaticamente no navegador. Seus dados
          persistem mesmo se você fechar e reabrir o navegador. Não há sincronização
          com servidor - tudo fica local no seu dispositivo.
        </p>
      </div>
    </div>
  );
}
