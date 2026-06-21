'use client';

/**
 * AgentPanel — Modo Agente
 * Buscador completo igual al frontend: Ida / Ida y Vuelta / Multi-destino
 * Autocompletado de aeropuertos, calendarios AdminDatePicker, pasajeros
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import AdminDatePicker from '../ui/AdminDatePicker';

interface Props { role: AdminRole; }

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (n: number, cur = 'EUR') =>
  `${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${cur}`;

function fmtDur(iso: string) {
  if (!iso) return '—';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  return m ? `${m[1] || 0}h ${m[2] || 0}m` : iso;
}
function fmtTime(iso: string) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); } catch { return '—'; }
}
function extractIATA(val: string): string {
  return val.match(/\(([A-Z]{3})\)/)?.[1] || val.trim().toUpperCase().slice(0, 3);
}

// ── AirportInput con autocompletado ──────────────────────────────────────────
function AirportInput({ label, value, onChange, placeholder, adminFetch, API, isDestination = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; adminFetch: any; API: string; isDestination?: boolean;
}) {
  const [sugs, setSugs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = async (v: string) => {
    onChange(v);
    if (v.length < 2) { setSugs([]); setOpen(false); return; }
    try {
      const r = await fetch(`${API}/airports/search?q=${encodeURIComponent(v)}&limit=6`);
      const d = await r.json();
      const list = d.data || d.airports || [];
      setSugs(list);
      setOpen(list.length > 0);
    } catch { setSugs([]); setOpen(false); }
  };

  const pick = (a: any) => {
    const code = a.code || a.iata_code || a.iataCode || '';
    const city = a.city || a.cityName || a.name || code;
    onChange(`${city} (${code})`);
    setSugs([]); setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label className="adm-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <i className={`fa-solid ${isDestination ? 'fa-plane-arrival' : 'fa-plane-departure'}`} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-text-muted)', fontSize: 13, pointerEvents: 'none' }} />
        <input
          className="adm-input"
          style={{ paddingLeft: 32 }}
          value={value}
          onChange={e => handleInput(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {open && sugs.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid var(--adm-primary)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 9999, overflow: 'hidden' }}>
          {sugs.map((a, i) => {
            const code = a.code || a.iata_code || a.iataCode || '';
            const city = a.city || a.cityName || code;
            const name = a.name || '';
            const country = a.country || a.countryName || '';
            return (
              <button key={code + i} type="button" onClick={() => pick(a)}
                style={{ width: '100%', textAlign: 'left', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, borderBottom: i < sugs.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--adm-primary)', minWidth: 36, fontFamily: 'monospace' }}>{code}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{city}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{name}{country ? ` · ${country}` : ''}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Leg { id: number; from: string; to: string; date: Date | null; }

// ── Componente principal ──────────────────────────────────────────────────────
export default function AgentPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { isAdmin, isManager, can } = useAdminRole(role);

  const [tripType, setTripType] = useState<'oneway' | 'roundtrip' | 'multi'>('oneway');
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');
  const [depDate,  setDepDate]  = useState<Date | null>(null);
  const [retDate,  setRetDate]  = useState<Date | null>(null);
  const [adults,   setAdults]   = useState(1);
  const [children, setChildren] = useState(0);
  const [infants,  setInfants]  = useState(0);
  const [cabin,    setCabin]    = useState('ECONOMY');
  const [legs,     setLegs]     = useState<Leg[]>([
    { id: 1, from: '', to: '', date: null },
    { id: 2, from: '', to: '', date: null },
  ]);

  const [searching,   setSearching]   = useState(false);
  const [flights,     setFlights]     = useState<any[]>([]);
  const [margin,      setMargin]      = useState(0);
  const [searchError, setSearchError] = useState('');
  const [selected,    setSelected]    = useState<any>(null);
  const [extraBags,   setExtraBags]   = useState(0);
  const [custName,    setCustName]    = useState('');
  const [custEmail,   setCustEmail]   = useState('');
  const [custPhone,   setCustPhone]   = useState('');
  const [payMethod,   setPayMethod]   = useState<'office' | 'payment_link' | 'bank_transfer'>('office');
  const [bookNotes,   setBookNotes]   = useState('');
  const [booking,     setBooking]     = useState(false);
  const [bookResult,  setBookResult]  = useState<any>(null);
  const [bookError,   setBookError]   = useState('');
  const [linkUrl,     setLinkUrl]     = useState('');
  const [sendingLink, setSendingLink] = useState(false);

  const updateLeg = (id: number, field: keyof Leg, value: any) =>
    setLegs(ls => ls.map(l => l.id === id ? { ...l, [field]: value } : l));

  const search = useCallback(async () => {
    setSearching(true); setSearchError(''); setFlights([]); setSelected(null); setBookResult(null);
    try {
      let payload: any;
      if (tripType === 'multi') {
        const valid = legs.filter(l => l.from && l.to && l.date);
        if (valid.length < 2) { setSearchError('Completa al menos 2 tramos'); setSearching(false); return; }
        payload = { from: extractIATA(valid[0].from), to: extractIATA(valid[0].to), departure: valid[0].date!.toISOString().split('T')[0], adults, cabinClass: cabin, showMargin: true };
      } else {
        if (!from || !to || !depDate) { setSearchError('Completa origen, destino y fecha de salida'); setSearching(false); return; }
        payload = {
          from: extractIATA(from), to: extractIATA(to),
          departure: depDate.toISOString().split('T')[0],
          ...(tripType === 'roundtrip' && retDate ? { returnDate: retDate.toISOString().split('T')[0] } : {}),
          adults, cabinClass: cabin, showMargin: true,
        };
      }
      const r = await adminFetch(`${API}/admin/agent/search-flights`, { method: 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message || 'Error en búsqueda');
      setFlights(d.data || []);
      setMargin(d.meta?.margin || 0);
      if (!(d.data || []).length) setSearchError('No se encontraron vuelos para esta ruta y fecha.');
    } catch (e: any) { setSearchError(e.message); }
    finally { setSearching(false); }
  }, [tripType, from, to, depDate, retDate, adults, cabin, legs, adminFetch, API]);

  const createBooking = async () => {
    if (!selected || !custName || !custEmail) { setBookError('Nombre y email del cliente requeridos'); return; }
    setBooking(true); setBookError(''); setBookResult(null); setLinkUrl('');
    try {
      const parts = custName.trim().split(' ');
      const r = await adminFetch(`${API}/admin/agent/create-booking`, {
        method: 'POST',
        body: JSON.stringify({
          flight: selected,
          passengers: [{ firstName: parts[0], lastName: parts.slice(1).join(' ') || parts[0], email: custEmail, phone: custPhone }],
          customerName: custName, customerEmail: custEmail, customerPhone: custPhone,
          paymentMethod: payMethod,
          notes: extraBags > 0 ? `${bookNotes} +${extraBags} maleta${extraBags > 1 ? 's' : ''} adicional${extraBags > 1 ? 'es' : ''} de bodega`.trim() : bookNotes,
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message || 'Error al crear reserva');
      setBookResult(d);
      if (payMethod === 'payment_link') {
        setSendingLink(true);
        const lr = await adminFetch(`${API}/payment/create-link`, {
          method: 'POST',
          body: JSON.stringify({ amount: selected._agentInfo?.finalPrice || parseFloat(selected.price?.total || '0'), currency: selected.price?.currency || 'EUR', bookingId: d.data?.id, bookingRef: d.bookingRef, description: `Vuelo ${extractIATA(from)} → ${extractIATA(to)}`, customerEmail: custEmail }),
        });
        const ld = await lr.json();
        if (ld.success) setLinkUrl(ld.data.url);
        setSendingLink(false);
      }
    } catch (e: any) { setBookError(e.message); }
    finally { setBooking(false); }
  };

  const resetAll = () => { setBookResult(null); setSelected(null); setCustName(''); setCustEmail(''); setCustPhone(''); setLinkUrl(''); setBookError(''); setExtraBags(0); };

  const TRIP_TABS = [
    { id: 'oneway' as const,    label: 'Solo Ida',      icon: 'fa-arrow-right' },
    { id: 'roundtrip' as const, label: 'Ida y Vuelta',  icon: 'fa-arrows-left-right' },
    { id: 'multi' as const,     label: 'Multi-destino', icon: 'fa-route' },
  ];

  return (
    <PermissionGuard allowed={isAdmin || isManager || can('bookings_edit')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', fontSize: 13, display: 'flex', gap: 10 }}>
          <i className="fa-solid fa-user-tie" style={{ color: '#0284c7', marginTop: 2, flexShrink: 0 }} />
          <span><strong>Modo Agente</strong> — Busca vuelos para un cliente en oficina. Ves el precio real de Amadeus + tu margen. El cliente solo recibe el email con el precio final.</span>
        </div>

        {/* Buscador */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-magnifying-glass" /> Buscar vuelos</span>
          </div>
          <div className="adm-card-body">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#f8fafc', borderRadius: 10, padding: 4 }}>
              {TRIP_TABS.map(t => (
                <button key={t.id} type="button" onClick={() => { setTripType(t.id); setFlights([]); setSearchError(''); }}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: tripType === t.id ? 700 : 400, background: tripType === t.id ? 'var(--adm-primary)' : 'transparent', color: tripType === t.id ? '#fff' : 'var(--adm-text-muted)', cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className={`fa-solid ${t.icon}`} style={{ fontSize: 11 }} />{t.label}
                </button>
              ))}
            </div>

            {/* Ida / Ida y Vuelta */}
            {(tripType === 'oneway' || tripType === 'roundtrip') && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                <AirportInput label="Desde" value={from} onChange={setFrom} placeholder="Ciudad o aeropuerto" adminFetch={adminFetch} API={API} />
                <AirportInput label="Hasta" value={to} onChange={setTo} placeholder="Ciudad o aeropuerto" adminFetch={adminFetch} API={API} isDestination />
                <div className="adm-form-group" style={{ marginBottom: 0 }}>
                  <label className="adm-label">Fecha de salida</label>
                  <AdminDatePicker value={depDate} onChange={setDepDate} placeholder="dd/mm/aaaa" />
                </div>
                {tripType === 'roundtrip' && (
                  <div className="adm-form-group" style={{ marginBottom: 0 }}>
                    <label className="adm-label">Fecha de regreso</label>
                    <AdminDatePicker value={retDate} onChange={setRetDate} placeholder="dd/mm/aaaa" minDate={depDate || new Date()} />
                  </div>
                )}
              </div>
            )}

            {/* Multi-destino */}
            {tripType === 'multi' && (
              <div style={{ marginBottom: 16 }}>
                {legs.map((leg, idx) => (
                  <div key={leg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 10, background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--adm-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginBottom: 4 }}>{idx + 1}</div>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                      <AirportInput label="Desde" value={leg.from} onChange={v => updateLeg(leg.id, 'from', v)} placeholder="Origen" adminFetch={adminFetch} API={API} />
                      <AirportInput label="Hasta" value={leg.to} onChange={v => updateLeg(leg.id, 'to', v)} placeholder="Destino" adminFetch={adminFetch} API={API} isDestination />
                      <div className="adm-form-group" style={{ marginBottom: 0 }}>
                        <label className="adm-label">Fecha</label>
                        <AdminDatePicker value={leg.date} onChange={d => updateLeg(leg.id, 'date', d)} placeholder="dd/mm/aaaa" minDate={idx > 0 && legs[idx - 1].date ? legs[idx - 1].date! : new Date()} />
                      </div>
                    </div>
                    <button type="button" onClick={() => legs.length > 2 && setLegs(ls => ls.filter(l => l.id !== leg.id))} disabled={legs.length <= 2}
                      style={{ background: 'none', border: 'none', cursor: legs.length <= 2 ? 'not-allowed' : 'pointer', color: legs.length <= 2 ? '#cbd5e1' : '#ef4444', fontSize: 18, padding: '0 4px', marginBottom: 4 }}>
                      <i className="fa-solid fa-circle-xmark" />
                    </button>
                  </div>
                ))}
                {legs.length < 6 && (
                  <button type="button" className="adm-btn outline sm" onClick={() => setLegs(ls => [...ls, { id: Date.now(), from: '', to: '', date: null }])}>
                    <i className="fa-solid fa-plus" /> Añadir tramo
                  </button>
                )}
              </div>
            )}

            {/* Pasajeros, cabina y maletas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
              {([['Adultos', adults, setAdults, 1], ['Niños', children, setChildren, 0], ['Bebés', infants, setInfants, 0]] as [string, number, (n: number) => void, number][]).map(([label, val, set, min]) => (
                <div key={label} className="adm-form-group" style={{ marginBottom: 0 }}>
                  <label className="adm-label">{label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, border: '1.5px solid var(--adm-border)', borderRadius: 8, padding: '0 8px', background: '#fff' }}>
                    <button type="button" onClick={() => set(Math.max(min, val - 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-primary)', fontSize: 16, padding: '0 4px', lineHeight: 1 }}>−</button>
                    <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{val}</span>
                    <button type="button" onClick={() => set(Math.min(9, val + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-primary)', fontSize: 16, padding: '0 4px', lineHeight: 1 }}>+</button>
                  </div>
                </div>
              ))}
              <div className="adm-form-group" style={{ marginBottom: 0 }}>
                <label className="adm-label">Cabina</label>
                <select className="adm-select" value={cabin} onChange={e => setCabin(e.target.value)}>
                  <option value="ECONOMY">Economy</option>
                  <option value="PREMIUM_ECONOMY">Premium Economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">Primera</option>
                </select>
              </div>
              {/* Maletas adicionales — visible desde el buscador */}
              <div className="adm-form-group" style={{ marginBottom: 0 }}>
                <label className="adm-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="fa-solid fa-suitcase-rolling" style={{ color: 'var(--adm-primary)', fontSize: 11 }} />
                  Maletas extra
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, border: '1.5px solid var(--adm-border)', borderRadius: 8, padding: '0 8px', background: '#fff' }}>
                  <button type="button" onClick={() => setExtraBags(b => Math.max(0, b - 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-primary)', fontSize: 16, padding: '0 4px', lineHeight: 1 }}>−</button>
                  <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{extraBags}</span>
                  <button type="button" onClick={() => setExtraBags(b => Math.min(5, b + 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-primary)', fontSize: 16, padding: '0 4px', lineHeight: 1 }}>+</button>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>bodega adicional</div>
              </div>
            </div>

            {/* Resumen de maletas si hay extras */}
            {extraBags > 0 && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-suitcase-rolling" style={{ color: '#0284c7', fontSize: 16 }} />
                <span>
                  El cliente necesita <strong>{extraBags} maleta{extraBags > 1 ? 's' : ''} adicional{extraBags > 1 ? 'es' : ''} de bodega</strong>.
                  Se anotará en la reserva y podrás añadirlas desde el panel de reservas → "Añadir equipaje".
                </span>
              </div>
            )}

            {searchError && <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 10, background: '#fee2e2', padding: '8px 12px', borderRadius: 8 }}><i className="fa-solid fa-circle-exclamation" style={{ marginRight: 6 }} />{searchError}</div>}
            <button className="adm-btn primary" onClick={search} disabled={searching} style={{ minWidth: 160 }}>
              {searching ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Buscando…</> : <><i className="fa-solid fa-magnifying-glass" /> Buscar vuelos</>}
            </button>
          </div>
        </div>

        {/* Resultados */}
        {flights.length > 0 && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title"><i className="fa-solid fa-plane" /> {flights.length} vuelos · Margen: {margin}%</span>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Ruta</th><th>Horario</th><th>Duración</th><th>Escalas</th><th>Equipaje</th><th style={{ color: '#94a3b8' }}>Precio Amadeus</th><th>Precio cliente</th><th style={{ color: '#10b981' }}>Tu ganancia</th><th></th></tr>
                </thead>
                <tbody>
                  {flights.map((f, i) => {
                    const seg = f.itineraries?.[0]?.segments || [];
                    const first = seg[0] || {}, last = seg[seg.length - 1] || {};
                    const info = f._agentInfo || {}, isSel = selected?.id === f.id;
                    return (
                      <tr key={f.id || i} style={{ background: isSel ? '#f0f7ff' : undefined, cursor: 'pointer' }} onClick={() => setSelected(isSel ? null : f)}>
                        <td>
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 15 }}>{first.from || first.departure?.iataCode || '?'}</span>
                          <i className="fa-solid fa-arrow-right" style={{ margin: '0 6px', fontSize: 10, color: '#94a3b8' }} />
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 15 }}>{last.to || last.arrival?.iataCode || '?'}</span>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{first.carrierCode || first.carrier || ''}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{fmtTime(first.fromTime || first.departure?.at)}<span style={{ color: '#94a3b8', margin: '0 4px' }}>→</span>{fmtTime(last.toTime || last.arrival?.at)}</td>
                        <td style={{ fontSize: 12 }}>{fmtDur(f.itineraries?.[0]?.duration)}</td>
                        <td><span className={`adm-badge ${seg.length <= 1 ? 'success' : 'default'}`}>{seg.length <= 1 ? 'Directo' : `${seg.length - 1} escala${seg.length > 2 ? 's' : ''}`}</span></td>
                        <td>
                          {/* Equipaje de cabina */}
                          {(() => {
                            const bag = f.baggage;
                            const fareSegs = f.travelerPricings?.[0]?.fareDetailsBySegment || [];
                            // Buscar en fareDetailsBySegment de todos los segmentos
                            const allBags = fareSegs.flatMap((fs: any) => {
                              const items = [];
                              if (fs.includedCheckedBags?.quantity > 0 || fs.includedCheckedBags?.weight > 0) {
                                items.push({ type: 'bodega', ...fs.includedCheckedBags });
                              }
                              if (fs.includedCabinBags?.quantity > 0) {
                                items.push({ type: 'cabina', ...fs.includedCabinBags });
                              }
                              return items;
                            });
                            // Deduplicar
                            const bodega = allBags.find((b: any) => b.type === 'bodega');
                            const cabina = allBags.find((b: any) => b.type === 'cabina');
                            if (!bodega && !cabina && !bag) {
                              return <span style={{ fontSize: 11, color: '#94a3b8' }}>Solo mano</span>;
                            }
                            return (
                              <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {cabina && (
                                  <span style={{ color: '#0284c7' }}>
                                    <i className="fa-solid fa-briefcase" style={{ marginRight: 3 }} />
                                    Cabina: {cabina.quantity || 1}×{cabina.weight ? ` ${cabina.weight}${cabina.weightUnit || 'kg'}` : ''}
                                  </span>
                                )}
                                {(bodega || bag) && (
                                  <span style={{ color: '#16a34a', fontWeight: 600 }}>
                                    <i className="fa-solid fa-suitcase" style={{ marginRight: 3 }} />
                                    Bodega: {bodega?.quantity || bag?.count || 1}×{bodega?.weight ? ` ${bodega.weight}${bodega.weightUnit || 'kg'}` : bag?.weight ? ` ${bag.weight}${bag.weightUnit || 'kg'}` : ''}
                                  </span>
                                )}
                                {!bodega && !bag && (
                                  <span style={{ color: '#94a3b8', fontSize: 10 }}>Sin bodega incluida</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>{fmtMoney(info.originalPrice || 0, info.currency)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--adm-primary)' }}>{fmtMoney(info.finalPrice || 0, info.currency)}</td>
                        <td><span style={{ color: '#10b981', fontWeight: 700 }}>+{fmtMoney(info.profit || 0, info.currency)}</span></td>
                        <td><button className={`adm-btn sm ${isSel ? 'primary' : 'outline'}`} onClick={e => { e.stopPropagation(); setSelected(isSel ? null : f); }}>{isSel ? <><i className="fa-solid fa-check" /> Seleccionado</> : 'Seleccionar'}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulario cliente */}
        {selected && !bookResult && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title"><i className="fa-solid fa-user" /> Datos del cliente</span>
              <span style={{ fontSize: 14, color: 'var(--adm-primary)', fontWeight: 700 }}>Total: {fmtMoney(selected._agentInfo?.finalPrice || 0, selected._agentInfo?.currency)}</span>
            </div>
            <div className="adm-card-body">
              {bookError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{bookError}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div className="adm-form-group" style={{ marginBottom: 0 }}><label className="adm-label">Nombre completo *</label><input className="adm-input" placeholder="Juan Pérez" value={custName} onChange={e => setCustName(e.target.value)} /></div>
                <div className="adm-form-group" style={{ marginBottom: 0 }}><label className="adm-label">Email *</label><input className="adm-input" type="email" placeholder="cliente@email.com" value={custEmail} onChange={e => setCustEmail(e.target.value)} /></div>
                <div className="adm-form-group" style={{ marginBottom: 0 }}><label className="adm-label">Teléfono</label><input className="adm-input" placeholder="+34 600 000 000" value={custPhone} onChange={e => setCustPhone(e.target.value)} /></div>
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Método de pago</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {([['office', 'fa-building', 'Pago en oficina'], ['payment_link', 'fa-link', 'Link Stripe'], ['bank_transfer', 'fa-building-columns', 'Transferencia']] as const).map(([val, icon, label]) => (
                    <button key={val} type="button" onClick={() => setPayMethod(val)}
                      style={{ flex: 1, minWidth: 120, padding: '8px 0', borderRadius: 8, border: `2px solid ${payMethod === val ? 'var(--adm-primary)' : 'var(--adm-border)'}`, background: payMethod === val ? '#f0f4ff' : '#fff', color: payMethod === val ? 'var(--adm-primary)' : 'var(--adm-text-muted)', fontWeight: payMethod === val ? 700 : 400, cursor: 'pointer', fontSize: 12 }}>
                      <i className={`fa-solid ${icon}`} style={{ marginRight: 4 }} />{label}
                    </button>
                  ))}
                </div>
                {payMethod === 'payment_link' && <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 6, background: '#f0f9ff', padding: '8px 12px', borderRadius: 6 }}><i className="fa-solid fa-circle-info" style={{ marginRight: 4, color: '#0284c7' }} />Se genera un link de Stripe para enviar al cliente. Paga online y la reserva se confirma automáticamente.</div>}
              </div>
              <div className="adm-form-group"><label className="adm-label">Notas internas</label><input className="adm-input" placeholder="Ej: prefiere ventana, viaja con niño…" value={bookNotes} onChange={e => setBookNotes(e.target.value)} /></div>

              {/* Equipaje adicional */}
              {selected && (() => {
                const fareSegs = selected.travelerPricings?.[0]?.fareDetailsBySegment || [];
                const bodega = fareSegs.find((fs: any) => fs.includedCheckedBags?.quantity > 0 || fs.includedCheckedBags?.weight > 0);
                const bag = selected.baggage;
                const hasChecked = !!(bodega || (bag?.count && bag.count > 0));
                return (
                  <div style={{ background: '#f8fafc', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '14px 16px', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-suitcase" style={{ color: 'var(--adm-primary)' }} />
                      Equipaje incluido en la tarifa
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      {/* Equipaje de mano — siempre incluido */}
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <i className="fa-solid fa-briefcase" style={{ color: '#0284c7', fontSize: 16 }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>Equipaje de mano</div>
                          <div style={{ color: '#64748b', fontSize: 11 }}>1 pieza · incluido</div>
                        </div>
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>✓ Incluido</span>
                      </div>
                      {/* Bodega */}
                      <div style={{ background: '#fff', border: `1px solid ${hasChecked ? '#bbf7d0' : '#fde68a'}`, borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <i className="fa-solid fa-suitcase-rolling" style={{ color: hasChecked ? '#16a34a' : '#d97706', fontSize: 16 }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>Equipaje de bodega</div>
                          <div style={{ color: '#64748b', fontSize: 11 }}>
                            {hasChecked
                              ? `${bodega?.includedCheckedBags?.quantity || bag?.count || 1} maleta${(bodega?.includedCheckedBags?.quantity || bag?.count || 1) > 1 ? 's' : ''} · ${bodega?.includedCheckedBags?.weight || bag?.weight || 23}${bodega?.includedCheckedBags?.weightUnit || bag?.weightUnit || 'kg'}`
                              : 'No incluido en esta tarifa'}
                          </div>
                        </div>
                        <span style={{ background: hasChecked ? '#dcfce7' : '#fef9c3', color: hasChecked ? '#15803d' : '#92400e', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10 }}>
                          {hasChecked ? '✓ Incluido' : '✗ No incluido'}
                        </span>
                      </div>
                    </div>
                    {/* Selector de maletas adicionales */}
                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 8 }}>
                        <i className="fa-solid fa-plus-circle" style={{ color: 'var(--adm-primary)', marginRight: 6 }} />
                        Maletas adicionales de bodega (se añaden post-reserva vía Amadeus)
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button type="button"
                          onClick={() => setBookNotes(n => {
                            const current = parseInt(n.match(/\+(\d+) maleta/)?.[1] || '0');
                            const next = Math.max(0, current - 1);
                            return next === 0 ? n.replace(/\s*\+\d+ maleta[s]? adicional[es]?/, '').trim() : n.replace(/\+\d+ maleta[s]? adicional[es]?/, `+${next} maleta${next > 1 ? 's' : ''} adicional${next > 1 ? 'es' : ''}`);
                          })}
                          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--adm-border)', background: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-primary)' }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 16, minWidth: 24, textAlign: 'center' }}>
                          {parseInt(bookNotes.match(/\+(\d+) maleta/)?.[1] || '0')}
                        </span>
                        <button type="button"
                          onClick={() => setBookNotes(n => {
                            const current = parseInt(n.match(/\+(\d+) maleta/)?.[1] || '0');
                            const next = Math.min(5, current + 1);
                            if (current === 0) return `${n} +${next} maleta adicional`.trim();
                            return n.replace(/\+\d+ maleta[s]? adicional[es]?/, `+${next} maleta${next > 1 ? 's' : ''} adicional${next > 1 ? 'es' : ''}`);
                          })}
                          style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--adm-primary)', background: '#f0f4ff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-primary)' }}>+</button>
                        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>maleta(s) extra de bodega</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                        <i className="fa-solid fa-circle-info" style={{ marginRight: 4 }} />
                        Las maletas adicionales se gestionan desde el panel de reservas → "Añadir equipaje" después de confirmar.
                      </div>
                    </div>
                  </div>
                );
              })()}
              <button className="adm-btn primary" onClick={createBooking} disabled={booking} style={{ minWidth: 160 }}>
                {booking ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Creando…</> : <><i className="fa-solid fa-check" /> Crear reserva</>}
              </button>
            </div>
          </div>
        )}

        {/* Resultado */}
        {bookResult && (
          <div className="adm-card">
            <div className="adm-card-header"><span className="adm-card-title" style={{ color: '#10b981' }}><i className="fa-solid fa-check-circle" /> Reserva creada</span></div>
            <div className="adm-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>Referencia</div><div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 15 }}>{bookResult.bookingRef}</div></div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}><div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>Cliente</div><div style={{ fontWeight: 600 }}>{custName}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{custEmail}</div></div>
                <div style={{ background: '#dcfce7', borderRadius: 8, padding: '10px 14px' }}><div style={{ fontSize: 11, color: '#15803d', marginBottom: 3 }}>Email enviado</div><div style={{ fontWeight: 600, color: '#15803d', fontSize: 12 }}><i className="fa-solid fa-check" style={{ marginRight: 4 }} />Confirmación enviada</div></div>
              </div>
              {payMethod === 'payment_link' && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#0284c7' }}><i className="fa-solid fa-link" style={{ marginRight: 6 }} />Link de pago</div>
                  {sendingLink ? <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8' }}><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Generando link…</div>
                  : linkUrl ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input readOnly value={linkUrl} style={{ flex: 1, padding: '8px 12px', border: '1px solid #bae6fd', borderRadius: 6, fontSize: 12, background: '#fff', minWidth: 200 }} />
                      <button className="adm-btn primary sm" onClick={() => navigator.clipboard.writeText(linkUrl)}><i className="fa-solid fa-copy" /> Copiar</button>
                      <a href={`https://wa.me/?text=${encodeURIComponent(`Hola ${custName}, link de pago: ${linkUrl}`)}`} target="_blank" rel="noopener noreferrer" className="adm-btn success sm"><i className="fa-brands fa-whatsapp" /> WhatsApp</a>
                      <a href={`mailto:${custEmail}?subject=Link de pago - ${bookResult.bookingRef}&body=Hola ${custName},%0A%0ALink:%0A${linkUrl}`} className="adm-btn outline sm"><i className="fa-solid fa-envelope" /> Email</a>
                    </div>
                  ) : <div style={{ fontSize: 13, color: '#ef4444' }}>No se pudo generar el link. Verifica que Stripe esté configurado.</div>}
                </div>
              )}
              <button className="adm-btn outline" onClick={resetAll}><i className="fa-solid fa-plus" /> Nueva reserva</button>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
