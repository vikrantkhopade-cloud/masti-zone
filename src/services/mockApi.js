// Simulates network latency so loading states are exercised in Phase 1.
// In Phase 2, services call the real backend (fetch / Supabase client) instead,
// keeping the same function signatures so pages don't change.
export function mockRequest(producer, { delay = 450 } = {}) {
  return new Promise((resolve, reject) => {
    const jitter = Math.round(Math.random() * 250);
    setTimeout(() => {
      try {
        resolve(structuredCloneSafe(producer()));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    }, delay + jitter);
  });
}

function structuredCloneSafe(v) {
  try { return typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)); } catch { return v; }
}
