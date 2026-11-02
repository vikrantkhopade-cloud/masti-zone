// Email/password authentication for customers and admins.
// Phone numbers are collected and stored, but never OTP-verified (no paid SMS provider).
//
// Guest → registered conversion: a guest who booked without an account has a
// real Supabase Anonymous Sign-in session (see bookingService.ensureIdentityForBooking).
// If that session is still active when they register, we call
// supabase.auth.updateUser() instead of signUp() — this sets email/password on
// the SAME auth.uid() rather than creating a new user, so every booking
// already saved with that uid (bookings.customer_id) stays linked. Supabase
// still requires the new email to be confirmed before the account becomes
// permanent (is_anonymous flips to false only after that click).
import { supabase } from '../lib/supabaseClient.js';

const emailRedirectTo = () => `${window.location.origin}/auth/callback`;

/** Copies a confirmed user's name/phone/email onto their profiles row. Safe to call
 * repeatedly — RLS already lets a user update only their own row (id = auth.uid()). */
async function syncProfile(user) {
  if (!user || user.is_anonymous) return;
  const meta = user.user_metadata || {};
  const patch = { email: user.email };
  if (meta.full_name) patch.full_name = meta.full_name;
  if (meta.phone) patch.phone = meta.phone;
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) throw new Error(error.message);
}

export const authService = {
  async register({ name, email, phone, password }) {
    const { data: { session: current } } = await supabase.auth.getSession();
    const currentUser = current?.user || null;

    if (currentUser && !currentUser.is_anonymous) {
      throw new Error('You are already signed in. Please sign out before creating a new account.');
    }

    if (currentUser && currentUser.is_anonymous) {
      // Convert the anonymous guest session in place — same auth.uid().
      const { data, error } = await supabase.auth.updateUser(
        { email, password, data: { full_name: name, phone } },
        { emailRedirectTo: emailRedirectTo() },
      );
      if (error) throw new Error(error.message);
      const { data: { session } } = await supabase.auth.getSession();
      const confirmed = !!session && !session.user.is_anonymous;
      if (confirmed) await syncProfile(session.user);
      return { user: data.user, session, linkedGuest: true, needsConfirmation: !confirmed };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone }, emailRedirectTo: emailRedirectTo() },
    });
    if (error) throw new Error(error.message);
    return { user: data.user, session: data.session, linkedGuest: false, needsConfirmation: !data.session };
  },

  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data; // { user, session }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session;
  },

  async getProfile(userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateProfile(userId, patch) {
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  /** Called after an email-confirmation redirect lands with a session — brings
   * the profiles row (email/full_name/phone) in sync for newly-confirmed users. */
  syncProfileFromUser: syncProfile,

  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return data.subscription;
  },
};
