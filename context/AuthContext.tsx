'use client';

/**
 * AuthContext — Next.js version
 * - Token guardado en localStorage + cookie HttpOnly para que el middleware pueda leerlo
 * - Interfaz pública idéntica al proyecto Vite (sin cambios en consumidores)
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { User, AuthResponse } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<AuthResponse>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  forgotPassword: (
    email: string
  ) => Promise<{ success: boolean; message?: string }>;
  authenticate: (token: string, user: User) => Promise<AuthResponse>;
  authFetch: <T>(path: string, opts?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ta_token') || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurar sesión al arrancar — leer de sessionStorage (más seguro que localStorage)
  useEffect(() => {
    const saved = sessionStorage.getItem('ta_user');
    const savedToken = sessionStorage.getItem('ta_token');
    if (saved && savedToken) {
      try {
        setUser(JSON.parse(saved) as User);
      } catch {
        /* silencioso */
      }
    }
    setLoading(false);
  }, []);

  /**
   * Guarda el token en sessionStorage (sesión actual) y en cookie para el middleware.
   * La cookie se setea con SameSite=Strict para proteger contra CSRF.
   * NOTA: La cookie no puede ser HttpOnly porque la seteamos desde JS.
   * Para máxima seguridad, el backend debería setear la cookie en el login response.
   * El token en sessionStorage (vs localStorage) se borra al cerrar el tab.
   */
  const persistToken = (t: string) => {
    sessionStorage.setItem('ta_token', t);
    // Cookie para el middleware Next.js (no puede ser HttpOnly desde JS)
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `ta_token=${t}; path=/; SameSite=Strict; Max-Age=86400${isSecure ? '; Secure' : ''}`;
  };

  /** Elimina el token de sessionStorage y cookie */
  const clearToken = () => {
    sessionStorage.removeItem('ta_token');
    sessionStorage.removeItem('ta_user');
    document.cookie = 'ta_token=; path=/; Max-Age=0; SameSite=Strict';
  };

  const login = useCallback(
    async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }): Promise<AuthResponse> => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        const data = await r.json();

        if (!r.ok) {
          const errMsg =
            typeof data.error === 'string'
              ? data.error
              : data.message || 'Error al iniciar sesión';
          throw new Error(errMsg);
        }

        const accessToken =
          data.token ||
          data.access_token ||
          data.data?.token ||
          data.data?.access_token ||
          data.session?.access_token ||
          '';
        const userData = data.data?.user || data.user || data;

        setUser(userData);
        setToken(accessToken);
        sessionStorage.setItem('ta_user', JSON.stringify(userData));
        persistToken(accessToken); // ✅ guarda en sessionStorage + cookie

        return { success: true, user: userData };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const authenticate = useCallback(
    async (accessToken: string, userData: User): Promise<AuthResponse> => {
      setLoading(true);
      setError(null);
      try {
        setUser(userData);
        setToken(accessToken);
        sessionStorage.setItem('ta_user', JSON.stringify(userData));
        persistToken(accessToken);
        return { success: true, user: userData };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al autenticar';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signup = useCallback(
    async ({
      firstName,
      lastName,
      email,
      password,
      phone,
    }: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone?: string;
    }): Promise<AuthResponse> => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: firstName,
            firstName,
            lastName,
            email,
            password,
            phone,
          }),
        });
        const data = await r.json();

        if (!r.ok) {
          const errMsg =
            typeof data.error === 'string'
              ? data.error
              : data.message || 'Error al registrarse';
          throw new Error(errMsg);
        }

        return {
          success: true,
          message: 'Usuario registrado. Revisa tu email para confirmar.',
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al registrarse';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      /* silencioso */
    }
    setUser(null);
    setToken(null);
    clearToken(); // ✅ limpia localStorage + cookie
  }, [token]);

  const forgotPassword = useCallback(
    async (
      email: string
    ): Promise<{ success: boolean; message?: string }> => {
      const r = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return r.json();
    },
    []
  );

  const authFetch = useCallback(
    async <T,>(path: string, opts: RequestInit = {}): Promise<T> => {
      const r = await fetch(`${API}${path}`, {
        ...opts,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(opts.headers || {}),
        },
      });
      const data = (await r.json()) as T & { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      return data;
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isLoggedIn: !!user && !!token,
        login,
        authenticate,
        signup,
        logout,
        forgotPassword,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
