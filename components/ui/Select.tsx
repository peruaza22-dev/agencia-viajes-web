'use client';

/**
 * Select — selector reutilizable
 *
 * Props:
 *   label    : string
 *   options  : Array<string | { value, label }>
 *   value    : string
 *   onChange : function
 *   error    : string
 *   disabled : boolean
 *   className: string
 */
export default function Select({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  error,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {label}
        </label>
      )}
      <select
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        className={[
          'w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition',
          error ? 'border-red-400' : 'border-gray-200',
          disabled ? 'opacity-50 cursor-not-allowed' : 'text-gray-700',
          'min-h-[40px] text-base md:text-sm', // Mejor touch en móvil
        ].join(' ')}
        style={{ padding: '10px 12px', fontSize: '16px' }} // Evita zoom en iOS
        {...rest}
      >
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value
          const lbl = typeof opt === 'string' ? opt : opt.label
          return <option key={val} value={val}>{lbl}</option>
        })}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
