import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Ticket, X, UserRound } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { Logo } from '../ui/Misc.jsx';
import { cn } from '../../utils/format.js';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/#attractions', label: 'Attractions' },
  { to: '/#pricing', label: 'Tickets' },
  { to: '/#facilities', label: 'Facilities' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/profile', label: 'My Profile' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === '/' && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);

  return (
    <header className={cn('fixed inset-x-0 top-0 z-40 transition-all duration-300', overHero ? 'bg-transparent' : 'border-b border-navy-50 bg-white/85 shadow-[0_8px_30px_-18px_rgba(10,26,58,.25)] backdrop-blur-xl')}>
      <nav className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link to="/" aria-label="MASTI ZONE home"><Logo light={overHero} /></Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.label}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) => cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  overHero ? 'text-white/85 hover:bg-white/10 hover:text-white' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
                  isActive && !l.to.includes('#') && (overHero ? 'bg-white/15 text-white' : 'bg-aqua-50 text-aqua-700'),
                )}
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Button to="/login" variant={overHero ? 'glass' : 'ghost'} size="sm"><UserRound className="h-4 w-4" />Sign in</Button>
          <Button to="/book" size="sm" className="px-4"><Ticket className="h-4 w-4" />Book Tickets</Button>
        </div>

        <button onClick={() => setOpen(true)} className={cn('rounded-xl p-2 lg:hidden', overHero ? 'text-white hover:bg-white/10' : 'text-navy-800 hover:bg-navy-50')} aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div className={cn('absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={() => setOpen(false)} />
        <aside className={cn('absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300', open ? 'translate-x-0' : 'translate-x-full')}>
          <div className="flex h-[72px] items-center justify-between border-b border-navy-50 px-5">
            <Logo />
            <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-navy-600 hover:bg-navy-50" aria-label="Close menu"><X className="h-6 w-6" /></button>
          </div>
          <ul className="flex-1 space-y-1 overflow-y-auto p-4">
            {LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-base font-medium text-navy-700 hover:bg-aqua-50 hover:text-aqua-700">{l.label}</Link>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t border-navy-50 p-4">
            <Button to="/book" className="w-full"><Ticket className="h-4 w-4" />Book Tickets</Button>
            <div className="grid grid-cols-2 gap-2">
              <Button to="/login" variant="outline">Sign in</Button>
              <Button to="/register" variant="secondary">Register</Button>
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
