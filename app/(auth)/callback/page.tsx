'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticate } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // OAuth session should be in the URL fragment: #access_token=...
        const hash = window.location.hash;
        if (!hash) {
          setError('No se recibió token de autenticación');
          setLoading(false);
          return;
        }

        // Parse hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const email = params.get('user') ? JSON.parse(decodeURIComponent(params.get('user')!)).email : null;

        if (!accessToken || !email) {
          setError('Información de autenticación incompleta');
          setLoading(false);
          return;
        }

        // Fetch user profile from backend
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          setError('No se pudo obtener el perfil del usuario');
          setLoading(false);
          return;
        }

        const data = await res.json();
        const userData = data.data?.user || data.user;

        // Authenticate user
        const authResult = await authenticate(accessToken, userData);
        if (!authResult.success) {
          setError(authResult.error || 'Error al autenticar');
          setLoading(false);
          return;
        }

        // Redirect to dashboard or original page
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setError(msg);
        setLoading(false);
      }
    };

    handleCallback();
  }, [authenticate, router, searchParams]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      {loading ? (
        <>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #003580', borderTop: '4px solid #e5e5e5', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 14, color: '#64748b' }}>Iniciando sesión...</p>
        </>
      ) : error ? (
        <>
          <div style={{ width: 56, height: 56, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: 24, color: '#dc2626' }} />
          </div>
          <p style={{ fontSize: 14, color: '#dc2626', textAlign: 'center' }}>{error}</p>
          <a href="/login" style={{ color: '#003580', fontSize: 13, textDecoration: 'underline' }}>Volver al login</a>
        </>
      ) : null}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
