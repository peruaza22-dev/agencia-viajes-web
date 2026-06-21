'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FlightSearchForm from '@/components/search/FlightSearchForm';
import HotelSearchForm from '@/components/search/HotelSearchForm';
import HolidaySearchForm from '@/components/search/HolidaySearchForm';
import BusSearchForm from '@/components/search/BusSearchForm';
import TaxiSearchForm from '@/components/search/TaxiSearchForm';

const TABS = [
  { id: 'flights',  icon: 'fa-plane',     label: 'Vuelos',    to: '/vuelos'    },
  { id: 'hotels',   icon: 'fa-bed',       label: 'Hoteles',   to: '/hoteles'   },
  { id: 'holidays', icon: 'fa-briefcase', label: 'Vacaciones', to: '/vacaciones' },
  { id: 'bus',      icon: 'fa-bus',       label: 'Autobús',   to: '/autobuses' },
  { id: 'cab',      icon: 'fa-cab',       label: 'Taxi',      to: '/traslados' },
];

const FORM_MAP: Record<string, (cb?: (data: unknown) => void) => React.ReactNode> = {
  flights:     () => <FlightSearchForm />,
  hotels:      (cb) => <HotelSearchForm onSearch={cb} />,
  holidays:    (cb) => <HolidaySearchForm onSearch={cb} />,
  bus:         (cb) => <BusSearchForm onSearch={cb} />,
  cab:         (cb) => <TaxiSearchForm onSearch={cb} />,
};

const FORM_PATHS = ['/vuelos', '/hoteles', '/vacaciones', '/autobuses', '/traslados'];

export default function SearchBox() {
  const [activeTab, setActiveTab] = useState('flights');
  const pathname = usePathname() || '/';
  const isSearchPage = pathname === '/' || FORM_PATHS.includes(pathname);

  const onSearch = (tabId: string, data: unknown) => {
    console.log('Search submitted for', tabId, data);
  };

  return (
    <div className="search-bg">
      <div className="mtab">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.to}
            scroll={false}
            className={`mtab-item${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa ${tab.icon}`} />
            {tab.label}
          </Link>
        ))}
      </div>

      {isSearchPage && FORM_MAP[activeTab]?.(onSearch)}
    </div>
  );
}
