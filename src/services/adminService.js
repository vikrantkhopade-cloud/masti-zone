// Admin-side data API — bookings, customers, analytics and staff accounts
// are all read from Supabase. No demo/local-storage data is mixed in.
import { supabase } from '../lib/supabaseClient.js';
import { computeAnalytics, inRange } from '../utils/analytics.js';
import { canAccess } from '../data/adminRoles.js';

function mapBookingRow(row) {
  return {
    id: row.id,
    isDemo: false,
    customerId: row.customer_id,
    customerName: row.contact_name,
    email: row.contact_email,
    phone: row.contact_phone,
    city: '',
    visitDate: row.visit_date,
    entryTime: row.entry_time,
    planId: row.plan_id,
    planLabel: row.plan_label,
    quantity: row.quantity,
    childCount: row.child_count,
    adultCount: row.adult_count,
    visitors: (row.booking_visitors || []).map((v) => ({ name: v.name, age: v.age, gender: v.gender })),
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    transactionId: row.transaction_id,
    abandonedStage: row.abandoned_stage,
    cancelReason: row.cancel_reason,
    refundAmount: Number(row.refund_amount || 0),
    createdAt: row.created_at,
  };
}

// De-dupes concurrent calls: several hooks on the same admin page (e.g.
// Dashboard's useAnalytics() + useRangeBookings()) each ask for every
// booking at nearly the same moment — without this they'd fire the same
// Supabase query twice. The in-flight promise is shared, then cleared, so
// the NEXT unrelated call (after this one settles) always gets fresh data.
let bookingsInFlight = null;
async function fetchRealBookings() {
  if (bookingsInFlight) return bookingsInFlight;
  bookingsInFlight = (async () => {
    const { data, error } = await supabase.from('bookings').select('*, booking_visitors(*)').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapBookingRow);
  })();
  try {
    return await bookingsInFlight;
  } finally {
    bookingsInFlight = null;
  }
}

async function allBookings() {
  return fetchRealBookings();
}

function mapProfileRow(row) {
  return {
    id: row.id,
    name: row.full_name || row.email || 'Customer',
    email: row.email || '',
    phone: row.phone || '',
    city: row.city || '',
    joinedAt: row.created_at,
    gender: row.gender || '',
  };
}

async function fetchRealCustomers() {
  // Anonymous guest sign-ins also get a 'customer' profile row (so bookings
  // can reference them) but have no email — excluded here so the admin
  // Customers directory only lists people who actually registered. Their
  // bookings still count fully in Dashboard / All Bookings / analytics.
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'customer').not('email', 'is', null);
  if (error) throw new Error(error.message);
  return (data || []).map(mapProfileRow);
}

const sortByCreated = (a, b) => (a.createdAt < b.createdAt ? 1 : -1);

function mapStaffRow(row) {
  return {
    id: row.id,
    name: row.full_name || row.email || 'Staff',
    email: row.email || '',
    phone: row.phone || '',
    adminRole: row.admin_role || null,
    status: row.status,
    createdAt: row.created_at,
  };
}

// public.payments is a real table from day one (001_initial_schema.sql) but
// nothing writes to it yet — there is no payment gateway (see Payments.jsx).
// It will genuinely be empty until one is connected; that's shown as an
// empty state, never invented rows. Kept separate from bookings.payment_status,
// which IS populated today and remains the source for booking-level status.
function mapPaymentRow(row) {
  return {
    id: row.id,
    bookingId: row.booking_id,
    amount: Number(row.amount),
    currency: row.currency,
    method: row.method,
    provider: row.provider,
    providerRef: row.provider_ref,
    status: row.status,
    createdAt: row.created_at,
  };
}

// Parses a customer-submitted UPI reference out of a contact_messages row.
// See bookingService.submitPaymentReference for why contact_messages is the
// channel: it's the only table a customer/guest can insert into under
// existing RLS — bookings.transaction_id/payment_method are admin-only.
function mapClaimRow(row) {
  const bookingMatch = row.message?.match(/Booking (\S+)/);
  const utrMatch = row.message?.match(/UTR\/Ref:\s*(.+)$/);
  const amountMatch = row.message?.match(/Amount\s*₹?\s*([\d,]+(?:\.\d+)?)/);
  return {
    id: row.id,
    bookingId: bookingMatch ? bookingMatch[1] : null,
    utr: utrMatch ? utrMatch[1].trim() : null,
    claimedAmount: amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null,
    name: row.name,
    email: row.email,
    phone: row.phone,
    rawMessage: row.message,
    createdAt: row.created_at,
  };
}

