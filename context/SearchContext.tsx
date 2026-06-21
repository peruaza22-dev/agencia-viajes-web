'use client';

/**
 * SearchContext — Next.js version
 * Cambiado: VITE_API_URL → NEXT_PUBLIC_API_URL
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  FlightSearchState, HotelSearchState, BusSearchState,
  TaxiSearchState, HolidaySearchState, FlightOffer, HotelOffer,
  Airport, CabinClass,
} from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

const INITIAL_FLIGHT: FlightSearchState = { from: '', to: '', departure: null, returnDate: null, adults: 1, children: 0, infants: 0, cabinClass: 'ECONOMY', tripType: 'round' };
const INITIAL_HOTEL: HotelSearchState  = { destination: '', checkin: null, checkout: null, guests: 1, rooms: 1 };
const INITIAL_BUS: BusSearchState      = { from: '', to: '', date: null, adults: 1, children: 0 };
const INITIAL_TAXI: TaxiSearchState    = { from: '', to: '', depDate: null, retDate: null, pickupTime: '' };
const INITIAL_HOLIDAY: HolidaySearchState = { from: '', to: '', checkin: null, checkout: null, guests: 1, rooms: 1 };

interface SearchContextType {
  flightSearch: FlightSearchState;
  hotelSearch: HotelSearchState;
  busSearch: BusSearchState;
  taxiSearch: TaxiSearchState;
  holidaySearch: HolidaySearchState;
  flightResults: FlightOffer[];
  hotelResults: HotelOffer[];
  busResults: unknown[];
  taxiResults: unknown[];
  holidayResults: unknown[];
  loading: boolean;
  error: string | null;
  currentBooking: unknown;
  updateFlight: (p: Partial<FlightSearchState>) => void;
  updateHotel: (p: Partial<HotelSearchState>) => void;
  updateBus: (p: Partial<BusSearchState>) => void;
  updateTaxi: (p: Partial<TaxiSearchState>) => void;
  updateHoliday: (p: Partial<HolidaySearchState>) => void;
  setFlightResults: (r: FlightOffer[]) => void;
  setHotelResults: (r: HotelOffer[]) => void;
  setBusResults: (r: unknown[]) => void;
  setTaxiResults: (r: unknown[]) => void;
  setHolidayResults: (r: unknown[]) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  setCurrentBooking: (v: unknown) => void;
  searchFlights: (p: { from: string; to: string; departure: string; returnDate?: string; adults?: number; children?: number; infants?: number; cabinClass?: CabinClass }) => Promise<FlightOffer[]>;
  searchHotels: (p: { destination: string; checkin: string; checkout: string; guests: number; rooms: number }) => Promise<HotelOffer[]>;
  searchAirports: (query: string) => Promise<Airport[]>;
  resetAll: () => void;
  API: string;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [flightSearch, setFlightSearch] = useState<FlightSearchState>(INITIAL_FLIGHT);
  const [hotelSearch, setHotelSearch]   = useState<HotelSearchState>(INITIAL_HOTEL);
  const [busSearch, setBusSearch]       = useState<BusSearchState>(INITIAL_BUS);
  const [taxiSearch, setTaxiSearch]     = useState<TaxiSearchState>(INITIAL_TAXI);
  const [holidaySearch, setHolidaySearch] = useState<HolidaySearchState>(INITIAL_HOLIDAY);
  const [flightResults, setFlightResults] = useState<FlightOffer[]>([]);
  const [hotelResults, setHotelResults]   = useState<HotelOffer[]>([]);
  const [busResults, setBusResults]       = useState<unknown[]>([]);
  const [taxiResults, setTaxiResults]     = useState<unknown[]>([]);
  const [holidayResults, setHolidayResults] = useState<unknown[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [currentBooking, setCurrentBooking] = useState<unknown>(null);

  const searchFlights = useCallback(async (params: { from: string; to: string; departure: string; returnDate?: string; adults?: number; children?: number; infants?: number; cabinClass?: CabinClass }): Promise<FlightOffer[]> => {
    setLoading(true); setError(null); setFlightResults([]);
    try {
      const qs = new URLSearchParams({ from: params.from.toUpperCase(), to: params.to.toUpperCase(), departure: params.departure, ...(params.returnDate && { returnDate: params.returnDate }), adults: String(params.adults || 1), children: String(params.children || 0), infants: String(params.infants || 0), cabinClass: params.cabinClass || 'ECONOMY', maxResults: '20' });
      const r = await fetch(`${API}/flights/search?${qs}`);
      if (!r.ok) throw new Error((await r.json())?.message || 'Error buscando vuelos');
      const data = await r.json();
      const flights = Array.isArray(data.data) ? data.data : [];
      setFlightResults(flights); return flights;
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); return []; }
    finally { setLoading(false); }
  }, []);

  const searchAirports = useCallback(async (query: string): Promise<Airport[]> => {
    if (!query || query.length < 2) return [];
    try {
      const r = await fetch(`${API}/airports/autocomplete?q=${encodeURIComponent(query)}`);
      const data = await r.json();
      return data.data || [];
    } catch { return []; }
  }, []);

  const searchHotels = useCallback(async (params: { destination: string; checkin: string; checkout: string; guests: number; rooms: number }): Promise<HotelOffer[]> => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams(params as Record<string, string>);
      const r = await fetch(`${API}/hotels/search?${qs}`);
      const data = await r.json();
      const hotels = data.hotels || [];
      setHotelResults(hotels); return hotels;
    } catch (err) { setError(err instanceof Error ? err.message : 'Error'); return []; }
    finally { setLoading(false); }
  }, []);

  const updateFlight  = useCallback((p: Partial<FlightSearchState>) => setFlightSearch(prev => ({ ...prev, ...p })), []);
  const updateHotel   = useCallback((p: Partial<HotelSearchState>)  => setHotelSearch(prev => ({ ...prev, ...p })), []);
  const updateBus     = useCallback((p: Partial<BusSearchState>)    => setBusSearch(prev => ({ ...prev, ...p })), []);
  const updateTaxi    = useCallback((p: Partial<TaxiSearchState>)   => setTaxiSearch(prev => ({ ...prev, ...p })), []);
  const updateHoliday = useCallback((p: Partial<HolidaySearchState>) => setHolidaySearch(prev => ({ ...prev, ...p })), []);
  const resetAll = useCallback(() => { setFlightSearch(INITIAL_FLIGHT); setHotelSearch(INITIAL_HOTEL); setBusSearch(INITIAL_BUS); setTaxiSearch(INITIAL_TAXI); setHolidaySearch(INITIAL_HOLIDAY); setCurrentBooking(null); }, []);

  return (
    <SearchContext.Provider value={{ flightSearch, hotelSearch, busSearch, taxiSearch, holidaySearch, updateFlight, updateHotel, updateBus, updateTaxi, updateHoliday, flightResults, setFlightResults, hotelResults, setHotelResults, busResults, setBusResults, taxiResults, setTaxiResults, holidayResults, setHolidayResults, loading, setLoading, error, setError, currentBooking, setCurrentBooking, searchFlights, searchHotels, searchAirports, resetAll, API }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextType {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch debe usarse dentro de <SearchProvider>');
  return ctx;
}
