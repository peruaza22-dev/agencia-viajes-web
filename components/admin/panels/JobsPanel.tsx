'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';

interface Job { id: string; title: string; department?: string; location?: string; type?: string; salary?: string; status: string; featured: boolean; published_at: string; }
interface Application { id: string; job_id: string; name: string; email: string; phone?: string; cover_letter?: string; status: string; created_at: string; }

const EMPTY_JOB = { title: '', department: '', location: '', type: 'Jornada Completa', salary: '', experience: '', description: '', status: 'active', featured: false };

interface Props { role: AdminRole; }

export default function JobsPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { can } = useAdminRole(role);

  const [jobs, setJobs]             = useState<Job[]>([]);
  const [applications, setApps]     = useState<Application[]>([]);
  const [tab, setTab]               = useState<'jobs' | 'applications'>('jobs');
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<any>(null);
  const [form, setForm]             = useState({ ...EMPTY_JOB });
  const [saving, setSaving]         = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/admin/jobs`);
      const d = await r.json();
      setJobs(d.data || d.jobs || []);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  }, []);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedJob ? `${API}/admin/jobs/${selectedJob}/applications` : `${API}/admin/job-applications`;
      const r = await adminFetch(url);
      const d = await r.json();
      setApps(d.data || d.applications || []);
    } catch { setApps([]); }
    finally { setLoading(false); }
  }, [selectedJob]);

  useEffect(() => { tab === 'jobs' ? loadJobs() : loadApps(); }, [tab, loadJobs, loadApps]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_JOB }); setShowForm(true); };
  const openEdit = (j: any) => { setEditing(j); setForm({ title: j.title, department: j.department || '', location: j.location || '', type: j.type || 'Jornada Completa', salary: j.salary || '', experience: j.experience || '', description: j.description || '', status: j.status, featured: j.featured }); setShowForm(true); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `${API}/admin/jobs/${editing.id}` : `${API}/admin/jobs`;
      await adminFetch(url, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setShowForm(false); loadJobs();
    } catch { /* silencioso */ }
    finally { setSaving(false); }
  };

  const updateAppStatus = async (id: string, status: string) => {
    await adminFetch(`${API}/admin/job-applications/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    setApps(as => as.map(a => a.id === id ? { ...a, status } : a));
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <PermissionGuard allowed={can('jobs_view')}>
      <div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className={`adm-btn ${tab === 'jobs' ? 'primary' : 'outline'}`} onClick={() => setTab('jobs')}>
            <i className="fa-solid fa-briefcase" /> Ofertas ({jobs.length})
          </button>
          <button className={`adm-btn ${tab === 'applications' ? 'primary' : 'outline'}`} onClick={() => setTab('applications')}>
            <i className="fa-solid fa-file-lines" /> Candidaturas ({applications.length})
          </button>
          {can('jobs_edit') && tab === 'jobs' && (
            <button className="adm-btn primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
              <i className="fa-solid fa-plus" /> Nueva oferta
            </button>
          )}
        </div>

        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando…</span></div>
        ) : tab === 'jobs' ? (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title"><i className="fa-solid fa-briefcase" />Ofertas de empleo</span>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Puesto</th><th>Departamento</th><th>Ubicación</th><th>Tipo</th><th>Estado</th><th>Publicado</th>{can('jobs_edit') && <th>Acciones</th>}</tr></thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr><td colSpan={7}><div className="adm-table-empty"><i className="fa-solid fa-briefcase" />Sin ofertas</div></td></tr>
                  ) : jobs.map(j => (
                    <tr key={j.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{j.title}</div>
                        {j.featured && <span className="adm-badge warning" style={{ fontSize: 10 }}><i className="fa-solid fa-star" /> Destacada</span>}
                      </td>
                      <td className="muted">{j.department || '—'}</td>
                      <td className="muted">{j.location || '—'}</td>
                      <td><span className="adm-badge default">{j.type || '—'}</span></td>
                      <td><span className={`adm-badge ${j.status === 'active' ? 'success' : 'danger'}`}>{j.status === 'active' ? 'Activa' : 'Inactiva'}</span></td>
                      <td className="muted">{fmtDate(j.published_at)}</td>
                      {can('jobs_edit') && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="adm-btn outline icon-only sm" onClick={() => openEdit(j)}><i className="fa-solid fa-pen" /></button>
                            <button className="adm-btn outline sm" onClick={() => { setSelectedJob(j.id); setTab('applications'); }}>
                              <i className="fa-solid fa-users" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="adm-card">
            <div className="adm-card-header">
              <span className="adm-card-title"><i className="fa-solid fa-file-lines" />Candidaturas</span>
              {selectedJob && <button className="adm-btn ghost sm" onClick={() => { setSelectedJob(null); loadApps(); }}>Ver todas</button>}
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Candidato</th><th>Email</th><th>Teléfono</th><th>Estado</th><th>Fecha</th>{can('jobs_edit') && <th>Acción</th>}</tr></thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr><td colSpan={6}><div className="adm-table-empty"><i className="fa-solid fa-file-lines" />Sin candidaturas</div></td></tr>
                  ) : applications.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.name}</td>
                      <td className="muted">{a.email}</td>
                      <td className="muted">{a.phone || '—'}</td>
                      <td>
                        {can('jobs_edit') ? (
                          <select className="adm-filter-select" style={{ padding: '3px 8px', fontSize: 11 }} value={a.status} onChange={e => updateAppStatus(a.id, e.target.value)}>
                            <option value="pending">Pendiente</option>
                            <option value="reviewing">En revisión</option>
                            <option value="interview">Entrevista</option>
                            <option value="accepted">Aceptado</option>
                            <option value="rejected">Rechazado</option>
                          </select>
                        ) : (
                          <span className="adm-badge default">{a.status}</span>
                        )}
                      </td>
                      <td className="muted">{fmtDate(a.created_at)}</td>
                      {can('jobs_edit') && (
                        <td>
                          {a.cover_letter && (
                            <button className="adm-btn outline sm" onClick={() => alert(a.cover_letter)} title="Ver carta">
                              <i className="fa-solid fa-eye" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal nueva oferta */}
        {showForm && (
          <div className="adm-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="adm-modal lg" onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title">{editing ? 'Editar oferta' : 'Nueva oferta de empleo'}</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowForm(false)}><i className="fa-solid fa-xmark" /></button>
              </div>
              <div className="adm-modal-body">
                <div className="adm-form-group"><label className="adm-label">Título del puesto *</label><input className="adm-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div className="adm-form-row">
                  <div className="adm-form-group"><label className="adm-label">Departamento</label><input className="adm-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
                  <div className="adm-form-group"><label className="adm-label">Ubicación</label><input className="adm-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                </div>
                <div className="adm-form-row">
                  <div className="adm-form-group"><label className="adm-label">Tipo</label>
                    <select className="adm-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {['Jornada Completa', 'Media Jornada', 'Freelance', 'Prácticas'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="adm-form-group"><label className="adm-label">Salario</label><input className="adm-input" placeholder="Ej: 30.000€ - 40.000€" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} /></div>
                </div>
                <div className="adm-form-group"><label className="adm-label">Descripción</label><textarea className="adm-textarea" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="adm-form-row">
                  <div className="adm-form-group"><label className="adm-label">Estado</label>
                    <select className="adm-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </div>
                  <div className="adm-form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                    <label className="adm-toggle">
                      <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                      <span className="adm-toggle-track" />
                      <span className="adm-toggle-label">Oferta destacada</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="adm-btn primary" onClick={save} disabled={saving || !form.title}>
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
