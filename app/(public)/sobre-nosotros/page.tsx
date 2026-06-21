import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/metadata';
import { Quote } from 'lucide-react';
import StatsBar from '@/components/about/StatsBar';
import WhyUsGrid from '@/components/about/WhyUsGrid';
import TeamGrid from '@/components/about/TeamGrid';
import PageBanner from '@/components/layout/PageBanner';

export const metadata: Metadata = buildMetadata({
  title: 'Sobre Nosotros',
  description: 'Somos una agencia de viajes especializada en vuelos, hoteles y paquetes turísticos. Conoce nuestro equipo y nuestra pasión por los viajes.',
  path: '/sobre-nosotros',
});

const FEATURES = ['Ideas Creativas', 'Diseño Adaptable para todos los dispositivos', 'Características Excelentes'];
const ABOUT_IMAGES = ['/img/about-02.jpg', '/img/about-03.jpg', '/img/about-04.jpg', '/img/about-05.jpg'];

export default function SobreNosotrosPage() {
  return (
    <>
      <PageBanner
        title="Sobre Nosotros"
        subtitle="Ayudamos a las personas a encontrar experiencias increíbles a un precio razonable"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Sobre Nosotros' }]}
      />

      {/* Intro */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">¡Somos Viajes y Experiencias!</p>
              <h2 className="text-3xl font-bold font-poppins text-gray-800 mb-4">
                Somos una <span className="text-primary">agencia de viajes</span> de servicio completo que hace realidad tus sueños.
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Un equipo de diseñadores y agentes de viajes apasionados e inigualables. Especializados en vuelos, hoteles, paquetes vacacionales y traslados para toda España y el mundo.
              </p>
              <ul className="space-y-3 mb-6">
                {FEATURES.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-600">
                    <i className="fa fa-check-circle" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/about-01.jpg" alt="Sobre Viajes y Experiencias" className="rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Galería */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ABOUT_IMAGES.map((src, i) => (
              <div key={i} className="h-48 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Sobre nosotros ${i + 2}`} className="w-full h-48 object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="bg-primary py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Quote size={40} className="text-white/30 mx-auto mb-4" />
            <h3 className="text-white text-xl md:text-2xl font-light leading-relaxed italic">
              Nuestra pasión por la excelencia en el servicio al cliente es solo una de las razones por las que somos líderes en el mercado.
            </h3>
          </div>
        </div>
      </section>

      <StatsBar />
      <WhyUsGrid />
      <TeamGrid />
    </>
  );
}
