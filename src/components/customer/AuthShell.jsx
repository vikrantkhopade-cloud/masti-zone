import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '../ui/Misc.jsx';
import { IMAGES } from '../../config/images.js';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <section className="min-h-screen bg-white pt-[72px] lg:grid lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={IMAGES.auth} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-navy-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <Logo light />
          <h2 className="mt-6 max-w-md text-4xl font-bold text-white">Faster bookings. Every splash, in one place.</h2>
          <ul className="mt-6 space-y-3 text-navy-100">
            {['Save visitor details for quick re-booking', 'Track upcoming visits and payments', 'Member-only offers and early access'].map((t) => (
              <li key={t} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-aqua-300" />{t}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-navy-900">{title}</h1>
          {subtitle && <p className="mt-2 text-navy-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-navy-500">{footer}</div>}
          <p className="mt-10 text-center text-xs text-navy-300">By continuing you agree to our <Link to="/contact#faq" className="underline">terms</Link> and <Link to="/contact#faq" className="underline">privacy policy</Link>.</p>
        </div>
      </div>
    </section>
  );
}
