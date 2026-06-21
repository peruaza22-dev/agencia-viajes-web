'use client';

import type { AdminRole } from '@/hooks/useAdminRole';
import { SIDEBAR_MODULES } from '@/hooks/useAdminRole';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  section: string;
}

const ALL_NAV: NavItem[] = [
  // Dashboard
  { id: 'overview',     label: 'Resumen',        icon: 'fa-gauge-high',       section: 'Dashboard' },
  { id: 'analytics',    label: 'Analíticas',     icon: 'fa-chart-line',       section: 'Dashboard' },
  { id: 'market',       label: 'Mercado',        icon: 'fa-earth-americas',   section: 'Dashboard' },
  // CRM
  { id: 'bookings',     label: 'Reservas',       icon: 'fa-calendar-check',   section: 'CRM' },
  { id: 'calendar',     label: 'Calendario',     icon: 'fa-calendar-days',    section: 'CRM' },
  { id: 'payments',     label: 'Pagos',          icon: 'fa-credit-card',      section: 'CRM' },
  { id: 'users',        label: 'Usuarios',       icon: 'fa-users',            section: 'CRM' },
  { id: 'support',      label: 'Soporte',        icon: 'fa-headset',          section: 'CRM' },
  // CMS
  { id: 'blog',         label: 'Blog',           icon: 'fa-newspaper',        section: 'CMS' },
  { id: 'destinations', label: 'Destinos',       icon: 'fa-map-location-dot', section: 'CMS' },
  { id: 'packages',     label: 'Paquetes',       icon: 'fa-suitcase-rolling', section: 'CMS' },
  { id: 'jobs',         label: 'Empleos',        icon: 'fa-briefcase',        section: 'CMS' },
  { id: 'media',        label: 'Medios',         icon: 'fa-images',           section: 'CMS' },
  // Sistema
  { id: 'cache',          label: 'Caché API',      icon: 'fa-database',         section: 'Sistema' },
  { id: 'booking-mode',   label: 'Modo reservas',  icon: 'fa-toggle-on',        section: 'Sistema' },
  { id: 'settings',       label: 'Configuración',  icon: 'fa-gear',             section: 'Sistema' },
  { id: 'pricing',        label: 'Precios',        icon: 'fa-percent',          section: 'Sistema' },
  { id: 'special-offers', label: 'Ofertas',        icon: 'fa-tag',              section: 'Sistema' },
  { id: 'push',           label: 'Notificaciones', icon: 'fa-bell',             section: 'Sistema' },
  // CRM
  { id: 'agent',          label: 'Modo Agente',    icon: 'fa-user-tie',         section: 'CRM' },
  { id: 'pos',            label: 'Punto de Venta', icon: 'fa-cash-register',    section: 'CRM' },
  { id: 'quotes',         label: 'Cotizaciones',   icon: 'fa-file-invoice',     section: 'CRM' },
  { id: 'price-alerts',   label: 'Alertas precio', icon: 'fa-bell',             section: 'CRM' },
  { id: 'accounting',     label: 'Contabilidad',   icon: 'fa-calculator',       section: 'Contabilidad' },
  { id: 'commissions',    label: 'Comisiones',     icon: 'fa-hand-holding-dollar', section: 'Contabilidad' },
  // Contabilidad
  { id: 'invoices',     label: 'Facturas',       icon: 'fa-file-invoice-dollar', section: 'Contabilidad' },
  { id: 'coupons',      label: 'Cupones',        icon: 'fa-ticket',              section: 'Contabilidad' },
];

const ROLE_COLORS: Record<string, string> = {
  admin:   '#ef4444',
  manager: '#3b82f6',
  agent:   '#14b8a6',
  editor:  '#a855f7',
  viewer:  '#64748b',
};

interface Props {
  role: AdminRole;
  active: string;
  collapsed: boolean;
  mobileOpen: boolean;
  pendingBookings?: number;
  onNavigate: (id: string) => void;
  onToggle: () => void;
  onMobileClose: () => void;
  userEmail?: string;
}

export default function AdminSidebar({
  role, active, collapsed, mobileOpen,
  pendingBookings = 0,
  onNavigate, onToggle, onMobileClose, userEmail,
}: Props) {
  const allowed = SIDEBAR_MODULES[role] ?? [];
  const visible = ALL_NAV.filter(n => allowed.includes(n.id));

  // Agrupar por sección
  const sections = visible.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const initials = userEmail ? userEmail[0].toUpperCase() : 'A';
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const roleColor = ROLE_COLORS[role] || '#64748b';

  return (
    <>
      {/* Overlay móvil */}
      <div
        className={`adm-sidebar-overlay${mobileOpen ? ' visible' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={`adm-sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>

        {/* ── Logo + botón toggle ── */}
        <div className="adm-sidebar-logo">
          <div className="logo-icon">
            <i className="fa-solid fa-plane-departure" />
          </div>
          {!collapsed && (
            <div className="logo-text">
              Travel Admin
              <span>Panel de control</span>
            </div>
          )}
          {/* Botón toggle — siempre visible */}
          <button
            className="adm-sidebar-toggle"
            onClick={onToggle}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`} />
          </button>
        </div>

        {/* ── Navegación ── */}
        <nav className="adm-nav">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              {/* Separador de sección */}
              <div className="adm-nav-section">
                {collapsed
                  ? <div className="adm-nav-divider" />
                  : <span className="adm-nav-section-label">{section}</span>
                }
              </div>

              {items.map(item => {
                const isActive = active === item.id;
                const hasBadge = item.id === 'bookings' && pendingBookings > 0;
                return (
                  <button
                    key={item.id}
                    className={`adm-nav-item${isActive ? ' active' : ''}`}
                    data-label={item.label}
                    onClick={() => { onNavigate(item.id); onMobileClose(); }}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon">
                      <i className={`fa-solid ${item.icon}`} />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        {hasBadge && (
                          <span className="nav-badge">{pendingBookings > 99 ? '99+' : pendingBookings}</span>
                        )}
                      </>
                    )}
                    {/* Badge en modo collapsed */}
                    {collapsed && hasBadge && (
                      <span className="nav-badge-dot" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer usuario ── */}
        <div className="adm-sidebar-footer">
          {collapsed ? (
            /* Modo mini: solo avatar con tooltip */
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                className="adm-user-avatar"
                title={`${userEmail} (${roleLabel})`}
                style={{ borderColor: roleColor, border: `2px solid ${roleColor}` }}
              >
                {initials}
              </div>
            </div>
          ) : (
            <div className="adm-user-info">
              <div
                className="adm-user-avatar"
                style={{ border: `2px solid ${roleColor}` }}
              >
                {initials}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div className="adm-user-name">{userEmail || 'Admin'}</div>
                <div className="adm-user-role" style={{ color: roleColor }}>{roleLabel}</div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
