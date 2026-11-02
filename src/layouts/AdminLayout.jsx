import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { Bell, ExternalLink, LogOut, Menu, Search, X } from 'lucide-react';
import { ADMIN_NAV } from '../components/admin/nav.js';
import { Logo } from '../components/ui/Misc.jsx';
import { authService } from '../services/authService.js';
import { canAccess, roleLabel } from '../data/adminRoles.js';
import { resolvePreset } from '../utils/dates.js';
import { cn } from '../utils/format.js';

function initialsOf(name) {
  return (name || '').trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';
}

function Sidebar({ onNavigate, admin, adminRole }) {
  const name = admin?.full_name || admin?.email || 'Admin';
  const nav = ADMIN_NAV
    .map((section) => ({ ...section, items: section.items.filter((item) => canAccess(adminRole, item.section)) }))
    .filter((section) => section.items.length > 0);
  return (
    <div className="flex h-full flex-col bg-navy-950 text-navy-200">
      <div className="flex h-16 items-center justify-between px-5">
        <Link to="/admin/dashboard" onClick={onNavigate}><Logo light /></Link>
      </div>
      <div className="px-5 pb-3"><span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-aqua-300 ring-1 ring-white/10">Admin Console</span></div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
        {nav.map((section) => (
          <div key={section.group}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-400">{section.group}</p>
            <ul className="mt-2 space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink to={to} end={end} onClick={onNavigate}
                    className={({ isActive }) => cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-aqua-500/15 text-white ring-1 ring-aqua-400/30' : 'text-navy-300 hover:bg-white/5 hover:text-white')}>
                    {({ isActive }) => (<><Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-aqua-300' : 'text-navy-400 group-hover:text-navy-200')} />{label}</>)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-aqua-gradient text-sm font-bold text-white">{initialsOf(name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="truncate text-xs text-navy-400">{roleLabel(adminRole)}</p>
          </div>
          <button onClick={() => authService.signOut()} className="rounded-lg p-1.5 text-navy-400 hover:bg-white/10 hover:text-white" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { profile: admin, adminRole } = useOutletContext();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  // Shared date filter across admin pages.
  const [preset, setPreset] = useState('last30');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const range = useMemo(() => resolvePreset(preset, custom), [preset, custom]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { document.title = 'Admin · MASTI ZONE'; return () => { document.title = 'MASTI ZONE Water Park'; }; }, []);

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><Sidebar admin={admin} adminRole={adminRole} /></aside>

      <div className={cn('fixed inset-0 z-40 lg:hidden', open ? '' : 'pointer-events-none')}>
        <div className={cn('absolute inset-0 bg-navy-950/60 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <aside className={cn('absolute inset-y-0 left-0 w-72 transition-transform duration-300', open ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar admin={admin} adminRole={adminRole} onNavigate={() => setOpen(false)} />
          <button onClick={() => setOpen(false)} className="absolute -right-12 top-3 rounded-xl bg-white/10 p-2 text-white" aria-label="Close menu"><X className="h-5 w-5" /></button>
        </aside>
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-navy-100/70 bg-white/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-navy-600 hover:bg-navy-50 lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div className="relative hidden max-w-sm flex-1 md:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
              <input type="search" placeholder="Search bookings, customers… (coming soon)" disabled className="h-10 w-full rounded-xl border border-navy-100 bg-navy-50/50 pl-10 pr-3 text-sm placeholder:text-navy-300" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <a href="/" target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50 sm:flex"><ExternalLink className="h-4 w-4" />View website</a>
              <button className="relative rounded-xl p-2 text-navy-600 hover:bg-navy-50" aria-label="Notifications"><Bell className="h-5 w-5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral-500" /></button>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-900 text-xs font-bold text-white">{initialsOf(admin?.full_name || admin?.email)}</span>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet context={{ preset, setPreset, custom, setCustom, range, profile: admin, adminRole }} />
        </main>
      </div>
    </div>
  );
}
