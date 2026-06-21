import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'En Mantenimiento',
  description: 'El sitio está temporalmente en mantenimiento. Volvemos enseguida.',
  path: '/mantenimiento',
  noIndex: true,
});

export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#003580',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div>
        <i
          className="fa fa-wrench"
          style={{ fontSize: 80, color: 'rgba(255,255,255,.3)', display: 'block', marginBottom: 20 }}
        />
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: 'Poppins,sans-serif', marginBottom: 10 }}>
          En Mantenimiento
        </h1>
        <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 15 }}>
          Volvemos enseguida. Disculpa las molestias.
        </p>
      </div>
    </div>
  );
}
