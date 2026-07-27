import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest, register as registerRequest } from "../api/auth";
import { UNAUTHORIZED_EVENT } from "../api/client";
import type { JwtPayload, RegisterPayload } from "../types";
import { decodeJwt } from "./jwt";
import { clearToken, getToken, setToken as persistToken } from "./token";

interface AuthContextValue {
  token: string | null;
  user: JwtPayload | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getToken());

  const user = useMemo(
    () => (token ? decodeJwt<JwtPayload>(token) : null),
    [token],
  );

  useEffect(() => {
    function handleUnauthorized() {
      setToken(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  async function login(email: string, password: string) {
    const result = await loginRequest(email, password);
    persistToken(result.accessToken);
    setToken(result.accessToken);
  }

  async function register(payload: RegisterPayload) {
    await registerRequest(payload);
    await login(payload.contactEmail, payload.adminPassword);
  }

  function logout() {
    clearToken();
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
