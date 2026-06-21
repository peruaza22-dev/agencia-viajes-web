'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { Booking } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#15803d', PENDING: '#d97706', CANCELLED: '#dc2626', COMPLETED: '#6b7280', FAILED: '#dc2626',
};

const TYPE_ICONS: Record<string, string> = {
  flight: 'fa-plane', hotel: 'fa-bed', bus: 'fa-bus', taxi: 'fa-car', holiday: 'fa-suitcase',
};

export default function MisReservasPage() {
  const { authFetch } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // ✅ CLEANUP AUDITADO
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const data = await authFetch<{ bookings: Booking[] }>('/bookings');
        if (!controller.signal.aborted) setBookings(data.bookings ?? []);
      } catch (e: unknown) {
        if (!controller.signal.aborted) setErr(e instanceof Error ? e.message : 'Error al cargar reservas');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort(); // ✅
  }, [authFetch]);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-2xl font-bold font-poppins text-gray-800 mb-6">Mis Reservas</h1>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="bg-gray-100 rounded-xl h-20 animate-skeleton" />)}
          </div>
        )}

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl">{err}</div>
        )}

        {!loading && bookings.length === 0 && !err && (
          <div className="text-center py-20">
            <i className="fa fa-ticket" style={{ fontSize: 48, color: '#e5e5e5', display: 'block', marginBottom: 12 }} />
            <h2 className="text-lg font-bold text-gray-400 mb-2">No tienes reservas todavía</h2>
            <p className="text-gray-400 text-sm mb-6">Empieza a planificar tu próximo viaje</p>
            <Link href="/vuelos" className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors">
              Buscar vuelos
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <i className={`fa ${TYPE_ICONS[b.type] ?? 'fa-ticket'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 capitalize">{b.type} #{b.id.slice(-6)}</div>
                    <div className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString('es-ES')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-gray-700">{b.totalAmount}€</div>
                  <span style={{ color: STATUS_COLORS[b.status] ?? '#888' }} className="text-xs font-bold uppercase">
                    {b.status}
                  </span>
                  <Link href={`/reserva/${b.id}`} className="text-primary text-xs hover:underline">
                    Ver detalles →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
