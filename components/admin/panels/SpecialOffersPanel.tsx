'use client';

/**
 * SpecialOffersPanel — Gestión de ofertas especiales manuales
 * Permite crear ofertas de ida y vuelta con precio, descuento y fecha de expiración
 */
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import AdminDatePicker from '../ui/AdminDatePicker';

interface Offer {
  id: string;
  title: string;
  origin: string;
  destination: string;
  origin_city?: string;
  destination_city?: string;
  trip_type: 'oneway' | 'roundtrip';
  price: number;
  old_price?: number;
  discount_pct?: number;
  currency: string;
  airline?: string;
  badge?: string;
  badge_color?: string;
  is_active: boolean;
  is_featured: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
}

const EMPTY: Omit<Offer, 'id' | 'created_at'> = {
  title: '', origin: '', destination: '',
  origin_city: '', destination_city: '',
  trip_type: 'roundtrip', price: 0, old_price: 0,
  discount_pct: 0, currency: 'EUR', airline: '',
  badge: 'Oferta', badge_color: '#ee1d25',
  is_active: true, is_featured: false,
  starts_at: '', expires_at: '',
};

const BADGES = ['Oferta', 'Nuevo', 'Más vendido', 'Últimas plazas', 'Exclusivo', 'Flash'];
const BADGE_COLORS = ['#ee1d25', '#f59e0b', '#10b981', '#8b5cf6', '#003580', '#0284c7'];

