'use client';

import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
type Step = 'email' | 'code' | 'password' | 'done';

export default function ForgotPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) { setError('Ingresa tu correo electrónico'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error al enviar');
      setStep('code');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((c) => { if (c <= 1) { clearInterval(interval); return 0; } return c - 1; });
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el código');
    } finally { setLoading(false); }
  };

  const verifyCode = async (e?: FormEvent) => {
    e?.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) { setError('Ingresa el código completo de 6 dígitos'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: fullCode }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Código incorrecto');
      setResetToken(d.resetToken);
      setStep('password');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código incorrecto');
    } finally { setLoading(false); }
  };

  const resetPassword = async (e?: FormEvent) => {
    e?.preventDefault();
    if (newPassword.length < 8) { setError('Mínimo 8 caracteres'); return; }
    if (newPassword !== confirmPwd) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}/auth/reset-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error al cambiar contraseña');
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally { setLoading(false); }
  };

  const handleCodeInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError('');
    if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
    if (digit && idx === 5 && next.every((d) => d)) setTimeout(() => verifyCode(), 100);
  };

  const handleCodeKey = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) codeRefs.current[idx - 1]?.focus();
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      codeRefs.current[5]?.focus();
      setTimeout(() => verifyCode(), 100);
    }
  };

  const pwdStrength = (() => {
    if (!newPassword) return { level: 0, label: '', color: '' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 1) return { level: 1, label: 'Débil', color: '#dc2626' };
    if (score <= 3) return { level: 2, label: 'Media', color: '#d97706' };
    return { level: 3, label: 'Fuerte', color: '#16a34a' };
  })();

  return (
    <div id="body">
      <MobileNav />
      <Header />
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: '#f5f8fb' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>

          {/* Paso 1: Email */}
          {step === 'email' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, background: '#003580', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <i className="fa fa-lock" style={{ fontSize: 22, color: '#fff' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Recuperar contraseña</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Te enviaremos un código de verificación</p>
              </div>
              {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}><i className="fa fa-circle-exclamation" style={{ marginRight: 6 }} />{error}</div>}
              <form onSubmit={sendCode}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Correo electrónico</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fa fa-envelope" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }} />
                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="tu@email.com" required autoFocus
                      style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>
                <button type="submit" className="search-btn" disabled={loading} style={{ marginTop: 0 }}>
                  {loading ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />Enviando…</> : <><i className="fa fa-paper-plane" style={{ marginRight: 6 }} />Enviar código</>}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
                <Link href="/login" style={{ color: '#003580' }}><i className="fa fa-arrow-left" style={{ marginRight: 4 }} />Volver al inicio de sesión</Link>
              </p>
            </>
          )}

          {/* Paso 2: Código OTP */}
          {step === 'code' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, background: '#0284c7', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <i className="fa fa-envelope-open" style={{ fontSize: 22, color: '#fff' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Revisa tu email</h2>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Código de 6 dígitos enviado a<br /><strong style={{ color: '#1e293b' }}>{email}</strong></p>
              </div>
              {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}><i className="fa fa-circle-exclamation" style={{ marginRight: 6 }} />{error}</div>}
              <form onSubmit={verifyCode}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }} onPaste={handleCodePaste}>
                  {code.map((digit, idx) => (
                    <input key={idx} ref={(el) => { codeRefs.current[idx] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleCodeInput(idx, e.target.value)} onKeyDown={(e) => handleCodeKey(idx, e)} autoFocus={idx === 0}
                      style={{ width: 48, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 900, border: `2px solid ${digit ? '#003580' : '#d1d5db'}`, borderRadius: 10, outline: 'none', fontFamily: 'monospace', background: digit ? '#f0f4ff' : '#fff', color: '#003580', transition: 'all 0.15s' }} />
                  ))}
                </div>
                <button type="submit" className="search-btn" disabled={loading || code.some((d) => !d)} style={{ marginTop: 0 }}>
                  {loading ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />Verificando…</> : <><i className="fa fa-check" style={{ marginRight: 6 }} />Verificar código</>}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                {resendCooldown > 0
                  ? <p style={{ fontSize: 13, color: '#94a3b8' }}>Reenviar en <strong>{resendCooldown}s</strong></p>
                  : <button onClick={() => sendCode()} style={{ background: 'none', border: 'none', color: '#003580', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}><i className="fa fa-rotate-right" style={{ marginRight: 4 }} />Reenviar código</button>
                }
              </div>
            </>
          )}

          {/* Paso 3: Nueva contraseña */}
          {step === 'password' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, background: '#16a34a', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <i className="fa fa-key" style={{ fontSize: 22, color: '#fff' }} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>Nueva contraseña</h2>
              </div>
              {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}><i className="fa fa-circle-exclamation" style={{ marginRight: 6 }} />{error}</div>}
              <form onSubmit={resetPassword}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nueva contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fa fa-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }} />
                    <input type={showPwd ? 'text' : 'password'} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }} placeholder="Mínimo 8 caracteres" required autoFocus
                      style={{ width: '100%', padding: '10px 40px 10px 36px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                    <button type="button" onClick={() => setShowPwd((s) => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                      <i className={`fa ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                  {newPassword && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                        {[1, 2, 3].map((l) => <div key={l} style={{ flex: 1, height: 4, borderRadius: 2, background: l <= pwdStrength.level ? pwdStrength.color : '#e2e8f0', transition: 'background 0.2s' }} />)}
                      </div>
                      <span style={{ fontSize: 11, color: pwdStrength.color, fontWeight: 600 }}>{pwdStrength.label}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirmar contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fa fa-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }} />
                    <input type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={(e) => { setConfirmPwd(e.target.value); setError(''); }} placeholder="Repite la contraseña" required
                      style={{ width: '100%', padding: '10px 12px 10px 36px', border: `1px solid ${confirmPwd && confirmPwd !== newPassword ? '#dc2626' : '#d1d5db'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  {confirmPwd && confirmPwd !== newPassword && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Las contraseñas no coinciden</p>}
                </div>
                <button type="submit" className="search-btn" disabled={loading || newPassword.length < 8 || newPassword !== confirmPwd} style={{ marginTop: 0 }}>
                  {loading ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />Guardando…</> : <><i className="fa fa-check" style={{ marginRight: 6 }} />Cambiar contraseña</>}
                </button>
              </form>
            </>
          )}

          {/* Paso 4: Éxito */}
          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: '#dcfce7', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <i className="fa fa-check" style={{ fontSize: 28, color: '#16a34a' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>¡Contraseña actualizada!</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <button onClick={() => router.push('/login')} className="search-btn" style={{ marginTop: 0 }}>
                <i className="fa fa-right-to-bracket" style={{ marginRight: 6 }} />Ir al inicio de sesión
              </button>
            </div>
          )}

          {/* Indicador de pasos */}
          {step !== 'done' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
              {(['email', 'code', 'password'] as Step[]).map((s, i) => (
                <div key={s} style={{ width: step === s ? 20 : 8, height: 8, borderRadius: 4, background: step === s ? '#003580' : ['email', 'code', 'password'].indexOf(step) > i ? '#003580' : '#e2e8f0', transition: 'all 0.3s' }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
