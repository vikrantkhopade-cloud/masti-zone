// Booking validation & slot rules (shared by booking + checkout pages).
import { addDays, todayISO } from './dates.js';
import { getAgeCategory } from './pricing.js';

const hourOf = (hhmm) => Number(hhmm.split(':')[0]);

/** Entry slots between opening and closing; each flagged available/unavailable. */
export function buildEntrySlots({ park, plan, visitDate }) {
  const open = hourOf(park.openTime);
  const close = hourOf(park.closeTime);
  const isToday = visitDate === todayISO();
  const nowHour = new Date().getHours();
  // Full-day tickets (or any plan as long as opening hours) allow entry in the first 3 hours.
  const fullDay = plan && (plan.id === 'full' || plan.hours >= close - open);
  const slots = [];
  for (let h = open; h < close; h++) {
    const time = `${String(h).padStart(2, '0')}:00`;
    let reason = null;
    if (isToday && h <= nowHour) reason = 'Passed';
    else if (fullDay && h > open + 2) reason = 'Too late for full day';
    else if (plan && !fullDay && h + plan.hours > close) reason = 'Ends after closing';
    slots.push({ time, available: !reason, reason });
  }
  return slots;
}

export function validateTicketStep(draft, { park, age, plan }) {
  const errors = { visitors: [] };
  const today = todayISO();
  if (!draft.visitDate) errors.visitDate = 'Please choose a visit date.';
  else if (draft.visitDate < today) errors.visitDate = 'Visit date cannot be in the past.';
  else if (draft.visitDate > addDays(today, park.advanceBookingDays)) errors.visitDate = `Bookings open up to ${park.advanceBookingDays} days in advance.`;
  else if (park.weeklyOff?.includes(new Date(`${draft.visitDate}T00:00:00`).getDay())) errors.visitDate = 'The park is closed on this day.';

  if (!plan) errors.planId = 'Please choose a ticket duration.';
  if (!draft.entryTime) errors.entryTime = 'Please choose an entry time.';
  else if (plan && draft.visitDate) {
    const slot = buildEntrySlots({ park, plan, visitDate: draft.visitDate }).find((s) => s.time === draft.entryTime);
    if (!slot?.available) errors.entryTime = 'This entry time is not available for the selected date and ticket.';
  }

  draft.visitors.slice(0, draft.quantity).forEach((v, i) => {
    const e = {};
    if (!v.name || v.name.trim().length < 2) e.name = 'Enter full name';
    const cat = getAgeCategory(v.age, age);
    if (v.age === '' || v.age === undefined) e.age = 'Enter age';
    else if (!Number.isInteger(Number(v.age))) e.age = 'Whole years only';
    else if (cat === 'invalid') e.age = `Age must be ${age.minAge}–${age.maxAge}`;
    if (!v.gender) e.gender = 'Select gender';
    errors.visitors[i] = e;
  });

  const valid = !errors.visitDate && !errors.planId && !errors.entryTime && errors.visitors.every((e) => !e || Object.keys(e).length === 0);
  return { valid, errors };
}

export function validateContact(c) {
  const errors = {};
  if (!c.name || c.name.trim().length < 2) errors.name = 'Enter your full name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email || '')) errors.email = 'Enter a valid email address';
  if (!/^[6-9]\d{9}$/.test((c.phone || '').replace(/\D/g, '').slice(-10)) || (c.phone || '').replace(/\D/g, '').length < 10) errors.phone = 'Enter a valid 10-digit mobile number';
  return errors;
}
