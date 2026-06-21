'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import AdminDateRangePicker from '../ui/AdminDateRangePicker';

// Historial de cambios de una reserva
function BookingHistory({ bookingId, API, adminFetch }: {
  bookingId: string; API: string; adminFetch: Function;
}) {
  const [history, setHistory] = useState<any[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/admin/bookings/${bookingId}/history`);
      const d = await r.json();
      setHistory(d.data || []);
    } catch { setHistory([]); }
    finally { setLoading(false); }
  };

  const toggle = () => { if (!open) load(); setOpen(o => !o); };

  const ACTION_LABEL: Record<string, string> = {
    status_change: 'Cambio de estado',
    payment_update: 'Pago actualizado',
    reissue: 'Re-emisión de billete',
    cancel: 'Cancelación',
    note_added: 'Nota añadida',
  };
  const fmtTs = (d: string) => new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--adm-border)', paddingTop: 12 }}>
      <button className="adm-btn ghost sm" style={{ width: '100%', justifyContent: 'space-between' }} onClick={toggle}>
        <span><i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 6 }} />Historial de cambios</span>
        <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 10 }} />
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 12 }}><div className="adm-spinner" style={{ width: 16, height: 16, margin: '0 auto' }} /></div>
          ) : history.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', textAlign: 'center', padding: '8px 0' }}>Sin historial registrado</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.map(h => (
                <div key={h.id} style={{ background: '#f8fafc', borderRadius: 6, padding: '6px 10px', fontSize: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, color: 'var(--adm-text)' }}>{ACTION_LABEL[h.action] || h.action}</span>
                    <span style={{ color: 'var(--adm-text-muted)' }}>{fmtTs(h.performed_at)}</span>
                  </div>
                  {h.old_value && h.new_value && (
                    <div style={{ color: 'var(--adm-text-muted)' }}>
                      <span style={{ textDecoration: 'line-through' }}>{h.old_value}</span>
                      {' → '}
                      <span style={{ fontWeight: 600, color: 'var(--adm-text)' }}>{h.new_value}</span>
                    </div>
                  )}
                  {h.note && <div style={{ color: 'var(--adm-text-muted)', fontStyle: 'italic' }}>{h.note}</div>}
                  <div style={{ color: 'var(--adm-text-muted)', marginTop: 2 }}>
                    <i className="fa-solid fa-user" style={{ marginRight: 4, fontSize: 9 }} />{h.performed_by}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// Botón imprimir/descargar billete — usa fetch con token para evitar error 401
function TicketButtons({ bookingId, bookingRef, API, adminFetch }: {
  bookingId: string; bookingRef: string; API: string; adminFetch: Function;
}) {
  const [loading, setLoading] = useState<'print' | 'download' | null>(null);

  const fetchHtml = async (): Promise<string | null> => {
    try {
      const r = await adminFetch(`${API}/admin/bookings/${bookingId}/ticket-pdf`);
      if (!r.ok) return null;
      return await r.text();
    } catch { return null; }
  };

  const handlePrint = async () => {
    setLoading('print');
    const html = await fetchHtml();
    setLoading(null);
    if (!html) { alert('Error al cargar el billete. Inténtalo de nuevo.'); return; }
    const win = window.open('', '_blank');
    if (!win) { alert('Permite las ventanas emergentes para imprimir.'); return; }
    win.document.write(html);
    win.document.close();
    // Esperar a que carguen las imágenes (QR) antes de imprimir
    win.onload = () => setTimeout(() => win.print(), 500);
  };

  const handleDownload = async () => {
    setLoading('download');
    const html = await fetchHtml();
    setLoading(null);
    if (!html) { alert('Error al descargar el billete.'); return; }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `billete-${bookingRef}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--adm-border)', paddingTop: 12, display: 'flex', gap: 8 }}>
      <button className="adm-btn primary" style={{ flex: 1 }} onClick={handlePrint} disabled={!!loading}>
        {loading === 'print'
          ? <><div className="adm-spinner" style={{ width: 13, height: 13 }} /> Cargando…</>
          : <><i className="fa-solid fa-print" /> Imprimir billete</>}
      </button>
      <button className="adm-btn outline" style={{ flex: 1 }} onClick={handleDownload} disabled={!!loading}>
        {loading === 'download'
          ? <><div className="adm-spinner" style={{ width: 13, height: 13 }} /> Descargando…</>
          : <><i className="fa-solid fa-download" /> Descargar</>}
      </button>
    </div>
  );
}

