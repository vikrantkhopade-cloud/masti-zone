// Business settings: ticket pricing, age categories, park settings.
// Backed by Supabase (ticket_plans + app_settings tables). loadSettingsSync()
// still returns the built-in defaults synchronously so pages have something
// to render immediately; SettingsContext hydrates them from Supabase right after.
import { supabase } from '../lib/supabaseClient.js';
import { DEFAULT_AGE_SETTINGS, DEFAULT_TICKET_PLANS } from '../data/defaults.js';
import { PARK_DEFAULTS } from '../config/park.js';

export function loadSettingsSync() {
  return { plans: DEFAULT_TICKET_PLANS, age: DEFAULT_AGE_SETTINGS, park: PARK_DEFAULTS };
}

function mapPlanRow(r) {
  return { id: r.id, label: r.label, hours: Number(r.hours), price: Number(r.price), active: r.active, popular: r.popular, description: r.description || '' };
}

export const settingsService = {
  async loadAll() {
    const [{ data: plans, error: plansError }, { data: rows, error: rowsError }] = await Promise.all([
      supabase.from('ticket_plans').select('*').order('sort_order'),
      supabase.from('app_settings').select('*'),
    ]);
    if (plansError) throw new Error(plansError.message);
    if (rowsError) throw new Error(rowsError.message);
    const byKey = Object.fromEntries((rows || []).map((r) => [r.key, r.value]));
    return {
      plans: plans && plans.length ? plans.map(mapPlanRow) : DEFAULT_TICKET_PLANS,
      age: { ...DEFAULT_AGE_SETTINGS, ...(byKey.age_settings || {}) },
      park: { ...PARK_DEFAULTS, ...(byKey.park_settings || {}) },
    };
  },

  async savePlans(plans) {
    validatePlans(plans);
    const rows = plans.map((p, i) => ({
      id: p.id, label: p.label, hours: p.hours, price: p.price,
      active: p.active, popular: !!p.popular, description: p.description || '', sort_order: i,
    }));
    const { error } = await supabase.from('ticket_plans').upsert(rows);
    if (error) throw new Error(error.message);
    return plans;
  },

  async saveAgeSettings(age) {
    validateAge(age);
    const { data, error } = await supabase.from('app_settings').update({ value: age }).eq('key', 'age_settings').select();
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error('Could not save — the "age_settings" row is missing from app_settings. Please contact support before relying on this change.');
    return age;
  },

  async saveParkSettings(park) {
    const { data, error } = await supabase.from('app_settings').update({ value: park }).eq('key', 'park_settings').select();
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error('Could not save — the "park_settings" row is missing from app_settings. Please contact support before relying on this change.');
    return park;
  },
};

function validatePlans(plans) {
  if (!plans.some((p) => p.active)) throw new Error('At least one ticket plan must be active.');
  plans.forEach((p) => {
    if (!p.label?.trim()) throw new Error('Every plan needs a name.');
    if (!(Number(p.price) > 0)) throw new Error(`Price for “${p.label}” must be greater than 0.`);
  });
}

function validateAge(a) {
  if (a.minAge < 0 || a.childMaxAge <= a.minAge) throw new Error('Child upper age must be greater than the minimum age.');
  if (a.maxAge <= a.childMaxAge) throw new Error('Maximum age must be greater than the child upper age.');
  if (a.childDiscountPct < 0 || a.childDiscountPct > 100 || a.adultDiscountPct < 0 || a.adultDiscountPct > 100) throw new Error('Discounts must be between 0 and 100%.');
}
