import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { getDestinations } from '@/lib/api';
import PageBanner from '@/components/layout/PageBanner';

export const metadata: Metadata = buildMetadata({
  title: 'Destinos',
  description: 'Explora nuestros destinos favoritos en todo el mundo. Vuelos, hoteles y paquetes a los mejores precios.',
  path: '/destinos',
});

// SSG — regenera solo en build
export const dynamic = 'force-static';

export default async function DestinosPage() {
  const destinations = await getDestinations();

  return (
    <>
      <PageBanner
        title="Destinos"
        subtitle="Explora nuestros destinos favoritos en todo el mundo"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Destinos' }]}
      />

      <section className="py-14">
        <div className="container mx-auto px-4">
          {destinations.length === 0 ? (
            <div className="text-center py-20">
              <i className="fa fa-map-marker" style={{ fontSize: 48, color: '#e5e5e5', display: 'block', marginBottom: 16 }} />
              <h2 className="text-xl font-bold text-gray-400">Próximamente nuevos destinos</h2>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {destinations.map((dest) => (
                <div key={dest.id} className="group relative rounded-xl overflow-hidden shadow hover:shadow-xl transition-all duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dest.image || '/img/banner.jpg'}
                    alt={dest.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/img/banner.jpg'; }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-bold text-base">{dest.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
