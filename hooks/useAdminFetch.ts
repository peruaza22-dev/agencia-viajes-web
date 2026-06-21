// Hook reutilizable para fetch autenticado al backend admin (Next.js version)
import { useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

export function useAdminFetch() {
  const adminFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token =
      (typeof window !== 'undefined' && localStorage.getItem('ta_token')) ||
      (typeof window !== 'undefined' && localStorage.getItem('sb-access-token')) ||
      '';
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }, []);

  return { adminFetch, API };
}
