'use client';

/**
 * AdminDateRangePicker
 * mode="single" → un clic selecciona el día y filtra inmediatamente
 * mode="range"  → selecciona desde/hasta (dos clics)
 */
import { useState, useRef, useEffect } from 'react'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DAYS_MIN = ['Lu','Ma','Mi','Ju','Vi','Sá','Do']

const todayFn = () => { const d = new Date(); d.setHours(0,0,0,0); return d }
const sameDayFn = (a: Date | null, b: Date | null) =>
  !!(a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate())
const isBeforeFn = (a: Date, b: Date) => a.getTime() < b.getTime() && !sameDayFn(a,b)
const inRangeFn = (d: Date, s: Date | null, e: Date | null) => {
  if (!s || !e) return false
  return d.getTime() > s.getTime() && d.getTime() < e.getTime()
}
const daysInMonthFn = (y: number, m: number) => new Date(y, m+1, 0).getDate()
const firstWeekdayFn = (y: number, m: number) => { const r = new Date(y,m,1).getDay(); return r===0 ? 6 : r-1 }
const fmtFn = (d: Date | null) => !d ? '' :
  `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`

interface Props {
  from: Date | null
  to: Date | null
  onChange: (from: Date | null, to: Date | null) => void
  placeholder?: string
  mode?: 'single' | 'range'
}

