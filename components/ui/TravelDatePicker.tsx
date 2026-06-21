'use client';

/**
 * TravelDatePicker v4
 * Popup con position:absolute — aparece debajo del campo, se mueve con el scroll
 */
import { useState, useRef, useEffect, useCallback, type MouseEvent, type KeyboardEvent } from 'react'
import { getDateInfo } from '@/data/specialDates';

type DatePickerMode = 'single' | 'range'

interface TravelDatePickerProps {
  label?: string
  labelEnd?: string
  value: Date | null
  valueEnd?: Date | null
  onChange?: (date: Date | null) => void
  onChangeEnd?: (date: Date | null) => void
  mode?: DatePickerMode
  minDate?: Date
  disabledEnd?: boolean
  placeholder?: string
  placeholderEnd?: string
  className?: string
}

const MONTHS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_MIN = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']

const today = (): Date => { const d = new Date(); d.setHours(0,0,0,0); return d }

const sameDay = (a: Date | null, b: Date | null): boolean =>
  !!(a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate())

const isBefore = (a: Date, b: Date): boolean => a.getTime() < b.getTime() && !sameDay(a,b)

const inRange = (d: Date, s: Date | null, e: Date | null): boolean => {
  if (!s || !e) return false
  const t = d.getTime()
  const a = new Date(s); a.setHours(0,0,0,0)
  const b = new Date(e); b.setHours(0,0,0,0)
  return t > a.getTime() && t < b.getTime()
}

const fmtDate = (d: Date | null): string => !d ? '' :
  `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`

const daysInMonthFn  = (y: number, m: number) => new Date(y, m+1, 0).getDate()
const firstWeekday = (y: number, m: number) => { const r = new Date(y,m,1).getDay(); return r===0 ? 6 : r-1 }

const TYPE_STYLE: Record<string, { cell: string; text: string; border: string; dot: string }> = {
  offer:      { cell: '#dcfce7', text: '#166534', border: '#86efac', dot: '#16a34a' },
  holiday:    { cell: '#fee2e2', text: '#991b1b', border: '#fca5a5', dot: '#dc2626' },
  highSeason: { cell: '#ede9fe', text: '#4c1d95', border: '#c4b5fd', dot: '#7c3aed' },
  event:      { cell: '#fef9c3', text: '#713f12', border: '#fde047', dot: '#ca8a04' },
}

// ── Calendario ──────────────────────────────────────────────────────────────
interface CalendarProps {
  open: boolean
  onClose: () => void
  year: number; month: number
  onPrevMonth: () => void; onNextMonth: () => void
  selected: Date | null; selectedEnd: Date | null
  hoveredDay: Date | null
  onDayClick: (day: Date) => void
  onDayHover: (day: Date | null) => void
  mode: DatePickerMode; minDateVal: Date
  alignRight?: boolean
  alignUp?: boolean
}

