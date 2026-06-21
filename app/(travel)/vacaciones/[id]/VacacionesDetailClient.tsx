'use client';

import { useState } from 'react';
import Link from 'next/link';

const MOCK: Record<string, any> = {
  '1': { id: 1, city: 'Madrid', name: 'Madrid City Break', nights: 3, price: 299, oldPrice: 399, rating: 4.8, reviews: 234, img: '/img/t1.png', includes: ['Vuelo', 'Hotel 4★', 'Desayuno'], description: 'Descubre la capital de España con este paquete completo.' },
  '2': { id: 2, city: 'Barcelona', name: 'Barcelona Escapada', nights: 4, price: 349, oldPrice: 449, rating: 4.9, reviews: 512, img: '/img/t2.png', includes: ['Vuelo', 'Hotel 4★', 'City Tour'], description: 'La ciudad condal te espera con la Sagrada Família y el Barrio Gótico.' },
};

interface Pkg {
  id?: string | number;
  city?: string;
  name?: string;
  nights?: number;
  price?: number;
  oldPrice?: number;
  rating?: number;
  reviews?: number;
  img?: string;
  main_image?: string;
  includes?: string[];
  description?: string;
  short_description?: string;
}

export default function VacacionesDetailClient({ id, initialPkg }: { id: string; initialPkg: Pkg | null }) {
  const pkg = initialPkg ?? MOCK[id] ?? null;
  const [guests, setGuests] = useState(2);
  const [contact, setContact] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [err, setErr] = useState('');

  if (!pkg) {
    return (
      <div className="text-center py-20">
        <i className="fa fa-exclamation-circle" style={{ fontSize: 40, color: '#ccc', display: 'block', marginBottom: 12 }} />
        <p className="text-gray-400">Paquete no encontrado</p>
        <Link href="/vacaciones" className="text-primary mt-4 inline-block">← Ver todos los paquetes</Link>
      </div>
    );
  }

  const total = (pkg.price ?? 0) * guests;
  const taxes = Math.round(total * 0.1);
  const title = pkg.city ?? pkg.name ?? 'Paquete';
  const image = pkg.img ?? pkg.main_image ?? '/img/t1.png';
  const desc = pkg.description ?? pkg.short_description ?? '';

  const upd = (k: keyof typeof contact) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setContact((c) => ({ ...c, [k]: e.target.value }));

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email) { setErr('El email de contacto es obligatorio'); return; }
    setErr('');
    alert(`Reserva iniciada para ${title}. Ref: PKG-${Date.now()}`);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <Link href="/vacaciones" className="text-sm text-primary inline-flex items-center gap-2 mb-4 hover:underline">
        <i className="fa fa-arrow-left" />Volver a paquetes
      </Link>

      <div className="flex flex-wrap gap-5 items-start">
        {/* Principal */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={title} className="w-full h-64 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/img/about-01.jpg'; }} />
              {pkg.oldPrice && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {Math.round((1 - (pkg.price ?? 0) / pkg.oldPrice) * 100)}% descuento
                </div>
              )}
            </div>
            <div className="p-5">
              <h1 className="text-2xl font-bold text-primary font-poppins mb-2">
                {title} {pkg.nights ? `· ${pkg.nights} noches` : ''}
              </h1>
              {pkg.includes && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {pkg.includes.map((inc: string) => (
                    <span key={inc} className="border border-primary rounded-full px-3 py-1 text-xs text-primary font-semibold">
                      <i className="fa fa-check mr-1 text-xs" />{inc}
                    </span>
                  ))}
                </div>
              )}
              {desc && <p className="text-gray-600 leading-relaxed">{desc}</p>}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleBook} className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-bold text-gray-600 text-xs uppercase mb-4">Datos del Contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {(['firstName', 'lastName', 'email', 'phone'] as const).map((k) => (
                <div key={k}>
                  <label className="text-xs text-gray-400 uppercase block mb-1">
                    {k === 'firstName' ? 'Nombre' : k === 'lastName' ? 'Apellidos' : k === 'email' ? 'Email *' : 'Teléfono'}
                  </label>
                  <input
                    type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
                    value={contact[k]} onChange={upd(k)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 uppercase block mb-1">Personas</label>
              <select value={guests} onChange={(e) => setGuests(+e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary">
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} persona{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
            <button type="submit" className="bg-red-500 hover:bg-primary text-white w-full py-3 rounded-lg font-bold transition-colors">
              <i className="fa fa-lock mr-2" />Reservar Ahora
            </button>
          </form>
        </div>

        {/* Sidebar precio */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Resumen del Precio</h3>
            <div className="text-sm text-gray-600 space-y-2 mb-4 pb-4 border-b border-gray-100">
              <div className="flex justify-between"><span>{pkg.price}€ × {guests} persona{guests > 1 ? 's' : ''}</span><span>{pkg.price! * guests}€</span></div>
              <div className="flex justify-between"><span>Tasas e impuestos</span><span>{taxes}€</span></div>
            </div>
            <div className="flex justify-between font-bold text-lg text-primary mb-4">
              <span>Total</span><span>{total + taxes}€</span>
            </div>
            <Link href="/vacaciones" className="block text-center text-xs text-gray-400 hover:text-primary">
              ← Ver más paquetes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
