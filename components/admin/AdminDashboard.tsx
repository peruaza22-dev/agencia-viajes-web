'use client';

// ============================================
// ADMIN DASHBOARD — Orquestador principal
// Roles: admin | manager | agent | editor | viewer
// ============================================
import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from './layout/AdminLayout';
import type { AdminRole } from '@/hooks/useAdminRole';
import { useAdminFetch } from '@/hooks/useAdminFetch';

// Carga diferida de paneles para reducir bundle inicial
const OverviewPanel      = lazy(() => import('./panels/OverviewPanel'));
const BookingsPanel      = lazy(() => import('./panels/BookingsPanel'));
const UsersPanel         = lazy(() => import('./panels/UsersPanel'));
const SupportPanel       = lazy(() => import('./panels/SupportPanel'));
const BlogPanel          = lazy(() => import('./panels/BlogPanel'));
const CachePanel         = lazy(() => import('./panels/CachePanel'));
const InvoicesPanel      = lazy(() => import('./panels/InvoicesPanel'));
const PaymentsPanel      = lazy(() => import('./panels/PaymentsPanel'));
const DestinationsPanel  = lazy(() => import('./panels/DestinationsPanel'));
const JobsPanel          = lazy(() => import('./panels/JobsPanel'));
const AnalyticsPanel     = lazy(() => import('./panels/AnalyticsPanel'));
const SettingsPanel      = lazy(() => import('./panels/SettingsPanel'));
const MarketPanel        = lazy(() => import('./panels/MarketPanel'));
const PackagesPanel      = lazy(() => import('./panels/PackagesPanel'));
const PricingPanel       = lazy(() => import('./panels/PricingPanel'));
const MediaPanel         = lazy(() => import('./panels/MediaPanel'));
const BookingModePanel   = lazy(() => import('./panels/BookingModePanel'));
const CouponsPanel       = lazy(() => import('./panels/CouponsPanel'));
const CalendarPanel      = lazy(() => import('./panels/CalendarPanel'));
const SpecialOffersPanel = lazy(() => import('./panels/SpecialOffersPanel'));
const PushPanel          = lazy(() => import('./panels/PushPanel'));
const AgentPanel         = lazy(() => import('./panels/AgentPanel'));
const QuotesPanel        = lazy(() => import('./panels/QuotesPanel'));
const PriceAlertsPanel   = lazy(() => import('./panels/PriceAlertsPanel'));
const CommissionsPanel   = lazy(() => import('./panels/CommissionsPanel'));
const AccountingPanel    = lazy(() => import('./panels/AccountingPanel'));
const POSPanel           = lazy(() => import('./panels/POSPanel'));

// Paneles inline ligeros (no necesitan lazy)
import PermissionGuard from '@/components/auth/PermissionGuard';

// Paneles pendientes de implementar — placeholder reutilizable
function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="adm-card">
      <div className="adm-empty" style={{ padding: 60 }}>
        <i className={`fa-solid ${icon}`} style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 6 }}>{title}</h3>
        <p>Este módulo está en desarrollo.</p>
      </div>
    </div>
  );
}

function PanelLoader() {
  return (
    <div className="adm-loading" style={{ minHeight: 200 }}>
      <div className="adm-spinner" />
      <span>Cargando módulo…</span>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { adminFetch, API } = useAdminFetch();

  const [view, setView]                   = useState('overview');
  const [pendingBookings, setPendingBookings] = useState(0);

  const loadStats = () => {
    adminFetch(`${API}/admin/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setPendingBookings(d.data?.pendingBookings ?? 0); })
      .catch(() => {});
  };

  // Cargar conteo de reservas pendientes para el badge del sidebar
  useEffect(() => {
    loadStats();

    // Escuchar evento de reset para refrescar el badge
    const channel = new BroadcastChannel('ta_admin_refresh');
    channel.onmessage = (e) => {
      if (e.data === 'stats') loadStats();
    };
    return () => channel.close();
  }, []);

  // Determinar rol del usuario actual
  const role: AdminRole = (['admin', 'manager', 'agent', 'editor', 'viewer'].includes(user?.role)
    ? user.role
    : 'viewer') as AdminRole;

  const handleLogout = () => {
    logout?.();
    router.push('/admin/login');
  };

  const renderPanel = () => {
    switch (view) {
      case 'overview':
        return <OverviewPanel role={role} onNavigate={setView} />;
      case 'bookings':
        return <BookingsPanel role={role} />;
      case 'users':
        return <UsersPanel role={role} />;
      case 'support':
        return <SupportPanel role={role} />;
      case 'blog':
        return <BlogPanel role={role} />;
      case 'cache':
        return <CachePanel role={role} />;
      case 'invoices':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <InvoicesPanel role={role} />
          </PermissionGuard>
        );
      case 'payments':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <PaymentsPanel role={role} />
          </PermissionGuard>
        );
      case 'destinations':
        return <DestinationsPanel role={role} />;
      case 'packages':
        return <PackagesPanel role={role} />;
      case 'jobs':
        return <JobsPanel role={role} />;
      case 'market':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <MarketPanel role={role} />
          </PermissionGuard>
        );
      case 'analytics':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <AnalyticsPanel role={role} />
          </PermissionGuard>
        );
      case 'pricing':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <PricingPanel role={role} />
          </PermissionGuard>
        );
      case 'special-offers':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <SpecialOffersPanel role={role} />
          </PermissionGuard>
        );
      case 'accounting':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <AccountingPanel role={role} />
          </PermissionGuard>
        );
      case 'push':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <PushPanel role={role} />
          </PermissionGuard>
        );
      case 'agent':
        return <AgentPanel role={role} />;
      case 'pos':
        return <POSPanel />;
      case 'quotes':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <QuotesPanel role={role} />
          </PermissionGuard>
        );
      case 'price-alerts':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <PriceAlertsPanel role={role} />
          </PermissionGuard>
        );
      case 'commissions':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <CommissionsPanel role={role} />
          </PermissionGuard>
        );
      case 'calendar':
        return <CalendarPanel role={role} />;
      case 'coupons':
        return (
          <PermissionGuard allowed={role === 'admin' || role === 'manager'}>
            <CouponsPanel role={role} />
          </PermissionGuard>
        );
      case 'booking-mode':
        return (
          <PermissionGuard allowed={role === 'admin'}>
            <BookingModePanel role={role} />
          </PermissionGuard>
        );
      case 'media':
        return <MediaPanel role={role} />;
      case 'settings':
        return (
          <PermissionGuard allowed={role === 'admin'}>
            <SettingsPanel role={role} />
          </PermissionGuard>
        );
      default:
        return <OverviewPanel role={role} onNavigate={setView} />;
    }
  };

  return (
    <AdminLayout
      role={role}
      active={view}
      pendingBookings={pendingBookings}
      userEmail={user?.email}
      onNavigate={setView}
      onLogout={handleLogout}
    >
      <Suspense fallback={<PanelLoader />}>
        {renderPanel()}
      </Suspense>
    </AdminLayout>
  );
}
