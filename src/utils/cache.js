/**
 * Session-storage cache used for stale-while-revalidate UX:
 * paint last-known data instantly, then refresh in background.
 *
 * Keep the cached payloads small and non-sensitive — sessionStorage is
 * cleared with the tab but isn't encrypted.
 */
const PREFIX = "aval.cache.";

export function readCache(key, maxAgeMs = 60_000) {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > maxAgeMs) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeCache(key, value) {
  try {
    sessionStorage.setItem(
      PREFIX + key,
      JSON.stringify({ value, ts: Date.now() }),
    );
  } catch {}
}

export function invalidateCache(key) {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {}
}

export function invalidateAllCache() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(PREFIX)) sessionStorage.removeItem(k);
    }
  } catch {}
}

/** Cache keys — keep them centralized so callers don't drift. */
export const CACHE = {
  institution: "institution.me",
  kyc: "kyc.me",
};
