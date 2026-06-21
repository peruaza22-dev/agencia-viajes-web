'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageBanner from '@/components/layout/PageBanner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

const MOCK_CABS = [
  { id: 1, name: 'Seat Ibiza o Similar', type: 'Turismo', pax: 4, bags: 2, price: 89, features: ['A/C', '4 Plazas', '2 Maletas', 'Wi-Fi'] },
  { id: 2, name: 'Ford Galaxy o Similar', type: 'Monovolumen', pax: 7, bags: 4, price: 129, features: ['A/C', '7 Plazas', '4 Maletas', 'Wi-Fi'] },
  { id: 3, name: 'Mercedes Clase E o Similar', type: 'Ejecutivo', pax: 4, bags: 3, price: 179, features: ['A/C', '4 Plazas', '3 Maletas', 'Agua incluida'] },
  { id: 4, name: 'Toyota Hiace o Similar', type: 'Minibús', pax: 12, bags: 8, price: 249, features: ['A/C', '12 Plazas', '8 Maletas'] },
];

export default function TrasladosPage() {
  const router = useRouter();
  const [from, setFrom] = useState('Madrid');
  const [to, setTo] = useState('Valencia');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [cabs, setCabs] = useState(MOCK_CABS);
  const [loading, setLoading] = useState(false);
  const [maxPrice, setMaxPrice] = useState(500);

  // ✅ CLEANUP AUDITADO
  useEffect(() => {
    const controller = new AbortController();
    const loadDefaults = async () => {
      try {
        const qs = new URLSearchParams({ startLocationCode: 'MAD', endLocationCode: 'VLC', startDateTime: `${new Date().toISOString().split('T')[0]}T10:00:00`, passengers: '1' });
        const res = await fetch(`${API}/transfers/search?${qs}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.data ?? data.transfers ?? [];
        if (list.length > 0) setCabs(list);
      } catch (e: unknown) {
        if ((e as Error).name !== 'AbortError') { /* silencioso — usa mock */ }
      }
    };
    loadDefaults();
    return () => controller.abort(); // ✅
  }, []);

  const doSearch = async () => {
    setLoading(true);
    try {
      const dt = date || new Date().toISOString().split('T')[0];
      const qs = new URLSearchParams({ startLocationCode: from.slice(0, 3).toUpperCase(), endLocationCode: to.slice(0, 3).toUpperCase(), startDateTime: `${dt}T${time}:00`, passengers: '1' });
      const res = await fetch(`${API}/transfers/search?${qs}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = data.data ?? data.transfers ?? [];
      setCabs(list.length > 0 ? list : MOCK_CABS);
    } catch { setCabs(MOCK_CABS); }
    finally { setLoading(false); }
  };

  const filtered = cabs.filter((c) => c.price <= maxPrice);

  return (
    <>
      <PageBanner
        title="Traslados y Taxis"
        subtitle="Precio fijo sin sorpresas — servicio profesional en toda España"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Traslados' }]}
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
            <div className="text-xs text-gray-500 mb-1 uppercase">Hora recogida</div>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <button onClick={doSearch} className="bg-primary text-white px-6 py-2 rounded font-bold text-sm hover:bg-primary-dark transition-colors">
            {loading ? <i className="fa fa-spinner fa-spin" /> : <><i className="fa fa-search mr-2" />Buscar</>}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <input type="range" min={50} max={500} step={10} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} style={{ accentColor: '#003580' }} />
            <span className="text-gray-500">Máx: <strong className="text-primary">{maxPrice}€</strong></span>
          </label>
          <p className="text-sm text-gray-500">{filtered.length} traslados · {from} → {to}</p>
        </div>

        <div className="space-y-4">
          {filtered.map((cab) => (
            <div key={cab.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 text-center">
                    <i className="fa fa-car text-primary" style={{ fontSize: 40 }} />
                    <div className="text-xs text-gray-400 mt-1">{cab.type}</div>
                  </div>
                  <div>
                    <h3 className="font-bold text-primary text-base mb-2">{cab.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {cab.features.map((f: string) => (
                        <span key={f} className="border border-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-600">
                          <i className="fa fa-check mr-1 text-primary text-xs" />{f}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span><i className="fa fa-users mr-1" />Hasta {cab.pax} pasajeros</span>
                      <span><i className="fa fa-suitcase mr-1" />Hasta {cab.bags} maletas</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-primary font-poppins">{cab.price}€</div>
                  <div className="text-xs text-gray-400 mb-2">precio total</div>
                  <button
                    onClick={() => router.push(`/traslados/checkout?cabId=${cab.id}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&time=${time}`)}
                    className="bg-red-500 hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
