'use client';

/**
 * CounterInput — selector numérico +/- reutilizable
 * Útil para: pasajeros, habitaciones, personas, etc.
 *
 * Props:
 *   label       : string
 *   min         : number  (default 0)
 *   max         : number  (default 10)
 *   defaultValue: number  (default 0)
 *   onChange    : function(value)
 */
import { useState } from 'react'

export default function CounterInput({ label, min = 0, max = 10, defaultValue = 0, onChange }) {
  const [value, setValue] = useState(defaultValue)

  const update = (next) => {
    const clamped = Math.min(max, Math.max(min, next))
    setValue(clamped)
    onChange?.(clamped)
  }

  return (
    <div className="counter-input">
      {label && <label className="block text-xs text-gray-500 uppercase mb-1">{label}</label>}
      <div className="counter-controls">
        <button type="button" onClick={() => update(value - 1)} aria-label="Reducir">
          <i className="fa fa-minus" />
        </button>
        <span aria-live="polite">{value}</span>
        <button type="button" onClick={() => update(value + 1)} aria-label="Aumentar">
          <i className="fa fa-plus" />
        </button>
      </div>
    </div>
  )
}
