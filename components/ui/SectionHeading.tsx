'use client';

/**
 * SectionHeading — encabezado de sección reutilizable
 *
 * Props:
 *   title    : string
 *   subtitle : string
 *   center   : boolean  (alineación centrada, default true)
 *   className: string
 */
export default function SectionHeading({ title, subtitle, center = true, className = '' }) {
  return (
    <div className={`mb-10 ${center ? 'text-center' : ''} ${className}`}>
      <h3 className="text-2xl font-bold font-poppins text-gray-800 mb-2">{title}</h3>
      {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
    </div>
  )
}
