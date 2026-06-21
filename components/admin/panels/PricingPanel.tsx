'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

// ── Tipos ──────────────────────────────────────────────────────
interface ServiceMargin {
  key: string;
  service: string;
  label: string;
  icon: string;
  color: string;
  value: number;
  description: string;
}

interface AgentMargin {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_email: string;
  service: string;
  margin_pct: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

const SERVICES: Omit<ServiceMargin, 'value'>[] = [
  { key: 'margin_flights',   service: 'flights',   label: 'Vuelos',     icon: 'fa-plane',           color: '#003580', description: 'Margen sobre precio Amadeus en búsquedas de vuelos' },
  { key: 'margin_hotels',    service: 'hotels',    label: 'Hoteles',    icon: 'fa-bed',             color: '#0284c7', description: 'Margen sobre precio Amadeus en búsquedas de hoteles' },
  { key: 'margin_packages',  service: 'packages',  label: 'Paquetes',   icon: 'fa-suitcase-rolling',color: '#7c3aed', description: 'Margen sobre precio en paquetes vacacionales' },
  { key: 'margin_buses',     service: 'buses',     label: 'Autobuses',  icon: 'fa-bus',             color: '#0d9488', description: 'Margen sobre precio en billetes de autobús' },
  { key: 'margin_transfers', service: 'transfers', label: 'Traslados',  icon: 'fa-car',             color: '#ea580c', description: 'Margen sobre precio en traslados y taxi' },
];

const fmt = (n: number, cur = 'EUR') =>
  n.toLocaleString('es-ES', { style: 'currency', currency: cur, minimumFractionDigits: 2 });

interface Props { role: AdminRole; }

export default function PricingPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can, isAdmin, isManager } = useAdminRole(role);

  const [margins, setMargins]         = useState<ServiceMargin[]>([]);
  const [enabled, setEnabled]         = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState<string | null>(null);
  const [saved, setSaved]             = useState<string | null>(null);
  const [agentMargins, setAgentMargins] = useState<AgentMargin[]>([]);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentForm, setAgentForm]     = useState({ agent_email: '', service: 'flights', margin_pct: 0, notes: '' });
  const [agentSaving, setAgentSaving] = useState(false);

  // Precio de ejemplo para preview
  const [examplePrice, setExamplePrice] = useState(500);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/cms/settings`);
      const d = await r.json();
      const settings: any[] = d.data || [];
      const map: Record<string, string> = {};
      settings.forEach(s => { map[s.key] = s.value || ''; });

      setEnabled(map.margin_enabled !== 'false');
      setShowOriginal(map.margin_show_original === 'true');
      setMargins(SERVICES.map(s => ({
        ...s,
        value: parseFloat(map[s.key] || '0') || 0,
      })));
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  const loadAgentMargins = useCallback(async () => {
    try {
      const r = await adminFetch(`${API}/admin/agent-margins`);
      const d = await r.json();
      setAgentMargins(d.data || []);
    } catch { setAgentMargins([]); }
  }, []);

  useEffect(() => { load(); loadAgentMargins(); }, [load, loadAgentMargins]);

  // Guardar un margen individual
  const saveMargin = async (key: string, value: number) => {
    setSaving(key);
    try {
      await adminFetch(`${API}/cms/settings/${key}`, {
        method: 'PUT', body: JSON.stringify({ value: String(value) }),
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch { /* silencioso */ }
    finally { setSaving(null); }
  };

  // Guardar toggle global
  const saveToggle = async (key: string, val: boolean) => {
    await adminFetch(`${API}/cms/settings/${key}`, {
      method: 'PUT', body: JSON.stringify({ value: val ? 'true' : 'false' }),
    });
  };

  // Guardar margen de agente
  const saveAgentMargin = async () => {
    if (!agentForm.agent_email) return;
    setAgentSaving(true);
    try {
      await adminFetch(`${API}/admin/agent-margins`, {
        method: 'POST', body: JSON.stringify(agentForm),
      });
      setShowAgentForm(false);
      setAgentForm({ agent_email: '', service: 'flights', margin_pct: 0, notes: '' });
      loadAgentMargins();
    } catch { /* silencioso */ }
    finally { setAgentSaving(false); }
  };

  const deleteAgentMargin = async (id: string) => {
    if (!confirm('¿Eliminar este margen de agente?')) return;
    await adminFetch(`${API}/admin/agent-margins/${id}`, { method: 'DELETE' });
    loadAgentMargins();
  };

  const canEdit = isAdmin || isManager;

  return (
    <PermissionGuard allowed={can('settings') || isManager}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Controles globales ── */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-percent" />
              Márgenes de ganancia
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label className="adm-toggle">
                <input type="checkbox" checked={showOriginal} disabled={!canEdit}
                  onChange={e => { setShowOriginal(e.target.checked); saveToggle('margin_show_original', e.target.checked); }} />
                <span className="adm-toggle-track" />
                <span className="adm-toggle-label" style={{ fontSize: 12 }}>Mostrar precio original tachado</span>
              </label>
              <label className="adm-toggle">
                <input type="checkbox" checked={enabled} disabled={!canEdit}
                  onChange={e => { setEnabled(e.target.checked); saveToggle('margin_enabled', e.target.checked); }} />
                <span className="adm-toggle-track" />
                <span className="adm-toggle-label" style={{ color: enabled ? 'var(--adm-success)' : 'var(--adm-danger)', fontWeight: 700, fontSize: 13 }}>
                  {enabled ? 'Márgenes ACTIVOS' : 'Márgenes DESACTIVADOS'}
                </span>
              </label>
            </div>
          </div>

          {!enabled && (
            <div style={{ background: '#fef9c3', border: '1px solid #fde68a', padding: '10px 20px', fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-triangle-exclamation" />
              Los márgenes están desactivados. Los precios de Amadeus se muestran sin modificar.
            </div>
          )}

          <div className="adm-card-body">
            {/* Preview de precio */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 13, color: 'var(--adm-text-muted)', fontWeight: 600 }}>
                  <i className="fa-solid fa-calculator" style={{ marginRight: 6 }} />
                  Simulador de precio:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>Precio Amadeus:</span>
                  <input
                    type="number" min="0" step="10" value={examplePrice}
                    onChange={e => setExamplePrice(Number(e.target.value))}
                    style={{ width: 90, padding: '4px 8px', border: '1px solid var(--adm-border)', borderRadius: 6, fontSize: 13, textAlign: 'right' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>€</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {margins.map(m => (
                    <div key={m.key} style={{ background: '#fff', border: `1px solid ${m.color}33`, borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--adm-text-muted)', marginBottom: 2 }}>
                        <i className={`fa-solid ${m.icon}`} style={{ color: m.color, marginRight: 3 }} />{m.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>
                        {fmt(examplePrice * (1 + m.value / 100))}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--adm-text-muted)' }}>
                        +{fmt(examplePrice * m.value / 100)} ({m.value}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sliders de margen por servicio */}
            {loading ? (
              <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {margins.map(m => (
                  <div key={m.key} style={{ background: '#fff', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: m.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`fa-solid ${m.icon}`} style={{ color: m.color, fontSize: 16 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{m.description}</div>
                      </div>
                      {/* Valor numérico editable */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number" min="0" max="100" step="0.5"
                          value={m.value}
                          disabled={!canEdit}
                          onChange={e => {
                            const v = Math.min(100, Math.max(0, Number(e.target.value)));
                            setMargins(ms => ms.map(x => x.key === m.key ? { ...x, value: v } : x));
                          }}
                          style={{ width: 70, padding: '6px 10px', border: `2px solid ${m.color}`, borderRadius: 8, fontSize: 16, fontWeight: 800, textAlign: 'center', color: m.color, outline: 'none' }}
                        />
                        <span style={{ fontSize: 18, fontWeight: 800, color: m.color }}>%</span>
                      </div>
                      {/* Botón guardar */}
                      {canEdit && (
                        <button
                          className="adm-btn primary sm"
                          style={{ background: saved === m.key ? 'var(--adm-success)' : m.color, minWidth: 80 }}
                          disabled={saving === m.key}
                          onClick={() => saveMargin(m.key, m.value)}
                        >
                          {saving === m.key
                            ? <><div className="adm-spinner" style={{ width: 12, height: 12 }} /> Guardando</>
                            : saved === m.key
                            ? <><i className="fa-solid fa-check" /> Guardado</>
                            : <><i className="fa-solid fa-save" /> Guardar</>
                          }
                        </button>
                      )}
                    </div>

                    {/* Slider visual */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="range" min="0" max="50" step="0.5"
                        value={m.value}
                        disabled={!canEdit}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setMargins(ms => ms.map(x => x.key === m.key ? { ...x, value: v } : x));
                        }}
                        style={{ width: '100%', accentColor: m.color, height: 6, cursor: canEdit ? 'pointer' : 'not-allowed' }}
                      />
                      {/* Marcas de referencia */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(v => (
                          <span key={v} style={{ fontSize: 9, color: v === Math.round(m.value) ? m.color : 'var(--adm-text-muted)', fontWeight: v === Math.round(m.value) ? 700 : 400 }}>
                            {v}%
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Preview del precio con este margen */}
                    <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12 }}>
                      <span style={{ color: 'var(--adm-text-muted)' }}>
                        Precio Amadeus: <strong>{fmt(examplePrice)}</strong>
                      </span>
                      <span style={{ color: 'var(--adm-text-muted)' }}>→</span>
                      <span style={{ color: m.color, fontWeight: 700 }}>
                        Precio cliente: <strong>{fmt(examplePrice * (1 + m.value / 100))}</strong>
                      </span>
                      <span style={{ color: 'var(--adm-success)', fontWeight: 600 }}>
                        Tu ganancia: +{fmt(examplePrice * m.value / 100)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Flash Deals ── */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-bolt" style={{ color: '#f59e0b' }} />
              Ofertas Flash
              <span style={{ fontSize: 12, color: 'var(--adm-text-muted)', fontWeight: 400 }}>
                — Vuelos de última hora en la página de inicio
              </span>
            </span>
          </div>
          <div className="adm-card-body">
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 16px', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <i className="fa-solid fa-circle-info" style={{ color: '#0284c7', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>¿Cómo funcionan las Ofertas Flash?</div>
                  <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--adm-text-muted)', lineHeight: 1.8 }}>
                    <li>Se muestran automáticamente en la página de inicio con vuelos reales de Amadeus</li>
                    <li>Se buscan en <strong>rutas populares</strong> con salida en los próximos 1-3 días</li>
                    <li>El precio mostrado ya incluye el <strong>margen de vuelos ({margins.find(m => m.key === 'margin_flights')?.value ?? 0}%)</strong> configurado arriba</li>
                    <li>Se actualizan automáticamente cada 30 minutos</li>
                    <li>Solo se muestran vuelos con precio inferior a 900€</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Preview de cómo se ve el margen en flash deals */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--adm-text)' }}>
                <i className="fa-solid fa-eye" style={{ marginRight: 6 }} />
                Ejemplo de tarjeta con margen aplicado:
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {(() => {
                  const flightMargin = margins.find(m => m.key === 'margin_flights')?.value ?? 0;
                  const exPrice = 320;
                  const finalP = exPrice * (1 + flightMargin / 100);
                  return (
                    <div style={{ width: 210, background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px rgba(0,0,0,.1)', border: '1px solid var(--adm-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--color-primary, #003580)' }}>MAD</span>
                        <i className="fa-solid fa-plane" style={{ color: 'var(--color-primary, #003580)', fontSize: 12 }} />
                        <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--color-primary, #003580)' }}>BOG</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 6 }}>
                        <span>08:30</span>
                        <span style={{ fontSize: 10, color: '#999' }}>11h 20m</span>
                        <span>14:50</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 12 }}>
                        <span>15 ene</span>
                        <span>Directo</span>
                      </div>
                      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#999' }}>desde</div>
                          {flightMargin > 0 && (
                            <div style={{ fontSize: 11, color: '#bbb', textDecoration: 'line-through', lineHeight: 1 }}>
                              {exPrice}€
                            </div>
                          )}
                          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-secondary, #ee1d25)', lineHeight: 1 }}>
                            {Math.round(finalP)}€
                          </div>
                          <div style={{ fontSize: 10, color: '#999' }}>por persona</div>
                        </div>
                        <div style={{ background: 'var(--color-primary, #003580)', color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 700 }}>
                          Reservar
                        </div>
                      </div>
                      {flightMargin > 0 && (
                        <div style={{ marginTop: 8, background: '#dcfce7', borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#15803d', textAlign: 'center', fontWeight: 600 }}>
                          Tu ganancia: +{Math.round(exPrice * flightMargin / 100)}€ ({flightMargin}%)
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, padding: '0 8px' }}>
                  <div style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>
                    <i className="fa-solid fa-check-circle" style={{ color: 'var(--adm-success)', marginRight: 6 }} />
                    El precio tachado muestra el precio original de Amadeus
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>
                    <i className="fa-solid fa-check-circle" style={{ color: 'var(--adm-success)', marginRight: 6 }} />
                    El precio en rojo incluye tu margen de ganancia
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>
                    <i className="fa-solid fa-check-circle" style={{ color: 'var(--adm-success)', marginRight: 6 }} />
                    El badge verde muestra tu ganancia por reserva
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                    * El precio tachado solo aparece si "Mostrar precio original tachado" está activado
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Márgenes por agente ── */}
        {(isAdmin || isManager) && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">
                <i className="fa-solid fa-user-tie" />
                Márgenes especiales por agente
                <span style={{ fontSize: 12, color: 'var(--adm-text-muted)', fontWeight: 400 }}>
                  — Sobreescribe el margen global para un agente específico
                </span>
              </span>
              {canEdit && (
                <button className="adm-btn primary sm" onClick={() => setShowAgentForm(true)}>
                  <i className="fa-solid fa-plus" /> Añadir agente
                </button>
              )}
            </div>

            {agentMargins.length === 0 ? (
              <div className="adm-empty" style={{ padding: 32 }}>
                <i className="fa-solid fa-user-tie" />
                <p>Sin márgenes especiales por agente. Todos usan el margen global.</p>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Agente</th><th>Servicio</th><th>Margen</th><th>Estado</th><th>Notas</th>{canEdit && <th>Acciones</th>}</tr>
                  </thead>
                  <tbody>
                    {agentMargins.map(a => {
                      const svc = SERVICES.find(s => s.service === a.service);
                      return (
                        <tr key={a.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{a.agent_name || a.agent_email}</div>
                            <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{a.agent_email}</div>
                          </td>
                          <td>
                            <span className="adm-badge default">
                              {svc && <i className={`fa-solid ${svc.icon}`} style={{ marginRight: 4, color: svc.color }} />}
                              {svc?.label || a.service}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: 18, fontWeight: 800, color: svc?.color || 'var(--adm-primary)' }}>
                              {a.margin_pct}%
                            </span>
                          </td>
                          <td>
                            <span className={`adm-badge ${a.is_active ? 'success' : 'default'}`}>
                              {a.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="muted">{a.notes || '—'}</td>
                          {canEdit && (
                            <td>
                              <button className="adm-btn danger icon-only sm" onClick={() => deleteAgentMargin(a.id)}>
                                <i className="fa-solid fa-trash" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Modal añadir margen de agente ── */}
        {showAgentForm && (
          <div className="adm-modal-overlay" onClick={() => setShowAgentForm(false)}>
            <div className="adm-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title"><i className="fa-solid fa-user-plus" style={{ marginRight: 8 }} />Margen especial para agente</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowAgentForm(false)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <label className="adm-label">Email del agente *</label>
                  <input className="adm-input" type="email" placeholder="agente@tuagencia.com"
                    value={agentForm.agent_email} onChange={e => setAgentForm(f => ({ ...f, agent_email: e.target.value }))} />
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3 }}>
                    El agente debe existir en el panel de Usuarios con rol "Agente"
                  </div>
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Servicio</label>
                    <select className="adm-select" value={agentForm.service} onChange={e => setAgentForm(f => ({ ...f, service: e.target.value }))}>
                      {SERVICES.map(s => <option key={s.service} value={s.service}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Margen (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input className="adm-input" type="number" min="0" max="100" step="0.5"
                        value={agentForm.margin_pct} onChange={e => setAgentForm(f => ({ ...f, margin_pct: Number(e.target.value) }))} />
                      <span style={{ fontWeight: 700, fontSize: 16 }}>%</span>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div style={{ background: '#f0f4ff', border: '1px solid #c7d7f9', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                  <i className="fa-solid fa-calculator" style={{ marginRight: 6, color: 'var(--adm-primary)' }} />
                  Precio Amadeus <strong>{fmt(examplePrice)}</strong> →
                  Precio cliente <strong style={{ color: 'var(--adm-primary)' }}>{fmt(examplePrice * (1 + agentForm.margin_pct / 100))}</strong>
                  <span style={{ color: 'var(--adm-success)', marginLeft: 8 }}>
                    +{fmt(examplePrice * agentForm.margin_pct / 100)} ganancia
                  </span>
                </div>

                <div className="adm-form-group">
                  <label className="adm-label">Notas internas</label>
                  <input className="adm-input" placeholder="Ej: Margen especial por volumen de ventas"
                    value={agentForm.notes} onChange={e => setAgentForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowAgentForm(false)}>Cancelar</button>
                <button className="adm-btn primary" onClick={saveAgentMargin} disabled={agentSaving || !agentForm.agent_email}>
                  {agentSaving ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</> : <><i className="fa-solid fa-save" /> Guardar margen</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
