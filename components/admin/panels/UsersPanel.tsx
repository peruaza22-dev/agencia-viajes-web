'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

// Descripción de cada rol para que el admin entienda qué puede hacer cada uno
const ROLE_INFO: Record<string, { label: string; color: string; desc: string; icon: string }> = {
  admin:   { label: 'Administrador', color: '#1e293b', desc: 'Acceso total al sistema',                          icon: 'fa-shield-halved' },
  manager: { label: 'Manager',       color: '#1d4ed8', desc: 'Todo excepto configuración del sistema',           icon: 'fa-user-tie' },
  agent:   { label: 'Agente',        color: '#0d9488', desc: 'Reservas, soporte y clientes',                     icon: 'fa-headset' },
  editor:  { label: 'Editor',        color: '#7c3aed', desc: 'Blog, destinos, paquetes y empleos',               icon: 'fa-pen-nib' },
  viewer:  { label: 'Visualizador',  color: '#64748b', desc: 'Solo lectura, sin modificar nada',                 icon: 'fa-eye' },
  user:    { label: 'Cliente',       color: '#94a3b8', desc: 'Usuario normal del sitio web',                     icon: 'fa-user' },
};

const STAFF_ROLES = ['admin', 'manager', 'agent', 'editor', 'viewer'];
const ALL_ROLES   = [...STAFF_ROLES, 'user'];

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const getName = (u: User) =>
  u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';

interface Props { role: AdminRole; }

