'use client';

import { useState } from 'react';
import Link from 'next/link';

const MOCK_HOTEL = {
  name: 'Hotel Gran Madrid 5 estrellas',
  location: 'Gran Vía 28, Centro, Madrid',
  rating: 9.2,
  reviews: 1240,
  price: 189,
  image: '/img/about-01.jpg',
  description: 'Hotel de lujo en el corazón de Madrid con vistas espectaculares.',
  amenities: ['WiFi Gratis', 'Piscina', 'Spa', 'Restaurante', 'Parking', 'Gimnasio'],
};

interface Hotel {
  id?: string;
  name: string;
  location?: string;
  rating?: number;
  reviews?: number;
  price?: number;
  image?: string;
  description?: string;
  amenities?: string[];
  address?: string;
}

export default function HotelDetailClient({
  id,
  initialHotel,
}: {
  id: string;
  initialHotel: Hotel | null;
}) {
  const hotel = initialHotel ?? MOCK_HOTEL;
  const [guests, setGuests] = useState(2);
  const [fav, setFav] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-primary">Inicio</Link> /
        <Link href="/hoteles" className="hover:text-primary mx-1">Hoteles</Link> /
        <span className="text-gray-700 font-medium ml-1">{hotel.name}</span>
      </nav>

      {/* Título */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins text-gray-800">{hotel.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            <i className="fa fa-map-marker mr-1" />
            {hotel.location ?? hotel.address ?? 'Madrid, España'}
          </p>
        </div>
        <button
          onClick={() => setFav((f) => !f)}
          className={`flex items-center gap-1.5 border px-3 py-2 rounded-lg text-sm transition-colors ${fav ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-200 text-gray-500 hover:border-red-300'}`}
        >
          <i className="fa fa-heart" /> {fav ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2">
          {/* Imagen */}
          <div className="rounded-2xl overflow-hidden mb-6 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hotel.image ?? '/img/about-01.jpg'}
              alt={hotel.name}
              className="w-full h-72 md:h-96 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/img/about-01.jpg'; }}
            />
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="text-4xl font-black text-primary font-poppins">{hotel.rating ?? '4.5'}</div>
            <div>
              <div className="font-bold text-gray-800">Excelente</div>
              <div className="text-xs text-gray-500 mt-1">{(hotel.reviews ?? 0).toLocaleString()} opiniones verificadas</div>
            </div>
          </div>

          {/* Descripción */}
          {hotel.description && (
            <div className="mb-6">
              <h2 className="text-xl font-bold font-poppins text-gray-800 mb-3">Sobre el hotel</h2>
              <p className="text-gray-600 leading-relaxed">{hotel.description}</p>
            </div>
          )}

          {/* Servicios */}
          <div className="mb-8">
            <h2 className="text-xl font-bold font-poppins text-gray-800 mb-4">Servicios e instalaciones</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(hotel.amenities ?? MOCK_HOTEL.amenities).map((a) => (
                <div key={a} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 text-sm text-gray-700">
                  <i className="fa fa-check text-primary" /> {a}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar reserva */}
        <div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-4 shadow-sm">
            <div className="flex items-baseline justify-between mb-4">
              <div className="text-3xl font-bold text-primary font-poppins">{hotel.price ?? 189}€</div>
              <span className="text-sm text-gray-400">por noche</span>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500 uppercase block mb-1">Huéspedes</label>
              <select
                value={guests}
                onChange={(e) => setGuests(+e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} huésped{n > 1 ? 'es' : ''}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-xs text-green-700">
              <i className="fa fa-shield" /> Cancelación gratuita hasta 48h antes
            </div>
            <Link
              href={`/hoteles/${id}/checkout`}
              className="block w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl text-center text-sm transition-colors"
            >
              <i className="fa fa-lock mr-2" />Reservar ahora
            </Link>
            <p className="text-center text-xs text-gray-400 mt-2">No se te cobrará nada aún</p>
          </div>
        </div>
      </div>
    </div>
  );
}
