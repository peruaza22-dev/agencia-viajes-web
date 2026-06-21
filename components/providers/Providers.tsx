'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import { SearchProvider } from '@/context/SearchContext';

export function Providers({ children }: { children: React.ReactNode }) {
  // Cleanup any stale service worker registrations from previous versions.
  // This avoids ERR_CACHE_READ_FAILURE issues caused by old SW cache rules.
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        if (registration.active || registration.installing || registration.waiting) {
          registration.unregister();
        }
      });
    }).catch(() => {
      // ignore errors from service worker cleanup
    });
  }, []);

  return (
    <AuthProvider>
      <SiteSettingsProvider>
        <SearchProvider>
          {children}
        </SearchProvider>
      </SiteSettingsProvider>
    </AuthProvider>
  );
}
