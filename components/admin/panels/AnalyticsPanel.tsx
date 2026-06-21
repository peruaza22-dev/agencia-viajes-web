'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Props { role: AdminRole; }

const fmt = (n: number, cur = 'EUR') =>
  Number(n).toLocaleString('es-ES', { style: 'currency', currency: cur, minimumFractionDigits: 0 });

const BAR_COLORS = ['#003580', '#0284c7', '#0d9488', '#7c3aed', '#ea580c', '#16a34a'];

type Period = '7d' | '30d' | '90d' | '12m';

export default function AnalyticsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [stats, setStats]       = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState<Period>('30d');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([
        adminFetch(`${API}/admin/stats`),
        adminFetch(`${API}/admin/bookings?limit=500`),
      ]);
      const sData = await sRes.json();
      const bData = await bRes.json();
      if (sData.success) setStats(sData.data);
      if (bData.success) setBookings(bData.data || []);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtrar por período
  const now = new Date();
  const periodMs: Record<Period, number> = {
    '7d': 7, '30d': 30, '90d': 90, '12m': 365,
  };
  const cutoff = new Date(now.getTime() - periodMs[period] * 24 * 60 * 60 * 1000);
  const filtered = bookings.filter(b => new Date(b.created_at) >= cutoff);

  // Métricas del período
  const periodRevenue = filtered.reduce((s, b) => s + (Number(b.total_amount) || 0), 0);
  const periodProfit  = filtered.reduce((s, b) => s + (Number(b.margin_amount) || 0), 0);
  const periodCount   = filtered.length;
  const convRate      = filtered.length > 0
    ? Math.round((filtered.filter(b => b.status === 'confirmed' || b.status === 'completed').length / filtered.length) * 100)
    : 0;

  // Gráfica por días/meses según período
  const chartPoints = period === '12m'
    ? Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('es-ES', { month: 'short' });
        const items = bookings.filter(b => b.created_at?.startsWith(key));
        return { label, count: items.length, revenue: items.reduce((s, b) => s + (Number(b.total_amount) || 0), 0) };
      })
    : Array.from({ length: periodMs[period] }, (_, i) => {
        const d = new Date(now.getTime() - (periodMs[period] - 1 - i) * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        const label = period === '7d'
          ? d.toLocaleDateString('es-ES', { weekday: 'short' })
          : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const items = bookings.filter(b => b.created_at?.startsWith(key));
        return { label, count: items.length, revenue: items.reduce((s, b) => s + (Number(b.total_amount) || 0), 0) };
      }).filter((_, i, arr) => period === '30d' ? i % 3 === 0 : period === '90d' ? i % 7 === 0 : true);

  const maxCount   = Math.max(...chartPoints.map(d => d.count), 1);
  const maxRevenue = Math.max(...chartPoints.map(d => d.revenue), 1);

  // Por tipo
  const byType = filtered.reduce<Record<string, { count: number; revenue: number }>>((acc, b) => {
    const t = b.booking_type || 'otro';
    if (!acc[t]) acc[t] = { count: 0, revenue: 0 };
    acc[t].count++;
    acc[t].revenue += Number(b.total_amount) || 0;
    return acc;
  }, {});
  const typeEntries = Object.entries(byType).sort((a, b) => b[1].revenue - a[1].revenue);
  const totalRevType = typeEntries.reduce((s, [, v]) => s + v.revenue, 0) || 1;

  // Por estado
  const byStatus = filtered.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const PERIOD_LABELS: Record<Period, string> = {
    '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', '90d': 'Últimos 90 días', '12m': 'Últimos 12 meses',
  };

  return (
    <PermissionGuard allowed={can('analytics')}>
      <div>
        {/* Selector de período */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['7d', '30d', '90d', '12m'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`adm-btn ${period === p ? 'primary' : 'outline'} sm`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
          <button className="adm-btn ghost sm" onClick={load} style={{ marginLeft: 'auto' }}>
            <i className="fa-solid fa-arrows-rotate" />
          </button>
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando analíticas…</span></div>
        ) : (
          <>
            {/* KPIs del período */}
            <div className="adm-stats-grid" style={{ marginBottom: 20 }}>
              {[
                { label: 'Reservas',        val: periodCount,        icon: 'fa-calendar-check', color: 'blue' },
                { label: 'Ingresos',        val: fmt(periodRevenue), icon: 'fa-coins',           color: 'green' },
                { label: 'Tu ganancia',     val: fmt(periodProfit),  icon: 'fa-sack-dollar',     color: 'teal', highlight: true },
                { label: 'Tasa confirmación', val: `${convRate}%`,   icon: 'fa-percent',         color: 'purple' },
              ].map(({ label, val, icon, color, highlight }) => (
                <div key={label} className="adm-stat" style={highlight ? { border: '2px solid #16a34a' } : {}}>
                  <div className={`adm-stat-icon ${color}`}><i className={`fa-solid ${icon}`} /></div>
                  <div>
                    <div className="adm-stat-value" style={highlight ? { color: '#16a34a' } : {}}>{val}</div>
                    <div className="adm-stat-label">{label} — {PERIOD_LABELS[period]}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfica de reservas */}
            <div className="adm-card" style={{ marginBottom: 16 }}>
              <div className="adm-card-header">
                <span className="adm-card-title">
                  <i className="fa-solid fa-chart-bar" />
                  Reservas — {PERIOD_LABELS[period]}
                </span>
              </div>
              <div className="adm-card-body">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: period === '12m' ? 8 : 4, height: 140, overflowX: 'auto', paddingBottom: 4 }}>
                  {chartPoints.map(({ label, count, revenue }, i) => (
                    <div key={i} style={{ flex: '0 0 auto', minWidth: period === '12m' ? 40 : 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      {count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--adm-primary)' }}>{count}</span>}
                      <div
                        title={`${label}: ${count} reservas · ${fmt(revenue)}`}
                        style={{
                          width: '100%', background: count > 0 ? 'var(--adm-primary)' : '#f1f5f9',
                          borderRadius: '3px 3px 0 0',
                          height: `${Math.max((count / maxCount) * 110, count > 0 ? 6 : 3)}px`,
                          transition: 'height 0.4s', cursor: count > 0 ? 'pointer' : 'default',
                        }}
                      />
                      <span style={{ fontSize: 9, color: 'var(--adm-text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfica de ingresos */}
            <div className="adm-card" style={{ marginBottom: 16 }}>
              <div className="adm-card-header">
                <span className="adm-card-title">
                  <i className="fa-solid fa-chart-line" />
                  Ingresos — {PERIOD_LABELS[period]}
                </span>
              </div>
              <div className="adm-card-body">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: period === '12m' ? 8 : 4, height: 140, overflowX: 'auto', paddingBottom: 4 }}>
                  {chartPoints.map(({ label, revenue }, i) => (
                    <div key={i} style={{ flex: '0 0 auto', minWidth: period === '12m' ? 40 : 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      {revenue > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#16a34a' }}>{fmt(revenue).replace('€', '')}</span>}
                      <div
                        title={`${label}: ${fmt(revenue)}`}
                        style={{
                          width: '100%', background: revenue > 0 ? '#16a34a' : '#f1f5f9',
                          borderRadius: '3px 3px 0 0',
                          height: `${Math.max((revenue / maxRevenue) * 110, revenue > 0 ? 6 : 3)}px`,
                          transition: 'height 0.4s',
                        }}
                      />
                      <span style={{ fontSize: 9, color: 'var(--adm-text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Por tipo */}
              <div className="adm-card">
                <div className="adm-card-header">
                  <span className="adm-card-title"><i className="fa-solid fa-ranking-star" />Por tipo de reserva</span>
                </div>
                <div className="adm-card-body">
                  {typeEntries.length === 0 ? (
                    <div className="adm-empty"><i className="fa-solid fa-chart-bar" /><p>Sin datos en este período</p></div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {typeEntries.map(([type, { count, revenue }], idx) => {
                        const pct = Math.round((revenue / totalRevType) * 100);
                        return (
                          <div key={type}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: BAR_COLORS[idx % BAR_COLORS.length] }} />
                                <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{type}</span>
                                <span className="adm-badge default" style={{ fontSize: 10 }}>{count}</span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700 }}>{fmt(revenue)}</span>
                            </div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: BAR_COLORS[idx % BAR_COLORS.length], borderRadius: 3, transition: 'width 0.5s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Por estado */}
              <div className="adm-card">
                <div className="adm-card-header">
                  <span className="adm-card-title"><i className="fa-solid fa-chart-pie" />Por estado</span>
                </div>
                <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { key: 'pending',   label: 'Pendientes',  color: '#d97706' },
                    { key: 'confirmed', label: 'Confirmadas', color: '#16a34a' },
                    { key: 'completed', label: 'Completadas', color: '#0284c7' },
                    { key: 'cancelled', label: 'Canceladas',  color: '#dc2626' },
                  ].map(({ key, label, color }) => {
                    const val = byStatus[key] || 0;
                    const pct = periodCount > 0 ? Math.round((val / periodCount) * 100) : 0;
                    return (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{val} <span style={{ color: 'var(--adm-text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PermissionGuard>
  );
}
