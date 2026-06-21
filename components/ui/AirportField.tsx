'use client';

/**
 * AirportField - Componente de autocompletado de aeropuertos
 * Separado para poder usarlo en cualquier página
 */
import { useState, type ReactNode } from 'react';

export interface Airport {
  code?: string;
  iata_code?: string;
  name: string;
  city: string;
  country: string;
}

interface AirportFieldProps {
  label: string;
  name: string;
  placeholder: string;
  icon?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => Promise<Airport[]>;
}

export function AirportField({ label, name, placeholder, icon, value, onChange, onSearch }: AirportFieldProps) {
  const [sugs, setSugs] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  
  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (v.length >= 2 && onSearch) {
      try {
        const r = await onSearch(v);
        setSugs(r);
        setOpen(r.length > 0);
      } catch (err) {
        console.error('Error searching airports:', err);
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  };
  
  const pick = (a: Airport) => {
    const code = a.code || a.iata_code || '';
    onChange(`${a.city} (${code})`);
    setSugs([]);
    setOpen(false);
  };
  
  const iconClass = icon || 'fa-plane-departure';
  
  return (
    <div className="input" style={{ position: 'relative' }}>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden text-xs">{label}</span>
      <div style={{ position: 'relative' }}>
        {icon && <i className={`fa-solid ${iconClass} input-icon`}/>}
        <input 
          type="text" 
          name={name} 
          value={value} 
          onChange={handleInput} 
          placeholder={placeholder} 
          autoComplete="off"
          style={{ fontSize: '16px' }}
        />
      </div>
      {open && sugs.length > 0 && (
        <div style={{
          position:'absolute',
          top:'100%',
          left:0,
          right:0,
          background:'#fff',
          border:'1px solid #003580',
          borderRadius:4,
          boxShadow:'0 4px 12px rgba(0,0,0,.12)',
          zIndex:200,
          overflow:'hidden',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {sugs.map(a => {
            const code = a.code || a.iata_code || '';
            return (
              <button 
                key={code} 
                type='button' 
                onClick={() => pick(a)}
                style={{
                  width:'100%',
                  textAlign:'left',
                  padding:'10px 12px',
                  display:'flex',
                  alignItems:'center',
                  gap:10,
                  background:'none',
                  border:'none',
                  cursor:'pointer',
                  fontSize:13,
                  borderBottom: '1px solid #f0f0f0'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f9ff')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <i className="fa-solid fa-plane-departure" style={{ color:'#003580', width:16, flexShrink:0 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight:600 }}>{a.city} ({code})</div>
                  <div style={{ fontSize:11, color:'#888' }}>{a.name} · {a.country}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AirportField;
