-- MASTI ZONE — Phase 2 initial schema
-- 8 tables: profiles, ticket_plans, app_settings, bookings, booking_visitors,
-- payments, booking_events, contact_messages.
-- Not executed automatically — run manually in Supabase SQL Editor.

begin;

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- SHARED TRIGGER FUNCTION
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  city text,
  gender text check (gender in ('male','female','other')),
  role text not null default 'customer' check (role in ('customer','admin')),
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create unique index profiles_email_key on public.profiles (email);

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer',
    'active'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.guard_profile_updates()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_updates before update on public.profiles
  for each row execute function public.guard_profile_updates();

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

-- ============================================================
-- 2. TICKET PLANS
-- ============================================================
create table public.ticket_plans (
  id text primary key,
  label text not null,
  hours numeric not null,
  price numeric not null check (price > 0),
  active boolean not null default true,
  popular boolean not null default false,
  description text,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create index ticket_plans_active_idx on public.ticket_plans (active);

alter table public.ticket_plans enable row level security;

create trigger ticket_plans_set_updated_at before update on public.ticket_plans
  for each row execute function public.set_updated_at();

create policy "ticket_plans_public_read" on public.ticket_plans for select using (true);
create policy "ticket_plans_admin_insert" on public.ticket_plans for insert with check (public.is_admin());
create policy "ticket_plans_admin_update" on public.ticket_plans for update using (public.is_admin());
create policy "ticket_plans_admin_delete" on public.ticket_plans for delete using (public.is_admin());

insert into public.ticket_plans (id, label, hours, price, active, popular, description, sort_order) values
  ('1h', '1 Hour', 1, 200, true, false, 'Quick dip — perfect for a cool-down break.', 1),
  ('3h', '3 Hours', 3, 300, true, true, 'Slides, wave pool and a snack break.', 2),
  ('5h', '5 Hours', 5, 500, true, false, 'Explore every zone at a relaxed pace.', 3),
  ('full', 'Full Day', 8, 700, true, false, 'Opening to closing — the complete MASTI experience.', 4);

-- ============================================================
-- 3. APP SETTINGS (age_settings + park_settings as JSON blobs)
-- ============================================================
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.app_settings enable row level security;

create trigger app_settings_set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

create policy "app_settings_public_read" on public.app_settings for select using (true);
create policy "app_settings_admin_insert" on public.app_settings for insert with check (public.is_admin());
create policy "app_settings_admin_update" on public.app_settings for update using (public.is_admin());
create policy "app_settings_admin_delete" on public.app_settings for delete using (public.is_admin());

insert into public.app_settings (key, value) values
  ('age_settings', '{"minAge":2,"childMaxAge":12,"childDiscountPct":0,"adultDiscountPct":0,"maxAge":90}'),
  ('park_settings', '{"name":"MASTI ZONE","tagline":"Water Park & Splash Resort","phone":"","whatsapp":"","email":"","address":"","mapEmbedUrl":"","instagram":"https://instagram.com/","instagramHandle":"@mastizone","facebook":"https://facebook.com/","youtube":"https://youtube.com/","openTime":"10:00","closeTime":"18:00","weeklyOff":[],"taxRate":18,"maxTicketsPerBooking":15,"advanceBookingDays":60,"bookingsOpen":true,"announcement":"Monsoon Splash Week — wave pool open till 7 PM every weekend."}');

-- ============================================================
-- 4. BOOKINGS
-- ============================================================
create table public.bookings (
  id text primary key,
  customer_id uuid references public.profiles(id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  visit_date date not null,
  entry_time text not null,
  plan_id text not null references public.ticket_plans(id),
  plan_label text not null,
  quantity int not null check (quantity > 0),
  child_count int not null default 0,
  adult_count int not null default 0,
  unit_price numeric not null,
  subtotal numeric not null,
  tax numeric not null default 0,
  total numeric not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','abandoned')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','not_initiated','failed','refunded','refund_pending','not_charged')),
  payment_method text,
  transaction_id text,
  source text not null default 'website-test',
  is_demo boolean not null default false,
  abandoned_stage text,
  cancel_reason text,
  refund_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index bookings_customer_id_idx on public.bookings (customer_id);
create index bookings_plan_id_idx on public.bookings (plan_id);
create index bookings_visit_date_idx on public.bookings (visit_date);
create index bookings_status_idx on public.bookings (status);
create index bookings_payment_status_idx on public.bookings (payment_status);
create index bookings_created_at_idx on public.bookings (created_at desc);

alter table public.bookings enable row level security;

create or replace function public.guard_booking_updates()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.customer_id is distinct from old.customer_id
       or new.contact_name is distinct from old.contact_name
       or new.contact_email is distinct from old.contact_email
       or new.contact_phone is distinct from old.contact_phone
       or new.visit_date is distinct from old.visit_date
       or new.entry_time is distinct from old.entry_time
       or new.plan_id is distinct from old.plan_id
       or new.plan_label is distinct from old.plan_label
       or new.quantity is distinct from old.quantity
       or new.unit_price is distinct from old.unit_price
       or new.subtotal is distinct from old.subtotal
       or new.tax is distinct from old.tax
       or new.total is distinct from old.total
       or new.payment_method is distinct from old.payment_method
       or new.transaction_id is distinct from old.transaction_id
       or new.is_demo is distinct from old.is_demo
       or new.source is distinct from old.source then
      raise exception 'Only admins can modify booking core/financial fields';
    end if;
    if old.status not in ('pending','confirmed') or new.status <> 'cancelled' or new.payment_status <> 'not_charged' then
      raise exception 'Customers may only cancel a pending or confirmed booking';
    end if;
    new.cancelled_at := now();
  end if;
  return new;
end;
$$;

create trigger bookings_guard_updates before update on public.bookings
  for each row execute function public.guard_booking_updates();

create policy "bookings_select_own_or_admin" on public.bookings
  for select using (customer_id = auth.uid() or public.is_admin());

create policy "bookings_insert_guest_or_own" on public.bookings
  for insert
  with check (
    is_demo = false
    and status = 'pending'
    and payment_status = 'pending'
    and (
      (auth.uid() is null and customer_id is null)
      or (auth.uid() is not null and (customer_id = auth.uid() or customer_id is null))
    )
  );

create policy "bookings_admin_insert" on public.bookings
  for insert with check (public.is_admin());

create policy "bookings_cancel_own" on public.bookings
  for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy "bookings_admin_update" on public.bookings
  for update using (public.is_admin());

create policy "bookings_admin_delete" on public.bookings
  for delete using (public.is_admin());

-- ============================================================
-- 5. BOOKING VISITORS
-- ============================================================
create table public.booking_visitors (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.bookings(id) on delete cascade,
  name text not null,
  age int not null check (age >= 0),
  gender text check (gender in ('male','female','other'))
);

create index booking_visitors_booking_id_idx on public.booking_visitors (booking_id);

alter table public.booking_visitors enable row level security;

create policy "booking_visitors_select" on public.booking_visitors
  for select using (
    public.is_admin()
    or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
  );

create policy "booking_visitors_insert" on public.booking_visitors
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and ((auth.uid() is null and b.customer_id is null) or b.customer_id = auth.uid())
    )
  );

