const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

export async function searchDuffel(opts: { origin: string; destination: string; departureDate: string; adults?: number }) {
  const res = await fetch(`${API}/duffel/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin: opts.origin, destination: opts.destination, departureDate: opts.departureDate, adults: opts.adults || 1 })
  });
  if (!res.ok) throw new Error(`Duffel proxy error ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Duffel error');
  return json.data;
}

export async function getIntegrations() {
  const res = await fetch(`${API}/integrations`);
  if (!res.ok) return { duffel: false, amadeus: true };
  const j = await res.json();
  return j.data || { duffel: false, amadeus: false };
}

// ---- Offer Requests helpers ----
import type { CreateOfferRequestPayload, DuffelOfferRequest, ListOfferRequestsResponse, DuffelOffer, CarSearchPayload, CarSearch, CarQuote, DuffelOrder, CreateOrderPayload, Ancillary, PassengerDetailValidationRequest, PassengerDetailValidationResponse, SeatMap } from '@/types/duffel';

/**
 * Create an offer request with Duffel API.
 * @param payload - Passengers, slices, cabin class, etc.
 * @param opts - Query params: return_offers, supplier_timeout, view
 * @returns Offer request with offers or just the request object
 */
export async function createOfferRequest(
  payload: CreateOfferRequestPayload,
  opts: { return_offers?: boolean; supplier_timeout?: number; view?: string } = {}
): Promise<DuffelOfferRequest> {
  const qp = new URLSearchParams();
  if (typeof opts.return_offers !== 'undefined') qp.set('return_offers', String(opts.return_offers));
  if (typeof opts.supplier_timeout !== 'undefined') qp.set('supplier_timeout', String(opts.supplier_timeout));
  if (opts.view) qp.set('view', opts.view);
  const url = `${API}/duffel/offer_requests${qp.toString() ? `?${qp.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Duffel offer_request error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel offer_request error');
  return j.data;
}

/**
 * List all offer requests with pagination.
 * @param opts - Pagination: after, before, limit; Format: view
 * @returns List of offer requests
 */
export async function listOfferRequests(
  opts: { after?: string; before?: string; limit?: number; view?: string } = {}
): Promise<ListOfferRequestsResponse> {
  const qp = new URLSearchParams();
  if (opts.after) qp.set('after', opts.after);
  if (opts.before) qp.set('before', opts.before);
  if (opts.limit) qp.set('limit', String(opts.limit));
  if (opts.view) qp.set('view', opts.view);
  const url = `${API}/duffel/offer_requests${qp.toString() ? `?${qp.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Duffel list offer_requests error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel list error');
  return j.data;
}

/**
 * Retrieve a single offer request by ID.
 * @param id - Offer request ID
 * @param view - Response format: "offers" or "itineraries"
 * @returns Single offer request
 */
export async function getOfferRequest(
  id: string,
  view?: string
): Promise<DuffelOfferRequest> {
  const qp = new URLSearchParams();
  if (view) qp.set('view', view);
  const url = `${API}/duffel/offer_requests/${encodeURIComponent(id)}${qp.toString() ? `?${qp.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Duffel get offer_request error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel get error');
  return j.data;
}

// ---- Cars Search & Quotes helpers ----

/**
 * Search for rental cars.
 * @param payload - Pickup/dropoff locations, dates, times, driver info
 * @returns Car search result with available rates
 */
export async function searchCars(payload: CarSearchPayload): Promise<CarSearch> {
  const res = await fetch(`${API}/duffel/cars/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Duffel cars/search error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel cars search error');
  return j.data;
}

/**
 * Create a quote from a selected rate.
 * @param rateId - Rate ID from a car search
 * @returns Car quote with pricing and conditions
 */
export async function createCarQuote(rateId: string): Promise<CarQuote> {
  const res = await fetch(`${API}/duffel/cars/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate_id: rateId })
  });
  if (!res.ok) throw new Error(`Duffel cars/quotes error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel cars quote error');
  return j.data;
}

// ---- Orders helpers ----

/**
 * Create an order (booking) from a flight offer.
 * @param payload - Offer ID and passenger details
 * @returns Created order with confirmation details
 */
export async function createOrder(payload: CreateOrderPayload): Promise<DuffelOrder> {
  const res = await fetch(`${API}/duffel/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Duffel create order error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel order creation error');
  return j.data;
}

/**
 * Retrieve an order by ID.
 * @param orderId - Order ID
 * @returns Order details with itinerary and passengers
 */
export async function getOrder(orderId: string): Promise<DuffelOrder> {
  const res = await fetch(`${API}/duffel/orders/${encodeURIComponent(orderId)}`);
  if (!res.ok) throw new Error(`Duffel get order error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel get order error');
  return j.data;
}

/**
 * List all orders with optional pagination.
 * @param opts - Pagination options (after, before, limit, sort)
 * @returns List of orders
 */
export async function listOrders(opts?: {
  after?: string;
  before?: string;
  limit?: number;
  sort?: string;
}): Promise<{ meta: any; data: DuffelOrder[] }> {
  const qp = new URLSearchParams();
  if (opts?.after) qp.set('after', opts.after);
  if (opts?.before) qp.set('before', opts.before);
  if (opts?.limit) qp.set('limit', String(opts.limit));
  if (opts?.sort) qp.set('sort', opts.sort);

  const res = await fetch(`${API}/duffel/orders${qp.toString() ? `?${qp.toString()}` : ''}`);
  if (!res.ok) throw new Error(`Duffel list orders error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel list orders error');
  return j.data;
}

// ---- Ancillaries helpers ----

/**
 * Get available ancillary services for an offer.
 * @param offerId - Offer ID
 * @returns Available ancillaries (baggage, seats, meals, etc.)
 */
export async function getAncillaries(offerId: string): Promise<Ancillary[]> {
  const res = await fetch(`${API}/duffel/ancillaries?offer_id=${encodeURIComponent(offerId)}`);
  if (!res.ok) throw new Error(`Duffel get ancillaries error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel ancillaries error');
  return j.data?.ancillaries || [];
}

// ---- Validations helpers ----

/**
 * Validate passenger details before booking.
 * @param passenger - Passenger info to validate
 * @returns Validation result with errors if any
 */
export async function validatePassengerDetail(
  passenger: PassengerDetailValidationRequest
): Promise<PassengerDetailValidationResponse> {
  const res = await fetch(`${API}/duffel/validations/passenger_detail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passenger)
  });
  if (!res.ok) throw new Error(`Duffel validation error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel validation error');
  return j.data;
}

// ---- Seat Maps helpers ----

/**
 * Get seat map for a flight segment.
 * @param offerId - Offer ID
 * @param segmentId - Segment ID
 * @returns Seat map with available/unavailable seats and pricing
 */
export async function getSeatMap(offerId: string, segmentId: string): Promise<SeatMap> {
  const res = await fetch(`${API}/duffel/seat_maps/${encodeURIComponent(offerId)}/${encodeURIComponent(segmentId)}`);
  if (!res.ok) throw new Error(`Duffel seat map error ${res.status}`);
  const j = await res.json();
  if (!j.success) throw new Error(j.error?.message || 'Duffel seat map error');
  return j.data;
}
