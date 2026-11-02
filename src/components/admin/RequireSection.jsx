import { Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAdminFilters } from './AdminUI.jsx';
import { canAccess, roleLabel } from '../../data/adminRoles.js';
import { EmptyState } from '../ui/StateViews.jsx';

// Blocks direct navigation to a URL the signed-in staff member's role isn't
// permitted to see — hiding the nav link isn't enough on its own (#8: never
// rely only on frontend checks). The real authorization still lives in
// Postgres RLS (see supabase/migrations/002_admin_roles.sql); this guard is
// the UI-level backstop so a restricted page never even renders.
export default function RequireSection({ section }) {
  // This IS the context AdminLayout passed down (useAdminFilters is just
  // useOutletContext()). <Outlet> below must forward it unchanged — an
  // <Outlet> that doesn't pass `context` gives its children `undefined`,
  // regardless of what context this component itself received. Dropping
  // it here is what broke useAdminFilters()/useAnalytics() for every page
  // nested under this guard.
  const context = useAdminFilters();
  const { adminRole } = context;
  if (!canAccess(adminRole, section)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Not authorized"
        description={`Your role (${roleLabel(adminRole)}) doesn't have access to this section. Ask a Super Admin if you need it.`}
      />
    );
  }
  return <Outlet context={context} />;
}
