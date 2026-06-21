'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Payment {
  id: string;
  booking_id: string;
  booking_reference?: string;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  stripe_payment_id?: string;
  created_at: string;
  customer_email?: string;
  customer_name?: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'warning', completed: 'success', paid: 'success', failed: 'danger', refunded: 'info',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', completed: 'Completado', paid: 'Pagado', failed: 'Fallido', refunded: 'Reembolsado',
};
const METHOD_ICON: Record<string, string> = {
  card: 'fa-credit-card', paypal: 'fa-brands fa-paypal',
  bank_transfer: 'fa-building-columns', card_demo: 'fa-flask',
};

const fmt = (n: number, cur = 'EUR') =>
  Number(n).toLocaleString('es-ES', { style: 'currency', currency: cur, minimumFractionDigits: 2 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Props { role: AdminRole; }

export default function PaymentsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal]       = useState(0);
  const [revenue, setRevenue]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT), offset: String(page * LIMIT),
        ...(filter !== 'all' && { payment_status: filter }),
      });
      const r = await adminFetch(`${API}/admin/payments?${params}`);
      const d = await r.json();
      if (d.success) {
        setPayments(d.data || []);
        setTotal(d.pagination?.total || 0);
        setRevenue(d.stats?.totalRevenue || 0);
      }
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? payments.filter(p =>
        p.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
        p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.booking_reference?.toLowerCase().includes(search.toLowerCase()) ||
        p.stripe_payment_id?.toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  const totalPages = Math.ceil(total / LIMIT);

  // Stats rápidas
  const completed = payments.filter(p => p.payment_status === 'paid' || p.payment_status === 'completed').length;
  const pending   = payments.filter(p => p.payment_status === 'pending').length;
  const failed    = payments.filter(p => p.payment_status === 'failed').length;

  return (
    <PermissionGuard allowed={can('payments_view')}>
      <div>
        {/* Stats */}
        <div className="adm-stats-grid" style={{ marginBottom: 20 }}>
          <div className="adm-stat">
            <div className="adm-stat-icon green"><i className="fa-solid fa-coins" /></div>
            <div><div className="adm-stat-value">{fmt(revenue)}</div><div className="adm-stat-label">Ingresos totales</div></div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-icon blue"><i className="fa-solid fa-circle-check" /></div>
            <div><div className="adm-stat-value">{completed}</div><div className="adm-stat-label">Completados</div></div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-icon orange"><i className="fa-solid fa-clock" /></div>
            <div><div className="adm-stat-value">{pending}</div><div className="adm-stat-label">Pendientes</div></div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat-icon red"><i className="fa-solid fa-circle-xmark" /></div>
            <div><div className="adm-stat-value">{failed}</div><div className="adm-stat-label">Fallidos</div></div>
          </div>
        </div>

        {/* Filtros */}
        <div className="adm-filters">
          <div className="adm-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input placeholder="Buscar por email, referencia, ID Stripe…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="adm-filter-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
            <option value="all">Todos los estados</option>
            <option value="paid">Pagados</option>
            <option value="pending">Pendientes</option>
            <option value="failed">Fallidos</option>
            <option value="refunded">Reembolsados</option>
          </select>
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /> Actualizar</button>
          {can('export') && (
            <button className="adm-btn outline sm" onClick={() => window.open(`${API}/admin/export/payments?format=csv`, '_blank')}>
              <i className="fa-solid fa-file-csv" /> Exportar
            </button>
          )}
        </div>

        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-credit-card" />Pagos
              <span className="adm-badge default">{total}</span>
            </span>
          </div>
          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>ID / Referencia</th><th>Cliente</th><th>Método</th><th>Estado</th><th>Monto</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6}><div className="adm-table-empty"><i className="fa-solid fa-credit-card" />Sin pagos</div></td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="mono" style={{ fontSize: 11 }}>{p.stripe_payment_id?.slice(0, 20) || p.id.slice(0, 8)}…</div>
                        {p.booking_reference && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{p.booking_reference}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.customer_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{p.customer_email || '—'}</div>
                      </td>
                      <td>
                        <span className="adm-badge default">
                          <i className={`fa-solid ${METHOD_ICON[p.payment_method] || 'fa-money-bill'}`} />
                          {p.payment_method === 'bank_transfer' ? 'Transferencia' : p.payment_method === 'card_demo' ? 'Demo' : p.payment_method}
                        </span>
                      </td>
                      <td><span className={`adm-badge ${STATUS_BADGE[p.payment_status] || 'default'}`}>{STATUS_LABEL[p.payment_status] || p.payment_status}</span></td>
                      <td style={{ fontWeight: 700 }}>{fmt(p.amount, p.currency)}</td>
                      <td className="muted">{fmtDate(p.created_at)}</td>
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
      </div>
    </PermissionGuard>
  );
}
