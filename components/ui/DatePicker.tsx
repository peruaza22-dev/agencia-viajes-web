'use client';

'use client';

/**
 * DatePicker — Selector de fecha dinámico con navegación rápida por año
 */
import { useState, useRef, useEffect, type MouseEvent } from 'react';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES   = ['Lu','Ma','Mi','Ju','Vi','Sá','Do'];

function sameDay(a: Date | null, b: Date | null): boolean {
  return !!(a && b && a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

function toMidnight(d: Date): Date {
  const r = new Date(d); r.setHours(0,0,0,0); return r;
}

function fmtDate(d: Date | null): string {
  if (!d) return '';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  allowPast?: boolean;
  disabled?: boolean;
  alignRight?: boolean;
  className?: string;
  /** Año inicial al abrir el calendario (útil para fechas de nacimiento) */
  defaultYear?: number;
}

export default function DatePicker({
  label, value, onChange,
  placeholder = 'Seleccionar fecha',
  minDate, maxDate, allowPast = false, disabled = false,
  alignRight = false, className = '',
  defaultYear,
}: DatePickerProps) {
  const today  = toMidnight(new Date());
  const min    = minDate ? toMidnight(minDate) : (allowPast ? new Date('1900-01-01') : today);
  const max    = maxDate ? toMidnight(maxDate) : null;

  // Año de inicio: valor seleccionado > defaultYear > hoy
  const initYear  = value?.getFullYear() ?? defaultYear ?? today.getFullYear();
  const initMonth = value?.getMonth() ?? today.getMonth();

  const [open,      setOpen]      = useState(false);
  const [year,      setYear]      = useState(initYear);
  const [month,     setMonth]     = useState(initMonth);
  const [yearMode,  setYearMode]  = useState(false);   // true = grilla de años
  const [yearPage,  setYearPage]  = useState(0);       // página de 20 años
  const [popupRight, setPopupRight] = useState(false);
  const [popupUp,    setPopupUp]    = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Rango de años disponibles
  const minYear = min.getFullYear();
  const maxYear = (max ?? today).getFullYear();
  const YEARS_PER_PAGE = 20;

  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const firstDay    = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const prevMonth = () => month === 0  ? (setMonth(11), setYear(y => y-1)) : setMonth(m => m-1);
  const nextMonth = () => month === 11 ? (setMonth(0),  setYear(y => y+1)) : setMonth(m => m+1);

  const select = (day: Date | null) => {
    if (!day) return;
    const d = toMidnight(day);
    if (d < min) return;
    if (max && d > max) return;
    onChange(d); setOpen(false);
  };

  const toggle = () => {
    if (disabled) return;
    if (!open) {
      const openYear = value?.getFullYear() ?? defaultYear ?? today.getFullYear();
      setYear(openYear);
      setMonth(value?.getMonth() ?? today.getMonth());
      setYearMode(false);
      // Calcular página inicial para el año
      const totalYears = maxYear - minYear + 1;
      const totalPages = Math.ceil(totalYears / YEARS_PER_PAGE);
      // Página donde cae el año actual
      const yearsFromMin = openYear - minYear;
      const page = Math.floor(yearsFromMin / YEARS_PER_PAGE);
      setYearPage(Math.min(page, totalPages - 1));

      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const calH = 340;
        setPopupRight(rect.left + 280 > window.innerWidth - 8);
        setPopupUp(rect.bottom + calH > window.innerHeight - 8);
      }
    }
    setOpen(o => !o);
  };

  const clear = (e: MouseEvent) => { e.stopPropagation(); onChange(null); };

  // --- Grilla de años ---
  const allYears: number[] = [];
  for (let y = minYear; y <= maxYear; y++) allYears.push(y);
  const totalPages = Math.ceil(allYears.length / YEARS_PER_PAGE);
  const pageYears  = allYears.slice(yearPage * YEARS_PER_PAGE, (yearPage + 1) * YEARS_PER_PAGE);

  const selectYear = (y: number) => {
    setYear(y);
    setYearMode(false);
  };

  const openYearMode = () => {
    // Ir a la página donde está el año actual
    const idx  = allYears.indexOf(year);
    const page = Math.floor(idx / YEARS_PER_PAGE);
    setYearPage(Math.max(0, page));
    setYearMode(true);
  };

  return (
    <div className={`datepicker-wrapper ${className}`} ref={wrapperRef} style={{ position: 'relative' }}>
      <div className={`input${disabled ? ' opacity-50 cursor-not-allowed' : ''}`}
        onClick={toggle} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {label && <span>{label}</span>}
        <div style={{ position: 'relative' }}>
          <i className="fa fa-calendar input-icon" style={{ fontSize: 14 }}/>
          <input readOnly value={value ? fmtDate(value) : ''} placeholder={placeholder} disabled={disabled}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer', paddingRight: value ? '32px' : '12px' }}/>
          {value && (
            <button type="button" onClick={clear} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 13, padding: 0
            }}><i className="fa fa-times"/></button>
          )}
        </div>
      </div>

      {open && (
        <div className={`datepicker-popup${(alignRight || popupRight) ? ' align-right' : ''}`}
          style={{
            position: 'absolute',
            bottom: popupUp ? 'calc(100% + 4px)' : 'auto',
            top:    popupUp ? 'auto' : 'calc(100% + 4px)',
            left:  (alignRight || popupRight) ? 'auto' : 0,
            right: (alignRight || popupRight) ? 0 : 'auto',
            zIndex: 99999,
          }}>

          {/* ── MODO SELECTOR DE AÑO ── */}
          {yearMode ? (
            <>
              <div className="dp-header">
                <button type="button" className="dp-nav"
                  onClick={() => setYearPage(p => Math.max(0, p - 1))}
                  disabled={yearPage === 0}
                  style={{ opacity: yearPage === 0 ? 0.3 : 1 }}>
                  <i className="fa fa-chevron-left"/>
                </button>
                <span className="dp-title" style={{ cursor: 'default', fontSize: 13 }}>
                  {pageYears[0]} – {pageYears[pageYears.length - 1]}
                </span>
                <button type="button" className="dp-nav"
                  onClick={() => setYearPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={yearPage >= totalPages - 1}
                  style={{ opacity: yearPage >= totalPages - 1 ? 0.3 : 1 }}>
                  <i className="fa fa-chevron-right"/>
                </button>
              </div>
              <div className="dp-year-grid">
                {pageYears.map(y => (
                  <button key={y} type="button"
                    className={`dp-year-cell${y === year ? ' dp-year-cell--selected' : ''}`}
                    onClick={() => selectYear(y)}>
                    {y}
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center', padding: '6px 0 8px' }}>
                <button type="button" onClick={() => setYearMode(false)}
                  style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Volver al mes
                </button>
              </div>
            </>
          ) : (
            /* ── MODO CALENDARIO NORMAL ── */
            <>
              <div className="dp-header">
                <button type="button" className="dp-nav" onClick={prevMonth}><i className="fa fa-chevron-left"/></button>
                <span className="dp-title" onClick={openYearMode}
                  title="Clic para elegir año"
                  style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {MONTHS_ES[month]} {year} <i className="fa fa-caret-down" style={{ fontSize: 10, marginLeft: 2 }}/>
                </span>
                <button type="button" className="dp-nav" onClick={nextMonth}><i className="fa fa-chevron-right"/></button>
              </div>
              <div className="dp-weekdays">
                {DAYS_ES.map(d => <div key={d} className="dp-wd">{d}</div>)}
              </div>
              <div className="dp-grid">
                {cells.map((day, i) => {
                  if (!day) return <div key={`e${i}`} className="dp-day dp-day--empty"/>;
                  const d    = toMidnight(day);
                  const past = d < min;
                  const fut  = max ? d > max : false;
                  const disabled = past || fut;
                  const dow  = day.getDay();
                  let cls = 'dp-day';
                  if (disabled)          cls += ' dp-day--past';
                  if (sameDay(d, today)) cls += ' dp-day--today';
                  if (sameDay(d, value)) cls += ' dp-day--selected';
                  else if (dow === 6)    cls += ' dp-day--sat';
                  else if (dow === 0)    cls += ' dp-day--sun';
                  return (
                    <div key={d.toISOString()} className={cls} onClick={() => select(day)}>
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
