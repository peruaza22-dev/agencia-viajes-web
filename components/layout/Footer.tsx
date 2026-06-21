'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const COLS = [
  [
    { to: '/vuelos', icon: 'fa-plane', label: 'Vuelos' },
    { to: '/hoteles', icon: 'fa-building', label: 'Hoteles' },
    { to: '/destinos', icon: 'fa-map-marker', label: 'Destinos' },
    { to: '/vacaciones', icon: 'fa-anchor', label: 'Vacaciones' },
    { to: '/autobuses', icon: 'fa-bus', label: 'Autobús' },
    { to: '/traslados', icon: 'fa-home', label: 'Taxi' },
  ],
  [
    { to: '/sobre-nosotros', icon: 'fa-institution', label: 'Sobre Nosotros' },
    { to: '/contacto', icon: 'fa-phone', label: 'Contáctanos' },
    { to: '/empleo', icon: 'fa-user-secret', label: 'Empleos' },
    { to: '/blog', icon: 'fa-wordpress', label: 'Blog' },
  ],
  [
    { to: '/coming-soon', icon: 'fa-question', label: "FAQ's" },
    { to: '/mantenimiento', icon: 'fa-desktop', label: 'Mantenimiento' },
  ],
];

const SOCIAL = [
  { icon: 'fa-brands fa-whatsapp', key: 'social_whatsapp', color: '#25D366' },
  { icon: 'fa-brands fa-facebook-f', key: 'social_facebook', color: '#1877F2' },
  { icon: 'fa-brands fa-instagram', key: 'social_instagram', color: '#E1306C' },
  { icon: 'fa-brands fa-youtube', key: 'social_youtube', color: '#FF0000' },
  { icon: 'fa-brands fa-tiktok', key: 'social_tiktok', color: '#000' },
];

export default function Footer() {
  const { get } = useSiteSettings();

  return (
    <footer>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 w-full">
            <h2>Enlaces Útiles</h2>
            <div className="flink grid grid-cols-1 sm:grid-cols-3 gap-4">
              {COLS.map((col, ci) => (
                <div key={ci}>
                  {col.map((l) => (
                    <Link key={l.to + l.label} href={l.to}>
                      <i className={`fa ${l.icon}`} />
                      {l.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 w-full">
            <h2>Sobre {get('company_name') || 'Viajes y Experiencias'}</h2>
            <p>{get('footer_about') || 'Descubre el mundo con Viajes y Experiencias.'}</p>
            <Link href="/sobre-nosotros" className="read">
              Leer Más
            </Link>
          </div>

          <div className="lg:col-span-3 w-full">
            <h2>Información de Contacto</h2>
            <h4>
              <i className="fa fa-phone" style={{ width: 18 }} />{' '}
              {get('footer_phone') || '+34 912 345 678'}
            </h4>
            <h5>
              <i className="fa fa-clock-o" style={{ width: 18 }} /> (
              {get('footer_schedule') || '07:30 - 23:59 Hrs, Lun - Vie'})
            </h5>
            <h6>
              <i className="fa fa-envelope-o" style={{ width: 18 }} />{' '}
              {get('footer_email') || 'info@viajesyexperiencias.es'}
            </h6>
            <h6>
              <i className="fa fa-map-marker" style={{ width: 18 }} />{' '}
              {get('footer_address') || 'Calle Gran Vía 28, 28013 Madrid'}
            </h6>
            <div className="social">
              {SOCIAL.map((s) => {
                const val = get(s.key);
                const href = s.key === 'social_whatsapp' && val
                  ? `https://wa.me/${val.replace(/\D/g, '')}`
                  : val || '#!';
                return (
                  <a
                    key={s.icon}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className={`fa ${s.icon}`} />
                  </a>
                );
              })}
            </div>
            <div className="back-to-top">
              <Link href="/">Inicio</Link> |{' '}
              <a href="#body">
                Volver Arriba <i className="fa fa-long-arrow-up" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="payment">
        <span>Aceptamos</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/payment.png"
          alt="Métodos de pago"
          className="payment-img"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <div className="copy">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <span>
            {get('company_copyright') ||
              '© 2026 Viajes y Experiencias. Todos los derechos reservados.'}
          </span>
          <span>
            Diseñado por{' '}
            <a className="designedby" href="#!">
              {get('footer_designed_by') || 'Tu Agencia'}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
