/**
 * API Utilities - Conexión con el Backend
 * Next.js version — usa NEXT_PUBLIC_API_URL en lugar de VITE_API_URL
 */

import type {
  FlightSearchParams,
  FlightOffer,
  Traveler,
  FlightContact,
  HotelSearchParams,
  HotelOffer,
  HotelRoom,
  HotelDetail,
  Booking,
  BookingListResponse,
  Airport,
  User,
  PaymentIntent,
  ApiError,
} from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000/api/v1";

// Helper: token del usuario
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("ta_token") || null;
  } catch {
    return null;
  }
};

// Helper: headers
const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (includeAuth) {
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Helper: manejar respuesta
const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = (await response.json()) as T & ApiError;
  if (!response.ok) {
    throw new Error(data.error || data.message || "Error en la solicitud");
  }
  return data;
};

// API: Aeropuertos
export const airportsApi = {
  autocomplete: async (query: string): Promise<{ airports: Airport[] }> => {
    const res = await fetch(
      `${API_URL}/airports/autocomplete?q=${encodeURIComponent(query)}`,
      { headers: getHeaders(false) }
    );
    return handleResponse(res);
  },
  getByCode: async (code: string): Promise<Airport> => {
    const res = await fetch(`${API_URL}/airports/${code}`, {
      headers: getHeaders(false),
    });
    return handleResponse(res);
  },
};

// API: Vuelos
export const flightsApi = {
  search: async (
    params: FlightSearchParams
  ): Promise<{ flights: FlightOffer[] }> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_URL}/flights/search?${qs}`, {
      headers: getHeaders(false),
    });
    return handleResponse(res);
  },
  confirmPrice: async (
    flightOffers: FlightOffer[]
  ): Promise<{ flights: FlightOffer[] }> => {
    const res = await fetch(`${API_URL}/flights/price`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ flightOffers }),
    });
    return handleResponse(res);
  },
  createOrder: async (
    flightOffers: FlightOffer[],
    travelers: Traveler[],
    contact: FlightContact
  ): Promise<{ orderId: string; confirmationCode: string }> => {
    const res = await fetch(`${API_URL}/flights/orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ flightOffers, travelers, contact }),
    });
    return handleResponse(res);
  },
  status: async (
    carrierCode: string,
    flightNumber: string,
    date: string
  ): Promise<{ status: any }> => {
    const qs = new URLSearchParams({ carrierCode, flightNumber, date }).toString();
    const res = await fetch(`${API_URL}/flights/status?${qs}`, {
      headers: getHeaders(false),
    });
    return handleResponse(res);
  },
};

// API: Hoteles
export const hotelsApi = {
  search: async (
    params: HotelSearchParams
  ): Promise<{ hotels: HotelOffer[] }> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_URL}/hotels/search?${qs}`, {
      headers: getHeaders(false),
    });
    return handleResponse(res);
  },
  getById: async (id: string): Promise<HotelDetail> => {
    const res = await fetch(`${API_URL}/hotels/${id}`, {
      headers: getHeaders(false),
    });
    return handleResponse(res);
  },
  getRooms: async (
    id: string,
    params: HotelSearchParams
  ): Promise<{ rooms: HotelRoom[] }> => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_URL}/hotels/${id}/rooms?${qs}`, {
      headers: getHeaders(false),
    });
    return handleResponse(res);
  },
  book: async (
    bookingData: unknown
  ): Promise<{ booking: Booking; confirmationCode: string }> => {
    const res = await fetch(`${API_URL}/hotels/book`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(bookingData),
    });
    return handleResponse(res);
  },
};

// API: Autenticación
export const authApi = {
  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },
  login: async (
    email: string,
    password: string
  ): Promise<{ user: User; access_token: string }> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },
  logout: async (): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  me: async (): Promise<{ user: User }> => {
    const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
    return handleResponse(res);
  },
  forgotPassword: async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },
  resetPassword: async (
    password: string,
    accessToken: string
  ): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ password, accessToken }),
    });
    return handleResponse(res);
  },
};

// API: Reservas
export const bookingsApi = {
  list: async (
    params: Record<string, string> = {}
  ): Promise<BookingListResponse> => {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/bookings?${qs}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  getById: async (id: string): Promise<{ booking: Booking }> => {
    const res = await fetch(`${API_URL}/bookings/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  update: async (
    id: string,
    data: Partial<Booking>
  ): Promise<{ booking: Booking }> => {
    const res = await fetch(`${API_URL}/bookings/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  cancel: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/bookings/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};

// API: Pagos
export const paymentApi = {
  createIntent: async (
    amount: number,
    bookingId?: string,
    description?: string,
    customerEmail?: string
  ): Promise<{ paymentIntent: PaymentIntent }> => {
    const res = await fetch(`${API_URL}/payment/create-intent`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ amount, bookingId, description, customerEmail }),
    });
    return handleResponse(res);
  },
  confirm: async (paymentIntentId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/payment/confirm`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ paymentIntentId }),
    });
    return handleResponse(res);
  },
  getStatus: async (
    paymentIntentId: string
  ): Promise<{ paymentIntent: PaymentIntent }> => {
    const res = await fetch(`${API_URL}/payment/${paymentIntentId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  refund: async (
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/payment/refund`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ paymentId, amount, reason }),
    });
    return handleResponse(res);
  },
};

export default {
  airports: airportsApi,
  flights: flightsApi,
  hotels: hotelsApi,
  auth: authApi,
  bookings: bookingsApi,
  payment: paymentApi,
};
