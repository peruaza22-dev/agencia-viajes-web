import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getRateLimit } from '@/lib/rateLimiter';

const jwtSecretValue = process.env.JWT_SECRET;
if (!jwtSecretValue) {
  // En build time esto no falla, solo en runtime
  console.error('FATAL: JWT_SECRET no configurado');
}

const JWT_SECRET = new TextEncoder().encode(
  jwtSecretValue || 'INSECURE_FALLBACK_SET_JWT_SECRET_IN_ENV'
);

const VALID_ROLES = ['admin', 'manager', 'agent', 'editor', 'viewer'];
const WINDOW_SECONDS = 15 * 60; // 15 minutes
const ANON_LIMIT = 100; // per window
const AUTH_LIMIT = 1000; // per window

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Modo mantenimiento ────────────────────────────────────────────────────
  // Lee la cookie ta_maintenance que el SiteSettingsProvider puede establecer
  const maintenanceMode =
    request.cookies.get('ta_maintenance')?.value === 'true';

  if (
    maintenanceMode &&
    !pathname.startsWith('/admin') &&
    pathname !== '/mantenimiento' &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/img') &&
    !pathname.startsWith('/css') &&
    !pathname.startsWith('/webfonts')
  ) {
    return NextResponse.redirect(new URL('/mantenimiento', request.url));
  }

  // ── Protección de rutas /admin/* (excepto /admin/login) ──────────────────
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('ta_token')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = payload.role as string;

      if (!VALID_ROLES.includes(role)) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      // Pasa el rol en un header para que los layouts de admin puedan leerlo
      const response = NextResponse.next();
      response.headers.set('x-user-role', role);
      response.headers.set('x-user-id', String(payload.sub || ''));
      return response;
    } catch {
      // Token inválido o expirado
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Rate limiting para APIs ──────────────────────────────────────────────
  if (pathname.startsWith('/api')) {
    // Key: user id if authenticated, else IP
    let isAuth = false;
    let key = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    const token = request.cookies.get('ta_token')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        key = `user:${String(payload.sub || 'anon')}`;
        isAuth = true;
      } catch {
        // invalid token: treat as anon
      }
    }

    const { ok, retryAfter } = await getRateLimit(key, isAuth ? AUTH_LIMIT : ANON_LIMIT, WINDOW_SECONDS);
    if (!ok) {
      return new NextResponse(JSON.stringify({ ok: false, error: 'Too Many Requests' }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': String(retryAfter),
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos con extensión (imágenes, fuentes, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|css|js)$).*)',
  ],
};
