// Safe localStorage wrapper. Phase 1 persists admin settings and test bookings
// in the browser only. Phase 2 replaces callers' data source with the API.
const PREFIX = 'mastizone.v1.';

export const storage = {
  get(key, fallback) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try { window.localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
  },
};
