'use client';

/**
 * WysiwygEditor — Editor de texto enriquecido sin dependencias externas
 * Usa contentEditable + execCommand para formateo básico
 */
import { useRef, useEffect, useCallback } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLS = [
  { cmd: 'bold',          icon: 'fa-bold',          title: 'Negrita (Ctrl+B)' },
  { cmd: 'italic',        icon: 'fa-italic',         title: 'Cursiva (Ctrl+I)' },
  { cmd: 'underline',     icon: 'fa-underline',      title: 'Subrayado (Ctrl+U)' },
  { cmd: 'strikeThrough', icon: 'fa-strikethrough',  title: 'Tachado' },
  { cmd: '|' },
  { cmd: 'insertUnorderedList', icon: 'fa-list-ul',  title: 'Lista' },
  { cmd: 'insertOrderedList',   icon: 'fa-list-ol',  title: 'Lista numerada' },
  { cmd: '|' },
  { cmd: 'justifyLeft',   icon: 'fa-align-left',     title: 'Izquierda' },
  { cmd: 'justifyCenter', icon: 'fa-align-center',   title: 'Centro' },
  { cmd: 'justifyRight',  icon: 'fa-align-right',    title: 'Derecha' },
  { cmd: '|' },
  { cmd: 'indent',        icon: 'fa-indent',         title: 'Sangría' },
  { cmd: 'outdent',       icon: 'fa-outdent',        title: 'Quitar sangría' },
  { cmd: '|' },
  { cmd: 'removeFormat',  icon: 'fa-eraser',         title: 'Limpiar formato' },
];

const HEADINGS = ['p', 'h1', 'h2', 'h3', 'h4'];
const HEADING_LABELS: Record<string, string> = {
  p: 'Párrafo', h1: 'Título 1', h2: 'Título 2', h3: 'Título 3', h4: 'Título 4',
};

export default function WysiwygEditor({ value, onChange, placeholder = 'Escribe el contenido aquí…', minHeight = 320 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sincronizar valor externo → editor (solo cuando cambia desde fuera)
  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalChange.current) { isInternalChange.current = false; return; }
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertLink = () => {
    const url = prompt('URL del enlace:', 'https://');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('URL de la imagen:', 'https://');
    if (url) exec('insertImage', url);
  };

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  return (
    <div style={{ border: '1px solid var(--adm-border)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      {/* Barra de herramientas */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px',
        background: '#f8fafc', borderBottom: '1px solid var(--adm-border)',
        alignItems: 'center',
      }}>
        {/* Selector de encabezado */}
        <select
          style={{ height: 28, padding: '0 6px', border: '1px solid var(--adm-border)', borderRadius: 4, fontSize: 12, background: '#fff', cursor: 'pointer' }}
          onChange={e => exec('formatBlock', e.target.value)}
          defaultValue="p"
        >
          {HEADINGS.map(h => <option key={h} value={h}>{HEADING_LABELS[h]}</option>)}
        </select>

        {/* Selector de fuente */}
        <select
          style={{ height: 28, padding: '0 6px', border: '1px solid var(--adm-border)', borderRadius: 4, fontSize: 12, background: '#fff', cursor: 'pointer' }}
          onChange={e => exec('fontSize', e.target.value)}
          defaultValue="3"
        >
          {[1,2,3,4,5,6].map(s => <option key={s} value={s}>{['8','10','12','14','18','24'][s-1]}px</option>)}
        </select>

        <div style={{ width: 1, height: 20, background: 'var(--adm-border)', margin: '0 2px' }} />

        {/* Botones de formato */}
        {TOOLS.map((t, i) => {
          if (t.cmd === '|') return <div key={i} style={{ width: 1, height: 20, background: 'var(--adm-border)', margin: '0 2px' }} />;
          return (
            <button
              key={t.cmd}
              type="button"
              title={t.title}
              onMouseDown={e => { e.preventDefault(); exec(t.cmd!); }}
              style={{
                width: 28, height: 28, border: '1px solid transparent', borderRadius: 4,
                background: isActive(t.cmd!) ? '#e0e7ff' : 'transparent',
                color: isActive(t.cmd!) ? 'var(--adm-primary)' : 'var(--adm-text)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, transition: 'all 0.1s',
              }}
            >
              <i className={`fa-solid ${t.icon}`} />
            </button>
          );
        })}

        <div style={{ width: 1, height: 20, background: 'var(--adm-border)', margin: '0 2px' }} />

        {/* Enlace */}
        <button type="button" title="Insertar enlace" onMouseDown={e => { e.preventDefault(); insertLink(); }}
          style={{ width: 28, height: 28, border: '1px solid transparent', borderRadius: 4, background: 'transparent', color: 'var(--adm-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
          <i className="fa-solid fa-link" />
        </button>

        {/* Imagen */}
        <button type="button" title="Insertar imagen" onMouseDown={e => { e.preventDefault(); insertImage(); }}
          style={{ width: 28, height: 28, border: '1px solid transparent', borderRadius: 4, background: 'transparent', color: 'var(--adm-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
          <i className="fa-solid fa-image" />
        </button>

        {/* Color de texto */}
        <label title="Color de texto" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
          <i className="fa-solid fa-palette" style={{ fontSize: 12, color: 'var(--adm-text)' }} />
          <input type="color" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            onChange={e => exec('foreColor', e.target.value)} />
        </label>

        {/* Ver HTML */}
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 10, color: 'var(--adm-text-muted)', padding: '2px 6px', background: '#f1f5f9', borderRadius: 4 }}>
            WYSIWYG
          </span>
        </div>
      </div>

      {/* Área editable */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={e => {
          // Pegar solo texto plano para evitar HTML sucio
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
        style={{
          minHeight,
          padding: '16px',
          outline: 'none',
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--adm-text)',
          overflowY: 'auto',
        }}
        data-placeholder={placeholder}
      />

      {/* Estilos del editor */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 24px; font-weight: 700; margin: 12px 0 8px; }
        [contenteditable] h2 { font-size: 20px; font-weight: 700; margin: 10px 0 6px; }
        [contenteditable] h3 { font-size: 17px; font-weight: 600; margin: 8px 0 4px; }
        [contenteditable] h4 { font-size: 15px; font-weight: 600; margin: 6px 0 4px; }
        [contenteditable] p  { margin: 0 0 8px; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 8px 0; }
        [contenteditable] li { margin-bottom: 4px; }
        [contenteditable] a  { color: var(--adm-primary); text-decoration: underline; }
        [contenteditable] img { max-width: 100%; border-radius: 6px; margin: 8px 0; }
        [contenteditable] blockquote { border-left: 3px solid var(--adm-primary); padding-left: 12px; color: #64748b; margin: 8px 0; }
      `}</style>
    </div>
  );
}
