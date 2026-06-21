import type { Metadata } from 'next';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Agencia de Viajes',
    default: 'Agencia de Viajes — Vuelos, Hoteles y Paquetes',
  },
  description: 'Tu agencia de viajes de confianza. Reserva vuelos, hoteles y paquetes al mejor precio.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/img/favicon.png" />
        <link
          rel="stylesheet"
          href="/css/all.min.css"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
