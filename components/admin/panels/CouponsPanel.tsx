'use client';

/**
 * CouponsPanel — Gestión de cupones y descuentos
 */
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'percent' | 'fixed';
  value: number;
  min_amount: number;
  max_uses?: number;
  uses_count: number;
  valid_from?: string;
  valid_until?: string;
  applies_to: string;
  is_active: boolean;
  created_at: string;
}

const EMPTY = {
  code: '', description: '', type: 'percent' as const, value: 10,
  min_amount: 0, max_uses: '', valid_from: '', valid_until: '',
  applies_to: 'all', is_active: true,
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface Props { role: AdminRole; }

export default function CouponsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { isAdmin, isManager } = useAdminRole(role);

  const [coupons, setCoupons]   = useState<Coupon[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Coupon | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const canEdit = isAdmin || isManager;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/coupons`);
      const d = await r.json();
      setCoupons(d.data || []);
    } catch { setCoupons([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setError('');
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, description: c.description || '', type: c.type,
      value: c.value, min_amount: c.min_amount, max_uses: c.max_uses ? String(c.max_uses) : '',
      valid_from: c.valid_from ? c.valid_from.split('T')[0] : '',
      valid_until: c.valid_until ? c.valid_until.split('T')[0] : '',
      applies_to: c.applies_to, is_active: c.is_active,
    });
    setError('');
    setShowForm(true);
  };

  const save = async () => {
    if (!form.code.trim()) { setError('El código es obligatorio'); return; }
    if (!form.value || form.value <= 0) { setError('El valor debe ser mayor a 0'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
      };
      const url = editing ? `${API}/coupons/${editing.id}` : `${API}/coupons`;
      const r = await adminFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Error al guardar');
      setShowForm(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const toggle = async (c: Coupon) => {
    await adminFetch(`${API}/coupons/${c.id}`, {
      method: 'PUT', body: JSON.stringify({ is_active: !c.is_active }),
    });
    setCoupons(cs => cs.map(x => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    await adminFetch(`${API}/coupons/${id}`, { method: 'DELETE' });
    setCoupons(cs => cs.filter(c => c.id !== id));
  };

  const isExpired = (c: Coupon) => c.valid_until && new Date(c.valid_until) < new Date();
  const isExhausted = (c: Coupon) => c.max_uses && c.uses_count >= c.max_uses;

  return (
    <PermissionGuard allowed={true}>
      <div>
        <div className="adm-filters">
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
          {canEdit && (
            <button className="adm-btn primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
              <i className="fa-solid fa-plus" /> Nuevo cupón
            </button>
          )}
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando cupones…</span></div>
        ) : coupons.length === 0 ? (
          <div className="adm-card">
            <div className="adm-empty" style={{ padding: 60 }}>
              <i className="fa-solid fa-ticket" style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }} />
              <p>Sin cupones. Crea el primero.</p>
              {canEdit && <button className="adm-btn primary" style={{ marginTop: 12 }} onClick={openNew}><i className="fa-solid fa-plus" /> Crear cupón</button>}
            </div>
          </div>
        ) : (
          <div className="adm-card">
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Código</th><th>Descuento</th><th>Aplica a</th><th>Usos</th><th>Validez</th><th>Estado</th>{canEdit && <th>Acciones</th>}</tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.id} style={{ opacity: !c.is_active || isExpired(c) || isExhausted(c) ? 0.6 : 1 }}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 15, color: 'var(--adm-primary)', letterSpacing: 1 }}>{c.code}</div>
                        {c.description && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{c.description}</div>}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#16a34a' }}>
                          {c.type === 'percent' ? `${c.value}%` : `${c.value}€`}
                        </span>
                        {c.min_amount > 0 && <div style={{ fontSize: 10, color: 'var(--adm-text-muted)' }}>Mín. {c.min_amount}€</div>}
                      </td>
                      <td><span className="adm-badge default">{c.applies_to === 'all' ? 'Todo' : c.applies_to}</span></td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{c.uses_count}</span>
                        {c.max_uses && <span style={{ color: 'var(--adm-text-muted)', fontSize: 11 }}> / {c.max_uses}</span>}
                        {isExhausted(c) && <div style={{ fontSize: 10, color: '#dc2626' }}>Agotado</div>}
                      </td>
                      <td className="muted">
                        {c.valid_until ? (
                          <>
                            <div>{fmtDate(c.valid_from)} →</div>
                            <div style={{ color: isExpired(c) ? '#dc2626' : undefined }}>{fmtDate(c.valid_until)}</div>
                          </>
                        ) : 'Sin límite'}
                      </td>
                      <td>
                        <span className={`adm-badge ${c.is_active && !isExpired(c) && !isExhausted(c) ? 'success' : 'default'}`}>
                          {!c.is_active ? 'Inactivo' : isExpired(c) ? 'Expirado' : isExhausted(c) ? 'Agotado' : 'Activo'}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="adm-btn outline icon-only sm" onClick={() => openEdit(c)} title="Editar"><i className="fa-solid fa-pen" /></button>
                            <button className={`adm-btn icon-only sm ${c.is_active ? 'warning' : 'success'}`} onClick={() => toggle(c)} title={c.is_active ? 'Desactivar' : 'Activar'}>
                              <i className={`fa-solid ${c.is_active ? 'fa-pause' : 'fa-play'}`} />
                            </button>
                            <button className="adm-btn danger icon-only sm" onClick={() => remove(c.id)} title="Eliminar"><i className="fa-solid fa-trash" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="adm-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="adm-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title"><i className="fa-solid fa-ticket" style={{ marginRight: 8 }} />{editing ? 'Editar cupón' : 'Nuevo cupón'}</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowForm(false)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-modal-body">
                {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{error}</div>}

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Código *</label>
                    <input className="adm-input" style={{ fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase' }}
                      value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="VERANO20" />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Aplica a</label>
                    <select className="adm-select" value={form.applies_to} onChange={e => setForm(f => ({ ...f, applies_to: e.target.value }))}>
                      <option value="all">Todo</option>
                      <option value="flights">Vuelos</option>
                      <option value="hotels">Hoteles</option>
                      <option value="packages">Paquetes</option>
                      <option value="buses">Autobuses</option>
                      <option value="transfers">Traslados</option>
                    </select>
                  </div>
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Tipo de descuento</label>
                    <select className="adm-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                      <option value="percent">Porcentaje (%)</option>
                      <option value="fixed">Importe fijo (€)</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Valor *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input className="adm-input" type="number" min="0" step="0.5"
                        value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} />
                      <span style={{ fontWeight: 700 }}>{form.type === 'percent' ? '%' : '€'}</span>
                    </div>
                  </div>
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Importe mínimo (€)</label>
                    <input className="adm-input" type="number" min="0"
                      value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: Number(e.target.value) }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Usos máximos <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)' }}>(vacío = ilimitado)</span></label>
                    <input className="adm-input" type="number" min="1"
                      value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                      placeholder="Ilimitado" />
                  </div>
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Válido desde</label>
                    <input className="adm-input" type="date" value={form.valid_from}
                      onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Válido hasta <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)' }}>(vacío = sin límite)</span></label>
                    <input className="adm-input" type="date" value={form.valid_until}
                      onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-label">Descripción interna</label>
                  <input className="adm-input" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Ej: Campaña verano 2026" />
                </div>

                <label className="adm-toggle">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                  <span className="adm-toggle-track" />
                  <span className="adm-toggle-label">Cupón activo</span>
                </label>

                {/* Preview */}
                {form.value > 0 && (
                  <div style={{ marginTop: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                    <i className="fa-solid fa-tag" style={{ marginRight: 6, color: '#16a34a' }} />
                    Código <strong>{form.code || 'CODIGO'}</strong>: descuento de{' '}
                    <strong style={{ color: '#16a34a' }}>{form.type === 'percent' ? `${form.value}%` : `${form.value}€`}</strong>
                    {form.min_amount > 0 && ` en compras desde ${form.min_amount}€`}
                    {form.applies_to !== 'all' && ` en ${form.applies_to}`}
                  </div>
                )}
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="adm-btn primary" onClick={save} disabled={saving}>
                  {saving ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</> : <><i className="fa-solid fa-save" /> {editing ? 'Guardar cambios' : 'Crear cupón'}</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
