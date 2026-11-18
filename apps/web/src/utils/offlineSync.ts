/**
 * YatraLekha Offline Highway Resilience & Background Sync Engine
 * Enables seamless fleet operations along patchy highway corridors (NH 53 & Samruddhi Mahamarg)
 */

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: string;
  payload: any;
  timestamp: string;
}

const CACHE_PREFIX = 'yatralekha_cache_';
const QUEUE_KEY = 'yatralekha_offline_queue';

export const OfflineSync = {
  /**
   * Caches critical workspace data (vehicles, trips, compliance docs) in localStorage
   */
  saveCache: (key: string, data: any): void => {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
        data,
        cachedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('[OfflineSync] Failed to write cache for key:', key, e);
    }
  },

  /**
   * Retrieves cached workspace data
   */
  getCache: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!item) return null;
      const parsed = JSON.parse(item);
      return parsed.data as T;
    } catch {
      return null;
    }
  },

  /**
   * Enqueues an offline mutation (Trip entry, Fuel audit, Vehicle registration)
   */
  enqueueMutation: (endpoint: string, method: string, payload: any): void => {
    try {
      const existing = OfflineSync.getQueue();
      const newEntry: QueuedMutation = {
        id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        endpoint,
        method,
        payload,
        timestamp: new Date().toISOString()
      };
      existing.push(newEntry);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
      console.log(`[OfflineSync] Enqueued offline mutation (${endpoint}):`, newEntry.id);
    } catch (e) {
      console.error('[OfflineSync] Failed to enqueue mutation:', e);
    }
  },

  /**
   * Retrieves all queued offline mutations
   */
  getQueue: (): QueuedMutation[] => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Clears or updates the offline queue
   */
  clearQueue: (): void => {
    localStorage.removeItem(QUEUE_KEY);
  },

  /**
   * Replays all queued mutations against the live backend API once connectivity returns
   */
  flushQueue: async (apiBase: string, token?: string | null): Promise<number> => {
    const queue = OfflineSync.getQueue();
    if (queue.length === 0) return 0;

    console.log(`[OfflineSync] Syncing ${queue.length} offline highway mutation(s)...`);
    let syncedCount = 0;
    const remaining: QueuedMutation[] = [];

    for (const item of queue) {
      try {
        const url = `${apiBase}${item.endpoint}`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, {
          method: item.method,
          headers,
          body: JSON.stringify(item.payload)
        });

        if (res.ok) {
          syncedCount++;
          console.log(`[OfflineSync] ✓ Synced mutation ${item.id} (${item.endpoint})`);
        } else {
          // If 4xx validation error, don't retry forever; if 5xx or offline, keep in queue
          if (res.status >= 500) {
            remaining.push(item);
          }
        }
      } catch (err) {
        // Still offline, retain mutation
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } else {
      OfflineSync.clearQueue();
    }

    return syncedCount;
  }
};
