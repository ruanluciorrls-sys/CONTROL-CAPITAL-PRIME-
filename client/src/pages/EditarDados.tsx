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

      {/* Editor de Nome Colorido */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border space-y-6">
        <h3 className="text-xl font-bold text-foreground">
          Editar Nome Colorido
        </h3>
        <ColorfulNameEditor initialName={state.nomeApp} />
      </div>

      {/* Importação e Exportação XLSX */}
      <ImportExportXlsx />

      {/* Configurações do App */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border space-y-6">
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

      {/* Resumo de Dados */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Resumo do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-secondary dark:bg-slate-700 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Total de Casas</p>
            <p className="text-3xl font-bold text-primary">{state.casas.length}</p>
          </div>
          <div className="p-4 bg-secondary dark:bg-slate-700 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Total de Relatórios</p>
            <p className="text-3xl font-bold text-primary">
              {state.relatorios.length}
            </p>
          </div>
          <div className="p-4 bg-secondary dark:bg-slate-700 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Casas Ativas</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {state.casas.filter((c) => c.status === "ativa").length}
            </p>
          </div>
          <div className="p-4 bg-secondary dark:bg-slate-700 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">Casas Finalizadas</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {state.casas.filter((c) => c.status === "finalizada").length}
            </p>
          </div>
        </div>
      </div>

      {/* Relatórios Finalizados */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-border">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Relatórios Finalizados
        </h3>
        {state.relatorios.filter((r) => r.status === "finalizado").length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum relatório finalizado ainda
          </p>
        ) : (
          <div className="space-y-2">
            {state.relatorios
              .filter((r) => r.status === "finalizado")
              .map((rel) => {
                const casa = state.casas.find((c) => c.id === rel.casaId);
                return (
                  <div
                    key={rel.id}
                    className="p-3 bg-secondary dark:bg-slate-700 rounded-lg border border-border flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {casa?.nome || "Casa não encontrada"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rel.agente} • {new Date(rel.criadoEm).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary">
                      R$ {(rel.rows.reduce((sum, r) => sum + r.resultado, 0) + (rel.cooperacao || 0)).toFixed(2)}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
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
