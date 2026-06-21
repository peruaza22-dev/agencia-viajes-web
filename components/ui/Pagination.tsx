'use client';

/**
 * Pagination — paginación reutilizable
 *
 * Props:
 *   current  : number  (página actual, empieza en 1)
 *   total    : number  (total de páginas)
 *   onChange : function(page)
 */
export default function Pagination({ current = 1, total = 1, onChange }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1)

  return (
    <nav className="flex justify-center gap-1 mt-8" aria-label="Paginación">
      <button
        disabled={current === 1}
        onClick={() => onChange?.(current - 1)}
        className="w-9 h-9 rounded text-sm border border-gray-200 text-gray-500 hover:bg-primary hover:text-white hover:border-primary transition-colors disabled:opacity-40"
      >
        «
      </button>

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange?.(p)}
          className={`w-9 h-9 rounded text-sm font-semibold transition-colors ${
            p === current
              ? 'bg-primary text-white border border-primary'
              : 'border border-gray-200 text-gray-600 hover:bg-primary hover:text-white hover:border-primary'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        disabled={current === total}
        onClick={() => onChange?.(current + 1)}
        className="w-9 h-9 rounded text-sm border border-gray-200 text-gray-500 hover:bg-primary hover:text-white hover:border-primary transition-colors disabled:opacity-40"
      >
        »
      </button>
    </nav>
  )
}
