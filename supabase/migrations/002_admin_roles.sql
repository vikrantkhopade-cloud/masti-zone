-- MASTI ZONE — Phase: Admin Staff Management (role-based access)
-- PROPOSED ONLY. Not executed by Claude. Review, then run manually in
-- Supabase SQL Editor once approved (same convention as 001_initial_schema.sql).
--
-- v5 — added section 8 (PAYMENTS AUTHORIZATION), following a security audit
-- of the Direct UPI Payment feature. That audit found that
-- bookings_admin_update (from 001_initial_schema.sql) only checks
-- is_admin() — once this migration's admin_role distinctions exist, EVERY
-- staff sub-role (including Booking Staff, who deliberately has no
-- "payments" section in src/data/adminRoles.js) would still individually
-- satisfy is_admin() and could successfully mark a booking paid via a
-- direct API call, bypassing the frontend route guard entirely. Not
-- exploitable today (no sub-roles exist in the database yet — everyone
-- with role='admin' is effectively the same), but it must be closed in
-- the SAME migration that introduces those sub-roles, not left for later.
-- Section 8 replaces bookings_admin_update with a narrower
-- bookings_payment_update restricted to is_finance_or_above() — this
-- policy is, today, the ONLY admin write path to bookings (nothing else
-- in the app currently performs an admin-side bookings UPDATE), so this
-- is a targeted fix, not a speculative one.
--
-- v4 — active_super_admin_count() changed from STABLE to VOLATILE. STABLE
-- asserts "same result for the same arguments within one statement", which
-- is not true for a function that reports on globally mutable state other
-- sessions can change — it should never have carried that marking. See the
-- "SNAPSHOT NOTE" in section 3 for why the guard triggers already got a
-- fresh read after the advisory-lock wait regardless, and why this change
-- removes any remaining doubt rather than fixing an observed bug.
--
-- v3 — revised again after a concurrency + permissions security review.
-- Changes from v2:
--   1. v2's last-active-Super-Admin check had a race: two concurrent
--      transactions each disabling/deleting a DIFFERENT active super admin
--      could both pass the "count > 1" check (each sees the other's
--      not-yet-committed row as still active under READ COMMITTED), then
--      both commit, leaving zero active super admins. Fixed by having both
--      guard triggers take a Postgres advisory transaction lock BEFORE
--      re-checking the count, so the second transaction is forced to wait
--      for the first to commit (or roll back) and then re-reads a
--      now-accurate count. See "CONCURRENCY PROTECTION" note in section 3.
--   2. Added an explicit EXECUTE-permission section (7) at the end:
--      active_super_admin_count() and the new lock_super_admin_guard()
--      are revoked from PUBLIC/anon/authenticated — they are only ever
--      called from inside the two SECURITY DEFINER trigger functions,
--      which run with the function owner's privileges, so revoking direct
--      access doesn't break the triggers but does stop anyone (including
--      an unauthenticated caller) from reading the super-admin count or
--      poking the lock via a direct PostgREST RPC call. is_super_admin(),
--      is_finance_or_above(), can_view_customers() and can_view_payments()
--      are deliberately left callable by anon/authenticated, same as the
--      is_admin() function from 001 — they only ever report the CALLER's
--      own role (id = auth.uid()), so there is nothing to leak, and they
--      are referenced directly inside RLS policy USING clauses evaluated
--      under those roles, so revoking them would break every table read
--      that depends on those policies.
--
-- Nothing here touches booking_visitors, booking_events, contact_messages,
-- handle_new_user(), guard_booking_updates(), or the guest/anonymous
-- booking insert/select/cancel policies — the entire customer/guest
-- booking flow (creating, viewing, cancelling a booking) is unchanged.
-- The ONE exception is bookings_admin_update → bookings_payment_update in
-- section 8, which only affects the admin-side "mark as paid" action.

begin;

-- ════════════════════════════════════════════════════════════════════════
-- 1. NEW COLUMN — backfill BEFORE the constraint that depends on it
-- ════════════════════════════════════════════════════════════════════════
alter table public.profiles
  add column if not exists admin_role text
    check (admin_role in ('super_admin', 'manager', 'finance', 'booking_staff'));

-- Backfill first: every existing role='admin' row becomes a super_admin.
-- This MUST run before the constraint below, otherwise adding the
-- constraint fails immediately against any admin row that still has
-- admin_role = null.
update public.profiles
  set admin_role = 'super_admin'
  where role = 'admin' and admin_role is null;

-- Now it's safe to enforce: admin_role is set if and only if role = 'admin'.
alter table public.profiles drop constraint if exists profiles_admin_role_matches_role;
alter table public.profiles
  add constraint profiles_admin_role_matches_role
  check ((role = 'admin') = (admin_role is not null));

