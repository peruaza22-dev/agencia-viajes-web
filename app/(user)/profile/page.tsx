'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { bookingToPdf } from '@/utils/pdf';

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
  created_at: string;
}

export default function ProfilePage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');
  const [showPayments, setShowPayments] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && token && activeTab === 'bookings') {
      fetchBookings();
    }
  }, [user, token, authLoading, activeTab, router]);

  const fetchBookings = async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    setError('');
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
      const res = await fetch(`${API}/bookings/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setError('Error al cargar reservas');
        return;
      }

      const data = await res.json();
      setBookings(data.data?.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      router.push('/');
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

  const printReceipt = (booking: Booking) => {
    try {
      const html = `
        <html><head><title>Recibo ${booking.booking_reference}</title>
        <style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111} .h{color:#003580;font-size:18px;font-weight:800}</style>
        </head><body>
        <div class="h">Recibo de Reserva — ${booking.booking_reference}</div>
        <p>Cliente: ${booking.customer_name || ''}</p>
        <p>Correo: ${booking.customer_email || ''}</p>
        <p>Tipo: ${booking.booking_type}</p>
        <p>Fecha reserva: ${new Date(booking.created_at).toLocaleString()}</p>
        <p>Salida: ${new Date(booking.departure_date).toLocaleString()}</p>
        <hr/>
        <h3>Importe</h3>
        <p style="font-size:18px;font-weight:700">${fmtPrice(booking.total_amount || 0, booking.currency || 'EUR')}</p>
        <p>Estado pago: ${booking.payment_status}</p>
        <div style="margin-top:24px;color:#64748b;font-size:12px">Generado desde el panel de usuario.</div>
        </body></html>
      `;

      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) throw new Error('No se pudo abrir ventana');
      w.document.open();
      w.document.write(html);
      w.document.close();
      // Give the browser a short time to render before print
      setTimeout(() => {
        try { w.print(); } catch { /* ignore */ }
      }, 300);
    } catch (err) {
      alert('No se pudo generar el recibo.');
    }
  };

  const downloadPdf = (booking: any) => {
    try {
      const doc = bookingToPdf(booking);
      doc.save(`recibo-${booking.booking_reference || booking.id || 'reserva'}.pdf`);
    } catch (err) {
      alert('Error generando PDF');
    }
  };

  const totalPaid = bookings
    .filter((booking) => booking.payment_status === 'paid')
    .reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  const totalPending = bookings
    .filter((booking) => booking.payment_status !== 'paid')
    .reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  const paymentCount = bookings.length;
  const paidCount = bookings.filter((booking) => booking.payment_status === 'paid').length;
  const pendingCount = bookings.filter((booking) => booking.payment_status !== 'paid').length;

  if (authLoading) {
    return (
      <div id="body">
        <MobileNav />
        <Header />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#64748b' }}>Cargando...</p>
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
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                background: activeTab === 'profile' ? '#003580' : '#e5e7eb',
                color: activeTab === 'profile' ? '#fff' : '#343a40',
                border: 'none',
                borderRadius: 6,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className="fa fa-user" style={{ marginRight: 8 }} />
              Mi perfil
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              style={{
                background: activeTab === 'bookings' ? '#003580' : '#e5e7eb',
                color: activeTab === 'bookings' ? '#fff' : '#343a40',
                border: 'none',
                borderRadius: 6,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className="fa fa-ticket" style={{ marginRight: 8 }} />
              Mis reservas
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40', marginBottom: 24 }}>Mi Perfil</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 32 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>NOMBRE</label>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#343a40' }}>{user?.name || user?.email || 'Sin nombre'}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>CORREO</label>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#343a40' }}>{user?.email}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>TELÉFONO</label>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#343a40' }}>{user?.phone || 'No registrado'}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 24 }}>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '12px 24px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <i className="fa fa-sign-out" style={{ marginRight: 8 }} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40', marginBottom: 24 }}>Mis Reservas</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
                <button
                  onClick={() => setShowPayments((s) => !s)}
                  style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  {showPayments ? 'Ocultar historial de pagos' : 'Mostrar historial de pagos'}
                </button>
                {showPayments && (
                  <div style={{ fontSize: 13, color: '#475569' }}>{bookings.filter(b => b.payment_status === 'paid').length} pagos encontrados</div>
                )}
              </div>
              {showPayments && (
                <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 16, marginBottom: 18 }}>
                  <h3 style={{ margin: 0, marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Historial de pagos</h3>
                  {bookings.filter(b => b.payment_status === 'paid').length === 0 ? (
                    <p style={{ color: '#64748b' }}>No hay pagos registrados.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {bookings.filter(b => b.payment_status === 'paid').map((p) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 6, background: '#f8fafc' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{p.booking_type} — {p.booking_reference}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(p.created_at).toLocaleString()}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{fmtPrice(p.total_amount, p.currency || 'EUR')}</div>
                            <button onClick={() => printReceipt(p)} style={{ background: '#003580', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Imprimir</button>
                            <button onClick={() => downloadPdf(p)} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Descargar PDF</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 18, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Total reservas</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{paymentCount}</div>
                </div>
                <div style={{ background: '#ecfdf5', borderRadius: 10, padding: 18, border: '1px solid #d1fae5' }}>
                  <div style={{ fontSize: 11, color: '#15803d', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Pagadas</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#065f46' }}>{paidCount}</div>
                  <div style={{ fontSize: 13, color: '#065f46', marginTop: 6 }}>{fmtPrice(totalPaid, bookings[0]?.currency || 'EUR')}</div>
                </div>
                <div style={{ background: '#fffbeb', borderRadius: 10, padding: 18, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 11, color: '#92400e', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Pendientes</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#78350f' }}>{pendingCount}</div>
                  <div style={{ fontSize: 13, color: '#78350f', marginTop: 6 }}>{fmtPrice(totalPending, bookings[0]?.currency || 'EUR')}</div>
                </div>
              </div>

              {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #003580', borderTop: '4px solid #e5e5e5', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ color: '#64748b' }}>Cargando reservas...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {error && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: 6, padding: '12px 14px', color: '#dc2626', marginBottom: 24 }}>
                  {error}
                </div>
              )}

              {!loading && bookings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {bookings.map((booking) => (
                    <div key={booking.id} style={{ border: '1px solid #e5e5e5', borderRadius: 6, padding: 20, background: '#fafbfc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>REFERENCIA</p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: '#003580' }}>{booking.booking_reference}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ background: booking.status === 'confirmed' ? '#d1fae5' : booking.status === 'pending' ? '#fef3c7' : '#fee2e2', color: booking.status === 'confirmed' ? '#065f46' : booking.status === 'pending' ? '#92400e' : '#991b1b', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 12 }}>
                            {booking.status === 'confirmed' ? 'Confirmada' : booking.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                          </span>
                          <span style={{ background: booking.payment_status === 'paid' ? '#d1fae5' : '#fef3c7', color: booking.payment_status === 'paid' ? '#065f46' : '#92400e', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 12 }}>
                            {booking.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 16 }}>
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TIPO</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#343a40' }}>
                            {booking.booking_type === 'flight' ? '✈️ Vuelo' : booking.booking_type === 'bus' ? '🚌 Bus' : booking.booking_type === 'cab' ? '🚕 Taxi' : booking.booking_type}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>FECHA SALIDA</p>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#343a40' }}>{fmtDate(booking.departure_date)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TOTAL</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#003580' }}>{fmtPrice(booking.total_amount, booking.currency || 'USD')}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        <button
                          onClick={() => window.open(`/reserva/${booking.id}`, '_blank')}
                          style={{ background: '#003580', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Ver reserva
                        </button>
                        <button
                          onClick={() => printReceipt(booking)}
                          style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Imprimir / Descargar PDF
                        </button>
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
              ) : !loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fa fa-inbox" style={{ fontSize: 48, color: '#cbd5e1', display: 'block', marginBottom: 16 }} />
                  <p style={{ fontSize: 16, color: '#64748b', marginBottom: 20 }}>No tienes reservas aún</p>
                  <a href="/" style={{ background: '#003580', color: '#fff', padding: '12px 24px', borderRadius: 4, textDecoration: 'none', display: 'inline-block', fontSize: 13, fontWeight: 600 }}>
                    Crear una reserva
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
