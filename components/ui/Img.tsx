'use client';

/**
 * useImg — hook para manejar imágenes con fallback
 * Cuando una imagen no carga muestra un placeholder SVG inline.
 */
export function useImg() {
  const handleError = (e) => {
    e.target.onerror = null
    e.target.src = '/img/_placeholder.svg'
  }
  return { onError: handleError }
}

/**
 * Img — componente de imagen con fallback, borde y animación suave
 *
 * Props:
 *   src       : string
 *   alt       : string
 *   className : string  (clases extra de Tailwind)
 *   rounded   : 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'none'
 *   animate   : boolean  (hover scale, default true)
 *   border    : boolean  (borde sutil, default true)
 */
export default function Img({
  src,
  alt = '',
  className = '',
  rounded  = 'xl',
  animate  = true,
  border   = true,
}) {
  const { onError } = useImg()

  const roundedMap = {
    none: '', sm: 'rounded-sm', md: 'rounded-md',
    lg: 'rounded-lg', xl: 'rounded-xl', full: 'rounded-full',
  }

  return (
    <div
      className={[
        'overflow-hidden',
        roundedMap[rounded] ?? 'rounded-xl',
        border ? 'ring-1 ring-gray-200 ring-offset-0' : '',
        animate ? 'group' : '',
        className,
      ].join(' ')}
    >
      <img
        src={src}
        alt={alt}
        onError={onError}
        className={[
          'w-full h-full object-cover',
          animate ? 'transition-transform duration-500 ease-out group-hover:scale-105' : '',
        ].join(' ')}
      />
    </div>
  )
}
