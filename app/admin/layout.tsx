'use client';

// Admin layout — protegido por middleware.ts
// El middleware ya verificó el JWT antes de llegar aquí
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