function CalendarPopup({ open, onClose, year, month, onPrevMonth, onNextMonth,
  selected, selectedEnd, hoveredDay, onDayClick, onDayHover, mode, minDateVal, alignRight, alignUp }: CalendarProps) {

  const ref       = useRef<HTMLDivElement>(null)
  const todayDate = today()
  const totalDays = daysInMonthFn(year, month)
  const startAt   = firstWeekday(year, month)

  // Cerrar al clicar fuera — el ref engloba el popup, el campo está en el wrapper padre
  useEffect(() => {
    if (!open) return
    const handler = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    // Usar setTimeout para que el mousedown que abrió el popup no lo cierre inmediatamente
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [open, onClose])

  if (!open) return null

  return (
    <div ref={ref} className="dp4-popup dp4-anim-down"
      style={{
        position: 'absolute',
        bottom: alignUp ? 'calc(100% + 4px)' : 'auto',
        top:    alignUp ? 'auto' : 'calc(100% + 4px)',
        left:  alignRight ? 'auto' : 0,
        right: alignRight ? 0 : 'auto',
        zIndex: 99999,
      }}>

      <div className="dp4-header">
        <button type="button" className="dp4-nav" onClick={onPrevMonth}><i className="fa fa-chevron-left"/></button>
        <span className="dp4-month-title">{MONTHS[month]} <span className="dp4-year">{year}</span></span>
        <button type="button" className="dp4-nav" onClick={onNextMonth}><i className="fa fa-chevron-right"/></button>
      </div>

      <div className="dp4-weekdays">
        {DAYS_MIN.map(d => <span key={d} className="dp4-wd">{d}</span>)}
      </div>

      <div className="dp4-grid">
        {Array.from({ length: startAt }, (_, i) => <span key={`e${i}`}/>)}
        {Array.from({ length: totalDays }, (_, i) => {
          const day    = new Date(year, month, i+1)
          const sp     = getDateInfo(day)
          const isT    = sameDay(day, todayDate)
          const isSel  = sameDay(day, selected)
          const isEnd  = sameDay(day, selectedEnd)
          const isInR  = mode === 'range' && inRange(day, selected, selectedEnd || hoveredDay)
          const isHov  = mode === 'range' && !selectedEnd && sameDay(day, hoveredDay)
          const isPast = isBefore(day, minDateVal)
          const isWknd = day.getDay() === 0 || day.getDay() === 6
          const isActive = isSel || isEnd

          let bg = 'transparent', color = '#1e293b', border = 'transparent'
          if (isPast)              { color = '#cbd5e1' }
          else if (isActive)       { bg = '#003580'; color = '#fff' }
          else if (isInR || isHov) { bg = '#dbeafe'; color = '#1e40af' }
          else if (sp)             { const s = TYPE_STYLE[sp.type]; bg = s.cell; color = s.text; border = s.border }
          else if (isWknd)         { bg = day.getDay()===6 ? '#e0f2fe' : '#fee2e2'; color = day.getDay()===6 ? '#0369a1' : '#b91c1c' }

          const dotColor = sp && !isActive && !isPast ? TYPE_STYLE[sp.type].dot : null

          return (
            <div key={i} style={{ position: 'relative' }}>
              <button type="button" disabled={isPast}
                onClick={() => !isPast && onDayClick(day)}
                onMouseEnter={() => !isPast && onDayHover(day)}
                onMouseLeave={() => onDayHover(null)}
                className={!isPast && !isActive ? 'dp4-day-hover' : ''}
                style={{
                  width: '100%', aspectRatio: '1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: isActive ? '50%' : '4px',
                  background: bg, color, border: `1px solid ${isActive ? '#003580' : border}`,
                  fontWeight: isT || isActive ? '700' : '400',
                  fontSize: '12px', cursor: isPast ? 'not-allowed' : 'pointer',
                  transition: 'all 0.1s', outline: 'none', position: 'relative',
                  boxShadow: isActive ? '0 1px 6px rgba(0,53,128,0.3)' : 'none',
                  textDecoration: isT && !isActive ? 'underline' : 'none',
                  textDecorationColor: '#003580',
                }}>
                {i+1}
                {dotColor && <span style={{
                  position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)',
                  width: '3px', height: '3px', borderRadius: '50%', background: dotColor, pointerEvents: 'none',
                }}/>}
                {sp?.type === 'offer' && !isActive && !isPast && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-4px',
                    background: '#16a34a', color: '#fff', fontSize: '7px', fontWeight: '900',
                    padding: '1px 3px', borderRadius: '4px', lineHeight: '1.4', pointerEvents: 'none',
                  }}>{sp.discount}</span>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="dp4-legend">
        {[
          { color: '#dcfce7', border: '#86efac', label: 'Oferta'  },
          { color: '#fee2e2', border: '#fca5a5', label: 'Festivo' },
          { color: '#ede9fe', border: '#c4b5fd', label: 'T. Alta' },
          { color: '#fef9c3', border: '#fde047', label: 'Evento'  },
        ].map(l => (
          <span key={l.label} className="dp4-legend-item">
            <span style={{ width:10, height:10, borderRadius:3, flexShrink:0,
              background:l.color, border:`1.5px solid ${l.border}`, display:'inline-block' }}/>
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Campo input ─────────────────────────────────────────────────────────────
interface DateFieldProps {
  label: string; placeholder: string; value: Date | null
  active: boolean; disabled: boolean
  onOpen: () => void; onClear: () => void
}

function DateField({ label, placeholder, value, active, disabled, onOpen, onClear }: DateFieldProps) {
  const sp = value ? getDateInfo(value) : null
  const ts = sp ? TYPE_STYLE[sp.type] : null
  return (
    <div className={`dp4-field${active ? ' dp4-field--active' : ''}${disabled ? ' dp4-field--disabled' : ''}`}
      onClick={() => !disabled && onOpen()} role="button" tabIndex={disabled ? -1 : 0}
      onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && !disabled && onOpen()}>
      <i className="fa fa-calendar dp4-field-icon" style={{ flexShrink:0, fontSize:13 }}/>
      <div className="dp4-field-inner">
        <span className="dp4-field-label">{label}</span>
        {value
          ? <span className="dp4-field-date">{fmtDate(value)}</span>
          : <span className="dp4-field-placeholder">{disabled ? '—' : placeholder}</span>}
      </div>
      {sp && ts && (
        <span className="dp4-field-badge" style={{ background: ts.cell, color: ts.text, border: `1px solid ${ts.border}` }}>
          <i className={`fa ${sp.icon}`} style={{ fontSize:8, marginRight:2 }}/>{sp.discount || sp.type}
        </span>
      )}
      {value && (
        <button type="button" className="dp4-clear"
          onClick={(e: MouseEvent) => { e.stopPropagation(); onClear() }} aria-label="Limpiar fecha">
          <i className="fa fa-times"/>
        </button>
      )}
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────
export default function TravelDatePicker({
  label='Fecha', labelEnd='Regreso',
  value=null, valueEnd=null,
  onChange, onChangeEnd,
  mode='single', minDate, disabledEnd=false,
  placeholder='Seleccionar fecha', placeholderEnd='Seleccionar fecha',
  className='',
}: TravelDatePickerProps) {
  const effectMin = minDate || today()
  const now       = new Date()

  const [openStart, setOpenStart] = useState(false)
  const [yearS, setYearS]         = useState(now.getFullYear())
  const [monthS, setMonthS]       = useState(now.getMonth())
  const [startRight, setStartRight] = useState(false)
  const [startUp,    setStartUp]    = useState(false)

  const [openEnd, setOpenEnd] = useState(false)
  const [yearE, setYearE]     = useState(now.getFullYear())
  const [monthE, setMonthE]   = useState(now.getMonth())
  const [endRight, setEndRight] = useState(false)
  const [endUp,    setEndUp]    = useState(false)

  const [hovered, setHovered] = useState<Date | null>(null)

  const wrapperSRef = useRef<HTMLDivElement>(null)
  const wrapperERef = useRef<HTMLDivElement>(null)

  const checkRight = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return false
    const rect = ref.current.getBoundingClientRect()
    return rect.left + 280 > window.innerWidth - 8
  }

  const checkUp = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return false
    const rect = ref.current.getBoundingClientRect()
    return rect.bottom + 340 > window.innerHeight - 8
  }

  const prevMonthS = () => monthS===0  ? (setMonthS(11), setYearS(y=>y-1)) : setMonthS(m=>m-1)
  const nextMonthS = () => monthS===11 ? (setMonthS(0),  setYearS(y=>y+1)) : setMonthS(m=>m+1)
  const prevMonthE = () => monthE===0  ? (setMonthE(11), setYearE(y=>y-1)) : setMonthE(m=>m-1)
  const nextMonthE = () => monthE===11 ? (setMonthE(0),  setYearE(y=>y+1)) : setMonthE(m=>m+1)

  const handleClickStart = useCallback((day: Date) => {
    onChange?.(day); onChangeEnd?.(null); setOpenStart(false)
    if (mode==='range' && !disabledEnd) {
      setYearE(yearS); setMonthE(monthS)
      setTimeout(() => setOpenEnd(true), 80)
    }
  }, [onChange, onChangeEnd, mode, disabledEnd, yearS, monthS])

  const handleClickEnd = useCallback((day: Date) => {
    if (value && isBefore(day, value)) { onChange?.(day); onChangeEnd?.(null) }
    else { onChangeEnd?.(day); setOpenEnd(false) }
  }, [value, onChange, onChangeEnd])

  const handleOpenEnd = () => {
    if (value) { setYearE(value.getFullYear()); setMonthE(value.getMonth()) }
    setOpenEnd(true); setOpenStart(false)
  }

  const isRange = mode === 'range'

  return (
    <div className={`dp4-wrapper ${className}`}>
      <div className={`dp4-fields${isRange ? ' dp4-fields--range' : ''}`}>

        {/* Campo IDA */}
        <div ref={wrapperSRef} style={{ position: 'relative', flex: isRange ? 1 : undefined }}>
          <DateField label={label} placeholder={placeholder} value={value}
            active={openStart} disabled={false}
            onOpen={() => {
              setStartRight(checkRight(wrapperSRef))
              setStartUp(checkUp(wrapperSRef))
              setOpenStart(o => !o); setOpenEnd(false)
            }}
            onClear={() => { onChange?.(null); onChangeEnd?.(null) }}/>
          <CalendarPopup
            open={openStart} onClose={() => setOpenStart(false)}
            year={yearS} month={monthS} onPrevMonth={prevMonthS} onNextMonth={nextMonthS}
            selected={value} selectedEnd={valueEnd ?? null} hoveredDay={hovered}
            onDayClick={handleClickStart} onDayHover={setHovered}
            mode={mode} minDateVal={effectMin} alignRight={startRight} alignUp={startUp}/>
        </div>

        {/* Campo REGRESO */}
        {isRange && (
          <div ref={wrapperERef} style={{ position: 'relative', flex: 1 }}>
            <DateField label={labelEnd} placeholder={placeholderEnd} value={valueEnd ?? null}
              active={openEnd} disabled={disabledEnd || !value}
              onOpen={() => {
                setEndRight(checkRight(wrapperERef))
                setEndUp(checkUp(wrapperERef))
                handleOpenEnd()
              }}
              onClear={() => onChangeEnd?.(null)}/>
            <CalendarPopup
              open={openEnd} onClose={() => setOpenEnd(false)}
              year={yearE} month={monthE} onPrevMonth={prevMonthE} onNextMonth={nextMonthE}
              selected={value} selectedEnd={valueEnd ?? null} hoveredDay={hovered}
              onDayClick={handleClickEnd} onDayHover={setHovered}
              mode={mode} minDateVal={value || effectMin} alignRight={endRight} alignUp={endUp}/>
          </div>
        )}
      </div>
    </div>
  )
}
