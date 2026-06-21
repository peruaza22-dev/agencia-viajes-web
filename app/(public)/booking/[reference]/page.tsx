'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  payment_status: string;
  departure_date: string;
  arrival_date?: string;
  items: any[];
  selected_offer?: any;
  created_at: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const reference = params.reference as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const [flightStatus, setFlightStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('Quisiera recibir una actualización del estado de mi vuelo.');

  useEffect(() => {
    if (!reference) return;
    
    const fetchBooking = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
        const res = await fetch(`${API}/bookings/reference/${reference}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error?.message || 'No se encontró la reserva');
          setLoading(false);
          return;
        }

        const bookingData = data.data?.booking || data.data;
        setBooking(bookingData);
        setResendEmail(bookingData?.customer_email || '');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [reference]);

  useEffect(() => {
    const loadFlightStatus = async () => {
      if (!booking) return;

      const selectedOffer = booking.items?.[0]?.details?.selectedOffer || booking.items?.[0]?.details?.flightOffer;
      const segment = selectedOffer?.itineraries?.[0]?.segments?.[0];
      const carrierCode = segment?.carrierCode || selectedOffer?.validatingAirlineCodes?.[0];
      const flightNumber = segment?.number || selectedOffer?.flightNumber || selectedOffer?.id;
      const date = segment?.departure?.at?.slice(0, 10) || booking.departure_date?.slice(0, 10);

      if (!carrierCode || !flightNumber || !date) {
        setStatusError('No hay datos de vuelo suficientes para obtener el estado.');
        return;
      }

      setStatusLoading(true);
      setStatusError('');
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
        const res = await fetch(`${API}/flights/status?carrierCode=${encodeURIComponent(carrierCode)}&flightNumber=${encodeURIComponent(flightNumber)}&date=${encodeURIComponent(date)}`);
        const data = await res.json();

        if (!res.ok) {
          setStatusError(data.error?.message || 'No se pudo obtener el estado del vuelo.');
          return;
        }

        setFlightStatus(data.data?.[0] || null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al obtener estado del vuelo';
        setStatusError(msg);
      } finally {
        setStatusLoading(false);
      }
    };

    loadFlightStatus();
  }, [booking]);

  const handleResendItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      alert('Ingresa tu correo');
      return;
    }

    setResending(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
      const res = await fetch(`${API}/bookings/resend-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, email: resendEmail })
      });

      if (res.ok) {
        alert('Itinerario enviado a tu correo');
        setShowResendForm(false);
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Error al enviar');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setResending(false);
    }
  };

  const fmtDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const fmtPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
  };

  if (loading) {
    return (
      <div id="body">
        <MobileNav />
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #003580', borderTop: '4px solid #e5e5e5', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748b' }}>Cargando reserva...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div id="body">
        <MobileNav />
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <i className="fa fa-exclamation-triangle" style={{ fontSize: 48, color: '#dc2626', display: 'block', marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#343a40', marginBottom: 8 }}>Reserva no encontrada</h2>
            <p style={{ color: '#64748b', marginBottom: 20 }}>{error || 'No se pudo cargar la reserva'}</p>
            <a href="/" style={{ background: '#003580', color: '#fff', padding: '10px 20px', borderRadius: 4, textDecoration: 'none', display: 'inline-block' }}>Volver al inicio</a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div id="body">
      <MobileNav />
      <Header />
      <div style={{ minHeight: '70vh', padding: '40px 20px', background: '#f5f8fb' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>REFERENCIA DE RESERVA</p>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#003580' }}>{booking.booking_reference}</h1>
              </div>
              <span style={{ background: booking.status === 'confirmed' ? '#d1fae5' : booking.status === 'pending' ? '#fef3c7' : '#fee2e2', color: booking.status === 'confirmed' ? '#065f46' : booking.status === 'pending' ? '#92400e' : '#991b1b', fontSize: 12, fontWeight: 700, padding: '8px 12px', borderRadius: 4 }}>
                {booking.status === 'confirmed' ? '✓ Confirmada' : booking.status === 'pending' ? '⏳ Pendiente' : '✕ Cancelada'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>PASAJERO</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#343a40' }}>{booking.customer_name}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>CORREO</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#343a40' }}>{booking.customer_email}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>ESTADO DE PAGO</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: booking.payment_status === 'paid' ? '#065f46' : '#92400e' }}>
                  {booking.payment_status === 'paid' ? '✓ Pagada' : booking.payment_status === 'pending' ? '⏳ Pendiente' : booking.payment_status}
                </p>
              </div>
            </div>
          </div>

          {/* Viaje */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#343a40', marginBottom: 16 }}>Detalles del viaje</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TIPO DE SERVICIO</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#343a40' }}>
                  {booking.booking_type === 'flight' ? '✈️ Vuelo' : booking.booking_type === 'bus' ? '🚌 Bus' : booking.booking_type === 'cab' ? '🚕 Taxi' : booking.booking_type}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>SALIDA</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#343a40' }}>{fmtDate(booking.departure_date)}</p>
              </div>
              {booking.arrival_date && (
                <div>
                  <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>LLEGADA</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#343a40' }}>{fmtDate(booking.arrival_date)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#343a40', marginBottom: 16 }}>Resumen</h2>
            
            <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#343a40', fontWeight: 600 }}>TOTAL</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#003580' }}>{fmtPrice(booking.total_amount, booking.currency || 'USD')}</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowResendForm(!showResendForm)}
              style={{ background: '#e5e7eb', color: '#343a40', border: 'none', borderRadius: 4, padding: '12px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <i className="fa fa-envelope" style={{ marginRight: 8 }} />
              Reenviar itinerario
            </button>
            <button
              onClick={() => setNotifyStatus('')}
              style={{ background: '#f8fafc', color: '#343a40', border: '1px solid #cbd5e1', borderRadius: 4, padding: '12px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <i className="fa fa-bell" style={{ marginRight: 8 }} />
              Solicitar notificación
            </button>
            <a
              href="/"
              style={{ background: '#003580', color: '#fff', border: 'none', borderRadius: 4, padding: '12px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}
            >
              <i className="fa fa-arrow-left" style={{ marginRight: 8 }} />
              Volver
            </a>
          </div>

          {/* Estado del vuelo */}
          {flightStatus || statusLoading || statusError ? (
            <div style={{ background: '#fff', border: '1px solid #e5e7ef', borderRadius: 8, padding: '24px', marginTop: 24, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343a40', marginBottom: 16 }}>Estado del vuelo</h3>
              {statusLoading && <p style={{ color: '#64748b' }}>Consultando el estado del vuelo...</p>}
              {statusError && <p style={{ color: '#dc2626' }}>{statusError}</p>}
              {flightStatus && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Vuelo</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{flightStatus.flightNumber}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Estado</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{flightStatus.status}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Salida</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{flightStatus.departure?.scheduledTime || 'N/A'}</p>
                      {flightStatus.departure?.actualTime && <p style={{ fontSize: 12, color: '#475569' }}>Actual: {flightStatus.departure.actualTime}</p>}
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Llegada</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{flightStatus.arrival?.scheduledTime || 'N/A'}</p>
                      {flightStatus.arrival?.actualTime && <p style={{ fontSize: 12, color: '#475569' }}>Actual: {flightStatus.arrival.actualTime}</p>}
                    </div>
                  </div>
                  <div style={{ background: '#f1f5f9', borderRadius: 9999, height: 12, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ width: `${Math.min(100, Math.max(0, flightStatus.status === 'SCHEDULED' ? 30 : flightStatus.status === 'BOARDING' ? 60 : flightStatus.status === 'DEPARTED' ? 85 : flightStatus.status === 'ARRIVED' ? 100 : flightStatus.status === 'DELAYED' ? 50 : flightStatus.status === 'CANCELLED' ? 10 : 40))}%`, height: '100%', background: '#0f172a' }} />
                  </div>
                  <p style={{ fontSize: 13, color: '#475569' }}>Estado basado en la última información disponible. Si deseas una notificación por correo, usa el formulario de abajo.</p>
                </>
              )}
            </div>
          ) : null}

          {/* Formulario de reenvío */}
          {showResendForm && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '24px', marginTop: 24, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343a40', marginBottom: 16 }}>Reenviar itinerario</h3>
              <form onSubmit={handleResendItinerary}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>CORREO</label>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 4, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={resending}
                  style={{ background: '#003580', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: resending ? 0.6 : 1 }}
                >
                  {resending ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />Enviando...</> : <>Enviar</>}
                </button>
              </form>
            </div>
          )}

          {/* Notificación por email */}
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '24px', marginTop: 24, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#343a40', marginBottom: 16 }}>Notificarme cambios de vuelo</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!resendEmail.trim()) {
                  alert('Debes ingresar un correo para recibir la notificación.');
                  return;
                }
                setNotifyLoading(true);
                setNotifyStatus('');
                const selectedOffer = booking?.items?.[0]?.details?.selectedOffer || booking?.items?.[0]?.details?.flightOffer;
                const segment = selectedOffer?.itineraries?.[0]?.segments?.[0];
                const carrierCode = segment?.carrierCode || selectedOffer?.validatingAirlineCodes?.[0];
                const flightNumber = segment?.number || selectedOffer?.flightNumber || selectedOffer?.id;
                const date = segment?.departure?.at?.slice(0, 10) || booking?.departure_date?.slice(0, 10);

                try {
                  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
                  const res = await fetch(`${API}/flights/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      bookingReference: reference,
                      email: resendEmail,
                      carrierCode,
                      flightNumber,
                      date,
                      message: notifyMessage
                    })
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setNotifyStatus(data.error?.message || 'No se pudo enviar la notificación.');
                  } else {
                    setNotifyStatus('Notificación enviada. Revisa tu correo.');
                  }
                } catch (err) {
                  setNotifyStatus(err instanceof Error ? err.message : 'Error al enviar la notificación.');
                } finally {
                  setNotifyLoading(false);
                }
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Correo</label>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 4, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Mensaje</label>
                <textarea
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  rows={3}
                  style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 4, padding: '10px 12px', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                disabled={notifyLoading}
                style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: notifyLoading ? 0.6 : 1 }}
              >
                {notifyLoading ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />Enviando...</> : <>Enviar notificación</>}
              </button>
              {notifyStatus && <p style={{ marginTop: 12, color: notifyStatus.includes('enviada') ? '#047857' : '#b91c1c' }}>{notifyStatus}</p>}
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
