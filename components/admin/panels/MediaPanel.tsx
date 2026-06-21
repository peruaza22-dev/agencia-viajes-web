'use client';

/**
 * MediaPanel — Gestión de imágenes subidas a Supabase Storage
 * Permite ver, copiar URL y eliminar archivos del bucket site-media
 */
import { useEffect, useState, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useAdminRole, AdminRole } from '@/hooks/useAdminRole';
import PermissionGuard from '@/components/admin/layout/PermissionGuard';
import ImageUploader from '../ui/ImageUploader';

interface MediaFile {
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
}

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

interface Props { role: AdminRole; }

export default function MediaPanel({ role }: Props) {
  const { adminFetch, API } = useAdminFetch();
  const { isAdmin, isManager } = useAdminRole(role);

  const [files, setFiles]         = useState<MediaFile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [copied, setCopied]       = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');

  const canEdit = isAdmin || isManager;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminFetch(`${API}/media`);
      const d = await r.json();
      setFiles(d.data || []);
    } catch { setFiles([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteFile = async (filename: string) => {
    if (!confirm(`¿Eliminar "${filename}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(filename);
    try {
      await adminFetch(`${API}/media/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      setFiles(fs => fs.filter(f => f.name !== filename));
    } catch { /* silencioso */ }
    finally { setDeleting(null); }
  };

  const filtered = search
    ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);

  return (
    <PermissionGuard allowed={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header con stats */}
        <div className="adm-card">
          <div className="adm-card-header">
            <span className="adm-card-title">
              <i className="fa-solid fa-images" />
              Biblioteca de medios
              <span className="adm-badge default">{files.length} archivos</span>
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>
                {fmtSize(totalSize)} usados
              </span>
              <button className="adm-btn outline sm" onClick={load}>
                <i className="fa-solid fa-arrows-rotate" />
              </button>
              {canEdit && (
                <button className="adm-btn primary" onClick={() => setShowUpload(true)}>
                  <i className="fa-solid fa-upload" /> Subir imagen
                </button>
              )}
            </div>
          </div>

          {/* Buscador */}
          <div style={{ padding: '0 20px 16px' }}>
            <div className="adm-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Buscar por nombre de archivo…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Grid de imágenes */}
        {loading ? (
          <div className="adm-loading"><div className="adm-spinner" /><span>Cargando archivos…</span></div>
        ) : filtered.length === 0 ? (
          <div className="adm-card">
            <div className="adm-empty" style={{ padding: 60 }}>
              <i className="fa-solid fa-images" style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }} />
              <p>{search ? `Sin resultados para "${search}"` : 'No hay imágenes subidas todavía.'}</p>
              {canEdit && !search && (
                <button className="adm-btn primary" style={{ marginTop: 12 }} onClick={() => setShowUpload(true)}>
                  <i className="fa-solid fa-upload" /> Subir primera imagen
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {filtered.map(f => (
              <div key={f.name} className="adm-card" style={{ overflow: 'hidden', padding: 0 }}>
                {/* Preview */}
                <div style={{ height: 140, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={f.url}
                    alt={f.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        parent.style.display = 'flex';
                        parent.style.alignItems = 'center';
                        parent.style.justifyContent = 'center';
                        parent.innerHTML = '<i class="fa-solid fa-file-image" style="font-size:40px;color:#cbd5e1"></i>';
                      }
                    }}
                  />
                </div>

                {/* Info */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>
                    {f.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 10 }}>
                    {fmtSize(f.size)} · {fmtDate(f.created_at)}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="adm-btn outline sm"
                      style={{ flex: 1, fontSize: 11 }}
                      onClick={() => copyUrl(f.url)}
                      title="Copiar URL"
                    >
                      {copied === f.url
                        ? <><i className="fa-solid fa-check" style={{ color: 'var(--adm-success)' }} /> Copiado</>
                        : <><i className="fa-solid fa-copy" /> Copiar URL</>
                      }
                    </button>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="adm-btn ghost icon-only sm"
                      title="Abrir en nueva pestaña"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square" />
                    </a>
                    {canEdit && (
                      <button
                        className="adm-btn danger icon-only sm"
                        onClick={() => deleteFile(f.name)}
                        disabled={deleting === f.name}
                        title="Eliminar"
                      >
                        {deleting === f.name
                          ? <div className="adm-spinner" style={{ width: 12, height: 12 }} />
                          : <i className="fa-solid fa-trash" />
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal subir imagen */}
        {showUpload && (
          <div className="adm-modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="adm-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
              <div className="adm-modal-header">
                <span className="adm-modal-title"><i className="fa-solid fa-upload" style={{ marginRight: 8 }} />Subir imagen</span>
                <button className="adm-btn ghost icon-only sm" onClick={() => setShowUpload(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              <div className="adm-modal-body">
                <ImageUploader
                  label="Selecciona o arrastra una imagen"
                  value={uploadUrl}
                  onChange={url => {
                    setUploadUrl(url);
                    if (url) {
                      // Recargar lista tras subida exitosa
                      setTimeout(() => { load(); setShowUpload(false); setUploadUrl(''); }, 800);
                    }
                  }}
                  height={120}
                />
                <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 10 }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: 4 }} />
                  JPG, PNG, WebP, SVG · Máximo 5MB · Se guarda en Supabase Storage
                </div>
              </div>
              <div className="adm-modal-footer">
                <button className="adm-btn ghost" onClick={() => setShowUpload(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
