'use client';

/** EmptyState — pantalla cuando no hay resultados */
import { Link } from 'react-router-dom'
export default function EmptyState({ icon='fa-search', title='Sin resultados', desc='Intenta con otros filtros o fechas', action, actionTo='/' }) {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className={`fa ${icon} text-4xl text-gray-300`}/>
      </div>
      <h3 className="text-xl font-bold font-poppins text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">{desc}</p>
      {action && <Link to={actionTo} className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition-colors">{action}</Link>}
    </div>
  )
}
