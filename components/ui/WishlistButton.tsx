'use client';

/**
 * WishlistButton — Botón de corazón para añadir/quitar de favoritos
 * Uso: <WishlistButton type="flight" id={flight.id} data={flight} />
 */
import { useState } from 'react';
import { useWishlist } from '@/hooks/useWishlist';

interface Props {
  type: 'flight' | 'hotel' | 'package';
  id: string;
  data: any;
  size?: number;
  style?: React.CSSProperties;
}

export default function WishlistButton({ type, id, data, size = 18, style }: Props) {
  const { isInWishlist, toggle } = useWishlist();
  const [animating, setAnimating] = useState(false);
  const inList = isInWishlist(type, id);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAnimating(true);
    await toggle(type, id, data);
    setTimeout(() => setAnimating(false), 400);
  };

  return (
    <button
      onClick={handleClick}
      title={inList ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      style={{
        background: inList ? '#fee2e2' : 'rgba(255,255,255,0.9)',
        border: `1.5px solid ${inList ? '#fca5a5' : '#e5e7eb'}`,
        borderRadius: '50%',
        width: size + 12,
        height: size + 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: animating ? 'scale(1.3)' : 'scale(1)',
        flexShrink: 0,
        ...style,
      }}
    >
      <i
        className={`${inList ? 'fa-solid' : 'fa-regular'} fa-heart`}
        style={{
          fontSize: size,
          color: inList ? '#ef4444' : '#9ca3af',
          transition: 'color 0.2s',
        }}
      />
    </button>
  );
}
