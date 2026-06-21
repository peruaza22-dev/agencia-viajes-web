import type { Metadata } from 'next';

const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME ?? 'Agencia de Viajes';
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://agencia.com';

export { SITE_NAME, BASE_URL };

interface BuildMetadataOptions {
  title: string;
  description: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
}

export function buildMetadata(opts: BuildMetadataOptions): Metadata {
  const { title, description, image, path, noIndex } = opts;
  const url = path ? `${BASE_URL}${path}` : BASE_URL;
  const ogImage = image ?? `${BASE_URL}/img/banner.jpg`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    ...(noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
  };
}
