import React, { useEffect, useState } from 'react';
import { useAdminFetch } from '@/hooks/useAdminFetch';

interface Provider {
  enabled: boolean;
  token?: string;
  key?: string;
  secret?: string;
}

interface ProvidersData {
  duffel: Provider;
  amadeus: Provider;
  sabre: Provider;
  traverpol: Provider;
}

const PROVIDER_INFO: Record<string, { name: string; color: string; icon: string }> = {
  duffel: { name: '✈️ Duffel', color: '#FF6B35', icon: '🔶' },
  amadeus: { name: '🌍 Amadeus', color: '#1E90FF', icon: '🔷' },
  sabre: { name: '🚀 Sabre', color: '#32CD32', icon: '🟢' },
  traverpol: { name: '🗺️ Traverpol', color: '#FF1493', icon: '🔴' },
};

export default function IntegrationsToggle() {
  const { adminFetch, API } = useAdminFetch();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreds, setShowCreds] = useState<Record<string, boolean>>({});
  const [credInputs, setCredInputs] = useState<Record<string, any>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await adminFetch(`${API}/integrations`);
        const j = await r.json();
        if (!mounted) return;
        if (j.success && j.data?.providers) {
          setProviders(j.data.providers);
          setCredInputs(j.data.providers);
        } else setError(j.error?.message || 'No se pudieron cargar las integraciones');
      } catch (err) {
        if (!mounted) return;
        setError('Error de conexión');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [API, adminFetch]);

  const toggleProvider = async (providerKey: string) => {
    if (!providers) return;
    const updated = {
      ...providers,
      [providerKey]: { ...providers[providerKey as keyof ProvidersData], enabled: !providers[providerKey as keyof ProvidersData].enabled }
    };
    setProviders(updated);
    setSaving(true);
    try {
      const r = await adminFetch(`${API}/integrations`, {
        method: 'POST',
        body: JSON.stringify({ providers: updated }),
      });
      const j = await r.json();
      if (!j.success) setError(j.error?.message || 'No se pudo actualizar');
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const saveCredentials = async (providerKey: string) => {
    if (!providers || !credInputs[providerKey]) return;
    const updated = { ...providers, [providerKey]: credInputs[providerKey] };
    setProviders(updated);
    setSaving(true);
    try {
      const r = await adminFetch(`${API}/integrations`, {
        method: 'POST',
        body: JSON.stringify({ providers: updated }),
      });
      const j = await r.json();
      if (j.success) {
        setShowCreds({ ...showCreds, [providerKey]: false });
      } else setError(j.error?.message || 'No se pudieron guardar credenciales');
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '12px', color: '#666' }}>Cargando integraciones…</div>;
  if (!providers) return <div style={{ padding: '12px', color: '#d32f2f' }}>Error cargando integraciones</div>;

  return (
    <div style={{ padding: '16px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600 }}>🔌 Proveedores de Vuelos & Servicios</h3>
      
      {error && <div style={{ padding: '8px', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '12px', fontSize: '12px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {Object.entries(PROVIDER_INFO).map(([key, info]) => {
          const provider = providers[key as keyof ProvidersData];
          const isActive = provider?.enabled;

          return (
            <div
              key={key}
              style={{
                padding: '12px',
                background: 'white',
                border: `2px solid ${isActive ? info.color : '#ddd'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: isActive ? info.color : '#999' }}>
                  {info.name}
                </span>
                <button
                  onClick={() => toggleProvider(key)}
                  disabled={saving}
                  style={{
                    padding: '4px 8px',
                    background: isActive ? info.color : '#ddd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {isActive ? '✓ Activo' : 'Inactivo'}
                </button>
              </div>

              {/* Credentials Button */}
              {isActive && (
                <button
                  onClick={() => setShowCreds({ ...showCreds, [key]: !showCreds[key] })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: '#666',
                    marginBottom: '8px',
                  }}
                >
                  {showCreds[key] ? '▼ Cerrar' : '▶ Credenciales'}
                </button>
              )}

              {/* Credentials Form */}
              {showCreds[key] && isActive && (
                <div style={{ background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
                  {key === 'duffel' && (
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Bearer Token</label>
                      <input
                        type="password"
                        placeholder="duffel_key_..."
                        value={credInputs[key]?.token || ''}
                        onChange={(e) => setCredInputs({ ...credInputs, [key]: { ...credInputs[key], token: e.target.value } })}
                        style={{ width: '100%', padding: '6px', fontSize: '11px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  {['amadeus', 'sabre', 'traverpol'].includes(key) && (
                    <>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>API Key</label>
                        <input
                          type="password"
                          placeholder="API Key"
                          value={credInputs[key]?.key || ''}
                          onChange={(e) => setCredInputs({ ...credInputs, [key]: { ...credInputs[key], key: e.target.value } })}
                          style={{ width: '100%', padding: '6px', fontSize: '11px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>API Secret</label>
                        <input
                          type="password"
                          placeholder="API Secret"
                          value={credInputs[key]?.secret || ''}
                          onChange={(e) => setCredInputs({ ...credInputs, [key]: { ...credInputs[key], secret: e.target.value } })}
                          style={{ width: '100%', padding: '6px', fontSize: '11px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => saveCredentials(key)}
                    disabled={saving}
                    style={{
                      width: '100%',
                      padding: '6px',
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    💾 Guardar Credenciales
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div style={{ marginTop: '16px', padding: '10px', background: '#e3f2fd', borderRadius: '4px', fontSize: '11px', color: '#1565c0' }}>
        <strong>ℹ️ Proveedores activos:</strong> Habilita los proveedores que deseas usar. Ingresa credenciales válidas para cada uno.
        <br />
        <strong>Nota:</strong> Las credenciales se guardan de forma segura en la base de datos.
      </div>
    </div>
  );
}
