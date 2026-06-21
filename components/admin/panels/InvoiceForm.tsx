'use client';

import { useState } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import AdminDatePicker from '../ui/AdminDatePicker';

interface Item { description: string; quantity: number; unit_price: number; }

interface Props {
  initial: any;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_ITEM: Item = { description: '', quantity: 1, unit_price: 0 };

// Helpers fecha ↔ string ISO
const toDate = (s: string) => s ? new Date(s + 'T12:00:00') : null;
const toISO  = (d: Date | null) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';

export default function InvoiceForm({ initial, onClose, onSaved }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const isNew = !initial.id;

  const [form, setForm] = useState({
    type:             initial.type || 'invoice',
    customer_name:    initial.customer_name || '',
    customer_email:   initial.customer_email || '',
    customer_phone:   initial.customer_phone || '',
    customer_address: initial.customer_address || '',
    customer_nif:     initial.customer_nif || '',
    company_name:     initial.company_name || '',
    company_nif:      initial.company_nif || '',
    company_address:  initial.company_address || '',
    booking_ref:      initial.booking_ref || '',
    issue_date:       initial.issue_date || new Date().toISOString().split('T')[0],
    due_date:         initial.due_date || '',
    tax_rate:         initial.tax_rate ?? 21,
    discount_pct:     initial.discount_pct ?? 0,
    currency:         initial.currency || 'EUR',
    notes:            initial.notes || '',
  });

  const [items, setItems] = useState<Item[]>(
    initial.invoice_items?.length
      ? initial.invoice_items.map((i: any) => ({ description: i.description, quantity: Number(i.quantity), unit_price: Number(i.unit_price) }))
      : [{ ...EMPTY_ITEM }]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Cálculos en tiempo real
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discountAmt = subtotal * (form.discount_pct / 100);
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * (form.tax_rate / 100);
  const total = taxable + taxAmt;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const setItem = (idx: number, field: keyof Item, val: string | number) => {
    setItems(its => its.map((it, i) => i === idx ? { ...it, [field]: field === 'description' ? val : Number(val) } : it));
  };
  const addItem    = () => setItems(its => [...its, { ...EMPTY_ITEM }]);
  const removeItem = (idx: number) => setItems(its => its.filter((_, i) => i !== idx));

  const save = async () => {
    if (!form.customer_name.trim()) { setError('El nombre del cliente es obligatorio'); return; }
    if (!items.some(i => i.description.trim())) { setError('Añade al menos una línea con descripción'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, items };
      const url = isNew ? `${API}/invoices` : `${API}/invoices/${initial.id}`;
      const r = await adminFetch(url, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error?.message || 'Error al guardar');
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const typeLabel = form.type === 'invoice' ? 'Factura' : 'Presupuesto';

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal lg" style={{ maxWidth: 820 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">
            <i className={`fa-solid ${form.type === 'invoice' ? 'fa-file-invoice' : 'fa-file-lines'}`} style={{ marginRight: 8 }} />
            {isNew ? `Nueva ${typeLabel}` : `Editar ${typeLabel} ${initial.invoice_number || ''}`}
          </span>
          <button className="adm-btn ghost icon-only sm" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>

        <div className="adm-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 6 }} />{error}
            </div>
          )}

          {/* Tipo + moneda */}
          <div className="adm-form-row" style={{ marginBottom: 16 }}>
            <div className="adm-form-group">
              <label className="adm-label">Tipo de documento</label>
              <select className="adm-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="invoice">Factura</option>
                <option value="quote">Presupuesto</option>
              </select>
            </div>
            <div className="adm-form-group">
              <label className="adm-label">Moneda</label>
              <select className="adm-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {['EUR', 'USD', 'GBP', 'PEN', 'MXN', 'COP', 'ARS'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Empresa emisora */}
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, marginBottom: 16, border: '1px solid var(--adm-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--adm-text-muted)', marginBottom: 10 }}>
              <i className="fa-solid fa-building" style={{ marginRight: 6 }} />Empresa emisora
            </div>
            <div className="adm-form-row">
              <div className="adm-form-group" style={{ marginBottom: 0 }}>
                <label className="adm-label">Nombre empresa</label>
                <input className="adm-input" placeholder="Viajes y Experiencias S.L." value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div className="adm-form-group" style={{ marginBottom: 0 }}>
                <label className="adm-label">NIF/CIF</label>
                <input className="adm-input" placeholder="B12345678" value={form.company_nif} onChange={e => setForm(f => ({ ...f, company_nif: e.target.value }))} />
              </div>
            </div>
            <div className="adm-form-group" style={{ marginBottom: 0, marginTop: 10 }}>
              <label className="adm-label">Dirección</label>
              <input className="adm-input" value={form.company_address} onChange={e => setForm(f => ({ ...f, company_address: e.target.value }))} />
            </div>
          </div>

