'use client';

import { useEffect } from 'react';

export default function HotelesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[HotelesError]', error);
  }, [error]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: 28, marginBottom: 12, color: '#003580' }}>Error en Hoteles</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>Lo sentimos, hubo un problema cargando los hoteles.</p>
        <button
          onClick={reset}
          style={{ background: '#003580', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
