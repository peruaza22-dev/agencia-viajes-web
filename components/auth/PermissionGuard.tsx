'use client';

import type { ReactNode } from 'react';

interface Props {
  allowed: boolean;
  children: ReactNode;
  message?: string;
}

/**
 * PermissionGuard — reemplaza AdminGuard de React.
 * Protección granular de paneles dentro del admin.
 * La protección de rutas a nivel de request es manejada por middleware.ts.
 */
export default function PermissionGuard({ allowed, children, message }: Props) {
  if (allowed) return <>{children}</>;
  return (
    <div className="adm-no-access">
      <i className="fa-solid fa-lock" />
      <h3>Acceso restringido</h3>
      <p>{message || 'No tienes permisos para ver esta sección.'}</p>
    </div>
  );
}