          {/* Cliente */}
          <div style={{ background: '#f0f4ff', borderRadius: 8, padding: 14, marginBottom: 16, border: '1px solid #c7d7f9' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 10 }}>
              <i className="fa-solid fa-user" style={{ marginRight: 6 }} />Cliente
            </div>
            <div className="adm-form-row">
              <div className="adm-form-group" style={{ marginBottom: 0 }}>
                <label className="adm-label">Nombre *</label>
                <input className="adm-input" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
              </div>
              <div className="adm-form-group" style={{ marginBottom: 0 }}>
                <label className="adm-label">NIF/CIF</label>
                <input className="adm-input" placeholder="12345678A" value={form.customer_nif} onChange={e => setForm(f => ({ ...f, customer_nif: e.target.value }))} />
              </div>
            </div>
            <div className="adm-form-row" style={{ marginTop: 10 }}>
              <div className="adm-form-group" style={{ marginBottom: 0 }}>
                <label className="adm-label">Email</label>
                <input className="adm-input" type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} />
              </div>
              <div className="adm-form-group" style={{ marginBottom: 0 }}>
                <label className="adm-label">Teléfono</label>
                <input className="adm-input" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
              </div>
            </div>
            <div className="adm-form-group" style={{ marginBottom: 0, marginTop: 10 }}>
              <label className="adm-label">Dirección</label>
              <input className="adm-input" value={form.customer_address} onChange={e => setForm(f => ({ ...f, customer_address: e.target.value }))} />
            </div>
          </div>

          {/* Fechas + ref */}
          <div className="adm-form-row cols-3" style={{ marginBottom: 16 }}>
            <div className="adm-form-group" style={{ marginBottom: 0 }}>
              <label className="adm-label">Fecha emisión</label>
              <AdminDatePicker
                value={toDate(form.issue_date)}
                onChange={d => setForm(f => ({ ...f, issue_date: toISO(d) }))}
                allowPast={true}
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div className="adm-form-group" style={{ marginBottom: 0 }}>
              <label className="adm-label">{form.type === 'invoice' ? 'Vencimiento' : 'Válido hasta'}</label>
              <AdminDatePicker
                value={toDate(form.due_date)}
                onChange={d => setForm(f => ({ ...f, due_date: toISO(d) }))}
                allowPast={true}
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div className="adm-form-group" style={{ marginBottom: 0 }}>
              <label className="adm-label">Ref. reserva</label>
              <input className="adm-input" placeholder="FLI-XXXX" value={form.booking_ref} onChange={e => setForm(f => ({ ...f, booking_ref: e.target.value }))} />
            </div>
          </div>

          {/* Líneas */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--adm-text-muted)' }}>
                <i className="fa-solid fa-list" style={{ marginRight: 6 }} />Líneas
              </span>
              <button className="adm-btn outline sm" onClick={addItem}><i className="fa-solid fa-plus" /> Añadir línea</button>
            </div>
            <div style={{ border: '1px solid var(--adm-border)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Descripción</th>
                    <th style={{ padding: '8px 12px', width: 80, textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Cant.</th>
                    <th style={{ padding: '8px 12px', width: 120, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Precio unit.</th>
                    <th style={{ padding: '8px 12px', width: 110, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--adm-text-muted)', textTransform: 'uppercase' }}>Total</th>
                    <th style={{ width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="adm-input" style={{ margin: 0 }} placeholder="Descripción del servicio…" value={item.description} onChange={e => setItem(idx, 'description', e.target.value)} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="adm-input" style={{ margin: 0, textAlign: 'center' }} type="number" min="0.001" step="0.001" value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input className="adm-input" style={{ margin: 0, textAlign: 'right' }} type="number" min="0" step="0.01" value={item.unit_price} onChange={e => setItem(idx, 'unit_price', e.target.value)} />
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600 }}>
                        {r2(item.quantity * item.unit_price).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '6px 4px' }}>
                        {items.length > 1 && (
                          <button className="adm-btn danger icon-only sm" onClick={() => removeItem(idx)}><i className="fa-solid fa-xmark" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* IVA + descuento + totales */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="adm-form-group" style={{ marginBottom: 0, width: 120 }}>
                <label className="adm-label">IVA (%)</label>
                <input className="adm-input" type="number" min="0" max="100" step="0.5" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: Number(e.target.value) }))} />
              </div>
              <div className="adm-form-group" style={{ marginBottom: 0, width: 140 }}>
                <label className="adm-label">Descuento (%)</label>
                <input className="adm-input" type="number" min="0" max="100" step="0.5" value={form.discount_pct} onChange={e => setForm(f => ({ ...f, discount_pct: Number(e.target.value) }))} />
              </div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '12px 16px', minWidth: 220 }}>
              {form.discount_pct > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--adm-text-muted)' }}>Descuento ({form.discount_pct}%)</span>
                  <span style={{ color: 'var(--adm-danger)' }}>-{r2(discountAmt).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {form.currency}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--adm-text-muted)' }}>Subtotal</span>
                <span>{r2(subtotal).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {form.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: 'var(--adm-text-muted)' }}>IVA ({form.tax_rate}%)</span>
                <span>{r2(taxAmt).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {form.currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: 'var(--adm-primary)', borderTop: '2px solid var(--adm-primary)', paddingTop: 8 }}>
                <span>TOTAL</span>
                <span>{r2(total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} {form.currency}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="adm-form-group" style={{ marginBottom: 0 }}>
            <label className="adm-label">Notas (visibles en el documento)</label>
            <textarea className="adm-textarea" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Condiciones de pago, información adicional…" />
          </div>
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="adm-btn primary" onClick={save} disabled={saving}>
            {saving
              ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</>
              : <><i className="fa-solid fa-save" /> {isNew ? `Crear ${typeLabel}` : 'Guardar cambios'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
