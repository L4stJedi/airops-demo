'use client';
import { useState, useEffect } from 'react';
import { getPendingCount } from './idb';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const onOnline = () => { setIsOffline(false); setLastSynced(new Date()); };
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    getPendingCount().then(setPendingCount);
    const id = setInterval(() => getPendingCount().then(setPendingCount), 10000);
    return () => clearInterval(id);
  }, []);

  return { isOffline, pendingCount, lastSynced };
}
