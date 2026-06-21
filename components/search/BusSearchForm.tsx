'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/ui/DatePicker';
import CounterField from '@/components/ui/CounterField';

export default function BusSearchForm({ onSearch }: { onSearch?: (data: any) => void }) {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const col6 = 'w-1/2 px-1 sm:px-2';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch) { onSearch({ from, to, date }); return; }
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (date) params.append('date', date.toISOString().split('T')[0]);
    params.append('adults', String(adults));
    router.push(`/autobuses?${params}`);
  };

  return (
    <div className="tab-bg">
      <h2>Reserva Billetes de Autobús en Toda España</h2>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap -mx-1 sm:-mx-2">
          <div className={col6}><div className="input"><span>Desde</span><div style={{ position: 'relative' }}><i className="fa fa-bus input-icon" /><input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Ciudad o Estación" /></div></div></div>
          <div className={col6}><div className="input"><span>Hasta</span><div style={{ position: 'relative' }}><i className="fa fa-bus input-icon" /><input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Ciudad o Estación" /></div></div></div>
          <div className="w-full px-1 sm:px-2"><DatePicker label="Fecha de Viaje" value={date} onChange={setDate} placeholder="Seleccionar fecha" /></div>
        </div>
        <div className="flex flex-wrap -mx-1 sm:-mx-2">
          <div className="w-1/2 px-1 sm:px-2"><CounterField label="Adultos" value={adults} min={1} max={9} onChange={setAdults} /></div>
          <div className="w-1/2 px-1 sm:px-2"><CounterField label="Niños" value={children} min={0} max={8} onChange={setChildren} /></div>
        </div>
        <button className="search-btn" type="submit"><i className="fa fa-search" /> Buscar Autobús</button>
      </form>
    </div>
  );
}
