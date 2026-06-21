'use client';

import { useEffect, useState } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import ImageUploader from '../ui/ImageUploader';
import { notifySettingsUpdated } from '@/context/SiteSettingsContext';
import IntegrationsToggle from '@/components/admin/IntegrationsToggle';

// Aplica CSS vars localmente sin necesitar el export público
function applyCSSVarsPublic(settings: Record<string, string>) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (settings.primary_color) root.style.setProperty('--color-primary', settings.primary_color);
  if (settings.secondary_color) root.style.setProperty('--color-secondary', settings.secondary_color);
  if (settings.font_family) root.style.setProperty('--font-family', settings.font_family + ', sans-serif');
  if (settings.hero_color) root.style.setProperty('--color-hero', settings.hero_color);
}

interface Setting { key: string; value: string; type: string; category: string; label: string; description?: string; }
interface Props { role: AdminRole; }

// Secciones con icono, label y categoría DB
const SECTIONS = [
  { id: 'design',     label: 'Colores y diseño', icon: 'fa-palette',         desc: 'Color primario, secundario y fuente del sitio' },
  { id: 'empresa',    label: 'Empresa',          icon: 'fa-building',        desc: 'Datos de la empresa, logo y copyright' },
  { id: 'topbar',     label: 'Barra superior',   icon: 'fa-bars',            desc: 'Texto de bienvenida, teléfono y soporte' },
  { id: 'hero',       label: 'Banner principal', icon: 'fa-image',           desc: 'Imagen, título y colores del banner' },
  { id: 'secciones',  label: 'Secciones',        icon: 'fa-layer-group',     desc: 'Títulos y textos de cada sección del inicio' },
  { id: 'footer',     label: 'Footer',           icon: 'fa-shoe-prints',     desc: 'Contacto, descripción y créditos del pie' },
  { id: 'social',     label: 'Redes sociales',   icon: 'fa-share-nodes',     desc: 'URLs de WhatsApp, Facebook, Instagram...' },
  { id: 'seo',        label: 'SEO',              icon: 'fa-magnifying-glass',desc: 'Meta descripción, keywords, Analytics' },
  { id: 'subscribe',  label: 'Suscripción / App',icon: 'fa-mobile-screen',   desc: 'App Store, Play Store, QR y newsletter' },
  { id: 'pagos',      label: 'Pagos',            icon: 'fa-credit-card',     desc: 'Métodos de pago, moneda, IVA y banco' },
  { id: 'cache',      label: 'Caché API',        icon: 'fa-database',        desc: 'TTL de caché para vuelos, hoteles...' },
  { id: 'sistema',    label: 'Sistema',          icon: 'fa-gear',            desc: 'Mantenimiento, límites y configuración técnica' },
];