-- ════════════════════════════════════════════════════════════════════════
-- 2. HELPER FUNCTIONS — define before anything that calls them
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.is_super_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active' and admin_role = 'super_admin'
  );
$$;

-- How many active super admins exist right now. Used to block the action
-- that would bring this number to zero (disable, downgrade, or delete).
-- Only ever called from inside the SECURITY DEFINER trigger functions
-- below — see section 7 for why direct access is revoked.
--
-- VOLATILE (not STABLE): this function reads global state that changes
-- due to OTHER sessions' commits, which is the opposite of what STABLE
-- asserts ("same result for the same arguments within one statement").
-- It must always re-read current data when called after the advisory
-- lock wait in section 3 — see the note there for why that matters.
create or replace function public.active_super_admin_count()
returns int
language sql security definer set search_path = public volatile
as $$
  select count(*)::int from public.profiles
  where role = 'admin' and status = 'active' and admin_role = 'super_admin';
$$;

-- Shared advisory-lock helper for the concurrency fix in section 3. The
-- key (9145728301) is an arbitrary fixed constant — it only has to be the
-- same value in every call site below. Holding a transaction-scoped
-- advisory lock (pg_advisory_xact_lock) means it is released automatically
-- at COMMIT or ROLLBACK, never needs manual unlocking, and can't be leaked
-- by a crashed connection.
create or replace function public.lock_super_admin_guard()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(9145728301);
end;
$$;

create or replace function public.is_finance_or_above()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active' and admin_role in ('super_admin', 'finance')
  );
$$;

-- Matches the "customers" section in src/data/adminRoles.js: super_admin + manager.
create or replace function public.can_view_customers()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active' and admin_role in ('super_admin', 'manager')
  );
$$;

-- Matches the "payments" section in src/data/adminRoles.js: everyone except booking_staff.
create or replace function public.can_view_payments()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active' and admin_role in ('super_admin', 'manager', 'finance')
  );
$$;

-- ════════════════════════════════════════════════════════════════════════
-- 3. TRIGGERS — role/status changes gated to super admin, last-super-admin
--    lockout protection on both UPDATE and DELETE
--
-- CONCURRENCY PROTECTION: both guard functions below call
-- lock_super_admin_guard() — which takes a single, fixed-key Postgres
-- advisory transaction lock — BEFORE calling active_super_admin_count().
-- The lock is only acquired when the row being touched is CURRENTLY an
-- active super admin (so ordinary customer/staff writes never take it and
-- are not slowed down by it). Two transactions that are each trying to
-- take a DIFFERENT active super admin below that status will now acquire
-- the same lock key: the second one blocks until the first commits or
-- rolls back, and only then re-runs its own count check — by which point
-- the first transaction's change is either visible (committed) or gone
-- (rolled back). This closes the race where two concurrent transactions
-- could each see "count > 1" (because neither has seen the other's
-- not-yet-committed change) and both proceed, leaving zero active super
-- admins. Same lock key is used for UPDATE and DELETE so a concurrent
-- disable-via-update and delete-via-delete also serialize against each
-- other, not just against their own kind. This covers all three
-- interleavings: UPDATE/UPDATE (two disables/downgrades), DELETE/DELETE
-- (two deletes), and UPDATE/DELETE (one of each) — all take the same lock
-- key, so whichever two run concurrently, the second always waits for the
-- first.
--
-- SNAPSHOT NOTE: under READ COMMITTED (Postgres's default, unchanged
-- here), each SQL command run from inside a VOLATILE PL/pgSQL function —
-- which both guard_profile_updates() and guard_profile_deletes() are,
-- since neither is marked STABLE/IMMUTABLE — gets a fresh snapshot of
-- committed data, rather than reusing one snapshot for the whole function
-- body. So the call to active_super_admin_count() that runs AFTER
-- lock_super_admin_guard() returns (i.e. after waiting for the other
-- transaction to commit or roll back) executes as a new command and sees
-- that transaction's result if it committed. active_super_admin_count()
-- is additionally marked VOLATILE itself (see section 2) so there is no
-- ambiguity from its own declaration either way — both the caller and the
-- callee agree this read must never be treated as cacheable.
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.guard_profile_updates()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  was_active_super boolean;
  remains_active_super boolean;