export default function UsersPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can, isAdmin } = useAdminRole(role);

  const [users, setUsers]         = useState<User[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [page, setPage]           = useState(0);
  const [updating, setUpdating]   = useState<string | null>(null);
  const [tab, setTab]             = useState<'staff' | 'clients'>('staff'); // ← tabs separados

  // Modal crear/editar empleado
  const [showForm, setShowForm]   = useState(false);
  const [editUser, setEditUser]   = useState<User | null>(null);
  const [form, setForm]           = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'agent', password: '', is_active: true });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Modal reset contraseña
  const [showPwd, setShowPwd]     = useState(false);
  const [pwdUser, setPwdUser]     = useState<User | null>(null);
  const [newPwd, setNewPwd]       = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg]       = useState('');

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT), offset: String(page * LIMIT),
        // Si estamos en tab staff filtramos solo roles de staff, si no solo 'user'
        ...(tab === 'staff'
          ? (filter !== 'all' ? { role: filter } : { roles: STAFF_ROLES.join(',') })
          : { role: 'user' }
        ),
      });
      const r = await adminFetch(`${API}/admin/users?${params}`);
      const d = await r.json();
      if (d.success) { setUsers(d.data || []); setTotal(d.pagination?.total || 0); }
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [page, filter, tab]);

  useEffect(() => { load(); }, [load]);

  // ── Crear empleado ──────────────────────────────────────────
  const openCreate = () => {
    setEditUser(null);
    setForm({ first_name: '', last_name: '', email: '', phone: '', role: 'agent', password: '', is_active: true });
    setFormError(''); setFormSuccess('');
    setShowForm(true);
  };

  // ── Editar usuario (empleado o cliente) ────────────────────
  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({
      first_name: u.first_name || (u.full_name?.split(' ')[0]) || '',
      last_name:  u.last_name  || (u.full_name?.split(' ').slice(1).join(' ')) || '',
      email:      u.email,
      phone:      u.phone || '',
      // Si es cliente y se quiere promover, sugerimos 'agent'; si ya es staff, mantener su rol
      role: u.role === 'user' ? 'user' : u.role,
      password:   '',
      is_active:  u.is_active,
    });
    setFormError(''); setFormSuccess('');
    setShowForm(true);
  };

  const saveUser = async () => {
    if (!form.email.trim()) { setFormError('El email es obligatorio'); return; }
    if (!editUser && form.password.length < 8) { setFormError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (!form.first_name.trim()) { setFormError('El nombre es obligatorio'); return; }

    setSaving(true); setFormError(''); setFormSuccess('');
    try {
      if (editUser) {
        // Actualizar usuario existente
        const r = await adminFetch(`${API}/admin/users/${editUser.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            first_name: form.first_name,
            last_name:  form.last_name,
            full_name:  `${form.first_name} ${form.last_name}`.trim(),
            phone:      form.phone,
            role:       form.role,
            is_active:  form.is_active,
          }),
        });        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message || 'Error al actualizar');
        setFormSuccess('Datos actualizados correctamente');
        // Si cambió de cliente a empleado, quitar de la lista de clientes
        if (editUser.role === 'user' && form.role !== 'user') {
          setUsers(us => us.filter(u => u.id !== editUser.id));
        } else {
          setUsers(us => us.map(u => u.id === editUser.id
            ? { ...u, first_name: form.first_name, last_name: form.last_name, full_name: `${form.first_name} ${form.last_name}`.trim(), phone: form.phone, role: form.role, is_active: form.is_active }
            : u
          ));
        }
        load();
      } else {
        // Crear nuevo usuario (llama al endpoint de admin que no requiere confirmación de email)
        const r = await adminFetch(`${API}/auth/admin/create-user`, {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            name: form.first_name,
            firstName: form.first_name,
            lastName: form.last_name,
            phone: form.phone,
            role: form.role,
          }),
        });
        const d = await r.json();
        if (!d.success) throw new Error(d.error?.message || 'Error al crear usuario');
        setFormSuccess(`✓ Empleado creado. Email: ${form.email} · Contraseña: ${form.password}`);
        load();
        // Limpiar form pero mantener modal abierto para ver las credenciales
        setForm(f => ({ ...f, password: '' }));
      }
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Cambiar rol inline ──────────────────────────────────────
  const changeRole = async (id: string, newRole: string, currentRole: string) => {
    if (newRole === 'admin') {
      const ok = confirm(
        '⚠️ ATENCIÓN\n\nEstás a punto de dar acceso TOTAL al sistema a este usuario.\n\nEsto incluye: configuración, todos los datos, crear/eliminar empleados.\n\n¿Estás seguro?'
      );
      if (!ok) return;
    }
    if (currentRole === 'admin' && newRole !== 'admin') {
      const ok = confirm('¿Quitar el rol de Administrador a este usuario?');
      if (!ok) return;
    }
    if (newRole === 'user') {
      const ok = confirm('¿Convertir este empleado en cliente? Perderá acceso al panel de administración.');
      if (!ok) return;
    }
    setUpdating(id);
    try {
      await adminFetch(`${API}/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
      // Si se cambió a 'user', quitar de la lista de empleados
      if (newRole === 'user') {
        setUsers(us => us.filter(u => u.id !== id));
        setTotal(t => t - 1);
      } else {
        setUsers(us => us.map(u => u.id === id ? { ...u, role: newRole } : u));
      }
    } catch { /* silencioso */ }
    finally { setUpdating(null); }
  };

  // ── Activar / desactivar ────────────────────────────────────
  const toggleActive = async (id: string, current: boolean) => {
    setUpdating(id);
    try {
      await adminFetch(`${API}/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !current }) });
      setUsers(us => us.map(u => u.id === id ? { ...u, is_active: !current } : u));
    } catch { /* silencioso */ }
    finally { setUpdating(null); }
  };

  // ── Reset contraseña ────────────────────────────────────────
  const openResetPwd = (u: User) => {
    setPwdUser(u); setNewPwd(''); setPwdMsg(''); setShowPwd(true);
  };

  const resetPassword = async () => {
    if (!pwdUser || newPwd.length < 8) { setPwdMsg('Mínimo 8 caracteres'); return; }
    setPwdSaving(true); setPwdMsg('');
    try {
      const r = await adminFetch(`${API}/admin/users/${pwdUser.id}/reset-password`, {
        method: 'POST', body: JSON.stringify({ password: newPwd }),
      });
      const d = await r.json();
      if (d.success) { setPwdMsg(`✓ Contraseña actualizada para ${pwdUser.email}`); setNewPwd(''); }
      else setPwdMsg(d.error?.message || 'Error al cambiar contraseña');
    } catch { setPwdMsg('Error de conexión'); }
    finally { setPwdSaving(false); }
  };

  const filtered = search
    ? users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        getName(u).toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const totalPages = Math.ceil(total / LIMIT);

  // Contar empleados (roles de staff)
  const staffCount = users.filter(u => STAFF_ROLES.includes(u.role)).length;

  return (
    <PermissionGuard allowed={can('users_view')}>
      <div>
        {/* ── Tabs Empleados / Clientes ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`adm-btn ${tab === 'staff' ? 'primary' : 'outline'}`}
            onClick={() => { setTab('staff'); setFilter('all'); setPage(0); setSearch(''); }}
          >
            <i className="fa-solid fa-id-badge" /> Empleados
            <span className="adm-badge" style={{ background: tab === 'staff' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', color: tab === 'staff' ? '#fff' : '#64748b', marginLeft: 4 }}>
              {users.filter(u => STAFF_ROLES.includes(u.role)).length || (tab === 'staff' ? total : '—')}
            </span>
          </button>
          <button
            className={`adm-btn ${tab === 'clients' ? 'primary' : 'outline'}`}
            onClick={() => { setTab('clients'); setFilter('all'); setPage(0); setSearch(''); }}
          >
            <i className="fa-solid fa-users" /> Clientes
            <span className="adm-badge" style={{ background: tab === 'clients' ? 'rgba(255,255,255,0.25)' : '#f1f5f9', color: tab === 'clients' ? '#fff' : '#64748b', marginLeft: 4 }}>
              {tab === 'clients' ? total : '—'}
            </span>
          </button>
        </div>

        {/* ── Filtros ── */}
        <div className="adm-filters">
          <div className="adm-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              placeholder={tab === 'staff' ? 'Buscar empleado…' : 'Buscar cliente por nombre o email…'}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Filtro de rol solo en tab empleados */}
          {tab === 'staff' && (
            <select className="adm-filter-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
              <option value="all">Todos los roles</option>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_INFO[r].label}</option>)}
            </select>
          )}
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
          {can('export') && (
            <button className="adm-btn outline sm" onClick={() => window.open(`${API}/admin/export/users?format=csv`, '_blank')}>
              <i className="fa-solid fa-file-csv" /> CSV
            </button>
          )}
          {/* Nuevo empleado solo en tab staff */}
          {tab === 'staff' && can('users_edit') && (
            <button className="adm-btn primary" style={{ marginLeft: 'auto' }} onClick={openCreate}>
              <i className="fa-solid fa-user-plus" /> Nuevo empleado
            </button>
          )}
        </div>

        {/* ── Contadores de roles (solo en tab staff) ── */}
        {tab === 'staff' && isAdmin && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
            {STAFF_ROLES.map(r => {
              const info = ROLE_INFO[r];
              const count = users.filter(u => u.role === r).length;
              return (
                <div key={r} onClick={() => { setFilter(r); setPage(0); }}
                  style={{ background: filter === r ? info.color + '12' : '#fff', border: `1.5px solid ${filter === r ? info.color : 'var(--adm-border)'}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: info.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`fa-solid ${info.icon}`} style={{ color: info.color, fontSize: 13 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--adm-text)', lineHeight: 1 }}>{count}</div>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{info.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabla */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-users" />
              Usuarios
              <span className="adm-badge default">{total}</span>
              {staffCount > 0 && <span className="adm-badge info">{staffCount} empleados</span>}
            </span>
          </div>
          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Empleado / Cliente</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    {can('users_edit') && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7}><div className="adm-table-empty"><i className="fa-solid fa-users" />Sin usuarios</div></td></tr>
                  ) : filtered.map(u => {
                    const info = ROLE_INFO[u.role] || ROLE_INFO.user;
                    const isStaff = STAFF_ROLES.includes(u.role);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: info.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                              {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{getName(u)}</div>
                              {isStaff && <div style={{ fontSize: 10, color: info.color, fontWeight: 700 }}><i className={`fa-solid ${info.icon}`} style={{ marginRight: 3 }} />{info.label}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="muted">{u.email}</td>
                        <td className="muted">{u.phone || '—'}</td>
                        <td>
                          {can('users_edit') && tab === 'staff' ? (
                            // Empleados: select con roles de staff + cliente + confirmación para admin
                            <select
                              className="adm-filter-select"
                              style={{ padding: '4px 8px', fontSize: 12, borderColor: info.color + '44' }}
                              value={u.role}
                              disabled={updating === u.id}
                              onChange={e => changeRole(u.id, e.target.value, u.role)}
                            >
                              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_INFO[r]?.label || r}</option>)}
                            </select>
                          ) : tab === 'clients' && can('users_edit') ? (
                            // Clientes: solo badge + botón para promover a empleado
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="adm-badge default"><i className="fa-solid fa-user" style={{ marginRight: 3 }} />Cliente</span>
                              <button
                                className="adm-btn outline sm"
                                title="Promover a empleado"
                                onClick={() => openEdit(u)}
                                style={{ fontSize: 10, padding: '2px 8px' }}
                              >
                                <i className="fa-solid fa-arrow-up" /> Promover
                              </button>
                            </div>
                          ) : (
                            <span className={`adm-role ${u.role}`}>{info.label}</span>
                          )}
                        </td>
                        <td>
                          <span className={`adm-badge ${u.is_active ? 'success' : 'danger'}`}>
                            <i className={`fa-solid ${u.is_active ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
                            {u.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="muted">{fmtDate(u.created_at)}</td>
                        {can('users_edit') && (
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {/* Editar */}
                              <button className="adm-btn outline icon-only sm" title="Editar datos" onClick={() => openEdit(u)}>
                                <i className="fa-solid fa-pen" />
                              </button>
                              {/* Reset contraseña — solo para empleados */}
                              {isStaff && (
                                <button className="adm-btn outline icon-only sm" title="Cambiar contraseña" onClick={() => openResetPwd(u)}>
                                  <i className="fa-solid fa-key" />
                                </button>
                              )}
                              {/* Activar / desactivar */}
                              <button
                                className={`adm-btn ${u.is_active ? 'danger' : 'success'} icon-only sm`}
                                title={u.is_active ? 'Desactivar acceso' : 'Activar acceso'}
                                disabled={updating === u.id}
                                onClick={() => toggleActive(u.id, u.is_active)}
                              >
                                <i className={`fa-solid ${u.is_active ? 'fa-user-slash' : 'fa-user-check'}`} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="adm-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>{page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} de {total}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="adm-btn outline sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><i className="fa-solid fa-chevron-left" /></button>
                <span style={{ padding: '5px 10px', fontSize: 12 }}>{page + 1} / {totalPages}</span>
                <button className="adm-btn outline sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><i className="fa-solid fa-chevron-right" /></button>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal crear / editar empleado ── */}
        {showForm && (
          <div className="adm-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="adm-modal" onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title">
                  <i className={`fa-solid ${editUser ? (editUser.role === 'user' ? 'fa-user-pen' : 'fa-user-pen') : 'fa-user-plus'}`} style={{ marginRight: 8 }} />
                  {editUser
                    ? editUser.role === 'user'
                      ? `Editar cliente: ${getName(editUser)}`
                      : `Editar: ${getName(editUser)}`
                    : 'Crear nuevo empleado'
                  }
                </span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowForm(false)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-modal-body">
                {formError && (
                  <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 6 }} />{formError}
                  </div>
                )}
                {formSuccess && (
                  <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13, lineHeight: 1.6 }}>
                    <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }} />{formSuccess}
                    <div style={{ marginTop: 6, fontSize: 12, color: '#166534' }}>Guarda estas credenciales y compártelas con el empleado de forma segura.</div>
                  </div>
                )}

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Nombre *</label>
                    <input className="adm-input" placeholder="Juan" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Apellido</label>
                    <input className="adm-input" placeholder="Pérez" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-label">Email *</label>
                  <input className="adm-input" type="email" placeholder="empleado@tuagencia.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!!editUser} />
                  {editUser && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3 }}>El email no se puede cambiar.</div>}
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Teléfono</label>
                    <input className="adm-input" placeholder="+34 600 000 000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Rol *</label>
                    <select className="adm-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {/* Si es cliente, mostrar opción cliente + todos los roles de staff */}
                      {editUser?.role === 'user' && <option value="user">Cliente (sin acceso al panel)</option>}
                      {STAFF_ROLES.map(r => (
                        <option key={r} value={r}>{ROLE_INFO[r].label}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 4 }}>
                      <i className={`fa-solid ${ROLE_INFO[form.role]?.icon}`} style={{ color: ROLE_INFO[form.role]?.color, marginRight: 4 }} />
                      {form.role === 'user' ? 'Usuario normal del sitio web, sin acceso al panel admin' : ROLE_INFO[form.role]?.desc}
                    </div>
                  </div>
                </div>

                {/* Contraseña — solo al crear */}
                {!editUser && (
                  <div className="adm-form-group">
                    <label className="adm-label">Contraseña temporal *</label>
                    <input className="adm-input" type="text" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                    <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3 }}>
                      El empleado podrá cambiarla después desde su perfil.
                    </div>
                  </div>
                )}

                {editUser && (
                  <label className="adm-toggle" style={{ marginTop: 4 }}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                    <span className="adm-toggle-track" />
                    <span className="adm-toggle-label">Cuenta activa (puede iniciar sesión)</span>
                  </label>
                )}
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowForm(false)}>
                  {formSuccess ? 'Cerrar' : 'Cancelar'}
                </button>
                {!formSuccess && (
                  <button className="adm-btn primary" onClick={saveUser} disabled={saving}>
                    {saving
                      ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</>
                      : editUser
                        ? <><i className="fa-solid fa-save" /> Guardar cambios</>
                        : <><i className="fa-solid fa-user-plus" /> Crear empleado</>
                    }
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Modal reset contraseña ── */}
        {showPwd && pwdUser && (
          <div className="adm-modal-overlay" onClick={() => setShowPwd(false)}>
            <div className="adm-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title"><i className="fa-solid fa-key" style={{ marginRight: 8 }} />Cambiar contraseña</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowPwd(false)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-modal-body">
                <div style={{ background: '#f8fafc', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
                  <i className="fa-solid fa-user" style={{ marginRight: 6, color: 'var(--adm-text-muted)' }} />
                  <strong>{getName(pwdUser)}</strong> — {pwdUser.email}
                </div>
                {pwdMsg && (
                  <div style={{ background: pwdMsg.startsWith('✓') ? '#dcfce7' : '#fee2e2', color: pwdMsg.startsWith('✓') ? '#15803d' : '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                    {pwdMsg}
                  </div>
                )}
                <div className="adm-form-group">
                  <label className="adm-label">Nueva contraseña</label>
                  <input className="adm-input" type="text" placeholder="Mínimo 8 caracteres" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3 }}>Comparte esta contraseña con el empleado de forma segura.</div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowPwd(false)}>Cerrar</button>
                <button className="adm-btn primary" onClick={resetPassword} disabled={pwdSaving || newPwd.length < 8}>
                  {pwdSaving ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Cambiando…</> : <><i className="fa-solid fa-key" /> Cambiar contraseña</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
