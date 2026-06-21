// Duffel API Types for offer requests, passengers, slices, offers, etc.

export interface DuffelAirport {
  type: string;
  id: string;
  iata_code: string;
  icao_code?: string;
  name: string;
  city_name?: string;
  iata_country_code?: string;
  time_zone?: string;
  longitude?: number;
  latitude?: number;
}

export interface DuffelPassenger {
  id?: string;
  given_name?: string;
  family_name?: string;
  type?: 'adult' | 'child' | 'infant' | 'held_infant';
  age?: number;
  fare_type?: string;
  loyalty_programme_accounts?: Array<{
    airline_iata_code: string;
    account_number: string;
  }>;
}

export interface DuffelSlice {
  origin: string | DuffelAirport;
  destination: string | DuffelAirport;
  departure_date: string; // ISO 8601 date
  departure_time?: { from?: string; to?: string };
  arrival_time?: { from?: string; to?: string };
  origin_type?: 'airport' | 'city';
  destination_type?: 'airport' | 'city';
}

export interface DuffelPrivateFare {
  corporate_code?: string;
  tour_code?: string;
  tracking_reference?: string;
}

export interface CreateOfferRequestPayload {
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first';
  max_connections?: number;
  include_split_ticket?: boolean;
  airline_credit_ids?: string[];
  private_fares?: Record<string, DuffelPrivateFare[]>;
}

export interface DuffelSegment {
  id: string;
  origin: DuffelAirport;
  destination: DuffelAirport;
  departure_at: string;
  arrival_at: string;
  operating_carrier: {
    iata_code: string;
    name: string;
  };
  marketing_carrier?: {
    iata_code: string;
    name: string;
  };
  aircraft?: {
    iata_code: string;
    name: string;
  };
  number?: string;
  distance?: number;
  duration?: string;
}

export interface DuffelSliceWithSegments extends DuffelSlice {
  segments: DuffelSegment[];
  duration?: string;
  stops_count?: number;
}

export interface DuffelOffer {
  id: string;
  slices: DuffelSliceWithSegments[];
  base_price: string;
  tax_amount?: string;
  total_amount: string;
  base_currency?: string;
  currency?: string;
  owner: {
    iata_code: string;
    name: string;
  };
  available_airline_credits?: Array<{
    id: string;
    airline_iata_code: string;
    amount: string;
  }>;
  live_mode: boolean;
  created_at: string;
}

export interface DuffelOfferRequest {
  id: string;
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  cabin_class?: string;
  offers?: DuffelOffer[];
  created_at: string;
  live_mode: boolean;
  client_key?: string;
}

export interface ListOfferRequestsResponse {
  meta: {
    limit: number;
    after?: string;
    before?: string;
  };
  data: DuffelOfferRequest[];
}

// ===== CARS TYPES =====

export interface GeographicCoordinates {
  latitude: number;
  longitude: number;
}

export interface CarLocation {
  radius?: number;
  geographic_coordinates: GeographicCoordinates;
  address?: {
    line_one?: string;
    city_name?: string;
    region?: string;
    postal_code?: string;
    country_code?: string;
  };
  name?: string;
  phone_number?: string;
  opening_hours?: Array<{ from: string; to: string }>;
  additional_information?: Array<{ title: string; text: string }>;
}

export interface CarDriver {
  age: number;
  residence_country_code: string;
}

export interface CarSearchPayload {
  pickup_location: CarLocation;
  pickup_date: string; // ISO 8601 date
  pickup_time: string; // HH:MM format
  dropoff_location: CarLocation;
  dropoff_date: string; // ISO 8601 date
  dropoff_time: string; // HH:MM format
  driver: CarDriver;
}

export interface CarImages {
  url: string;
}

export interface CarBaggage {
  small?: number;
  large?: number;
}

export interface Car {
  code: string;
  name: string;
  category: string;
  type: string;
  transmission?: string;
  fuel?: string;
  air_conditioning?: boolean;
  max_passengers?: number;
  baggage?: CarBaggage;
  images?: CarImages[];
}

export interface CarSupplier {
  name: string;
  logo_url?: string;
}

export interface CarRate {
  id: string;
  supplier: CarSupplier;
  car: Car;
  pickup_location: CarLocation;
  dropoff_location: CarLocation;
  pickup_date: string;
  pickup_time: string;
  dropoff_date: string;
  dropoff_time: string;
  base_amount: string;
  base_currency: string;
  total_amount: string;
  total_currency: string;
  payment_type: 'guarantee' | 'postpaid' | 'prepaid';
}

