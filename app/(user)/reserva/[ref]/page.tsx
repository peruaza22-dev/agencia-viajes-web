'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { Booking } from '@/types';

export default function BookingTrackPage() {
  const params = useParams();
  const ref = params.ref as string;
  const { authFetch } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // ✅ CLEANUP AUDITADO
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const data = await authFetch<{ booking: Booking }>(`/bookings/${ref}`);
        if (!controller.signal.aborted) setBooking(data.booking);
      } catch (e: unknown) {
        if (!controller.signal.aborted) setErr(e instanceof Error ? e.message : 'Reserva no encontrada');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort(); // ✅
  }, [ref, authFetch]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-60"><div className="spinner" /></div>
  );

  if (err || !booking) return (
    <div className="text-center py-20">
      <i className="fa fa-exclamation-circle" style={{ fontSize: 40, color: '#ccc', display: 'block', marginBottom: 12 }} />
      <p className="text-gray-400">{err || 'Reserva no encontrada'}</p>
      <Link href="/mis-reservas" className="text-primary mt-4 inline-block hover:underline">← Mis Reservas</Link>
    </div>
  );

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/mis-reservas" className="text-sm text-primary inline-flex items-center gap-2 mb-4 hover:underline">
          <i className="fa fa-arrow-left" />Mis Reservas
        </Link>
        <h1 className="text-2xl font-bold font-poppins text-gray-800 mb-6">Detalle de Reserva</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-400 uppercase">Referencia</div>
              <div className="font-mono font-bold text-gray-800">#{booking.id}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : booking.status === 'CANCELLED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
              {booking.status}
            </span>
          </div>
          <hr className="border-gray-100" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">Tipo</div>
              <div className="capitalize font-semibold text-gray-700">{booking.type}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">Total</div>
              <div className="font-bold text-primary text-lg">{booking.totalAmount}€</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">Fecha reserva</div>
              <div className="text-gray-700">{new Date(booking.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase mb-1">Estado pago</div>
              <div className={`font-semibold capitalize ${booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{booking.paymentStatus}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
