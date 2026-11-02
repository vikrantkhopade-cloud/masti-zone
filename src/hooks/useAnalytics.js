import { useAsync } from './useAsync.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useAdminFilters } from '../components/admin/AdminUI.jsx';
import { adminService } from '../services/adminService.js';

/** Analytics for the admin's currently selected date range. */
export function useAnalytics() {
  const { range } = useAdminFilters();
  const { age } = useSettings();
  return useAsync(() => adminService.getAnalytics(range, age), [range.from, range.to, age.childMaxAge]);
}

/** Bookings in the selected range, optionally filtered by status. */
export function useRangeBookings(filters = {}) {
  const { range } = useAdminFilters();
  const key = JSON.stringify(filters);
  return useAsync(() => adminService.listBookings({ range, ...filters }), [range.from, range.to, key]);
}