function ReissueButton({ bookingId, API, adminFetch, onSuccess }: {  bookingId: string; API: string; adminFetch: Function; onSuccess: (pnr: string) => void;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const run = async () => {
    if (!confirm('¿Re-emitir billete en Amadeus? Esto generará un cargo real en tu cuenta IATA.')) return;
    setState('loading');
    try {
      const r = await adminFetch(`${API}/admin/bookings/${bookingId}/reissue`, { method: 'POST' });
      const d = await r.json();
      if (d.success) { setState('done'); setMsg(`PNR: ${d.pnrCode}`); onSuccess(d.pnrCode); }
      else { setState('error'); setMsg(d.error?.message || 'Error'); }
    } catch { setState('error'); setMsg('Error de conexión'); }
  };
  return (
    <div style={{ marginTop: 10 }}>
      <button className={`adm-btn ${state === 'done' ? 'success' : state === 'error' ? 'danger' : 'warning'}`}
        style={{ width: '100%' }} onClick={run} disabled={state === 'loading'}>
        {state === 'loading' ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Re-emitiendo…</>
         : state === 'done' ? <><i className="fa-solid fa-check" /> Billete emitido — {msg}</>
         : state === 'error' ? <><i className="fa-solid fa-exclamation" /> {msg}</>
         : <><i className="fa-solid fa-rotate-right" /> Re-emitir billete en Amadeus</>}
      </button>
    </div>
  );
}

// Botón para cancelar reserva con reembolso automático
function CancelRefundButton({ bookingId, API, adminFetch, onSuccess }: {
  bookingId: string; API: string; adminFetch: Function; onSuccess: () => void;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const run = async () => {
    const reason = prompt('Motivo de cancelación (opcional):') ?? 'Cancelado por administrador';
    if (reason === null) return; // usuario canceló el prompt
    setState('loading');
    try {
      const r = await adminFetch(`${API}/admin/bookings/${bookingId}/cancel-refund`, {
        method: 'POST', body: JSON.stringify({ reason }),
      });
      const d = await r.json();
      if (d.success) { setState('done'); setMsg(d.message); onSuccess(); }
      else { setState('error'); setMsg(d.error?.message || 'Error'); }
    } catch { setState('error'); setMsg('Error de conexión'); }
  };
  return (
    <div style={{ marginTop: 8 }}>
      <button className={`adm-btn ${state === 'done' ? 'success' : state === 'error' ? 'danger' : 'outline'}`}
        style={{ width: '100%' }} onClick={run} disabled={state === 'loading'}>
        {state === 'loading' ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Cancelando…</>
         : state === 'done' ? <><i className="fa-solid fa-check" /> {msg}</>
         : state === 'error' ? <><i className="fa-solid fa-exclamation" /> {msg}</>
         : <><i className="fa-solid fa-ban" /> Cancelar y reembolsar</>}
      </button>
    </div>
  );
}
function ResendButton({ reference, email, API, adminFetch }: {
  reference: string; email: string; API: string; adminFetch: Function;
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const send = async () => {
    setState('sending');
    try {
      const r = await adminFetch(`${API}/bookings/resend-itinerary`, {
        method: 'POST',
        body: JSON.stringify({ reference, email }),
      });
      const d = await r.json();
      setState(d.success ? 'sent' : 'error');
      if (d.success) setTimeout(() => setState('idle'), 4000);
    } catch { setState('error'); }
  };
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid var(--adm-border)', paddingTop: 12 }}>
      <button
        className={`adm-btn ${state === 'sent' ? 'success' : state === 'error' ? 'danger' : 'outline'}`}
        style={{ width: '100%' }}
        onClick={send}
        disabled={state === 'sending'}
      >
        {state === 'sending' && <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Enviando…</>}
        {state === 'sent'    && <><i className="fa-solid fa-circle-check" /> Itinerario enviado a {email}</>}
        {state === 'error'   && <><i className="fa-solid fa-circle-exclamation" /> Error al enviar</>}
        {state === 'idle'    && <><i className="fa-solid fa-paper-plane" /> Reenviar itinerario al cliente</>}
      </button>
      <p style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 4, textAlign: 'center' }}>
        Se enviará a: {email}
      </p>
    </div>
  );
}

