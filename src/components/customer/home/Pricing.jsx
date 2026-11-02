import { Link } from 'react-router-dom';
import { Check, Clock, Sparkles } from 'lucide-react';
import { SectionHeading, Reveal } from '../../ui/Misc.jsx';
import Button from '../../ui/Button.jsx';
import { useSettings } from '../../../context/SettingsContext.jsx';
import { useBooking } from '../../../context/BookingContext.jsx';
import { cn, formatINR } from '../../../utils/format.js';

const PERKS = {
  '1h': ['Wave pool & lazy river', 'Locker access', 'Changing rooms'],
  '3h': ['All rides & slides', 'Locker access', 'Changing rooms', 'Re-entry once'],
  '5h': ['All rides & slides', 'Locker access', 'Priority FlowRider slot', 'Re-entry once'],
  full: ['Unlimited rides, all day', 'Locker access', 'Priority FlowRider slot', 'Unlimited re-entry'],
};

export default function Pricing() {
  const { activePlans, park, age } = useSettings();
  const { update } = useBooking();

  return (
    <section id="pricing" className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-aqua-50/60 via-white to-white py-20 sm:py-28">
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-aqua-200/40 blur-3xl" />
      <div className="container-x relative">
        <SectionHeading eyebrow="Ticket prices" title="Simple pricing. Endless splashes." subtitle="Choose how long you want to stay. Prices are per person and apply to every attraction in the park." />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {activePlans.map((p, i) => {
            const featured = p.popular;
            return (
              <Reveal key={p.id} delay={i * 80} className={cn('relative flex flex-col rounded-3xl p-7 transition duration-300 hover:-translate-y-1.5', featured ? 'bg-navy-gradient text-white shadow-2xl ring-1 ring-navy-800 lg:-my-4 lg:py-11' : 'bg-white shadow-card ring-1 ring-navy-100 hover:shadow-soft')}>
                {featured && <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-aqua-400 px-3 py-1 text-xs font-bold text-navy-950 shadow-glow"><Sparkles className="h-3.5 w-3.5" />Most popular</span>}
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', featured ? 'bg-white/10 text-aqua-300' : 'bg-aqua-50 text-aqua-600')}><Clock className="h-5 w-5" /></div>
                <h3 className={cn('mt-5 text-lg font-semibold', featured ? 'text-white' : 'text-navy-900')}>{p.label}</h3>
                <p className={cn('mt-1 text-sm', featured ? 'text-navy-200' : 'text-navy-400')}>{p.description}</p>
                <p className="mt-6 flex items-end gap-1">
                  <span className={cn('font-display text-5xl font-extrabold tracking-tight', featured ? 'text-white' : 'text-navy-900')}>{formatINR(p.price)}</span>
                  <span className={cn('mb-1.5 text-sm', featured ? 'text-navy-200' : 'text-navy-400')}>/ person</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                  {(PERKS[p.id] || ['Access to all attractions', 'Locker access', 'Changing rooms']).map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5">
                      <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full', featured ? 'bg-aqua-400 text-navy-950' : 'bg-aqua-100 text-aqua-700')}><Check className="h-3 w-3" strokeWidth={3} /></span>
                      <span className={featured ? 'text-navy-100' : 'text-navy-600'}>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button to="/book" onClick={() => update({ planId: p.id })} variant={featured ? 'primary' : 'outline'} className="mt-8 w-full">Choose {p.label}</Button>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-navy-400">
          Child: {age.minAge}–{age.childMaxAge} yrs · Adult: {age.childMaxAge + 1}+ yrs
          {park.taxRate > 0 && <> · GST {park.taxRate}% applicable at checkout</>} ·{' '}
          <Link to="/contact" className="font-semibold text-aqua-600 hover:underline">Group & school bookings</Link>
        </p>
      </div>
    </section>
  );
}
