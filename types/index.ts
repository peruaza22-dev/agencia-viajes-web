/**
 * ============================================
 * Tipos globales para la aplicación
 * Travel Agency - TypeScript
 * ============================================
 */

// ============================================
// Tipos de Usuario y Autenticación
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'user' | 'admin' | 'manager' | 'agent' | 'editor' | 'viewer';
  avatar?: string;
  createdAt?: string;
  access_token?: string;
  token?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
  session?: {
    access_token: string;
  };
  access_token?: string;
}

// ============================================
// Tipos de Aeropuerto
// ============================================

export interface Airport {
  iata_code: string;
  code?: string;
  name: string;
  city: string;
  country: string;
  timezone?: string;
}

export interface AirportAutocompleteResponse {
  airports: Airport[];
}

// ============================================
// Tipos de Vuelo
// ============================================

export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
export type TripType = 'one-way' | 'round';

export interface FlightSearchParams {
  from: string;
  to: string;
  departure: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass: CabinClass;
  tripType: TripType;
  maxResults?: number;
}

export interface FlightSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  duration: string;
  numberOfStops: number;
}

export interface FlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  itineraries: {
    duration: string;
    segments: FlightSegment[];
  }[];
  price: {
    currency: string;
    total: string;
    base: string;
    fees?: {
      amount: string;
      type: string;
    }[];
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: {
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
    };
    fareDetailsBySegment: {
      seatAssigned: boolean;
      cabin: CabinClass;
      fareBasis: string;
      class: string;
    }[];
  }[];
}

export interface FlightSearchResponse {
  flights: FlightOffer[];
  totalResults?: number;
}

export interface Traveler {
  id: string;
  dateOfBirth: string;
  name: {
    firstName: string;
    lastName: string;
  };
  gender: 'M' | 'F';
  contact: {
    emailAddress: string;
    phones: {
      deviceType: string;
      countryCallingCode: string;
      number: string;
    }[];
  };
  documents?: {
    documentType: string;
    number: string;
    expiryDate: string;
    issuanceCountry: string;
    nationality: string;
    holder: boolean;
  }[];
}

export interface FlightContact {
  email: string;
  phone: string;
}

// ============================================
// Tipos de Hotel
// ============================================

export interface HotelSearchParams {
  destination: string;
  checkin: string;
  checkout: string;
  guests: number;
  rooms: number;
}

export interface HotelOffer {
  hotelId: string;
  name: string;
  chainCode?: string;
  rating?: number;
  description: string;
  amenities?: string[];
  address?: {
    lines?: string[];
    cityName?: string;
    countryCode?: string;
    postalCode?: string;
  };
  geoCode?: {
    latitude: number;
    longitude: number;
  };
  images?: {
    url: string;
  }[];
  price?: {
    currency: string;
    total: string;
    base: string;
  };
}

export interface HotelRoom {
  id: string;
  name: string;
  description?: string;
  guests: {
    adults: number;
    childAges?: number[];
  };
  beds?: {
    type: string;
    count: number;
  };
  price?: {
    currency: string;
    total: string;
    base: string;
  };
  amenities?: string[];
  cancellationPolicies?: {
    amount?: string;
    currency?: string;
    deadline?: string;
  }[];
}

export interface HotelDetail extends HotelOffer {
  rooms?: HotelRoom[];
  contact?: {
    phone?: string;
    email?: string;
  };
}

export interface HotelSearchResponse {
  hotels: HotelOffer[];
  totalResults?: number;
}

// ============================================
// Tipos de Reserva
// ============================================

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';

export interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'bus' | 'taxi' | 'holiday';
  status: BookingStatus;
  userId: string;
  details: FlightBookingDetails | HotelBookingDetails | BusBookingDetails | TaxiBookingDetails | HolidayBookingDetails;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  createdAt: string;
  updatedAt?: string;
}

export interface FlightBookingDetails {
  flightOffer: FlightOffer;
  travelers: Traveler[];
  contact: FlightContact;
  orderId?: string;
  confirmationCode?: string;
}

export interface HotelBookingDetails {
  hotelOffer: HotelOffer;
  room: HotelRoom;
  guests: {
    name: string;
    lastName: string;
  }[];
  checkin: string;
  checkout: string;
  confirmationCode?: string;
}

export interface BusBookingDetails {
  from: string;
  to: string;
  date: string;
  passengers: {
    name: string;
    lastName: string;
    type: 'adult' | 'child';
  }[];
  seatNumber?: string;
  confirmationCode?: string;
}

export interface TaxiBookingDetails {
  from: string;
  to: string;
  date: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  vehicleType: string;
  confirmationCode?: string;
}

export interface HolidayBookingDetails {
  destination: string;
  hotel: HotelOffer;
  checkin: string;
  checkout: string;
  guests: number;
  rooms: number;
  packageType: string;
  confirmationCode?: string;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// Tipos de Búsqueda (SearchContext)
// ============================================

export interface FlightSearchState {
  from: string;
  to: string;
  departure: Date | null;
  returnDate: Date | null;
  adults: number;
  children: number;
  infants: number;
  cabinClass: CabinClass;
  tripType: TripType;
}

export interface HotelSearchState {
  destination: string;
  checkin: Date | null;
  checkout: Date | null;
  guests: number;
  rooms: number;
}

export interface BusSearchState {
  from: string;
  to: string;
  date: Date | null;
  adults: number;
  children: number;
}

export interface TaxiSearchState {
  from: string;
  to: string;
  depDate: Date | null;
  retDate: Date | null;
  pickupTime: string;
}

export interface HolidaySearchState {
  from: string;
  to: string;
  checkin: Date | null;
  checkout: Date | null;
  guests: number;
  rooms: number;
}

export interface SearchState {
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
}

// ============================================
// Tipos de Pago
// ============================================

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
}

export interface PaymentRequest {
  amount: number;
  bookingId?: string;
  description?: string;
  customerEmail?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: string;
}

// ============================================
// Tipos de API Comunes
// ============================================

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// Tipos de Componentes UI
// ============================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}
