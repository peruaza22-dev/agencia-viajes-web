import { describe, expect, it } from 'vitest';
import { createAdminClient } from '@/lib/supabaseAdmin';

describe('keepalive helper', () => {
  it('throws when env vars are missing', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => createAdminClient()).toThrow();

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });
});
