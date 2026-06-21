'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import InvoiceForm from './InvoiceForm';

interface Invoice {
  id: string;
  invoice_number: string;
  type: 'invoice' | 'quote';
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'expired';
  customer_name: string;
  customer_email?: string;
  total: number;
  currency: string;
  issue_date: string;
  due_date?: string;
  verification_hash: string;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'default', sent: 'info', paid: 'success', cancelled: 'danger', expired: 'warning',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviada', paid: 'Pagada', cancelled: 'Cancelada', expired: 'Expirada',
};

const fmt = (n: number, cur = 'EUR') =>
  Number(n).toLocaleString('es-ES', { style: 'currency', currency: cur, minimumFractionDigits: 2 });
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface Props { role: AdminRole; }

export default function InvoicesPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [items, setItems]       = useState<Invoice[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [typeFilter, setType]   = useState('all');
  const [statusFilter, setStatus] = useState('all');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        limit: String(LIMIT), offset: String(page * LIMIT),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search && { search }),
      });
      const r = await adminFetch(`${API}/invoices?${p}`);
      const d = await r.json();
      if (d.success) { setItems(d.data || []); setTotal(d.pagination?.total || 0); }
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [page, typeFilter, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const openNew = (type: 'invoice' | 'quote') => {
    setEditing({ type, status: 'draft', items: [] });
    setShowForm(true);
  };

  const openEdit = async (id: string) => {
    const r = await adminFetch(`${API}/invoices/${id}`);
    const d = await r.json();
    if (d.success) { setEditing(d.data); setShowForm(true); }
  };

  const updateStatus = async (id: string, status: string) => {
    await adminFetch(`${API}/invoices/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('¿Eliminar este borrador?')) return;
    await adminFetch(`${API}/invoices/${id}`, { method: 'DELETE' });
    load();
  };

  const openPDF = (id: string) => {
    const token = localStorage.getItem('ta_token') || '';
    window.open(`${API}/invoices/${id}/pdf?token=${token}`, '_blank');
  };

  const sendByEmail = async (inv: Invoice) => {
    const email = prompt('Email de destino:', inv.customer_email || '');
    if (!email) return;
    try {
      const r = await adminFetch(`${API}/invoices/${inv.id}/send`, {
        method: 'POST', body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (d.success) { alert(`✓ Enviada a ${email}`); load(); }
      else alert(`Error: ${d.error?.message || 'No se pudo enviar'}`);
    } catch { alert('Error de conexión'); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <PermissionGuard allowed={can('payments_view')}>
      <div>
        {/* Filtros + acciones */}
        <div className="adm-filters">
          <div className="adm-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input placeholder="Buscar por número, cliente…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
          <select className="adm-filter-select" value={typeFilter} onChange={e => { setType(e.target.value); setPage(0); }}>
            <option value="all">Facturas y presupuestos</option>
            <option value="invoice">Solo facturas</option>
            <option value="quote">Solo presupuestos</option>
          </select>
          <select className="adm-filter-select" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(0); }}>
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Cancelada</option>
            <option value="expired">Expirada</option>
          </select>
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
          {can('payments_edit') && (
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="adm-btn primary" onClick={() => openNew('invoice')}>
                <i className="fa-solid fa-file-invoice" /> Nueva factura
              </button>
              <button className="adm-btn outline" onClick={() => openNew('quote')}>
                <i className="fa-solid fa-file-lines" /> Nuevo presupuesto
              </button>
            </div>
          )}
        </div>

        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-file-invoice-dollar" />
              Facturas y Presupuestos
              <span className="adm-badge default">{total}</span>
            </span>
          </div>
          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Número</th><th>Tipo</th><th>Cliente</th>
                    <th>Estado</th><th>Total</th><th>Emisión</th><th>Vence</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={8}><div className="adm-table-empty"><i className="fa-solid fa-file-invoice" />Sin documentos</div></td></tr>
                  ) : items.map(inv => (
                    <tr key={inv.id}>
                      <td className="mono" style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                      <td>
                        <span className={`adm-badge ${inv.type === 'invoice' ? 'info' : 'purple'}`}>
                          <i className={`fa-solid ${inv.type === 'invoice' ? 'fa-file-invoice' : 'fa-file-lines'}`} />
                          {inv.type === 'invoice' ? 'Factura' : 'Presupuesto'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{inv.customer_name}</div>
                        {inv.customer_email && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{inv.customer_email}</div>}
                      </td>
                      <td>
                        <select
                          className="adm-filter-select"
                          style={{ padding: '3px 8px', fontSize: 11 }}
                          value={inv.status}
                          onChange={e => updateStatus(inv.id, e.target.value)}
                          disabled={!can('payments_edit')}
                        >
                          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td style={{ fontWeight: 700 }}>{fmt(inv.total, inv.currency)}</td>
                      <td className="muted">{fmtDate(inv.issue_date)}</td>
                      <td className="muted">{fmtDate(inv.due_date)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {/* PDF */}
                          <button className="adm-btn outline icon-only sm" title="Ver / Imprimir PDF" onClick={() => openPDF(inv.id)}>
                            <i className="fa-solid fa-file-pdf" />
                          </button>
                          {/* Enviar por email */}
                          {inv.customer_email && can('payments_edit') && (
                            <button className="adm-btn outline icon-only sm" title="Enviar por email" onClick={() => sendByEmail(inv)}>
                              <i className="fa-solid fa-envelope" />
                            </button>
                          )}
                          {/* Editar */}
                          {can('payments_edit') && (
                            <button className="adm-btn outline icon-only sm" title="Editar" onClick={() => openEdit(inv.id)}>
                              <i className="fa-solid fa-pen" />
                            </button>
                          )}
                          {/* Eliminar solo borradores */}
                          {can('payments_edit') && inv.status === 'draft' && (
                            <button className="adm-btn danger icon-only sm" title="Eliminar borrador" onClick={() => deleteInvoice(inv.id)}>
                              <i className="fa-solid fa-trash" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="adm-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>{page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} de {total}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="adm-btn outline sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><i className="fa-solid fa-chevron-left" /></button>
                <span style={{ padding: '5px 10px', fontSize: 12 }}>{page + 1} / {totalPages}</span>
                <button className="adm-btn outline sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><i className="fa-solid fa-chevron-right" /></button>
              </div>
            </div>
          )}
        </div>

        {/* Modal formulario */}
        {showForm && editing && (
          <InvoiceForm
            initial={editing}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSaved={() => { setShowForm(false); setEditing(null); load(); }}
          />
        )}
      </div>
    </PermissionGuard>
  );
}
