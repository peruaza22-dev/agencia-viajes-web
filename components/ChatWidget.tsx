'use client';

import React, { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/chatbot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg.text }) });
      const j = await res.json();
      if (j.success) {
        setMessages((m) => [...m, { role: 'assistant', text: j.data.reply }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: 'Error: no se pudo obtener respuesta del chatbot.' }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Error de red al contactar el chatbot.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button aria-label="Chat" title="Chat" onClick={() => setOpen((v) => !v)} style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 80, background: '#003580', color: '#fff', borderRadius: 9999, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(2,6,23,0.2)' }}>
        💬
      </button>
      {open && (
        <div style={{ position: 'fixed', right: 18, bottom: 86, zIndex: 80, width: 340, maxHeight: '60vh', background: '#fff', borderRadius: 12, boxShadow: '0 6px 24px rgba(2,6,23,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 700 }}>Asistente</div>
          <div style={{ padding: 12, flex: 1, overflow: 'auto' }}>
            {messages.length === 0 && <div className="text-sm text-gray-500">Puedes preguntar sobre reservas, cambios y políticas.</div>}
            {messages.map((m, idx) => (
              <div key={idx} style={{ marginBottom: 10, textAlign: m.role === 'user' ? 'right' : 'left' }}>
                <div style={{ display: 'inline-block', background: m.role === 'user' ? '#e5e7eb' : '#003580', color: m.role === 'user' ? '#0f172a' : '#fff', padding: '8px 10px', borderRadius: 8, maxWidth: '85%' }}>{m.text}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 8, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta…" className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm" />
            <button onClick={send} disabled={loading} className="bg-primary text-white px-3 py-2 rounded">Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}
