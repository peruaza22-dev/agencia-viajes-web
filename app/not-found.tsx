import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        textAlign: 'center',
        background: '#f8f9fa',
      }}
    >
      <i
        className="fa fa-exclamation-triangle"
        style={{ fontSize: 64, color: '#ee1d25', display: 'block', marginBottom: 20 }}
      />
      <h1
        style={{ fontSize: 80, fontWeight: 900, color: '#003580', fontFamily: 'Poppins,sans-serif', lineHeight: 1, marginBottom: 8 }}
      >
        404
      </h1>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#343a40', marginBottom: 12 }}>
        Página no encontrada
      </h2>
      <p style={{ color: '#888', fontSize: 15, maxWidth: 400, marginBottom: 28 }}>
        La página que buscas no existe o ha sido movida. Verifica la URL o vuelve al inicio.
      </p>
      <Link
        href="/"
        style={{ display: 'inline-block', background: '#003580', color: '#fff', padding: '12px 32px', borderRadius: 4, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
      >
        <i className="fa fa-home" style={{ marginRight: 8 }} />
        Volver al Inicio
      </Link>
    </div>
  );
}
