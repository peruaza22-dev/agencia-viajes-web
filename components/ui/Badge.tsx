'use client';

import { ReactNode } from 'react';

/**
 * Badge — etiqueta de estado reutilizable
 *
 * Props:
 *   variant  : 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'outline' | 'default' | 'destructive'
 *   icon     : string  (clase fa, ej: 'fa-check')
 *   className: string
 *   children : ReactNode
 */

const variants: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  red:    'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-700',
  gray:   'bg-gray-100 text-gray-500',
  outline: 'border border-gray-200 text-gray-700 bg-transparent',
  default: 'bg-blue-600 text-white',
  destructive: 'bg-red-600 text-white',
}

export function Badge({ variant = 'blue', icon, className = '', children }: {
  variant?: string;
  icon?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium ${variants[variant] || variants.blue} ${className}`}>
      {icon && <i className={`fa ${icon}`} />}
      {children}
    </span>
  )
}

export default Badge;
