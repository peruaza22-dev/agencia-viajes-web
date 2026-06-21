'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import ImageUploader from '../ui/ImageUploader';

interface Package {
  id: string | number;
  name?: string;
  city?: string;
  country?: string;
  origin?: string;
  destination?: string;
  nights: number;
  price: number;
  old_price?: number;
  image_url?: string;
  img?: string;
  includes?: string[];
  rating?: number;
  reviews?: number;
  is_featured?: boolean;
  is_active?: boolean;
  description?: string;
  created_at?: string;
}

const INCLUDES_OPTIONS = [
  'Vuelo', 'Hotel 3★', 'Hotel 4★', 'Hotel 5★',
  'Desayuno', 'Media Pensión', 'Pensión Completa', 'Todo Incluido',
  'Traslados', 'City Tour', 'Seguro de viaje', 'Guía turístico',
];

const EMPTY: Omit<Package, 'id'> = {
  city: '', country: '', origin: '', destination: '',
  nights: 3, price: 0, old_price: 0,
  image_url: '', includes: [], rating: 4.5, reviews: 0,
  is_featured: false, is_active: true, description: '',
};

const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 });
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface Props { role: AdminRole; }

export default function PackagesPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Package | null>(null);
  const [form, setForm]         = useState<Omit<Package, 'id'>>({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [view, setView]         = useState<'grid' | 'table'>('grid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/admin/packages`);
      const d = await r.json();
      setPackages(d.data || d.packages || []);
    } catch { setPackages([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, includes: [] });
    setError('');
    setShowForm(true);
  };

  const openEdit = (p: Package) => {
    setEditing(p);
    setForm({
      city: p.city || p.name || '',
      country: p.country || '',
      origin: p.origin || '',
      destination: p.destination || '',
      nights: p.nights || 3,
      price: p.price || 0,
      old_price: p.old_price || 0,
      image_url: p.image_url || p.img || '',
      includes: Array.isArray(p.includes) ? p.includes : [],
      rating: p.rating || 4.5,
      reviews: p.reviews || 0,
      is_featured: p.is_featured || false,
      is_active: p.is_active !== false,
      description: p.description || '',
    });
    setError('');
    setShowForm(true);
  };

  const toggleInclude = (inc: string) => {
    setForm(f => ({
      ...f,
      includes: f.includes?.includes(inc)
        ? f.includes.filter(i => i !== inc)
        : [...(f.includes || []), inc],
    }));
  };

  const save = async () => {
    if (!form.city?.trim()) { setError('El nombre/ciudad es obligatorio'); return; }
    if (!form.price || form.price <= 0) { setError('El precio debe ser mayor a 0'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, name: form.city };
      const url = editing
        ? `${API}/admin/packages/${editing.id}`
        : `${API}/admin/packages`;
      const r = await adminFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error?.message || 'Error al guardar');
      setShowForm(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string | number) => {
    if (!confirm('¿Eliminar este paquete?')) return;
    await adminFetch(`${API}/admin/packages/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleActive = async (p: Package) => {
    await adminFetch(`${API}/admin/packages/${p.id}`, {
      method: 'PUT', body: JSON.stringify({ is_active: !p.is_active }),
    });
    setPackages(ps => ps.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  const toggleFeatured = async (p: Package) => {
    await adminFetch(`${API}/admin/packages/${p.id}`, {
      method: 'PUT', body: JSON.stringify({ is_featured: !p.is_featured }),
    });
    setPackages(ps => ps.map(x => x.id === p.id ? { ...x, is_featured: !x.is_featured } : x));
  };

  const filtered = search
    ? packages.filter(p =>
        (p.city || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.country || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.destination || '').toLowerCase().includes(search.toLowerCase())
      )
    : packages;

  const discount = (p: Package) =>
    p.old_price && p.old_price > p.price
      ? Math.round((1 - p.price / p.old_price) * 100)
      : 0;

  return (
    <PermissionGuard allowed={can('packages_view')}>
      <div>
        {/* Filtros */}
        <div className="adm-filters">
          <div className="adm-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input placeholder="Buscar por ciudad, país o destino…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 4, border: '1px solid var(--adm-border)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              className={`adm-btn ${view === 'grid' ? 'primary' : 'ghost'}`}
              style={{ borderRadius: 0, border: 'none' }}
              onClick={() => setView('grid')}
              title="Vista tarjetas"
            >
              <i className="fa-solid fa-grip" />
            </button>
            <button
              className={`adm-btn ${view === 'table' ? 'primary' : 'ghost'}`}
              style={{ borderRadius: 0, border: 'none' }}
              onClick={() => setView('table')}
              title="Vista tabla"
            >
              <i className="fa-solid fa-list" />
            </button>
          </div>
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
          {can('packages_edit') && (
            <button className="adm-btn primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
              <i className="fa-solid fa-plus" /> Nuevo paquete
            </button>
          )}
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando paquetes…</span></div>
        ) : filtered.length === 0 ? (
          <div className="adm-card">
            <div className="adm-empty">
              <i className="fa-solid fa-suitcase-rolling" />
              <p>Sin paquetes. Crea el primero.</p>
              {can('packages_edit') && (
                <button className="adm-btn primary" style={{ marginTop: 12 }} onClick={openNew}>
                  <i className="fa-solid fa-plus" /> Crear paquete
                </button>
              )}
            </div>
          </div>
        ) : view === 'grid' ? (
          /* ── Vista GRID ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(p => (
              <div key={p.id} className="adm-card" style={{ overflow: 'hidden', opacity: p.is_active === false ? 0.6 : 1 }}>
                {/* Imagen */}
                <div style={{ height: 160, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                  {(p.image_url || p.img) ? (
                    <img
                      src={p.image_url || p.img}
                      alt={p.city || p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 40 }}>
                      <i className="fa-solid fa-image" />
                    </div>
                  )}
                  {/* Badges */}
                  <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.is_featured && (
                      <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                        <i className="fa-solid fa-star" style={{ marginRight: 3 }} />Destacado
                      </span>
                    )}
                    {p.is_active === false && (
                      <span style={{ background: '#64748b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                        Inactivo
                      </span>
                    )}
                  </div>
                  {discount(p) > 0 && (
                    <span style={{ position: 'absolute', top: 8, right: 8, background: '#ee1d25', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                      -{discount(p)}%
                    </span>
                  )}
                </div>

                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--adm-primary)', marginBottom: 2 }}>
                    {p.city || p.name}
                    {p.nights ? <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--adm-text-muted)', marginLeft: 6 }}>{p.nights} noches</span> : null}
                  </div>
                  {p.country && <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 8 }}><i className="fa-solid fa-location-dot" style={{ marginRight: 4 }} />{p.country}</div>}

                  {/* Incluye */}
                  {Array.isArray(p.includes) && p.includes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                      {p.includes.slice(0, 3).map(inc => (
                        <span key={inc} style={{ border: '1px solid var(--adm-border)', borderRadius: 12, padding: '2px 8px', fontSize: 10, color: 'var(--adm-text-muted)' }}>
                          <i className="fa-solid fa-check" style={{ marginRight: 3, color: 'var(--adm-primary)', fontSize: 9 }} />{inc}
                        </span>
                      ))}
                      {p.includes.length > 3 && (
                        <span style={{ fontSize: 10, color: 'var(--adm-text-muted)', padding: '2px 4px' }}>+{p.includes.length - 3} más</span>
                      )}
                    </div>
                  )}

                  {/* Precio */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                    <div>
                      {p.old_price && p.old_price > p.price && (
                        <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>{fmt(p.old_price)}</div>
                      )}
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--adm-primary)' }}>{fmt(p.price)}</div>
                      <div style={{ fontSize: 10, color: 'var(--adm-text-muted)' }}>por persona</div>
                    </div>
                    {p.rating && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                          <i className="fa-solid fa-star" style={{ marginRight: 3 }} />{p.rating}
                        </div>
                        {p.reviews ? <div style={{ fontSize: 10, color: 'var(--adm-text-muted)' }}>{p.reviews} reseñas</div> : null}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {can('packages_edit') && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="adm-btn outline sm" style={{ flex: 1 }} onClick={() => openEdit(p)}>
                        <i className="fa-solid fa-pen" /> Editar
                      </button>
                      <button
                        className={`adm-btn sm ${p.is_featured ? 'warning' : 'outline'}`}
                        title={p.is_featured ? 'Quitar destacado' : 'Destacar'}
                        onClick={() => toggleFeatured(p)}
                      >
                        <i className={`fa-${p.is_featured ? 'solid' : 'regular'} fa-star`} />
                      </button>
                      <button
                        className={`adm-btn sm ${p.is_active === false ? 'success' : 'outline'}`}
                        title={p.is_active === false ? 'Activar' : 'Desactivar'}
                        onClick={() => toggleActive(p)}
                      >
                        <i className={`fa-solid ${p.is_active === false ? 'fa-eye' : 'fa-eye-slash'}`} />
                      </button>
                      <button className="adm-btn danger icon-only sm" onClick={() => remove(p.id)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Vista TABLA ── */
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title">
                <i className="fa-solid fa-suitcase-rolling" />Paquetes
                <span className="adm-badge default">{filtered.length}</span>
              </span>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr><th>Paquete</th><th>Ruta</th><th>Noches</th><th>Precio</th><th>Estado</th><th>Creado</th>{can('packages_edit') && <th>Acciones</th>}</tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 44, height: 36, borderRadius: 6, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                            {(p.image_url || p.img)
                              ? <img src={p.image_url || p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}><i className="fa-solid fa-image" /></div>
                            }
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.city || p.name}</div>
                            {p.country && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{p.country}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="muted">{p.origin && p.destination ? `${p.origin} → ${p.destination}` : '—'}</td>
                      <td><span className="adm-badge default">{p.nights}n</span></td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{fmt(p.price)}</div>
                        {p.old_price && p.old_price > p.price && (
                          <div style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through' }}>{fmt(p.old_price)}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span className={`adm-badge ${p.is_active !== false ? 'success' : 'default'}`}>
                            {p.is_active !== false ? 'Activo' : 'Inactivo'}
                          </span>
                          {p.is_featured && <span className="adm-badge warning"><i className="fa-solid fa-star" /></span>}
                        </div>
                      </td>
                      <td className="muted">{fmtDate(p.created_at)}</td>
                      {can('packages_edit') && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="adm-btn outline icon-only sm" onClick={() => openEdit(p)}><i className="fa-solid fa-pen" /></button>
                            <button className="adm-btn danger icon-only sm" onClick={() => remove(p.id)}><i className="fa-solid fa-trash" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Modal crear/editar ── */}
        {showForm && (
          <div className="adm-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="adm-modal lg" onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title">
                  <i className="fa-solid fa-suitcase-rolling" style={{ marginRight: 8 }} />
                  {editing ? `Editar: ${editing.city || editing.name}` : 'Nuevo paquete vacacional'}
                </span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowForm(false)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-modal-body">
                {error && (
                  <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 6 }} />{error}
                  </div>
                )}

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Ciudad / Nombre *</label>
                    <input className="adm-input" placeholder="ej: Cancún, Bali, París…" value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">País</label>
                    <input className="adm-input" placeholder="ej: México, Indonesia…" value={form.country || ''} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                  </div>
                </div>

                <div className="adm-form-row cols-3">
                  <div className="adm-form-group">
                    <label className="adm-label">Origen (IATA)</label>
                    <input className="adm-input" placeholder="MAD" value={form.origin || ''} onChange={e => setForm(f => ({ ...f, origin: e.target.value.toUpperCase() }))} maxLength={3} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Destino (IATA)</label>
                    <input className="adm-input" placeholder="CUN" value={form.destination || ''} onChange={e => setForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))} maxLength={3} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Noches</label>
                    <input className="adm-input" type="number" min="1" max="30"
                      value={form.nights === 0 ? '' : form.nights}
                      placeholder="3"
                      onChange={e => setForm(f => ({ ...f, nights: e.target.value === '' ? 1 : Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Precio (€) *</label>
                    <input
                      className="adm-input" type="number" min="0" step="0.01"
                      value={form.price === 0 ? '' : form.price}
                      placeholder="0"
                      onChange={e => setForm(f => ({ ...f, price: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Precio anterior (€) <span style={{ fontWeight: 400, color: 'var(--adm-text-muted)' }}>opcional</span></label>
                    <input
                      className="adm-input" type="number" min="0" step="0.01"
                      value={form.old_price === 0 ? '' : (form.old_price || '')}
                      placeholder="0"
                      onChange={e => setForm(f => ({ ...f, old_price: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <ImageUploader
                  label="Imagen"
                  value={form.image_url || ''}
                  onChange={url => setForm(f => ({ ...f, image_url: url }))}
                  height={100}
                />

                <div className="adm-form-group">
                  <label className="adm-label">Descripción</label>
                  <textarea className="adm-textarea" rows={2} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción breve del paquete…" />
                </div>

                {/* Incluye */}
                <div className="adm-form-group">
                  <label className="adm-label">Incluye</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {INCLUDES_OPTIONS.map(inc => {
                      const isSelected = form.includes?.includes(inc);
                      return (
                        <button key={inc} type="button" onClick={() => toggleInclude(inc)}
                          style={{
                            padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                            border: `1.5px solid ${isSelected ? 'var(--adm-primary)' : 'var(--adm-border)'}`,
                            background: isSelected ? '#f0f4ff' : '#fff',
                            color: isSelected ? 'var(--adm-primary)' : 'var(--adm-text-muted)',
                            fontWeight: isSelected ? 600 : 400, transition: 'all 0.15s',
                          }}>
                          {isSelected && <i className="fa-solid fa-check" style={{ marginRight: 4, fontSize: 10 }} />}
                          {inc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Valoración (1-5)</label>
                    <input className="adm-input" type="number" min="1" max="5" step="0.1"
                      value={form.rating === 0 ? '' : (form.rating || '')}
                      placeholder="4.5"
                      onChange={e => setForm(f => ({ ...f, rating: e.target.value === '' ? 4.5 : Number(e.target.value) }))}
                    />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Nº reseñas</label>
                    <input className="adm-input" type="number" min="0"
                      value={form.reviews === 0 ? '' : (form.reviews || '')}
                      placeholder="0"
                      onChange={e => setForm(f => ({ ...f, reviews: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
                  <label className="adm-toggle">
                    <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                    <span className="adm-toggle-track" />
                    <span className="adm-toggle-label">Paquete activo (visible en el sitio)</span>
                  </label>
                  <label className="adm-toggle">
                    <input type="checkbox" checked={form.is_featured || false} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                    <span className="adm-toggle-track" />
                    <span className="adm-toggle-label">Destacado</span>
                  </label>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="adm-btn primary" onClick={save} disabled={saving}>
                  {saving
                    ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</>
                    : <><i className="fa-solid fa-save" /> {editing ? 'Guardar cambios' : 'Crear paquete'}</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
