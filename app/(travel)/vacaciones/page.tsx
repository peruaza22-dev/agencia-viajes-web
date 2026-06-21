'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/layout/PageBanner';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

const MOCK_PACKAGES = [
  { id: 1, img: '/img/t1.png', city: 'Madrid', name: 'Madrid City Break', nights: 3, price: 299, oldPrice: 399, rating: 4.8, reviews: 234, includes: ['Vuelo', 'Hotel 4★', 'Desayuno'] },
  { id: 2, img: '/img/t2.png', city: 'Barcelona', name: 'Barcelona Escapada', nights: 4, price: 349, oldPrice: 449, rating: 4.9, reviews: 512, includes: ['Vuelo', 'Hotel 4★', 'City Tour'] },
  { id: 3, img: '/img/t3.png', city: 'Sevilla', name: 'Sevilla Flamenca', nights: 3, price: 279, oldPrice: 359, rating: 4.7, reviews: 187, includes: ['Vuelo', 'Hotel 3★', 'Desayuno'] },
  { id: 4, img: '/img/t4.png', city: 'Valencia', name: 'Valencia Mar y Ciudad', nights: 5, price: 429, oldPrice: 549, rating: 4.8, reviews: 321, includes: ['Vuelo', 'Hotel 5★', 'Traslados'] },
  { id: 5, img: '/img/t1.png', city: 'Bilbao', name: 'Bilbao Arte y Gastronomía', nights: 2, price: 199, oldPrice: 249, rating: 4.6, reviews: 98, includes: ['Vuelo', 'Hotel 3★'] },
  { id: 6, img: '/img/t2.png', city: 'Granada', name: 'Granada y la Alhambra', nights: 4, price: 319, oldPrice: 399, rating: 4.9, reviews: 443, includes: ['Vuelo', 'Hotel 4★', 'Alhambra'] },
];

function getDefaultDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function normalizePackage(packageData: any, idx?: number) {
  const priceValue = Number(packageData.price ?? packageData.totalPrice?.amount ?? packageData.price?.amount ?? 0) || 0;

  return {
    id: String(
      packageData.id ?? packageData.packageId ?? packageData.hotel?.hotelId ?? (idx !== undefined ? `pkg-${idx}` : 'pkg-unknown')
    ),
    img: packageData.img || packageData.image || '/img/t1.png',
    title: packageData.name || packageData.city || packageData.hotel?.name || `${packageData.flight?.origin || 'ORIG'} → ${packageData.flight?.destination || 'DEST'}`,
    nights: packageData.nights ?? packageData.hotel?.rooms?.[0]?.nights ?? null,
    price: priceValue,
    oldPrice: Number(packageData.oldPrice ?? packageData.hotel?.price?.original ?? 0) || undefined,
    rating: Number(packageData.rating ?? packageData.hotel?.rating ?? 4.5),
    reviews: Number(packageData.reviews ?? 0),
    includes: packageData.includes ?? [
      packageData.flight ? `Vuelo ${packageData.flight.origin || ''} → ${packageData.flight.destination || ''}` : 'Vuelo incluido',
      packageData.hotel?.name ? `Hotel ${packageData.hotel.name}` : 'Hotel incluido'
    ],
    city: packageData.city || packageData.hotel?.city || packageData.flight?.destination || '',
  };
}

