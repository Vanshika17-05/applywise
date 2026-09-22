import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "applywise_session";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  });
  const [checking, setChecking] = useState(Boolean(session));

  useEffect(() => {
    if (!session?.token) return;
    let active = true;
    api("/auth/me", { token: session.token })
      .then(({ user }) => { if (active) setSession((current) => current?.token === session.token ? { ...current, user } : current); })
      .catch(() => { if (active) { localStorage.removeItem(STORAGE_KEY); setSession(null); } })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [session?.token]);

  async function authenticate(mode, values) {
    const data = await api(`/auth/${mode}`, { method: "POST", body: values });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSession(data);
    setChecking(false);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  function updateUser(user) {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, user };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return <AuthContext.Provider value={{ session, checking, authenticate, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
