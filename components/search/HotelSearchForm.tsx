'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/ui/DatePicker';
import CounterField from '@/components/ui/CounterField';

export default function HotelSearchForm({ onSearch }: { onSearch?: (data: any) => void }) {
  const router = useRouter();
  const [dest, setDest] = useState('');
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [board, setBoard] = useState('Seleccionar');
  const col6 = 'w-1/2 px-1 sm:px-2';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch) { onSearch({ dest, checkin, checkout, guests, rooms, board }); return; }
    const params = new URLSearchParams();
    if (dest) params.append('destination', dest);
    if (checkin) params.append('checkin', checkin.toISOString().split('T')[0]);
    if (checkout) params.append('checkout', checkout.toISOString().split('T')[0]);
    params.append('guests', String(guests));
    router.push(`/hoteles?${params}`);
  };

  return (
    <div className="tab-bg">
      <h2>Reserva Hoteles, Resorts y Alojamientos</h2>
      <form onSubmit={handleSubmit}>
        <div className="input2"><span>Buscar ofertas de hoteles</span>
          <input type="text" value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Destino o nombre del hotel" />
        </div>
        <div className="flex flex-wrap -mx-2">
          <div className={col6}><DatePicker label="Entrada" value={checkin} onChange={setCheckin} placeholder="Check-in" /></div>
          <div className={col6}><DatePicker label="Salida" value={checkout} onChange={setCheckout} placeholder="Check-out" minDate={checkin || new Date()} alignRight /></div>
        </div>
        <div className="flex flex-wrap -mx-1 sm:-mx-2">
          <div className="w-1/3 px-1 sm:px-2"><CounterField label="Huéspedes" value={guests} min={1} max={20} onChange={setGuests} /></div>
          <div className="w-1/3 px-1 sm:px-2"><CounterField label="Habitaciones" value={rooms} min={1} max={10} onChange={setRooms} /></div>
          <div className="w-1/3 px-1 sm:px-2">
            <div className="input2"><span>Régimen</span>
              <select value={board} onChange={(e) => setBoard(e.target.value)}>
                {['Seleccionar', 'Todo Incluido', 'Desayuno', 'Media Pensión', 'Solo Alojamiento'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
        <button className="search-btn" type="submit"><i className="fa fa-search" /> Buscar Hoteles</button>
      </form>
    </div>
  );
}
