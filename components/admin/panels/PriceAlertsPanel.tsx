'use client';

/**
 * PriceAlertsPanel — Alertas de precio
 * Muestra todas las alertas activas, permite verificarlas manualmente
 * y ver cuándo se notificó al cliente.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Props { role: AdminRole; }

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMoney = (n: number, cur = 'EUR') => `${n.toLocaleString('es-ES', { minimumFractionDigits: 0 })} ${cur}`;

export default function PriceAlertsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { isAdmin, isManager } = useAdminRole(role);

  const [alerts,   setAlerts]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/price-alerts`);
      const d = await r.json();
      setAlerts(d.data || []);
    } catch { setAlerts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const checkNow = async () => {
    setChecking(true); setCheckMsg('');
    try {
      const r = await adminFetch(`${API}/price-alerts/check`, { method: 'POST' });
      const d = await r.json();
      setCheckMsg(`Verificadas ${d.checked} alertas · ${d.notified} notificaciones enviadas`);
      load();
    } catch { setCheckMsg('Error al verificar'); }
    finally { setChecking(false); }
  };

  const deactivate = async (id: string) => {
    await adminFetch(`${API}/price-alerts/${id}`, { method: 'DELETE' });
    setAlerts(as => as.filter(a => a.id !== id));
  };

  const active   = alerts.filter(a => a.is_active);
  const inactive = alerts.filter(a => !a.is_active);

  return (
    <PermissionGuard allowed={isAdmin || isManager}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Info + acción */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', fontSize: 13, flex: 1 }}>
            <i className="fa-solid fa-bell" style={{ color: '#0284c7', marginRight: 8 }} />
            <strong>{active.length} alertas activas</strong> — Los clientes reciben un email automático cuando el precio baja de su umbral.
          </div>
          <button className="adm-btn primary" onClick={checkNow} disabled={checking}>
            {checking ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Verificando…</> : <><i className="fa-solid fa-rotate" /> Verificar precios ahora</>}
          </button>
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
        </div>

        {checkMsg && (
          <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#15803d', fontWeight: 600 }}>
            <i className="fa-solid fa-check-circle" style={{ marginRight: 6 }} />{checkMsg}
          </div>
        )}

        {/* Tabla */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-bell" /> Alertas de precio</span>
          </div>
          {loading ? <div className="adm-loading"><div className="adm-spinner" /></div> : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Cliente</th><th>Ruta</th><th>Precio máx.</th><th>Precio más bajo visto</th><th>Notificaciones</th><th>Última notif.</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr><td colSpan={8}><div className="adm-table-empty"><i className="fa-solid fa-bell-slash" />Sin alertas registradas</div></td></tr>
                  ) : alerts.map(a => (
                    <tr key={a.id} style={{ opacity: a.is_active ? 1 : 0.5 }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.name || a.email}</div>
                        <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{a.email}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{a.origin}</span>
                        <i className="fa-solid fa-arrow-right" style={{ margin: '0 6px', fontSize: 10, color: '#94a3b8' }} />
                        <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{a.destination}</span>
                        {(a.origin_city || a.destination_city) && (
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.origin_city} → {a.destination_city}</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--adm-primary)' }}>{fmtMoney(a.max_price, a.currency)}</td>
                      <td>
                        {a.lowest_seen
                          ? <span style={{ color: a.lowest_seen <= a.max_price ? '#10b981' : '#94a3b8', fontWeight: 600 }}>{fmtMoney(a.lowest_seen, a.currency)}</span>
                          : <span className="muted">—</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`adm-badge ${a.notify_count > 0 ? 'success' : 'default'}`}>{a.notify_count || 0}</span>
                      </td>
                      <td className="muted" style={{ fontSize: 11 }}>{fmtDate(a.last_notified)}</td>
                      <td>
                        <span className={`adm-badge ${a.is_active ? 'success' : 'default'}`}>
                          {a.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        {a.is_active && (
                          <button className="adm-btn danger icon-only sm" title="Desactivar" onClick={() => deactivate(a.id)}>
                            <i className="fa-solid fa-bell-slash" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
