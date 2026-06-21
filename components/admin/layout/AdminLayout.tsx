'use client';

import { useState, type ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import type { AdminRole } from '@/hooks/useAdminRole';
import '../admin.css';

const VIEW_LABELS: Record<string, string> = {
  overview:     'Resumen',
  analytics:    'Analíticas',
  bookings:     'Reservas',
  payments:     'Pagos',
  users:        'Usuarios',
  support:      'Soporte al Cliente',
  blog:         'Blog',
  destinations: 'Destinos',
  packages:     'Paquetes',
  jobs:         'Empleos',
  pricing:      'Precios y Márgenes',
  market:       'Análisis de Mercado',
  cache:        'Gestión de Caché',
  settings:     'Configuración',
  calendar:       'Calendario de Reservas',
  coupons:        'Cupones y Descuentos',
  'booking-mode': 'Modo de Reservas',
  invoices:       'Facturas y Presupuestos',
  media:          'Biblioteca de Medios',
  'special-offers': 'Ofertas Especiales',
  push:             'Notificaciones Push',
  agent:            'Modo Agente',
  quotes:           'Cotizaciones',
  'price-alerts':   'Alertas de Precio',
  commissions:      'Comisiones',
};

interface Props {
  role: AdminRole;
  active: string;
  pendingBookings?: number;
  userEmail?: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

export default function AdminLayout({
  role, active, pendingBookings = 0,
  userEmail, onNavigate, onLogout, children,
}: Props) {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="adm-root adm-layout">
      <AdminSidebar
        role={role}
        active={active}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        pendingBookings={pendingBookings}
        onNavigate={onNavigate}
        onToggle={() => setCollapsed(c => !c)}
        onMobileClose={() => setMobileOpen(false)}
        userEmail={userEmail}
      />

      <div className={`adm-main${collapsed ? ' sidebar-collapsed' : ''}`}>
        {/* Topbar */}
        <header className="adm-topbar">
          {/* Botón hamburguesa — solo visible en móvil */}
          <button
            className="adm-topbar-toggle adm-mobile-only"
            onClick={() => setMobileOpen(o => !o)}
            title="Abrir menú"
          >
            <i className="fa-solid fa-bars" />
          </button>

          {/* Breadcrumb */}
          <div className="adm-breadcrumb">
            <i className="fa-solid fa-house" style={{ fontSize: 11, color: 'var(--adm-text-muted)' }} />
            <i className="fa-solid fa-chevron-right" />
            <span className="current">{VIEW_LABELS[active] || active}</span>
          </div>

          {/* Acciones */}
          <div className="adm-topbar-actions">
            {pendingBookings > 0 && (
              <button
                className="adm-topbar-btn"
                title={`${pendingBookings} reservas pendientes`}
                onClick={() => onNavigate('bookings')}
              >
                <i className="fa-solid fa-bell" />
                <span className="dot" />
              </button>
            )}
            <button
              className="adm-topbar-btn"
              title="Cerrar sesión"
              onClick={onLogout}
            >
              <i className="fa-solid fa-right-from-bracket" />
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main className="adm-content">
          {children}
        </main>
      </div>
    </div>
  );
}
