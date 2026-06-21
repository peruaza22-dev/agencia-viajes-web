'use client';

/**
 * CounterField — Réplica exacta de .input1 del HTML original
 * Botones - / + alrededor de un input numérico centrado
 */

interface CounterFieldProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export default function CounterField({ 
  label, 
  value, 
  min = 0, 
  max = 9, 
  onChange 
}: CounterFieldProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  
  return (
    <div className="input1">
      {label && <span>{label}</span>}
      <div style={{ position: 'relative' }}>
        <input type="text" readOnly value={value} />
        <div className="inc">
          <a onClick={dec}><i className="fa fa-minus"/></a>
          <a onClick={inc}><i className="fa fa-plus"/></a>
        </div>
      </div>
    </div>
  );
}
