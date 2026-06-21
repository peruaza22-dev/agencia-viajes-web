'use client';

/**
 * BookingModePanel — Control del modo de operación de reservas
 *
 * Modos:
 * - OTA (automático): Amadeus emite el billete justo después del pago
 * - Manual (agencia): El admin gestiona la reserva manualmente
 *
 * También controla qué métodos de pago están activos.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Props { role: AdminRole; }

interface ModeSettings {
  booking_mode: string;
  ota_enabled: boolean;
  ota_auto_issue: boolean;
  ota_price_tolerance: number;
  manual_booking_enabled: boolean;
  manual_booking_note: string;
  payment_stripe_enabled: boolean;
  payment_paypal_enabled: boolean;
  payment_transfer_enabled: boolean;
  // Pagos en cuotas
  payment_installments_enabled: boolean;
  payment_installments_fee: number;
  payment_installments_type: string;
  payment_deposit_enabled: boolean;
  payment_deposit_pct: number;
  payment_installments_count: number;
}

const DEFAULTS: ModeSettings = {
  booking_mode: 'manual',
  ota_enabled: false,
  ota_auto_issue: true,
  ota_price_tolerance: 5,
  manual_booking_enabled: true,
  manual_booking_note: 'Tu reserva ha sido recibida. Nuestro equipo la procesará en las próximas 2 horas.',
  payment_stripe_enabled: true,
  payment_paypal_enabled: true,
  payment_transfer_enabled: true,
  // Pagos en cuotas
  payment_installments_enabled: false,
  payment_installments_fee: 4,
  payment_installments_type: 'klarna',
  payment_deposit_enabled: false,
  payment_deposit_pct: 50,
  payment_installments_count: 3,
};

export default function BookingModePanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { isAdmin } = useAdminRole(role);

  const [settings, setSettings] = useState<ModeSettings>({ ...DEFAULTS });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [changed, setChanged]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/cms/settings?category=sistema`);
      const d = await r.json();
      const list: any[] = d.data || [];
      const map: Record<string, string> = {};
      list.forEach(s => { map[s.key] = s.value || ''; });

      setSettings({
        booking_mode:             map.booking_mode             || 'manual',
        ota_enabled:              map.ota_enabled              === 'true',
        ota_auto_issue:           map.ota_auto_issue           !== 'false',
        ota_price_tolerance:      parseFloat(map.ota_price_tolerance || '5'),
        manual_booking_enabled:   map.manual_booking_enabled   !== 'false',
        manual_booking_note:      map.manual_booking_note      || DEFAULTS.manual_booking_note,
        payment_stripe_enabled:   map.payment_stripe_enabled   !== 'false',
        payment_paypal_enabled:   map.payment_paypal_enabled   !== 'false',
        payment_transfer_enabled: map.payment_transfer_enabled !== 'false',
        // Pagos en cuotas
        payment_installments_enabled: map.payment_installments_enabled === 'true',
        payment_installments_fee: parseFloat(map.payment_installments_fee || '4'),
        payment_installments_type: map.payment_installments_type || 'klarna',
        payment_deposit_enabled: map.payment_deposit_enabled === 'true',
        payment_deposit_pct: parseFloat(map.payment_deposit_pct || '50'),
        payment_installments_count: parseInt(map.payment_installments_count || '3', 10),
      });
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof ModeSettings>(key: K, val: ModeSettings[K]) => {
    setSettings(s => ({ ...s, [key]: val }));
    setChanged(true);
  };

  // Cambiar modo principal — sincroniza ota_enabled y manual_booking_enabled
  const setMode = (mode: 'ota' | 'manual' | 'both') => {
    setSettings(s => ({
      ...s,
      booking_mode: mode,
      ota_enabled: mode === 'ota' || mode === 'both',
      manual_booking_enabled: mode === 'manual' || mode === 'both',
    }));
    setChanged(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const toSave = [
        { key: 'booking_mode',             value: settings.booking_mode },
        { key: 'ota_enabled',              value: String(settings.ota_enabled) },
        { key: 'ota_auto_issue',           value: String(settings.ota_auto_issue) },
        { key: 'ota_price_tolerance',      value: String(settings.ota_price_tolerance) },
        { key: 'manual_booking_enabled',   value: String(settings.manual_booking_enabled) },
        { key: 'manual_booking_note',      value: settings.manual_booking_note },
        { key: 'payment_stripe_enabled',   value: String(settings.payment_stripe_enabled) },
        { key: 'payment_paypal_enabled',   value: String(settings.payment_paypal_enabled) },
        { key: 'payment_transfer_enabled', value: String(settings.payment_transfer_enabled) },
        // Pagos en cuotas
        { key: 'payment_installments_enabled', value: String(settings.payment_installments_enabled) },
        { key: 'payment_installments_fee', value: String(settings.payment_installments_fee) },
        { key: 'payment_installments_type', value: settings.payment_installments_type },
        { key: 'payment_deposit_enabled', value: String(settings.payment_deposit_enabled) },
        { key: 'payment_deposit_pct', value: String(settings.payment_deposit_pct) },
        { key: 'payment_installments_count', value: String(settings.payment_installments_count) },
      ];
      await adminFetch(`${API}/cms/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings: toSave }),
      });
      setSaved(true);
      setChanged(false);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silencioso */ }
    finally { setSaving(false); }
  };

  const mode = settings.booking_mode;

  return (
    <PermissionGuard allowed={isAdmin}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Selector de modo principal ── */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-toggle-on" />
              Modo de operación de reservas
            </span>
            <button
              className={`adm-btn ${saved ? 'success' : 'primary'}`}
              onClick={save}
              disabled={saving || !changed}
            >
              {saving ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</>
               : saved ? <><i className="fa-solid fa-check" /> Guardado</>
               : <><i className="fa-solid fa-save" /> Guardar cambios</>}
            </button>
          </div>

          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
          ) : (
            <div className="adm-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>

                {/* Modo Manual */}
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  style={{
                    border: `2px solid ${mode === 'manual' ? '#0284c7' : 'var(--adm-border)'}`,
                    borderRadius: 12, padding: 20, background: mode === 'manual' ? '#f0f9ff' : '#fff',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: mode === 'manual' ? '#0284c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-user-tie" style={{ color: mode === 'manual' ? '#fff' : '#94a3b8', fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: mode === 'manual' ? '#0284c7' : 'var(--adm-text)' }}>Agencia Manual</div>
                      {mode === 'manual' && <span style={{ fontSize: 10, background: '#0284c7', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>ACTIVO</span>}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', margin: 0, lineHeight: 1.5 }}>
                    El cliente paga → tú recibes la reserva → gestionas el billete manualmente con la aerolínea.
                  </p>
                </button>

                {/* Modo OTA */}
                <button
                  type="button"
                  onClick={() => setMode('ota')}
                  style={{
                    border: `2px solid ${mode === 'ota' ? '#16a34a' : 'var(--adm-border)'}`,
                    borderRadius: 12, padding: 20, background: mode === 'ota' ? '#f0fdf4' : '#fff',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: mode === 'ota' ? '#16a34a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-bolt" style={{ color: mode === 'ota' ? '#fff' : '#94a3b8', fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: mode === 'ota' ? '#16a34a' : 'var(--adm-text)' }}>OTA Automático</div>
                      {mode === 'ota' && <span style={{ fontSize: 10, background: '#16a34a', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>ACTIVO</span>}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', margin: 0, lineHeight: 1.5 }}>
                    El cliente paga → Amadeus emite el billete automáticamente → PNR al instante. Requiere credenciales de producción.
                  </p>
                </button>

                {/* Modo Híbrido */}
                <button
                  type="button"
                  onClick={() => setMode('both')}
                  style={{
                    border: `2px solid ${mode === 'both' ? '#7c3aed' : 'var(--adm-border)'}`,
                    borderRadius: 12, padding: 20, background: mode === 'both' ? '#faf5ff' : '#fff',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: mode === 'both' ? '#7c3aed' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-shuffle" style={{ color: mode === 'both' ? '#fff' : '#94a3b8', fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: mode === 'both' ? '#7c3aed' : 'var(--adm-text)' }}>Híbrido</div>
                      {mode === 'both' && <span style={{ fontSize: 10, background: '#7c3aed', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>ACTIVO</span>}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', margin: 0, lineHeight: 1.5 }}>
                    OTA intenta emitir automáticamente. Si falla, la reserva queda pendiente para gestión manual.
                  </p>
                </button>
              </div>

              {/* Aviso según modo */}
              {mode === 'ota' && (
                <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
                  <strong>Modo OTA activo:</strong> Cada reserva confirmada generará un cargo real en tu cuenta IATA de Amadeus. Asegúrate de tener credenciales de producción configuradas.
                </div>
              )}
              {mode === 'manual' && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#0369a1', marginBottom: 16 }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
                  <strong>Modo manual activo:</strong> Las reservas quedarán en estado "pendiente" hasta que tú las gestiones manualmente con la aerolínea.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Configuración OTA ── */}
        {(mode === 'ota' || mode === 'both') && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">
                <i className="fa-solid fa-bolt" style={{ color: '#16a34a' }} />
                Configuración OTA
              </span>
            </div>
            <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="adm-toggle">
                <input type="checkbox" checked={settings.ota_auto_issue}
                  onChange={e => set('ota_auto_issue', e.target.checked)} />
                <span className="adm-toggle-track" />
                <span className="adm-toggle-label">
                  Emitir billete automáticamente tras el pago
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--adm-text-muted)', fontWeight: 400 }}>
                    Si se desactiva, el pago se confirma pero la emisión queda pendiente de aprobación manual
                  </span>
                </span>
              </label>

              <div className="adm-form-group" style={{ maxWidth: 300 }}>
                <label className="adm-label">
                  Tolerancia de cambio de precio (%)
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--adm-text-muted)', fontWeight: 400 }}>
                    Si Amadeus cambia el precio más de este % al confirmar, se aborta la emisión automática
                  </span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number" min="0" max="20" step="0.5"
                    className="adm-input"
                    style={{ width: 80 }}
                    value={settings.ota_price_tolerance}
                    onChange={e => set('ota_price_tolerance', parseFloat(e.target.value) || 5)}
                  />
                  <span style={{ fontWeight: 700 }}>%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Configuración modo manual ── */}
        {(mode === 'manual' || mode === 'both') && (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">
                <i className="fa-solid fa-user-tie" style={{ color: '#0284c7' }} />
                Configuración modo manual
              </span>
            </div>
            <div className="adm-card-body">
              <div className="adm-form-group">
                <label className="adm-label">
                  Mensaje al cliente cuando la reserva queda pendiente
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--adm-text-muted)', fontWeight: 400 }}>
                    Se incluye en el email de confirmación
                  </span>
                </label>
                <textarea
                  className="adm-textarea"
                  rows={3}
                  value={settings.manual_booking_note}
                  onChange={e => set('manual_booking_note', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Métodos de pago ── */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-credit-card" />
              Métodos de pago activos
            </span>
          </div>
          <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Stripe */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid var(--adm-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#635bff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-brands fa-stripe-s" style={{ color: '#fff', fontSize: 18 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Stripe — Tarjeta</div>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>Visa, Mastercard, Amex</div>
                </div>
              </div>
              <label className="adm-toggle">
                <input type="checkbox" checked={settings.payment_stripe_enabled}
                  onChange={e => set('payment_stripe_enabled', e.target.checked)} />
                <span className="adm-toggle-track" />
                <span className="adm-toggle-label" style={{ color: settings.payment_stripe_enabled ? 'var(--adm-success)' : 'var(--adm-danger)', fontWeight: 700 }}>
                  {settings.payment_stripe_enabled ? 'Activo' : 'Inactivo'}
                </span>
              </label>
            </div>

            {/* PayPal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid var(--adm-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#003087', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-brands fa-paypal" style={{ color: '#fff', fontSize: 18 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>PayPal</div>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>Cuenta PayPal o tarjeta</div>
                </div>
              </div>
              <label className="adm-toggle">
                <input type="checkbox" checked={settings.payment_paypal_enabled}
                  onChange={e => set('payment_paypal_enabled', e.target.checked)} />
                <span className="adm-toggle-track" />
                <span className="adm-toggle-label" style={{ color: settings.payment_paypal_enabled ? 'var(--adm-success)' : 'var(--adm-danger)', fontWeight: 700 }}>
                  {settings.payment_paypal_enabled ? 'Activo' : 'Inactivo'}
                </span>
              </label>
            </div>

            {/* Transferencia */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid var(--adm-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-building-columns" style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Transferencia bancaria</div>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>IBAN / SEPA</div>
                </div>
              </div>
              <label className="adm-toggle">
                <input type="checkbox" checked={settings.payment_transfer_enabled}
                  onChange={e => set('payment_transfer_enabled', e.target.checked)} />
                <span className="adm-toggle-track" />
                <span className="adm-toggle-label" style={{ color: settings.payment_transfer_enabled ? 'var(--adm-success)' : 'var(--adm-danger)', fontWeight: 700 }}>
                  {settings.payment_transfer_enabled ? 'Activo' : 'Inactivo'}
                </span>
              </label>
            </div>

            {/* Aviso si todos desactivados */}
            {!settings.payment_stripe_enabled && !settings.payment_paypal_enabled && !settings.payment_transfer_enabled && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 6 }} />
                <strong>Atención:</strong> No hay ningún método de pago activo. Los clientes no podrán completar reservas.
              </div>
            )}
          </div>
        </div>

        {/* ── Pagos en cuotas (Klarna/SeQura) ── */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-credit-card" style={{ color: '#f59e0b' }} />
              Pagos en cuotas (Klarna / SeQura)
            </span>
          </div>
          <div className="adm-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Habilitar pagos en cuotas */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fcd34d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-clock" style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Pagos en cuotas</div>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>Permitir pago fraccionado (Klarna/SeQura)</div>
                </div>
              </div>
              <label className="adm-toggle">
                <input type="checkbox" checked={settings.payment_installments_enabled}
                  onChange={e => set('payment_installments_enabled', e.target.checked)} />
                <span className="adm-toggle-track" />
                <span className="adm-toggle-label" style={{ color: settings.payment_installments_enabled ? 'var(--adm-success)' : 'var(--adm-danger)', fontWeight: 700 }}>
                  {settings.payment_installments_enabled ? 'Activo' : 'Inactivo'}
                </span>
              </label>
            </div>

            {settings.payment_installments_enabled && (
              <>
                {/* Proveedor */}
                <div className="adm-form-group">
                  <label className="adm-label">Proveedor de cuotas</label>
                  <select className="adm-select" value={settings.payment_installments_type}
                    onChange={e => set('payment_installments_type', e.target.value)}>
                    <option value="klarna">Klarna</option>
                    <option value="sequra">SeQura</option>
                  </select>
                </div>

                {/* % cargo al cliente */}
                <div className="adm-form-group">
                  <label className="adm-label">
                    Cargo al cliente (%)
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--adm-text-muted)', fontWeight: 400 }}>
                      Porcentaje adicional que paga el cliente por usar cuotas. Ej: 4% → Cubres comisión de Klarna + ganancia extra.
                    </span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" className="adm-input" style={{ width: 80 }}
                      value={settings.payment_installments_fee}
                      onChange={e => set('payment_installments_fee', parseFloat(e.target.value) || 0)}
                      min={0} max={20} step={0.5} />
                    <span style={{ color: 'var(--adm-text-muted)', fontSize: 13 }}>%</span>
                    <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
                      (Comisión Klarna ~3%, tu ganancia: ~{settings.payment_installments_fee - 3}%)
                    </span>
                  </div>
                </div>

                {/* Depósito inicial */}
                <div className="adm-form-group">
                  <label className="adm-label">Pago inicial (%)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" className="adm-input" style={{ width: 80 }}
                      value={settings.payment_deposit_pct}
                      onChange={e => set('payment_deposit_pct', parseFloat(e.target.value) || 50)}
                      min={10} max={90} step={5} />
                    <span style={{ color: 'var(--adm-text-muted)', fontSize: 13 }}>%</span>
                  </div>
                </div>

                {/* Número de cuotas */}
                <div className="adm-form-group">
                  <label className="adm-label">Número de cuotas</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="number" className="adm-input" style={{ width: 80 }}
                      value={settings.payment_installments_count}
                      onChange={e => set('payment_installments_count', parseInt(e.target.value) || 3)}
                      min={2} max={12} />
                    <span style={{ color: 'var(--adm-text-muted)', fontSize: 13 }}>cuotas</span>
                  </div>
                </div>

                {/* Ejemplo */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: '#0284c7', marginBottom: 8 }}>
                    <i className="fa-solid fa-calculator" style={{ marginRight: 6 }} />
                    Ejemplo para reserva de €1000:
                  </div>
                  <div style={{ color: '#475569' }}>
                    <div>• Cliente paga: <strong>€{Math.round(1000 * (1 + settings.payment_installments_fee/100))}</strong> (incluye cargo {settings.payment_installments_fee}%)</div>
                    <div>• Pago inicial ({settings.payment_deposit_pct}%): <strong>€{Math.round(1000 * (1 + settings.payment_installments_fee/100) * settings.payment_deposit_pct/100)}</strong></div>
                    <div>• {settings.payment_installments_count} cuotas de: <strong>€{Math.round((1000 * (1 + settings.payment_installments_fee/100) * (100 - settings.payment_deposit_pct)/100) / settings.payment_installments_count)}</strong></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </PermissionGuard>
  );
}