begin
  -- Only a super admin may change role / status / admin_role at all —
  -- anyone else's attempt is silently reverted to the current value.
  if not public.is_super_admin() then
    new.role := old.role;
    new.status := old.status;
    new.admin_role := old.admin_role;
  end if;

  was_active_super := (old.role = 'admin' and old.status = 'active' and old.admin_role = 'super_admin');

  if was_active_super then
    -- Serialize with any other concurrent transaction also touching an
    -- active super admin row, then re-check with an up-to-date count.
    perform public.lock_super_admin_guard();

    remains_active_super := (new.role = 'admin' and new.status = 'active' and new.admin_role = 'super_admin');
    if not remains_active_super and public.active_super_admin_count() <= 1 then
      raise exception 'Cannot disable or downgrade the last active Super Admin.';
    end if;
  end if;

  return new;
end;
$$;
-- (trigger already exists from 001_initial_schema.sql and points at this
-- function by name, so CREATE OR REPLACE FUNCTION above is enough — no
-- need to touch the trigger itself.)

create or replace function public.guard_profile_deletes()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if old.role = 'admin' and old.status = 'active' and old.admin_role = 'super_admin' then
    perform public.lock_super_admin_guard();
    if public.active_super_admin_count() <= 1 then
      raise exception 'Cannot delete the last active Super Admin.';
    end if;
  end if;
  return old;
end;
$$;

drop trigger if exists profiles_guard_deletes on public.profiles;
create trigger profiles_guard_deletes before delete on public.profiles
  for each row execute function public.guard_profile_deletes();

-- ════════════════════════════════════════════════════════════════════════
-- 4. PROFILES POLICIES
-- ════════════════════════════════════════════════════════════════════════
-- UPDATE: everyone can update their own row (guarded by the trigger above
-- for role/status/admin_role); only a super admin may update someone else's.
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_by_super_admin" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_update_by_super_admin" on public.profiles
  for update using (public.is_super_admin());

-- SELECT: own row always; a super admin sees every row (needed for Staff
-- Management); a manager additionally sees customer rows only (needed for
-- the Customers page) — but not other staff rows. Finance and Booking
-- Staff only ever see their own row here (they reach bookings/visitors
-- through the bookings-table policies below, not through profiles).
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_super_admin()
    or (public.can_view_customers() and role = 'customer')
  );

