'use client';

/**
 * CommissionsPanel — Panel de Comisiones de Agentes
 * Muestra cuánto ha vendido cada agente y calcula sus comisiones.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import AdminDateRangePicker from '../ui/AdminDateRangePicker';

interface Props { role: AdminRole; }

const fmtMoney = (n: number, cur = 'EUR') => `${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${cur}`;

export default function CommissionsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { isAdmin, isManager } = useAdminRole(role);

  const [data,     setData]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dateTo,   setDateTo]   = useState<Date | null>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = dateFrom?.toISOString().split('T')[0] || '';
      const to   = dateTo?.toISOString().split('T')[0]   || '';
      const r = await adminFetch(`${API}/admin/agent-margins`);
      const margins = await r.json();

      // Cargar reservas del período con agent_email
      const params = new URLSearchParams({ limit: '500', ...(from && { date_from: from }), ...(to && { date_to: to }) });
      const rb = await adminFetch(`${API}/admin/bookings?${params}`);
      const bookings = await rb.json();

      const allBookings: any[] = bookings.data || [];
      const allMargins: any[] = margins.data || [];

      // Agrupar por agente
      const agentMap = new Map<string, { email: string; name: string; bookings: number; revenue: number; commission: number; margin_pct: number }>();

      allBookings.forEach((b: any) => {
        if (!b.agent_email) return;
        const agentMargin = allMargins.find((m: any) => m.agent_email === b.agent_email && m.service === b.booking_type);
        const marginPct = agentMargin?.margin_pct || 0;
        const commission = (Number(b.total_amount) || 0) * (marginPct / 100);
        const cur = agentMap.get(b.agent_email) || { email: b.agent_email, name: b.agent_email, bookings: 0, revenue: 0, commission: 0, margin_pct: marginPct };
        cur.bookings++;
        cur.revenue += Number(b.total_amount) || 0;
        cur.commission += commission;
        agentMap.set(b.agent_email, cur);
      });

      setData([...agentMap.values()].sort((a, b) => b.revenue - a.revenue));
    } catch { setData([]); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue    = data.reduce((s, a) => s + a.revenue, 0);
  const totalCommission = data.reduce((s, a) => s + a.commission, 0);
  const totalBookings   = data.reduce((s, a) => s + a.bookings, 0);

  return (
    <PermissionGuard allowed={isAdmin || isManager}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Filtro de fechas */}
        <div className="adm-filters">
          <AdminDateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} placeholder="Filtrar período" mode="range" />
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Agentes activos', value: data.length, icon: 'fa-users', color: '#003580' },
            { label: 'Reservas totales', value: totalBookings, icon: 'fa-calendar-check', color: '#0284c7' },
            { label: 'Ventas totales', value: fmtMoney(totalRevenue), icon: 'fa-euro-sign', color: '#10b981' },
            { label: 'Comisiones a pagar', value: fmtMoney(totalCommission), icon: 'fa-hand-holding-dollar', color: '#f59e0b' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '14px 16px', boxShadow: 'var(--adm-shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fa-solid ${icon}`} style={{ color, fontSize: 16 }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--adm-text-muted)', fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tabla de agentes */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-user-tie" /> Comisiones por agente</span>
          </div>
          {loading ? <div className="adm-loading"><div className="adm-spinner" /></div> : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Agente</th><th>Reservas</th><th>Ventas</th><th>% Comisión</th><th>Comisión a pagar</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="adm-empty">
                        <i className="fa-solid fa-user-tie" />
                        <p>Sin datos de agentes en este período.</p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>Las reservas creadas en Modo Agente aparecerán aquí cuando tengan <code>agent_email</code> asignado.</p>
                      </div>
                    </td></tr>
                  ) : data.map(a => (
                    <tr key={a.email}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{a.email}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="adm-badge info">{a.bookings}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{fmtMoney(a.revenue)}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--adm-primary)' }}>{a.margin_pct}%</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 900, fontSize: 15, color: '#f59e0b' }}>{fmtMoney(a.commission)}</span>
                      </td>
                      <td>
                        <span className="adm-badge success">Activo</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {data.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                      <td>TOTAL</td>
                      <td style={{ textAlign: 'center' }}>{totalBookings}</td>
                      <td>{fmtMoney(totalRevenue)}</td>
                      <td>—</td>
                      <td style={{ color: '#f59e0b', fontSize: 15 }}>{fmtMoney(totalCommission)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* Nota */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#92400e' }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
          Las comisiones se calculan sobre las reservas que tienen <strong>agent_email</strong> asignado y un margen configurado en <strong>Precios → Márgenes por agente</strong>.
          Para asignar un agente a una reserva, créala desde el <strong>Modo Agente</strong>.
        </div>
      </div>
    </PermissionGuard>
  );
}
