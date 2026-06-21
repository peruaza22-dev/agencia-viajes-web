'use client';

import { useEffect, useState } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface MarketData {
  byCountry: { country: string; code: string; count: number; revenue: number; currency: string }[];
  byCity: { city: string; country: string; code: string; count: number; revenue: number }[];
  byTimezone: { timezone: string; count: number; revenue: number }[];
  byLanguage: { language: string; count: number }[];
  total: number;
  totalRevenue: number;
}

const fmt = (n: number, cur = 'EUR') =>
  Number(n).toLocaleString('es-ES', { style: 'currency', currency: cur.length === 3 ? cur : 'EUR', minimumFractionDigits: 0 });

// Banderas por código de país (emoji)
const flag = (code: string) => {
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
};

// Colores para barras
const BAR_COLORS = ['#003580','#0284c7','#0d9488','#7c3aed','#ea580c','#16a34a','#dc2626','#d97706'];

interface Props { role: AdminRole; }

export default function MarketPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [data, setData]       = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState<'countries' | 'cities' | 'timezones' | 'languages'>('countries');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await adminFetch(`${API}/admin/market`);
        const d = await r.json();
        if (d.success) setData(d.data);
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (!can('analytics')) return (
    <div className="adm-no-access">
      <i className="fa-solid fa-lock" />
      <h3>Acceso restringido</h3>
      <p>Solo admin y manager pueden ver el análisis de mercado.</p>
    </div>
  );

  return (
    <PermissionGuard allowed={can('analytics')}>
      <div>
        {/* KPIs */}
        <div className="adm-stats-grid" style={{ marginBottom: 20 }}>
          <div className="adm-stat">
            <div className="adm-stat-icon blue"><i className="fa-solid fa-globe" /></div>
            <div>
              <div className="adm-stat-value">{data?.byCountry.length ?? 0}</div>
              <div className="adm-stat-label">Países con ventas</div>
            </div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-icon teal"><i className="fa-solid fa-city" /></div>
            <div>
              <div className="adm-stat-value">{data?.byCity.length ?? 0}</div>
              <div className="adm-stat-label">Ciudades</div>
            </div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-icon purple"><i className="fa-solid fa-clock-rotate-left" /></div>
            <div>
              <div className="adm-stat-value">{data?.byTimezone.length ?? 0}</div>
              <div className="adm-stat-label">Zonas horarias</div>
            </div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-icon green"><i className="fa-solid fa-coins" /></div>
            <div>
              <div className="adm-stat-value">{fmt(data?.totalRevenue ?? 0)}</div>
              <div className="adm-stat-label">Ingresos globales</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {([
            ['countries',  'fa-flag',         'Por país'],
            ['cities',     'fa-city',         'Por ciudad'],
            ['timezones',  'fa-clock',        'Por zona horaria'],
            ['languages',  'fa-language',     'Por idioma'],
          ] as [typeof view, string, string][]).map(([v, icon, label]) => (
            <button key={v} className={`adm-btn ${view === v ? 'primary' : 'outline'}`} onClick={() => setView(v)}>
              <i className={`fa-solid ${icon}`} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando datos de mercado…</span></div>
        ) : !data ? (
          <div className="adm-card">
            <div className="adm-empty">
              <i className="fa-solid fa-globe" />
              <p>Sin datos de mercado aún. Los datos se recopilan automáticamente con cada nueva reserva.</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Por PAÍS ── */}
            {view === 'countries' && (
              <div className="adm-card">
                <div className="adm-card-header">
                  <span className="adm-card-title"><i className="fa-solid fa-flag" />Ventas por país</span>
                  <span className="adm-badge default">{data.byCountry.length} países</span>
                </div>
                <div className="adm-card-body">
                  {data.byCountry.length === 0 ? (
                    <div className="adm-empty"><i className="fa-solid fa-flag" /><p>Sin datos de país aún</p></div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {data.byCountry.map((c, idx) => {
                        const maxCount = data.byCountry[0]?.count || 1;
                        const pct = Math.round((c.count / maxCount) * 100);
                        return (
                          <div key={c.code || idx}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{flag(c.code)}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.country || 'Desconocido'}</span>
                                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <span className="adm-badge default">{c.count} reservas</span>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--adm-primary)' }}>
                                      {fmt(c.revenue)}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: BAR_COLORS[idx % BAR_COLORS.length], borderRadius: 4, transition: 'width 0.5s' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Por CIUDAD ── */}
            {view === 'cities' && (
              <div className="adm-card">
                <div className="adm-card-header">
                  <span className="adm-card-title"><i className="fa-solid fa-city" />Top ciudades</span>
                  <span className="adm-badge default">{data.byCity.length} ciudades</span>
                </div>
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>#</th><th>Ciudad</th><th>País</th><th>Reservas</th><th>Ingresos</th><th>Participación</th></tr>
                    </thead>
                    <tbody>
                      {data.byCity.length === 0 ? (
                        <tr><td colSpan={6}><div className="adm-table-empty"><i className="fa-solid fa-city" />Sin datos de ciudad</div></td></tr>
                      ) : data.byCity.map((c, idx) => {
                        const pct = data.total ? Math.round((c.count / data.total) * 100) : 0;
                        return (
                          <tr key={`${c.city}-${idx}`}>
                            <td style={{ fontWeight: 700, color: 'var(--adm-text-muted)', width: 32 }}>{idx + 1}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 18 }}>{flag(c.code)}</span>
                                <span style={{ fontWeight: 600 }}>{c.city || 'Desconocida'}</span>
                              </div>
                            </td>
                            <td className="muted">{c.country || '—'}</td>
                            <td><span className="adm-badge default">{c.count}</span></td>
                            <td style={{ fontWeight: 700 }}>{fmt(c.revenue)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, minWidth: 60 }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: BAR_COLORS[idx % BAR_COLORS.length], borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 11, color: 'var(--adm-text-muted)', width: 32 }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Por ZONA HORARIA ── */}
            {view === 'timezones' && (
              <div className="adm-card">
                <div className="adm-card-header">
                  <span className="adm-card-title"><i className="fa-solid fa-clock" />Zonas horarias de compra</span>
                  <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>Indica en qué horario del mundo se compra más</span>
                </div>
                <div className="adm-card-body">
                  {data.byTimezone.length === 0 ? (
                    <div className="adm-empty"><i className="fa-solid fa-clock" /><p>Sin datos de zona horaria</p></div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {data.byTimezone.map((t, idx) => {
                        const maxCount = data.byTimezone[0]?.count || 1;
                        const pct = Math.round((t.count / maxCount) * 100);
                        // Extraer región del timezone (America/Lima → America)
                        const region = t.timezone?.split('/')[0] || 'Unknown';
                        const city   = t.timezone?.split('/')[1]?.replace('_', ' ') || t.timezone;
                        return (
                          <div key={t.timezone || idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: BAR_COLORS[idx % BAR_COLORS.length] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className="fa-solid fa-clock" style={{ color: BAR_COLORS[idx % BAR_COLORS.length], fontSize: 14 }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <div>
                                  <span style={{ fontWeight: 600, fontSize: 13 }}>{city}</span>
                                  <span style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginLeft: 6 }}>{region}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                  <span className="adm-badge default">{t.count} reservas</span>
                                  <span style={{ fontWeight: 700, fontSize: 12 }}>{fmt(t.revenue)}</span>
                                </div>
                              </div>
                              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: BAR_COLORS[idx % BAR_COLORS.length], borderRadius: 3, transition: 'width 0.5s' }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Por IDIOMA ── */}
            {view === 'languages' && (
              <div className="adm-card">
                <div className="adm-card-header">
                  <span className="adm-card-title"><i className="fa-solid fa-language" />Idiomas de los compradores</span>
                </div>
                <div className="adm-card-body">
                  {data.byLanguage.length === 0 ? (
                    <div className="adm-empty"><i className="fa-solid fa-language" /><p>Sin datos de idioma</p></div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {data.byLanguage.map((l, idx) => {
                        const pct = data.total ? Math.round((l.count / data.total) * 100) : 0;
                        // Extraer código de país del language tag (es-PE → PE)
                        const countryCode = l.language?.split('-')[1] || '';
                        const langCode    = l.language?.split('-')[0]?.toUpperCase() || l.language;
                        return (
                          <div key={l.language || idx} style={{ background: '#f8fafc', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <span style={{ fontSize: 24 }}>{flag(countryCode)}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{l.language || 'Desconocido'}</div>
                                <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{langCode}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--adm-text)' }}>{l.count}</span>
                              <span className="adm-badge info">{pct}%</span>
                            </div>
                            <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: BAR_COLORS[idx % BAR_COLORS.length], borderRadius: 2 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PermissionGuard>
  );
}
