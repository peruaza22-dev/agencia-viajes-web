'use client';

/**
 * StarRating — visualización de estrellas reutilizable
 *
 * Props:
 *   value: number  (0–5)
 *   max  : number  (default 5)
 *   size : 'sm' | 'md' | 'lg'
 */
const sizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

export default function StarRating({ value = 0, max = 5, size = 'md' }) {
  return (
    <span className={`inline-flex gap-0.5 ${sizes[size]}`} aria-label={`${value} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <i
          key={i}
          className={`fa ${i < Math.floor(value) ? 'fa-star text-yellow-400' : i < value ? 'fa-star-half-o text-yellow-400' : 'fa-star-o text-gray-300'}`}
        />
      ))}
    </span>
  )
}
