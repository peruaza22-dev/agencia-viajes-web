import type { MetadataRoute } from 'next';
import {
  getBlogPosts,
  getPackages,
  getHotels,
  getDestinations,
  getJobs,
} from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://agencia.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, packages, hotels, destinations, jobs] = await Promise.all([
    getBlogPosts(),
    getPackages(),
    getHotels(),
    getDestinations(),
    getJobs(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/sobre-nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/destinos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/vuelos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/hoteles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/vacaciones`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/autobuses`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/traslados`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/empleo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...posts.map((p) => ({
      url: `${BASE}/blog/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...packages.map((p) => ({
      url: `${BASE}/vacaciones/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    ...hotels.map((h) => ({
      url: `${BASE}/hoteles/${h.id}`,
      lastModified: new Date(h.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    ...destinations.map((d) => ({
      url: `${BASE}/destinos`,
      lastModified: new Date(d.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...jobs.map((j) => ({
      url: `${BASE}/empleo/${j.id}`,
      lastModified: new Date(j.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