interface Booking {
  id: string;
  booking_reference: string;
  booking_type: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_amount: number;
  original_amount?: number;
  margin_pct?: number;
  margin_amount?: number;
  currency: string;
  created_at: string;
  departure_date?: string;
  pnr_code?: string;
  amadeus_order_id?: string;
  ticket_numbers?: string;
  admin_comment?: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'warning', confirmed: 'success', cancelled: 'danger', completed: 'info',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada',
};

const fmt = (n: number, cur = 'EUR') =>
  n.toLocaleString('es-ES', { style: 'currency', currency: cur, minimumFractionDigits: 2 });
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface Props { role: AdminRole; }

export default function BookingsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [bookings, setBookings]   = useState<Booking[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [dateFromObj, setDateFromObj] = useState<Date | null>(null);
  const [dateToObj, setDateToObj]     = useState<Date | null>(null);
  const [page, setPage]           = useState(0);
  const [selected, setSelected]   = useState<Booking | null>(null);
  const [updating, setUpdating]   = useState<string | null>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(page * LIMIT),
        ...(filter !== 'all' && { status: filter }),
        ...(search && { search }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
        // Offset de timezone del usuario para filtrado correcto por fecha
        tz_offset: String(new Date().getTimezoneOffset()),
      });
      const r = await adminFetch(`${API}/admin/bookings?${params}`);
      const d = await r.json();
      if (d.success) { setBookings(d.data || []); setTotal(d.pagination?.total || 0); }
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [page, filter, search, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    if (!can('bookings_edit')) return;
    setUpdating(id);
    try {
      await adminFetch(`${API}/admin/bookings/${id}`, {
        method: 'PATCH', body: JSON.stringify({ status }),
      });
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status: status as Booking['status'] } : b));
      if (selected?.id === id) setSelected(s => s ? { ...s, status: status as Booking['status'] } : s);
    } catch { /* silencioso */ }
    finally { setUpdating(null); }
  };

  const handleDateChange = (from: Date | null, to: Date | null) => {
    setDateFromObj(from);
    setDateToObj(to);
    // Construir fecha en hora local para evitar desfase UTC
    const toLocalDate = (d: Date | null) => {
      if (!d) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    // Enviar también el offset de timezone del usuario (en minutos)
    const tzOffset = new Date().getTimezoneOffset(); // ej: 300 para UTC-5
    setDateFrom(toLocalDate(from));
    setDateTo(toLocalDate(to));
    // Guardar offset para enviarlo al backend
    sessionStorage.setItem('tz_offset', String(tzOffset));
    setPage(0);
  };

  const exportData = (format: 'csv' | 'excel') => {
    if (!can('export')) return;
    window.open(`${API}/admin/export/bookings?format=${format}`, '_blank');
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <PermissionGuard allowed={can('bookings_view')}>
      <div>
        {/* Filtros */}
        <div className="adm-filters">
          <div className="adm-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              placeholder="Buscar por referencia, nombre o email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <select className="adm-filter-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
          {/* Filtro por fechas — modo single: un clic = un día */}
          <AdminDateRangePicker
            from={dateFromObj}
            to={dateToObj}
            onChange={handleDateChange}
            placeholder="Filtrar por fecha"
            mode="single"
          />
          <button className="adm-btn outline sm" onClick={load}>
            <i className="fa-solid fa-arrows-rotate" /> Actualizar
          </button>
          {can('export') && (
            <>
              <button className="adm-btn outline sm" onClick={() => exportData('csv')}>
                <i className="fa-solid fa-file-csv" /> CSV
              </button>
              <button className="adm-btn outline sm" onClick={() => exportData('excel')}>
                <i className="fa-solid fa-file-excel" /> Excel
              </button>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 16 }}>
          {/* Tabla */}
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">
                <i className="fa-solid fa-calendar-check" />
                Reservas
                <span className="adm-badge default">{total}</span>
              </span>
            </div>
            {loading ? (
              <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Referencia</th>
                      <th>Tipo</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th>Precio cliente</th>
                      <th>Tu ganancia</th>
                      <th>Fecha</th>
                      {can('bookings_edit') && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr><td colSpan={8}><div className="adm-table-empty"><i className="fa-solid fa-inbox" />Sin resultados</div></td></tr>
                    ) : bookings.map(b => (
                      <tr
                        key={b.id}
                        style={{ cursor: 'pointer', background: selected?.id === b.id ? '#f0f7ff' : undefined }}
                        onClick={() => setSelected(s => s?.id === b.id ? null : b)}
                      >
                        <td className="mono">{b.booking_reference}</td>
                        <td><span className="adm-badge default">{b.booking_type}</span></td>
                        <td>{b.customer_name || b.customer_email || '—'}</td>
                        <td><span className={`adm-badge ${STATUS_BADGE[b.status] || 'default'}`}>{STATUS_LABEL[b.status] || b.status}</span></td>
                        <td style={{ fontWeight: 600 }}>{fmt(b.total_amount, b.currency)}</td>
                        <td>
                          {b.margin_amount != null && b.margin_amount > 0 ? (
                            <span style={{ color: 'var(--adm-success)', fontWeight: 700 }}>
                              +{fmt(b.margin_amount, b.currency)}
                              {b.margin_pct ? <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 3 }}>({b.margin_pct}%)</span> : null}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--adm-text-muted)', fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td className="muted">{fmtDate(b.created_at)}</td>
                        {can('bookings_edit') && (
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {b.status === 'pending' && (
                                <>
                                  <button
                                    className="adm-btn success icon-only sm"
                                    title="Confirmar"
                                    disabled={updating === b.id}
                                    onClick={() => updateStatus(b.id, 'confirmed')}
                                  >
                                    <i className="fa-solid fa-check" />
                                  </button>
                                  <button
                                    className="adm-btn danger icon-only sm"
                                    title="Cancelar"
                                    disabled={updating === b.id}
                                    onClick={() => updateStatus(b.id, 'cancelled')}
                                  >
                                    <i className="fa-solid fa-xmark" />
                                  </button>
                                </>
                              )}
                              {b.status === 'confirmed' && (
                                <button
                                  className="adm-btn outline icon-only sm"
                                  title="Marcar completada"
                                  disabled={updating === b.id}
                                  onClick={() => updateStatus(b.id, 'completed')}
                                >
                                  <i className="fa-solid fa-check-double" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="adm-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>
                  Mostrando {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} de {total}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="adm-btn outline sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <i className="fa-solid fa-chevron-left" />
                  </button>
                  <span style={{ padding: '5px 10px', fontSize: 12 }}>{page + 1} / {totalPages}</span>
                  <button className="adm-btn outline sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel detalle */}
          {selected && (
            <div className="adm-card" style={{ alignSelf: 'start', position: 'sticky', top: 80 }}>
              <div className="adm-card-header">
                <span className="adm-card-title"><i className="fa-solid fa-file-lines" />Detalle</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setSelected(null)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <div className="adm-card-body">
                <div className="adm-detail-grid">
                  <div className="adm-detail-item"><label>Referencia</label><span className="mono">{selected.booking_reference}</span></div>
                  <div className="adm-detail-item"><label>Tipo</label><span>{selected.booking_type}</span></div>
                  <div className="adm-detail-item"><label>Estado</label><span><span className={`adm-badge ${STATUS_BADGE[selected.status]}`}>{STATUS_LABEL[selected.status]}</span></span></div>

                  {/* PNR y datos de emisión */}
                  {selected.pnr_code && (
                    <div className="adm-detail-item" style={{ gridColumn: '1/-1' }}>
                      <label>PNR / Localizador aerolínea</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: 'var(--adm-primary)', letterSpacing: 3, background: '#f0f4ff', padding: '4px 12px', borderRadius: 6 }}>
                          {selected.pnr_code}
                        </span>
                        <button className="adm-btn ghost sm" onClick={() => navigator.clipboard.writeText(selected.pnr_code!)}>
                          <i className="fa-solid fa-copy" />
                        </button>
                      </div>
                    </div>
                  )}
                  {selected.ticket_numbers && (
                    <div className="adm-detail-item" style={{ gridColumn: '1/-1' }}>
                      <label>Número(s) de billete</label>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                        {selected.ticket_numbers}
                      </span>
                    </div>
                  )}
                  {selected.admin_comment && (
                    <div className="adm-detail-item" style={{ gridColumn: '1/-1' }}>
                      <label>Nota interna</label>
                      <span style={{ color: '#d97706', fontSize: 12 }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }} />
                        {selected.admin_comment}
                      </span>
                    </div>
                  )}

                  {/* Desglose de precio */}
                  <div className="adm-detail-item" style={{ gridColumn: '1/-1' }}>
                    <label>Desglose de precio</label>
                    <div style={{ background: '#f8fafc', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
                      {selected.original_amount != null ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--adm-text-muted)' }}>Precio Amadeus:</span>
                            <span>{fmt(selected.original_amount, selected.currency)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--adm-text-muted)' }}>Margen aplicado ({selected.margin_pct ?? 0}%):</span>
                            <span style={{ color: 'var(--adm-success)', fontWeight: 600 }}>
                              +{fmt(selected.margin_amount ?? 0, selected.currency)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, borderTop: '1px solid var(--adm-border)', paddingTop: 6, marginTop: 4 }}>
                            <span>Precio cliente:</span>
                            <span>{fmt(selected.total_amount, selected.currency)}</span>
                          </div>
                          <div style={{ marginTop: 8, background: '#dcfce7', borderRadius: 6, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>
                              <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }} />
                              Tu ganancia en esta reserva:
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#15803d' }}>
                              +{fmt(selected.margin_amount ?? 0, selected.currency)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>
                          <span style={{ fontWeight: 700 }}>{fmt(selected.total_amount, selected.currency)}</span>
                          <span style={{ marginLeft: 8 }}>— Sin desglose disponible (reserva anterior al sistema de márgenes)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="adm-detail-item" style={{ gridColumn: '1/-1' }}><label>Cliente</label><span>{selected.customer_name || '—'}</span></div>
                  <div className="adm-detail-item" style={{ gridColumn: '1/-1' }}><label>Email</label><span>{selected.customer_email || '—'}</span></div>
                  <div className="adm-detail-item"><label>Teléfono</label><span>{selected.customer_phone || '—'}</span></div>
                  <div className="adm-detail-item"><label>Fecha</label><span>{fmtDate(selected.created_at)}</span></div>
                  {selected.departure_date && (
                    <div className="adm-detail-item" style={{ gridColumn: '1/-1' }}><label>Salida</label><span>{fmtDate(selected.departure_date)}</span></div>
                  )}
                </div>
                {can('bookings_edit') && selected.status === 'pending' && (
                  <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                    <button className="adm-btn success" style={{ flex: 1 }} onClick={() => updateStatus(selected.id, 'confirmed')}>
                      <i className="fa-solid fa-check" /> Confirmar
                    </button>
                    <button className="adm-btn danger" style={{ flex: 1 }} onClick={() => updateStatus(selected.id, 'cancelled')}>
                      <i className="fa-solid fa-xmark" /> Cancelar
                    </button>
                  </div>
                )}
                {/* Re-emitir billete OTA si falló */}
                {can('bookings_edit') && selected.booking_type === 'flight' && !selected.pnr_code && selected.status === 'confirmed' && (
                  <ReissueButton bookingId={selected.id} API={API} adminFetch={adminFetch}
                    onSuccess={(pnr) => setSelected(s => s ? { ...s, pnr_code: pnr } : s)} />
                )}
                {/* Cancelar con reembolso */}
                {can('bookings_edit') && selected.status !== 'cancelled' && (
                  <CancelRefundButton bookingId={selected.id} API={API} adminFetch={adminFetch}
                    onSuccess={() => { setSelected(s => s ? { ...s, status: 'cancelled' } : s); load(); }} />
                )}
                {/* Reenviar itinerario por email */}
                {selected.customer_email && (
                  <ResendButton
                    reference={selected.booking_reference}
                    email={selected.customer_email}
                    API={API}
                    adminFetch={adminFetch}
                  />
                )}
                {/* Descargar / Imprimir billete */}
                <TicketButtons bookingId={selected.id} bookingRef={selected.booking_reference} API={API} adminFetch={adminFetch} />
                {/* Historial de cambios */}
                <BookingHistory bookingId={selected.id} API={API} adminFetch={adminFetch} />
              </div>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
