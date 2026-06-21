// ============================================
// Hook de permisos por rol (Next.js version)
// ============================================

export type AdminRole = 'admin' | 'manager' | 'agent' | 'editor' | 'viewer';

const PERMISSIONS: Record<string, AdminRole[]> = {
  overview:          ['admin', 'manager', 'agent', 'editor', 'viewer'],
  analytics:         ['admin', 'manager'],
  bookings_view:     ['admin', 'manager', 'agent', 'viewer'],
  bookings_edit:     ['admin', 'manager', 'agent'],
  users_view:        ['admin', 'manager', 'viewer'],
  users_edit:        ['admin', 'manager'],
  support:           ['admin', 'manager', 'agent'],
  payments_view:     ['admin', 'manager'],
  payments_edit:     ['admin'],
  blog_view:         ['admin', 'manager', 'editor', 'viewer'],
  blog_edit:         ['admin', 'manager', 'editor'],
  destinations_view: ['admin', 'manager', 'editor', 'viewer'],
  destinations_edit: ['admin', 'manager', 'editor'],
  packages_view:     ['admin', 'manager', 'editor', 'viewer'],
  packages_edit:     ['admin', 'manager', 'editor'],
  jobs_view:         ['admin', 'manager', 'editor', 'viewer'],
  jobs_edit:         ['admin', 'manager', 'editor'],
  cache:             ['admin', 'manager'],
  settings:          ['admin'],
  roles:             ['admin'],
  export:            ['admin', 'manager'],
  invoices_view:     ['admin', 'manager'],
  invoices_edit:     ['admin', 'manager'],
};

export const SIDEBAR_MODULES: Record<AdminRole, string[]> = {
  admin:   ['overview', 'analytics', 'market', 'bookings', 'calendar', 'agent', 'pos', 'quotes', 'price-alerts', 'users', 'support', 'payments', 'blog', 'destinations', 'packages', 'jobs', 'media', 'cache', 'booking-mode', 'settings', 'pricing', 'special-offers', 'push', 'accounting', 'invoices', 'coupons', 'commissions'],
  manager: ['overview', 'analytics', 'market', 'bookings', 'calendar', 'agent', 'pos', 'quotes', 'price-alerts', 'users', 'support', 'payments', 'blog', 'destinations', 'packages', 'jobs', 'media', 'cache', 'pricing', 'special-offers', 'push', 'accounting', 'invoices', 'coupons', 'commissions'],
  agent:   ['overview', 'bookings', 'calendar', 'agent', 'pos', 'quotes', 'support'],
  editor:  ['overview', 'blog', 'destinations', 'packages', 'jobs', 'media'],
  viewer:  ['overview', 'bookings', 'users', 'blog', 'destinations'],
};

export function useAdminRole(role: AdminRole = 'viewer') {
  const can = (permission: string): boolean => {
    const allowed = PERMISSIONS[permission];
    if (!allowed) return false;
    return allowed.includes(role);
  };

  const canSee = (module: string): boolean =>
    SIDEBAR_MODULES[role]?.includes(module) ?? false;

  const isAdmin   = role === 'admin';
  const isManager = role === 'admin' || role === 'manager';
  const isAgent   = role === 'admin' || role === 'manager' || role === 'agent';
  const isEditor  = role === 'admin' || role === 'manager' || role === 'editor';

  return { can, canSee, isAdmin, isManager, isAgent, isEditor, role };
}
