'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/ui/DatePicker';

export default function TaxiSearchForm({ onSearch }: { onSearch?: (data: any) => void }) {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [depDate, setDepDate] = useState<Date | null>(null);
  const [retDate, setRetDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState('');
  const col6 = 'w-1/2 px-1 sm:px-2';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch) { onSearch({ from, to, depDate, retDate }); return; }
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (depDate) params.append('date', depDate.toISOString().split('T')[0]);
    if (pickupTime) params.append('time', pickupTime);
    router.push(`/traslados?${params}`);
  };

  return (
    <div className="tab-bg">
      <h2>Reserva Traslados para más de 900+ ciudades</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-1 sm:-mx-2">
          <div className={col6}><div className="input"><span>Origen</span><div style={{ position: 'relative' }}><i className="fa fa-map-marker input-icon" /><input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Ciudad" /></div></div></div>
          <div className={col6}><div className="input"><span>Destino</span><div style={{ position: 'relative' }}><i className="fa fa-map-marker input-icon" /><input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Ciudad" /></div></div></div>
          <div className={col6}><DatePicker label="Salida" value={depDate} onChange={setDepDate} placeholder="Fecha de salida" /></div>
          <div className={col6}><DatePicker label="Regreso" value={retDate} onChange={setRetDate} placeholder="Fecha de regreso" alignRight /></div>
          <div className={col6}><div className="input2"><span>Hora de Recogida</span><input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} /></div></div>
        </div>
        <button className="search-btn" type="submit"><i className="fa fa-search" /> Buscar Taxi</button>
      </form>
    </div>
  );
}
