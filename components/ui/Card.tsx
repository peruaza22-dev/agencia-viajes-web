'use client';

import { ReactNode } from 'react';

/**
 * Card — contenedor de tarjeta reutilizable
 *
 * Props:
 *   padding  : boolean  (añadir padding interno)
 *   hover    : boolean  (efecto hover shadow)
 *   className: string
 *   children : ReactNode
 */

export function CardHeader({ className = '', children }) {
  return <div className={`flex flex-col space-y-1.5 ${className}`}>{children}</div>;
}

export function CardTitle({ className = '', children }) {
  return <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

export function CardDescription({ className = '', children }) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}

export function CardContent({ className = '', children }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }) {
  return <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;
}

export default function Card({ padding = true, hover = true, className = '', children }) {
  return (
    <div
      className={[
        'bg-white border border-gray-200 rounded-xl',
        padding ? 'p-5' : '',
        hover ? 'hover:shadow-md transition-shadow' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