export interface CarSearch {
  id: string;
  pickup_location: CarLocation;
  pickup_date: string;
  pickup_time: string;
  dropoff_location: CarLocation;
  dropoff_date: string;
  dropoff_time: string;
  driver: CarDriver;
  rates: CarRate[];
  created_at: string;
  live_mode: boolean;
}

export interface CarCharge {
  description: string;
  amount: string;
  currency: string;
}

export interface CarCondition {
  title: string;
  text: string;
}

export interface CarPrivacyPolicy {
  title: string;
  text: string;
}

export interface CarMileage {
  type?: string;
  distance_unit?: string;
  included_distance?: number;
}

export interface CarQuote {
  id: string;
  search_id: string;
  rate_id: string;
  supplier: CarSupplier;
  car: Car;
  pickup_location: CarLocation;
  pickup_date: string;
  pickup_time: string;
  dropoff_location: CarLocation;
  dropoff_date: string;
  dropoff_time: string;
  base_amount: string;
  base_currency: string;
  total_amount: string;
  total_currency: string;
  payment_type: 'guarantee' | 'postpaid' | 'prepaid';
  charges?: CarCharge[];
  conditions?: CarCondition[];
  privacy_policies?: CarPrivacyPolicy[];
  mileage?: CarMileage;
  live_mode: boolean;
}

// ===== ORDERS TYPES (Bookings) =====

export interface PassengerContact {
  email?: string;
  phone_number?: string;
}

export interface PassengerIdentityDocument {
  document_number: string;
  document_type: 'passport' | 'national_identity_card' | 'national_passport_card';
  country_code: string;
  expiration_date: string;
}

export interface OrderPassenger {
  id: string;
  title: 'mr' | 'ms' | 'mrs' | 'mx';
  first_name: string;
  last_name: string;
  passenger_identity_documents?: PassengerIdentityDocument[];
  contact?: PassengerContact;
  infant_passenger_id?: string;
  age?: number;
}

export interface DuffelOrder {
  id: string;
  offer_id: string;
  passengers: OrderPassenger[];
  type: 'instant' | 'hold';
  total_amount: string;
  total_currency: string;
  base_amount?: string;
  base_currency?: string;
  tax_amount?: string;
  tax_currency?: string;
  payment_status: 'pending' | 'confirmed' | 'failed';
  fulfillment_status?: 'unfulfilled' | 'partially_fulfilled' | 'fulfilled';
  live_mode: boolean;
  created_at: string;
  updated_at: string;
  slices?: DuffelSlice[];
  owner?: DuffelAirline;
  documents?: Array<{ type: string; id: string }>;
}

export interface CreateOrderPayload {
  offer_id: string;
  passengers: OrderPassenger[];
  type?: 'instant' | 'hold';
}

// ===== ANCILLARIES TYPES =====

export interface Ancillary {
  id: string;
  name: string;
  type: 'baggage' | 'seat' | 'meal' | 'lounge' | 'other';
  passenger_ids: string[];
  segment_ids?: string[];
  total_amount: string;
  total_currency: string;
  conditions?: CarCondition[];
}

export interface AncillariesResponse {
  ancillaries: Ancillary[];
}

// ===== VALIDATIONS TYPES =====

export interface PassengerDetailValidationRequest {
  title: 'mr' | 'ms' | 'mrs' | 'mx';
  first_name: string;
  last_name: string;
  born_at: string; // ISO 8601 date
  nationality_code: string;
  identity_document_type?: 'passport' | 'national_identity_card' | 'national_passport_card';
  identity_document_number?: string;
}

export interface PassengerDetailValidationResponse {
  valid: boolean;
  errors?: Array<{ field: string; message: string }>;
}

// ===== SEAT MAPS TYPES =====

export interface SeatLocation {
  row: number;
  column: string;
}

export interface SeatCharacteristic {
  name: string;
}

export interface Seat {
  designator: string;
  location: SeatLocation;
  characteristics?: SeatCharacteristic[];
  available: boolean;
  price?: string;
  currency?: string;
}

export interface Deck {
  name: string;
  rows: number;
  seats: Seat[];
}

export interface SeatMap {
  id: string;
  segment_id: string;
  aircraft_code: string;
  decks: Deck[];
}
