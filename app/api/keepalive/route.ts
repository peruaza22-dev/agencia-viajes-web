import { createAdminClient } from '@/lib/supabaseAdmin';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Usar siempre la Service Role key en endpoints server-side.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  // ── Validación del token secreto ─────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[keepalive] Token inválido — acceso denegado');
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── Ping a Supabase ───────────────────────────────────────────────────────
  if (!supabaseUrl || !supabaseKey) {
    const msg = '[keepalive] Variables SUPABASE no configuradas (se requiere SUPABASE_SERVICE_ROLE_KEY)';
    console.error(msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const supabase = createAdminClient();

  try {
    // SELECT 1 — consulta mínima para mantener la instancia activa
    const { error } = await supabase
      .from('_keepalive_ping')
      .select('1')
      .limit(1)
      .maybeSingle();

    // PGRST116 = tabla no existe — es OK para el ping
    if (error && error.code !== 'PGRST116') {
      console.error('[keepalive] Error en consulta Supabase:', error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const timestamp = new Date().toISOString();
    console.log(`[keepalive] ✓ Ping exitoso a Supabase — ${timestamp}`);
    return NextResponse.json({ ok: true, timestamp });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[keepalive] Error inesperado:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
