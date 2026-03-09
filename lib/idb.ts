'use client';

const DB_NAME = 'airops-offline';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('flights'))
        db.createObjectStore('flights', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('aircraft'))
        db.createObjectStore('aircraft', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('pilots'))
        db.createObjectStore('pilots', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('meta'))
        db.createObjectStore('meta', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('sync_queue'))
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const req = fn(s);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheData(store: string, items: unknown[]): Promise<void> {
  const db = await openDB();
  const t = db.transaction([store, 'meta'], 'readwrite');
  const s = t.objectStore(store);
  await new Promise<void>((resolve, reject) => {
    const clear = s.clear();
    clear.onsuccess = () => {
      let pending = items.length;
      if (pending === 0) { resolve(); return; }
      for (const item of items) {
        const r = s.put(item);
        r.onsuccess = () => { if (--pending === 0) resolve(); };
        r.onerror = () => reject(r.error);
      }
    };
    clear.onerror = () => reject(clear.error);
  });
  const meta = t.objectStore('meta');
  meta.put({ key: `${store}_updated`, value: new Date().toISOString() });
}

export async function getCached<T>(store: string): Promise<T[]> {
  try {
    const db = await openDB();
    return tx<T[]>(db, store, 'readonly', s => s.getAll());
  } catch {
    return [];
  }
}

export async function getLastUpdated(store: string): Promise<Date | null> {
  try {
    const db = await openDB();
    const result = await tx<{ key: string; value: string } | undefined>(
      db, 'meta', 'readonly', s => s.get(`${store}_updated`)
    );
    return result ? new Date(result.value) : null;
  } catch {
    return null;
  }
}

export interface SyncAction {
  type: 'drive_upload';
  payload: Record<string, unknown>;
  timestamp: number;
}

export async function queueAction(action: SyncAction): Promise<void> {
  const db = await openDB();
  await tx(db, 'sync_queue', 'readwrite', s => s.add({ ...action, timestamp: Date.now() }));
}

export async function getPendingCount(): Promise<number> {
  try {
    const db = await openDB();
    return tx<number>(db, 'sync_queue', 'readonly', s => s.count());
  } catch {
    return 0;
  }
}