-- DELETE: narrowed from "any admin" to "super admin only" — deleting a
-- staff or customer profile is at least as sensitive as disabling one,
-- and is now covered by the same last-super-admin protection (trigger
-- above also fires on DELETE).
drop policy if exists "profiles_admin_delete" on public.profiles;
drop policy if exists "profiles_super_admin_delete" on public.profiles;
create policy "profiles_super_admin_delete" on public.profiles
  for delete using (public.is_super_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 5. BOOKINGS-RELATED READ ACCESS — reviewed, one change, one deliberate no-op
-- ════════════════════════════════════════════════════════════════════════
-- bookings: left exactly as in 001 (is_admin() OR own row). "Bookings" is
-- in every role's section list in src/data/adminRoles.js, including
-- Booking Staff, so no sub-role narrowing is wanted here.
--
-- booking_visitors: left exactly as in 001 (is_admin() OR own booking).
-- DELIBERATELY UNCHANGED: every admin page that lists bookings (All
-- Bookings, Abandoned, Cancelled — all reachable by Booking Staff) joins
-- booking_visitors to show visitor names/ages in the details modal. If
-- this were narrowed to exclude Booking Staff, those existing pages would
-- silently lose visitor details for the one role whose main job is the
-- bookings list. Narrowing it would conflict with requirement #5
-- (preserve existing functionality), so it stays broad, matching "bookings"
-- access for all 4 roles.
--
-- payments: narrowed below (this table isn't queried by any current page —
-- admin pages read payment_status/method/transaction_id straight off the
-- bookings row — but the task asked for it to be reviewed, and tightening
-- it now costs nothing and keeps it correct for when it IS wired up).
drop policy if exists "payments_select" on public.payments;
create policy "payments_select" on public.payments
  for select using (
    public.can_view_payments()
    or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
  );

-- booking_events: left exactly as in 001. No current UI reads this table
-- at all, so there is nothing to align it with yet (out of scope — #9).

-- ════════════════════════════════════════════════════════════════════════
-- 6. SETTINGS & PAYMENTS WRITES — unchanged from v1
-- ════════════════════════════════════════════════════════════════════════
drop policy if exists "ticket_plans_admin_insert" on public.ticket_plans;
drop policy if exists "ticket_plans_admin_update" on public.ticket_plans;
drop policy if exists "ticket_plans_admin_delete" on public.ticket_plans;
drop policy if exists "ticket_plans_super_admin_insert" on public.ticket_plans;
drop policy if exists "ticket_plans_super_admin_update" on public.ticket_plans;
drop policy if exists "ticket_plans_super_admin_delete" on public.ticket_plans;
create policy "ticket_plans_super_admin_insert" on public.ticket_plans for insert with check (public.is_super_admin());
create policy "ticket_plans_super_admin_update" on public.ticket_plans for update using (public.is_super_admin());
create policy "ticket_plans_super_admin_delete" on public.ticket_plans for delete using (public.is_super_admin());

drop policy if exists "app_settings_admin_insert" on public.app_settings;
drop policy if exists "app_settings_admin_update" on public.app_settings;
drop policy if exists "app_settings_admin_delete" on public.app_settings;
drop policy if exists "app_settings_super_admin_insert" on public.app_settings;
drop policy if exists "app_settings_super_admin_update" on public.app_settings;
drop policy if exists "app_settings_super_admin_delete" on public.app_settings;
create policy "app_settings_super_admin_insert" on public.app_settings for insert with check (public.is_super_admin());
create policy "app_settings_super_admin_update" on public.app_settings for update using (public.is_super_admin());
create policy "app_settings_super_admin_delete" on public.app_settings for delete using (public.is_super_admin());

drop policy if exists "payments_admin_insert" on public.payments;
drop policy if exists "payments_admin_update" on public.payments;
drop policy if exists "payments_admin_delete" on public.payments;
drop policy if exists "payments_finance_insert" on public.payments;
drop policy if exists "payments_finance_update" on public.payments;
drop policy if exists "payments_finance_delete" on public.payments;
create policy "payments_finance_insert" on public.payments for insert with check (public.is_finance_or_above());
create policy "payments_finance_update" on public.payments for update using (public.is_finance_or_above());
create policy "payments_finance_delete" on public.payments for delete using (public.is_super_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 7. FUNCTION EXECUTE PERMISSIONS — close off direct RPC access to the two
--    internal-only helpers; explicitly keep the self-check helpers open.
-- ════════════════════════════════════════════════════════════════════════
-- active_super_admin_count() and lock_super_admin_guard() are ONLY called
-- from inside guard_profile_updates()/guard_profile_deletes(), which are
-- SECURITY DEFINER — once execution is inside them, further function calls
-- they make are checked against the DEFINER's (function owner's)
-- privileges, not the original caller's, so revoking these two from
-- PUBLIC/anon/authenticated does not break the triggers. It does stop any
-- client — including an unauthenticated one — from calling them directly
-- via PostgREST's /rest/v1/rpc/<function> endpoint (which would otherwise
-- let anyone read the current active-Super-Admin count, or momentarily
-- hold the guard lock, for no legitimate reason).
revoke execute on function public.active_super_admin_count() from public;
revoke execute on function public.active_super_admin_count() from anon;
revoke execute on function public.active_super_admin_count() from authenticated;

revoke execute on function public.lock_super_admin_guard() from public;
revoke execute on function public.lock_super_admin_guard() from anon;
revoke execute on function public.lock_super_admin_guard() from authenticated;

-- is_super_admin(), is_finance_or_above(), can_view_customers() and
-- can_view_payments() are deliberately left executable by anon and
-- authenticated (same as is_admin() from 001, intentionally unchanged):
-- each only reports facts about the CALLER's own row (id = auth.uid()),
-- so there is nothing for any role to learn about anyone else by calling
-- them directly. They are also referenced inside RLS policy USING clauses
-- (e.g. profiles_select, payments_select) that are evaluated under the
-- anon/authenticated roles for every table read those roles make, so
-- revoking execute here would break logins, profile loads, bookings, and
-- payments reads for every customer and guest, not just admins.
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.is_finance_or_above() to anon, authenticated;
grant execute on function public.can_view_customers() to anon, authenticated;
grant execute on function public.can_view_payments() to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 8. PAYMENTS AUTHORIZATION — narrow the one admin write path to bookings
--    that exists today (marking a booking paid) to the roles that are
--    actually meant to hold that authority.
-- ════════════════════════════════════════════════════════════════════════
-- bookings_admin_update (001_initial_schema.sql) used `is_admin()` — true
-- for ANY staff sub-role once admin_role exists, including Booking Staff,
-- who has no "payments" section in src/data/adminRoles.js and no route to
-- the Payments page at all. Without this change, that frontend restriction
-- would be the ONLY thing stopping a Booking Staff account from marking a
-- booking paid via a direct API call — exactly the "hidden button, not
-- real authorization" gap flagged by this feature's security audit.
-- Currently the ONLY code path that performs an admin-side bookings UPDATE
-- is adminService.applyUpiPayment() (verifying a UPI payment), so this is
-- a targeted narrowing, not a speculative one — nothing else is affected.
drop policy if exists "bookings_admin_update" on public.bookings;
drop policy if exists "bookings_payment_update" on public.bookings;
create policy "bookings_payment_update" on public.bookings
  for update using (public.is_finance_or_above());

commit;
