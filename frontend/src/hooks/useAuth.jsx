import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getStoredAuth, loginRequest, setStoredAuth } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());

  const login = useCallback(async (username, password) => {
    const data = await loginRequest({ username, password });
    const session = {
      access: data.access,
      refresh: data.refresh,
      user: data.user,
    };
    setStoredAuth(session);
    setAuth(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    setStoredAuth(null);
    setAuth(null);
  }, []);

  const value = useMemo(
    () => ({
      user: auth?.user || null,
      token: auth?.access || null,
      isAuthenticated: Boolean(auth?.access && auth?.user),
      isAdmin: auth?.user?.rol === "admin",
      isMeseraOrAdmin:
        auth?.user?.rol === "admin" || auth?.user?.rol === "mesera",
      login,
      logout,
    }),
    [auth, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
