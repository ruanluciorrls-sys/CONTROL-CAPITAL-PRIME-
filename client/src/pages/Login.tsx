import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-card">
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 3L33 12V24L18 33L3 24V12L18 3Z" fill="url(#hexGrad)" />
              <path d="M18 10L26 15V21L18 26L10 21V15L18 10Z" fill="rgba(255,255,255,0.2)" />
              <path d="M18 13L14 18L18 23L22 18L18 13Z" fill="white" />
              <defs>
                <linearGradient id="hexGrad" x1="3" y1="3" x2="33" y2="33">
                  <stop offset="0%" stopColor="#1a3a8f" />
                  <stop offset="100%" stopColor="#d4a017" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="login-title">CAPITAL PRIME</h1>
            <p className="login-subtitle">CONTROL</p>
          </div>
        </div>

        <p className="login-desc">Acesse sua conta para continuar</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-email" className="login-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="login-input"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-label">Senha</label>
            <input
              id="login-password"
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <button
            id="login-submit"
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-btn-loading">
                <span className="login-spinner" />
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="login-footer">
          Capital Prime Control © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
