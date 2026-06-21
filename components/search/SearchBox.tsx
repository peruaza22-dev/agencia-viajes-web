'use client';

/**
 * SearchBox — Buscador con pestañas reutilizable
 * Usa clases .search-bg / .mtab / .mtab-item exactas del CSS
 */
import { useState } from 'react'
import FlightSearchForm  from './FlightSearchForm'
import HotelSearchForm   from './HotelSearchForm'
import HolidaySearchForm from './HolidaySearchForm'
import BusSearchForm     from './BusSearchForm'
import TaxiSearchForm    from './TaxiSearchForm'

const DEFAULT_TABS = [
  { id:'vuelos',     label:'Vuelos',     icon:'fa-plane'    },
  { id:'hoteles',    label:'Hoteles',    icon:'fa-bed'      },
  { id:'vacaciones', label:'Vacaciones', icon:'fa-briefcase'},
  { id:'autobus',    label:'Autobús',    icon:'fa-bus'      },
  { id:'taxi',       label:'Taxi',       icon:'fa-cab'      },
]

const FORM_MAP = {
  vuelos:     (cb) => <FlightSearchForm  onSearch={cb}/>,
  hoteles:    (cb) => <HotelSearchForm   onSearch={cb}/>,
  vacaciones: (cb) => <HolidaySearchForm onSearch={cb}/>,
  autobus:    (cb) => <BusSearchForm     onSearch={cb}/>,
  taxi:       (cb) => <TaxiSearchForm    onSearch={cb}/>,
}

export default function SearchBox({ tabs=DEFAULT_TABS, defaultTab='vuelos', onSearch }) {
  const [active, setActive] = useState(defaultTab)
  return (
    <div className="search-bg">
      <div className="mtab">
        {tabs.map(t => (
          <div key={t.id} className={`mtab-item${active === t.id ? ' active' : ''}`}
            onClick={() => setActive(t.id)}>
            <i className={`fa ${t.icon}`}/> {t.label}
          </div>
        ))}
      </div>
      {FORM_MAP[active]?.(data => onSearch?.(active, data))}
    </div>
  )
}
