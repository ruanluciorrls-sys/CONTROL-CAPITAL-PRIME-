import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Shield, Plus, Key, UserCheck, UserX, Crown, Clock, XCircle, CheckCircle, Users, X } from "lucide-react";

type SubscriptionStatus = "active" | "inactive" | "trial";

const inputClass = "w-full px-4 py-2.5 rounded-xl bg-transparent border border-white/15 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#d4a017] placeholder:text-white/20";
const selectClass = "w-full px-4 py-2.5 rounded-xl bg-[#0a1428] border border-white/15 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#d4a017]";

const SUB_CONFIG: Record<SubscriptionStatus, { label: string; color: string; bg: string }> = {
  active:   { label: "Ativo",   color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
  trial:    { label: "Trial",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  inactive: { label: "Inativo", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
};

/* ──────────────────────── MODAL BASE ──────────────────────── */
function Modal({ title, icon, onClose, children }: {
  title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rounded-2xl p-6 max-w-md w-full space-y-5 relative"
        style={{
          background: "linear-gradient(145deg, #070e20, #0f1e45)",
          border: "1px solid rgba(212,160,23,0.25)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-[1px]"
          style={{ background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5), transparent)" }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#050b18]"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >
              {icon}
            </div>
            <h3 className="text-sm font-black text-white/90">{title}</h3>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/8 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ──────────────────────── CRIAR USUÁRIO ──────────────────────── */
function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" as "user" | "admin" });
  const [error, setError] = useState("");
  const createUser = trpc.admin.users.create.useMutation({
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e) => setError(e.message),
  });

  return (
    <Modal title="Criar Novo Usuário" icon={<Plus size={16} />} onClose={onClose}>
      <div className="space-y-3">
        {[
          { label: "Nome completo", key: "name", type: "text", placeholder: "João Silva" },
          { label: "Email", key: "email", type: "email", placeholder: "joao@email.com" },
          { label: "Senha (mín. 6 caracteres)", key: "password", type: "password", placeholder: "••••••••" },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">{label}</label>
            <input type={type} placeholder={placeholder} className={inputClass}
              value={(form as any)[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Perfil</label>
          <select className={selectClass} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}>
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white/40 border border-white/12 hover:bg-white/5 transition-colors"
        >Cancelar</button>
        <button
          onClick={() => createUser.mutate(form)}
          disabled={createUser.isPending}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.01] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
        >
          {createUser.isPending ? "Criando..." : "Criar Usuário"}
        </button>
      </div>
    </Modal>
  );
}

/* ──────────────────────── RESETAR SENHA ──────────────────────── */
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
    <Modal title={`Resetar Senha — ${userName}`} icon={<Key size={16} />} onClose={onClose}>
      {success ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <CheckCircle size={36} className="text-emerald-400" />
          <p className="text-white/70 text-sm">Senha alterada com sucesso!</p>
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-[#050b18]"
            style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
          >Fechar</button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {[
              { label: "Nova senha", val: password, set: setPassword },
              { label: "Confirmar senha", val: confirm, set: setConfirm },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">{label}</label>
                <input type="password" placeholder="••••••••" className={inputClass} value={val} onChange={(e) => set(e.target.value)} />
              </div>
            ))}
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white/40 border border-white/12 hover:bg-white/5 transition-colors"
            >Cancelar</button>
            <button onClick={handleSubmit} disabled={resetPwd.isPending}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[#050b18] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >
              {resetPwd.isPending ? "Salvando..." : "Salvar Senha"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ──────────────────────── ASSINATURA ──────────────────────── */
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
    <Modal title={`Assinatura — ${userName}`} icon={<Crown size={16} />} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-2">Status</label>
          <div className="grid grid-cols-3 gap-2">
            {(["active", "trial", "inactive"] as SubscriptionStatus[]).map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className="py-2 rounded-xl text-xs font-bold transition-all"
                style={status === s ? {
                  background: SUB_CONFIG[s].bg,
                  color: SUB_CONFIG[s].color,
                  border: `1px solid ${SUB_CONFIG[s].color}40`,
                  boxShadow: `0 0 12px ${SUB_CONFIG[s].color}20`,
                } : {
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.3)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {SUB_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Vencimento (opcional)</label>
          <input type="date" className={inputClass} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white/40 border border-white/12 hover:bg-white/5 transition-colors"
        >Cancelar</button>
        <button
          onClick={() => updateSub.mutate({ userId, subscriptionStatus: status, subscriptionExpiresAt: expiresAt || undefined })}
          disabled={updateSub.isPending}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-[#050b18] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
        >
          {updateSub.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}

/* ──────────────────────── PAINEL PRINCIPAL ──────────────────────── */
export default function AdminPanel() {
  const { user } = useAuth();
  const usersQuery = trpc.admin.users.list.useQuery();
  const toggleActive = trpc.admin.users.toggleActive.useMutation({ onSuccess: () => usersQuery.refetch() });

  const [showCreate, setShowCreate] = useState(false);
  const [resetUser, setResetUser] = useState<{ id: number; name: string } | null>(null);
  const [subUser, setSubUser] = useState<{ id: number; name: string; status: SubscriptionStatus } | null>(null);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Shield size={48} className="text-white/20" />
        <h2 className="text-lg font-black text-white/40">Acesso restrito</h2>
        <p className="text-xs text-white/20">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const users = usersQuery.data ?? [];

  const stats = [
    { label: "Total de Usuários",   value: users.length,                                              icon: <Users size={18} />,        color: "#60a5fa" },
    { label: "Assinaturas Ativas",  value: users.filter((u: any) => u.subscriptionStatus === "active").length,   icon: <CheckCircle size={18} />, color: "#4ade80" },
    { label: "Em Trial",            value: users.filter((u: any) => u.subscriptionStatus === "trial").length,    icon: <Clock size={18} />,      color: "#f59e0b" },
    { label: "Inativos",            value: users.filter((u: any) => u.subscriptionStatus === "inactive").length, icon: <XCircle size={18} />,    color: "#f87171" },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#050b18]"
            style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
          >
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white/90">Painel de Administração</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Gerencie usuários e assinaturas do Capital Prime Control</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#050b18] transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
        >
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="rounded-2xl p-4 flex items-center gap-3 border border-white/8"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderLeft: `3px solid ${s.color}`,
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/8"
              style={{ background: `${s.color}12`, color: s.color }}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-white/8 overflow-hidden"
        style={{ background: "linear-gradient(145deg, #070e20, #0c1524)" }}
      >
        <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: "#d4a017" }} />
          <h2 className="text-sm font-black text-white/90">Usuários Cadastrados</h2>
          <span className="ml-auto text-[10px] font-bold text-white/25 uppercase tracking-widest">{users.length} registro(s)</span>
        </div>

        {usersQuery.isLoading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-white/20">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#d4a017] animate-spin" />
            <p className="text-xs">Carregando usuários...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <Users size={40} className="text-white/10" />
            <p className="text-white/25 text-sm">Nenhum usuário cadastrado ainda.</p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm text-[#050b18]"
              style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
            >
              <Plus size={14} /> Criar primeiro usuário
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(212,160,23,0.04)" }}>
                  {["Usuário", "Perfil", "Assinatura", "Vencimento", "Status", "Ações"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/30">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => {
                  const sub = (u.subscriptionStatus ?? "trial") as SubscriptionStatus;
                  const { color, bg, label } = SUB_CONFIG[sub];
                  return (
                    <tr key={u.id}
                      className={`transition-colors ${!u.isActive ? "opacity-40" : ""}`}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      {/* Usuário */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-[#050b18] shrink-0"
                            style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                          >
                            {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white/80 text-sm">{u.name ?? "—"}</p>
                            <p className="text-[10px] text-white/30">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Perfil */}
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                          style={u.role === "admin"
                            ? { background: "rgba(212,160,23,0.12)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.25)" }
                            : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }
                          }
                        >
                          {u.role === "admin" && <Crown size={10} />}
                          {u.role === "admin" ? "Admin" : "Usuário"}
                        </span>
                      </td>

                      {/* Assinatura */}
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-[10px] font-bold"
                          style={{ background: bg, color, border: `1px solid ${color}30` }}
                        >
                          {label}
                        </span>
                      </td>

                      {/* Vencimento */}
                      <td className="px-5 py-3 text-white/40 text-xs">
                        {u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString("pt-BR") : "—"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                          style={u.isActive
                            ? { background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }
                            : { background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }
                          }
                        >
                          {u.isActive ? "Ativo" : "Bloqueado"}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSubUser({ id: u.id, name: u.name ?? u.email, status: sub })}
                            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors text-[#d4a017]/50 hover:text-[#d4a017] hover:border-[#d4a017]/30"
                            style={{ background: "rgba(212,160,23,0.06)", borderColor: "rgba(212,160,23,0.12)" }}
                            title="Gerenciar assinatura"
                          >
                            <Crown size={14} />
                          </button>
                          <button
                            onClick={() => setResetUser({ id: u.id, name: u.name ?? u.email })}
                            className="w-8 h-8 rounded-xl flex items-center justify-center border border-white/8 text-white/30 hover:text-white/70 hover:border-white/20 transition-colors"
                            style={{ background: "rgba(255,255,255,0.03)" }}
                            title="Resetar senha"
                          >
                            <Key size={14} />
                          </button>
                          <button
                            onClick={() => toggleActive.mutate({ userId: u.id, isActive: !u.isActive })}
                            disabled={u.id === user.id}
                            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors disabled:opacity-30"
                            style={u.isActive
                              ? { background: "rgba(248,113,113,0.06)", borderColor: "rgba(248,113,113,0.12)", color: "rgba(248,113,113,0.5)" }
                              : { background: "rgba(74,222,128,0.06)", borderColor: "rgba(74,222,128,0.12)", color: "rgba(74,222,128,0.5)" }
                            }
                            title={u.isActive ? "Bloquear" : "Desbloquear"}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.color = u.isActive ? "#f87171" : "#4ade80";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = u.isActive ? "rgba(248,113,113,0.5)" : "rgba(74,222,128,0.5)";
                            }}
                          >
                            {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
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

      {/* Modais */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onSuccess={() => usersQuery.refetch()} />}
      {resetUser && <ResetPasswordModal userId={resetUser.id} userName={resetUser.name} onClose={() => setResetUser(null)} />}
      {subUser && (
        <SubscriptionModal
          userId={subUser.id} userName={subUser.name} currentStatus={subUser.status}
          onClose={() => setSubUser(null)} onSuccess={() => usersQuery.refetch()}
        />
      )}
    </div>
  );
}
