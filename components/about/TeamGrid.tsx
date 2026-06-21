import SectionHeading from '@/components/ui/SectionHeading';

const DEFAULT_MEMBERS = [
  { name: 'María García', role: 'Directora Ejecutiva (CEO)', img: '/img/team/maria-garcia.svg' },
  { name: 'Carlos López', role: 'Director de Operaciones', img: '/img/team/carlos-lopez.svg' },
  { name: 'Laura Martínez', role: 'Jefa de Atención al Cliente', img: '/img/team/laura-martinez.svg' },
  { name: 'Pedro Sánchez', role: 'Director de Marketing', img: '/img/team/pedro-sanchez.svg' },
];

const SOCIAL_ICONS = [
  { icon: 'fa-brands fa-linkedin', href: '#!' },
  { icon: 'fa-brands fa-x-twitter', href: '#!' },
  { icon: 'fa-brands fa-instagram', href: '#!' },
];

interface Member { name: string; role: string; img: string; social?: { icon: string; href: string }[] }

export default function TeamGrid({
  members = DEFAULT_MEMBERS as Member[],
  title = 'Las Personas Detrás de la Magia',
  subtitle = 'Conoce al equipo apasionado que trabaja para hacer de tus viajes una experiencia inolvidable.',
}: {
  members?: Member[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="py-14 bg-gray-50">
      <div className="container mx-auto px-4">
        <SectionHeading title={title} subtitle={subtitle} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center group">
              <div className="pt-8 pb-4 px-4 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-md mb-4 group-hover:border-blue-100 transition-all duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.img} alt={m.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/img/favicon.png'; }} />
                </div>
                <h2 className="font-bold text-gray-800 font-poppins text-base mb-1">{m.name}</h2>
                <p className="text-primary text-xs font-semibold uppercase tracking-wide mb-4">{m.role}</p>
                <div className="flex justify-center gap-2">
                  {(m.social ?? SOCIAL_ICONS).map((s) => (
                    <a key={s.icon} href={s.href} className="w-8 h-8 bg-gray-100 hover:bg-primary text-gray-500 hover:text-white rounded-full flex items-center justify-center text-xs transition-all duration-200 hover:scale-110">
                      <i className={`fa ${s.icon}`} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
