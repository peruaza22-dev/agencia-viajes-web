'use client';

import { useState, useEffect } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Props { role: AdminRole; }

export default function PushPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { isAdmin, isManager } = useAdminRole(role);

  const [stats, setStats]     = useState<{ total: number; enabled: boolean } | null>(null);
  const [form, setForm]       = useState({ title: '', body: '', url: '/', tag: 'admin' });
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    adminFetch(`${API}/admin/push/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(() => {});
  }, []);

  const send = async () => {
    if (!form.title.trim() || !form.body.trim()) { setError('Título y mensaje requeridos'); return; }
    setSending(true); setError(''); setResult(null);
    try {
      const r = await adminFetch(`${API}/admin/push/send`, {
        method: 'POST', body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) setResult({ sent: d.sent, failed: d.failed });
      else setError(d.error?.message || 'Error al enviar');
    } catch { setError('Error de conexión'); }
    finally { setSending(false); }
  };

  return (
    <PermissionGuard allowed={isAdmin || isManager}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Estado */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-bell" /> Notificaciones Push</span>
          </div>
          <div className="adm-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--adm-primary)' }}>{stats?.total ?? '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>Suscriptores activos</div>
              </div>
              <div style={{ background: stats?.enabled ? '#dcfce7' : '#fee2e2', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: stats?.enabled ? '#15803d' : '#b91c1c' }}>
                  <i className={`fa-solid ${stats?.enabled ? 'fa-check-circle' : 'fa-times-circle'}`} style={{ marginRight: 6 }} />
                  {stats?.enabled ? 'VAPID Activo' : 'VAPID Inactivo'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 4 }}>
                  {stats?.enabled ? 'Notificaciones reales' : 'Configura VAPID_PUBLIC_KEY en .env'}
                </div>
              </div>
            </div>

            {!stats?.enabled && (
              <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 16 }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: '#f59e0b', marginRight: 8 }} />
                <strong>Para activar notificaciones push reales</strong>, añade al <code>.env</code> del servidor:
                <pre style={{ background: '#fff', borderRadius: 6, padding: '8px 12px', marginTop: 8, fontSize: 12, overflowX: 'auto' }}>
{`VAPID_PUBLIC_KEY=BAsDz970qje78XL0D1Tnpk8QAfMt39vqvbdnpqs0TgwecsdQzO0dRxknP6kiAHBmpntIE98rjdFdFKnMPR16LsE
VAPID_PRIVATE_KEY=Ve9rLPMDHRleBj7v1i85q-TABM066yoEdlk1Ii2Mgig
VAPID_EMAIL=mailto:tu@email.com`}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Enviar notificación */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-paper-plane" /> Enviar notificación</span>
          </div>
          <div className="adm-card-body">
            {error && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                {error}
              </div>
            )}
            {result && (
              <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
                <i className="fa-solid fa-check-circle" style={{ marginRight: 6 }} />
                Enviado a {result.sent} suscriptores{result.failed > 0 ? ` (${result.failed} fallidos)` : ''}
              </div>
            )}
            <div className="adm-form-group">
              <label className="adm-label">Título *</label>
              <input className="adm-input" placeholder="✈ Nueva oferta flash disponible"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="adm-form-group">
              <label className="adm-label">Mensaje *</label>
              <textarea className="adm-textarea" rows={3} placeholder="Madrid → Bogotá desde 489€ ida y vuelta. ¡Solo hoy!"
                value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </div>
            <div className="adm-form-row">
              <div className="adm-form-group">
                <label className="adm-label">URL al hacer clic</label>
                <input className="adm-input" placeholder="/vuelos" value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Tag (evita duplicados)</label>
                <input className="adm-input" placeholder="oferta-flash" value={form.tag}
                  onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} />
              </div>
            </div>
            <button className="adm-btn primary" onClick={send}
              disabled={sending || !form.title || !form.body || !stats?.enabled}>
              {sending
                ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Enviando…</>
                : <><i className="fa-solid fa-paper-plane" /> Enviar a {stats?.total ?? 0} suscriptores</>}
            </button>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
