'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { useAuth } from '@/context/AuthContext';

interface SignupForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export default function SignupPage() {
  const { signup, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const prefillEmail = searchParams.get('email') || '';

  const [form, setForm] = useState<SignupForm>({ name: '', email: prefillEmail, phone: '', password: '' });
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  const upd = (k: keyof SignupForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const parts = form.name.trim().split(/\s+/);
    const firstName = parts[0] || form.name;
    const lastName = parts.slice(1).join(' ') || parts[0] || form.name;
    const res = await signup({ ...form, firstName, lastName });
    if (res.success) {
      setSuccess(res.message || 'Cuenta creada. Revisa tu email para confirmar.');
      setTimeout(() => router.push('/login'), 3000);
    } else {
      setErr(typeof res.error === 'string' ? res.error : 'Error al crear cuenta');
    }
  };

  const FIELDS = [
    { k: 'name' as const, label: 'Nombre completo', type: 'text', ph: 'Tu nombre' },
    { k: 'email' as const, label: 'Correo electrónico', type: 'email', ph: 'tu@email.com' },
    { k: 'phone' as const, label: 'Teléfono', type: 'tel', ph: '+34 600 000 000' },
    { k: 'password' as const, label: 'Contraseña', type: 'password', ph: 'Mínimo 8 caracteres' },
  ];

  return (
    <div id="body">
      <MobileNav />
      <Header />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: '#f5f8fb' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <i className="fa fa-user-plus" style={{ fontSize: 48, color: '#003580', display: 'block', marginBottom: 8 }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40' }}>Crear Cuenta</h2>
          </div>

          {err && (
            <div style={{ background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: 4, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              <i className="fa fa-exclamation-circle" style={{ marginRight: 6 }} />{err}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: '10px 14px', color: '#15803d', fontSize: 13, marginBottom: 16 }}>
              <i className="fa fa-check-circle" style={{ marginRight: 6 }} />{success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {FIELDS.map((f) => (
              <div key={f.k} className="input2" style={{ marginBottom: 12 }}>
                <span>{f.label}</span>
                <input type={f.type} value={form[f.k]} onChange={upd(f.k)} placeholder={f.ph} required />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#666', marginBottom: 16, cursor: 'pointer', lineHeight: 1.5 }}>
              <input type="checkbox" required style={{ marginTop: 2, accentColor: '#003580' }} />
              Acepto los{' '}
              <Link href="/coming-soon" style={{ color: '#003580' }}>Términos y Condiciones</Link>
              {' '}y la{' '}
              <Link href="/coming-soon" style={{ color: '#003580' }}>Política de Privacidad</Link>
            </label>
            <button type="submit" className="search-btn" disabled={loading} style={{ marginTop: 0, opacity: loading ? 0.6 : 1 }}>
              {loading
                ? <><i className="fa fa-spinner fa-spin" style={{ marginRight: 6 }} />Creando cuenta...</>
                : <><i className="fa fa-user-plus" style={{ marginRight: 6 }} />Crear Cuenta</>
              }
            </button>
          </form>

          <div style={{ borderTop: '1px solid #e5e5e5', margin: '20px 0', textAlign: 'center', paddingTop: 16, fontSize: 13 }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: '#003580', fontWeight: 700 }}>Iniciar sesión</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
