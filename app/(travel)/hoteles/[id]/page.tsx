import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';
import { getHotel } from '@/lib/api';
import HotelDetailClient from './HotelDetailClient';

// ISR — revalida cada 1 hora
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const hotel = await getHotel(params.id);
  if (!hotel) return buildMetadata({ title: 'Hotel no encontrado', description: '', path: '/hoteles' });

  return buildMetadata({
    title: hotel.name,
    description: hotel.description?.slice(0, 160) || `Reserva ${hotel.name}. Consulta disponibilidad, precios y servicios.`,
    image: hotel.image,
    path: `/hoteles/${params.id}`,
  });
}

export default async function HotelDetailPage({ params }: { params: { id: string } }) {
  const hotel = await getHotel(params.id);

  // Si no hay datos en la API usamos el cliente con mock
  return (
    <HotelDetailClient id={params.id} initialHotel={hotel} />
  );
}
