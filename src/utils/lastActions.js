// Batches "who last acted on this record?" lookups so a list of 50 rows makes ONE request.
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const cache = new Map();   // `${match}|${id}` -> { at, value }
const queues = new Map();  // match -> { ids:Set, waiters:Map<id, resolve[]> }
const TTL_FOUND = 15000;
const TTL_EMPTY = 3000;

const authHeader = () => {
  const t = localStorage.getItem("hrToken") || localStorage.getItem("adminToken") || "";
  return t ? { Authorization: `Bearer ${t}` } : {};
};

async function flush(match) {
  const q = queues.get(match);
  queues.delete(match);
  if (!q) return;
  const ids = [...q.ids];
  const found = {};
  try {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const url = `${API_BASE}/api/hr/last-actions?ids=${chunk.join(",")}&match=${encodeURIComponent(match)}`;
      const res = await fetch(url, { headers: authHeader() });
      const json = await res.json().catch(() => ({}));
      Object.assign(found, json.data || {});
    }
  } catch { /* leave empty – the badge simply won't show */ }
  ids.forEach((id) => {
    const value = found[id] || null;
    cache.set(`${match}|${id}`, { at: Date.now(), value });
    (q.waiters.get(id) || []).forEach((resolve) => resolve(value));
  });
}

export function getLastAction(id, match = "", { fresh = false } = {}) {
  const key = `${match}|${id}`;
  const hit = cache.get(key);
  if (!fresh && hit && Date.now() - hit.at < (hit.value ? TTL_FOUND : TTL_EMPTY)) {
    return Promise.resolve(hit.value);
  }
  return new Promise((resolve) => {
    let q = queues.get(match);
    if (!q) {
      q = { ids: new Set(), waiters: new Map() };
      queues.set(match, q);
      setTimeout(() => flush(match), 30);
    }
    q.ids.add(id);
    if (!q.waiters.has(id)) q.waiters.set(id, []);
    q.waiters.get(id).push(resolve);
  });
}