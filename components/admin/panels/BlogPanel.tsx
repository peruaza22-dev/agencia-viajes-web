'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import ImageUploader from '../ui/ImageUploader';
import WysiwygEditor from '../ui/WysiwygEditor';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  author_name?: string;
  category?: string;
  is_published: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  title: '', slug: '', excerpt: '', content: '',
  featured_image: '', author_name: '', category: 'travel', is_published: false,
};

const CATEGORIES = [
  { value: 'travel',       label: 'Viajes' },
  { value: 'tips',         label: 'Consejos' },
  { value: 'destinations', label: 'Destinos' },
  { value: 'news',         label: 'Novedades' },
  { value: 'guides',       label: 'Guías' },
];

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const toSlug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface Props { role: AdminRole; }

export default function BlogPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<string | null>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/admin/posts`);
      const d = await r.json();
      setPosts(d.posts || d.data || []);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setShowForm(true);
  };

  const openEdit = (p: Post) => {
    setEditing(p.id);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt || '',
      content: p.content || '', featured_image: p.featured_image || '',
      author_name: p.author_name || '', category: p.category || 'travel',
      is_published: p.is_published,
    });
    setError('');
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) { setError('El título es obligatorio'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, slug: form.slug || toSlug(form.title) };
      const url = editing ? `${API}/admin/posts/${editing}` : `${API}/admin/posts`;
      const r = await adminFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error al guardar');
      setShowForm(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este post?')) return;
    try {
      await adminFetch(`${API}/admin/posts/${id}`, { method: 'DELETE' });
      setPosts(ps => ps.filter(p => p.id !== id));
    } catch { /* silencioso */ }
  };

  const togglePublish = async (p: Post) => {
    try {
      await adminFetch(`${API}/admin/posts/${p.id}`, {
        method: 'PUT', body: JSON.stringify({ is_published: !p.is_published }),
      });
      setPosts(ps => ps.map(x => x.id === p.id ? { ...x, is_published: !x.is_published } : x));
    } catch { /* silencioso */ }
  };

  return (
    <PermissionGuard allowed={can('blog_view')}>
      <div>
        <div className="adm-filters">
          <span style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>{posts.length} artículos</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="adm-btn outline sm" onClick={load}>
              <i className="fa-solid fa-arrows-rotate" />
            </button>
            {can('blog_edit') && (
              <button className="adm-btn primary" onClick={openNew}>
                <i className="fa-solid fa-plus" /> Nuevo post
              </button>
            )}
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title"><i className="fa-solid fa-newspaper" />Blog</span>
          </div>
          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Título</th>
                    <th>Categoría</th>
                    <th>Autor</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    {can('blog_edit') && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr><td colSpan={7}><div className="adm-table-empty"><i className="fa-solid fa-newspaper" />Sin posts</div></td></tr>
                  ) : posts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ width: 48, height: 36, borderRadius: 6, overflow: 'hidden', background: '#f1f5f9' }}>
                          {p.featured_image
                            ? <img src={p.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}><i className="fa-solid fa-image" /></div>
                          }
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{p.slug}</div>
                      </td>
                      <td><span className="adm-badge default">{p.category}</span></td>
                      <td className="muted">{p.author_name || '—'}</td>
                      <td>
                        {can('blog_edit') ? (
                          <button
                            className={`adm-badge ${p.is_published ? 'success' : 'default'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            onClick={() => togglePublish(p)}
                            title="Click para cambiar estado"
                          >
                            {p.is_published ? 'Publicado' : 'Borrador'}
                          </button>
                        ) : (
                          <span className={`adm-badge ${p.is_published ? 'success' : 'default'}`}>
                            {p.is_published ? 'Publicado' : 'Borrador'}
                          </span>
                        )}
                      </td>
                      <td className="muted">{fmtDate(p.created_at)}</td>
                      {can('blog_edit') && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="adm-btn outline icon-only sm" title="Editar" onClick={() => openEdit(p)}>
                              <i className="fa-solid fa-pen" />
                            </button>
                            <button className="adm-btn danger icon-only sm" title="Eliminar" onClick={() => remove(p.id)}>
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showForm && (
          <div className="adm-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="adm-modal lg" onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title">{editing ? 'Editar post' : 'Nuevo post'}</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowForm(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <div className="adm-modal-body">
                {error && (
                  <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                    {error}
                  </div>
                )}
                <div className="adm-form-group">
                  <label className="adm-label">Título *</label>
                  <input className="adm-input" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: editing ? f.slug : toSlug(e.target.value) }))} />
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Slug (URL)</label>
                    <input className="adm-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Categoría</label>
                    <select className="adm-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">Extracto</label>
                  <textarea className="adm-textarea" rows={2} value={form.excerpt}
                    onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} />
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">Imagen destacada</label>
                  <ImageUploader
                    value={form.featured_image}
                    onChange={url => setForm(f => ({ ...f, featured_image: url }))}
                    placeholder="https://… o sube desde PC"
                    height={80}
                  />
                </div>
                <div className="adm-form-group">
                  <label className="adm-label">Contenido</label>
                  <WysiwygEditor
                    value={form.content}
                    onChange={html => setForm(f => ({ ...f, content: html }))}
                    minHeight={360}
                  />
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group">
                    <label className="adm-label">Autor</label>
                    <input className="adm-input" value={form.author_name}
                      onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} />
                  </div>
                </div>
                <label className="adm-toggle">
                  <input type="checkbox" checked={form.is_published}
                    onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
                  <span className="adm-toggle-track" />
                  <span className="adm-toggle-label">Publicar inmediatamente</span>
                </label>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="adm-btn primary" onClick={save} disabled={saving}>
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
