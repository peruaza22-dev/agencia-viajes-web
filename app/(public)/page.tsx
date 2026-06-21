import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/metadata';
import SearchBox from '@/components/home/SearchBox';

export const metadata: Metadata = buildMetadata({
  title: 'Inicio',
  description: 'Tu agencia de viajes online. Reserva vuelos, hoteles y paquetes al mejor precio. Las mejores ofertas de viaje en España y el mundo.',
  path: '/',
});

const TOURS = [
  { img: '/img/t1.png', city: 'Madrid', link: '/vacaciones' },
  { img: '/img/t2.png', city: 'Barcelona', link: '/vacaciones' },
  { img: '/img/t3.png', city: 'Sevilla', link: '/vacaciones' },
  { img: '/img/t4.png', city: 'Valencia', link: '/vacaciones' },
];

const BLOG_POSTS = [
  { img: '/img/about-02.jpg', title: 'Los mejores destinos de verano', link: '/blog' },
  { img: '/img/about-03.jpg', title: 'Consejos para viajar barato', link: '/blog' },
  { img: '/img/about-04.jpg', title: 'Guía para tu primer viaje a Europa', link: '/blog' },
];

const BEST_FEATURES = [
  { icon: 'fa-dollar', title: 'Mejor Precio Garantizado', desc: '¿Encontraste un precio más bajo? Te reembolsamos el 100% de la diferencia.' },
  { icon: 'fa-headphones', title: 'Soporte 24×7', desc: 'Siempre aquí para ti — contáctanos las 24 horas del día, los 7 días de la semana.' },
  { icon: 'fa-ticket', title: 'Reserva Sencilla', desc: 'Proceso de reserva rápido y seguro. Confirmación inmediata en tu email.' },
  { icon: 'fa-shield', title: 'Pago Seguro', desc: 'Todas las transacciones están protegidas con tecnología de encriptación SSL.' },
];

const PARTNERS = [
  '/img/p_01.png', '/img/p_02.png', '/img/p_03.png',
  '/img/p_04.png', '/img/p_05.png', '/img/p_06.png',
];

export default function HomePage() {
  return (
    <>
      <section
        className="banner-bg"
        style={{ backgroundImage: 'url(/img/banner.jpg)' }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <SearchBox />
            </div>
            <div className="hidden lg:block space-y-4">
              <img src="/img/b1-2.jpg" alt="Oferta especial" className="rounded w-full" />
              <img src="/img/b2-1.jpg" alt="Descuentos viajes" className="rounded w-full" />
            </div>
          </div>
        </div>
      </section>

      <div className="best-flight-bg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BEST_FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="best-bg">
                <div className="icon-wrap">
                  <i className={`fa ${icon}`} />
                </div>
                <div>
                  <span>{title}</span>
                  <small>{desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-10">
        <h2 className="title"><strong>Paquetes Turísticos</strong></h2>
        <div className="tour">
          <div className="flex flex-wrap tour-items">
            {TOURS.map(({ img, city, link }) => (
              <div key={city} className="px-2">
                <Link href={link} className="tour-block">
                  <img src={img} alt={city} className="rounded" />
                  <h2>{city}</h2>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <Link href="/vacaciones" className="view-more">Ver todos los paquetes</Link>
      </section>

      <section className="blog container mx-auto px-4 py-6">
        <h2 className="title"><strong>Blog de Viajes</strong></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {BLOG_POSTS.map(({ img, title, link }) => (
            <Link key={title} href={link} className="block group">
              <img src={img} alt={title} className="w-full h-48 object-cover rounded-t-xl" />
              <div className="bg-white border border-gray-100 rounded-b-xl p-4">
                <h3 className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="partner container mx-auto px-4 py-6">
        <h2 className="title"><strong>Aerolíneas Asociadas</strong></h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-6">
          {PARTNERS.map((src) => (
            <img key={src} src={src} alt="Aerolínea asociada" className="plogo" />
          ))}
        </div>
      </section>
    </>
  );
}
