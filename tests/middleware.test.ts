import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

function buildRequest(url: string, cookie = '') {
  return {
    nextUrl: new URL(url, 'http://localhost'),
    cookies: {
      get: (name: string) => ({ value: cookie }),
    },
    headers: new Map<string, string>(),
    ip: '127.0.0.1',
  } as unknown as NextRequest;
}

describe('middleware', () => {
  it('redirects unauthenticated admin access to login', async () => {
    const request = buildRequest('http://localhost/admin/dashboard');
    const response = await middleware(request);
    expect(response.status).toBe(307);
  });
});
