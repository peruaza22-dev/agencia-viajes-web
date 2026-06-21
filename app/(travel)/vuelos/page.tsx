'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageBanner from '@/components/layout/PageBanner';
import DatePicker from '@/components/ui/DatePicker';
import { searchDuffel, getIntegrations, createOfferRequest } from '@/lib/duffel';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';


export default function VuelosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFrom = searchParams.get('from') ?? '';
  const queryTo = searchParams.get('to') ?? '';
  const queryDeparture = searchParams.get('departure') ?? '';
  const queryAdults = parseInt(searchParams.get('adults') ?? '1', 10);
  const queryCabinClass = searchParams.get('cabinClass') ?? 'ECONOMY';

  const [from, setFrom] = useState(queryFrom || 'MAD');
  const [to, setTo] = useState(queryTo || 'BCN');
  const [departure, setDeparture] = useState<Date | null>(() => queryDeparture ? new Date(queryDeparture) : new Date(Date.now() + 86400000));
  const [adults, setAdults] = useState(queryAdults);
  const [cabinClass, setCabinClass] = useState(queryCabinClass);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('price');

  const doSearch = async () => {
    if (!departure || !from || !to) return;
    setLoading(true);
    try {
      const depStr = departure instanceof Date ? departure.toISOString().split('T')[0] : String(departure || '');
      // Check integrations toggles to decide provider
      const integrations = await getIntegrations();
      if (integrations.duffel) {
        // Use createOfferRequest with full Duffel parameters
        const payload = {
          slices: [
            {
              origin: from,
              destination: to,
              departure_date: depStr,
              origin_type: 'airport',
              destination_type: 'airport'
            }
          ],
          passengers: Array.from({ length: adults }).map((_, i) => ({
            id: `pax_${i}`,
            type: 'adult' as const
          })),
          cabin_class: cabinClass.toLowerCase() as any,
          max_connections: 1
        };
        const offerRequest = await createOfferRequest(payload, { return_offers: true, supplier_timeout: 15000 });
        // Map Duffel offers to our flight shape
        const list = (offerRequest.offers || []).map((offer: any) => ({
          id: offer.id,
          price: offer.total_amount || '0',
          itineraries: offer.slices?.map((s: any) => ({ segments: s.segments })) || [],
          raw: offer
        }));
        setFlights(list);
      } else {
        const qs = new URLSearchParams({ from, to, departure: depStr, adults: String(adults), cabinClass });
        const res = await fetch(`${API}/flights/search?${qs}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = data.flights ?? data.data ?? [];
        setFlights(list);
      }
    } catch (error) {
      console.error('Error buscando vuelos:', error);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryFrom && queryTo && queryDeparture) {
      doSearch();
    }
  }, [queryFrom, queryTo, queryDeparture]);

  // SEO básico: actualizar título y meta description según búsqueda
  useEffect(() => {
    try {
      const title = `Vuelos ${from} → ${to} · Mejores precios`;
      document.title = title;
      let meta = document.querySelector('meta[name="description"]');
      const desc = `Busca vuelos ${from} a ${to} — compara precios y reserva al mejor precio.`;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', desc);
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [from, to]);

  const sorted = [...flights].sort((a, b) =>
    sortBy === 'price' ? (a.price ?? 0) - (b.price ?? 0) :
    sortBy === 'duration' ? (a.duration ?? '').localeCompare(b.duration ?? '') : 0
  );

  return (
    <>
      <PageBanner
        title="Vuelos"
        subtitle="Encuentra los mejores precios en vuelos nacionales e internacionales"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Vuelos' }]}
      />

      {/* Buscador */}
      <div style={{ background: '#f5f5f5', padding: '16px 0', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Origen (IATA)</div>
            <input value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} placeholder="MAD" maxLength={3}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary w-24 font-mono" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Destino (IATA)</div>
            <input value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} placeholder="BCN" maxLength={3}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary w-24 font-mono" />
          </div>
          <div style={{ minWidth: 180 }}>
            <div className="text-xs text-gray-500 mb-1 uppercase">Fecha ida</div>
            <DatePicker value={departure} onChange={(d) => setDeparture(d)} placeholder="Fecha de salida" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Pasajeros</div>
            <select value={adults} onChange={(e) => setAdults(+e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary">
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Clase</div>
            <select value={cabinClass} onChange={(e) => setCabinClass(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary">
              <option value="ECONOMY">Turista</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">Primera Clase</option>
            </select>
          </div>
          <button onClick={doSearch} className="bg-primary text-white px-6 py-2 rounded font-bold text-sm hover:bg-primary-dark transition-colors">
            <i className="fa fa-search mr-2" />Buscar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {loading ? 'Buscando vuelos...' : `${sorted.length} vuelos encontrados · ${from} → ${to}`}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Ordenar:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none">
              <option value="price">Precio</option>
              <option value="duration">Duración</option>
            </select>
          </div>
        </div>

        {loading && [0, 1, 2].map((i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 mb-3 animate-skeleton">
            <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}

        {!loading && sorted.map((f) => {
          const firstSeg = f.itineraries?.[0]?.segments?.[0] || {};
          const lastSeg = f.itineraries?.[0]?.segments?.slice(-1)[0] || {};
          const airline = firstSeg.carrierName || '';
          const flightNo = `${firstSeg.carrierCode || ''}${firstSeg.number || ''}`;
          const dep = firstSeg.departure?.at || '';
          const arr = lastSeg.arrival?.at || '';
          const duration = f.itineraries?.[0]?.totalDuration || '';
          const stopsCount = f.itineraries?.[0]?.numberOfStops ?? firstSeg.numberOfStops ?? 0;
          const stops = stopsCount === 0 ? 'Directo' : `${stopsCount} parada${stopsCount > 1 ? 's' : ''}`;
          const price = typeof f.price === 'string' ? f.price : (f.price?.total || '0');

          return (
            <article key={f.id} aria-label={`Vuelo ${airline} ${flightNo} ${from} a ${to}`} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <header className="flex items-center gap-4 mb-3 sm:mb-0">
                    <div>
                      <div className="font-bold text-gray-800">{airline}</div>
                      <div className="text-xs text-gray-400">{flightNo}</div>
                    </div>
                    <div className="ml-4 flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <time className="font-bold text-xl text-primary" dateTime={dep}>{dep ? new Date(dep).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</time>
                        <div className="text-xs text-gray-400">{from}</div>
                      </div>
                      <div className="text-center px-3">
                        <div className="text-xs text-gray-400">{duration}</div>
                        <div className="border-t border-gray-300 w-16 mx-auto my-1" />
                        <div className="text-xs text-gray-400">{stops}</div>
                      </div>
                      <div className="text-center">
                        <time className="font-bold text-xl text-primary" dateTime={arr}>{arr ? new Date(arr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</time>
                        <div className="text-xs text-gray-400">{to}</div>
                      </div>
                    </div>
                  </header>
                </div>

                <div className="flex-shrink-0 text-right flex flex-col sm:flex-row items-center gap-4">
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-primary font-poppins">{price}€</div>
                    <div className="text-xs text-gray-400 mb-2">por persona</div>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        const depStr = dep ? new Date(dep).toISOString().split('T')[0] : '';
                        router.push(`/vuelos/checkout?flightId=${f.id}&from=${from}&to=${to}&dep=${depStr}&arr=${arr}&adults=${adults}&price=${price}&flightNo=${encodeURIComponent(flightNo)}&airline=${encodeURIComponent(airline)}&duration=${encodeURIComponent(duration)}&stops=${stopsCount}`);
                      }}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm transition-colors w-full sm:w-auto"
                      aria-label={`Seleccionar vuelo ${flightNo}`}
                    >
                      Seleccionar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
