'use client';

import { useState } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Props { role: AdminRole; }

const STATUS_BADGE: Record<string, string> = {
  pending: 'warning', confirmed: 'success', cancelled: 'danger',
  completed: 'info', refunded: 'default',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada',
  completed: 'Completada', refunded: 'Reembolsada',
};
const TYPE_LABEL: Record<string, string> = {
  flight: 'Vuelo', hotel: 'Hotel', bus: 'Autobús',
  transfer: 'Traslado', package: 'Paquete',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const fmtMoney = (amount: any, currency = 'EUR') =>
  amount ? `${Number(amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${currency}` : '—';

export default function SupportPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [query, setQuery]       = useState('');
  const [field, setField]       = useState('all');
  const [results, setResults]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes]       = useState<any>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setResults([]); setSelected(null); setNotes(null); setSearched(false);
    try {
      const r = await adminFetch(`${API}/admin/bookings/search?q=${encodeURIComponent(query.trim())}&field=${field}`);
      const d = await r.json();
      setResults(d.data || []);
      setSearched(true);
    } catch { setSearched(true); }
    finally { setLoading(false); }
  };

  const selectBooking = (b: any) => {
    setSelected(b);
    try {
      const parsed = typeof b.notes === 'string' ? JSON.parse(b.notes) : b.notes;
      setNotes(parsed);
    } catch { setNotes(null); }
  };

  const passengers: any[] = notes?.passengers || [];
  const items: any[] = notes?.items || [];

  return (
    <PermissionGuard allowed={can('support')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Búsqueda */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-headset" /> Soporte al Cliente
            </span>
          </div>
          <div className="adm-card-body">
            <form onSubmit={search} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="adm-filter-select" value={field} onChange={e => setField(e.target.value)} style={{ minWidth: 130 }}>
                <option value="all">Todo</option>
                <option value="email">Email</option>
                <option value="name">Nombre</option>
                <option value="phone">Teléfono</option>
                <option value="document">Documento</option>
              </select>
              <div className="adm-search" style={{ flex: 1, minWidth: 200 }}>
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Email, nombre, referencia, teléfono…"
                />
              </div>
              <button type="submit" className="adm-btn primary" disabled={loading || !query.trim()}>
                {loading
                  ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Buscando…</>
                  : <><i className="fa-solid fa-magnifying-glass" /> Buscar</>}
              </button>
              {results.length > 0 && (
                <button type="button" className="adm-btn ghost sm"
                  onClick={() => { setResults([]); setSelected(null); setQuery(''); setSearched(false); }}>
                  <i className="fa-solid fa-xmark" /> Limpiar
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Sin resultados */}
        {searched && results.length === 0 && !loading && (
          <div className="adm-card">
            <div className="adm-empty">
              <i className="fa-solid fa-magnifying-glass" />
              <p>Sin resultados para <strong>"{query}"</strong></p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Prueba con otro campo o verifica los datos.</p>
            </div>
          </div>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">
                <i className="fa-solid fa-list" /> {results.length} resultado{results.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Referencia</th><th>Cliente</th><th>Email</th>
                    <th>Tipo</th><th>Estado</th><th>Total</th><th>Fecha</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((b: any) => (
                    <tr key={b.id}
                      style={{ background: selected?.id === b.id ? '#f0f7ff' : undefined, cursor: 'pointer' }}
                      onClick={() => selectBooking(b)}>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{b.booking_reference}</span></td>
                      <td style={{ fontWeight: 500 }}>{b.customer_name || '—'}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{b.customer_email || '—'}</td>
                      <td><span className="adm-badge default">{TYPE_LABEL[b.booking_type] || b.booking_type || '—'}</span></td>
                      <td><span className={`adm-badge ${STATUS_BADGE[b.status] || 'default'}`}>{STATUS_LABEL[b.status] || b.status}</span></td>
                      <td style={{ fontWeight: 600 }}>{fmtMoney(b.total_amount, b.currency)}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{fmtDate(b.created_at)}</td>
                      <td>
                        <button className="adm-btn outline sm" onClick={e => { e.stopPropagation(); selectBooking(b); }}>
                          <i className="fa-solid fa-eye" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detalle */}
        {selected && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">
                <i className="fa-solid fa-file-lines" /> Reserva {selected.booking_reference}
              </span>
              <span className={`adm-badge ${STATUS_BADGE[selected.status] || 'default'}`}>
                {STATUS_LABEL[selected.status] || selected.status}
              </span>
            </div>
            <div className="adm-card-body">

              {/* Datos del cliente */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  Datos del cliente
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Nombre',   value: selected.customer_name,  icon: 'fa-user' },
                    { label: 'Email',    value: selected.customer_email, icon: 'fa-envelope' },
                    { label: 'Teléfono',value: selected.customer_phone, icon: 'fa-phone' },
                    { label: 'Tipo',     value: TYPE_LABEL[selected.booking_type] || selected.booking_type, icon: 'fa-tag' },
                    { label: 'Total',    value: fmtMoney(selected.total_amount, selected.currency), icon: 'fa-euro-sign' },
                    { label: 'Fecha',    value: fmtDate(selected.created_at), icon: 'fa-calendar' },
                    ...(selected.pnr_code ? [{ label: 'PNR', value: selected.pnr_code, icon: 'fa-ticket' }] : []),
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className={`fa-solid ${icon}`} style={{ width: 12 }} /> {label}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, wordBreak: 'break-all' }}>{value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pasajeros */}
              {passengers.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Pasajeros ({passengers.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {passengers.map((p: any, i: number) => (
                      <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</span>
                        {p.documentNumber && <span className="muted">Doc: {p.documentNumber}</span>}
                        {p.dateOfBirth && <span className="muted">Nac: {p.dateOfBirth}</span>}
                        {p.email && <span className="muted">{p.email}</span>}
                        {p.phone && <span className="muted">{p.phone}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              {items.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Servicios reservados
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {items.map((item: any, i: number) => (
                      <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{item.description || item.type || `Servicio ${i + 1}`}</span>
                        {item.price?.total && (
                          <span style={{ color: 'var(--adm-primary)', fontWeight: 700 }}>
                            {fmtMoney(item.price.total, item.price.currency)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones rápidas */}
              <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a href={`/reserva/${selected.booking_reference}`} target="_blank" rel="noopener noreferrer" className="adm-btn outline sm">
                  <i className="fa-solid fa-arrow-up-right-from-square" /> Ver reserva
                </a>
                {selected.customer_email && (
                  <a href={`mailto:${selected.customer_email}`} className="adm-btn outline sm">
                    <i className="fa-solid fa-envelope" /> Email
                  </a>
                )}
                {selected.customer_phone && (
                  <a href={`tel:${selected.customer_phone}`} className="adm-btn outline sm">
                    <i className="fa-solid fa-phone" /> Llamar
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
