'use client';

/**
 * CalendarPanel — Vista de calendario con reservas por día
 * Sin dependencias externas — CSS Grid puro
 */
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Booking {
  id: string;
  booking_reference: string;
  booking_type: string;
  customer_name?: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  departure_date?: string;
}

const TYPE_COLOR: Record<string, string> = {
  flight:   '#003580',
  hotel:    '#0284c7',
  package:  '#7c3aed',
  bus:      '#0d9488',
  transfer: '#ea580c',
};
const TYPE_ICON: Record<string, string> = {
  flight: 'fa-plane', hotel: 'fa-bed', package: 'fa-suitcase-rolling',
  bus: 'fa-bus', transfer: 'fa-car',
};
const STATUS_COLOR: Record<string, string> = {
  pending: '#d97706', confirmed: '#16a34a', completed: '#0284c7', cancelled: '#dc2626',
};

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const fmt = (n: number, cur = 'EUR') =>
  Number(n).toLocaleString('es-ES', { style: 'currency', currency: cur, minimumFractionDigits: 0 });

interface Props { role: AdminRole; }

export default function CalendarPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const today = new Date();
  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null); // fecha seleccionada YYYY-MM-DD
  const [view, setView]       = useState<'month' | 'list'>('month');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar reservas del mes actual + siguiente para tener datos completos
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;
      const r = await adminFetch(`${API}/admin/bookings?limit=200&date_from=${from}&date_to=${to}`);
      const d = await r.json();
      setBookings(d.data || []);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };
  const goToday   = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  // Construir grid del mes
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  // Lunes = 0, Domingo = 6
  const startDow = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;

  // Agrupar reservas por fecha (created_at y departure_date)
  const byDate: Record<string, Booking[]> = {};
  bookings.forEach(b => {
    const dateKey = b.created_at?.split('T')[0];
    if (dateKey) {
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(b);
    }
    // También mostrar en fecha de salida si existe
    if (b.departure_date) {
      const depKey = b.departure_date.split('T')[0];
      if (depKey !== dateKey) {
        if (!byDate[depKey]) byDate[depKey] = [];
        if (!byDate[depKey].find(x => x.id === b.id)) byDate[depKey].push(b);
      }
    }
  });

  const selectedBookings = selected ? (byDate[selected] || []) : [];
  const todayStr = today.toISOString().split('T')[0];

  // Vista lista — reservas del mes ordenadas por fecha
  const listBookings = [...bookings].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <PermissionGuard allowed={can('bookings_view')}>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="adm-btn outline sm" onClick={prevMonth}><i className="fa-solid fa-chevron-left" /></button>
            <span style={{ fontWeight: 700, fontSize: 18, minWidth: 180, textAlign: 'center' }}>
              {MONTHS[month]} {year}
            </span>
            <button className="adm-btn outline sm" onClick={nextMonth}><i className="fa-solid fa-chevron-right" /></button>
          </div>
          <button className="adm-btn ghost sm" onClick={goToday}>Hoy</button>
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button className={`adm-btn sm ${view === 'month' ? 'primary' : 'outline'}`} onClick={() => setView('month')}>
              <i className="fa-solid fa-calendar" /> Mes
            </button>
            <button className={`adm-btn sm ${view === 'list' ? 'primary' : 'outline'}`} onClick={() => setView('list')}>
              <i className="fa-solid fa-list" /> Lista
            </button>
          </div>
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando reservas…</span></div>
        ) : view === 'list' ? (
          /* ── Vista Lista ── */
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">
                <i className="fa-solid fa-list" />
                Reservas de {MONTHS[month]} {year}
                <span className="adm-badge default">{listBookings.length}</span>
              </span>
            </div>
            {listBookings.length === 0 ? (
              <div className="adm-empty" style={{ padding: 40 }}>
                <i className="fa-solid fa-calendar-xmark" />
                <p>Sin reservas en este mes</p>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Fecha</th><th>Referencia</th><th>Tipo</th><th>Cliente</th><th>Estado</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {listBookings.map(b => (
                      <tr key={b.id}>
                        <td className="muted">{new Date(b.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</td>
                        <td className="mono">{b.booking_reference}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                            <i className={`fa-solid ${TYPE_ICON[b.booking_type] || 'fa-ticket'}`} style={{ color: TYPE_COLOR[b.booking_type] || '#64748b' }} />
                            {b.booking_type}
                          </span>
                        </td>
                        <td>{b.customer_name || '—'}</td>
                        <td><span className="adm-badge" style={{ background: STATUS_COLOR[b.status] + '20', color: STATUS_COLOR[b.status], border: `1px solid ${STATUS_COLOR[b.status]}40` }}>{b.status}</span></td>
                        <td style={{ fontWeight: 600 }}>{fmt(b.total_amount, b.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ── Vista Mes ── */
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 300px' : '1fr', gap: 16, alignItems: 'start' }}>
            <div className="adm-card" style={{ overflow: 'hidden' }}>
              {/* Cabecera días */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid var(--adm-border)' }}>
                {DAYS.map(d => (
                  <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid de días */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {Array.from({ length: totalCells }, (_, i) => {
                  const dayNum = i - startDow + 1;
                  const isCurrentMonth = dayNum >= 1 && dayNum <= lastDay.getDate();
                  const dateStr = isCurrentMonth
                    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                    : '';
                  const dayBookings = dateStr ? (byDate[dateStr] || []) : [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selected;

                  return (
                    <div
                      key={i}
                      onClick={() => isCurrentMonth && setSelected(isSelected ? null : dateStr)}
                      style={{
                        minHeight: 80,
                        padding: '4px 6px',
                        borderRight: '1px solid var(--adm-border)',
                        borderBottom: '1px solid var(--adm-border)',
                        background: isSelected ? '#f0f4ff' : isToday ? '#fefce8' : '#fff',
                        cursor: isCurrentMonth ? 'pointer' : 'default',
                        opacity: isCurrentMonth ? 1 : 0.3,
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* Número del día */}
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: isToday ? 'var(--adm-primary)' : 'transparent',
                        color: isToday ? '#fff' : isCurrentMonth ? 'var(--adm-text)' : 'var(--adm-text-muted)',
                        fontWeight: isToday ? 700 : 400,
                        fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 2,
                      }}>
                        {isCurrentMonth ? dayNum : ''}
                      </div>

                      {/* Puntos de reservas */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {dayBookings.slice(0, 3).map(b => (
                          <div key={b.id} style={{
                            fontSize: 10, padding: '1px 4px', borderRadius: 3,
                            background: (TYPE_COLOR[b.booking_type] || '#64748b') + '20',
                            color: TYPE_COLOR[b.booking_type] || '#64748b',
                            fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            <i className={`fa-solid ${TYPE_ICON[b.booking_type] || 'fa-ticket'}`} style={{ marginRight: 3, fontSize: 8 }} />
                            {b.customer_name?.split(' ')[0] || b.booking_reference}
                          </div>
                        ))}
                        {dayBookings.length > 3 && (
                          <div style={{ fontSize: 9, color: 'var(--adm-text-muted)', paddingLeft: 4 }}>
                            +{dayBookings.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel lateral — reservas del día seleccionado */}
            {selected && (
              <div className="adm-card" style={{ position: 'sticky', top: 80 }}>
                <div className="adm-card-header">
                  <span className="adm-card-title" style={{ fontSize: 13 }}>
                    <i className="fa-solid fa-calendar-day" />
                    {new Date(selected + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <button className="adm-btn ghost icon-only sm" onClick={() => setSelected(null)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
                <div className="adm-card-body">
                  {selectedBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--adm-text-muted)', fontSize: 13 }}>
                      <i className="fa-solid fa-calendar-xmark" style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                      Sin reservas este día
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedBookings.map(b => (
                        <div key={b.id} style={{
                          border: `1px solid ${TYPE_COLOR[b.booking_type] || '#e2e8f0'}40`,
                          borderLeft: `3px solid ${TYPE_COLOR[b.booking_type] || '#64748b'}`,
                          borderRadius: 6, padding: '8px 10px', background: '#fafafa',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: TYPE_COLOR[b.booking_type] || '#64748b' }}>
                              {b.booking_reference}
                            </span>
                            <span style={{ fontSize: 10, background: STATUS_COLOR[b.status] + '20', color: STATUS_COLOR[b.status], padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                              {b.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{b.customer_name || '—'}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--adm-text-muted)' }}>
                            <span>
                              <i className={`fa-solid ${TYPE_ICON[b.booking_type] || 'fa-ticket'}`} style={{ marginRight: 4 }} />
                              {b.booking_type}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--adm-text)' }}>{fmt(b.total_amount, b.currency)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
