import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import ConfirmDialog from "@/components/ConfirmDialog";
import { validations } from "@/lib/validations";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, X, Copy, Check } from "lucide-react";

export default function GerenciarCasas() {
  const { state, addCasa, updateCasa, deleteCasa, finalizarCasa, restaurarCasa, esvaziarLixeiraCasas, deletePermanentementeCasa } = useApp();
  const [activeTab, setActiveTab] = useState<"ativa" | "lixeira">("ativa");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorsMultiple, setErrorsMultiple] = useState<Record<string, Record<string, string>>>({});
  const [selectedCasas, setSelectedCasas] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "delete" | "finalize" | "deleteSelected" | null;
    casaId: string | null;
  }>({ isOpen: false, type: null, casaId: null });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copiado para a area de transferencia!");
  };
  
  // Estado para múltiplos formulários
  const [formDataList, setFormDataList] = useState<Array<{
    id: string;
    nome: string;
    login: string;
    senha: string;
    meta: number;
    media: number;
    prazo: string;
    linkCasa: string;
    linkContaFilha: string;
  }>>([]);
  
  const [formData, setFormData] = useState({
    nome: "",
    login: "",
    senha: "",
    meta: 0,
    media: 0,
    prazo: "",
    linkCasa: "",
    linkContaFilha: "",
  });

  const casasAtivas = state.casas.filter((c) => c.status === "ativa");
  const casasLixeira = state.casas.filter((c) => c.status === "lixeira");

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validations.isValidText(formData.nome, 1, 100)) {
      newErrors.nome = "Nome é obrigatório e deve ter até 100 caracteres";
    }

    if (formData.meta && !validations.isValidCurrency(formData.meta)) {
      newErrors.meta = "Meta deve ser um valor monetário válido";
    }

    if (formData.media && !validations.isValidCurrency(formData.media)) {
      newErrors.media = "Média deve ser um valor monetário válido";
    }

    if (formData.linkCasa && !validations.isValidUrl(formData.linkCasa)) {
      newErrors.linkCasa = "Link da Casa deve ser uma URL válida";
    }

    if (formData.linkContaFilha && !validations.isValidUrl(formData.linkContaFilha)) {
      newErrors.linkContaFilha = "Link da Conta-Filha deve ser uma URL válida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddForm = () => {
    const newId = Date.now().toString();
    setFormDataList([...formDataList, {
      id: newId,
      nome: "",
      login: "",
      senha: "",
      meta: 0,
      media: 0,
      prazo: "",
      linkCasa: "",
      linkContaFilha: "",
    }]);
  };

  const handleRemoveForm = (id: string) => {
    setFormDataList(formDataList.filter(f => f.id !== id));
  };

  const handleFormChange = (id: string, field: string, value: any) => {
    setFormDataList(formDataList.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
    setErrorsMultiple({ ...errorsMultiple, [id]: { ...errorsMultiple[id], [field]: "" } });
  };

  const validateFormMultiple = (form: any): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!validations.isValidText(form.nome, 1, 100)) {
      newErrors.nome = "Nome é obrigatório";
    }

    if (form.meta && !validations.isValidCurrency(form.meta)) {
      newErrors.meta = "Meta inválida";
    }

    if (form.media && !validations.isValidCurrency(form.media)) {
      newErrors.media = "Média inválida";
    }

    if (form.linkCasa && !validations.isValidUrl(form.linkCasa)) {
      newErrors.linkCasa = "URL inválida";
    }

    if (form.linkContaFilha && !validations.isValidUrl(form.linkContaFilha)) {
      newErrors.linkContaFilha = "URL inválida";
    }

    return newErrors;
  };

  const handleSubmitMultiple = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, Record<string, string>> = {};
    let hasErrors = false;

    for (const form of formDataList) {
      const formErrors = validateFormMultiple(form);
      if (Object.keys(formErrors).length > 0) {
        newErrors[form.id] = formErrors;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setErrorsMultiple(newErrors);
      toast.error("Por favor, corrija os erros nos formulários");
      return;
    }

    try {
      for (const form of formDataList) {
        await addCasa({
          nome: form.nome,
          login: form.login,
          senha: form.senha,
          meta: form.meta,
          media: form.media,
          prazo: form.prazo,
          linkCasa: form.linkCasa,
          linkContaFilha: form.linkContaFilha,
          status: "ativa",
        } as any);
      }
      
      toast.success(`${formDataList.length} casa(s) adicionada(s) com sucesso!`);
      setFormDataList([]);
      setShowModal(false);
    } catch (error) {
      toast.error("Erro ao adicionar casas");
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    try {
      if (editingId) {
        await updateCasa(editingId, formData);
        toast.success("Casa atualizada com sucesso!");
      } else {
        await addCasa({ ...formData, status: "ativa" } as any);
        toast.success("Casa adicionada com sucesso!");
      }

      setFormData({
        nome: "",
        login: "",
        senha: "",
        meta: 0,
        media: 0,
        prazo: "",
        linkCasa: "",
        linkContaFilha: "",
      });
      setEditingId(null);
      setErrors({});
    } catch (error) {
      toast.error("Erro ao salvar casa");
      console.error(error);
    }
  };

  const handleEdit = (casa: any) => {
    setFormData({
      nome: casa.nome,
      login: casa.login,
      senha: casa.senha,
      meta: casa.meta,
      media: casa.media,
      prazo: casa.prazo,
      linkCasa: casa.linkCasa,
      linkContaFilha: casa.linkContaFilha,
    });
    setEditingId(casa.id);
    setShowModal(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const colors = [
    "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:border-blue-500/50",
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/50",
    "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:border-purple-500/50",
    "bg-pink-500/10 border-pink-500/20 text-pink-400 hover:border-pink-500/50",
    "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:border-amber-500/50",
    "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:border-indigo-500/50",
    "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:border-rose-500/50",
    "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:border-cyan-500/50",
    "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:border-orange-500/50",
  ];

  return (
    <div className="space-y-6">
      {/* Abas de Navegação */}
      <div className="flex gap-2 md:gap-4 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("ativa")}
          className={`px-4 md:px-6 py-3 font-semibold transition-colors whitespace-nowrap text-sm md:text-base ${
            activeTab === "ativa"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Casas Ativas ({casasAtivas.length})
        </button>
        <button
          onClick={() => setActiveTab("lixeira")}
          className={`px-4 md:px-6 py-3 font-semibold transition-colors whitespace-nowrap text-sm md:text-base ${
            activeTab === "lixeira"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          🗑️ Lixeira ({casasLixeira.length})
        </button>
      </div>

      {activeTab === "ativa" && (
        <>
          {/* Botões do Topo */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  nome: "",
                  login: "",
                  senha: "",
                  meta: 0,
                  media: 0,
                  prazo: "",
                  linkCasa: "",
                  linkContaFilha: "",
                });
                setErrors({});
                setFormDataList([{
                  id: Date.now().toString(),
                  nome: "",
                  login: "",
                  senha: "",
                  meta: 0,
                  media: 0,
                  prazo: "",
                  linkCasa: "",
                  linkContaFilha: "",
                }]);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium w-full sm:w-auto justify-center"
            >
              <Plus size={20} />
              Adicionar Nova Casa
            </button>

            {casasAtivas.length > 0 && (
              <div className="flex items-center gap-4 bg-card border border-border p-2 px-4 rounded-lg w-full sm:w-auto h-full min-h-[48px]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedCasas.length === casasAtivas.length && casasAtivas.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCasas(casasAtivas.map(c => c.id));
                      } else {
                        setSelectedCasas([]);
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-foreground">Selecionar Todas</span>
                </label>

                {selectedCasas.length > 0 && (
                  <button
                    onClick={() => setConfirmDialog({ isOpen: true, type: "deleteSelected", casaId: null })}
                    className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-md text-sm font-bold transition-colors ml-auto sm:ml-0"
                  >
                    <Trash2 size={16} /> Apagar Selecionadas ({selectedCasas.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Grid de Casas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {casasAtivas.map((casa, index) => (
              <div
                key={casa.id}
                className={`${colors[index % colors.length]} rounded-lg p-4 border-2 cursor-pointer hover:shadow-lg transition-all min-h-[280px] flex flex-col ${selectedCasas.includes(casa.id) ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 flex gap-3 items-start">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                      checked={selectedCasas.includes(casa.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCasas([...selectedCasas, casa.id]);
                        } else {
                          setSelectedCasas(selectedCasas.filter(id => id !== casa.id));
                        }
                      }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm md:text-base text-foreground truncate">{casa.nome}</h3>
                      {casa.prazo && <p className="text-xs text-muted-foreground">Prazo: {casa.prazo}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDialog({ isOpen: true, type: "delete", casaId: casa.id })}
                    className="text-red-500 hover:text-red-700 transition-colors ml-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {casa.login && (
                  <div className="mb-2 text-xs flex items-center justify-between bg-background/50 p-2 rounded">
                    <div>
                      <p className="text-muted-foreground text-xs">Login</p>
                      <p className="font-mono text-foreground font-semibold">{casa.login}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(casa.login, `login-${casa.id}`)}
                      className="text-primary hover:text-primary/70 transition-colors"
                      title="Copiar login"
                    >
                      {copiedField === `login-${casa.id}` ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}

                {casa.senha && (
                  <div className="mb-2 text-xs flex items-center justify-between bg-background/50 p-2 rounded">
                    <div>
                      <p className="text-muted-foreground text-xs">Senha</p>
                      <p className="font-mono text-foreground font-semibold">{showPassword[casa.id] ? casa.senha : '\u2022'.repeat(casa.senha.length)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowPassword({ ...showPassword, [casa.id]: !showPassword[casa.id] })}
                        className="text-primary hover:text-primary/70 transition-colors"
                        title={showPassword[casa.id] ? "Ocultar" : "Mostrar"}
                      >
                        {showPassword[casa.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleCopy(casa.senha, `senha-${casa.id}`)}
                        className="text-primary hover:text-primary/70 transition-colors"
                        title="Copiar senha"
                      >
                        {copiedField === `senha-${casa.id}` ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {casa.linkContaFilha && (
                  <div className="mb-2 text-xs flex items-start justify-between bg-background/50 p-2 rounded gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground text-xs">Link ID</p>
                      <p className="font-mono text-foreground font-semibold text-xs break-all">{casa.linkContaFilha}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(casa.linkContaFilha, `link-${casa.id}`)}
                      className="text-primary hover:text-primary/70 transition-colors"
                      title="Copiar link"
                    >
                      {copiedField === `link-${casa.id}` ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}

                {casa.meta > 0 && (
                  <div className="mb-2 text-xs">
                    <p className="text-muted-foreground">Meta: <span className="font-semibold text-foreground">{casa.meta}</span></p>
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-3">
                  <button
                    onClick={() => handleEdit(casa)}
                    className="flex-1 px-3 py-2 bg-primary/20 text-primary rounded text-xs font-semibold hover:bg-primary/30 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmDialog({ isOpen: true, type: "finalize", casaId: casa.id })}
                    className="flex-1 px-3 py-2 bg-green-500/20 text-green-600 rounded text-xs font-semibold hover:bg-green-500/30 transition-colors"
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {casasAtivas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma casa adicionada. Clique em "Adicionar Nova Casa" para começar.</p>
            </div>
          )}
        </>
      )}

      {activeTab === "lixeira" && (
        <>
          {casasLixeira.length > 0 && (
            <button
              onClick={() => setConfirmDialog({ isOpen: true, type: "finalize", casaId: null })}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Esvaziar Lixeira
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {casasLixeira.map((casa, index) => (
              <div
                key={casa.id}
                className={`${colors[index % colors.length]} rounded-lg p-4 border-2 opacity-60`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm md:text-base text-foreground truncate">{casa.nome}</h3>
                  </div>
                  <button
                    onClick={() => restaurarCasa(casa.id)}
                    className="text-green-500 hover:text-green-700 transition-colors ml-2 text-xs"
                  >
                    Restaurar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {casasLixeira.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Lixeira vazia</p>
            </div>
          )}
        </>
      )}

      {/* Modal Pop-up */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border p-4 md:p-6 flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {editingId ? "Editar Casa" : "Adicionar Casas"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormDataList([]);
                  setEditingId(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={editingId ? handleSubmit : handleSubmitMultiple} className="p-4 md:p-6 space-y-4">
              {editingId ? (
                // Formulário de edição única
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Nome da Casa"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
                        errors.nome ? "border-red-500" : "border-border"
                      }`}
                      required
                    />
                    {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Login"
                      value={formData.login}
                      onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                      className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                    <div className="relative">
                      <input
                        type={showPassword["single"] ? "text" : "password"}
                        placeholder="Senha"
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10 bg-background text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, single: !showPassword["single"] })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword["single"] ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Meta"
                      value={formData.meta || ""}
                      onChange={(e) => setFormData({ ...formData, meta: e.target.value ? parseFloat(e.target.value) : 0 })}
                      className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                    <input
                      type="number"
                      placeholder="Média"
                      value={formData.media || ""}
                      onChange={(e) => setFormData({ ...formData, media: e.target.value ? parseFloat(e.target.value) : 0 })}
                      className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Prazo (DD/MM/YYYY)"
                    value={formData.prazo}
                    onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />

                  <input
                    type="url"
                    placeholder="Link da Casa"
                    value={formData.linkCasa}
                    onChange={(e) => setFormData({ ...formData, linkCasa: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
                      errors.linkCasa ? "border-red-500" : "border-border"
                    }`}
                  />
                  {errors.linkCasa && <p className="text-red-500 text-sm mt-1">{errors.linkCasa}</p>}

                  <input
                    type="url"
                    placeholder="Link da Conta-Filha"
                    value={formData.linkContaFilha}
                    onChange={(e) => setFormData({ ...formData, linkContaFilha: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
                      errors.linkContaFilha ? "border-red-500" : "border-border"
                    }`}
                  />
                  {errors.linkContaFilha && <p className="text-red-500 text-sm mt-1">{errors.linkContaFilha}</p>}
                </div>
              ) : (
                // Múltiplos formulários
                <div className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
                  {formDataList.map((form, index) => (
                    <div key={form.id} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-border space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-foreground">Casa #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveForm(form.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Nome da Casa"
                        value={form.nome}
                        onChange={(e) => handleFormChange(form.id, "nome", e.target.value)}
                        className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground ${
                          errorsMultiple[form.id]?.nome ? "border-red-500" : "border-border"
                        }`}
                        required
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Login"
                          value={form.login}
                          onChange={(e) => handleFormChange(form.id, "login", e.target.value)}
                          className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        />
                        <div className="relative">
                          <input
                            type={showPassword[form.id] ? "text" : "password"}
                            placeholder="Senha"
                            value={form.senha}
                            onChange={(e) => handleFormChange(form.id, "senha", e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-8 bg-background text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, [form.id]: !showPassword[form.id] })}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword[form.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Meta"
                          value={form.meta || ""}
                          onChange={(e) => handleFormChange(form.id, "meta", e.target.value ? parseFloat(e.target.value) : 0)}
                          className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        />
                        <input
                          type="number"
                          placeholder="Média"
                          value={form.media || ""}
                          onChange={(e) => handleFormChange(form.id, "media", e.target.value ? parseFloat(e.target.value) : 0)}
                          className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Prazo (DD/MM/YYYY)"
                        value={form.prazo}
                        onChange={(e) => handleFormChange(form.id, "prazo", e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                {!editingId && (
                  <button
                    type="button"
                    onClick={handleAddForm}
                    className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium text-sm"
                  >
                    + Adicionar Outro
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormDataList([]);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/90 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                >
                  {editingId ? "Salvar" : `Salvar ${formDataList.length} Casa${formDataList.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.type === "delete" ? "Deletar Casa" : confirmDialog.type === "deleteSelected" ? "Deletar Selecionadas" : confirmDialog.type === "finalize" ? "Finalizar Casa" : "Esvaziar Lixeira"}
        description={confirmDialog.type === "delete" ? "Tem certeza que deseja deletar esta casa? Ela irá para a lixeira." : confirmDialog.type === "deleteSelected" ? `Tem certeza que deseja mover as ${selectedCasas.length} casas selecionadas para a lixeira?` : confirmDialog.type === "finalize" ? "Tem certeza que deseja finalizar esta casa? Ela será movida para Casas Finalizadas." : "Tem certeza que deseja esvaziar a lixeira? Esta ação não pode ser desfeita."}
        onConfirm={() => {
          if (confirmDialog.type === "delete" && confirmDialog.casaId) {
            deleteCasa(confirmDialog.casaId);
            toast.success("Casa movida para lixeira");
          } else if (confirmDialog.type === "deleteSelected") {
            selectedCasas.forEach(id => deleteCasa(id));
            toast.success(`${selectedCasas.length} casas movidas para lixeira`);
            setSelectedCasas([]);
          } else if (confirmDialog.type === "finalize" && confirmDialog.casaId) {
            finalizarCasa(confirmDialog.casaId);
            toast.success("Casa finalizada com sucesso!");
          } else if (confirmDialog.type === null) {
            esvaziarLixeiraCasas();
            toast.success("Lixeira esvaziada");
          }
          setConfirmDialog({ isOpen: false, type: null, casaId: null });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null, casaId: null })}
      />
    </div>
  );
}