// Convierte ISO a formato datetime-local (YYYY-MM-DDTHH:MM)
function toLocalDatetimeInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDateTime(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function combineDateAndTime(date: Date | null, time: string): string {
  if (!date) return '';
  const [h, m] = (time || '00:00').split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
}

function extractTime(val: string): string {
  if (!val) return '00:00';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '00:00';
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function DateTimePicker({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (iso: string) => void; hint?: string;
}) {
  const dateVal = parseDateTime(value);
  const timeVal = extractTime(value);
  const handleDate = (d: Date | null) => {
    if (!d) { onChange(''); return; }
    onChange(combineDateAndTime(d, timeVal));
  };
  const handleTime = (t: string) => {
    if (!dateVal) return;
    onChange(combineDateAndTime(dateVal, t));
  };
  return (
    <div className="adm-form-group">
      <label className="adm-label">
        {label} <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)' }}>opcional</span>
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <AdminDatePicker value={dateVal} onChange={handleDate} placeholder="dd/mm/aaaa" allowPast />
        </div>
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 10px', background: dateVal ? '#fff' : '#f8fafc', border: `1.5px solid ${dateVal ? 'var(--adm-border)' : '#e2e8f0'}`, borderRadius: 8 }}>
            <i className="fa-solid fa-clock" style={{ color: 'var(--adm-text-muted)', fontSize: 12 }} />
            <input type="time" value={timeVal} disabled={!dateVal} onChange={e => handleTime(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', width: 80, color: dateVal ? 'var(--adm-text)' : 'var(--adm-text-muted)', cursor: dateVal ? 'pointer' : 'not-allowed' }} />
          </div>
        </div>
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function getOfferStatus(o: Offer): 'scheduled' | 'active' | 'expired' | 'inactive' {
  if (!o.is_active) return 'inactive';
  const now = new Date();
  if (o.expires_at && new Date(o.expires_at) < now) return 'expired';
  if (o.starts_at  && new Date(o.starts_at)  > now) return 'scheduled';
  return 'active';
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n: number, cur = 'EUR') => `${n.toLocaleString('es-ES', { minimumFractionDigits: 0 })} ${cur}`;

interface Props { role: AdminRole; }

export default function SpecialOffersPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [offers, setOffers]     = useState<Offer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Offer | null>(null);
  const [form, setForm]         = useState<Omit<Offer, 'id' | 'created_at'>>({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/admin/special-offers`);
      const d = await r.json();
      setOffers(d.data || []);
    } catch { setOffers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setError('');
    setShowForm(true);
  };

  const openEdit = (o: Offer) => {
    setEditing(o);
    setForm({
      title: o.title, origin: o.origin, destination: o.destination,
      origin_city: o.origin_city || '', destination_city: o.destination_city || '',
      trip_type: o.trip_type, price: o.price, old_price: o.old_price || 0,
      discount_pct: o.discount_pct || 0, currency: o.currency,
      airline: o.airline || '', badge: o.badge || 'Oferta',
      badge_color: o.badge_color || '#ee1d25',
      is_active: o.is_active, is_featured: o.is_featured,
      starts_at:  o.starts_at  ? toLocalDatetimeInput(o.starts_at)  : '',
      expires_at: o.expires_at ? toLocalDatetimeInput(o.expires_at) : '',
    });
    setError('');
    setShowForm(true);
  };

  // Auto-calcular descuento cuando cambian precio/precio anterior
  const calcDiscount = (price: number, oldPrice: number) =>
    oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;

  const save = async () => {
    if (!form.title.trim() || !form.origin.trim() || !form.destination.trim()) {
      setError('Título, origen y destino son obligatorios'); return;
    }
    if (!form.price || form.price <= 0) { setError('El precio debe ser mayor a 0'); return; }
    setSaving(true); setError('');
    try {
    const payload = {
        ...form,
        origin: form.origin.toUpperCase(),
        destination: form.destination.toUpperCase(),
        discount_pct: calcDiscount(form.price, form.old_price || 0),
        starts_at:  form.starts_at  ? new Date(form.starts_at).toISOString()  : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };
      const url = editing ? `${API}/admin/special-offers/${editing.id}` : `${API}/admin/special-offers`;
      const r = await adminFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error?.message || 'Error al guardar');
      setShowForm(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta oferta?')) return;
    await adminFetch(`${API}/admin/special-offers/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleActive = async (o: Offer) => {
    await adminFetch(`${API}/admin/special-offers/${o.id}`, {
      method: 'PUT', body: JSON.stringify({ is_active: !o.is_active }),
    });
    setOffers(os => os.map(x => x.id === o.id ? { ...x, is_active: !x.is_active } : x));
  };

  const isExpired = (_o: Offer) => false; // reemplazado por getOfferStatus

  return (
    <PermissionGuard allowed={can('settings') || role === 'manager'}>
      <div>
        {/* Cabecera */}
        <div className="adm-filters">
          <div style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>
            {offers.filter(o => o.is_active).length} activas · {offers.length} total
          </div>
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
          {can('settings') && (
            <button className="adm-btn primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
              <i className="fa-solid fa-plus" /> Nueva oferta
            </button>
          )}
        </div>

        {/* Info */}
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <i className="fa-solid fa-circle-info" style={{ color: '#0284c7', marginTop: 2, flexShrink: 0 }} />
          <div>
            <strong>Ofertas Especiales</strong> — Aparecen en la sección "Mejores Ofertas" del inicio.
            Puedes crear ofertas de <strong>ida y vuelta</strong> con precio fijo, descuento y fecha de expiración.
            Se mezclan con los Flash Deals de Amadeus.
          </div>
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
        ) : offers.length === 0 ? (
          <div className="adm-card">
            <div className="adm-empty">
              <i className="fa-solid fa-tag" />
              <p>Sin ofertas especiales. Crea la primera.</p>
              {can('settings') && (
                <button className="adm-btn primary" style={{ marginTop: 12 }} onClick={openNew}>
                  <i className="fa-solid fa-plus" /> Crear oferta
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="adm-card">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Oferta</th><th>Ruta</th><th>Tipo</th>
                    <th>Precio</th><th>Descuento</th>
                    <th>Inicio</th><th>Expira</th>
                    <th>Estado</th>{can('settings') && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {offers.map(o => {
                    const status = getOfferStatus(o);
                    const statusConfig = {
                      active:    { label: 'Activa',     cls: 'success' },
                      scheduled: { label: 'Programada', cls: 'warning' },
                      expired:   { label: 'Expirada',   cls: 'danger'  },
                      inactive:  { label: 'Inactiva',   cls: 'default' },
                    }[status];
                    return (
                    <tr key={o.id} style={{ opacity: status === 'expired' || status === 'inactive' ? 0.55 : 1 }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.title}</div>
                        {o.airline && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{o.airline}</div>}
                        {o.badge && (
                          <span style={{ background: o.badge_color || '#ee1d25', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                            {o.badge}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{o.origin}</span>
                        <i className="fa-solid fa-arrow-right" style={{ margin: '0 6px', fontSize: 10, color: 'var(--adm-text-muted)' }} />
                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{o.destination}</span>
                        {(o.origin_city || o.destination_city) && (
                          <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>
                            {o.origin_city} → {o.destination_city}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`adm-badge ${o.trip_type === 'roundtrip' ? 'info' : 'default'}`}>
                          {o.trip_type === 'roundtrip' ? <><i className="fa-solid fa-arrows-left-right" /> Ida y vuelta</> : 'Solo ida'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--adm-primary)' }}>{fmtMoney(o.price, o.currency)}</div>
                        {o.old_price && o.old_price > o.price && (
                          <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>{fmtMoney(o.old_price, o.currency)}</div>
                        )}
                      </td>
                      <td>
                        {o.discount_pct && o.discount_pct > 0
                          ? <span className="adm-badge danger">-{o.discount_pct}%</span>
                          : <span className="muted">—</span>}
                      </td>
                      <td className="muted" style={{ fontSize: 12 }}>{fmtDate(o.starts_at) || '—'}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{fmtDate(o.expires_at) || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className={`adm-badge ${statusConfig.cls}`}>{statusConfig.label}</span>
                          {o.is_featured && <span className="adm-badge warning"><i className="fa-solid fa-star" /></span>}
                        </div>
                      </td>
                      {can('settings') && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="adm-btn outline icon-only sm" onClick={() => openEdit(o)} title="Editar">
                              <i className="fa-solid fa-pen" />
                            </button>
                            <button
                              className={`adm-btn icon-only sm ${o.is_active ? 'outline' : 'success'}`}
                              onClick={() => toggleActive(o)}
                              title={o.is_active ? 'Desactivar' : 'Activar'}
                            >
                              <i className={`fa-solid ${o.is_active ? 'fa-eye-slash' : 'fa-eye'}`} />
                            </button>
                            <button className="adm-btn danger icon-only sm" onClick={() => remove(o.id)} title="Eliminar">
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="adm-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="adm-modal lg" onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title">
                  <i className="fa-solid fa-tag" style={{ marginRight: 8 }} />
                  {editing ? 'Editar oferta' : 'Nueva oferta especial'}
                </span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowForm(false)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-modal-body">
                {error && (
                  <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 6 }} />{error}
                  </div>
                )}

                <div className="adm-form-group">
                  <label className="adm-label">Título de la oferta *</label>
                  <input className="adm-input" placeholder="ej: Madrid → Bogotá ida y vuelta"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>

                {/* Ruta */}
                <div className="adm-form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                  <div className="adm-form-group">
                    <label className="adm-label">Origen (IATA) *</label>
                    <input className="adm-input" placeholder="MAD" maxLength={3}
                      value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Ciudad origen</label>
                    <input className="adm-input" placeholder="Madrid"
                      value={form.origin_city || ''} onChange={e => setForm(f => ({ ...f, origin_city: e.target.value }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Destino (IATA) *</label>
                    <input className="adm-input" placeholder="BOG" maxLength={3}
                      value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Ciudad destino</label>
                    <input className="adm-input" placeholder="Bogotá"
                      value={form.destination_city || ''} onChange={e => setForm(f => ({ ...f, destination_city: e.target.value }))} />
                  </div>
                </div>

                {/* Tipo de viaje */}
                <div className="adm-form-group">
                  <label className="adm-label">Tipo de viaje</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['oneway', 'roundtrip'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setForm(f => ({ ...f, trip_type: t }))}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${form.trip_type === t ? 'var(--adm-primary)' : 'var(--adm-border)'}`, background: form.trip_type === t ? '#f0f4ff' : '#fff', color: form.trip_type === t ? 'var(--adm-primary)' : 'var(--adm-text-muted)', fontWeight: form.trip_type === t ? 700 : 400, cursor: 'pointer', fontSize: 13 }}>
                        <i className={`fa-solid ${t === 'roundtrip' ? 'fa-arrows-left-right' : 'fa-arrow-right'}`} style={{ marginRight: 6 }} />
                        {t === 'roundtrip' ? 'Ida y vuelta' : 'Solo ida'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Precios */}
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Precio oferta (€) *</label>
                    <input className="adm-input" type="number" min="0" step="0.01"
                      value={form.price === 0 ? '' : form.price} placeholder="0"
                      onChange={e => setForm(f => ({ ...f, price: e.target.value === '' ? 0 : Number(e.target.value) }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Precio anterior (€) <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)' }}>tachado</span></label>
                    <input className="adm-input" type="number" min="0" step="0.01"
                      value={form.old_price === 0 ? '' : (form.old_price || '')} placeholder="0"
                      onChange={e => setForm(f => ({ ...f, old_price: e.target.value === '' ? 0 : Number(e.target.value) }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Descuento calculado</label>
                    <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 18, fontWeight: 800, color: '#ee1d25' }}>
                      {calcDiscount(form.price, form.old_price || 0) > 0
                        ? `-${calcDiscount(form.price, form.old_price || 0)}%`
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* Aerolínea y badge */}
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Aerolínea</label>
                    <input className="adm-input" placeholder="Iberia, Air Europa…"
                      value={form.airline || ''} onChange={e => setForm(f => ({ ...f, airline: e.target.value }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Badge / Etiqueta</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {BADGES.map(b => (
                        <button key={b} type="button" onClick={() => setForm(f => ({ ...f, badge: b }))}
                          style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${form.badge === b ? 'var(--adm-primary)' : 'var(--adm-border)'}`, background: form.badge === b ? '#f0f4ff' : '#fff', color: form.badge === b ? 'var(--adm-primary)' : 'var(--adm-text-muted)' }}>
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color del badge */}
                <div className="adm-form-group">
                  <label className="adm-label">Color del badge</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {BADGE_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, badge_color: c }))}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${form.badge_color === c ? '#000' : 'transparent'}`, cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>

                {/* Programación */}
                <div style={{ background: '#f8fafc', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-solid fa-clock" style={{ color: 'var(--adm-primary)' }} /> Programación (fecha y hora)
                  </div>
                  <div className="adm-form-row">
                    <DateTimePicker
                      label="Inicio de la oferta"
                      value={form.starts_at || ''}
                      onChange={v => setForm(f => ({ ...f, starts_at: v }))}
                      hint="Si no se indica, la oferta está activa desde ahora"
                    />
                    <DateTimePicker
                      label="Fin de la oferta"
                      value={form.expires_at || ''}
                      onChange={v => setForm(f => ({ ...f, expires_at: v }))}
                      hint="La oferta desaparece automáticamente a esta hora"
                    />
                  </div>
                  {/* Preview del estado */}
                  {(form.starts_at || form.expires_at) && (
                    <div style={{ marginTop: 8, background: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-circle-info" style={{ color: 'var(--adm-primary)' }} />
                      {(() => {
                        const now = new Date();
                        const start = form.starts_at ? new Date(form.starts_at) : null;
                        const end   = form.expires_at ? new Date(form.expires_at) : null;
                        if (start && start > now) return <span style={{ color: '#f59e0b', fontWeight: 600 }}>⏰ Programada — se activará el {start.toLocaleString('es-ES')}</span>;
                        if (end && end < now)     return <span style={{ color: '#ef4444', fontWeight: 600 }}>⛔ Ya expirada — cambia la fecha de fin</span>;
                        if (end)                  return <span style={{ color: '#10b981', fontWeight: 600 }}>✅ Activa hasta el {end.toLocaleString('es-ES')}</span>;
                        return <span style={{ color: '#10b981', fontWeight: 600 }}>✅ Activa sin fecha de fin</span>;
                      })()}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 20 }}>
                  <label className="adm-toggle">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                    <span className="adm-toggle-track" />
                    <span className="adm-toggle-label">Oferta activa</span>
                  </label>
                  <label className="adm-toggle">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                    <span className="adm-toggle-track" />
                    <span className="adm-toggle-label">Destacada (aparece primero)</span>
                  </label>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="adm-btn primary" onClick={save} disabled={saving}>
                  {saving
                    ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</>
                    : <><i className="fa-solid fa-save" /> {editing ? 'Guardar cambios' : 'Crear oferta'}</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
