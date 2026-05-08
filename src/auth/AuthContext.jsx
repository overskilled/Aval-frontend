import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const me = await api.me();
      setUser(me);
      return me;
    } catch {
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /**
   * Step 1 of login. If the response has `requiresOtp`, no token is set —
   * caller must navigate to /login-verify and complete `verifyLoginOtp`.
   */
  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    if (res.requiresOtp) {
      return { requiresOtp: true, email: res.email };
    }
    setToken(res.token);
    setUser(res.user);
    return { requiresOtp: false, user: res.user };
  }, []);

  /** Step 2 of login: complete with the email OTP. */
  const verifyLoginOtp = useCallback(async (email, code) => {
    const res = await api.verifyLoginOtp({ email, code });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.register(payload);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, verifyLoginOtp, register, logout, refresh, setUser }),
    [user, loading, login, verifyLoginOtp, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
