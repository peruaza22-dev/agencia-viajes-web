'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function HotelCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { authFetch } = useAuth();
  const hotelId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [guests, setGuests] = useState(2);
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [contact, setContact] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email) { setErr('El email es obligatorio'); return; }
    if (!checkin || !checkout) { setErr('Las fechas son obligatorias'); return; }
    setLoading(true); setErr('');
    try {
      await authFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({ type: 'hotel', hotelId, checkin, checkout, guests, contact }),
      });
      router.push('/mis-reservas');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al procesar la reserva');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
      <Link href={`/hoteles/${hotelId}`} className="text-sm text-primary inline-flex items-center gap-2 mb-4 hover:underline">
        <i className="fa fa-arrow-left" />Volver al hotel
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 font-poppins mb-6">Checkout — Hotel</h1>
      <form onSubmit={handleBook} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        {err && <p className="text-red-500 text-sm">{err}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1">Check-in *</label>
            <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} required
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1">Check-out *</label>
            <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} required
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase block mb-1">Huéspedes</label>
            <select value={guests} onChange={(e) => setGuests(+e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary">
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} huésped{n > 1 ? 'es' : ''}</option>)}
            </select>
          </div>
        </div>

        <hr className="border-gray-100" />
        <h2 className="font-bold text-gray-600 text-xs uppercase">Datos de contacto</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['firstName', 'lastName', 'email', 'phone'] as const).map((k) => (
            <div key={k}>
              <label className="text-xs text-gray-400 uppercase block mb-1">
                {k === 'firstName' ? 'Nombre' : k === 'lastName' ? 'Apellidos' : k === 'email' ? 'Email *' : 'Teléfono'}
              </label>
              <input type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'} value={contact[k]}
                onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
          <i className="fa fa-shield" /> Cancelación gratuita hasta 48h antes del check-in
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60">
          {loading ? <><i className="fa fa-spinner fa-spin mr-2" />Procesando...</> : <><i className="fa fa-lock mr-2" />Confirmar Reserva</>}
        </button>
      </form>
    </div>
  );
}
