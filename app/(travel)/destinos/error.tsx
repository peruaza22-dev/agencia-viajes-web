'use client';

import { useEffect } from 'react';

export default function DestinosError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DestinosError]', error);
  }, [error]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: 28, marginBottom: 12, color: '#003580' }}>Error en Destinos</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>No se pudieron cargar los destinos. Intenta de nuevo.</p>
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
