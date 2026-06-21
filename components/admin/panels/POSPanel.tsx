"use client";

import { useState } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { loadStripe, type StripeCardElement } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function POSPanel() {
  const { adminFetch, API } = useAdminFetch();
  const [ref, setRef] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const stripePub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PK || '';
  const stripePromise = stripePub ? loadStripe(stripePub) : null;

  const fetchBooking = async () => {
    if (!ref) return;
    setLoading(true); setMsg(''); setBooking(null);
    try {
      const r = await fetch(`${API}/bookings/reference/${encodeURIComponent(ref)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'No encontrada');
      setBooking(d.data);
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  const markOffice = async () => {
    if (!booking?.id) return;
    setLoading(true); setMsg('');
    try {
      const r = await adminFetch(`${API}/payment/office-payment`, { method: 'POST', body: JSON.stringify({ bookingId: booking.id, amount: booking.total_amount, currency: booking.currency, method: 'cash', notes: 'Pago presencial' }) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message || 'Error');
      setMsg('Pago registrado en oficina. Reserva confirmada.');
      fetchBooking();
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  const startCard = async () => {
    if (!booking?.id) return;
    setLoading(true); setMsg('');
    try {
      const r = await fetch(`${API}/payment/create-intent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: booking.total_amount, currency: booking.currency || 'EUR', bookingId: booking.id, description: `Reserva ${booking.booking_reference}` }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error creando intent');
      setClientSecret(d.data.clientSecret);
    } catch (e: any) { setMsg(e.message); }
    finally { setLoading(false); }
  };

  function CardPay({ secret }: { secret: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [pl, setPl] = useState(false);
    const [err, setErr] = useState('');

    const doPay = async () => {
      if (!stripe || !elements) return;
      setPl(true); setErr('');
      const card = elements.getElement(CardElement);
      if (!card) {
        setErr('No se pudo inicializar la tarjeta. Recarga la página e inténtalo de nuevo.');
        setPl(false);
        return;
      }
      const res = await stripe.confirmCardPayment(secret, { payment_method: { card: card as StripeCardElement } });
      if (res.error) { setErr(res.error.message || 'Error'); setPl(false); return; }
      if (res.paymentIntent && res.paymentIntent.status === 'succeeded') {
        setMsg('Pago con tarjeta completado.');
        setClientSecret(null);
        fetchBooking();
      } else { setErr('Pago no completado'); }
      setPl(false);
    };

    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}><CardElement /></div>
        {err && <div style={{ color: '#b91c1c', marginTop: 8 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={doPay} disabled={pl} className="adm-btn primary">{pl ? 'Procesando...' : 'Cobrar con tarjeta'}</button>
          <button onClick={() => setClientSecret(null)} className="adm-btn outline">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="adm-card">
        <div className="adm-card-header"><span className="adm-card-title"><i className="fa-solid fa-cash-register" /> Punto de Venta (POS)</span></div>
        <div className="adm-card-body">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Referencia reserva" className="adm-input" />
            <button className="adm-btn primary" onClick={fetchBooking} disabled={loading}>Buscar</button>
          </div>
          {msg && <div style={{ marginBottom: 12, color: '#064e3b' }}>{msg}</div>}
          {booking && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{booking.booking_reference} — {booking.booking_type}</div>
              <div style={{ color: '#64748b' }}>{booking.customer_name} · {booking.customer_email}</div>
              <div style={{ marginTop: 8, fontWeight: 800 }}>{booking.total_amount} {booking.currency}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="adm-btn" onClick={markOffice}>Pagar en efectivo / marcar recibido</button>
                <button className="adm-btn outline" onClick={startCard}>Cobrar con tarjeta</button>
              </div>
            </div>
          )}

          {clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CardPay secret={clientSecret} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
