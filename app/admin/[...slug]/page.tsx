'use client';

import AdminDashboard from '@/components/admin/AdminDashboard';

// Captura /admin/overview, /admin/bookings, /admin/settings, etc.
export default function AdminSlugPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard />
    </div>
  );
}
