'use client';

/**
 * AdminDatePicker — Selector de fecha para el panel admin
 * Popup con position:fixed para evitar ser cortado por overflow:hidden
 */
import { useState, useRef, useEffect } from 'react'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS_ES   = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']

const toMid = (d: Date) => { const r = new Date(d); r.setHours(0,0,0,0); return r }
const sameDayFn = (a: Date | null, b: Date | null) =>
  !!(a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate())
const fmtFn = (d: Date | null) => !d ? '' :
  `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`

interface Props {
  label?: string
  value: Date | null
  onChange: (d: Date | null) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  allowPast?: boolean
  disabled?: boolean
  defaultYear?: number
}

const YEARS_PER_PAGE = 20
const POPUP_W = 280

export default function AdminDatePicker({
  label, value, onChange,
  placeholder = 'dd/mm/aaaa',
  minDate, maxDate, allowPast = false,
  disabled = false, defaultYear,
}: Props) {
  const todayD  = toMid(new Date())
  const min     = minDate ? toMid(minDate) : (allowPast ? new Date('1900-01-01') : todayD)
  const max     = maxDate ? toMid(maxDate) : null
  const minYear = min.getFullYear()
  const maxYear = (max ?? new Date(todayD.getFullYear() + 5, 0, 1)).getFullYear()

  const [open,     setOpen]     = useState(false)
  const [year,     setYear]     = useState(value?.getFullYear() ?? defaultYear ?? todayD.getFullYear())
  const [month,    setMonth]    = useState(value?.getMonth() ?? todayD.getMonth())
  const [yearMode, setYearMode] = useState(false)
  const [yearPage, setYearPage] = useState(0)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })

  const triggerRef = useRef<HTMLDivElement>(null)
  const popupRef   = useRef<HTMLDivElement>(null)

  const calcPos = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow >= 320 || spaceBelow >= rect.top
      ? rect.bottom + 6
      : rect.top - 6 - 320
    setPopupPos({ top, left: Math.max(8, Math.min(rect.left, window.innerWidth - POPUP_W - 8)) })
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current && !triggerRef.current.contains(t) &&
          popupRef.current   && !popupRef.current.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const update = () => calcPos()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update) }
  }, [open])

  const allYears: number[] = []
  for (let y = minYear; y <= maxYear; y++) allYears.push(y)
  const totalPages = Math.ceil(allYears.length / YEARS_PER_PAGE)
  const pageYears  = allYears.slice(yearPage * YEARS_PER_PAGE, (yearPage + 1) * YEARS_PER_PAGE)

  const toggle = () => {
    if (disabled) return
    if (!open) {
      const oy = value?.getFullYear() ?? defaultYear ?? todayD.getFullYear()
      setYear(oy); setMonth(value?.getMonth() ?? todayD.getMonth())
      setYearMode(false)
      setYearPage(Math.max(0, Math.floor(allYears.indexOf(oy) / YEARS_PER_PAGE)))
      calcPos()
    }
    setOpen(o => !o)
  }

  const select = (day: Date) => {
    const d = toMid(day)
    if (d < min || (max && d > max)) return
    onChange(d); setOpen(false)
  }

  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(null) }

  const prevMonth = () => month === 0  ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)
  const nextMonth = () => month === 11 ? (setMonth(0),  setYear(y => y + 1)) : setMonth(m => m + 1)

  const startOffset = ((new Date(year, month, 1).getDay() + 6) % 7)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]

  const btn: React.CSSProperties = { border: 'none', background: 'none', cursor: 'pointer', outline: 'none', borderRadius: 6, transition: 'all 0.1s' }

  return (
    <div style={{ position: 'relative' }}>
      {label && <label className="adm-label">{label}</label>}

      <div ref={triggerRef} onClick={toggle} style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px',
        background: disabled ? '#f8fafc' : '#fff',
        border: `1.5px solid ${open ? 'var(--adm-primary)' : 'var(--adm-border)'}`,
        borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: open ? '0 0 0 3px rgba(0,53,128,0.1)' : 'none', transition: 'border-color 0.15s',
      }}>
        <i className="fa-solid fa-calendar" style={{ color: 'var(--adm-text-muted)', fontSize: 13, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, color: value ? 'var(--adm-text)' : 'var(--adm-text-muted)', userSelect: 'none' }}>
          {value ? fmtFn(value) : placeholder}
        </span>
        {value && !disabled && (
          <button type="button" onClick={clear} style={{ ...btn, color: '#94a3b8', fontSize: 12, padding: '2px 4px' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      {open && (
        <div ref={popupRef} style={{
          position: 'fixed', top: popupPos.top, left: popupPos.left, width: POPUP_W,
          zIndex: 99999, background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: '1px solid var(--adm-border)',
          padding: 14, animation: 'adm-cal-in 0.15s ease',
        }}>
          {yearMode ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <button type="button" onClick={() => setYearPage(p => Math.max(0, p - 1))} disabled={yearPage === 0}
                  style={{ ...btn, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--adm-border)', opacity: yearPage === 0 ? 0.3 : 1 }}>
                  <i className="fa-solid fa-chevron-left" style={{ fontSize: 11 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{pageYears[0]} — {pageYears[pageYears.length - 1]}</span>
                <button type="button" onClick={() => setYearPage(p => Math.min(totalPages - 1, p + 1))} disabled={yearPage >= totalPages - 1}
                  style={{ ...btn, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--adm-border)', opacity: yearPage >= totalPages - 1 ? 0.3 : 1 }}>
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: 11 }} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                {pageYears.map(y => (
                  <button key={y} type="button" onClick={() => { setYear(y); setYearMode(false) }}
                    style={{ ...btn, padding: '7px 4px', fontSize: 13, textAlign: 'center', fontWeight: y === year ? 700 : 400, background: y === year ? 'var(--adm-primary)' : y === todayD.getFullYear() ? '#f0f4ff' : '#fff', color: y === year ? '#fff' : y === todayD.getFullYear() ? 'var(--adm-primary)' : 'var(--adm-text)', border: `1px solid ${y === year ? 'var(--adm-primary)' : 'var(--adm-border)'}` }}>
                    {y}
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <button type="button" onClick={() => setYearMode(false)}
                  style={{ ...btn, fontSize: 12, color: 'var(--adm-text-muted)', padding: '4px 10px', border: '1px solid var(--adm-border)' }}>
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: 4 }} />Volver al mes
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <button type="button" onClick={prevMonth}
                  style={{ ...btn, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--adm-border)' }}>
                  <i className="fa-solid fa-chevron-left" style={{ fontSize: 11, color: 'var(--adm-text-muted)' }} />
                </button>
                <button type="button" onClick={() => { setYearPage(Math.max(0, Math.floor(allYears.indexOf(year) / YEARS_PER_PAGE))); setYearMode(true) }}
                  style={{ ...btn, padding: '4px 12px', fontWeight: 700, fontSize: 14, color: 'var(--adm-text)', border: '1px solid transparent' }}>
                  {MONTHS_ES[month]} {year}
                  <i className="fa-solid fa-caret-down" style={{ fontSize: 10, marginLeft: 5, color: 'var(--adm-text-muted)' }} />
                </button>
                <button type="button" onClick={nextMonth}
                  style={{ ...btn, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--adm-border)' }}>
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: 'var(--adm-text-muted)' }} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {DAYS_ES.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--adm-text-muted)', textTransform: 'uppercase', padding: '2px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={`e${i}`} />
                  const d = toMid(day)
                  const isDisabled = d < min || (!!max && d > max)
                  const isToday = sameDayFn(d, todayD)
                  const isSel   = sameDayFn(d, value)
                  const dow     = day.getDay()
                  const isWknd  = dow === 0 || dow === 6
                  let bg = 'transparent', color = 'var(--adm-text)', radius = '6px'
                  if (isDisabled)  color = '#cbd5e1'
                  else if (isSel)  { bg = 'var(--adm-primary)'; color = '#fff'; radius = '50%' }
                  else if (isWknd) { bg = dow === 6 ? '#e0f2fe' : '#fff1f2'; color = dow === 6 ? '#0369a1' : '#be123c' }
                  return (
                    <button key={i} type="button" disabled={isDisabled} onClick={() => !isDisabled && select(day)}
                      style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: radius, background: bg, color, border: `1px solid ${isSel ? 'var(--adm-primary)' : 'transparent'}`, fontWeight: isToday || isSel ? 700 : 400, fontSize: 12, cursor: isDisabled ? 'not-allowed' : 'pointer', outline: 'none', textDecoration: isToday && !isSel ? 'underline' : 'none', textDecorationColor: 'var(--adm-primary)', opacity: isDisabled ? 0.4 : 1, transition: 'all 0.1s', boxShadow: isSel ? '0 1px 6px rgba(0,53,128,0.25)' : 'none' }}>
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes adm-cal-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
