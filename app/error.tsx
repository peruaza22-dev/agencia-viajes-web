'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      <i
        className="fa fa-exclamation-triangle"
        style={{ fontSize: 48, color: '#ee1d25', display: 'block', marginBottom: 16 }}
      />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#003580', marginBottom: 8 }}>
        Algo salió mal
      </h2>
      <p style={{ color: '#888', marginBottom: 20, maxWidth: 400 }}>
        Ocurrió un error inesperado. Por favor intenta de nuevo.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#003580',
          color: '#fff',
          border: 'none',
          padding: '10px 24px',
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
