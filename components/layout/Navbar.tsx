'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/context/SiteSettingsContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Inicio', icon: 'fa-home' },
  { to: '/vuelos', label: 'Vuelos', icon: 'fa-plane' },
  { to: '/hoteles', label: 'Hoteles', icon: 'fa-bed' },
  { to: '/autobuses', label: 'Autobús', icon: 'fa-bus' },
  { to: '/traslados', label: 'Traslados', icon: 'fa-car' },
  { to: '/destinos', label: 'Destinos', icon: 'fa-map-marker' },
  { to: '/vacaciones', label: 'Vacaciones', icon: 'fa-suitcase' },
];

interface NavbarProps {
  logoSrc?: string;
  logoAlt?: string;
  navItems?: NavItem[];
}

export default function Navbar({ logoSrc: logoSrcProp, logoAlt = 'Viajes y Experiencias', navItems = NAV }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { get } = useSiteSettings();

  const logoSrc = get('company_logo') || logoSrcProp || '/img/logo.svg';
  const companyName = get('company_name') || logoAlt;

  return (
    <div className="navigation">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Link href="/" onClick={() => setOpen(false)} style={{ textDecoration: 'none', padding: '6px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={companyName}
            className="brand-logo"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = '/img/logo.svg';
            }}
          />
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#003580' }}
          className="nav-toggle"
          aria-label="Toggle navigation"
        >
          <i className={`fa fa-${open ? 'times' : 'bars'}`} />
        </button>
        <div style={{ display: 'flex', flexWrap: 'wrap' }} className={`nav-links${open ? ' open' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              onClick={() => setOpen(false)}
              className={`nav-link${pathname === item.to ? ' active' : ''}`}
            >
              <i className={`fa ${item.icon}`} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width:991px) {
          .nav-toggle { display:block !important; }
          .nav-links { display:none !important; width:100%; flex-direction:column; }
          .nav-links.open { display:flex !important; }
          .nav-links .nav-link { flex-direction:row; text-align:left; border-top:1px solid #ededed; padding:12px 18px; }
          .nav-links .nav-link i { font-size:18px; margin-bottom:0; margin-right:10px; display:inline; }
        }
      `}</style>
    </div>
  );
}
