import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_TOKEN_KEY = "sandeep_neon_auth_token";
const AUTH_USER_KEY = "sandeep_neon_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing session on mount
  useEffect(() => {
    let active = true;
    const storedToken = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    const storedUser = typeof window !== "undefined" ? localStorage.getItem(AUTH_USER_KEY) : null;

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Ignore
      }
    }

    // Verify session with server-side Neon Auth
    fetch("/api/auth/session", {
      headers: {
        Authorization: `Bearer ${storedToken}`
      }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data && data.valid && data.user) {
          setUser(data.user);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        } else {
          // Token invalid or expired
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_KEY);
          setUser(null);
          setToken(null);
        }
      })
      .catch(() => {
        // Offline or dev fallback: if stored user exists, keep it
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || "Authentication failed" };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // Ignore network errors
      }
    }
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
    setToken(null);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState<string>("sandeep.gautam@opportunity-os.local");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-canvas)",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-sans)",
          fontSize: "14px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ animation: "spin 1s linear infinite" }}>🔄</span>
          <span>Verifying Neon Auth session...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || "Invalid administrator credentials");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await login("sandeep.gautam@opportunity-os.local", "sandeep2026!");
      if (!res.success) {
        setError(res.error || "Quick authorization failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-canvas)",
        padding: "24px",
        fontFamily: "var(--font-sans)"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "var(--radius-lg, 12px)",
          padding: "36px 32px",
          boxShadow: "var(--shadow-md)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "16px"
            }}
          >
            S
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
            Sandeep Opportunity OS
          </span>
        </div>

        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
          Enterprise Control Center
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "24px", lineHeight: 1.5 }}>
          Authorized administrator access required. Opportunities, notes, and AI agent controls are guarded by Neon Auth (Lakebase PostgreSQL).
        </p>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--status-danger-bg)",
              border: "1px solid var(--status-danger-border)",
              borderRadius: "var(--radius-sm, 6px)",
              color: "var(--status-danger-fg)",
              fontSize: "12.5px",
              marginBottom: "18px"
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label
              htmlFor="auth-email"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px"
              }}
            >
              Administrator Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "9px 12px",
                background: "var(--bg-canvas)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm, 6px)",
                color: "var(--text-primary)",
                fontSize: "13.5px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "6px"
              }}
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                padding: "9px 12px",
                background: "var(--bg-canvas)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm, 6px)",
                color: "var(--text-primary)",
                fontSize: "13.5px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "13.5px",
              fontWeight: 600,
              marginTop: "6px",
              cursor: submitting ? "not-allowed" : "pointer"
            }}
          >
            {submitting ? "Signing in..." : "Sign In to Control Center"}
          </button>
        </form>

        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
          <button
            type="button"
            onClick={handleQuickAdminLogin}
            disabled={submitting}
            className="btn-secondary"
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <span>⚡</span>
            <span>One-Click Admin Login (Sandeep Gautam)</span>
          </button>
        </div>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "11px",
            color: "var(--text-muted)"
          }}
        >
          <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
          <span>Secured by Neon Auth · Lakebase PostgreSQL</span>
        </div>
      </div>
    </div>
  );
};
