import SectionHeading from '@/components/ui/SectionHeading';

const DEFAULT_ITEMS = [
  { icon: 'fa-user-circle', title: 'Agentes Profesionales', desc: 'Nuestro equipo de expertos dedica cada viaje a crear el itinerario perfecto para ti.' },
  { icon: 'fa-shield', title: 'Control de Calidad', desc: 'Garantizamos la más alta calidad en todos nuestros servicios, desde vuelos hasta hoteles.' },
  { icon: 'fa-clock-o', title: 'Soporte 24/7', desc: 'Estamos disponibles para ti en cualquier momento del día o de la noche.' },
  { icon: 'fa-lock', title: 'Pago Seguro', desc: 'Tus transacciones están protegidas con los más altos estándares de seguridad bancaria.' },
  { icon: 'fa-star', title: 'Mejor Precio', desc: 'Te garantizamos los mejores precios del mercado. Si encuentras uno mejor, lo igualamos.' },
  { icon: 'fa-globe', title: 'Destinos Globales', desc: 'Acceso a más de 500 destinos en todo el mundo con ofertas exclusivas y paquetes personalizados.' },
];

interface Item { icon: string; title: string; desc: string }

export default function WhyUsGrid({
  items = DEFAULT_ITEMS,
  title = 'Descubre por qué la gente nos elige',
  subtitle = 'Ayudamos a las personas a encontrar grandes experiencias a un precio razonable',
}: {
  items?: Item[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section style={{ padding: '56px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <SectionHeading title={title} subtitle={subtitle} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 32 }}>
          {items.map(({ icon, title: t, desc }, i) => (
            <div key={i} style={{ flex: '0 0 calc(33.333% - 11px)', minWidth: 220, textAlign: 'center', padding: 24, border: '1px solid #f0f0f0', borderRadius: 12, transition: 'all .2s' }}>
              <div style={{ width: 64, height: 64, background: 'rgba(0,53,128,.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className={`fa ${icon}`} style={{ fontSize: 28, color: '#003580' }} />
              </div>
              <h2 style={{ fontWeight: 700, color: '#343a40', fontFamily: 'Poppins,sans-serif', marginBottom: 8, fontSize: 15 }}>{t}</h2>
              <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
