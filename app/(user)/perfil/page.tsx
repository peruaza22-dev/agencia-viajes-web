'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function PerfilPage() {
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
  });

  // ✅ CLEANUP AUDITADO — sincroniza form con user si cambia
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
        email: user.email ?? '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(''); setSuccess('');
    try {
      await authFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setSuccess('Perfil actualizado correctamente');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al actualizar el perfil');
    } finally { setLoading(false); }
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-2xl font-bold font-poppins text-gray-800 mb-6">Mi Perfil</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.firstName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <div className="font-bold text-gray-800">{user?.firstName} {user?.lastName}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
              {user?.role && <div className="text-xs text-primary font-semibold uppercase mt-1">{user.role}</div>}
            </div>
          </div>

          {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-4">{success}</div>}
          {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">{err}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {(['firstName', 'lastName', 'email', 'phone'] as const).map((k) => (
                <div key={k}>
                  <label className="text-xs text-gray-400 uppercase block mb-1">
                    {k === 'firstName' ? 'Nombre' : k === 'lastName' ? 'Apellidos' : k === 'email' ? 'Email' : 'Teléfono'}
                  </label>
                  <input
                    type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
                    value={form[k]}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                    disabled={k === 'email'}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              ))}
            </div>
            <button type="submit" disabled={loading}
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60">
              {loading ? <><i className="fa fa-spinner fa-spin mr-2" />Guardando...</> : <><i className="fa fa-save mr-2" />Guardar Cambios</>}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
