'use client';

/**
 * QuotesPanel — Panel de Cotizaciones
 * Crea presupuestos con múltiples vuelos/servicios, los envía por email
 * y genera un link de pago para que el cliente pague directamente.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import AdminDatePicker from '../ui/AdminDatePicker';

interface Props { role: AdminRole; }

const STATUS_BADGE: Record<string, string> = {
  draft: 'default', sent: 'info', accepted: 'success', rejected: 'danger', expired: 'warning',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviada', accepted: 'Aceptada', rejected: 'Rechazada', expired: 'Expirada',
};
const fmtMoney = (n: number, cur = 'EUR') => `${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${cur}`;
const fmtDate  = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const EMPTY_ITEM = { type: 'flight', description: '', origin: '', destination: '', departure: null as Date | null, return_date: null as Date | null, passengers: 1, unit_price: 0, quantity: 1 };

export default function QuotesPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { isAdmin, isManager } = useAdminRole(role);

  const [quotes,    setQuotes]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<any>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [sending,   setSending]   = useState(false);
  const [msg,       setMsg]       = useState('');

  // Formulario
  const [custName,  setCustName]  = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [notes,     setNotes]     = useState('');
  const [validUntil,setValidUntil]= useState<Date | null>(new Date(Date.now() + 7 * 86400000));
  const [items,     setItems]     = useState([{ ...EMPTY_ITEM }]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/quotes`);
      const d = await r.json();
      setQuotes(d.data || []);
    } catch { setQuotes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingId(null); setCustName(''); setCustEmail(''); setCustPhone(''); setNotes('');
    setValidUntil(new Date(Date.now() + 7 * 86400000));
    setItems([{ ...EMPTY_ITEM }]); setMsg(''); setShowForm(true);
  };

  const openEdit = (q: any) => {
    setEditingId(q.id); setCustName(q.customer_name); setCustEmail(q.customer_email);
    setCustPhone(q.customer_phone || ''); setNotes(q.notes || '');
    setValidUntil(q.valid_until ? new Date(q.valid_until) : null);
    setItems((q.quote_items || []).map((i: any) => ({
      type: i.type, description: i.description, origin: i.origin || '', destination: i.destination || '',
      departure: i.departure ? new Date(i.departure) : null,
      return_date: i.return_date ? new Date(i.return_date) : null,
      passengers: i.passengers || 1, unit_price: i.unit_price, quantity: i.quantity || 1,
    })));
    setMsg(''); setShowForm(true);
  };

  const addItem = () => setItems(it => [...it, { ...EMPTY_ITEM }]);
  const removeItem = (idx: number) => setItems(it => it.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, val: any) =>
    setItems(it => it.map((item, i) => i === idx ? { ...item, [field]: val } : item));

  const total = items.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity || 1), 0);

  const save = async () => {
    if (!custName || !custEmail) { setMsg('Nombre y email requeridos'); return; }
    setSaving(true); setMsg('');
    try {
      const payload = {
        customer_name: custName, customer_email: custEmail, customer_phone: custPhone,
        notes, valid_until: validUntil?.toISOString(),
        items: items.map(i => ({
          ...i,
          departure: i.departure?.toISOString().split('T')[0] || null,
          return_date: i.return_date?.toISOString().split('T')[0] || null,
        })),
      };
      const url = editingId ? `${API}/quotes/${editingId}` : `${API}/quotes`;
      const r = await adminFetch(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (!d.success) throw new Error(d.error?.message);
      setShowForm(false); load();
    } catch (e: any) { setMsg(e.message); }
    finally { setSaving(false); }
  };

  const sendQuote = async (id: string) => {
    setSending(true);
    try {
      const r = await adminFetch(`${API}/quotes/${id}/send`, { method: 'POST' });
      const d = await r.json();
      if (d.success) { load(); setSelected((s: any) => s?.id === id ? { ...s, status: 'sent' } : s); }
    } catch { /* silencioso */ }
    finally { setSending(false); }
  };

  const generatePayLink = async (q: any) => {
    try {
      const r = await adminFetch(`${API}/payment/create-link`, {
        method: 'POST',
        body: JSON.stringify({ amount: q.total_amount, currency: q.currency, bookingRef: q.quote_number, description: `Cotización ${q.quote_number}`, customerEmail: q.customer_email }),
      });
      const d = await r.json();
      if (d.success) {
        await adminFetch(`${API}/quotes/${q.id}`, { method: 'PUT', body: JSON.stringify({ payment_link: d.data.url }) });
        navigator.clipboard.writeText(d.data.url);
        alert(`Link copiado: ${d.data.url}`);
        load();
      }
    } catch { /* silencioso */ }
  };

  return (
    <PermissionGuard allowed={isAdmin || isManager}>
      <div>
        <div className="adm-filters">
          <span style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>{quotes.length} cotizaciones</span>
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
          <button className="adm-btn primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
            <i className="fa-solid fa-plus" /> Nueva cotización
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16 }}>
          {/* Tabla */}
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title"><i className="fa-solid fa-file-invoice" /> Cotizaciones</span>
            </div>
            {loading ? <div className="adm-loading"><div className="adm-spinner" /></div> : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Número</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Válida hasta</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {quotes.length === 0 ? (
                      <tr><td colSpan={6}><div className="adm-table-empty"><i className="fa-solid fa-file-invoice" />Sin cotizaciones</div></td></tr>
                    ) : quotes.map(q => (
                      <tr key={q.id} style={{ cursor: 'pointer', background: selected?.id === q.id ? '#f0f7ff' : undefined }} onClick={() => setSelected(s => s?.id === q.id ? null : q)}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{q.quote_number}</span></td>
                        <td><div style={{ fontWeight: 600 }}>{q.customer_name}</div><div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{q.customer_email}</div></td>
                        <td style={{ fontWeight: 700, color: 'var(--adm-primary)' }}>{fmtMoney(q.total_amount, q.currency)}</td>
                        <td><span className={`adm-badge ${STATUS_BADGE[q.status] || 'default'}`}>{STATUS_LABEL[q.status] || q.status}</span></td>
                        <td className="muted">{fmtDate(q.valid_until)}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="adm-btn outline icon-only sm" title="Editar" onClick={() => openEdit(q)}><i className="fa-solid fa-pen" /></button>
                            <button className="adm-btn primary icon-only sm" title="Enviar por email" disabled={sending} onClick={() => sendQuote(q.id)}><i className="fa-solid fa-paper-plane" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detalle */}
          {selected && (
            <div className="adm-card" style={{ alignSelf: 'start', position: 'sticky', top: 80 }}>
              <div className="adm-card-header">
                <span className="adm-card-title"><i className="fa-solid fa-file-lines" />{selected.quote_number}</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setSelected(null)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-card-body">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>{selected.customer_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>{selected.customer_email}</div>
                  {selected.customer_phone && <div style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>{selected.customer_phone}</div>}
                </div>
                {(selected.quote_items || []).map((item: any, i: number) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginBottom: 8, fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                    {item.origin && <div style={{ color: 'var(--adm-text-muted)' }}>{item.origin} → {item.destination}</div>}
                    {item.departure && <div style={{ color: 'var(--adm-text-muted)' }}>Salida: {fmtDate(item.departure)}</div>}
                    <div style={{ fontWeight: 700, color: 'var(--adm-primary)', marginTop: 4 }}>{fmtMoney(item.total, selected.currency)}</div>
                  </div>
                ))}
                <div style={{ borderTop: '2px solid var(--adm-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--adm-primary)' }}>{fmtMoney(selected.total_amount, selected.currency)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="adm-btn primary" disabled={sending} onClick={() => sendQuote(selected.id)}>
                    {sending ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Enviando…</> : <><i className="fa-solid fa-paper-plane" /> Enviar por email</>}
                  </button>
                  <button className="adm-btn outline" onClick={() => generatePayLink(selected)}>
                    <i className="fa-solid fa-link" /> Generar link de pago
                  </button>
                  {selected.payment_link && (
                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
                      <div style={{ fontWeight: 600, color: '#0284c7', marginBottom: 4 }}>Link de pago:</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input readOnly value={selected.payment_link} style={{ flex: 1, fontSize: 10, border: '1px solid #bae6fd', borderRadius: 4, padding: '4px 6px', background: '#fff' }} />
                        <button className="adm-btn primary sm" onClick={() => navigator.clipboard.writeText(selected.payment_link)}><i className="fa-solid fa-copy" /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal crear/editar */}
        {showForm && (
          <div className="adm-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="adm-modal lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
              <div className="adm-modal-header">
                <span className="adm-modal-title"><i className="fa-solid fa-file-invoice" style={{ marginRight: 8 }} />{editingId ? 'Editar cotización' : 'Nueva cotización'}</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowForm(false)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-modal-body">
                {msg && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{msg}</div>}
                <div className="adm-form-row">
                  <div className="adm-form-group"><label className="adm-label">Nombre *</label><input className="adm-input" value={custName} onChange={e => setCustName(e.target.value)} /></div>
                  <div className="adm-form-group"><label className="adm-label">Email *</label><input className="adm-input" type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} /></div>
                  <div className="adm-form-group"><label className="adm-label">Teléfono</label><input className="adm-input" value={custPhone} onChange={e => setCustPhone(e.target.value)} /></div>
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group"><label className="adm-label">Válida hasta</label><AdminDatePicker value={validUntil} onChange={setValidUntil} /></div>
                  <div className="adm-form-group"><label className="adm-label">Notas para el cliente</label><input className="adm-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Condiciones, observaciones…" /></div>
                </div>

                {/* Items */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><i className="fa-solid fa-list" style={{ marginRight: 6 }} />Servicios cotizados</span>
                    <button className="adm-btn outline sm" onClick={addItem}><i className="fa-solid fa-plus" /> Añadir</button>
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: '1px solid var(--adm-border)' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <select className="adm-select" style={{ width: 110 }} value={item.type} onChange={e => updateItem(idx, 'type', e.target.value)}>
                          <option value="flight">Vuelo</option>
                          <option value="hotel">Hotel</option>
                          <option value="transfer">Traslado</option>
                          <option value="other">Otro</option>
                        </select>
                        <input className="adm-input" style={{ flex: 1 }} placeholder="Descripción del servicio *" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                        {items.length > 1 && <button className="adm-btn danger icon-only sm" onClick={() => removeItem(idx)}><i className="fa-solid fa-trash" /></button>}
                      </div>
                      {item.type === 'flight' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <input className="adm-input" placeholder="Origen (MAD)" maxLength={3} value={item.origin} onChange={e => updateItem(idx, 'origin', e.target.value.toUpperCase())} />
                          <input className="adm-input" placeholder="Destino (BOG)" maxLength={3} value={item.destination} onChange={e => updateItem(idx, 'destination', e.target.value.toUpperCase())} />
                          <AdminDatePicker value={item.departure} onChange={d => updateItem(idx, 'departure', d)} placeholder="Salida" />
                          <AdminDatePicker value={item.return_date} onChange={d => updateItem(idx, 'return_date', d)} placeholder="Regreso" />
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <div className="adm-form-group" style={{ marginBottom: 0 }}>
                          <label className="adm-label">Pasajeros</label>
                          <input className="adm-input" type="number" min="1" value={item.passengers} onChange={e => updateItem(idx, 'passengers', Number(e.target.value))} />
                        </div>
                        <div className="adm-form-group" style={{ marginBottom: 0 }}>
                          <label className="adm-label">Precio unitario (€)</label>
                          <input className="adm-input" type="number" min="0" step="0.01" value={item.unit_price === 0 ? '' : item.unit_price} placeholder="0" onChange={e => updateItem(idx, 'unit_price', e.target.value === '' ? 0 : Number(e.target.value))} />
                        </div>
                        <div className="adm-form-group" style={{ marginBottom: 0 }}>
                          <label className="adm-label">Subtotal</label>
                          <div style={{ height: 38, display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--adm-primary)', fontSize: 15 }}>
                            {fmtMoney(Number(item.unit_price) * Number(item.quantity || 1))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', fontWeight: 900, fontSize: 18, color: 'var(--adm-primary)', marginTop: 8 }}>
                    Total: {fmtMoney(total)}
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="adm-btn outline" onClick={async () => { await save(); if (!msg) sendQuote(editingId || ''); }} disabled={saving}>
                  <i className="fa-solid fa-paper-plane" /> Guardar y enviar
                </button>
                <button className="adm-btn primary" onClick={save} disabled={saving}>
                  {saving ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</> : <><i className="fa-solid fa-save" /> Guardar borrador</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
