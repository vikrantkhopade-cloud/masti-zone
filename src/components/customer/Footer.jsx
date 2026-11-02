import { Link } from 'react-router-dom';
import { Clock, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { Logo } from '../ui/Misc.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatTime } from '../../utils/format.js';

export default function Footer() {
  const { park } = useSettings();
  const year = new Date().getFullYear();
  const cols = [
    { title: 'Explore', links: [['Attractions', '/#attractions'], ['Ticket prices', '/#pricing'], ['Facilities', '/#facilities'], ['Reviews', '/#reviews']] },
    { title: 'Bookings', links: [['Book tickets', '/book'], ['My bookings', '/my-bookings'], ['Sign in', '/login'], ['Create account', '/register']] },
    { title: 'Help', links: [['Contact us', '/contact'], ['Park rules', '/contact#faq'], ['Group bookings', '/contact'], ['Cancellation policy', '/contact#faq']] },
  ];

  return (
    <footer className="relative overflow-hidden bg-navy-950 text-navy-200">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-aqua-500/10 blur-3xl" />
      <div className="container-x relative grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-navy-300">
            Thrilling slides, waves and lazy afternoons — {park.name} is where families, friends and colleagues come to make a splash.
          </p>
          <div className="mt-6 flex gap-2">
            {[[Instagram, park.instagram, 'Instagram'], [Facebook, park.facebook, 'Facebook'], [Youtube, park.youtube, 'YouTube']].map(([Icon, href, label]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-navy-200 ring-1 ring-white/10 transition hover:bg-aqua-500 hover:text-white">
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.title} className="lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">{c.title}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map(([label, to]) => (
                <li key={label}><Link to={to} className="transition hover:text-aqua-300">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}

        <div className="lg:col-span-2">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Visit</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-aqua-400" />{formatTime(park.openTime)} – {formatTime(park.closeTime)}</li>
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-aqua-400" />{park.address || 'Address coming soon'}</li>
            {park.phone && <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-aqua-400" /><a href={`tel:${park.phone}`}>{park.phone}</a></li>}
            {park.email && <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-aqua-400" /><a href={`mailto:${park.email}`} className="break-all">{park.email}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-navy-400 sm:flex-row">
          <p>© {year} {park.name} Water Park. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/contact#faq" className="hover:text-aqua-300">Terms</Link>
            <Link to="/contact#faq" className="hover:text-aqua-300">Privacy</Link>
            <Link to="/admin" className="hover:text-aqua-300">Staff login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
