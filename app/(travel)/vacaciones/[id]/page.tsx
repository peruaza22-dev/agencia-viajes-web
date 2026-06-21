import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';
import { getPackages, getPackage } from '@/lib/api';
import VacacionesDetailClient from './VacacionesDetailClient';

// ISR — revalida cada 1 hora
export const revalidate = 3600;

export async function generateStaticParams() {
  const pkgs = await getPackages();
  return pkgs.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const pkg = await getPackage(params.id);
  if (!pkg) return buildMetadata({ title: 'Paquete no encontrado', description: '', path: '/vacaciones' });

  return buildMetadata({
    title: pkg.name,
    description: pkg.short_description?.slice(0, 160) || `Paquete vacacional: ${pkg.name}. Vuelo + hotel incluido.`,
    image: pkg.main_image,
    path: `/vacaciones/${params.id}`,
  });
}

export default async function VacacionesDetailPage({ params }: { params: { id: string } }) {
  const pkg = await getPackage(params.id);
  return <VacacionesDetailClient id={params.id} initialPkg={pkg} />;
}
