// Pure aggregation helpers for admin analytics. In Phase 2 these can move to
// SQL views / RPCs; the returned shapes are what the UI depends on.
import { addDays, daysBetween, eachDay, WEEKDAYS } from './dates.js';

export const AGE_BUCKETS = [
  { label: '0–5', min: 0, max: 5 },
  { label: '6–12', min: 6, max: 12 },
  { label: '13–17', min: 13, max: 17 },
  { label: '18–25', min: 18, max: 25 },
  { label: '26–35', min: 26, max: 35 },
  { label: '36–50', min: 36, max: 50 },
  { label: '51+', min: 51, max: 200 },
];

export const inRange = (b, { from, to }) => b.visitDate >= from && b.visitDate <= to;
const isVisit = (b) => b.status === 'confirmed';
const isPaid = (b) => b.paymentStatus === 'paid';

function summarize(list) {
  const visits = list.filter(isVisit);
  return {
    totalBookings: list.filter((b) => b.status !== 'abandoned').length,
    confirmedBookings: visits.length,
    pendingBookings: list.filter((b) => b.status === 'pending').length,
    totalVisitors: visits.reduce((s, b) => s + b.quantity, 0),
    revenue: list.filter(isPaid).reduce((s, b) => s + b.total, 0),
    successfulPayments: list.filter(isPaid).length,
    pendingPayments: list.filter((b) => b.paymentStatus === 'pending').length,
    pendingAmount: list.filter((b) => b.paymentStatus === 'pending').reduce((s, b) => s + b.total, 0),
    cancelled: list.filter((b) => b.status === 'cancelled').length,
    abandoned: list.filter((b) => b.status === 'abandoned').length,
    abandonedValue: list.filter((b) => b.status === 'abandoned').reduce((s, b) => s + b.total, 0),
    refunds: list.filter((b) => b.status === 'cancelled').reduce((s, b) => s + (b.refundAmount || 0), 0),
  };
}

const delta = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);

export function computeAnalytics(all, range, ageSettings) {
  const list = all.filter((b) => inRange(b, range));
  const len = daysBetween(range.from, range.to) + 1;
  const prevRange = { from: addDays(range.from, -len), to: addDays(range.from, -1) };
  const prevList = all.filter((b) => inRange(b, prevRange));

  const totals = summarize(list);
  const prev = summarize(prevList);
  const deltas = Object.fromEntries(Object.keys(totals).map((k) => [k, delta(totals[k], prev[k])]));

  const visits = list.filter(isVisit);
  const visitors = visits.flatMap((b) => b.visitors.map((v) => ({ ...v, hour: b.entryTime })));

  // Hour-wise
  const hourly = Array.from({ length: 8 }, (_, i) => {
    const h = 10 + i;
    const key = `${String(h).padStart(2, '0')}:00`;
    const bs = visits.filter((b) => b.entryTime === key);
    return { hour: `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`, visitors: bs.reduce((s, b) => s + b.quantity, 0), bookings: bs.length };
  });

  // Daily
  const byDay = new Map(eachDay(range.from, range.to).map((d) => [d, { date: d, visitors: 0, bookings: 0, revenue: 0, cancelled: 0 }]));
  list.forEach((b) => {
    const row = byDay.get(b.visitDate);
    if (!row) return;
    if (isVisit(b)) row.visitors += b.quantity;
    if (b.status !== 'abandoned') row.bookings += 1;
    if (isPaid(b)) row.revenue += b.total;
    if (b.status === 'cancelled') row.cancelled += 1;
  });
  const daily = [...byDay.values()];

  // Weekly (weeks starting Monday)
  const weeklyMap = new Map();
  daily.forEach((d) => {
    const dow = new Date(`${d.date}T00:00:00`).getDay();
    const weekStart = addDays(d.date, -((dow + 6) % 7));
    const w = weeklyMap.get(weekStart) || { week: weekStart, visitors: 0, revenue: 0, bookings: 0 };
    w.visitors += d.visitors; w.revenue += d.revenue; w.bookings += d.bookings;
    weeklyMap.set(weekStart, w);
  });
  const weekly = [...weeklyMap.values()];

  // Day-of-week pattern
  const dowAgg = WEEKDAYS.map((name) => ({ day: name, visitors: 0, days: 0 }));
  daily.forEach((d) => { const i = new Date(`${d.date}T00:00:00`).getDay(); dowAgg[i].visitors += d.visitors; dowAgg[i].days += 1; });
  const weekday = [1, 2, 3, 4, 5, 6, 0].map((i) => ({ day: dowAgg[i].day, avgVisitors: dowAgg[i].days ? Math.round(dowAgg[i].visitors / dowAgg[i].days) : 0 }));

  // Gender
  const g = { male: 0, female: 0, other: 0 };
  visitors.forEach((v) => { g[v.gender] = (g[v.gender] || 0) + 1; });
  const gender = [
    { name: 'Male', key: 'male', value: g.male },
    { name: 'Female', key: 'female', value: g.female },
    { name: 'Other', key: 'other', value: g.other },
  ];

  // Age
  const ageGroups = AGE_BUCKETS.map((bk) => ({ group: bk.label, visitors: visitors.filter((v) => v.age >= bk.min && v.age <= bk.max).length }));
  const childCount = visitors.filter((v) => v.age <= ageSettings.childMaxAge).length;
  const category = [
    { name: 'Children', value: childCount },
    { name: 'Adults', value: visitors.length - childCount },
  ];

  // Plan mix & payment methods
  const planMap = new Map();
  list.filter(isPaid).forEach((b) => {
    const p = planMap.get(b.planLabel) || { plan: b.planLabel, bookings: 0, revenue: 0, visitors: 0 };
    p.bookings += 1; p.revenue += b.total; p.visitors += b.quantity;
    planMap.set(b.planLabel, p);
  });
  const planOrder = ['1 Hour', '3 Hours', '5 Hours', 'Full Day'];
  const plans = [...planMap.values()].sort((a, b) => planOrder.indexOf(a.plan) - planOrder.indexOf(b.plan));

  const methodMap = new Map();
  list.filter(isPaid).forEach((b) => {
    const m = methodMap.get(b.paymentMethod) || { method: b.paymentMethod, count: 0, amount: 0 };
    m.count += 1; m.amount += b.total;
    methodMap.set(b.paymentMethod, m);
  });
  const paymentMethods = [...methodMap.values()].sort((a, b) => b.amount - a.amount);

  const paymentStatus = [
    { name: 'Paid', value: totals.successfulPayments },
    { name: 'Pending', value: totals.pendingPayments },
    { name: 'Failed', value: list.filter((b) => b.paymentStatus === 'failed').length },
    { name: 'Refunded', value: list.filter((b) => b.paymentStatus === 'refunded' || b.paymentStatus === 'refund_pending').length },
  ];

  const avgTicket = totals.successfulPayments ? Math.round(totals.revenue / totals.successfulPayments) : 0;
  const avgGroup = visits.length ? Math.round((totals.totalVisitors / visits.length) * 10) / 10 : 0;

  return { range, prevRange, totals, deltas, hourly, daily, weekly, weekday, gender, ageGroups, category, plans, paymentMethods, paymentStatus, avgTicket, avgGroup, days: len };
}
