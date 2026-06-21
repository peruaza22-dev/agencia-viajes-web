'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function FlightCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [contact, setContact] = useState({ firstName: '', lastName: '', email: '', phone: '' });

  const flightId = searchParams.get('flightId') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const dep = searchParams.get('dep') ?? '';
  const adults = parseInt(searchParams.get('adults') ?? '1');
  const price = parseFloat(searchParams.get('price') ?? '0');
  const flightNo = searchParams.get('flightNo') ?? '';
  const airline = decodeURIComponent(searchParams.get('airline') ?? '');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
  const stripePub = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PK || '';
  const stripePromise = useMemo(() => (stripePub ? loadStripe(stripePub) : null), [stripePub]);

  const departureAt = dep.includes('T') ? dep : `${dep}T09:00:00`;
  const arrivalAt = dep.includes('T') ? dep : `${dep}T11:00:00`;
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 15000); // actualizar cada 15s
    return () => clearInterval(t);
  }, []);

  const departureDate = new Date(departureAt);
  const timeLeftMs = departureDate.getTime() - nowTs;
  const daysLeft = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
  const countdownText = timeLeftMs <= 0
    ? 'Salida en curso o ya pasó'
    : daysLeft > 0
      ? `${daysLeft} día${daysLeft > 1 ? 's' : ''} ${hoursLeft}h ${minutesLeft}m`
      : `${hoursLeft}h ${minutesLeft}m`;
  const totalWindowMs = 72 * 60 * 60 * 1000;
  const progressValue = timeLeftMs <= 0
    ? 100
    : timeLeftMs >= totalWindowMs
      ? 0
      : Math.round(((totalWindowMs - timeLeftMs) / totalWindowMs) * 100);

  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const elementsOptions = useMemo(() => ({ clientSecret: paymentClientSecret, appearance: { theme: 'stripe' } }), [paymentClientSecret]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email) { setErr('El email es obligatorio'); return; }
    setLoading(true); setErr('');

    const passengers = Array.from({ length: adults }, (_v, idx) => ({
      firstName: contact.firstName || `Pasajero ${idx + 1}`,
      lastName: contact.lastName || '',
      email: contact.email,
      phone: contact.phone,
      dateOfBirth: '1990-01-01'
    }));

    const selectedOffer = {
      id: flightId,
      total_price: price.toString(),
      price: {
        currency: 'EUR',
        total: price.toString(),
        base: (price * 0.85).toFixed(2)
      },
      validatingAirlineCodes: [airline.split(' ')[0] || ''],
      itineraries: [
        {
          segments: [
            {
              departure: { iataCode: from, at: departureAt, terminal: '1' },
              arrival: { iataCode: to, at: arrivalAt, terminal: '2' },
              carrierCode: airline.split(' ')[0] || '',
              number: flightNo,
              aircraft: { code: '320' },
              duration: 'PT2H00M',
              numberOfStops: 0
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'flight',
          passengers,
          selected_offer: selectedOffer,
          search_params: { origin: from, destination: to, departureDate: dep },
          contact
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Error al procesar la reserva');
      }

      const booking = result.data;
      // Crear PaymentIntent en el servidor
      try {
        const piRes = await fetch(`${API}/payment/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: price, currency: 'EUR', bookingId: booking.id, description: `Reserva ${booking.booking_reference || booking.id}` })
        });
        const piJson = await piRes.json();
        if (piRes.ok && piJson.data?.clientSecret) {
          if (!stripePromise) {
            setErr('El pago no está disponible en este momento. Por favor, contacta al soporte.');
            return;
          }
          setPaymentClientSecret(piJson.data.clientSecret);
          setShowPaymentModal(true);
        } else {
          // Si no hay Stripe o falla, redirigir a reservas (flujo fallback)
          router.push('/mis-reservas');
        }
      } catch (err) {
        router.push('/mis-reservas');
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al procesar la reserva');
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  function PaymentModalInner({ clientSecret, bookingEmail }: { clientSecret: string; bookingEmail?: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [payLoading, setPayLoading] = useState(false);
    const [payError, setPayError] = useState('');
    const [elementReady, setElementReady] = useState(false);
    const [elementTimeout, setElementTimeout] = useState(false);
    const billingName = `${contact.firstName || 'Titular'} ${contact.lastName || ''}`.trim();

    useEffect(() => {
      let mounted = true;
      let checks = 0;
      const interval = setInterval(() => {
        checks += 1;
        try {
          if (!mounted) return;
          if (elements && elements.getElement && elements.getElement(PaymentElement)) {
            setElementReady(true);
            clearInterval(interval);
          } else if (checks > 20) {
            // ~20 * 700ms = 14s timeout
            setElementTimeout(true);
            clearInterval(interval);
          }
        } catch (e) {
          // ignore
        }
      }, 700);
      return () => { mounted = false; clearInterval(interval); };
    }, [elements]);

    const handlePay = async () => {
      if (!stripe || !elements) return;
      setPayLoading(true); setPayError('');
      const paymentElement = elements.getElement(PaymentElement);
      if (!paymentElement) {
        setPayError('No se pudo cargar el formulario de pago. Recarga la página e inténtalo de nuevo.');
        setPayLoading(false);
        return;
      }

      const res = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          receipt_email: bookingEmail || contact.email,
          payment_method_data: {
            billing_details: {
              name: billingName,
              email: bookingEmail || contact.email,
            },
          },
        },
      });

      if (res.error) {
        setPayError(res.error.message || 'Error procesando pago');
        setPayLoading(false);
        return;
      }

      if (res.paymentIntent && res.paymentIntent.status === 'succeeded') {
        setShowPaymentModal(false);
        router.push('/mis-reservas');
      } else {
        setPayError('Pago no completado');
      }

      setPayLoading(false);
    };

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onKeyDown={(e) => { if (e.key === 'Escape') setShowPaymentModal(false); }}>
        <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 12, padding: 20, margin: '0 16px', boxSizing: 'border-box', maxHeight: '90vh', overflow: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>Pagar con tarjeta</h3>
          <div style={{ marginBottom: 12 }}>
            <label className="text-sm font-medium text-gray-700">Titular de la tarjeta</label>
            <input
              type="text"
              value={billingName}
              readOnly
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-slate-50 mt-2"
            />
          </div>
          <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!elementReady && !elementTimeout && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="fa fa-spinner fa-spin" style={{ fontSize: 18 }} />
                <span style={{ color: '#475569' }}>Cargando formulario de pago…</span>
              </div>
            )}
            {elementTimeout && (
              <div style={{ color: '#dc2626' }}>No se pudo cargar el formulario de pago. Intenta recargar o contacta soporte.</div>
            )}
            <div style={{ width: '100%' }}>
              <PaymentElement options={{ layout: 'tabs' }} />
            </div>
          </div>
          <p style={{ marginBottom: 12, color: '#475569', fontSize: 13 }}>
            Selecciona la forma de pago disponible: tarjeta, cuenta bancaria o Link si tu cuenta Stripe lo permite.
          </p>
          {payError && <div style={{ color: '#dc2626', marginBottom: 8 }}>{payError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePay} disabled={payLoading} style={{ flex: 1, background: '#003580', color: '#fff', padding: '10px 12px', borderRadius: 8, border: 'none' }}>{payLoading ? 'Procesando...' : 'Pagar ahora'}</button>
            <button onClick={() => { setShowPaymentModal(false); }} style={{ background: '#e5e7eb', color: '#0f172a', padding: '10px 12px', borderRadius: 8, border: 'none' }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <Link href="/vuelos" className="text-sm text-primary inline-flex items-center gap-2 mb-4 hover:underline">
        <i className="fa fa-arrow-left" />Volver a resultados
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 font-poppins mb-6">Checkout — Vuelo</h1>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-gray-600">
        <p><strong className="text-primary">{from} → {to}</strong> · {dep} · {adults} pasajero{adults > 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-2">Tiempo restante de salida</p>
            <h2 className="text-xl font-bold text-gray-800">{countdownText}</h2>
            <p className="text-sm text-gray-500 mt-1">Hora estimada de partida: {new Date(departureAt).toLocaleString()}</p>
          </div>
          <div style={{ minWidth: 160, flex: '1 1 200px' }}>
            <div style={{ background: '#e2e8f0', borderRadius: 9999, height: 12, overflow: 'hidden' }}>
              <div style={{ width: `${progressValue}%`, height: '100%', background: '#0f172a' }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Progreso de preparación: {progressValue}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-bold text-gray-600 text-xs uppercase mb-4">Resumen de la reserva</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Vuelo</p>
            <p className="font-semibold text-gray-800">{airline} {flightNo}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Precio total</p>
            <p className="font-semibold text-gray-800">{price.toFixed(2)} EUR</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Origen / destino</p>
            <p className="font-semibold text-gray-800">{from} → {to}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Pasajeros</p>
            <p className="font-semibold text-gray-800">{adults} pasajero{adults > 1 ? 's' : ''}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors"
        >
          <i className="fa fa-user-plus mr-2" />Reservar como invitado
        </button>
        {user ? (
          <p className="text-xs text-gray-500 mt-3">Ya estás conectado como {user.email}. Si deseas, puedes dejar los datos de contacto para la confirmación.</p>
        ) : (
          <p className="text-xs text-gray-500 mt-3">No es necesario crear cuenta para reservar. Solo necesitamos tu correo y datos básicos.</p>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 24, padding: 28, position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 18, right: 18, border: 'none', background: 'transparent', color: '#334155', fontSize: 18, cursor: 'pointer' }}
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Reserva como invitado</h2>
            <p className="text-sm text-gray-500 mb-6">Completa tus datos para enviar la confirmación y ver tu reserva en la sección de invitado.</p>
            <form onSubmit={handleBook}>
              {err && <p className="text-red-500 text-sm mb-4">{err}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {(['firstName', 'lastName', 'email', 'phone'] as const).map((k) => (
                  <div key={k}>
                    <label className="text-xs text-gray-400 uppercase block mb-1">
                      {k === 'firstName' ? 'Nombre' : k === 'lastName' ? 'Apellidos' : k === 'email' ? 'Email *' : 'Teléfono'}
                    </label>
                    <input
                      type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
                      value={contact[k]}
                      onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 flex-1"
                >
                  {loading ? <><i className="fa fa-spinner fa-spin mr-2" />Procesando...</> : <><i className="fa fa-lock mr-2" />Confirmar reserva</>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-100 text-gray-700 py-3 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentClientSecret && stripePromise && (
        <Elements stripe={stripePromise} options={elementsOptions}>
          {showPaymentModal && <PaymentModalInner clientSecret={paymentClientSecret} bookingEmail={contact.email} />}
        </Elements>
      )}
    </div>
  );
}
