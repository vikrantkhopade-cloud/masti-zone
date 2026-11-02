// Pure pricing / age-category logic shared by the customer booking flow and admin.
// The backend should re-calculate the bill server-side; this is for display only.

export function getAgeCategory(age, ageSettings) {
  const a = Number(age);
  if (age === '' || age === null || age === undefined || Number.isNaN(a)) return null;
  if (a < ageSettings.minAge || a > ageSettings.maxAge) return 'invalid';
  return a <= ageSettings.childMaxAge ? 'child' : 'adult';
}

export function categoryLabel(cat) {
  return { child: 'Child', adult: 'Adult', invalid: 'Not eligible' }[cat] || '—';
}

export function unitPriceFor(plan, category, ageSettings) {
  if (!plan) return 0;
  const discount = category === 'child' ? ageSettings.childDiscountPct : category === 'adult' ? ageSettings.adultDiscountPct : 0;
  return Math.round(plan.price * (1 - (Number(discount) || 0) / 100));
}

/**
 * Build an itemised bill.
 * @returns {{ lines, subtotal, tax, total, counts }}
 */
export function calculateBill({ plan, visitors, quantity, ageSettings, taxRate }) {
  const counts = { child: 0, adult: 0, unassigned: 0 };
  visitors.slice(0, quantity).forEach((v) => {
    const c = getAgeCategory(v.age, ageSettings);
    if (c === 'child' || c === 'adult') counts[c] += 1;
    else counts.unassigned += 1;
  });
  // Visitors without a valid age yet are priced at the adult rate (upper bound).
  const adultUnit = unitPriceFor(plan, 'adult', ageSettings);
  const childUnit = unitPriceFor(plan, 'child', ageSettings);
  const lines = [];
  if (counts.adult) lines.push({ label: 'Adult', qty: counts.adult, unit: adultUnit, amount: counts.adult * adultUnit });
  if (counts.child) lines.push({ label: 'Child', qty: counts.child, unit: childUnit, amount: counts.child * childUnit });
  if (counts.unassigned) lines.push({ label: 'Age pending', qty: counts.unassigned, unit: adultUnit, amount: counts.unassigned * adultUnit, pending: true });
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const tax = Math.round((subtotal * (Number(taxRate) || 0)) / 100);
  return { lines, subtotal, tax, total: subtotal + tax, counts };
}
