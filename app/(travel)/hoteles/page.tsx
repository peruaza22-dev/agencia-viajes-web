'use client';

/**
 * /hoteles — Client Component con ISR seed
 * El listado base se genera en servidor (ISR 1h), la búsqueda interactiva
 * se realiza en el cliente.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageBanner from '@/components/layout/PageBanner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

const MOCK = [
  { id: 1, name: 'Hotel Gran Madrid', stars: 5, rating: 9.2, reviews: 1240, price: 189, img: '/img/about-02.jpg', location: 'Centro, Madrid', amenities: ['WiFi', 'Piscina', 'Spa', 'Restaurante'], badge: 'Más Vendido' },
  { id: 2, name: 'Apartamentos Sol', stars: 3, rating: 8.5, reviews: 876, price: 75, img: '/img/about-03.jpg', location: 'Barrio Letras, Madrid', amenities: ['WiFi', 'Cocina', 'AC'], badge: null },
  { id: 3, name: 'Hotel Boutique Retiro', stars: 4, rating: 8.9, reviews: 520, price: 129, img: '/img/about-04.jpg', location: 'Retiro, Madrid', amenities: ['WiFi', 'Desayuno', 'Parking'], badge: 'Oferta' },
  { id: 4, name: 'Hostal Madrid Centro', stars: 2, rating: 7.8, reviews: 312, price: 48, img: '/img/about-02.jpg', location: 'Gran Vía, Madrid', amenities: ['WiFi', 'AC'], badge: null },
  { id: 5, name: 'Meliá Castilla', stars: 5, rating: 9.0, reviews: 2100, price: 219, img: '/img/about-03.jpg', location: 'Chamartín, Madrid', amenities: ['WiFi', 'Piscina', 'Spa', 'Parking'], badge: 'Popular' },
];

function Stars({ n }: { n: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={`fa fa-star${i <= n ? '' : '-o'}`} style={{ color: i <= n ? '#f9a825' : '#ddd', fontSize: 12 }} />
      ))}
    </span>
  );
}

export default function HotelesPage() {
  const [hotels, setHotels] = useState(MOCK);
  const [loading, setLoading] = useState(false);
  const [dest, setDest] = useState('Madrid');
  const [guests, setGuests] = useState(2);
  const [maxPrice, setMaxPrice] = useState(300);
  const [sortBy, setSortBy] = useState('price');
  const [selectedStars, setSelectedStars] = useState([1, 2, 3, 4, 5]);

  const doSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ city: dest, guests: String(guests) });
      const res = await fetch(`${API}/hotels/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = data.data || data.hotels || [];
      setHotels(list.length > 0 ? list : MOCK);
    } catch {
      setHotels(MOCK);
    } finally {
      setLoading(false);
    }
  };

  const filtered = [...hotels]
    .filter((h) => (h.price ?? 0) <= maxPrice && selectedStars.includes(h.stars ?? 4))
    .sort((a, b) =>
      sortBy === 'price' ? (a.price ?? 0) - (b.price ?? 0) :
      sortBy === 'rating' ? (b.rating ?? 0) - (a.rating ?? 0) :
      (b.stars ?? 0) - (a.stars ?? 0)
    );

  return (
    <>
      <PageBanner
        title="Hoteles"
        subtitle="Encuentra los mejores hoteles al mejor precio"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Hoteles' }]}
      />

      {/* Barra búsqueda */}
      <div className="search-int" style={{ background: '#f5f5f5', padding: '16px 0', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Destino</div>
            <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Ciudad o hotel"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Huéspedes</div>
            <select value={guests} onChange={(e) => setGuests(+e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button onClick={doSearch} className="bg-primary text-white px-6 py-2 rounded font-bold text-sm hover:bg-primary-dark transition-colors">
            <i className="fa fa-search mr-2" />Buscar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div className="results-layout" style={{ display: 'flex', gap: 24 }}>

          {/* Filtros */}
          <aside style={{ width: 220, flexShrink: 0 }}>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase">Filtros</h3>
              <div className="mb-4">
                <div className="text-xs text-gray-500 uppercase mb-2">Precio máx/noche</div>
                <input type="range" min={30} max={500} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)}
                  className="w-full" style={{ accentColor: '#003580' }} />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>30€</span><span className="font-bold text-primary">{maxPrice}€</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-xs text-gray-500 uppercase mb-2">Categoría</div>
                {[5, 4, 3, 2, 1].map((n) => (
                  <label key={n} className="flex items-center gap-2 mb-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={selectedStars.includes(n)} style={{ accentColor: '#003580' }}
                      onChange={(e) => setSelectedStars((s) => e.target.checked ? [...s, n] : s.filter((x) => x !== n))} />
                    <Stars n={n} />
                  </label>
                ))}
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase mb-2">Ordenar</div>
                {[{ v: 'price', l: 'Precio' }, { v: 'rating', l: 'Valoración' }, { v: 'stars', l: 'Estrellas' }].map(({ v, l }) => (
                  <label key={v} className="flex items-center gap-2 mb-2 text-sm cursor-pointer">
                    <input type="radio" name="hsort" checked={sortBy === v} onChange={() => setSortBy(v)} style={{ accentColor: '#003580' }} />{l}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Resultados */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-4">
              {loading ? 'Buscando hoteles...' : `${filtered.length} hoteles encontrados`}
            </p>

            {loading && [0, 1, 2].map((i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 mb-4 animate-skeleton">
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mb-2 w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}

            {!loading && filtered.map((h) => (
              <div key={h.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4 flex hover:shadow-lg transition-shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.img || '/img/about-02.jpg'} alt={h.name} className="w-40 h-auto object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/img/about-02.jpg'; }} />
                <div className="p-4 flex flex-1 justify-between items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-primary text-base mb-1">{h.name}</h3>
                    <Stars n={h.stars ?? 4} />
                    <p className="text-xs text-gray-500 mt-1"><i className="fa fa-map-marker mr-1 text-primary" />{h.location}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(h.amenities ?? []).slice(0, 4).map((a) => (
                        <span key={a} className="text-xs border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                          <i className="fa fa-check mr-1 text-primary text-xs" />{a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="inline-block bg-primary text-white text-sm font-bold px-2 py-1 rounded mb-1">
                      {h.rating} <i className="fa fa-star text-xs" />
                    </div>
                    <div className="text-xs text-gray-400 mb-2">({h.reviews} valoraciones)</div>
                    <div className="text-2xl font-black text-primary font-poppins">{h.price}€</div>
                    <div className="text-xs text-gray-400 mb-3">por noche</div>
                    <Link href={`/hoteles/${h.id}`}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                      Ver Hotel
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
