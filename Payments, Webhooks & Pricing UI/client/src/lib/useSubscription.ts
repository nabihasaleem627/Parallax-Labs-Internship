import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { Subscription } from '../types/billing';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setError('');
    try { setSubscription(await api.getSubscription()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load subscription.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const handler = () => void refresh();
    window.addEventListener('bookflow:subscription-updated', handler);
    return () => window.removeEventListener('bookflow:subscription-updated', handler);
  }, [refresh]);
  return { subscription, loading, error, refresh };
}
