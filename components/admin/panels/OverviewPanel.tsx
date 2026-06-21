'use client';

import { useEffect, useState } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';

interface Booking {
  id: string;
  booking_reference: string;
  booking_type: string;
  customer_name?: string;
  customer_email?: string;
  status: string;
  payment_status?: string;
  total_amount: number;
  currency: string;
  created_at: string;
}

interface Props {
  role: AdminRole;
  onNavigate: (view: string) => void;
}

const fmt = (n: number, cur = 'EUR') =>
  n.toLocaleString('es-ES', { style: 'currency', currency: cur.length === 3 ? cur : 'EUR', minimumFractionDigits: 0 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_BADGE: Record<string, string> = {
  pending: 'warning', confirmed: 'success', cancelled: 'danger', completed: 'info',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada',
};

export default function OverviewPanel({ role, onNavigate }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [recent, setRecent]           = useState<Booking[]>([]);
  const [totalUsers, setTotalUsers]   = useState(0);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Cargar todas las reservas para calcular stats localmente
        // Así no dependemos del endpoint /stats que puede fallar por RLS
        const [bAllRes, bRecentRes, usersRes] = await Promise.all([
          adminFetch(`${API}/admin/bookings?limit=500`),
          adminFetch(`${API}/admin/bookings?limit=5`),
          adminFetch(`${API}/admin/users?limit=1`),
        ]);

        const bAll    = await bAllRes.json();
        const bRecent = await bRecentRes.json();
        const uData   = await usersRes.json();

        if (bAll.success)    setAllBookings(bAll.data || []);
        if (bRecent.success) setRecent(bRecent.data || []);
        if (uData.success)   setTotalUsers(uData.pagination?.total || 0);
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Calcular stats directamente desde los bookings cargados
  const totalBookings    = allBookings.length;
  const pendingBookings  = allBookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length;
  const cancelledBookings = allBookings.filter(b => b.status === 'cancelled').length;
  const completedBookings = allBookings.filter(b => b.status === 'completed').length;
  const totalRevenue     = allBookings
    .filter(b => b.payment_status === 'paid' || b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + (Number(b.total_amount) || 0), 0);
  const totalProfit      = allBookings
    .filter(b => b.payment_status === 'paid' || b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + (Number((b as any).margin_amount) || 0), 0);

  if (loading) return (
    <div className="adm-loading">
      <div className="adm-spinner" />
      <span>Cargando datos…</span>
    </div>
  );

  return (
    <div>
      {/* Stats */}
      <div className="adm-stats-grid">
        <div className="adm-stat">
          <div className="adm-stat-icon blue"><i className="fa-solid fa-calendar-check" /></div>
          <div>
            <div className="adm-stat-value">{totalBookings}</div>
            <div className="adm-stat-label">Reservas totales</div>
          </div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-icon green"><i className="fa-solid fa-coins" /></div>
          <div>
            <div className="adm-stat-value">{fmt(totalRevenue)}</div>
            <div className="adm-stat-label">Ingresos totales</div>
          </div>
        </div>
        {totalProfit > 0 && (
          <div className="adm-stat">
            <div className="adm-stat-icon" style={{ background: '#dcfce7' }}><i className="fa-solid fa-sack-dollar" style={{ color: '#16a34a' }} /></div>
            <div>
              <div className="adm-stat-value" style={{ color: '#16a34a' }}>+{fmt(totalProfit)}</div>
              <div className="adm-stat-label">Tu ganancia (márgenes)</div>
            </div>
          </div>
        )}
        <div className="adm-stat">
          <div className="adm-stat-icon purple"><i className="fa-solid fa-users" /></div>
          <div>
            <div className="adm-stat-value">{totalUsers}</div>
            <div className="adm-stat-label">Usuarios registrados</div>
          </div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-icon orange"><i className="fa-solid fa-clock" /></div>
          <div>
            <div className="adm-stat-value">{pendingBookings}</div>
            <div className="adm-stat-label">Reservas pendientes</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Estado de reservas */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-chart-bar" />Estado de reservas</span>
          </div>
          <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Pendientes',  val: pendingBookings,   color: '#d97706' },
              { label: 'Confirmadas', val: confirmedBookings, color: '#16a34a' },
              { label: 'Completadas', val: completedBookings, color: '#0284c7' },
              { label: 'Canceladas',  val: cancelledBookings, color: '#dc2626' },
            ].map(({ label, val, color }) => {
              const pct = totalBookings > 0 ? Math.round((val / totalBookings) * 100) : 0;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {val}
                      <span style={{ color: 'var(--adm-text-muted)', fontWeight: 400, marginLeft: 4 }}>
                        {pct > 0 ? `(${pct}%)` : ''}
                      </span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-bolt" />Acciones rápidas</span>
          </div>
          <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {can('bookings_view') && (
              <button className="adm-btn outline" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('bookings')}>
                <i className="fa-solid fa-calendar-check" />
                Ver reservas
                {pendingBookings > 0 && <span className="adm-badge warning" style={{ marginLeft: 'auto' }}>{pendingBookings} pendientes</span>}
              </button>
            )}
            {can('payments_view') && (
              <button className="adm-btn outline" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('payments')}>
                <i className="fa-solid fa-credit-card" /> Ver pagos
              </button>
            )}
            {can('users_view') && (
              <button className="adm-btn outline" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('users')}>
                <i className="fa-solid fa-users" /> Gestionar usuarios
              </button>
            )}
            {can('blog_edit') && (
              <button className="adm-btn outline" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('blog')}>
                <i className="fa-solid fa-newspaper" /> Nuevo post de blog
              </button>
            )}
            {can('settings') && (
              <button className="adm-btn outline" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('settings')}>
                <i className="fa-solid fa-gear" /> Configuración del sitio
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Últimas reservas */}
      <div className="adm-card">
        <div className="adm-card-header">
          <span className="adm-card-title"><i className="fa-solid fa-clock-rotate-left" />Últimas reservas</span>
          {can('bookings_view') && (
            <button className="adm-btn ghost sm" onClick={() => onNavigate('bookings')}>
              Ver todas <i className="fa-solid fa-arrow-right" />
            </button>
          )}
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Referencia</th><th>Tipo</th><th>Cliente</th>
                <th>Estado</th><th>Monto</th><th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={6}><div className="adm-table-empty"><i className="fa-solid fa-inbox" />Sin reservas recientes</div></td></tr>
              ) : recent.map(b => (
                <tr key={b.id}>
                  <td className="mono">{b.booking_reference}</td>
                  <td><span className="adm-badge default">{b.booking_type}</span></td>
                  <td>{b.customer_name || b.customer_email || '—'}</td>
                  <td><span className={`adm-badge ${STATUS_BADGE[b.status] || 'default'}`}>{STATUS_LABEL[b.status] || b.status}</span></td>
                  <td style={{ fontWeight: 600 }}>{fmt(b.total_amount, b.currency)}</td>
                  <td className="muted">{fmtDate(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
