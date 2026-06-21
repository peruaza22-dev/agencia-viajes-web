'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageBanner from '@/components/layout/PageBanner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

const MOCK = [
  { id: 1, company: 'Alsa', type: 'Supra', dep: '10:00', arr: '16:10', duration: '6h 10m', stops: 'Directo', seats: 36, price: 45, oldPrice: 55, amenities: ['WiFi', 'AC', 'USB'] },
  { id: 2, company: 'Alsa', type: 'Económico', dep: '12:30', arr: '19:00', duration: '6h 30m', stops: 'Directo', seats: 12, price: 29, oldPrice: 38, amenities: ['AC'] },
  { id: 3, company: 'Avanza', type: 'Premium', dep: '15:00', arr: '21:20', duration: '6h 20m', stops: '1 Parada', seats: 24, price: 39, oldPrice: 49, amenities: ['WiFi', 'AC', 'Cafetería'] },
  { id: 4, company: 'FlixBus', type: 'Estándar', dep: '18:00', arr: '00:30', duration: '6h 30m', stops: 'Directo', seats: 5, price: 19, oldPrice: 28, amenities: ['WiFi', 'USB'] },
];

const AMENITY_ICONS: Record<string, string> = { WiFi: 'fa-wifi', AC: 'fa-snowflake-o', USB: 'fa-plug', Cafetería: 'fa-coffee' };

export default function AutobusesPage() {
  const router = useRouter();
  const [from, setFrom] = useState('Madrid');
  const [to, setTo] = useState('Barcelona');
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [buses, setBuses] = useState(MOCK);
  const [loading, setLoading] = useState(false);
  const [maxP, setMaxP] = useState(100);
  const [onlyDirect, setOnlyDirect] = useState(false);

  const doSearch = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ departure: from.toUpperCase().slice(0, 3), arrival: to.toUpperCase().slice(0, 3), adults: String(adults), ...(date && { date }) });
      const res = await fetch(`${API}/buses/search?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = data.data ?? data.buses ?? [];
      setBuses(list.length > 0 ? list : MOCK);
    } catch {
      setBuses(MOCK);
    } finally { setLoading(false); }
  };

  const filtered = buses.filter((b) => b.price <= maxP && (!onlyDirect || b.stops === 'Directo'));

  return (
    <>
      <PageBanner
        title="Autobuses"
        subtitle="Billetes de autobús al mejor precio"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Autobuses' }]}
      />

      <div style={{ background: '#f5f5f5', padding: '16px 0', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Desde</div>
            <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Ciudad origen"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Hasta</div>
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Ciudad destino"
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Fecha</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 uppercase">Pasajeros</div>
            <select value={adults} onChange={(e) => setAdults(+e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary">
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <button onClick={doSearch} className="bg-primary text-white px-6 py-2 rounded font-bold text-sm hover:bg-primary-dark transition-colors">
            <i className="fa fa-search mr-2" />Buscar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div className="flex gap-3 mb-4 flex-wrap items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="range" min={5} max={150} value={maxP} onChange={(e) => setMaxP(+e.target.value)} style={{ accentColor: '#003580' }} />
            <span className="text-gray-500">Máx: <strong className="text-primary">{maxP}€</strong></span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={onlyDirect} onChange={(e) => setOnlyDirect(e.target.checked)} style={{ accentColor: '#003580' }} />
            Solo directos
          </label>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {loading ? 'Buscando...' : `${filtered.length} servicios · ${from} → ${to}`}
        </p>

        {!loading && filtered.map((b) => (
          <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold text-primary mb-1">{b.company} <span className="text-gray-400 text-xs font-normal">· {b.type}</span></div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-xl">{b.dep}</span>
                  <span className="text-gray-400">→ {b.duration} → {b.stops}</span>
                  <span className="font-bold text-xl">{b.arr}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {b.amenities.map((a) => (
                    <span key={a} className="border border-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-600">
                      <i className={`fa ${AMENITY_ICONS[a] ?? 'fa-check'} mr-1 text-primary text-xs`} />{a}
                    </span>
                  ))}
                  {b.seats <= 10 && <span className="text-xs text-red-500 font-bold"><i className="fa fa-bolt mr-1" />{b.seats} plazas</span>}
                </div>
              </div>
              <div className="text-right">
                {b.oldPrice && <div className="text-xs text-gray-400 line-through">{b.oldPrice}€</div>}
                <div className="text-2xl font-black text-primary font-poppins">{b.price}€</div>
                <div className="text-xs text-gray-400 mb-2">por persona</div>
                <button
                  onClick={() => router.push(`/autobuses/checkout?busId=${b.id}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`)}
                  className="bg-red-500 hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  Reservar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
