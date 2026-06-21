'use client';

import { useEffect, useState } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Props { role: AdminRole; }

const CACHE_TYPES = ['all', 'flights', 'hotels', 'locations', 'transfers', 'seat_maps', 'baggage'];

export default function CachePanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [stats, setStats]     = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [msg, setMsg]         = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, eRes] = await Promise.all([
        adminFetch(`${API}/admin/cache/stats`),
        adminFetch(`${API}/admin/cache/entries?limit=20`),
      ]);
      const sData = await sRes.json();
      const eData = await eRes.json();
      if (sData.success) setStats(sData.data);
      if (eData.success) setEntries(eData.data || []);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const clearCache = async (type: string) => {
    setClearing(true); setMsg('');
    try {
      const url = type === 'all'
        ? `${API}/admin/cache/clear`
        : `${API}/admin/cache/clear?type=${type}`;
      await adminFetch(url, { method: 'POST' });
      setMsg(`Caché ${type === 'all' ? 'completo' : type} limpiado correctamente`);
      load();
    } catch { setMsg('Error al limpiar caché'); }
    finally { setClearing(false); }
  };

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <PermissionGuard allowed={can('cache')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
        ) : (
          <>
            {/* Stats */}
            <div className="adm-stats-grid">
              {[
                { label: 'Entradas totales', val: stats?.totalEntries ?? 0,  icon: 'fa-database',    color: 'blue' },
                { label: 'Hits totales',     val: stats?.totalHits ?? 0,     icon: 'fa-bullseye',    color: 'green' },
                { label: 'Misses totales',   val: stats?.totalMisses ?? 0,   icon: 'fa-xmark',       color: 'orange' },
                { label: 'Hit rate',         val: `${stats?.hitRate ?? 0}%`, icon: 'fa-percent',     color: 'purple' },
              ].map(({ label, val, icon, color }) => (
                <div key={label} className="adm-stat">
                  <div className={`adm-stat-icon ${color}`}><i className={`fa-solid ${icon}`} /></div>
                  <div>
                    <div className="adm-stat-value">{val}</div>
                    <div className="adm-stat-label">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="adm-card">
              <div className="adm-card-header">
                <span className="adm-card-title"><i className="fa-solid fa-broom" />Limpiar caché</span>
              </div>
              <div className="adm-card-body">
                {msg && (
                  <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                    <i className="fa-solid fa-circle-check" /> {msg}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CACHE_TYPES.map(t => (
                    <button
                      key={t}
                      className={`adm-btn ${t === 'all' ? 'danger' : 'outline'} sm`}
                      disabled={clearing}
                      onClick={() => clearCache(t)}
                    >
                      <i className={`fa-solid ${t === 'all' ? 'fa-trash' : 'fa-broom'}`} />
                      {t === 'all' ? 'Limpiar todo' : t}
                    </button>
                  ))}
                  <button className="adm-btn outline sm" onClick={load} disabled={loading}>
                    <i className="fa-solid fa-arrows-rotate" /> Actualizar
                  </button>
                </div>
              </div>
            </div>

            {/* Entradas recientes */}
            <div className="adm-card">
              <div className="adm-card-header">
                <span className="adm-card-title"><i className="fa-solid fa-list" />Entradas recientes</span>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Clave</th><th>Tipo</th><th>Accesos</th><th>Creado</th><th>Expira</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr><td colSpan={6}><div className="adm-table-empty"><i className="fa-solid fa-database" />Sin entradas</div></td></tr>
                    ) : entries.map((e: any) => (
                      <tr key={e.id}>
                        <td className="mono" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.cache_key}</td>
                        <td><span className="adm-badge default">{e.cache_type}</span></td>
                        <td>{e.access_count}</td>
                        <td className="muted">{fmtDate(e.created_at)}</td>
                        <td className="muted">{fmtDate(e.expires_at)}</td>
                        <td><span className={`adm-badge ${e.is_valid ? 'success' : 'danger'}`}>{e.is_valid ? 'Válido' : 'Expirado'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </PermissionGuard>
  );
}
