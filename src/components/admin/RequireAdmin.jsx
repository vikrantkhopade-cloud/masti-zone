import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { authService } from '../../services/authService.js';
import { PageLoader } from '../ui/StateViews.jsx';

// Blocks /admin/* unless the signed-in user has an active admin profile.
export default function RequireAdmin() {
  const [state, setState] = useState({ checking: true, allowed: false, profile: null });

  useEffect(() => {
    let active = true;
    // supabase-js fires onAuthStateChange with an "INITIAL_SESSION" event
    // shortly after subscribing, in addition to the direct check() call
    // right below — without this guard, two near-simultaneous calls can
    // each try to read/refresh the session at once, which can race against
    // Supabase's single-use refresh token and surface as a stray 400 on
    // whichever call loses the race. This only de-dupes concurrent calls;
    // it does not change what counts as "allowed".
    let inFlight = false;
    async function check() {
      if (inFlight) return;
      inFlight = true;
      try {
        const session = await authService.getSession().catch(() => null);
        if (!session) {
          if (active) setState({ checking: false, allowed: false, profile: null });
          return;
        }
        const profile = await authService.getProfile(session.user.id).catch(() => null);
        const allowed = !!profile && profile.role === 'admin' && profile.status === 'active';
        if (active) setState({ checking: false, allowed, profile });
      } finally {
        inFlight = false;
      }
    }
    check();
    const { data } = supabase.auth.onAuthStateChange(() => check());
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  if (state.checking) return <PageLoader label="Checking admin access…" />;
  if (!state.allowed) return <Navigate to="/admin/login" replace />;
  // admin_role doesn't exist in the schema yet (see
  // supabase/migrations/002_admin_roles.sql, proposed/pending approval) —
  // every existing admin is treated as a super admin until that migration
  // adds and backfills the column.
  const adminRole = state.profile.admin_role || 'super_admin';
  return <Outlet context={{ profile: state.profile, adminRole }} />;
}
