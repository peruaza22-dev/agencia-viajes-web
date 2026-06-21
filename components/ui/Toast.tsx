'use client';

/**
 * Toast — notificaciones emergentes
 * Uso: import { useToast } from '../ui/Toast'
 *      const { showToast } = useToast()
 *      showToast('Añadido a favoritos', 'success')
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react'
// lucide replaced

const ToastContext = createContext(null)

const ICONS = {
  success: <i className="fa fa-check-circle"/>,
  error:   <i className="fa fa-times-circle"/>,
  info:    <i className="fa fa-info-circle"/>,
  warning: <i className="fa fa-exclamation-triangle"/>,
}
const BG = {
  success:'border-l-4 border-green-500 bg-white',
  error:  'border-l-4 border-red-500 bg-white',
  info:   'border-l-4 border-blue-500 bg-white',
  warning:'border-l-4 border-yellow-500 bg-white',
}

function ToastItem({ id, message, type='info', onClose }) {
  useEffect(()=>{ const t=setTimeout(()=>onClose(id),4000); return()=>clearTimeout(t) },[id,onClose])
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl ${BG[type]} animate-slide-in min-w-[260px] max-w-sm`}>
      {ICONS[type]}
      <span className="text-sm text-gray-700 font-medium flex-1">{message}</span>
      <button onClick={()=>onClose(id)} className="text-gray-300 hover:text-gray-600 flex-shrink-0"><i className="fa fa-times"/></button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const showToast = useCallback((message, type='info') => {
    const id = Date.now()
    setToasts(t=>[...t,{id,message,type}])
  },[])
  const closeToast = useCallback((id)=>setToasts(t=>t.filter(x=>x.id!==id)),[])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 right-4 z-[99999] flex flex-col gap-2 lg:bottom-6">
        {toasts.map(t=><ToastItem key={t.id} {...t} onClose={closeToast}/>)}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
