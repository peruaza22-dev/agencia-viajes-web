'use client';

/**
 * ImageUploader — Componente reutilizable para subir imágenes
 * Opciones: URL directa | Archivo local (PC) | Google Drive
 * Usa el endpoint /api/v1/media/upload del backend
 */
import { useState, useRef, useCallback } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';

interface Props {
  value: string;                    // URL actual
  onChange: (url: string) => void;  // Callback cuando cambia
  label?: string;
  placeholder?: string;
  height?: number;                  // Altura del preview en px
}

type Tab = 'url' | 'file' | 'drive';

export default function ImageUploader({
  value, onChange,
  label = 'Imagen',
  placeholder = 'https://… o /img/…',
  height = 120,
}: Props) {
  const { adminFetch, API } = useAdminFetch();

  const [tab, setTab]           = useState<Tab>('url');
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Subir archivo desde PC ──────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5MB'); return; }
    if (!file.type.startsWith('image/')) { setError('Solo imágenes (JPG, PNG, WebP, SVG)'); return; }

    setUploading(true); setError('');
    try {
      // Convertir a base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const r = await adminFetch(`${API}/media/upload`, {
        method: 'POST',
        body: JSON.stringify({ base64, filename: file.name, mimeType: file.type }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Error al subir');
      onChange(d.data.url);
    } catch (e: any) {
      const msg = e?.message || String(e) || 'Error al subir imagen';
      // Mensaje más claro para errores comunes
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setError('No se pudo conectar al servidor. Verifica que el servidor esté corriendo.');
      } else if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized')) {
        setError('Sin permisos. Asegúrate de estar logueado como admin.');
      } else if (msg.includes('bucket') || msg.includes('storage') || msg.includes('Storage')) {
        setError('Error de almacenamiento. Ejecuta el script create-storage-bucket.sql en Supabase.');
      } else {
        setError(msg);
      }
    } finally {
      setUploading(false);
    }
  }, [adminFetch, API, onChange]);

  // ── Subir desde Google Drive ────────────────────────────────
  const uploadFromDrive = async () => {
    if (!driveUrl.trim()) { setError('Pega la URL de Google Drive'); return; }
    setUploading(true); setError('');
    try {
      const r = await adminFetch(`${API}/media/upload`, {
        method: 'POST',
        body: JSON.stringify({ driveUrl: driveUrl.trim() }),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Error al importar desde Drive');
      onChange(d.data.url);
      setDriveUrl('');
    } catch (e: any) {
      setError(e?.message || String(e) || 'Error al importar desde Drive');
    } finally {
      setUploading(false);
    }
  };

  // ── Drag & Drop ─────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '6px 12px', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: tab === t ? 700 : 400,
    color: tab === t ? 'var(--adm-primary)' : 'var(--adm-text-muted)',
    borderBottom: `2px solid ${tab === t ? 'var(--adm-primary)' : 'transparent'}`,
    transition: 'all 0.15s',
  });

  return (
    <div>
      {label && <label className="adm-label">{label}</label>}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--adm-border)', marginBottom: 10 }}>
        <button type="button" style={tabStyle('url')} onClick={() => setTab('url')}>
          <i className="fa-solid fa-link" style={{ marginRight: 4 }} />URL
        </button>
        <button type="button" style={tabStyle('file')} onClick={() => setTab('file')}>
          <i className="fa-solid fa-upload" style={{ marginRight: 4 }} />Mi PC
        </button>
        <button type="button" style={tabStyle('drive')} onClick={() => setTab('drive')}>
          <i className="fa-brands fa-google-drive" style={{ marginRight: 4 }} />Google Drive
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '6px 10px', borderRadius: 6, marginBottom: 8, fontSize: 12 }}>
          <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 4 }} />{error}
        </div>
      )}

      {/* ── Tab URL ── */}
      {tab === 'url' && (
        <input
          className="adm-input"
          value={value}
          onChange={e => { setError(''); onChange(e.target.value); }}
          placeholder={placeholder}
        />
      )}

      {/* ── Tab Archivo PC ── */}
      {tab === 'file' && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          />
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--adm-primary)' : 'var(--adm-border)'}`,
              borderRadius: 10, padding: '20px 16px', textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: dragOver ? '#f0f4ff' : '#fafafa',
              transition: 'all 0.15s',
            }}
          >
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div className="adm-spinner" style={{ width: 24, height: 24 }} />
                <span style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>Subiendo imagen…</span>
              </div>
            ) : (
              <>
                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 28, color: 'var(--adm-text-muted)', display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--adm-text)' }}>
                  Arrastra una imagen aquí o haz clic para seleccionar
                </div>
                <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 4 }}>
                  JPG, PNG, WebP, SVG · Máximo 5MB
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Google Drive ── */}
      {tab === 'drive' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 8, background: '#f0f4ff', padding: '8px 12px', borderRadius: 8, border: '1px solid #c7d7f9' }}>
            <i className="fa-solid fa-circle-info" style={{ marginRight: 4, color: 'var(--adm-primary)' }} />
            En Google Drive: clic derecho en el archivo → <strong>Obtener enlace</strong> → cambia a "Cualquier persona con el enlace" → copia la URL
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="adm-input"
              value={driveUrl}
              onChange={e => { setError(''); setDriveUrl(e.target.value); }}
              placeholder="https://drive.google.com/file/d/…/view"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="adm-btn primary"
              onClick={uploadFromDrive}
              disabled={uploading || !driveUrl.trim()}
            >
              {uploading
                ? <><div className="adm-spinner" style={{ width: 14, height: 14 }} /> Importando…</>
                : <><i className="fa-solid fa-file-import" /> Importar</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Preview de la imagen actual */}
      {value && (
        <div style={{ marginTop: 10, position: 'relative', display: 'inline-block' }}>
          <div style={{ height, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', border: '1px solid var(--adm-border)', display: 'inline-block', minWidth: 80 }}>
            <img
              src={value}
              alt="preview"
              style={{ height: '100%', maxWidth: 300, objectFit: 'cover', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: -6, right: -6,
              width: 20, height: 20, borderRadius: '50%',
              background: '#dc2626', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 10, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
            title="Quitar imagen"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}
    </div>
  );
}
