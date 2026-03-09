'use client';
import { useEffect } from 'react';

export default function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[AirOps SW] registered:', reg.scope);
        // Listen for sync messages from SW
        navigator.serviceWorker.addEventListener('message', e => {
          if (e.data?.type === 'SYNC_REQUESTED') {
            window.dispatchEvent(new CustomEvent('airops:sync'));
          }
        });
      })
      .catch(err => console.warn('[AirOps SW] registration failed:', err));
  }, []);
  return null;
}
