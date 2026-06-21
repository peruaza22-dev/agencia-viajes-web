/**
 * lib/api.ts — Funciones para fetch de datos en Server Components (SSG/ISR)
 * Solo se ejecutan en el servidor — pueden usar credenciales server-side
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

// ── Blog ────────────────────────────────────────────────────────────────────
export async function getBlogPosts(): Promise<
  { id: string; title: string; excerpt: string; cover_image: string; updated_at: string; slug?: string }[]
> {
  try {
    const res = await fetch(`${API_URL}/blog/posts`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts ?? data.data ?? data ?? [];
  } catch {
    return [];
  }
}

export async function getBlogPost(id: string): Promise<{
  id: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image: string;
  updated_at: string;
} | null> {
  try {
    const res = await fetch(`${API_URL}/blog/posts/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.post ?? data.data ?? data;
  } catch {
    return null;
  }
}

// ── Paquetes vacacionales ───────────────────────────────────────────────────
export async function getPackages(): Promise<
  { id: string; name: string; short_description: string; main_image: string; updated_at: string }[]
> {
  try {
    const res = await fetch(`${API_URL}/packages`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.packages ?? data.data ?? data ?? [];
  } catch {
    return [];
  }
}

export async function getPackage(id: string): Promise<{
  id: string;
  name: string;
  short_description: string;
  description: string;
  main_image: string;
  updated_at: string;
  price?: number;
  duration?: string;
} | null> {
  try {
    const res = await fetch(`${API_URL}/packages/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.package ?? data.data ?? data;
  } catch {
    return null;
  }
}

// ── Hoteles ─────────────────────────────────────────────────────────────────
export async function getHotels(): Promise<
  { id: string; name: string; description: string; image: string; updated_at: string }[]
> {
  try {
    const res = await fetch(`${API_URL}/hotels/featured`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.hotels ?? data.data ?? data ?? [];
  } catch {
    return [];
  }
}

export async function getHotel(id: string): Promise<{
  id: string;
  name: string;
  description: string;
  image: string;
  updated_at: string;
  rating?: number;
  address?: string;
} | null> {
  try {
    const res = await fetch(`${API_URL}/hotels/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.hotel ?? data.data ?? data;
  } catch {
    return null;
  }
}

// ── Destinos ─────────────────────────────────────────────────────────────────
export async function getDestinations(): Promise<
  { id: string; name: string; image: string; updated_at: string }[]
> {
  try {
    const res = await fetch(`${API_URL}/destinations`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.destinations ?? data.data ?? data ?? [];
  } catch {
    return [];
  }
}

// ── Empleos ──────────────────────────────────────────────────────────────────
export async function getJobs(): Promise<
  { id: string; title: string; department: string; location: string; updated_at: string }[]
> {
  try {
    const res = await fetch(`${API_URL}/jobs`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.jobs ?? data.data ?? data ?? [];
  } catch {
    return [];
  }
}

export async function getJob(id: string): Promise<{
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string;
  updated_at: string;
} | null> {
  try {
    const res = await fetch(`${API_URL}/jobs/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.job ?? data.data ?? data;
  } catch {
    return null;
  }
}