create policy "booking_visitors_admin_update" on public.booking_visitors for update using (public.is_admin());
create policy "booking_visitors_admin_delete" on public.booking_visitors for delete using (public.is_admin());

-- ============================================================
-- 6. PAYMENTS (structure only — no real processing yet)
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.bookings(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'INR',
  method text,
  provider text,
  provider_ref text,
  status text not null default 'initiated' check (status in ('initiated','pending','success','failed','refunded')),
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index payments_booking_id_idx on public.payments (booking_id);
create index payments_status_idx on public.payments (status);

alter table public.payments enable row level security;

create policy "payments_select" on public.payments
  for select using (
    public.is_admin()
    or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
  );
create policy "payments_admin_insert" on public.payments for insert with check (public.is_admin());
create policy "payments_admin_update" on public.payments for update using (public.is_admin());
create policy "payments_admin_delete" on public.payments for delete using (public.is_admin());

-- ============================================================
-- 7. BOOKING EVENTS (audit trail)
-- ============================================================
create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null references public.bookings(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index booking_events_booking_id_idx on public.booking_events (booking_id);
create index booking_events_created_at_idx on public.booking_events (created_at desc);

alter table public.booking_events enable row level security;

create policy "booking_events_select" on public.booking_events
  for select using (
    public.is_admin()
    or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
  );
create policy "booking_events_admin_insert" on public.booking_events for insert with check (public.is_admin());

create or replace function public.log_booking_event()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.booking_events (booking_id, event_type, from_status, to_status, actor_id)
    values (new.id, 'created', null, new.status, auth.uid());
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.booking_events (booking_id, event_type, from_status, to_status, actor_id)
    values (new.id, 'status_changed', old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger bookings_log_event
  after insert or update on public.bookings
  for each row execute function public.log_booking_event();

-- ============================================================
-- 8. CONTACT MESSAGES
-- ============================================================
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz not null default now()
);

create index contact_messages_created_at_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "contact_messages_insert_public" on public.contact_messages for insert with check (true);
create policy "contact_messages_admin_select" on public.contact_messages for select using (public.is_admin());

commit;
