'use client';

import React, { useState, useEffect } from 'react';
import type { AdminRole } from '@/hooks/useAdminRole';
import { useAdminFetch } from '@/hooks/useAdminFetch';

interface AccountingSummary {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  invoicesCount: number;
  paymentsCount: number;
  currency: string;
}

interface AccountingEvent {
  type: string;
  timestamp: string;
  description: string;
  amount?: number;
  bookingId?: string;
  invoiceId?: string;
  paymentMethod?: string;
  status?: string;
}

export default function AccountingPanel({ role }: { role: AdminRole }) {
  const { adminFetch, API } = useAdminFetch();
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [events, setEvents] = useState<AccountingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  // Fetch summary data
  const loadSummary = async () => {
    try {
      setLoading(true);
      const resp = await adminFetch(`${API}/admin/accounting/summary`);
      if (!resp.ok) throw new Error('Failed to load summary');
      const data = await resp.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading summary');
    } finally {
      setLoading(false);
    }
  };

  // Setup SSE stream for live events
  useEffect(() => {
    loadSummary();

    // Get token for SSE auth
    const token = (typeof window !== 'undefined' && 
      (localStorage.getItem('ta_token') || localStorage.getItem('sb-access-token'))) || '';
    
    if (!token) {
      setError('Authentication token not found');
      return;
    }

    // Connect to SSE stream
    const eventSource = new EventSource(
      `${API}/admin/accounting/stream?token=${encodeURIComponent(token)}`
    );

    const handleOpen = () => {
      setStreaming(true);
      setError(null);
    };

    const handleMessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data) as AccountingEvent;
        setEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
        
        // Refresh summary every 5 events for real-time view
        if (Math.random() < 0.2) {
          loadSummary();
        }
      } catch (err) {
        console.error('Failed to parse event:', err);
      }
    };

    const handleError = () => {
      setStreaming(false);
      eventSource.close();
      setError('Connection to live feed lost');
      
      // Attempt reconnect after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    eventSource.addEventListener('open', handleOpen);
    eventSource.addEventListener('message', handleMessage);
    eventSource.addEventListener('error', handleError);

    return () => {
      eventSource.removeEventListener('open', handleOpen);
      eventSource.removeEventListener('message', handleMessage);
      eventSource.removeEventListener('error', handleError);
      eventSource.close();
    };
  }, [adminFetch, API]);

  if (loading) {
    return (
      <div className="adm-card">
        <div className="adm-empty" style={{ padding: 60 }}>
          <div className="adm-spinner" style={{ marginBottom: 16 }} />
          <p>Cargando datos de contabilidad…</p>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="adm-card">
        <div className="adm-empty" style={{ padding: 60, color: '#ef4444' }}>
          <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: 32, marginBottom: 16 }} />
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="adm-btn adm-btn-primary"
            style={{ marginTop: 16 }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--adm-text)' }}>
          <i className="fa-solid fa-calculator" style={{ marginRight: 10 }} />
          Contabilidad en tiempo real
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: streaming ? '#10b981' : '#6b7280',
              animation: streaming ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--adm-text-secondary)' }}>
            {streaming ? 'En vivo' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {/* Total Revenue */}
          <div className="adm-card" style={{ padding: 20, borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: 12, color: 'var(--adm-text-secondary)', marginBottom: 8 }}>
              Ingresos Totales
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginBottom: 8 }}>
              {summary.currency} {summary.totalRevenue.toLocaleString('es-AR')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--adm-text-secondary)' }}>
              {summary.paymentsCount} pagos registrados
            </div>
          </div>

          {/* Total Paid */}
          <div className="adm-card" style={{ padding: 20, borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: 12, color: 'var(--adm-text-secondary)', marginBottom: 8 }}>
              Pagado
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
              {summary.currency} {summary.totalPaid.toLocaleString('es-AR')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--adm-text-secondary)' }}>
              Confirmado y disponible
            </div>
          </div>

          {/* Total Pending */}
          <div className="adm-card" style={{ padding: 20, borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: 12, color: 'var(--adm-text-secondary)', marginBottom: 8 }}>
              Pendiente
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
              {summary.currency} {summary.totalPending.toLocaleString('es-AR')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--adm-text-secondary)' }}>
              En revisión o pagos pendientes
            </div>
          </div>

          {/* Total Refunded */}
          <div className="adm-card" style={{ padding: 20, borderLeft: '4px solid #ef4444' }}>
            <div style={{ fontSize: 12, color: 'var(--adm-text-secondary)', marginBottom: 8 }}>
              Reembolsado
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
              {summary.currency} {summary.totalRefunded.toLocaleString('es-AR')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--adm-text-secondary)' }}>
              Devoluciones procesadas
            </div>
          </div>
        </div>
      )}

      {/* ─── Live Events Feed ─── */}
      <div className="adm-card">
        <div style={{ padding: 20, borderBottom: '1px solid var(--adm-border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--adm-text)' }}>
            <i className="fa-solid fa-stream" style={{ marginRight: 8 }} />
            Eventos en tiempo real
          </h2>
          <p style={{ fontSize: 12, color: 'var(--adm-text-secondary)', marginTop: 4 }}>
            Últimos pagos, facturas y transacciones
          </p>
        </div>

        <div style={{ 
          maxHeight: 500,
          overflowY: 'auto',
          padding: '16px 0',
        }}>
          {events.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--adm-text-secondary)' }}>
              <p>Esperando eventos…</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Los eventos apareceran aquí en tiempo real</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {events.map((event, idx) => {
                const timestamp = new Date(event.timestamp);
                const timeStr = timestamp.toLocaleTimeString('es-AR');
                const dateStr = timestamp.toLocaleDateString('es-AR');

                let iconColor = '#3b82f6';
                let icon = 'fa-credit-card';

                if (event.type === 'payment_succeeded') {
                  iconColor = '#10b981';
                  icon = 'fa-check-circle';
                } else if (event.type === 'payment_failed') {
                  iconColor = '#ef4444';
                  icon = 'fa-times-circle';
                } else if (event.type === 'invoice_created') {
                  icon = 'fa-file-invoice';
                } else if (event.type === 'refund_processed') {
                  iconColor = '#f59e0b';
                  icon = 'fa-undo';
                }

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid var(--adm-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'background 0.2s ease',
                    }}
                    className="accounting-event-row"
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: iconColor,
                        minWidth: 20,
                      }}
                    >
                      <i className={`fa-solid ${icon}`} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--adm-text)' }}>
                        {event.description}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--adm-text-secondary)', marginTop: 2 }}>
                        {event.bookingId && <span>Reserva: {event.bookingId} • </span>}
                        {event.paymentMethod && <span>{event.paymentMethod} • </span>}
                        <span>{timeStr}</span>
                      </div>
                    </div>

                    {event.amount && (
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: iconColor,
                        whiteSpace: 'nowrap',
                      }}>
                        ${event.amount.toLocaleString('es-AR')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── CSS for animations ─── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .accounting-event-row:hover {
          background: var(--adm-bg-hover);
        }
      `}</style>
    </div>
  );
}
