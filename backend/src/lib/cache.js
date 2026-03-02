/**
 * In-memory TTL cache.
 * TTLs: stats 60s, analytics 90s, active_course_ids 120s.
 * Invalidate by prefix on POST /api/sync/all.
 */
const entries = new Map();

const DEFAULT_TTL = 60;
const TTL = {
  stats: 60,
  analytics: 90,
  active_course_ids: 120,
};

function getTtl(key) {
  if (key.startsWith('stats')) return TTL.stats;
  if (key.startsWith('analytics')) return TTL.analytics;
  if (key === 'active_course_ids') return TTL.active_course_ids;
  return DEFAULT_TTL;
}

export function cacheGet(key) {
  const entry = entries.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    entries.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet(key, value) {
  const ttlSeconds = getTtl(key);
  entries.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function cacheInvalidatePrefix(prefix) {
  const toDelete = [];
  for (const k of entries.keys()) {
    if (k.startsWith(prefix)) toDelete.push(k);
  }
  toDelete.forEach((k) => entries.delete(k));
  if (toDelete.length) {
    console.info(`[cache] Invalidated ${toDelete.length} keys with prefix "${prefix}"`);
  }
}
