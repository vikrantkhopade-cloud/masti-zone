const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('en-IN');

export const formatINR = (v) => inr.format(Math.round(Number(v) || 0));
export const formatNumber = (v) => num.format(Math.round(Number(v) || 0));

export function formatCompactINR(v) {
  const n = Number(v) || 0;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n}`;
}

export function formatDate(isoDate, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!isoDate) return '—';
  const d = typeof isoDate === 'string' && isoDate.length === 10 ? new Date(`${isoDate}T00:00:00`) : new Date(isoDate);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', opts);
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function formatTime(hhmm) {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${suffix}`;
}

export const pct = (part, total) => (total ? Math.round((part / total) * 1000) / 10 : 0);

export const cn = (...classes) => classes.filter(Boolean).join(' ');
