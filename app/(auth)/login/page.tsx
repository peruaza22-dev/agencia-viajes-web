'use client';

import { useState, type FormEvent, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { useAuth } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
const OTP_TTL = 4 * 60;
type Step = 'main' | 'password' | 'code';

export default function LoginPage() {
  const { login, loading, authenticate } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [step, setStep] = useState<Step>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const res = await login({ email, password });
    if (res.success) {
      router.push(redirectTo);
    } else {
      setErr(typeof res.error === 'string' ? res.error : 'Error al iniciar sesión');
    }
  };

  const sendCodeLogin = async () => {
    if (!email.trim()) { setErr('Ingresa tu correo'); return; }
    setOtpLoading(true); setErr(''); setMsg('');
    try {
      const r = await fetch(`${API}/auth/send-login-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error?.message || 'Error al enviar código'); return; }
      setMsg('Código enviado a tu correo.');
      setStep('code');
      setOtp(['', '', '', '', '', '']);
      setCountdown(OTP_TTL);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch { setErr('Error de conexión'); } finally { setOtpLoading(false); }
  };

  const handleOtpInput = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const verifyCode = async () => {
    const code = otp.join('');
    if (code.length < 6) { setErr('Ingresa los 6 dígitos'); return; }
    setOtpLoading(true); setErr('');
    try {
      const r = await fetch(`${API}/auth/verify-login-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error?.message || 'Código incorrecto'); return; }

      const accessToken = d.token || d.access_token || d.data?.token || d.data?.access_token || '';
      const userData = d.data?.user || d.user || d;

      if (!accessToken) { setErr('No se recibió token de acceso.'); return; }

      const authResult = await authenticate(accessToken, userData);
      if (!authResult.success) { setErr(authResult.error || 'Error al iniciar sesión'); return; }

      router.push(redirectTo);
    } catch { setErr('Error'); } finally { setOtpLoading(false); }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const isLocal = API_URL.includes('localhost');

  return (
    <div id="body">
      <MobileNav />
      <Header />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 12px', background: '#f5f8fb' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 'clamp(16px, 4vw, 32px)', width: '100%', maxWidth: 400, boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <i className="fa fa-user-circle" style={{ fontSize: 48, color: '#003580', display: 'block', marginBottom: 8 }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40' }}>Iniciar Sesión</h2>
          </div>

          {err && (
            <div style={{ background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: 4, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              <i className="fa fa-exclamation-circle" style={{ marginRight: 6 }} />{err}
            </div>
          )}

          {step === 'main' && (
            <>
              <form onSubmit={handleSubmit}>
                <div className="input2" style={{ marginBottom: 12 }}>
                  <span>Correo electrónico</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
                </div>
                <div className="input2" style={{ marginBottom: 12, position: 'relative' }}>
                  <span>Contraseña</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    style={{ position: 'absolute', right: 10, bottom: 9, background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14 }}
                  >
                    <i className={`fa fa-eye${showPass ? '-slash' : ''}`} />
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#003580' }} /> Recordarme
                  </label>
                  <Link href="/forgot" style={{ color: '#003580', fontSize: 13 }}>¿Olvidaste tu contraseña?</Link>
                </div>
                <button type="submit" className="search-btn" disabled={loading} style={{ marginTop: 12, opacity: loading ? 0.6 : 1 }}>
                  {loading
                    ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />Entrando...</>
                    : <><i className="fa fa-sign-in" style={{ marginRight: 6 }} />Iniciar Sesión</>
                  }
                </button>
              </form>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setStep('code'); setEmail(''); setErr(''); }}
                  style={{ background: 'none', border: 'none', color: '#003580', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                >
                  O ingresa con código
                </button>
              </div>
            </>
          )}

          {step === 'code' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 700 }}>CORREO</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  disabled={countdown > 0}
                  style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 6, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 12px', color: '#15803d', fontSize: 12, marginBottom: 12 }}>{msg}</div>}
              {countdown === 0 ? (
                <button
                  onClick={sendCodeLogin}
                  disabled={otpLoading || !email.trim()}
                  style={{ width: '100%', background: '#003580', color: '#fff', border: 'none', borderRadius: 6, padding: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Enviar código
                </button>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>Código válido: {fmtCountdown(countdown)}</p>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleOtpInput(i, e.target.value)}
                        onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && inputRefs.current[i - 1]?.focus()}
                        style={{ width: 40, height: 48, textAlign: 'center', fontSize: 20, fontWeight: 800, border: `2px solid ${d ? '#003580' : '#e2e8f0'}`, borderRadius: 8, outline: 'none', fontFamily: 'monospace' }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={verifyCode}
                    disabled={otpLoading || otp.join('').length < 6}
                    style={{ width: '100%', background: '#003580', color: '#fff', border: 'none', borderRadius: 6, padding: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Verificar código
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => { setStep('main'); setEmail(''); setOtp(['', '', '', '', '', '']); setCountdown(0); setErr(''); setMsg(''); }}
                style={{ width: '100%', background: 'none', border: '1px solid #e5e5e5', borderRadius: 6, padding: 10, fontSize: 12, color: '#64748b', cursor: 'pointer', marginTop: 12 }}
              >
                Volver a contraseña
              </button>
            </div>
          )}

          {step === 'main' && (
            <div style={{ borderTop: '1px solid #e5e5e5', margin: '20px 0', textAlign: 'center', paddingTop: 16, fontSize: 13 }}>
              ¿No tienes cuenta?{' '}
              <Link href="/signup" style={{ color: '#003580', fontWeight: 700 }}>Crear cuenta gratis</Link>
            </div>
          )}

          {!isLocal && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px' }}>
                <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
                <span style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap' }}>o continúa con</span>
                <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`${API_URL}/auth/google?redirect_to=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`)}`}
                  style={{ flex: 1, border: '1px solid #e5e5e5', borderRadius: 4, padding: '7px 10px', background: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', color: '#333' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/google-logo.svg" alt="Google" style={{ width: 16, height: 16 }} />
                  Google
                </a>
                <a
                  href={`${API_URL}/auth/facebook?redirect_to=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`)}`}
                  style={{ flex: 1, border: '1px solid #e5e5e5', borderRadius: 4, padding: '7px 10px', background: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, textDecoration: 'none', color: '#333' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/facebook-logo.svg" alt="Facebook" style={{ width: 16, height: 16 }} />
                  Facebook
                </a>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
      {err && <div style={{ position: 'fixed', bottom: 16, right: 16, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '12px 16px', color: '#dc2626', fontSize: 13 }}>{err}</div>}
    </div>
  );
}
