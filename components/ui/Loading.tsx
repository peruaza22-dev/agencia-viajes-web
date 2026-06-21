'use client';

/**
 * Loading - Componente de carga reutilizable
 * Muestra un spinner mientras carga algo
 */

interface LoadingProps {
  /** Texto opcional a mostrar */
  text?: string
  /** Tamaño del spinner: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg'
  /** Si es true, ocupa toda la pantalla */
  fullPage?: boolean
  /** Clases adicionales */
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export default function Loading({
  text = 'Cargando...',
  size = 'md',
  fullPage = false,
  className = '',
}: LoadingProps) {
  const spinner = (
    <div className={`loading-spinner ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} text-primary`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <span className="loading-text">{text}</span>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          {spinner}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3 p-4">
      {spinner}
    </div>
  )
}

/**
 * Skeleton - Esqueleto de carga para mostrar mientras cargan datos
 */
interface SkeletonProps {
  /** Ancho del skeleton */
  width?: string
  /** Altura del skeleton */
  height?: string
  /** Clases adicionales */
  className?: string
  /** Si es true, hace un círculo (para avatares) */
  circle?: boolean
}

export function Skeleton({ width = '100%', height = '20px', className = '', circle = false }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${circle ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ width, height }}
    />
  )
}

/**
 * PageLoader - Loader para páginas enteras
 */
export function PageLoader({ text = 'Cargando página...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loading text={text} size="lg" />
    </div>
  )
}
