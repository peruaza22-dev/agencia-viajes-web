'use client';

/**
 * Input — campo de formulario reutilizable
 *
 * Props:
 *   label      : string
 *   type       : string  (text, email, date, etc.)
 *   placeholder: string
 *   value      : string
 *   onChange   : function
 *   error      : string  (mensaje de error)
 *   icon       : string  (clase fa, ej: 'fa-user')
 *   required   : boolean
 *   disabled   : boolean
 *   className  : string
 */

import type { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  icon?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  error,
  icon,
  required = false,
  disabled = false,
  className = '',
  ...rest
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex items-center justify-center" style={{ width: 20, height: 20 }}>
            <i className={`fa ${icon}`} style={{ fontSize: 16 }} />
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={[
            'w-full border rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition',
            icon ? 'pl-10' : '',
            error ? 'border-red-400' : 'border-gray-200',
            disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700',
          ].join(' ')}
          style={{ fontSize: 15 }}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
