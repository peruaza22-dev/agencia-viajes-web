import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Próximamente',
  description: 'Estamos trabajando en algo increíble. Vuelve pronto.',
  path: '/coming-soon',
  noIndex: true,
});

export default function ComingSoonPage() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 16px',
        background: '#003580',
        textAlign: 'center',
      }}
    >
      <div>
        <i
          className="fa fa-clock-o"
          style={{ fontSize: 64, color: 'rgba(255,255,255,.3)', display: 'block', marginBottom: 20 }}
        />
        <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', fontFamily: 'Poppins,sans-serif', marginBottom: 12 }}>
          Próximamente
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', maxWidth: 440, margin: '0 auto 28px' }}>
          Estamos trabajando en algo increíble. Vuelve pronto.
        </p>
        <Link
          href="/"
          style={{ display: 'inline-block', background: '#ee1d25', color: '#fff', padding: '10px 28px', borderRadius: 4, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          <i className="fa fa-home" style={{ marginRight: 6 }} />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