export default function SettingsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [settings, setSettings]     = useState<Setting[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [activeSection, setSection] = useState('empresa');
  const [values, setValues]         = useState<Record<string, string>>({});
  const [changed, setChanged]       = useState<Set<string>>(new Set());

  // Cambio de contraseña
  const [showPwd, setShowPwd]       = useState(false);
  const [pwd, setPwd]               = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdMsg, setPwdMsg]         = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // [RESET-DEMO-START] — Para eliminar: borra desde aquí hasta [RESET-DEMO-END]
  const [showReset, setShowReset]   = useState(false);
  const [resetMode, setResetMode]   = useState<'partial' | 'total'>('partial');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg]     = useState<{ ok: boolean; text: string } | null>(null);
  const [resetConfirm, setResetConfirm] = useState('');

  const handleReset = async () => {
    if (resetConfirm !== 'RESETEAR') {
      setResetMsg({ ok: false, text: 'Escribe RESETEAR para confirmar' });
      return;
    }
    setResetLoading(true); setResetMsg(null);
    try {
      const r = await adminFetch(`${API}/admin/reset-demo`, {
        method: 'POST',
        body: JSON.stringify({ mode: resetMode, adminEmail: 'admin' }),
      });
      const d = await r.json();
      if (d.success) {
        setResetMsg({ ok: true, text: d.message });
        setResetConfirm('');
        // Refrescar badge de reservas en el sidebar
        try { new BroadcastChannel('ta_admin_refresh').postMessage('stats'); } catch { /* silencioso */ }
      } else {
        setResetMsg({ ok: false, text: d.error?.message || 'Error en el reseteo' });
      }
    } catch {
      setResetMsg({ ok: false, text: 'Error de conexión' });
    } finally {
      setResetLoading(false);
    }
  };
  // [RESET-DEMO-END]

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await adminFetch(`${API}/cms/settings`);
        const d = await r.json();
        const list: Setting[] = d.data || [];
        setSettings(list);
        const map: Record<string, string> = {};
        list.forEach(s => { map[s.key] = s.value || ''; });
        setValues(map);
      } catch { /* silencioso */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const set = (key: string, val: string) => {
    setValues(v => ({ ...v, [key]: val }));
    setChanged(c => new Set(c).add(key));
  };

  const saveSection = async () => {
    if (changed.size === 0) return;
    setSaving(true); setSaved(false);
    try {
      const toSave = [...changed].map(key => ({ key, value: values[key] ?? '' }));
      await adminFetch(`${API}/cms/settings`, {
        method: 'PUT', body: JSON.stringify({ settings: toSave }),
      });
      setSaved(true);
      setChanged(new Set());
      // Aplicar CSS vars inmediatamente en este tab
      applyCSSVarsPublic(values);
      // Notificar a otras tabs
      notifySettingsUpdated();
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silencioso */ }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pwd.newPwd || pwd.newPwd.length < 8) { setPwdMsg('Mínimo 8 caracteres'); return; }
    if (pwd.newPwd !== pwd.confirm) { setPwdMsg('Las contraseñas no coinciden'); return; }
    setPwdLoading(true); setPwdMsg('');
    try {
      const r = await adminFetch(`${API}/auth/change-password`, {
        method: 'POST', body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.newPwd }),
      });
      const d = await r.json();
      if (d.success) { setPwdMsg('✓ Contraseña actualizada'); setPwd({ current: '', newPwd: '', confirm: '' }); }
      else setPwdMsg(d.error?.message || 'Error al cambiar contraseña');
    } catch { setPwdMsg('Error de conexión'); }
    finally { setPwdLoading(false); }
  };

  const filtered = settings.filter(s => s.category === activeSection);

  const renderInput = (s: Setting) => {
    const val = values[s.key] ?? '';
    const disabled = !can('settings');

    if (s.type === 'boolean') return (
      <label className="adm-toggle">
        <input type="checkbox" checked={val === 'true'} disabled={disabled}
          onChange={e => set(s.key, e.target.checked ? 'true' : 'false')} />
        <span className="adm-toggle-track" />
        <span className="adm-toggle-label" style={{ color: val === 'true' ? 'var(--adm-success)' : 'var(--adm-text-muted)' }}>
          {val === 'true' ? 'Activado' : 'Desactivado'}
        </span>
      </label>
    );

    if (s.type === 'color') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={val || '#000000'} disabled={disabled}
          onChange={e => set(s.key, e.target.value)}
          style={{ width: 44, height: 38, border: '1px solid var(--adm-border)', borderRadius: 8, cursor: 'pointer', padding: 3 }} />
        <input className="adm-input" value={val} disabled={disabled}
          onChange={e => set(s.key, e.target.value)}
          style={{ flex: 1, fontFamily: 'monospace' }} />
        {val && <div style={{ width: 38, height: 38, borderRadius: 8, background: val, border: '1px solid var(--adm-border)', flexShrink: 0 }} />}
      </div>
    );

    if (s.type === 'number') return (
      <input className="adm-input" type="number" value={val} disabled={disabled}
        onChange={e => set(s.key, e.target.value)} />
    );

    if (s.type === 'image' || s.key.endsWith('_image') || s.key.endsWith('_logo') || s.key.endsWith('_favicon')) return (
      <ImageUploader
        value={val}
        onChange={url => set(s.key, url)}
        placeholder="https://… o /img/…"
        height={80}
      />
    );

    // text largo (description, about, etc.)
    if (val.length > 80 || s.key.includes('desc') || s.key.includes('about') || s.key.includes('message')) return (
      <textarea className="adm-textarea" rows={3} value={val} disabled={disabled}
        onChange={e => set(s.key, e.target.value)} />
    );

    return (
      <input className="adm-input" value={val} disabled={disabled}
        onChange={e => set(s.key, e.target.value)}
        placeholder={s.description || ''} />
    );
  };

  return (
    <PermissionGuard allowed={can('settings')}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Sidebar de secciones ── */}
        <div style={{ width: 220, flexShrink: 0, position: 'sticky', top: 80 }}>
          {/* Cambio de contraseña */}
          <div className="adm-card" style={{ marginBottom: 12 }}>
            <button
              onClick={() => setShowPwd(s => !s)}
              style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--adm-text)' }}
            >
              <i className="fa-solid fa-lock" style={{ color: 'var(--adm-primary)', width: 16 }} />
              Cambiar contraseña
              <i className={`fa-solid fa-chevron-${showPwd ? 'up' : 'down'}`} style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--adm-text-muted)' }} />
            </button>
            {showPwd && (
              <div style={{ padding: '0 14px 14px' }}>
                {pwdMsg && (
                  <div style={{ background: pwdMsg.startsWith('✓') ? '#dcfce7' : '#fee2e2', color: pwdMsg.startsWith('✓') ? '#15803d' : '#b91c1c', padding: '8px 10px', borderRadius: 6, marginBottom: 10, fontSize: 12 }}>
                    {pwdMsg}
                  </div>
                )}
                <div className="adm-form-group" style={{ marginBottom: 8 }}>
                  <label className="adm-label">Contraseña actual</label>
                  <input className="adm-input" type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
                </div>
                <div className="adm-form-group" style={{ marginBottom: 8 }}>
                  <label className="adm-label">Nueva contraseña</label>
                  <input className="adm-input" type="password" value={pwd.newPwd} onChange={e => setPwd(p => ({ ...p, newPwd: e.target.value }))} placeholder="Mínimo 8 caracteres" />
                </div>
                <div className="adm-form-group" style={{ marginBottom: 10 }}>
                  <label className="adm-label">Confirmar</label>
                  <input className="adm-input" type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} placeholder="Repite la contraseña" />
                </div>
                <button className="adm-btn primary" style={{ width: '100%' }} onClick={changePassword} disabled={pwdLoading || !pwd.current || !pwd.newPwd || !pwd.confirm}>
                  {pwdLoading ? <><div className="adm-spinner" style={{ width: 12, height: 12 }} /> Cambiando…</> : <><i className="fa-solid fa-key" /> Cambiar</>}
                </button>
              </div>
            )}
          </div>

          {/* Nav de secciones */}

          {/* [RESET-DEMO-START] — Para eliminar: borra desde aquí hasta [RESET-DEMO-END] */}
          <div className="adm-card" style={{ marginBottom: 12, border: '1px solid #fca5a5' }}>
            <button
              onClick={() => { setShowReset(s => !s); setResetMsg(null); setResetConfirm(''); }}
              style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#dc2626' }}
            >
              <i className="fa-solid fa-trash-can" style={{ width: 16 }} />
              Resetear datos demo
              <i className={`fa-solid fa-chevron-${showReset ? 'up' : 'down'}`} style={{ marginLeft: 'auto', fontSize: 10 }} />
            </button>
            {showReset && (
              <div style={{ padding: '0 14px 14px' }}>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, lineHeight: 1.5 }}>

                  Borra reservas, facturas y caché. La configuración del sitio <strong>no se toca</strong>.
                </p>

                {/* Selector de modo */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {(['partial', 'total'] as const).map(m => (
                    <button key={m} onClick={() => setResetMode(m)}
                      style={{ flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600, borderRadius: 6, border: `2px solid ${resetMode === m ? '#dc2626' : '#e5e7eb'}`, background: resetMode === m ? '#fee2e2' : 'white', color: resetMode === m ? '#dc2626' : '#6b7280', cursor: 'pointer' }}>
                      {m === 'partial' ? 'Parcial' : 'Total'}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>
                  {resetMode === 'partial'
                    ? 'Borra: reservas, facturas, caché'
                    : 'Borra: todo lo anterior + usuarios de prueba + márgenes'}
                </p>

                {/* Confirmación */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    Escribe <strong>RESETEAR</strong> para confirmar
                  </label>
                  <input
                    value={resetConfirm}
                    onChange={e => setResetConfirm(e.target.value)}
                    placeholder="RESETEAR"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>

                {resetMsg && (
                  <div style={{ background: resetMsg.ok ? '#dcfce7' : '#fee2e2', color: resetMsg.ok ? '#15803d' : '#b91c1c', padding: '8px 10px', borderRadius: 6, marginBottom: 8, fontSize: 12 }}>
                    {resetMsg.ok ? <i className="fa-solid fa-check-circle" style={{ marginRight: 6 }} /> : <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />}
                    {resetMsg.text}
                  </div>
                )}

                <button
                  onClick={handleReset}
                  disabled={resetLoading || resetConfirm !== 'RESETEAR'}
                  style={{ width: '100%', padding: '8px 0', background: resetConfirm === 'RESETEAR' ? '#dc2626' : '#e5e7eb', color: resetConfirm === 'RESETEAR' ? 'white' : '#9ca3af', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: resetConfirm === 'RESETEAR' ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {resetLoading
                    ? <><div className="adm-spinner" style={{ width: 12, height: 12 }} /> Reseteando…</>
                    : <><i className="fa-solid fa-trash-can" /> Resetear ahora</>}
                </button>
              </div>
            )}
          </div>
          {/* [RESET-DEMO-END] */}

          <div className="adm-card" style={{ marginBottom: 12 }}>
            <div className="adm-card-body" style={{ padding: 16 }}>
              <IntegrationsToggle />
            </div>
          </div>

          {/* Nav de secciones */}
          <div className="adm-card">
            <div style={{ padding: '8px 0' }}>
              {SECTIONS.map(sec => (
                <button key={sec.id} onClick={() => setSection(sec.id)}
                  style={{
                    width: '100%', padding: '9px 14px', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, fontWeight: activeSection === sec.id ? 700 : 400,
                    color: activeSection === sec.id ? 'var(--adm-primary)' : 'var(--adm-text)',
                    borderLeft: `3px solid ${activeSection === sec.id ? 'var(--adm-primary)' : 'transparent'}`,
                    background: activeSection === sec.id ? '#f0f4ff' : 'transparent',
                    textAlign: 'left',
                  }}>
                  <i className={`fa-solid ${sec.icon}`} style={{ width: 16, color: activeSection === sec.id ? 'var(--adm-primary)' : 'var(--adm-text-muted)', fontSize: 13 }} />
                  {sec.label}
                  {settings.filter(s => s.category === sec.id).length > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--adm-text-muted)' }}>
                      {settings.filter(s => s.category === sec.id).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Contenido de la sección ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Cargando configuración…</span></div>
          ) : (
            <div className="adm-card">
              <div className="adm-card-header">
                <div>
                  <span className="adm-card-title">
                    <i className={`fa-solid ${SECTIONS.find(s => s.id === activeSection)?.icon}`} />
                    {SECTIONS.find(s => s.id === activeSection)?.label}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                    {SECTIONS.find(s => s.id === activeSection)?.desc}
                  </div>
                </div>
                {can('settings') && (
                  <button className="adm-btn primary sm" onClick={saveSection} disabled={saving || changed.size === 0}>
                    {saving ? <><div className="adm-spinner" style={{ width: 12, height: 12 }} /> Guardando…</>
                      : saved ? <><i className="fa-solid fa-circle-check" /> Guardado</>
                      : changed.size > 0 ? <><i className="fa-solid fa-save" /> Guardar ({changed.size})</>
                      : <><i className="fa-solid fa-save" /> Guardar</>}
                  </button>
                )}
              </div>

              <div className="adm-card-body">
                {filtered.length === 0 ? (
                  <div className="adm-empty">
                    <i className="fa-solid fa-gear" />
                    <p>Sin configuraciones en esta sección.</p>
                    <p style={{ fontSize: 12, marginTop: 4 }}>Ejecuta el script <code>add-site-settings.sql</code> en Supabase.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {filtered.map(s => (
                      <div key={s.key} className="adm-form-group" style={{ marginBottom: 0 }}>
                        <label className="adm-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {s.label}
                          {changed.has(s.key) && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} title="Sin guardar" />
                          )}
                        </label>
                        {renderInput(s)}
                        {s.description && (
                          <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3 }}>{s.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer con botón guardar también abajo */}
              {can('settings') && filtered.length > 4 && (
                <div className="adm-card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="adm-btn primary" onClick={saveSection} disabled={saving || changed.size === 0}>
                    {saving ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</>
                      : saved ? <><i className="fa-solid fa-circle-check" /> Guardado</>
                      : <><i className="fa-solid fa-save" /> Guardar cambios</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
