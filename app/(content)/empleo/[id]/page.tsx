import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/metadata';
import { getJobs, getJob } from '@/lib/api';
import PageBanner from '@/components/layout/PageBanner';

export async function generateStaticParams() {
  const jobs = await getJobs();
  return jobs.map((j) => ({ id: String(j.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const job = await getJob(params.id);
  if (!job) return buildMetadata({ title: 'Empleo no encontrado', description: '', path: '/empleo' });

  return buildMetadata({
    title: `${job.title} — ${job.department}`,
    description: `Oferta de trabajo: ${job.title} en ${job.location}. ${job.description?.slice(0, 120) ?? ''}`,
    path: `/empleo/${params.id}`,
  });
}

export default async function EmpleoDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job) notFound();

  return (
    <>
      <PageBanner
        title={job.title}
        subtitle={`${job.department} · ${job.location}`}
        breadcrumbs={[
          { to: '/', icon: 'fa-home', label: 'Inicio' },
          { to: '/empleo', label: 'Empleo' },
          { label: job.title },
        ]}
      />
      <section className="py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-xl shadow p-8">
            <h1 className="text-2xl font-bold font-poppins text-gray-800 mb-2">{job.title}</h1>
            <p className="text-primary font-semibold mb-6">{job.department} · {job.location}</p>

            <h2 className="text-lg font-bold text-gray-700 mb-3">Descripción del puesto</h2>
            <div className="text-gray-600 leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: job.description }} />

            {job.requirements && (
              <>
                <h2 className="text-lg font-bold text-gray-700 mb-3">Requisitos</h2>
                <div className="text-gray-600 leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: job.requirements }} />
              </>
            )}

            <a
              href={`mailto:rrhh@agencia.com?subject=Candidatura: ${encodeURIComponent(job.title)}`}
              className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors"
            >
              <i className="fa fa-paper-plane mr-2" />Enviar Candidatura
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
