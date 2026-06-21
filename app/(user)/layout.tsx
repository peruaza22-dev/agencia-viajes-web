'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  // ✅ CLEANUP AUDITADO — useEffect sin side effects pendientes
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div id="body">
      <MobileNav />
      <Header />
      {children}
      <Footer />
    </div>
  );
}
