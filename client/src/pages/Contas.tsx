import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { trpc } from "@/lib/trpc";
import SearchFilter from "@/components/SearchFilter";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { validations } from "@/lib/validations";
import { Plus, X, Eye, EyeOff, Trash2, Save, Briefcase, RotateCcw, Check } from "lucide-react";
import CopyButton from "@/components/CopyButton";

interface ContaFormData {
  id: string;
  usuario: string;
  senha: string;
  valor: string;
  casa: string;
  status: "sacado" | "sacando" | "bloqueado";
}

interface ContaForm {
  id: string;
  data: ContaFormData;
  isNew: boolean;
  errors: Record<string, string>;
}

export default function Contas() {
  const { state } = useApp();
  const [contas, setContas] = useState<any[]>([]);
  const [filteredContas, setFilteredContas] = useState<any[]>([]);
  const [contasLixeira, setContasLixeira] = useState<any[]>([]);
  const [openForms, setOpenForms] = useState<ContaForm[]>([]);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [selectedContaId, setSelectedContaId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"contas" | "lixeira">("contas");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    contaId: string | null;
    action: "delete" | "restore" | "deleteMultiple" | "changeStatus" | null;
  }>({ isOpen: false, contaId: null, action: null });
  const [bulkStatusAction, setBulkStatusAction] = useState<"sacado" | "sacando" | "bloqueado" | null>(null);

  // Carregar contas ao montar
  const { data: contasData, refetch } = trpc.contas.list.useQuery();

  // Atualizar contas quando dados chegarem
  useEffect(() => {
    if (contasData) {
      const ativas = contasData.filter((c: any) => c.status !== "bloqueado");
      const lixeira = contasData.filter((c: any) => c.status === "bloqueado");
      setContas(ativas);
      setFilteredContas(ativas);
      setContasLixeira(lixeira);
    }
  }, [contasData]);

  // Listener de teclado para atalhos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedContaId) return;

      const conta = contas.find((c) => c.id === selectedContaId);
      if (!conta) return;

      // Ctrl+U para copiar usuario
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        navigator.clipboard.writeText(conta.usuario);
        toast.success("Usuario copiado!");
      }

      // Ctrl+S para copiar senha
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (conta.senha) {
          navigator.clipboard.writeText(conta.senha);
          toast.success("Senha copiada!");
        } else {
          toast.error("Esta conta nao tem senha salva");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedContaId, contas]);

  const createContaMutation = trpc.contas.create.useMutation();
  const updateContaMutation = trpc.contas.update.useMutation();
  const deleteContaMutation = trpc.contas.delete.useMutation();

  const handleSearch = (query: string) => {
    const filtered = contas.filter((conta) =>
      conta.usuario.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredContas(filtered);
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    let filtered = contas;

    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    setFilteredContas(filtered);
  };

  const addNewForm = () => {
    const newForm: ContaForm = {
      id: Date.now().toString(),
      data: {
        id: "",
        usuario: "",
        senha: "",
        valor: "",
        casa: "",
        status: "sacando",
      },
      isNew: true,
      errors: {},
    };
    setOpenForms([...openForms, newForm]);
  };

  const removeForm = (formId: string) => {
    setOpenForms(openForms.filter((f) => f.id !== formId));
  };

  const updateFormData = (
    formId: string,
    field: keyof ContaFormData,
    value: any
  ) => {
    setOpenForms(
      openForms.map((f) =>
        f.id === formId ? { ...f, data: { ...f.data, [field]: value } } : f
      )
    );
  };

  const validateForm = (data: ContaFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!validations.isValidText(data.usuario, 1, 100)) {
      errors.usuario = "Usuário é obrigatório";
    }

    return errors;
  };

  const handleSaveForm = async (form: ContaForm) => {
    const errors = validateForm(form.data);
    if (Object.keys(errors).length > 0) {
      setOpenForms(
        openForms.map((f) =>
          f.id === form.id ? { ...f, errors } : f
        )
      );
      return;
    }

    try {
      if (form.isNew) {
      await createContaMutation.mutateAsync({
        usuario: form.data.usuario,
        senha: form.data.senha || undefined,
        valor: form.data.valor ? form.data.valor : undefined,
        casa: form.data.casa || undefined,
        status: form.data.status as "sacado" | "sacando" | "bloqueado",
      });
        toast.success("Conta criada com sucesso!");
      } else {
        await updateContaMutation.mutateAsync({
          id: form.data.id,
          usuario: form.data.usuario,
          senha: form.data.senha || undefined,
          valor: form.data.valor ? form.data.valor : undefined,
          casa: form.data.casa || undefined,
          status: form.data.status as "sacado" | "sacando" | "bloqueado",
        });
        toast.success("Conta atualizada com sucesso!");
      }
      removeForm(form.id);
      refetch();
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      toast.error("Erro ao salvar conta");
    }
  };

  const handleDeleteConta = async (contaId: string) => {
    try {
      // Usar update para marcar como deletada em vez de deletar
      await updateContaMutation.mutateAsync({
        id: contaId,
        status: "bloqueado", // Usar bloqueado como status de lixeira
      });
      toast.success("Conta movida para lixeira!");
      refetch();
    } catch (error) {
      console.error("Erro ao deletar conta:", error);
      toast.error("Erro ao deletar conta");
    }
  };

  const handleRestoreConta = async (contaId: string) => {
    try {
      await updateContaMutation.mutateAsync({
        id: contaId,
        status: "sacando",
      });
      toast.success("Conta restaurada!");
      // Atualizar estado local para feedback imediato
      setContasLixeira(contasLixeira.filter((c) => c.id !== contaId));
      setContas([...contas, contasLixeira.find((c) => c.id === contaId)!]);
      refetch();
    } catch (error) {
      console.error("Erro ao restaurar conta:", error);
      toast.error("Erro ao restaurar conta");
    }
  };

  const handlePermanentDelete = async (contaId: string) => {
    try {
      // Aqui você pode implementar uma deleção permanente se necessário
      await deleteContaMutation.mutateAsync({ id: contaId });
      toast.success("Conta deletada permanentemente!");
      refetch();
    } catch (error) {
      console.error("Erro ao deletar permanentemente:", error);
      toast.error("Erro ao deletar conta");
    }
  };

  const toggleSelectConta = (contaId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(contaId)) {
      newSelected.delete(contaId);
    } else {
      newSelected.add(contaId);
    }
    setSelectedIds(newSelected);
  };

  const selectAllContas = () => {
    if (selectedIds.size === filteredContas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContas.map((c) => c.id)));
    }
  };

  const handleDeleteMultiple = async () => {
    try {
      const contasToDelete = Array.from(selectedIds);
      const contasToDelete_Perm = contasToDelete.map((contaId) => {
        return deleteContaMutation.mutateAsync({ id: contaId });
      });
      await Promise.all(contasToDelete_Perm);
      toast.success(`${selectedIds.size} conta(s) deletada(s) permanentemente!`);
      setSelectedIds(new Set());
      refetch();
    } catch (error) {
      console.error("Erro ao deletar contas:", error);
      toast.error("Erro ao deletar contas");
    }
  };

  const handleChangeStatusMultiple = async (newStatus: "sacado" | "sacando" | "bloqueado") => {
    try {
      const contasToUpdate = Array.from(selectedIds);
      // Fazer todas as requisições em paralelo para melhor performance
      await Promise.all(
        contasToUpdate.map((contaId) =>
          updateContaMutation.mutateAsync({
            id: contaId,
            status: newStatus,
          })
        )
      );
      toast.success(`Status de ${selectedIds.size} conta(s) alterado!`);
      setSelectedIds(new Set());
      setBulkStatusAction(null);
      refetch();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const togglePasswordVisibility = (contaId: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [contaId]: !prev[contaId],
    }));
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sacado":
        return "Sacado";
      case "sacando":
        return "Sacando";
      case "bloqueado":
        return "Bloqueado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sacado":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "sacando":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "bloqueado":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black"
            style={{
              background: "linear-gradient(135deg, #ffffff 10%, #f3d078 50%, #ffffff 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >Contas Não Sacadas</h1>
          <p className="text-xs text-white/30 mt-0.5 uppercase tracking-widest">Gerenciamento de contas</p>
        </div>
        <button
          onClick={addNewForm}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold min-h-[44px] w-full md:w-auto transition-all hover:scale-[1.02] text-[#050b18]"
          style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
        >
          <Plus size={18} />
          Nova Conta
        </button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 rounded-xl border border-white/10 w-fit"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        {[
          { id: "contas", label: `Contas (${contas.length})` },
          { id: "lixeira", label: `Lixeira (${contasLixeira.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
            style={activeTab === tab.id ? {
              background: "linear-gradient(135deg, #d4a017, #f59e0b)",
              color: "#050b18",
            } : { color: "rgba(255,255,255,0.4)" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Formulários Abertos */}
      {openForms.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground dark:text-white">
            Formulários Abertos ({openForms.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {openForms.map((form) => (
              <div
                key={form.id}
                className="rounded-2xl p-5 border border-white/10 space-y-4"
                style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground dark:text-white">
                    {form.isNew ? "Nova Conta" : "Editar Conta"}
                  </h3>
                  <button
                    onClick={() => removeForm(form.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Fechar formulário"
                    aria-label="Fechar formulário"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Usuário */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-1">
                      Usuário *
                    </label>
                    <input
                      type="text"
                      placeholder="Digite o usuário"
                      value={form.data.usuario}
                      onChange={(e) =>
                        updateFormData(form.id, "usuario", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4a017] bg-transparent border-white/15 text-white min-h-[44px] ${
                        form.errors.usuario
                          ? "border-red-500"
                          : "border-border"
                      }`}
                    />
                    {form.errors.usuario && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.errors.usuario}
                      </p>
                    )}
                  </div>

                  {/* Senha */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-1">
                      Senha (Opcional)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword[form.id] ? "text" : "password"}
                        placeholder="Digite a senha (opcional)"
                        value={form.data.senha}
                        onChange={(e) =>
                          updateFormData(form.id, "senha", e.target.value)
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4a017] bg-transparent border-white/15 text-white pr-10 min-h-[44px] ${
                          form.errors.senha
                            ? "border-red-500"
                            : "border-border"
                        }`}
                      />
                      <button
                        onClick={() => togglePasswordVisibility(form.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
                        type="button"
                      >
                        {showPassword[form.id] ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {form.errors.senha && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.errors.senha}
                      </p>
                    )}
                  </div>

                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-1">
                      Valor (Opcional)
                    </label>
                    <input
                      type="number"
                      placeholder="Digite o valor (opcional)"
                      value={form.data.valor}
                      onChange={(e) =>
                        updateFormData(form.id, "valor", e.target.value)
                      }
                      step="0.01"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4a017] bg-transparent border-white/15 text-white min-h-[44px] ${
                        form.errors.valor
                          ? "border-red-500"
                          : "border-border"
                      }`}
                    />
                    {form.errors.valor && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.errors.valor}
                      </p>
                    )}
                  </div>

                  {/* Casa */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-1">
                      Casa (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: MANGA 01, WE, VOY"
                      value={form.data.casa}
                      onChange={(e) =>
                        updateFormData(form.id, "casa", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4a017] bg-transparent border-white/15 text-white min-h-[44px]"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-1">
                      Status
                    </label>
                    <select
                      value={form.data.status}
                      onChange={(e) =>
                        updateFormData(
                          form.id,
                          "status",
                          e.target.value as "sacado" | "sacando" | "bloqueado"
                        )
                      }
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d4a017] bg-transparent border-white/15 text-white min-h-[44px]"
                    >
                      <option value="sacando">Sacando</option>
                      <option value="sacado">Sacado</option>
                      <option value="bloqueado">Bloqueado</option>
                    </select>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-2 pt-4 border-t border-white/8">
                  <button
                    onClick={() => handleSaveForm(form)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold min-h-[44px] text-[#050b18] transition-all hover:scale-[1.01]"
                    style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                  <button
                    onClick={() => removeForm(form.id)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium min-h-[44px] text-white/50 border border-white/12 hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contas Ativas */}
      {activeTab === "contas" && (
        <>
          {/* Barra de ações em lote */}
          {selectedIds.size > 0 && (
            <div className="rounded-2xl p-4 border border-[#d4a017]/20 space-y-3"
              style={{ background: "rgba(212,160,23,0.06)" }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-bold text-[#d4a017]">
                  {selectedIds.size} conta(s) selecionada(s)
                </p>
                <button onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Limpar seleção
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  value={bulkStatusAction || ""}
                  onChange={(e) => {
                    const value = e.target.value as "sacado" | "sacando" | "bloqueado" | "";
                    if (value) {
                      setBulkStatusAction(value);
                      setConfirmDialog({ isOpen: true, contaId: null, action: "changeStatus" });
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-transparent text-white/70 border border-white/15 focus:outline-none focus:ring-1 focus:ring-[#d4a017] min-h-[44px]"
                >
                  <option value="">Alterar status para...</option>
                  <option value="sacado">Sacado</option>
                  <option value="sacando">Sacando</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
                <button
                  onClick={() => setConfirmDialog({ isOpen: true, contaId: null, action: "deleteMultiple" })}
                  className="px-4 py-2 rounded-xl font-bold min-h-[44px] text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  style={{ background: "rgba(239,68,68,0.05)" }}
                >
                  <Trash2 size={16} />
                  Deletar Selecionadas
                </button>
              </div>
            </div>
          )}

          {/* Filtro e Busca */}
          <SearchFilter
            placeholder="Buscar por usuário..."
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            filterOptions={[
              {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                  { value: "sacado", label: "Sacado" },
                  { value: "sacando", label: "Sacando" },
                  { value: "bloqueado", label: "Bloqueado" },
                ],
              },
            ]}
          />

          {/* Lista de Contas */}
          {filteredContas.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Nenhuma conta encontrada"
              description="Crie uma nova conta clicando no botão acima"
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  Contas Salvas ({filteredContas.length})
                </h2>
                <button
                  onClick={selectAllContas}
                  className="text-xs px-4 py-2 rounded-xl font-bold min-h-[44px] flex items-center gap-2 border border-white/12 text-white/50 hover:bg-white/5 transition-colors"
                >
                  <Check size={14} />
                  {selectedIds.size === filteredContas.length ? "Desselecionar" : "Selecionar Todos"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContas.map((conta) => (
                  <div
                    key={conta.id}
                    className="rounded-2xl p-4 border space-y-3 hover:border-white/15 transition-all duration-300"
                    style={{
                      background: selectedIds.has(conta.id)
                        ? "rgba(212,160,23,0.06)"
                        : "rgba(255,255,255,0.03)",
                      borderColor: selectedIds.has(conta.id)
                        ? "rgba(212,160,23,0.3)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    {/* Checkbox */}
                    <div className="flex items-start justify-between">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(conta.id)}
                        onChange={() => toggleSelectConta(conta.id)}
                        className="w-5 h-5 rounded cursor-pointer accent-primary mt-1"
                        aria-label={`Selecionar ${conta.usuario}`}
                      />
                      <div className="flex-1 ml-3">
                        {conta.casa && (
                          <p className="text-xs font-semibold text-[#d4a017] uppercase tracking-wide mb-1">
                            {conta.casa}
                          </p>
                        )}
                        <h3 className="font-bold text-foreground dark:text-white truncate">
                          {conta.usuario}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {conta.senha ? "Senha salva" : "Sem senha"}
                        </p>
                        {conta.criadoEm && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Criada: {new Date(conta.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={conta.status} />
                    </div>

                    {/* Botões de Copiar */}
                    <div className="flex gap-2 flex-wrap">
                      <CopyButton
                        text={conta.usuario}
                        label="Copiar Usuário"
                        size="sm"
                        className="flex-1 min-w-[120px]"
                      />
                      {conta.senha && (
                        <CopyButton
                          text={conta.senha}
                          label="Copiar Senha"
                          size="sm"
                          className="flex-1 min-w-[120px]"
                        />
                      )}
                    </div>

                    {conta.valor && (
                      <div className="rounded-lg p-2 border border-white/8">
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="font-bold text-foreground dark:text-white">
                          R$ {parseFloat(conta.valor).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-white/8">
                      <button
                        onClick={() => {
                          const form: ContaForm = {
                            id: conta.id,
                            data: {
                              id: conta.id,
                              usuario: conta.usuario,
                              senha: conta.senha || "",
                              valor: conta.valor || "",
                              casa: conta.casa || "",
                              status: conta.status,
                            },
                            isNew: false,
                            errors: {},
                          };
                          setOpenForms([...openForms, form]);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl text-xs font-bold min-h-[40px] flex items-center justify-center text-[#050b18] transition-all hover:scale-[1.01]"
                        style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmDialog({ isOpen: true, contaId: conta.id, action: "delete" })}
                        className="px-3 py-2 rounded-xl min-h-[40px] flex items-center justify-center text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                        style={{ background: "rgba(239,68,68,0.05)" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Lixeira */}
      {activeTab === "lixeira" && (
        <>
          {contasLixeira.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Lixeira vazia"
              description="Contas deletadas aparecerão aqui"
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  Contas na Lixeira ({contasLixeira.length})
                </h2>
                <button
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      contaId: null,
                      action: "deleteMultiple",
                    })
                  }
                  className="px-4 py-2 rounded-xl font-bold text-sm text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-colors"
                  style={{ background: "rgba(239,68,68,0.05)" }}
                >
                  Esvaziar Lixeira
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contasLixeira.map((conta) => (
                  <div
                    key={conta.id}
                    className="rounded-2xl p-4 border border-red-500/20 space-y-3 opacity-70"
                    style={{ background: "rgba(239,68,68,0.04)" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground dark:text-white truncate">
                          {conta.usuario}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {conta.senha ? "Senha salva" : "Sem senha"}
                        </p>
                      </div>
                      <StatusBadge status={conta.status} />
                    </div>

                    {conta.valor && (
                      <div className="rounded-lg p-2 border border-white/8">
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="font-bold text-foreground dark:text-white">
                          R$ {parseFloat(conta.valor).toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-border dark:border-slate-700">
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            contaId: conta.id,
                            action: "restore",
                          })
                        }
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium min-h-[44px] flex items-center justify-center gap-2"
                      >
                        <RotateCcw size={16} />
                        Restaurar
                      </button>
                      <button
                        onClick={() => {
                          if (contasLixeira.length === 0) {
                            toast.error("Lixeira vazia!");
                            return;
                          }
                          setConfirmDialog({
                            isOpen: true,
                            contaId: null,
                            action: "deleteMultiple",
                          })
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={contasLixeira.length === 0}
                      >
                        Esvaziar Lixeira ({contasLixeira.length})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.action === "delete"
            ? "Deletar Conta"
            : confirmDialog.action === "restore"
            ? "Restaurar Conta"
            : confirmDialog.action === "deleteMultiple"
            ? "Deletar Permanentemente"
            : "Alterar Status"
        }
        description={
          confirmDialog.action === "delete"
            ? "Tem certeza que deseja deletar esta conta? Ela será movida para a lixeira."
            : confirmDialog.action === "restore"
            ? "Deseja restaurar esta conta?"
            : confirmDialog.action === "deleteMultiple"
            ? "Esta ação não pode ser desfeita."
            : `Alterar o status de ${selectedIds.size} conta(s)?`
        }
        onConfirm={async () => {
          if (confirmDialog.action === "delete" && confirmDialog.contaId) {
            await handleDeleteConta(confirmDialog.contaId);
          } else if (confirmDialog.action === "restore" && confirmDialog.contaId) {
            await handleRestoreConta(confirmDialog.contaId);
          } else if (confirmDialog.action === "deleteMultiple" && confirmDialog.contaId) {
            await handlePermanentDelete(confirmDialog.contaId);
          } else if (confirmDialog.action === "deleteMultiple" && contasLixeira.length > 0 && selectedIds.size === 0) {
            const deletionPromises = contasLixeira.map((conta) => deleteContaMutation.mutateAsync({ id: conta.id }));
            await Promise.all(deletionPromises);
            toast.success(`Lixeira esvaziada! ${contasLixeira.length} conta(s) deletada(s).`);
            refetch();
          } else if (confirmDialog.action === "deleteMultiple" && selectedIds.size > 0) {
            await handleDeleteMultiple();
          } else if (confirmDialog.action === "changeStatus" && bulkStatusAction) {
            await handleChangeStatusMultiple(bulkStatusAction);
          }
          setConfirmDialog({ isOpen: false, contaId: null, action: null });
        }}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, contaId: null, action: null })
        }
      />
    </div>
  );
}
