'use client';

/**
 * SiteSettingsContext — Next.js version
 * - Polling cada 60s (mín 100ms) con cleanup correcto
 * - BroadcastChannel con cleanup correcto (CLEANUP AUDITADO)
 * - Singleton: montado una sola vez en el layout raíz
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

// If NEXT_PUBLIC_API_URL is not set we avoid polling a default localhost API
// which would produce repeated `ERR_CONNECTION_REFUSED` messages in the browser.
const API = process.env.NEXT_PUBLIC_API_URL || null;
const CACHE_KEY = 'ta_site_settings';
const BROADCAST = 'ta_settings_updated';
const POLL_MS = Math.max(60_000, 100); // mínimo 100ms, default 60s

export const DEFAULTS: Record<string, string> = {
  company_name: 'Viajes y Experiencias',
  // Prefer SVG available in /public to avoid a missing PNG 404
  company_logo: '/img/logo.svg',
  company_favicon: '/img/favicon.png',
  company_copyright: '© 2026 Viajes y Experiencias. Todos los derechos reservados.',
  topbar_welcome: 'Bienvenido a Viajes y Experiencias',
  topbar_support_text: 'Soporte 24/7',
  topbar_support_url: '#!',
  topbar_phone: '+34 912 345 678',
  topbar_visible: 'true',
  hero_title: 'Vuelos, Hoteles y Paquetes Turísticos',
  hero_subtitle: 'Encuentra las mejores ofertas de viaje',
  hero_image: '/img/banner.jpg',
  hero_color: '#003580',
  hero_overlay: '0',
  best_price_title: 'MEJOR PRECIO GARANTIZADO',
  best_price_desc: '¿Encontraste un precio más bajo? Te reembolsamos el 100% de la diferencia.',
  support_title: 'SOPORTE 24×7',
  support_desc: 'Siempre aquí para ti – contáctanos las 24 horas del día, los 7 días de la semana.',
  section_flights_title: 'Mejores Vuelos',
  section_packages_title: 'Paquetes Turísticos',
  section_blog_title: 'Blog de Viajes',
  section_partners_title: 'Aerolíneas Asociadas',
  footer_about: 'Descubre el mundo con Viajes y Experiencias. Somos líderes en soluciones de viaje.',
  footer_phone: '+34 912 345 678',
  footer_schedule: '07:30 - 23:59 Hrs, Lun - Vie',
  footer_email: 'info@viajesyexperiencias.es',
  footer_address: 'Calle Gran Vía 28, 28013 Madrid',
  footer_designed_by: 'Tu Agencia',
  social_whatsapp: '',
  social_facebook: '#!',
  social_instagram: '#!',
  social_youtube: '#!',
  social_tiktok: '#!',
  seo_site_name: 'Viajes y Experiencias',
  seo_description: 'Tu agencia de viajes online. Reserva vuelos, hoteles y paquetes al mejor precio.',
  subscribe_title: 'Regístrate para Cupones/Ofertas Exclusivas',
  subscribe_desc: 'Acceso exclusivo a cupones, ofertas especiales y promociones.',
  app_download_title: 'Descarga Nuestra App',
  app_store_url: '#!',
  play_store_url: '#!',
  qr_image: '/img/travel-engine-QR.png',
  primary_color: '#003580',
  secondary_color: '#ee1d25',
  font_family: 'Poppins',
  about_main_image: '/img/about-01.jpg',
  about_image_1: '/img/about-02.jpg',
  about_image_2: '/img/about-03.jpg',
  about_image_3: '/img/about-04.jpg',
  about_image_4: '/img/about-05.jpg',
  blog_banner_image: '/img/blog-banner.png',
};

interface SiteSettingsContextType {
  settings: Record<string, string>;
  get: (key: string) => string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULTS,
  get: (key) => DEFAULTS[key] || '',
  loading: false,
  refresh: async () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  // Inicializar con DEFAULTS para mantener coherencia con SSR.
  // Leer localStorage se hace en useEffect (tras el primer render) para evitar
  // mismatches de hidratación cuando la cache local contiene valores distintos.
  const [settings, setSettings] = useState<Record<string, string>>(() => ({ ...DEFAULTS }));
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  const load = useCallback(async (silent = false) => {
    // If no API configured, skip network calls.
    if (!API) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`${API}/cms/public`, { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      if (d.success && d.data && isMounted.current) {
        const merged = { ...DEFAULTS, ...d.data };
        setSettings(merged);
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: d.data, ts: Date.now() })
          );
        } catch {
          /* silencioso */
        }
      }
    } catch {
      /* silencioso — usa defaults */
    } finally {
      if (!silent && isMounted.current) setLoading(false);
    }
  }, []);

  // ✅ CLEANUP AUDITADO — setInterval + BroadcastChannel correctamente limpiados
  useEffect(() => {
    isMounted.current = true;
    // Primero intentar cargar valores en cache local (si existen) para evitar
    // un salto visual tras la hidratación — esto se hace en el cliente después
    // del primer render, por lo que mantiene el HTML inicial igual al servidor.
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          setSettings((s) => ({ ...s, ...data }));
        }
      }
    } catch {
      /* silencioso */
    }

    // Luego lanzar la carga remota (si API configurada) para refrescar valores.
    load();

    const intervalId = setInterval(() => load(true), POLL_MS); // ✅ cleanup

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(BROADCAST);
      channel.onmessage = () => {
        if (isMounted.current) load(true);
      };
    } catch {
      /* Safari antiguo */
    }

    return () => {
      isMounted.current = false;
      clearInterval(intervalId); // ✅ limpia intervalo
      channel?.close();          // ✅ cierra BroadcastChannel
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ CLEANUP AUDITADO — CSS variables aplicadas reactivamente
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (settings.primary_color)
        root.style.setProperty('--color-primary', settings.primary_color);
      if (settings.secondary_color)
        root.style.setProperty('--color-secondary', settings.secondary_color);
      if (settings.font_family)
        root.style.setProperty('--font-family', settings.font_family + ', sans-serif');
      if (settings.hero_color)
        root.style.setProperty('--color-hero', settings.hero_color);
      if (settings.company_favicon) {
        const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (link) link.href = settings.company_favicon;
      }
    }
  }, [settings]);

  const get = (key: string) => settings[key] ?? DEFAULTS[key] ?? '';

  return (
    <SiteSettingsContext.Provider
      value={{ settings, get, loading, refresh: () => load(false) }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

/** Llamar desde el admin después de guardar para notificar a todas las tabs */
export function notifySettingsUpdated() {
  try {
    const ch = new BroadcastChannel(BROADCAST);
    ch.postMessage('updated');
    ch.close();
  } catch {
    /* silencioso */
  }
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* silencioso */
  }
}
