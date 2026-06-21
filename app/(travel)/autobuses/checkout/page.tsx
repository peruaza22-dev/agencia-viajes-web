'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AutobusCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [contact, setContact] = useState({ firstName: '', lastName: '', email: '' });

  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const date = searchParams.get('date') ?? '';

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email) { setErr('El email es obligatorio'); return; }
    setLoading(true); setErr('');
    try {
      await authFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({ type: 'bus', from, to, date, contact }),
      });
      router.push('/mis-reservas');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al procesar la reserva');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
      <Link href="/autobuses" className="text-sm text-primary inline-flex items-center gap-2 mb-4 hover:underline">
        <i className="fa fa-arrow-left" />Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 font-poppins mb-4">Checkout — Autobús</h1>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-gray-600">
        <p><strong className="text-primary">{from} → {to}</strong>{date && ` · ${date}`}</p>
      </div>
      <form onSubmit={handleBook} className="bg-white border border-gray-200 rounded-xl p-6">
        {err && <p className="text-red-500 text-sm mb-4">{err}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {(['firstName', 'lastName', 'email'] as const).map((k) => (
            <div key={k}>
              <label className="text-xs text-gray-400 uppercase block mb-1">
                {k === 'firstName' ? 'Nombre' : k === 'lastName' ? 'Apellidos' : 'Email *'}
              </label>
              <input type={k === 'email' ? 'email' : 'text'} value={contact[k]}
                onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
          ))}
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60">
          {loading ? <><i className="fa fa-spinner fa-spin mr-2" />Procesando...</> : <><i className="fa fa-lock mr-2" />Confirmar Reserva</>}
        </button>
      </form>
    </div>
  );
}
