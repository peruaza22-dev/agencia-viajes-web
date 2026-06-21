'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/ui/DatePicker';
import CounterField from '@/components/ui/CounterField';
import { useSearch } from '@/context/SearchContext';

const CLASS_MAP: Record<string, string> = {
  'Todas': 'ECONOMY', 'Turista': 'ECONOMY',
  'Premium Eco.': 'PREMIUM_ECONOMY', 'Ejecutiva': 'BUSINESS', 'Primera Clase': 'FIRST',
};

interface Airport { iata_code: string; code?: string; name: string; city: string; country: string }

interface AirportFieldProps {
  label: string; name: string; placeholder: string; icon: string;
  value: string; onChange: (v: string) => void;
  onSearch?: (q: string) => Promise<Airport[]>;
}

export function AirportField({ label, name, placeholder, icon, value, onChange, onSearch }: AirportFieldProps) {
  const [sugs, setSugs] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (v.length >= 2 && onSearch) {
      const r = await onSearch(v);
      setSugs(r); setOpen(r.length > 0);
    } else { setOpen(false); }
  };

  const pick = (a: Airport) => {
    onChange(`${a.city} (${a.code || a.iata_code})`);
    setSugs([]); setOpen(false);
  };

  return (
    <div className="input" style={{ position: 'relative' }}>
      <span>{label}</span>
      <div style={{ position: 'relative' }}>
        <i className={`fa-solid ${icon} input-icon`} />
        <input type="text" name={name} value={value} onChange={handleInput} placeholder={placeholder} autoComplete="off" />
      </div>
      {open && sugs.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #003580', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,.12)', zIndex: 200, overflow: 'hidden' }}>
          {sugs.map((a) => (
            <button key={a.code || a.iata_code} type="button" onClick={() => pick(a)}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4fc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
              <i className="fa-solid fa-plane-departure" style={{ color: '#003580', width: 14 }} />
              <div>
                <div style={{ fontWeight: 600 }}>{a.city} ({a.code || a.iata_code})</div>
                <div style={{ fontSize: 11, color: '#999' }}>{a.name} · {a.country}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MultiLeg { id: number; from: string; to: string; date: Date | null }

export default function FlightSearchForm({ onSearch }: { onSearch?: () => void }) {
  const router = useRouter();
  const { searchAirports } = useSearch();
  const [subTab, setSubTab] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [depDate, setDepDate] = useState<Date | null>(null);
  const [retDate, setRetDate] = useState<Date | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabin, setCabin] = useState('Todas');
  const [airline, setAirline] = useState('');
  const [showOpts, setShowOpts] = useState(false);
  const [legs, setLegs] = useState<MultiLeg[]>([
    { id: 1, from: '', to: '', date: null },
    { id: 2, from: '', to: '', date: null },
  ]);

  const updateLeg = (id: number, field: keyof MultiLeg, value: string | Date | null) =>
    setLegs((ls) => ls.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const extractIATA = (val: string) =>
    val.match(/\(([A-Z]{3})\)/)?.[1] || val.trim().slice(-3).toUpperCase();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (subTab === 2) {
      const validLegs = legs.filter((l) => l.from && l.to && l.date);
      if (validLegs.length < 2) return;
      const params = new URLSearchParams({
        multi: JSON.stringify(validLegs.map((l) => ({ from: extractIATA(l.from), to: extractIATA(l.to), date: (l.date as Date).toISOString().split('T')[0] }))),
        adults: String(adults), children: String(children), infants: String(infants),
        cabinClass: CLASS_MAP[cabin] || 'ECONOMY',
      });
      router.push(`/vuelos?${params}`);
      onSearch?.(); return;
    }
    if (!from || !to || !depDate) return;
    const params = new URLSearchParams({
      from: extractIATA(from), to: extractIATA(to),
      departure: (depDate as Date).toISOString().split('T')[0],
      ...(retDate && subTab === 1 ? { return: retDate.toISOString().split('T')[0] } : {}),
      adults: String(adults), children: String(children), infants: String(infants),
      cabinClass: CLASS_MAP[cabin] || 'ECONOMY',
    });
    router.push(`/vuelos?${params}`);
    onSearch?.();
  };

  const col6 = 'w-1/2 px-1 sm:px-2';
  const SUBTABS = ['Ida', 'Ida y Vuelta', 'Multi Destino'];

  return (
    <div className="tab-bg">
      <h2>Reserva Vuelos Nacionales e Internacionales</h2>
      <div className="stab" style={{ zIndex: 5, position: 'relative' }}>
        {SUBTABS.map((t, i) => (
          <div key={t} className={`stab-item${subTab === i ? ' active' : ''}`}
            style={{ cursor: 'pointer', userSelect: 'none', display: 'inline-block' }}
            onClick={() => { setSubTab(i); if (i !== 1) setRetDate(null); }}>
            {t}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        {subTab !== 2 && (
          <div className="flex flex-wrap -mx-2">
            <div className={col6}><AirportField label="Desde" name="from" placeholder="Ciudad o Aeropuerto" icon="fa-plane-departure" value={from} onChange={setFrom} onSearch={searchAirports} /></div>
            <div className={col6}><AirportField label="Hasta" name="to" placeholder="Ciudad o Aeropuerto" icon="fa-plane-arrival" value={to} onChange={setTo} onSearch={searchAirports} /></div>
            <div className={col6}><DatePicker label="Salida" value={depDate} onChange={setDepDate} placeholder="Fecha de salida" /></div>
            <div className={col6}><DatePicker label="Regreso" value={retDate} onChange={setRetDate} placeholder="Fecha de regreso" disabled={subTab === 0} minDate={depDate || new Date()} alignRight /></div>
          </div>
        )}
        {subTab === 2 && (
          <div>
            {legs.map((leg, idx) => (
              <div key={leg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                <div style={{ minWidth: 22, paddingTop: 28, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#003580' }}>{idx + 1}</div>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 0, margin: '0 -4px' }}>
                  <div style={{ flex: '1 1 30%', minWidth: 120, padding: '0 4px' }}><AirportField label="Desde" name={`from-${leg.id}`} placeholder="Origen" icon="fa-plane-departure" value={leg.from} onChange={(v) => updateLeg(leg.id, 'from', v)} onSearch={searchAirports} /></div>
                  <div style={{ flex: '1 1 30%', minWidth: 120, padding: '0 4px' }}><AirportField label="Hasta" name={`to-${leg.id}`} placeholder="Destino" icon="fa-plane-arrival" value={leg.to} onChange={(v) => updateLeg(leg.id, 'to', v)} onSearch={searchAirports} /></div>
                  <div style={{ flex: '1 1 25%', minWidth: 120, padding: '0 4px' }}><DatePicker label="Salida" value={leg.date} onChange={(d) => updateLeg(leg.id, 'date', d)} placeholder="Fecha" minDate={idx > 0 && legs[idx - 1].date ? legs[idx - 1].date! : new Date()} /></div>
                </div>
                <button type="button" onClick={() => setLegs((ls) => ls.filter((l) => l.id !== leg.id))} disabled={legs.length <= 2}
                  style={{ marginTop: 26, background: 'none', border: 'none', cursor: legs.length <= 2 ? 'not-allowed' : 'pointer', color: legs.length <= 2 ? '#ccc' : '#e53e3e', fontSize: 16, flexShrink: 0 }}>
                  <i className="fa fa-times-circle" />
                </button>
              </div>
            ))}
            {legs.length < 6 && (
              <button type="button" className="addmore" onClick={() => setLegs((ls) => [...ls, { id: Date.now(), from: '', to: '', date: null }])} style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i className="fa fa-plus-circle" /> Añadir otro tramo
              </button>
            )}
          </div>
        )}
        <div className="flex flex-wrap -mx-1 sm:-mx-2">
          <div className="w-1/3 px-1 sm:px-2"><CounterField label="Adultos" value={adults} min={1} max={9} onChange={setAdults} /></div>
          <div className="w-1/3 px-1 sm:px-2"><CounterField label="Niños" value={children} min={0} max={8} onChange={setChildren} /></div>
          <div className="w-1/3 px-1 sm:px-2"><CounterField label="Bebés" value={infants} min={0} max={4} onChange={setInfants} /></div>
        </div>
        <div className="option" onClick={() => setShowOpts((o) => !o)} style={{ cursor: 'pointer', zIndex: 10, position: 'relative' }}>
          <b><i className={`fa fa-chevron-${showOpts ? 'up' : 'down'}`} /> Mostrar más opciones</b> ( Aerolínea, Clase)
        </div>
        {showOpts && (
          <div className="option-det">
            <div className="flex flex-wrap -mx-2">
              <div className={col6}><div className="input"><span>Aerolínea preferida</span><div style={{ position: 'relative' }}><i className="fa-solid fa-plane input-icon" /><input type="text" value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Ej: Iberia" /></div></div></div>
              <div className={col6}><div className="input2"><span>Clase</span><select value={cabin} onChange={(e) => setCabin(e.target.value)}>{['Todas', 'Turista', 'Ejecutiva', 'Primera Clase'].map((o) => <option key={o}>{o}</option>)}</select></div></div>
            </div>
          </div>
        )}
        <button className="search-btn" type="submit" style={{ zIndex: 10, position: 'relative' }}>
          <i className="fa fa-search" /> Buscar Vuelos
        </button>
      </form>
    </div>
  );
}
