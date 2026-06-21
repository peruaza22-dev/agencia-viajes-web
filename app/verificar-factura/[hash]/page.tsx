'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';

interface InvoiceData {
  invoiceNumber?: string;
  customerName?: string;
  amount?: number;
  currency?: string;
  date?: string;
  status?: string;
  [key: string]: unknown;
}

export default function InvoiceVerifyPage() {
  const params = useParams();
  const hash = params.hash as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [err, setErr] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // ✅ CLEANUP AUDITADO
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        // Verificar factura
        const res = await fetch(`${API}/invoices/verify/${hash}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Factura no encontrada o inválida');
        const data = await res.json();
        if (!controller.signal.aborted) setInvoice(data.invoice ?? data);

        // Generar QR con la URL de verificación
        const { default: QRCode } = await import('qrcode');
        const url = `${window.location.origin}/verificar-factura/${hash}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2 });
        if (!controller.signal.aborted) setQrDataUrl(dataUrl);
      } catch (e: unknown) {
        if (!controller.signal.aborted) {
          setErr((e as Error).name !== 'AbortError' ? ((e as Error).message || 'Error al verificar la factura') : '');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort(); // ✅
  }, [hash]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Verificando factura...</p>
      </div>
    </div>
  );

  if (err || !invoice) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <i className="fa fa-times-circle text-red-500" style={{ fontSize: 48, display: 'block', marginBottom: 16 }} />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Factura no válida</h1>
        <p className="text-gray-500 text-sm">{err || 'Esta factura no existe o ha expirado.'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa fa-check-circle text-green-600" style={{ fontSize: 28 }} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Factura Verificada</h1>
          <p className="text-sm text-gray-500 mt-1">Esta factura es auténtica y válida</p>
        </div>

        {/* Datos de la factura */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
          {invoice.invoiceNumber && (
            <div className="flex justify-between">
              <span className="text-gray-400">Número</span>
              <span className="font-bold text-gray-700">{invoice.invoiceNumber}</span>
            </div>
          )}
          {invoice.customerName && (
            <div className="flex justify-between">
              <span className="text-gray-400">Cliente</span>
              <span className="text-gray-700">{invoice.customerName}</span>
            </div>
          )}
          {invoice.amount != null && (
            <div className="flex justify-between">
              <span className="text-gray-400">Importe</span>
              <span className="font-bold text-primary">{invoice.amount}{invoice.currency ? ` ${invoice.currency}` : '€'}</span>
            </div>
          )}
          {invoice.date && (
            <div className="flex justify-between">
              <span className="text-gray-400">Fecha</span>
              <span className="text-gray-700">{new Date(invoice.date).toLocaleDateString('es-ES')}</span>
            </div>
          )}
          {invoice.status && (
            <div className="flex justify-between">
              <span className="text-gray-400">Estado</span>
              <span className="text-green-600 font-semibold capitalize">{invoice.status}</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-3">Escanea para verificar en otro dispositivo</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR verificación" className="mx-auto" style={{ width: 160, height: 160 }} />
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Hash de verificación: <span className="font-mono">{hash.slice(0, 16)}...</span>
        </p>
      </div>
    </div>
  );
}
