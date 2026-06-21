'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import ImageUploader from '../ui/ImageUploader';

interface Destination {
  id: string;
  name: string;
  country: string;
  description?: string;
  image_url?: string;
  category: string;
  price: number;
  is_featured: boolean;
}

const CATEGORIES = ['ciudad', 'playa', 'montana', 'aventura', 'cultural', 'rural'];
const EMPTY = { name: '', country: '', description: '', image_url: '', category: 'ciudad', price: 0, is_featured: false };

interface Props { role: AdminRole; }

export default function DestinationsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [items, setItems]       = useState<Destination[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Destination | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Intentar Supabase primero, fallback a mock
      const r = await adminFetch(`${API}/admin/destinations`);
      const d = await r.json();
      setItems(d.data || d.destinations || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY }); setShowForm(true); };
  const openEdit = (d: Destination) => { setEditing(d); setForm({ name: d.name, country: d.country, description: d.description || '', image_url: d.image_url || '', category: d.category, price: d.price, is_featured: d.is_featured }); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim() || !form.country.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `${API}/admin/destinations/${editing.id}` : `${API}/admin/destinations`;
      await adminFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setShowForm(false); load();
    } catch { /* silencioso */ }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este destino?')) return;
    await adminFetch(`${API}/admin/destinations/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleFeatured = async (d: Destination) => {
    await adminFetch(`${API}/admin/destinations/${d.id}`, { method: 'PUT', body: JSON.stringify({ is_featured: !d.is_featured }) });
    setItems(its => its.map(i => i.id === d.id ? { ...i, is_featured: !i.is_featured } : i));
  };

  const filtered = search ? items.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.country.toLowerCase().includes(search.toLowerCase())) : items;

  return (
    <PermissionGuard allowed={can('destinations_view')}>
      <div>
        <div className="adm-filters">
          <div className="adm-search">
            <i className="fa-solid fa-magnifying-glass" />
            <input placeholder="Buscar destino o país…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="adm-btn outline sm" onClick={load}><i className="fa-solid fa-arrows-rotate" /></button>
          {can('destinations_edit') && (
            <button className="adm-btn primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
              <i className="fa-solid fa-plus" /> Nuevo destino
            </button>
          )}
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {filtered.length === 0 && (
              <div className="adm-card" style={{ gridColumn: '1/-1' }}>
                <div className="adm-empty"><i className="fa-solid fa-map-location-dot" /><p>Sin destinos. Añade el primero.</p></div>
              </div>
            )}
            {filtered.map(d => (
              <div key={d.id} className="adm-card" style={{ overflow: 'hidden' }}>
                <div style={{ height: 140, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                  {d.image_url
                    ? <img src={d.image_url} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 40 }}><i className="fa-solid fa-image" /></div>
                  }
                  {d.is_featured && (
                    <span style={{ position: 'absolute', top: 8, right: 8, background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                      <i className="fa-solid fa-star" /> Destacado
                    </span>
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 8 }}>
                    <i className="fa-solid fa-location-dot" style={{ marginRight: 4 }} />{d.country}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span className="adm-badge default">{d.category}</span>
                    {d.price > 0 && <span className="adm-badge info">desde {d.price}€</span>}
                  </div>
                  {can('destinations_edit') && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="adm-btn outline sm" style={{ flex: 1 }} onClick={() => openEdit(d)}>
                        <i className="fa-solid fa-pen" /> Editar
                      </button>
                      <button className={`adm-btn sm ${d.is_featured ? 'warning' : 'outline'}`} onClick={() => toggleFeatured(d)} title={d.is_featured ? 'Quitar destacado' : 'Destacar'}>
                        <i className={`fa-${d.is_featured ? 'solid' : 'regular'} fa-star`} />
                      </button>
                      <button className="adm-btn danger icon-only sm" onClick={() => remove(d.id)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="adm-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="adm-modal" onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title">{editing ? 'Editar destino' : 'Nuevo destino'}</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowForm(false)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-modal-body">
                <div className="adm-form-row">
                  <div className="adm-form-group"><label className="adm-label">Nombre *</label><input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div className="adm-form-group"><label className="adm-label">País *</label><input className="adm-input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
                </div>
                <div className="adm-form-group"><label className="adm-label">Descripción</label><textarea className="adm-textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <ImageUploader
                  label="Imagen"
                  value={form.image_url || ''}
                  onChange={url => setForm(f => ({ ...f, image_url: url }))}
                  height={90}
                />
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Categoría</label>
                    <select className="adm-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="adm-form-group"><label className="adm-label">Precio desde (€)</label>
                    <input
                      className="adm-input"
                      type="number" min="0"
                      value={form.price === 0 ? '' : form.price}
                      placeholder="0"
                      onChange={e => setForm(f => ({ ...f, price: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <label className="adm-toggle">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  <span className="adm-toggle-track" />
                  <span className="adm-toggle-label">Mostrar como destino destacado</span>
                </label>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="adm-btn primary" onClick={save} disabled={saving || !form.name || !form.country}>
                  {saving ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Guardando…</> : <><i className="fa-solid fa-save" /> Guardar</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
