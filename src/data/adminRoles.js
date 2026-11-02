// Single source of truth for the 4 staff roles and what each one can see.
// Used by: AdminLayout (nav filtering), RequireSection (route guarding) and
// the Staff Management page. Edit the SECTIONS_BY_ROLE map to change who can
// access what — no other file needs to change.
//
// IMPORTANT: this is the FRONTEND half of the permission model only. The
// authoritative half is the Postgres RLS/trigger changes proposed in
// supabase/migrations/002_admin_roles.sql (not yet applied). Until that
// migration is applied and approved, every existing admin is treated as a
// super_admin (see RequireAdmin.jsx) and the database itself does not yet
// distinguish between these 4 roles for write access to settings/payments.
export const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full access, including staff management and settings.' },
  { value: 'manager', label: 'Manager', desc: 'Bookings, customers, analytics, revenue, payments and reports.' },
  { value: 'finance', label: 'Finance', desc: 'Bookings, payments, revenue and reports.' },
  { value: 'booking_staff', label: 'Booking Staff', desc: 'Dashboard and bookings only — for the ticket counter.' },
];

const SECTIONS_BY_ROLE = {
  super_admin: ['dashboard', 'bookings', 'customers', 'analytics', 'revenue', 'payments', 'reports', 'settings', 'staff'],
  manager: ['dashboard', 'bookings', 'customers', 'analytics', 'revenue', 'payments', 'reports'],
  finance: ['dashboard', 'bookings', 'payments', 'revenue', 'reports'],
  booking_staff: ['dashboard', 'bookings'],
};

export function roleLabel(value) {
  return ADMIN_ROLES.find((r) => r.value === value)?.label || value || 'Staff';
}

/** Can this admin role see/use the given section (e.g. 'settings', 'payments')? */
export function canAccess(adminRole, section) {
  return !!adminRole && (SECTIONS_BY_ROLE[adminRole] || []).includes(section);
}
