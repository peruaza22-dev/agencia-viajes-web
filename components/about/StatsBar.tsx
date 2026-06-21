const DEFAULT_STATS = [
  { icon: 'fa-users', value: '500K+', label: 'Clientes Satisfechos' },
  { icon: 'fa-globe', value: '150+', label: 'Destinos' },
  { icon: 'fa-trophy', value: '15', label: 'Años de Experiencia' },
  { icon: 'fa-headphones', value: '24/7', label: 'Soporte al Cliente' },
];

interface Stat { icon: string; value: string; label: string }

export default function StatsBar({ stats = DEFAULT_STATS }: { stats?: Stat[] }) {
  return (
    <section style={{ padding: '48px 0', background: '#f6f6f6' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {stats.map(({ icon, value, label }, i) => (
            <div key={i} style={{ flex: '1', minWidth: 180, textAlign: 'center', padding: 16 }}>
              <i className={`fa ${icon}`} style={{ fontSize: 32, color: 'rgba(0,53,128,0.4)', display: 'block', marginBottom: 8 }} />
              <div style={{ fontSize: 36, fontWeight: 800, color: '#003580', fontFamily: 'Poppins,sans-serif' }}>{value}</div>
              <div style={{ color: '#888', fontSize: 14, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
