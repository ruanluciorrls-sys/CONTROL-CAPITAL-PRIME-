import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Shield, Plus, Key, UserCheck, UserX, Crown, Clock, XCircle, CheckCircle, Users } from "lucide-react";

type SubscriptionStatus = "active" | "inactive" | "trial";

const statusConfig: Record<SubscriptionStatus, { label: string; className: string; icon: React.ReactNode }> = {
  active: { label: "Ativo", className: "badge-admin-active", icon: <CheckCircle size={12} /> },
  trial: { label: "Trial", className: "badge-admin-trial", icon: <Clock size={12} /> },
  inactive: { label: "Inativo", className: "badge-admin-inactive", icon: <XCircle size={12} /> },
};

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" as "user" | "admin" });
  const [error, setError] = useState("");
  const createUser = trpc.admin.users.create.useMutation({
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal-title">
          <Plus size={20} /> Criar Novo Usuário
        </h3>
        <div className="admin-modal-fields">
          <div className="admin-field">
            <label>Nome completo</label>
            <input className="admin-input" placeholder="João Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Email</label>
            <input className="admin-input" type="email" placeholder="joao@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Senha (mínimo 6 caracteres)</label>
            <input className="admin-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div className="admin-field">
            <label>Perfil</label>
            <select className="admin-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as "user" | "admin" }))}>
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        {error && <p className="admin-modal-error">{error}</p>}
        <div className="admin-modal-actions">
          <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="admin-btn-primary" disabled={createUser.isPending} onClick={() => createUser.mutate(form)}>
            {createUser.isPending ? "Criando..." : "Criar Usuário"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ userId, userName, onClose }: { userId: number; userName: string; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const resetPwd = trpc.admin.users.resetPassword.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = () => {
    if (password.length < 6) return setError("Senha mínima de 6 caracteres");
    if (password !== confirm) return setError("Senhas não coincidem");
    setError("");
    resetPwd.mutate({ userId, newPassword: password });
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal-title">
          <Key size={20} /> Resetar Senha — {userName}
        </h3>
        {success ? (
          <div className="admin-modal-success">
            <CheckCircle size={40} />
            <p>Senha alterada com sucesso!</p>
            <button className="admin-btn-primary" onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <>
            <div className="admin-modal-fields">
              <div className="admin-field">
                <label>Nova senha</label>
                <input className="admin-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="admin-field">
                <label>Confirmar senha</label>
                <input className="admin-input" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
            </div>
            {error && <p className="admin-modal-error">{error}</p>}
            <div className="admin-modal-actions">
              <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="admin-btn-primary" disabled={resetPwd.isPending} onClick={handleSubmit}>
                {resetPwd.isPending ? "Salvando..." : "Salvar Senha"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SubscriptionModal({ userId, userName, currentStatus, onClose, onSuccess }: {
  userId: number; userName: string; currentStatus: SubscriptionStatus;
  onClose: () => void; onSuccess: () => void;
}) {
  const [status, setStatus] = useState<SubscriptionStatus>(currentStatus);
  const [expiresAt, setExpiresAt] = useState("");
  const updateSub = trpc.admin.users.updateSubscription.useMutation({
    onSuccess: () => { onSuccess(); onClose(); },
  });

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal-title">
          <Crown size={20} /> Assinatura — {userName}
        </h3>
        <div className="admin-modal-fields">
          <div className="admin-field">
            <label>Status da assinatura</label>
            <div className="admin-status-buttons">
              {(["active", "trial", "inactive"] as SubscriptionStatus[]).map((s) => (
                <button
                  key={s}
                  className={`admin-status-btn ${status === s ? "selected" : ""} status-${s}`}
                  onClick={() => setStatus(s)}
                >
                  {statusConfig[s].icon} {statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-field">
            <label>Data de vencimento (opcional)</label>
            <input className="admin-input" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <div className="admin-modal-actions">
          <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="admin-btn-primary" disabled={updateSub.isPending}
            onClick={() => updateSub.mutate({ userId, subscriptionStatus: status, subscriptionExpiresAt: expiresAt || undefined })}>
            {updateSub.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const usersQuery = trpc.admin.users.list.useQuery();
  const toggleActive = trpc.admin.users.toggleActive.useMutation({ onSuccess: () => usersQuery.refetch() });

  const [showCreate, setShowCreate] = useState(false);
  const [resetUser, setResetUser] = useState<{ id: number; name: string } | null>(null);
  const [subUser, setSubUser] = useState<{ id: number; name: string; status: SubscriptionStatus } | null>(null);

  if (user?.role !== "admin") {
    return (
      <div className="admin-forbidden">
        <Shield size={48} />
        <h2>Acesso restrito</h2>
        <p>Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-info">
          <div className="admin-header-icon"><Shield size={24} /></div>
          <div>
            <h1 className="admin-heading">Painel de Administração</h1>
            <p className="admin-subheading">Gerencie usuários e assinaturas do Capital Prime Control</p>
          </div>
        </div>
        <button id="admin-create-user" className="admin-btn-primary admin-btn-large" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {[
          { label: "Total de Usuários", value: users.length, icon: <Users size={20} />, color: "blue" },
          { label: "Assinaturas Ativas", value: users.filter(u => u.subscriptionStatus === "active").length, icon: <CheckCircle size={20} />, color: "green" },
          { label: "Em Trial", value: users.filter(u => u.subscriptionStatus === "trial").length, icon: <Clock size={20} />, color: "amber" },
          { label: "Inativos", value: users.filter(u => u.subscriptionStatus === "inactive").length, icon: <XCircle size={20} />, color: "red" },
        ].map((stat, i) => (
          <div key={i} className={`admin-stat-card stat-${stat.color}`}>
            <div className="admin-stat-icon">{stat.icon}</div>
            <div>
              <p className="admin-stat-value">{stat.value}</p>
              <p className="admin-stat-label">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h2 className="admin-table-title">Usuários Cadastrados</h2>
        </div>
        {usersQuery.isLoading ? (
          <div className="admin-loading">
            <div className="admin-spinner-lg" />
            <p>Carregando usuários...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <Users size={48} />
            <p>Nenhum usuário cadastrado ainda.</p>
            <button className="admin-btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Criar primeiro usuário
            </button>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Assinatura</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const sub = (u.subscriptionStatus ?? "trial") as SubscriptionStatus;
                  return (
                    <tr key={u.id} className={!u.isActive ? "admin-row-inactive" : ""}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">{(u.name ?? u.email ?? "?")[0].toUpperCase()}</div>
                          <div>
                            <p className="admin-user-name">{u.name ?? "—"}</p>
                            <p className="admin-user-email">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-role-badge ${u.role === "admin" ? "badge-admin-role" : "badge-user-role"}`}>
                          {u.role === "admin" ? <><Crown size={12} /> Admin</> : "Usuário"}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-sub-badge ${statusConfig[sub].className}`}>
                          {statusConfig[sub].icon} {statusConfig[sub].label}
                        </span>
                      </td>
                      <td className="admin-expires-cell">
                        {u.subscriptionExpiresAt
                          ? new Date(u.subscriptionExpiresAt).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td>
                        <span className={`admin-active-badge ${u.isActive ? "badge-is-active" : "badge-is-blocked"}`}>
                          {u.isActive ? "Ativo" : "Bloqueado"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action-btn btn-subscription"
                            title="Gerenciar assinatura"
                            onClick={() => setSubUser({ id: u.id, name: u.name ?? u.email, status: sub })}
                          >
                            <Crown size={15} />
                          </button>
                          <button
                            className="admin-action-btn btn-reset"
                            title="Resetar senha"
                            onClick={() => setResetUser({ id: u.id, name: u.name ?? u.email })}
                          >
                            <Key size={15} />
                          </button>
                          <button
                            className={`admin-action-btn ${u.isActive ? "btn-block" : "btn-unblock"}`}
                            title={u.isActive ? "Bloquear usuário" : "Desbloquear usuário"}
                            onClick={() => toggleActive.mutate({ userId: u.id, isActive: !u.isActive })}
                            disabled={u.id === user.id}
                          >
                            {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onSuccess={() => usersQuery.refetch()} />}
      {resetUser && <ResetPasswordModal userId={resetUser.id} userName={resetUser.name} onClose={() => setResetUser(null)} />}
      {subUser && <SubscriptionModal userId={subUser.id} userName={subUser.name} currentStatus={subUser.status} onClose={() => setSubUser(null)} onSuccess={() => usersQuery.refetch()} />}
    </div>
  );
}
