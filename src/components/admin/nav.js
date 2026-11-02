import {
  BarChart3, Ban, CalendarCheck2, CreditCard, FileSpreadsheet, LayoutDashboard, QrCode, Settings2, ShoppingCart,
  ShieldCheck, Tags, TrendingUp, UsersRound, Baby,
} from 'lucide-react';

// `section` matches the keys used in src/data/adminRoles.js — AdminLayout
// filters this list through canAccess(adminRole, section) before rendering.
export const ADMIN_NAV = [
  {
    group: 'Overview',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'dashboard' }],
  },
  {
    group: 'Bookings',
    items: [
      { to: '/admin/bookings', label: 'All Bookings', icon: CalendarCheck2, end: true, section: 'bookings' },
      { to: '/admin/bookings/abandoned', label: 'Abandoned', icon: ShoppingCart, section: 'bookings' },
      { to: '/admin/bookings/cancelled', label: 'Cancelled', icon: Ban, section: 'bookings' },
      { to: '/admin/verify', label: 'Verify Ticket', icon: QrCode, section: 'bookings' },
      { to: '/admin/payments', label: 'Payments', icon: CreditCard, section: 'payments' },
      { to: '/admin/customers', label: 'Customers', icon: UsersRound, section: 'customers' },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { to: '/admin/analytics/visitors', label: 'Visitor Analytics', icon: BarChart3, section: 'analytics' },
      { to: '/admin/analytics/revenue', label: 'Revenue Analytics', icon: TrendingUp, section: 'revenue' },
      { to: '/admin/reports', label: 'Excel Reports', icon: FileSpreadsheet, section: 'reports' },
    ],
  },
  {
    group: 'Settings',
    items: [
      { to: '/admin/settings/pricing', label: 'Ticket Pricing', icon: Tags, section: 'settings' },
      { to: '/admin/settings/age-categories', label: 'Age Categories', icon: Baby, section: 'settings' },
      { to: '/admin/settings/admins', label: 'Staff Management', icon: ShieldCheck, section: 'staff' },
      { to: '/admin/settings/park', label: 'Water Park Settings', icon: Settings2, section: 'settings' },
    ],
  },
];
