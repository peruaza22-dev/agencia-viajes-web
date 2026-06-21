'use client';

import { useState, type FormEvent, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
const PANEL_ROLES = ['admin', 'manager', 'agent', 'editor', 'viewer'];
const OTP_TTL = 4 * 60;
type Step = 'login' | 'forgot' | 'otp' | 'newpwd';

export default function AdminLoginPage() {
  const { login, loading, authenticate } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = (() => {
    const raw = searchParams?.get('redirect') || '/admin';
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/admin';
  })();
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [isLoginCode, setIsLoginCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}${redirectPath}`
    : `http://localhost:3000${redirectPath}`;
  const isLocal = API.includes('localhost');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    const res = await login({ email, password });
    if (!res.success) { setErr(res.error || 'Credenciales incorrectas'); return; }
    if (!res.user?.role || !PANEL_ROLES.includes(res.user.role)) { setErr('Sin permisos de acceso'); return; }
    router.push(redirectPath);
  };

  const sendOtp = async () => {
    if (!email.trim()) { setErr('Ingresa tu email'); return; }
    setOtpLoading(true); setErr(''); setMsg('');
    setIsLoginCode(false);
    try {
      const r = await fetch(`${API}/auth/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error?.message || 'Error al enviar'); return; }
      setMsg('Código enviado.'); setStep('otp'); setOtp(['', '', '', '', '', '']); setCountdown(OTP_TTL);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch { setErr('Error de conexión'); } finally { setOtpLoading(false); }
  };

  const sendLoginCode = async () => {
    if (!email.trim()) { setErr('Ingresa tu email'); return; }
    setOtpLoading(true); setErr(''); setMsg('');
    setIsLoginCode(true);
    try {
      const r = await fetch(`${API}/auth/send-login-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error?.message || 'Error al enviar'); return; }
      setMsg('Código enviado.'); setStep('otp'); setOtp(['', '', '', '', '', '']); setCountdown(OTP_TTL);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch { setErr('Error de conexión'); } finally { setOtpLoading(false); }
  };

  const handleOtpInput = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setErr('Ingresa los 6 dígitos'); return; }
    setOtpLoading(true); setErr('');
    try {
      const endpoint = isLoginCode ? '/auth/verify-login-code' : '/auth/verify-otp';
      const r = await fetch(`${API}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error?.message || 'Código incorrecto'); return; }

      if (isLoginCode) {
        const accessToken =
          d.token ||
          d.access_token ||
          d.data?.token ||
          d.data?.access_token ||
          '';
        const userData = d.data?.user || d.user || d;

        if (!accessToken) {
          setErr('No se recibió token de acceso.');
          return;
        }

        const authResult = await authenticate(accessToken, userData);
        if (!authResult.success) {
          setErr(authResult.error || 'Error al iniciar sesión');
          return;
        }

        router.push(redirectPath);
        return;
      }

      setResetToken(d.resetToken);
      setStep('newpwd');
    } catch {
      setErr('Error');
    } finally {
      setOtpLoading(false);
    }
  };

  const submitNewPwd = async (e: FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 8) { setErr('Mínimo 8 caracteres'); return; }
    if (newPwd !== newPwd2) { setErr('No coinciden'); return; }
    setOtpLoading(true); setErr('');
    try {
      const r = await fetch(`${API}/auth/reset-password-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resetToken, newPassword: newPwd }) });
      const d = await r.json();
      if (!r.ok) { setErr(d.error?.message || 'Error'); return; }
      setMsg('✓ Contraseña actualizada.'); setStep('login');
    } catch { setErr('Error'); } finally { setOtpLoading(false); }
  };

  const s: React.CSSProperties = { width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 5, fontWeight: 700 };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0a1628,#003580)', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 'clamp(24px,5vw,40px)', width: '100%', maxWidth: 400, boxShadow: '0 24px 80px rgba(0,0,0,.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: '#003580', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <i className="fa-solid fa-shield-halved" style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#003580', margin: 0 }}>Panel de Administración</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Acceso restringido — solo personal autorizado</p>
        </div>

        {err && <div style={{ background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{err}</div>}
        {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', color: '#15803d', fontSize: 13, marginBottom: 16 }}>{msg}</div>}

        {step === 'login' && (
          <>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}><label style={lbl}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@tuagencia.com" required style={s} /></div>
              <div style={{ marginBottom: 8, position: 'relative' }}>
                <label style={lbl}>Contraseña</label>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ ...s, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(x => !x)} style={{ position: 'absolute', right: 10, bottom: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><i className={`fa-solid fa-eye${showPass ? '-slash' : ''}`} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <button type="button" onClick={sendLoginCode} disabled={otpLoading} style={{ background: 'none', border: 'none', color: '#003580', fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: 0 }}>Entrar con código</button>
                <button type="button" onClick={() => { setStep('forgot'); setErr(''); setIsLoginCode(false); }} style={{ background: 'none', border: 'none', color: '#003580', fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: 0 }}>¿Olvidaste tu contraseña?</button>
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#94a3b8' : '#003580', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? 'Verificando…' : 'Entrar al Panel'}
              </button>
            </form>
            {!isLocal && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' }}>
                  <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
                  <span style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap' }}>o continúa con</span>
                  <div style={{ flex: 1, height: 1, background: '#e5e5e5' }} />
                </div>
                <a
                  href={`${API}/auth/google?redirect_to=${encodeURIComponent(redirectTo)}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: 12, background: '#fff', color: '#333', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
                >
                  <i className="fa-brands fa-google" style={{ color: '#DB4437', fontSize: 18 }} />
                  Entrar con Google
                </a>
              </>
            )}
          </>
        )}

        {step === 'forgot' && (
          <div>
            <div style={{ marginBottom: 20 }}><label style={lbl}>Email registrado</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" style={s} /></div>
            <button onClick={sendOtp} disabled={otpLoading} style={{ width: '100%', background: '#003580', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Enviar código</button>
            <button onClick={() => { setStep('login'); setErr(''); }} style={{ width: '100%', background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: 10, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>Volver</button>
          </div>
        )}

        {step === 'otp' && (
          <div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
              {isLoginCode ? (
                <>Código enviado a <strong>{email}</strong>. Úsalo para iniciar sesión en el panel. Válido {fmtCountdown(countdown)}.</>
              ) : (
                <>Código enviado a <strong>{email}</strong>. Válido {fmtCountdown(countdown)}.</>
              )}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {otp.map((d, i) => (
                <input key={i} ref={el => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleOtpInput(i, e.target.value)} onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && inputRefs.current[i-1]?.focus()}
                  style={{ width: 46, height: 54, textAlign: 'center', fontSize: 24, fontWeight: 800, border: `2px solid ${d ? '#003580' : '#e2e8f0'}`, borderRadius: 10, outline: 'none', fontFamily: 'monospace' }} />
              ))}
            </div>
            <button onClick={verifyOtp} disabled={otpLoading || otp.join('').length < 6} style={{ width: '100%', background: '#003580', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {isLoginCode ? 'Iniciar sesión' : 'Verificar código'}
            </button>
          </div>
        )}

        {step === 'newpwd' && (
          <form onSubmit={submitNewPwd}>
            <div style={{ marginBottom: 14 }}><label style={lbl}>Nueva contraseña</label><input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Mínimo 8 caracteres" style={s} /></div>
            <div style={{ marginBottom: 20 }}><label style={lbl}>Confirmar</label><input type="password" value={newPwd2} onChange={e => setNewPwd2(e.target.value)} placeholder="Repite la contraseña" style={s} /></div>
            <button type="submit" disabled={otpLoading || newPwd.length < 8 || newPwd !== newPwd2} style={{ width: '100%', background: '#003580', color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Guardar contraseña</button>
          </form>
        )}

        <div style={{ marginTop: 20, textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
          <Link href="/" style={{ fontSize: 12, color: '#94a3b8' }}>← Volver al sitio web</Link>
        </div>
      </div>
    </div>
  );
}
