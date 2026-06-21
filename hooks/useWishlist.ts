import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api/v1';
const LS_KEY = 'ta_wishlist';

export interface WishlistItem {
  id?: string;
  item_type: 'flight' | 'hotel' | 'package';
  item_id: string;
  item_data: any;
}

function getLocalWishlist(): WishlistItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveLocalWishlist(items: WishlistItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function useWishlist() {
  const { isLoggedIn, token } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn || !token) {
      setItems(getLocalWishlist());
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API}/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setItems(d.data || []);
    } catch {
      setItems(getLocalWishlist());
    } finally { setLoading(false); }
  }, [isLoggedIn, token]);

  useEffect(() => { load(); }, [load]);

  const isInWishlist = (type: string, id: string) =>
    items.some(i => i.item_type === type && i.item_id === id);

  const toggle = async (type: 'flight' | 'hotel' | 'package', id: string, data: any) => {
    const inList = isInWishlist(type, id);

    if (!isLoggedIn || !token) {
      const local = getLocalWishlist();
      if (inList) {
        const updated = local.filter(i => !(i.item_type === type && i.item_id === id));
        saveLocalWishlist(updated);
        setItems(updated);
      } else {
        const updated = [...local, { item_type: type, item_id: id, item_data: data }];
        saveLocalWishlist(updated);
        setItems(updated);
      }
      return;
    }

    if (inList) {
      await fetch(`${API}/wishlist/${type}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setItems(prev => prev.filter(i => !(i.item_type === type && i.item_id === id)));
    } else {
      const r = await fetch(`${API}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_type: type, item_id: id, item_data: data }),
      });
      const d = await r.json();
      if (d.success) setItems(prev => [...prev, d.data]);
    }
  };

  return { items, loading, isInWishlist, toggle, reload: load };
}
