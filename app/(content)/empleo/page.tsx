import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';
import { getJobs } from '@/lib/api';
import PageBanner from '@/components/layout/PageBanner';

export const metadata: Metadata = buildMetadata({
  title: 'Empleo — Trabaja con Nosotros',
  description: 'Únete a nuestro equipo. Consulta las ofertas de trabajo disponibles en nuestra agencia de viajes.',
  path: '/empleo',
});

export const dynamic = 'force-static';

export default async function EmpleoPage() {
  const jobs = await getJobs();

  return (
    <>
      <PageBanner
        title="Trabaja con Nosotros"
        subtitle="Forma parte de nuestro equipo apasionado por los viajes"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Empleo' }]}
      />

      <section className="py-14">
        <div className="container mx-auto px-4">
          {jobs.length === 0 ? (
            <div className="text-center py-20">
              <i className="fa fa-briefcase" style={{ fontSize: 48, color: '#e5e5e5', display: 'block', marginBottom: 16 }} />
              <h2 className="text-xl font-bold text-gray-400">No hay ofertas disponibles actualmente</h2>
              <p className="text-gray-500 mt-2">Vuelve pronto para nuevas oportunidades</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {jobs.map((job) => (
                <Link key={job.id} href={`/empleo/${job.id}`} className="bg-white rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300 p-6 block">
                  <h2 className="font-bold text-gray-800 text-lg mb-2">{job.title}</h2>
                  <p className="text-primary text-sm font-semibold mb-3">{job.department}</p>
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <span><i className="fa fa-map-marker mr-1" />{job.location}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
