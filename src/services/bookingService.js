// Customer-side booking API — Supabase-backed.
// Bookings are created with status "pending" and payment "pending". NO
// payment is processed and nothing is ever marked as paid from here.
//
// Guest checkout: a guest who submits a booking without a real account is
// given a Supabase Anonymous Sign-in identity (no email/password, no OTP —
// just a real, unguessable auth.uid() issued by Supabase). That uid is saved
// as bookings.customer_id, so the EXISTING RLS policies (customer_id =
// auth.uid()) already let the guest read, list and cancel only their own
// booking — no new SQL/RLS was needed for this.
// If Anonymous Sign-ins are not enabled in the Supabase dashboard yet (or the
// call fails for any reason), we fall back to the original behaviour: the
// booking is still saved (customer_id = null) and a copy is kept in this
// browser's storage, so guest checkout never breaks either way.
import { supabase } from '../lib/supabaseClient.js';
import { storage } from './storage.js';

const GUEST_KEY = 'guestBookings';

// Exported so Checkout can pre-generate the same reference it will submit
// to createBooking() — needed so a UPI payment made from the Checkout page
// (before the booking row exists) and the row created moments later share
// one consistent booking ID.
export function generateBookingReference() {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `MZ-${t}${r}`;
}

function cacheGuestBooking(booking) {
  const list = storage.get(GUEST_KEY, []);
  storage.set(GUEST_KEY, [booking, ...list].slice(0, 50));
}

function updateGuestBooking(id, patch) {
  const list = storage.get(GUEST_KEY, []);
  let updated = null;
  const next = list.map((b) => {
    if (b.id !== id) return b;
    updated = { ...b, ...patch };
    return updated;
  });
  storage.set(GUEST_KEY, next);
  return updated;
}

function mapRow(row, visitors) {
  return {
    id: row.id,
    customerId: row.customer_id,
    isDemo: false,
    source: row.source,
    visitDate: row.visit_date,
    entryTime: row.entry_time,
    planId: row.plan_id,
    planLabel: row.plan_label,
    quantity: row.quantity,
    childCount: row.child_count,
    adultCount: row.adult_count,
    visitors: visitors || [],
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    contact: { name: row.contact_name, email: row.contact_email, phone: row.contact_phone },
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    transactionId: row.transaction_id,
    cancelReason: row.cancel_reason,
    refundAmount: Number(row.refund_amount || 0),
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
  };
}

/** Current session's user, without creating anything — safe for reads. */
async function sessionUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

/**
 * Current session's user for a WRITE (creating a booking). If there is no
 * session yet, this creates a Supabase Anonymous Sign-in so the guest gets a
 * real, unguessable auth.uid() — no email/password, no prompt shown.
 * Returns null only if anonymous sign-in itself is unavailable, so the
 * caller can fall back to the pre-anonymous-auth behaviour.
 */
async function ensureIdentityForBooking() {
  const existing = await sessionUser();
  if (existing) return existing;
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Anonymous guest sign-in is unavailable — saving this booking without a synced account:', err.message);
    return null;
  }
}

export const bookingService = {
  async createBooking(draft, { id: presetId } = {}) {
    const user = await ensureIdentityForBooking();
    const id = presetId || generateBookingReference();
    const row = {
      id,
      customer_id: user ? user.id : null,
      contact_name: draft.contact.name,
      contact_email: draft.contact.email,
      contact_phone: draft.contact.phone,
      visit_date: draft.visitDate,
      entry_time: draft.entryTime,
      plan_id: draft.planId,
      plan_label: draft.planLabel,
      quantity: draft.quantity,
      child_count: draft.childCount,
      adult_count: draft.adultCount,
      unit_price: draft.unitPrice,
      subtotal: draft.subtotal,
      tax: draft.tax,
      total: draft.total,
    };
    const { error } = await supabase.from('bookings').insert(row);
    if (error) throw new Error(error.message || 'Could not save your booking. Please try again.');

    const visitorRows = draft.visitors.slice(0, draft.quantity).map((v) => ({ booking_id: id, name: v.name, age: Number(v.age), gender: v.gender }));
    const { error: visitorsError } = await supabase.from('booking_visitors').insert(visitorRows);
    if (visitorsError) {
      // eslint-disable-next-line no-console
      console.warn('Visitor details were not saved to the server for this booking:', visitorsError.message);
    }

    const booking = mapRow(
      { ...row, status: 'pending', payment_status: 'pending', created_at: new Date().toISOString(), cancelled_at: null },
      draft.visitors.slice(0, draft.quantity),
    );
    // Local fallback copy only when anonymous sign-in itself was unavailable.
    if (!user) cacheGuestBooking(booking);
    return booking;
  },

  async getMyBookings() {
    const user = await sessionUser();
    if (!user) return storage.get(GUEST_KEY, []);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, booking_visitors(*)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => mapRow(row, row.booking_visitors || []));
  },

  async getBooking(id) {
    const { data, error } = await supabase.from('bookings').select('*, booking_visitors(*)').eq('id', id).maybeSingle();
    if (!error && data) return mapRow(data, data.booking_visitors || []);
    const cached = storage.get(GUEST_KEY, []).find((b) => b.id === id);
    if (cached) return cached;
    throw new Error('We could not find this booking. It may have been created on another device or as a guest.');
  },

  /**
   * Records a customer-submitted UPI transaction reference for manual
   * admin verification. This does NOT write to bookings.transaction_id or
   * payment_method — those are admin-only fields, enforced by
   * guard_booking_updates() in 001_initial_schema.sql, which a plain
   * customer/guest UPDATE cannot touch (by design, unchanged here). The
   * only table a customer/guest can insert into for this purpose under
   * existing RLS is contact_messages (contact_messages_insert_public
   * allows any caller, authenticated or not) — so the reference is stored
   * there, tagged so the admin Payments page can find it, and an admin
   * then manually applies it to the real booking after verifying the
   * actual bank transaction (see adminService.applyUpiPayment).
   */
  async submitPaymentReference(booking, utr) {
    const message = `[UPI-UTR] Booking ${booking.id} | Amount ₹${booking.total} | UTR/Ref: ${utr}`;
    const { error } = await supabase.from('contact_messages').insert({
      name: booking.contact?.name || 'Guest',
      email: booking.contact?.email || 'unknown@example.com',
      phone: booking.contact?.phone || null,
      message,
    });
    if (error) throw new Error(error.message || 'Could not submit your payment reference.');
  },

  async requestCancellation(id) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', payment_status: 'not_charged' })
      .eq('id', id)
      .select('*, booking_visitors(*)')
      .maybeSingle();
    if (!error && data) return mapRow(data, data.booking_visitors || []);
    const updated = updateGuestBooking(id, { status: 'cancelled', paymentStatus: 'not_charged', cancelledAt: new Date().toISOString() });
    if (!updated) throw new Error(error?.message || 'Could not cancel this booking.');
    return updated;
  },
};

export const contactService = {
  // contact_messages has no "topic" column (see 001_initial_schema.sql) —
  // folded into the message text instead, same convention already used by
  // bookingService.submitPaymentReference's "[UPI-UTR] ..." tag.
  async sendMessage(payload) {
    const message = `[Topic: ${payload.topic}] ${payload.message}`;
    const { error } = await supabase.from('contact_messages').insert({
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      message,
    });
    if (error) throw new Error(error.message || 'Could not send your message.');
    return { received: true };
  },
};