export default function VacacionesPage() {
  const [packages, setPackages] = useState<any[]>(MOCK_PACKAGES);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('price');
  const [origin, setOrigin] = useState('MAD');
  const [destination, setDestination] = useState('BCN');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [error, setError] = useState('');

  const loadPackages = async (overrides: any = {}) => {
    setLoading(true);
    setError('');

    try {
      const paramsObj: any = {
        origin: overrides.origin ?? origin,
        destination: overrides.destination ?? destination,
        departureDate: overrides.departureDate ?? departureDate,
        returnDate: overrides.returnDate ?? returnDate,
        checkIn: overrides.checkIn ?? checkIn,
        checkOut: overrides.checkOut ?? checkOut,
        adults: String(overrides.adults ?? adults),
      };

      const params = new URLSearchParams(paramsObj);

      const res = await fetch(`${API}/packages/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data.packages) ? data.packages : [];

      if (list.length > 0) {
        setPackages(list);
      } else {
        setPackages([]);
      }
    } catch (fetchError) {
      console.warn('Error cargando paquetes reales:', fetchError);
      setError('No se pudo obtener paquetes reales, se muestran ejemplos de respaldo.');
      setPackages(MOCK_PACKAGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const d = getDefaultDate(7);
    const r = getDefaultDate(14);
    const ci = d;
    const co = r;
    setDepartureDate(d);
    setReturnDate(r);
    setCheckIn(ci);
    setCheckOut(co);
    // load with explicit dates to avoid hydration mismatch
    loadPackages({ departureDate: d, returnDate: r, checkIn: ci, checkOut: co });
  }, []);

  const packageItems = packages.map((p: any, i: number) => normalizePackage(p, i));

  const sorted = [...packageItems].sort((a, b) =>
    sortBy === 'price' ? a.price - b.price :
    sortBy === 'rating' ? b.rating - a.rating :
    (a.nights ?? 0) - (b.nights ?? 0)
  );

  return (
    <>
      <PageBanner
        title="Paquetes Vacacionales"
        subtitle="Vuelo, hotel y actividades incluidas al mejor precio"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Vacaciones' }]}
      />

      <div style={{ background: '#f5f5f5', padding: '16px 0', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Origen</div>
            <input value={origin} onChange={(e) => setOrigin(e.target.value.toUpperCase())} placeholder="MAD"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary w-24 font-mono" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Destino</div>
            <input value={destination} onChange={(e) => setDestination(e.target.value.toUpperCase())} placeholder="BCN"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary w-24 font-mono" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Salida</div>
            <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Regreso</div>
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Check-in</div>
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Check-out</div>
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Adultos</div>
            <select value={adults} onChange={(e) => setAdults(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary">
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button onClick={loadPackages} className="bg-primary text-white px-6 py-2 rounded font-bold text-sm hover:bg-primary-dark transition-colors">
            <i className="fa fa-search mr-2" />Buscar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {loading ? 'Buscando paquetes...' : `${sorted.length} paquetes disponibles`}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Ordenar:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none">
              <option value="price">Precio</option>
              <option value="rating">Valoración</option>
              <option value="nights">Noches</option>
            </select>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-yellow-700 bg-yellow-100 border border-yellow-200 rounded p-3">{error}</div>}

        {!loading && sorted.length === 0 && (
          <div className="border border-gray-200 rounded-xl p-6 text-center text-gray-500">
            No se encontraron paquetes para los filtros actuales.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((p) => (
            <div key={p.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative">
                <ImageWithFallback
                  src={p.img}
                  alt={p.title}
                  className="w-full h-48 object-cover"
                />
                {p.oldPrice && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {Math.round((1 - p.price / p.oldPrice) * 100)}% dto
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-primary text-lg mb-1">{p.title}</h3>
                {p.nights && <p className="text-xs text-gray-400 mb-3"><i className="fa fa-moon mr-1" />{p.nights} noches</p>}
                {p.includes?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.includes.map((inc: string) => (
                      <span key={inc} className="border border-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-600">
                        <i className="fa fa-check mr-1 text-primary text-xs" />{inc}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-end justify-between">
                  <div>
                    {p.oldPrice && <div className="text-xs text-gray-400 line-through">{p.oldPrice}€</div>}
                    <div className="text-2xl font-black text-primary font-poppins">{p.price}€</div>
                    <div className="text-xs text-gray-400">por persona</div>
                  </div>
                  <Link
                    href={`/vacaciones/${p.id}`}
                    className="bg-red-500 hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Ver Paquete
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
