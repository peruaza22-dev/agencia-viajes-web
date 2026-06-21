'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

interface Booking {
  id: string;
  booking_reference: string;
  booking_type: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  status: string;
  departure_date: string;
  created_at: string;
}

export default function RecoveryPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBookings([]);

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
      const res = await fetch(`${API}/bookings/by-email/${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Error al buscar reservas');
        setShowResults(false);
        return;
      }

      setBookings(data.data?.bookings || []);
      setShowResults(true);

      if ((data.data?.bookings || []).length === 0) {
        setError('No se encontraron reservas con este correo');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error de conexión';
      setError(msg);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const fmtPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
  };

  return (
    <div id="body">
      <MobileNav />
      <Header />
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: '#f5f8fb' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>
          {!showResults ? (
            // Formulario de búsqueda
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '40px 32px', boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <i className="fa fa-envelope-open" style={{ fontSize: 48, color: '#003580', display: 'block', marginBottom: 12 }} />
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#343a40', marginBottom: 8 }}>Recuperar mis reservas</h1>
                <p style={{ fontSize: 14, color: '#64748b' }}>Ingresa tu correo para ver todas tus reservas</p>
              </div>

              {error && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: 6, padding: '12px 14px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
                  <i className="fa fa-exclamation-circle" style={{ marginRight: 6 }} />{error}
                </div>
              )}

              <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 6, padding: '12px 14px', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="search-btn"
                  style={{ width: '100%', opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />Buscando...</> : <><i className="fa fa-search" style={{ marginRight: 6 }} />Buscar reservas</>}
                </button>
              </form>

              <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 20, textAlign: 'center', fontSize: 13 }}>
                ¿Tienes una cuenta? <Link href="/login" style={{ color: '#003580', fontWeight: 600 }}>Inicia sesión aquí</Link>
              </div>
            </div>
          ) : (
            // Resultados
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '40px 32px', boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40', marginBottom: 4 }}>Tus reservas</h2>
                <p style={{ fontSize: 12, color: '#64748b' }}>{email}</p>
                <button
                  onClick={() => { setShowResults(false); setEmail(''); setBookings([]); }}
                  style={{ background: 'none', border: 'none', color: '#003580', fontSize: 12, cursor: 'pointer', fontWeight: 600, marginTop: 8 }}
                >
                  Buscar otro correo
                </button>
              </div>

              {bookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {bookings.map((booking) => (
                    <div key={booking.id} style={{ border: '1px solid #e5e5e5', borderRadius: 6, padding: 16, background: '#fafbfc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>REFERENCIA</p>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#003580' }}>{booking.booking_reference}</p>
                        </div>
                        <span style={{ background: booking.status === 'confirmed' ? '#d1fae5' : booking.status === 'pending' ? '#fef3c7' : '#fee2e2', color: booking.status === 'confirmed' ? '#065f46' : booking.status === 'pending' ? '#92400e' : '#991b1b', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 12 }}>
                          {booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>TIPO</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#343a40' }}>{booking.booking_type === 'flight' ? '✈️ Vuelo' : booking.booking_type === 'bus' ? '🚌 Bus' : booking.booking_type === 'cab' ? '🚕 Taxi' : booking.booking_type}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>PASAJERO</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#343a40' }}>{booking.customer_name}</p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>SALIDA</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#343a40' }}>{fmtDate(booking.departure_date)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>TOTAL</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#003580' }}>{fmtPrice(booking.total_amount, booking.currency || 'USD')}</p>
                        </div>
                      </div>

                      <a
                        href={`/booking/${booking.booking_reference}`}
                        style={{ display: 'inline-block', background: '#003580', color: '#fff', padding: '10px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                      >
                        Ver detalles
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: 20 }}>
                  <i className="fa fa-inbox" style={{ fontSize: 40, color: '#cbd5e1', display: 'block', marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: '#64748b' }}>No se encontraron reservas con este correo</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
