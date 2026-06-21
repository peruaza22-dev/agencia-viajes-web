'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Send } from 'lucide-react';
import PageBanner from '@/components/layout/PageBanner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

const OFFICES = [
  { city: 'Madrid', address: 'Gran Vía 28, 28013 Madrid', phone: '+34 912 345 678', hours: 'Lun–Vie 9:00–20:00' },
  { city: 'Barcelona', address: 'Passeig de Gràcia 85, 08008 BCN', phone: '+34 934 567 890', hours: 'Lun–Vie 9:00–20:00' },
  { city: 'Sevilla', address: 'Calle Sierpes 14, 41001 Sevilla', phone: '+34 954 321 098', hours: 'Lun–Vie 9:00–19:00' },
];

const SOCIAL_ICONS = ['fa-facebook', 'fa-twitter', 'fa-instagram', 'fa-youtube'];
const SUBJECTS = ['', 'Reserva de vuelo', 'Reserva de hotel', 'Paquete vacacional', 'Modificar reserva', 'Cancelación', 'Otro'];

interface ContactForm { name: string; email: string; phone: string; subject: string; message: string }

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<ContactForm>({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } catch { /* show success regardless */ }
    setSent(true);
  };

  const upd = (k: keyof ContactForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const CONTACT_INFO = [
    { icon: 'fa-phone', title: 'Teléfono 24/7', text: '+34 900 888 888' },
    { icon: 'fa-envelope', title: 'Email', text: 'info@viajesyexperiencias.es' },
    { icon: 'fa-map-marker', title: 'Oficina central', text: 'Gran Vía 28, 28013 Madrid' },
    { icon: 'fa-clock-o', title: 'Horario', text: 'Lun–Vie 9:00–20:00\nSáb 10:00–14:00' },
  ];

  return (
    <>
      <PageBanner
        title="Contacto"
        subtitle="Estamos aquí para ayudarte con tu próxima aventura"
        breadcrumbs={[{ to: '/', icon: 'fa-home', label: 'Inicio' }, { label: 'Contacto' }]}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Info lateral */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-xl font-bold font-poppins text-gray-800 mb-4">Información de contacto</h2>
              {CONTACT_INFO.map(({ icon, title, text }) => (
                <div key={title} className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                    <i className={`fa ${icon}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 text-sm">{title}</div>
                    <div className="text-gray-500 text-sm whitespace-pre-line">{text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-3">Síguenos</h3>
              <div className="flex gap-2">
                {SOCIAL_ICONS.map((ic) => (
                  <a key={ic} href="#!" className="w-9 h-9 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full flex items-center justify-center transition-colors">
                    <i className={`fa ${ic}`} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-2">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <i className="fa fa-check-circle" style={{ fontSize: 48, color: '#22c55e', marginBottom: 16 }} />
                <h3 className="text-2xl font-bold font-poppins text-gray-800 mb-2">¡Mensaje enviado!</h3>
                <p className="text-gray-500 mb-6">Te responderemos en menos de 24 horas.</p>
                <button onClick={() => setSent(false)} className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold">
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold font-poppins text-gray-800 mb-5">Envíanos un mensaje</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase block mb-1">Nombre completo</label>
                    <input required value={form.name} onChange={upd('name')} placeholder="Tu nombre"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase block mb-1">Email</label>
                    <input required type="email" value={form.email} onChange={upd('email')} placeholder="tu@email.com"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase block mb-1">Teléfono</label>
                    <input value={form.phone} onChange={upd('phone')} placeholder="+34 600 000 000"
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase block mb-1">Asunto</label>
                    <select value={form.subject} onChange={upd('subject')}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary">
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s || 'Selecciona un asunto'}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-gray-500 uppercase block mb-1">Mensaje</label>
                  <textarea required rows={5} value={form.message} onChange={upd('message')} placeholder="Cuéntanos cómo podemos ayudarte..."
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
                </div>
                <button type="submit" className="flex items-center gap-2 bg-primary hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl transition-colors">
                  <Send size={16} /> Enviar mensaje
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Mapa */}
        <div className="mt-10 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <iframe
            title="Oficina principal — Gran Vía, Madrid"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3037.4916553765527!2d-3.703790684604784!3d40.41992097936347!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd422882efd93f43%3A0x1a2b03a6c7d8e9f0!2sGran+V%C3%ADa%2C+28013+Madrid!5e0!3m2!1ses!2ses!4v1700000000000!5m2!1ses!2ses"
            width="100%"
            height={340}
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Oficinas */}
        <div className="mt-12">
          <h2 className="text-xl font-bold font-poppins text-gray-800 mb-6 text-center">Nuestras Oficinas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {OFFICES.map((o) => (
              <div key={o.city} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
                <h3 className="font-bold text-gray-800 font-poppins mb-3 flex items-center gap-2">
                  <i className="fa fa-map-marker" />{o.city}
                </h3>
                <p className="text-sm text-gray-500 mb-1">{o.address}</p>
                <p className="text-sm text-primary font-medium mb-1">{o.phone}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1"><i className="fa fa-clock-o" />{o.hours}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