// Standalone (not a method) so applyUpiPayment can call it directly without
// relying on `this` binding — safe even if a caller destructures methods
// off adminService instead of calling them as properties.
async function findDuplicateUtrBooking(transactionId, excludeBookingId) {
  const id = (transactionId || '').trim();
  if (!id) return null;
  const { data, error } = await supabase.from('bookings').select('id').eq('transaction_id', id).neq('id', excludeBookingId || '').limit(1);
  if (error) throw new Error(error.message);
  return data && data.length ? data[0].id : null;
}

export const adminService = {
  async getAnalytics(range, ageSettings) {
    return computeAnalytics(await allBookings(), range, ageSettings);
  },

  async listBookings({ range, statuses, paymentStatuses } = {}) {
    const list = await allBookings();
    return list
      .filter((b) => (range ? inRange(b, range) : true))
      .filter((b) => (statuses ? statuses.includes(b.status) : true))
      .filter((b) => (paymentStatuses ? paymentStatuses.includes(b.paymentStatus) : true))
      .sort(sortByCreated);
  },

  async listCustomers() {
    const [customers, bookings] = await Promise.all([fetchRealCustomers(), allBookings()]);
    const stats = new Map();
    bookings.forEach((b) => {
      if (!b.customerId) return;
      const s = stats.get(b.customerId) || { bookings: 0, spent: 0, visitors: 0, lastVisit: null, cancelled: 0 };
      if (b.status !== 'abandoned') s.bookings += 1;
      if (b.paymentStatus === 'paid') { s.spent += b.total; s.visitors += b.quantity; }
      if (b.status === 'cancelled') s.cancelled += 1;
      if (b.status === 'confirmed' && (!s.lastVisit || b.visitDate > s.lastVisit)) s.lastVisit = b.visitDate;
      stats.set(b.customerId, s);
    });
    return customers.map((c) => ({ ...c, ...(stats.get(c.id) || { bookings: 0, spent: 0, visitors: 0, lastVisit: null, cancelled: 0 }) }))
      .sort((a, b) => b.spent - a.spent);
  },

  // Full booking history for one registered customer — used by the
  // Customer Management drill-down. Reuses the same (de-duped) bookings
  // fetch as everywhere else rather than a separate query.
  async getCustomerBookings(customerId) {
    const list = await allBookings();
    return list.filter((b) => b.customerId === customerId).sort(sortByCreated);
  },

  // Lightweight counts (head:true — no row data transferred) for Dashboard
  // metrics that are NOT tied to the selected date range filter.
  async getTodayBookingsCount() {
    const today = new Date().toISOString().slice(0, 10);
    const { count, error } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('visit_date', today)
      .neq('status', 'cancelled');
    if (error) throw new Error(error.message);
    return count || 0;
  },

  async getTotalCustomersCount() {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')
      .not('email', 'is', null);
    if (error) throw new Error(error.message);
    return count || 0;
  },

  // Ticket verification (staff-only — gated by RequireAdmin/RequireSection
  // on the route, same "bookings" permission every staff role already has).
  // Looks up ONE booking by exact ID, straight from Supabase — never from
  // any local/guest cache — so the result always reflects the real,
  // current status. Returns null (not found) rather than throwing when no
  // row matches, so the caller can show a clear "not found" state.
  async verifyBooking(bookingId) {
    const id = (bookingId || '').trim().toUpperCase();
    if (!id) return null;
    const { data, error } = await supabase.from('bookings').select('*, booking_visitors(*)').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapBookingRow(data) : null;
  },

  // Real rows from public.payments (not bookings.payment_status) — see the
  // note on mapPaymentRow above. Empty until a payment gateway is wired up.
  async listPayments({ range } = {}) {
    let query = supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (range) query = query.gte('created_at', `${range.from}T00:00:00`).lte('created_at', `${range.to}T23:59:59`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapPaymentRow);
  },

  // Customer-submitted UPI payment references awaiting manual admin
  // verification. Tagged with a "[UPI-UTR]" prefix by
  // bookingService.submitPaymentReference so they can be told apart from
  // any other contact message. contact_messages has no "resolved" column
  // (and none is added — no schema change), so the caller cross-references
  // against real bookings data to tell which claims are already applied.
  async listUpiClaims() {
    const { data, error } = await supabase.from('contact_messages').select('*').ilike('message', '[UPI-UTR]%').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapClaimRow);
  },

  // Does this exact UTR already sit on a DIFFERENT booking? Used both as a
  // pre-check in the UI (to warn before the admin even confirms) and as a
  // hard guard inside applyUpiPayment below (so it can't be skipped by
  // calling that function directly). Read access relies on the existing
  // bookings_select_own_or_admin policy — no RLS change.
  findDuplicateUtrBooking,

  // The actual "mark as paid" step.
  //
  // RLS TODAY (001_initial_schema.sql, unchanged): bookings_admin_update
  // only checks is_admin() — it does not yet distinguish Super Admin /
  // Manager / Finance / Booking Staff, because profiles.admin_role doesn't
  // exist in the database yet (it's only proposed, in
  // supabase/migrations/002_admin_roles.sql, not applied). That migration
  // proposes narrowing this specific policy to is_finance_or_above() once
  // approved — see its "PAYMENTS AUTHORIZATION" section.
  //
  // Until that's applied, is_admin() is the ONLY real technical boundary.
  // The check below re-verifies the CALLER's own resolved role against the
  // same adminRoles.js "payments" permission the UI uses to show this
  // button, as defense-in-depth against a future UI regression — but this
  // is explicitly NOT a substitute for the RLS narrowing above; a
  // determined caller could still bypass this JS check today with a raw
  // API call, exactly as before. Do not rely on this check alone.
  async applyUpiPayment(bookingId, transactionId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Your session has expired. Please sign in again.');
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role, status, admin_role').eq('id', session.user.id).maybeSingle();
    if (profileError) throw new Error(profileError.message);
    const adminRole = profile?.admin_role || 'super_admin';
    if (!profile || profile.role !== 'admin' || profile.status !== 'active' || !canAccess(adminRole, 'payments')) {
      throw new Error('You are not authorized to verify payments.');
    }

    const duplicateOf = await findDuplicateUtrBooking(transactionId, bookingId);
    if (duplicateOf) {
      throw new Error(`This UTR is already recorded against booking ${duplicateOf}. The same transaction cannot be applied twice.`);
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ transaction_id: transactionId, payment_method: 'UPI', payment_status: 'paid', status: 'confirmed' })
      .eq('id', bookingId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No booking found with that ID.');
    return mapBookingRow(data);
  },

  // Staff accounts — backed by profiles.role = 'admin' (+ profiles.admin_role
  // once supabase/migrations/002_admin_roles.sql is approved and applied).
  // Enforced server-side by RLS (is_super_admin()), not just by hiding UI.
  async listStaff() {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapStaffRow);
  },

  // Promotes an EXISTING registered customer (by email) to a staff role.
  // There is no "create new login" step here on purpose — doing that would
  // need supabase.auth.admin.createUser(), which requires the service_role
  // key and must never run in the browser. The person must first create a
  // normal account at /register; this only flips their existing profile row.
  async promoteToStaff(email, adminRole) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin', admin_role: adminRole, status: 'active' })
      .eq('email', email.trim().toLowerCase())
      .eq('role', 'customer')
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No registered customer found with that email. Ask them to create an account at /register first, then promote them here.');
    return mapStaffRow(data);
  },

  async setStaffRole(id, adminRole) {
    const { data, error } = await supabase.from('profiles').update({ admin_role: adminRole }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return mapStaffRow(data);
  },

  async setStaffStatus(id, status) {
    const { data, error } = await supabase.from('profiles').update({ status }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return mapStaffRow(data);
  },
};
