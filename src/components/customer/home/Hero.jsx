import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock3, PlayCircle, ShieldCheck, Star, Ticket } from 'lucide-react';
import Button from '../../ui/Button.jsx';
import { IMAGES } from '../../../config/images.js';
import { STATS } from '../../../data/content.js';
import { useSettings } from '../../../context/SettingsContext.jsx';
import { useBooking } from '../../../context/BookingContext.jsx';
import { addDays, todayISO } from '../../../utils/dates.js';
import { formatINR } from '../../../utils/format.js';

export default function Hero() {
  const { activePlans, park } = useSettings();
  const { update } = useBooking();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [planId, setPlanId] = useState(activePlans.find((p) => p.popular)?.id || activePlans[0]?.id || '');
  const fromPrice = activePlans.length ? Math.min(...activePlans.map((p) => p.price)) : 0;

  const quickBook = (e) => {
    e.preventDefault();
    update({ visitDate: date, planId });
    navigate('/book');
  };

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-navy-950">
      <img src={IMAGES.hero} alt="Aerial view of MASTI ZONE pools and palm trees" className="absolute inset-0 -z-10 h-full w-full scale-105 object-cover" fetchpriority="high" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/95 via-navy-950/70 to-navy-950/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/40" />
      <div className="pointer-events-none absolute -left-32 top-1/3 -z-10 h-96 w-96 rounded-full bg-aqua-500/25 blur-3xl" />

      <div className="container-x grid min-h-[100svh] items-center gap-12 pb-40 pt-32 lg:grid-cols-12 lg:pb-44">
        <div className="lg:col-span-7">
          {park.announcement && (
            <div className="mb-6 inline-flex max-w-full animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-4 text-xs text-white backdrop-blur-md sm:text-sm">
              <span className="rounded-full bg-aqua-400 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-navy-950">New</span>
              <span className="truncate">{park.announcement}</span>
            </div>
          )}
          <h1 className="animate-fade-up text-[42px] font-extrabold leading-[1.02] text-white [animation-delay:80ms] sm:text-6xl lg:text-7xl">
            Ride the wave of <span className="text-gradient">pure masti.</span>
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-base leading-relaxed text-navy-100 [animation-delay:160ms] sm:text-lg">
            Giant waves, a winding lazy river, surf rides and a splash island for the little ones — all in one sun-soaked day out. Book online in under two minutes.
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:240ms]">
            <Button to="/book" size="lg"><Ticket className="h-5 w-5" />Book Tickets<ArrowRight className="h-4 w-4" /></Button>
            <Button to="/#attractions" variant="glass" size="lg"><PlayCircle className="h-5 w-5" />Explore Attractions</Button>
          </div>
          <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-x-8 gap-y-3 text-sm text-navy-100 [animation-delay:320ms]">
            <span className="flex items-center gap-2"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />Loved by families</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-aqua-300" />Certified lifeguards</span>
            <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-aqua-300" />Open daily</span>
          </div>
        </div>

        {/* Quick booking card */}
        <div className="lg:col-span-5 lg:pl-6">
          <form onSubmit={quickBook} className="glass animate-fade-up rounded-3xl p-6 shadow-2xl [animation-delay:300ms] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-200">Quick booking</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Plan your splash day</h2>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-navy-200">From</p>
                <p className="font-display text-2xl font-bold text-white">{formatINR(fromPrice)}</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-100"><CalendarDays className="h-4 w-4" />Visit date</span>
                <input type="date" required min={todayISO()} max={addDays(todayISO(), park.advanceBookingDays)} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-sm font-medium text-navy-900 focus:outline-none focus:ring-4 focus:ring-aqua-300/40" />
              </label>
              <div>
                <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-100"><Clock3 className="h-4 w-4" />Duration</span>
                <div className="grid grid-cols-2 gap-2">
                  {activePlans.map((p) => (
                    <button type="button" key={p.id} onClick={() => setPlanId(p.id)} className={`rounded-xl border px-3 py-2.5 text-left transition ${planId === p.id ? 'border-aqua-300 bg-aqua-400/25 text-white ring-2 ring-aqua-300/50' : 'border-white/15 bg-white/5 text-navy-100 hover:bg-white/10'}`}>
                      <span className="block text-sm font-semibold">{p.label}</span>
                      <span className="text-xs opacity-80">{formatINR(p.price)} / person</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button type="submit" variant="white" size="lg" className="mt-6 w-full">Continue booking<ArrowRight className="h-4 w-4" /></Button>
            <p className="mt-3 text-center text-xs text-navy-200">No payment taken at this step.</p>
          </form>
        </div>
      </div>

      {/* Stats + animated waves */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="container-x relative z-10 mb-6 hidden grid-cols-4 gap-6 md:grid">
          {STATS.map((s) => (
            <div key={s.label} className="border-l border-white/20 pl-4">
              <p className="font-display text-2xl font-bold text-white lg:text-3xl">{s.value}</p>
              <p className="text-sm text-navy-200">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="relative h-16 overflow-hidden sm:h-20">
          <svg className="absolute bottom-0 h-full w-[200%] animate-wave-slow text-white/20" viewBox="0 0 2880 80" preserveAspectRatio="none" aria-hidden><path fill="currentColor" d="M0 40c240 40 480 40 720 0s480-40 720 0 480 40 720 0 480-40 720 0v40H0z" /></svg>
          <svg className="absolute bottom-0 h-3/4 w-[200%] animate-wave text-white" viewBox="0 0 2880 80" preserveAspectRatio="none" aria-hidden><path fill="currentColor" d="M0 50c240-30 480-30 720 0s480 30 720 0 480-30 720 0 480 30 720 0v30H0z" /></svg>
        </div>
      </div>
    </section>
  );
}
