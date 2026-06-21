'use client';

/**
 * OperationsPanel — Control del modo de operación de reservas
 * Permite cambiar entre OTA (emisión automática) y Manual (agencia)
 * y activar/desactivar métodos de pago
 */
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Props { role: AdminRole; }

type BookingMode = 'ota' | 'manual';

interface Settings {
  booking_mode: BookingMode;
  ota_enabled: boolean;
  ota_auto_issue: boolean;
  ota_price_tolerance: number;
  manual_booking_enabled: boolean;
  manual_booking_note: string;
  payment_stripe_enabled: boolean;
  payment_paypal_enabled: boolean;
  payment_transfer_enabled: boolean;
}

const DEFAULTS: Settings = {
  booking_mode: 'manual',
  ota_enabled: false,
  ota_auto_issue: true,
  ota_price_tolerance: 5,
  manual_booking_enabled: true,
  manual_booking_note: 'Tu reserva ha sido recibida. Nuestro equipo la procesará en las próximas 2 horas.',
  payment_stripe_enabled: true,
  payment_paypal_enabled: true,
  payment_transfer_enabled: true,
};

export default function OperationsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { isAdmin } = useAdminRole(role);

  const [settings, setSettings] = useState<Settings>({ ...DEFAULTS });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [saved, setSaved]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/cms/settings?category=sistema`);
      const d = await r.json();
      const map: Record<string, string> = {};
      (d.data || []).forEach((s: any) => { map[s.key] = s.value; });

      setSettings({
        booking_mode:            (map.booking_mode as BookingMode) || 'manual',
        ota_enabled:             map.ota_enabled === 'true',
        ota_auto_issue:          map.ota_auto_issue !== 'false',
        ota_price_tolerance:     parseFloat(map.ota_price_tolerance || '5'),
        manual_booking_enabled:  map.manual_booking_enabled !== 'false',
        manual_booking_note:     map.manual_booking_note || DEFAULTS.manual_booking_note,
        payment_stripe_enabled:  map.payment_stripe_enabled !== 'false',
        payment_paypal_enabled:  map.payment_paypal_enabled !== 'false',
        payment_transfer_enabled: map.payment_transfer_enabled !== 'false',
      });
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (key: string, value: string) => {
    setSaving(key);
    try {
      await adminFetch(`${API}/cms/settings/${key}`, {
        method: 'PUT', body: JSON.stringify({ value }),
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch { /* silencioso */ }
    finally { setSaving(null); }
  };

  const setMode = async (mode: BookingMode) => {
    setSettings(s => ({ ...s, booking_mode: mode, ota_enabled: mode === 'ota', manual_booking_enabled: mode === 'manual' }));
    await save('booking_mode', mode);
    await save('ota_enabled', mode === 'ota' ? 'true' : 'false');
    await save('manual_booking_enabled', mode === 'manual' ? 'true' : 'false');
  };

  const toggle = async (key: keyof Settings, val: boolean) => {
    setSettings(s => ({ ...s, [key]: val }));
    await save(key, val ? 'true' : 'false');
  };

  if (!isAdmin) return (
    <div className="adm-card">
      <div className="adm-empty"><i className="fa-solid fa-lock" /><p>Solo administradores pueden cambiar el modo de operación.</p></div>
    </div>
  );

  if (loading) return <div className="adm-loading"><div className="adm-spinner" /><span>Cargando configuración…</span></div>;

  const isOTA    = settings.booking_mode === 'ota';
  const isManual = settings.booking_mode === 'manual';

  return (
    <PermissionGuard allowed={isAdmin}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Selector de modo principal ── */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-toggle-on" />
              Modo de operación
            </span>
            <span className={`adm-badge ${isOTA ? 'success' : 'warning'}`} style={{ fontSize: 13, padding: '4px 12px' }}>
              {isOTA ? '✈️ OTA — Emisión automática' : '🏢 Manual — Agencia'}
            </span>
          </div>
          <div className="adm-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Modo Manual */}
              <div
                onClick={() => !isManual && setMode('manual')}
                style={{
                  border: `2px solid ${isManual ? '#d97706' : 'var(--adm-border)'}`,
                  borderRadius: 12, padding: 20, cursor: isManual ? 'default' : 'pointer',
                  background: isManual ? '#fffbeb' : '#fff',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {isManual && (
                  <span style={{ position: 'absolute', top: 10, right: 10, background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    ACTIVO
                  </span>
                )}
                <div style={{ fontSize: 32, marginBottom: 10 }}>🏢</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Modo Manual</div>
                <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', lineHeight: 1.6 }}>
                  El cliente paga → tú recibes la reserva en el panel → gestionas el billete manualmente con la aerolínea o GDS.
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: '#d97706', fontWeight: 600 }}>
                  <i className="fa-solid fa-circle-check" style={{ marginRight: 4 }} />
                  Recomendado mientras configuras las credenciales OTA
                </div>
              </div>

              {/* Modo OTA */}
              <div
                onClick={() => !isOTA && setMode('ota')}
                style={{
                  border: `2px solid ${isOTA ? '#16a34a' : 'var(--adm-border)'}`,
                  borderRadius: 12, padding: 20, cursor: isOTA ? 'default' : 'pointer',
                  background: isOTA ? '#f0fdf4' : '#fff',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {isOTA && (
                  <span style={{ position: 'absolute', top: 10, right: 10, background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    ACTIVO
                  </span>
                )}
                <div style={{ fontSize: 32, marginBottom: 10 }}>✈️</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Modo OTA</div>
                <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', lineHeight: 1.6 }}>
                  El cliente paga → Amadeus emite el billete automáticamente → el PNR se guarda en el panel → se envía el itinerario al cliente.
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                  <i className="fa-solid fa-bolt" style={{ marginRight: 4 }} />
                  Requiere credenciales de producción de Amadeus
                </div>
              </div>
            </div>

            {/* Aviso de cambio */}
            <div style={{ marginTop: 16, background: '#f0f4ff', border: '1px solid #c7d7f9', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1e40af' }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
              El cambio de modo se aplica inmediatamente. Las reservas en curso no se ven afectadas.
              {isOTA && ' En modo OTA, asegúrate de que las credenciales de producción de Amadeus están configuradas en el servidor.'}
            </div>
          </div>
        </div>

        {/* ── Configuración OTA ── */}
        {isOTA && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title"><i className="fa-solid fa-plane-departure" />Configuración OTA</span>
            </div>
            <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Emisión automática tras el pago</div>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>
                    Si se desactiva, el billete queda pendiente y debes emitirlo manualmente desde el panel
                  </div>
                </div>
                <label className="adm-toggle">
                  <input type="checkbox" checked={settings.ota_auto_issue}
                    onChange={e => toggle('ota_auto_issue', e.target.checked)} />
                  <span className="adm-toggle-track" />
                </label>
              </div>

              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  Tolerancia de cambio de precio: <span style={{ color: 'var(--adm-primary)' }}>{settings.ota_price_tolerance}%</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 10 }}>
                  Si Amadeus cambia el precio más de este % al confirmar, se aborta la emisión automática y queda pendiente para revisión manual
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="range" min="1" max="20" step="1"
                    value={settings.ota_price_tolerance}
                    onChange={e => setSettings(s => ({ ...s, ota_price_tolerance: Number(e.target.value) }))}
                    style={{ flex: 1, accentColor: 'var(--adm-primary)' }}
                  />
                  <input
                    type="number" min="1" max="20"
                    value={settings.ota_price_tolerance}
                    onChange={e => setSettings(s => ({ ...s, ota_price_tolerance: Number(e.target.value) }))}
                    style={{ width: 60, padding: '4px 8px', border: '1px solid var(--adm-border)', borderRadius: 6, textAlign: 'center' }}
                  />
                  <span style={{ fontWeight: 700 }}>%</span>
                  <button
                    className={`adm-btn sm ${saved === 'ota_price_tolerance' ? 'success' : 'primary'}`}
                    disabled={saving === 'ota_price_tolerance'}
                    onClick={() => save('ota_price_tolerance', String(settings.ota_price_tolerance))}
                  >
                    {saved === 'ota_price_tolerance' ? <><i className="fa-solid fa-check" /> Guardado</> : 'Guardar'}
                  </button>
                </div>
              </div>

              <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#92400e' }}>
                <strong>⚠️ Importante:</strong> En modo OTA, cada emisión de billete tiene un coste real en tu cuenta IATA de Amadeus.
                Asegúrate de que <code>AMADEUS_ENVIRONMENT=production</code> está configurado en el servidor antes de activar este modo.
              </div>
            </div>
          </div>
        )}

        {/* ── Configuración Manual ── */}
        {isManual && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title"><i className="fa-solid fa-user-tie" />Configuración modo manual</span>
            </div>
            <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>
                Mensaje que recibe el cliente cuando su reserva queda pendiente de gestión manual:
              </div>
              <textarea
                className="adm-textarea"
                rows={3}
                value={settings.manual_booking_note}
                onChange={e => setSettings(s => ({ ...s, manual_booking_note: e.target.value }))}
              />
              <button
                className={`adm-btn sm ${saved === 'manual_booking_note' ? 'success' : 'primary'}`}
                style={{ alignSelf: 'flex-end' }}
                disabled={saving === 'manual_booking_note'}
                onClick={() => save('manual_booking_note', settings.manual_booking_note)}
              >
                {saved === 'manual_booking_note' ? <><i className="fa-solid fa-check" /> Guardado</> : <><i className="fa-solid fa-save" /> Guardar mensaje</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Métodos de pago ── */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-credit-card" />Métodos de pago</span>
          </div>
          <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'payment_stripe_enabled' as keyof Settings,   icon: 'fa-credit-card',  label: 'Tarjeta (Stripe)',       desc: 'Visa, Mastercard, AMEX via Stripe' },
              { key: 'payment_paypal_enabled' as keyof Settings,   icon: 'fa-paypal',       label: 'PayPal',                 desc: 'Pago con cuenta PayPal' },
              { key: 'payment_transfer_enabled' as keyof Settings, icon: 'fa-building-columns', label: 'Transferencia bancaria', desc: 'El cliente transfiere manualmente' },
            ].map(({ key, icon, label, desc }) => {
              const isActive = settings[key] as boolean;
              return (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: isActive ? '#f0fdf4' : '#f8fafc',
                  borderRadius: 8, border: `1px solid ${isActive ? '#bbf7d0' : 'var(--adm-border)'}`,
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: isActive ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fa-brands ${icon}`} style={{ color: isActive ? '#16a34a' : '#94a3b8', fontSize: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{desc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#16a34a' : '#94a3b8' }}>
                      {isActive ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    <label className="adm-toggle">
                      <input type="checkbox" checked={isActive}
                        onChange={e => toggle(key, e.target.checked)} />
                      <span className="adm-toggle-track" />
                    </label>
                  </div>
                </div>
              );
            })}

            <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 4 }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: 4 }} />
              Si desactivas todos los métodos de pago, los clientes no podrán completar reservas.
              Mantén al menos uno activo.
            </div>
          </div>
        </div>

        {/* ── Estado actual del sistema ── */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-circle-info" />Estado actual del sistema</span>
          </div>
          <div className="adm-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {[
                { label: 'Modo de reservas', value: isOTA ? '✈️ OTA Automático' : '🏢 Manual', ok: true },
                { label: 'Emisión automática', value: settings.ota_auto_issue ? 'Activada' : 'Desactivada', ok: isOTA ? settings.ota_auto_issue : true },
                { label: 'Stripe', value: settings.payment_stripe_enabled ? 'Activo' : 'Inactivo', ok: settings.payment_stripe_enabled },
                { label: 'PayPal', value: settings.payment_paypal_enabled ? 'Activo' : 'Inactivo', ok: settings.payment_paypal_enabled },
                { label: 'Transferencia', value: settings.payment_transfer_enabled ? 'Activa' : 'Inactiva', ok: settings.payment_transfer_enabled },
              ].map(({ label, value, ok }) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--adm-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ok ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className={`fa-solid ${ok ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </PermissionGuard>
  );
}