export default function AdminDateRangePicker({
  from, to, onChange,
  placeholder = 'Filtrar por fecha',
  mode = 'range',
}: Props) {
  const now = new Date()
  const [open, setOpen]           = useState(false)
  const [hovered, setHovered]     = useState<Date | null>(null)
  // En modo range: 'from' o 'to'. En modo single no se usa.
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')
  const [year, setYear]           = useState(now.getFullYear())
  const [month, setMonth]         = useState(now.getMonth())
  const [navMode, setNavMode]     = useState<'days' | 'months' | 'years'>('days')
  const [editingYear, setEditingYear] = useState(false)
  const [yearInput, setYearInput]     = useState(String(now.getFullYear()))
  const [decadeStart, setDecadeStart] = useState(Math.floor(now.getFullYear() / 12) * 12)

  const wrapRef      = useRef<HTMLDivElement>(null)
  const yearInputRef = useRef<HTMLInputElement>(null)
  const todayD       = todayFn()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setNavMode('days'); setEditingYear(false)
        // Reset selección parcial en modo range
        if (mode === 'range') setSelecting('from')
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler as any), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler as any) }
  }, [open, mode])

  useEffect(() => {
    if (editingYear) setTimeout(() => yearInputRef.current?.select(), 50)
  }, [editingYear])

  const prevNav = () => {
    if (navMode === 'days')  { month === 0 ? (setMonth(11), setYear(y => y-1)) : setMonth(m => m-1) }
    if (navMode === 'years') { setDecadeStart(d => d - 12) }
  }
  const nextNav = () => {
    if (navMode === 'days')  { month === 11 ? (setMonth(0), setYear(y => y+1)) : setMonth(m => m+1) }
    if (navMode === 'years') { setDecadeStart(d => d + 12) }
  }

  const handleDay = (day: Date) => {
    if (mode === 'single') {
      // Un clic = selecciona ese día completo (desde 00:00 hasta 23:59)
      onChange(day, day)
      setOpen(false)
      setNavMode('days')
      return
    }
    // Modo range
    if (selecting === 'from') {
      onChange(day, null)
      setSelecting('to')
    } else {
      if (from && isBeforeFn(day, from)) {
        onChange(day, null); setSelecting('to')
      } else {
        onChange(from, day)
        setSelecting('from')
        setOpen(false)
        setNavMode('days')
      }
    }
  }

  const confirmYear = () => {
    const y = parseInt(yearInput)
    if (!isNaN(y) && y >= 1900 && y <= 2100) { setYear(y); setDecadeStart(Math.floor(y/12)*12) }
    else setYearInput(String(year))
    setEditingYear(false); setNavMode('days')
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null, null)
    setSelecting('from')
  }

  // Label del trigger
  const hasValue = from || to
  const isSingleDay = from && to && sameDayFn(from, to)
  const label = mode === 'single'
    ? (from ? fmtFn(from) : placeholder)
    : (from && to
        ? isSingleDay ? fmtFn(from) : `${fmtFn(from)} — ${fmtFn(to)}`
        : from ? `Desde ${fmtFn(from)}` : placeholder)

  const totalDays = daysInMonthFn(year, month)
  const startAt   = firstWeekdayFn(year, month)
  const years     = Array.from({ length: 12 }, (_, i) => decadeStart + i)

  const btnBase: React.CSSProperties = {
    border: '1px solid var(--adm-border)', background: '#fff',
    cursor: 'pointer', borderRadius: 6, transition: 'all 0.1s', outline: 'none',
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>

      {/* ── Trigger ── */}
      <button type="button" onClick={() => { setOpen(o => !o); setNavMode('days') }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px',
          background: open || hasValue ? '#f0f4ff' : '#fff',
          border: `1.5px solid ${open || hasValue ? 'var(--adm-primary)' : 'var(--adm-border)'}`,
          borderRadius: 8, cursor: 'pointer', fontSize: 13,
          color: hasValue ? 'var(--adm-primary)' : 'var(--adm-text-muted)',
          fontWeight: hasValue ? 600 : 400, whiteSpace: 'nowrap',
          transition: 'all 0.15s', minWidth: 160,
        }}>
        <i className="fa-solid fa-calendar-days" style={{ fontSize: 13, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        {hasValue && (
          <span onClick={clear} style={{ marginLeft: 4, color: '#94a3b8', fontSize: 12, cursor: 'pointer' }} title="Limpiar">
            <i className="fa-solid fa-xmark" />
          </span>
        )}
      </button>

      {/* ── Popup ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9999,
          background: '#fff', borderRadius: 14, minWidth: 280,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid var(--adm-border)',
          padding: 16, animation: 'adm-cal-in 0.15s ease',
        }}>

          {/* Instrucción — solo en modo range */}
          {mode === 'range' && navMode === 'days' && (
            <div style={{
              background: selecting === 'from' ? '#f0f4ff' : '#f0fdf4',
              border: `1px solid ${selecting === 'from' ? '#c7d7f9' : '#bbf7d0'}`,
              borderRadius: 8, padding: '7px 12px', marginBottom: 12,
              fontSize: 12, fontWeight: 600,
              color: selecting === 'from' ? '#1d4ed8' : '#15803d',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <i className={`fa-solid ${selecting === 'from' ? 'fa-calendar-plus' : 'fa-calendar-check'}`} />
              {selecting === 'from' ? 'Selecciona la fecha de inicio' : 'Selecciona la fecha de fin'}
            </div>
          )}

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
            <button type="button" onClick={prevNav}
              style={{ ...btnBase, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-solid fa-chevron-left" style={{ fontSize: 11, color: 'var(--adm-text-muted)' }} />
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {navMode !== 'years' && (
                <button type="button" onClick={() => setNavMode(m => m === 'months' ? 'days' : 'months')}
                  style={{ ...btnBase, padding: '3px 8px', fontWeight: 700, fontSize: 14, color: 'var(--adm-text)', background: navMode === 'months' ? '#f0f4ff' : '#fff', borderColor: navMode === 'months' ? '#c7d7f9' : 'transparent' }}
                  title="Cambiar mes">
                  {MONTHS[month]}
                </button>
              )}
              {navMode !== 'months' && (
                editingYear ? (
                  <input ref={yearInputRef} type="number" value={yearInput}
                    onChange={e => setYearInput(e.target.value)}
                    onBlur={confirmYear}
                    onKeyDown={e => { if (e.key === 'Enter') confirmYear(); if (e.key === 'Escape') { setEditingYear(false); setYearInput(String(year)) } }}
                    style={{ width: 70, textAlign: 'center', fontWeight: 700, fontSize: 14, border: '2px solid var(--adm-primary)', borderRadius: 6, padding: '2px 6px', outline: 'none', color: 'var(--adm-primary)' }} />
                ) : (
                  <button type="button"
                    onClick={() => setNavMode(m => m === 'years' ? 'days' : 'years')}
                    onDoubleClick={() => { setEditingYear(true); setYearInput(String(year)); setNavMode('days') }}
                    style={{ ...btnBase, padding: '3px 8px', fontWeight: 400, fontSize: 14, color: 'var(--adm-text-muted)', background: navMode === 'years' ? '#f0f4ff' : '#fff', borderColor: navMode === 'years' ? '#c7d7f9' : 'transparent' }}
                    title="Clic: selector · Doble clic: escribir año">
                    {navMode === 'years' ? `${decadeStart} — ${decadeStart+11}` : year}
                  </button>
                )
              )}
            </div>

            <button type="button" onClick={nextNav}
              style={{ ...btnBase, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: 'var(--adm-text-muted)' }} />
            </button>
          </div>

          {/* ── Grid MESES ── */}
          {navMode === 'months' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {MONTHS_SHORT.map((m, i) => (
                <button key={m} type="button" onClick={() => { setMonth(i); setNavMode('days') }}
                  style={{ ...btnBase, padding: '8px 4px', fontSize: 13, fontWeight: i === month ? 700 : 400, background: i === month ? 'var(--adm-primary)' : '#fff', color: i === month ? '#fff' : 'var(--adm-text)', borderColor: i === month ? 'var(--adm-primary)' : 'var(--adm-border)' }}>
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* ── Grid AÑOS ── */}
          {navMode === 'years' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {years.map(y => (
                <button key={y} type="button" onClick={() => { setYear(y); setNavMode('days') }}
                  style={{ ...btnBase, padding: '8px 4px', fontSize: 13, fontWeight: y === year || y === now.getFullYear() ? 700 : 400, background: y === year ? 'var(--adm-primary)' : y === now.getFullYear() ? '#f0f4ff' : '#fff', color: y === year ? '#fff' : y === now.getFullYear() ? 'var(--adm-primary)' : 'var(--adm-text)', borderColor: y === year ? 'var(--adm-primary)' : 'var(--adm-border)' }}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* ── Grid DÍAS ── */}
          {navMode === 'days' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {DAYS_MIN.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--adm-text-muted)', padding: '2px 0', textTransform: 'uppercase' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {Array.from({ length: startAt }, (_, i) => <span key={`e${i}`} />)}
                {Array.from({ length: totalDays }, (_, i) => {
                  const day    = new Date(year, month, i+1)
                  const isT    = sameDayFn(day, todayD)
                  // En modo single: marcar el día seleccionado
                  const isSel  = mode === 'single'
                    ? sameDayFn(day, from)
                    : sameDayFn(day, from) || sameDayFn(day, to)
                  // Rango solo en modo range
                  const isInR  = mode === 'range' && inRangeFn(day, from, to || hovered)
                  const isHov  = mode === 'range' && !to && sameDayFn(day, hovered)
                  const isWknd = day.getDay() === 0 || day.getDay() === 6

                  let bg = 'transparent', color = 'var(--adm-text)', radius = '6px'
                  if (isSel)           { bg = 'var(--adm-primary)'; color = '#fff'; radius = '50%' }
                  else if (isInR || isHov) { bg = '#dbeafe'; color = '#1e40af' }
                  else if (isWknd)     { bg = day.getDay()===6 ? '#e0f2fe' : '#fff1f2'; color = day.getDay()===6 ? '#0369a1' : '#be123c' }

                  return (
                    <button key={i} type="button"
                      onClick={() => handleDay(day)}
                      onMouseEnter={() => mode === 'range' && setHovered(day)}
                      onMouseLeave={() => mode === 'range' && setHovered(null)}
                      style={{
                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: radius, background: bg, color,
                        border: `1px solid ${isSel ? 'var(--adm-primary)' : 'transparent'}`,
                        fontWeight: isT || isSel ? 700 : 400, fontSize: 12,
                        cursor: 'pointer', outline: 'none',
                        textDecoration: isT && !isSel ? 'underline' : 'none',
                        textDecorationColor: 'var(--adm-primary)',
                        transition: 'all 0.1s',
                        boxShadow: isSel ? '0 1px 6px rgba(0,53,128,0.25)' : 'none',
                      }}>
                      {i+1}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Resumen — solo en modo range con dos fechas distintas */}
          {mode === 'range' && from && to && !isSingleDay && navMode === 'days' && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--adm-border)', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--adm-text-muted)' }}>Desde:</span>
                <span style={{ fontWeight: 600, color: 'var(--adm-primary)' }}>{fmtFn(from)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ color: 'var(--adm-text-muted)' }}>Hasta:</span>
                <span style={{ fontWeight: 600, color: 'var(--adm-primary)' }}>{fmtFn(to)}</span>
              </div>
            </div>
          )}

          {/* Accesos rápidos */}
          {navMode === 'days' && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {(mode === 'single' ? [
                ['Hoy',   () => { const t = todayFn(); onChange(t, t); setOpen(false) }],
                ['Ayer',  () => { const t = todayFn(); const y = new Date(t); y.setDate(y.getDate()-1); onChange(y, y); setOpen(false) }],
              ] : [
                ['Hoy',          () => { const t = todayFn(); onChange(t, t); setOpen(false) }],
                ['Ayer',         () => { const t = todayFn(); const y = new Date(t); y.setDate(y.getDate()-1); onChange(y, y); setOpen(false) }],
                ['Últ. 7 días',  () => { const t = todayFn(); const s = new Date(t); s.setDate(s.getDate()-7); onChange(s, t); setOpen(false) }],
                ['Últ. 30 días', () => { const t = todayFn(); const s = new Date(t); s.setDate(s.getDate()-30); onChange(s, t); setOpen(false) }],
                ['Este mes',     () => { const t = todayFn(); onChange(new Date(t.getFullYear(), t.getMonth(), 1), t); setOpen(false) }],
                ['Este año',     () => { const t = todayFn(); onChange(new Date(t.getFullYear(), 0, 1), t); setOpen(false) }],
              ] as [string, () => void][]).map(([lbl, action]) => (
                <button key={lbl} type="button" onClick={action}
                  style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--adm-border)', background: '#fff', fontSize: 11, cursor: 'pointer', color: 'var(--adm-text-muted)', fontWeight: 500, transition: 'all 0.1s' }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background='#f0f4ff'; el.style.color='var(--adm-primary)'; el.style.borderColor='var(--adm-primary)' }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background='#fff'; el.style.color='var(--adm-text-muted)'; el.style.borderColor='var(--adm-border)' }}>
                  {lbl}
                </button>
              ))}
            </div>
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
