import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock3, Minus, Plus, Ticket, UserRound, Users } from 'lucide-react';
import PageHero from '../../components/customer/PageHero.jsx';
import BookingSteps from '../../components/customer/booking/BookingSteps.jsx';
import BillSummary from '../../components/customer/booking/BillSummary.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { EmptyState } from '../../components/ui/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useBooking } from '../../context/BookingContext.jsx';
import { GENDERS } from '../../data/defaults.js';
import { addDays, todayISO } from '../../utils/dates.js';
import { buildEntrySlots, validateTicketStep } from '../../utils/bookingRules.js';
import { calculateBill, categoryLabel, getAgeCategory } from '../../utils/pricing.js';
import { cn, formatINR, formatTime } from '../../utils/format.js';
import { IMAGES } from '../../config/images.js';

export default function BookTickets() {
  const navigate = useNavigate();
  const { activePlans, park, age } = useSettings();
  const { draft, update, setQuantity, updateVisitor } = useBooking();
  const [submitted, setSubmitted] = useState(false);

  const plan = activePlans.find((p) => p.id === draft.planId);
  const slots = useMemo(() => buildEntrySlots({ park, plan, visitDate: draft.visitDate }), [park, plan, draft.visitDate]);
  const bill = calculateBill({ plan, visitors: draft.visitors, quantity: draft.quantity, ageSettings: age, taxRate: park.taxRate });
  const { valid, errors } = validateTicketStep(draft, { park, age, plan });
  const show = (msg) => (submitted ? msg : undefined);

  const today = todayISO();
  const quickDates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const onContinue = () => {
    setSubmitted(true);
    if (!valid) {
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"], [data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    navigate('/checkout');
  };

  if (!park.bookingsOpen) {
    return (
      <>
        <PageHero title="Online booking is paused" subtitle="We are not taking online bookings right now. Please contact us for help." image={IMAGES.lazyRiver} />
        <div className="container-x py-16"><EmptyState icon={Ticket} title="Bookings temporarily closed" description="Online booking has been paused by the park. Please check back soon." action={<Button to="/contact">Contact us</Button>} /></div>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow="Book tickets" title="Plan your splash day" subtitle="Pick a date, entry time and ticket — then tell us who is coming along." image={IMAGES.palmPool}>
        <div className="mt-10 max-w-2xl"><BookingSteps current={0} /></div>
      </PageHero>

      <div className="container-x grid gap-8 pb-24 pt-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Date */}
          <Card>
            <StepTitle n={1} icon={CalendarDays} title="Select visit date" error={show(errors.visitDate)} />
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin" data-error={!!show(errors.visitDate)}>
              {quickDates.map((d) => {
                const dt = new Date(`${d}T00:00:00`);
                const closed = park.weeklyOff?.includes(dt.getDay());
                const active = draft.visitDate === d;
                return (
                  <button key={d} type="button" disabled={closed} onClick={() => update({ visitDate: d, entryTime: '' })}
                    className={cn('flex min-w-[72px] flex-col items-center rounded-2xl border px-3 py-3 transition', active ? 'border-aqua-400 bg-aqua-50 ring-2 ring-aqua-200' : 'border-navy-100 hover:border-aqua-200', closed && 'cursor-not-allowed opacity-40')}>
                    <span className="text-[11px] font-semibold uppercase text-navy-400">{d === today ? 'Today' : dt.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                    <span className="font-display text-xl font-bold text-navy-900">{dt.getDate()}</span>
                    <span className="text-[11px] text-navy-400">{dt.toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 max-w-xs">
              <Input type="date" label="Or pick another date" min={today} max={addDays(today, park.advanceBookingDays)} value={draft.visitDate} onChange={(e) => update({ visitDate: e.target.value, entryTime: '' })} />
            </div>
          </Card>

          {/* Plan */}
          <Card>
            <StepTitle n={2} icon={Ticket} title="Choose ticket duration" error={show(errors.planId)} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-error={!!show(errors.planId)}>
              {activePlans.map((p) => {
                const active = draft.planId === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => update({ planId: p.id, entryTime: '' })}
                    className={cn('relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5', active ? 'border-aqua-400 bg-aqua-50 ring-2 ring-aqua-200' : 'border-navy-100 hover:border-aqua-200 hover:shadow-card')}>
                    {p.popular && <Badge className="absolute right-3 top-3" tone="navy">Popular</Badge>}
                    <span className="block text-sm font-semibold text-navy-500">{p.label}</span>
                    <span className="mt-1 block font-display text-2xl font-bold text-navy-900">{formatINR(p.price)}</span>
                    <span className="text-xs text-navy-400">per person</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Entry time */}
          <Card>
            <StepTitle n={3} icon={Clock3} title="Select entry time" error={show(errors.entryTime)} />
            {!draft.visitDate || !plan ? (
              <p className="rounded-xl bg-navy-50/70 px-4 py-3 text-sm text-navy-500">Choose a date and ticket duration first to see available entry times.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-8" data-error={!!show(errors.entryTime)}>
                {slots.map((s) => (
                  <button key={s.time} type="button" disabled={!s.available} title={s.reason || ''} onClick={() => update({ entryTime: s.time })}
                    className={cn('rounded-xl border px-2 py-2.5 text-sm font-semibold transition', draft.entryTime === s.time ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-100 text-navy-700 hover:border-aqua-300', !s.available && 'cursor-not-allowed border-dashed bg-navy-50/50 text-navy-300 line-through')}>
                    {formatTime(s.time)}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Quantity + visitors */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <StepTitle n={4} icon={Users} title="Visitors" className="mb-0" />
              <div className="flex items-center gap-3">
                <span className="text-sm text-navy-500">Tickets</span>
                <div className="flex items-center rounded-xl border border-navy-100">
                  <button type="button" aria-label="Decrease tickets" disabled={draft.quantity <= 1} onClick={() => setQuantity(draft.quantity - 1)} className="grid h-10 w-10 place-items-center text-navy-600 hover:text-aqua-600 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                  <span className="w-10 text-center font-display text-lg font-bold" aria-live="polite">{draft.quantity}</span>
                  <button type="button" aria-label="Increase tickets" disabled={draft.quantity >= park.maxTicketsPerBooking} onClick={() => setQuantity(draft.quantity + 1)} className="grid h-10 w-10 place-items-center text-navy-600 hover:text-aqua-600 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
            <Notice className="mt-5">Child: {age.minAge}–{age.childMaxAge} years · Adult: {age.childMaxAge + 1}+ years. Children under {age.minAge} enter free with an adult and don't need a ticket. Max {park.maxTicketsPerBooking} tickets per booking.</Notice>

            <div className="mt-5 space-y-4">
              {draft.visitors.slice(0, draft.quantity).map((v, i) => {
                const e = (submitted && errors.visitors[i]) || {};
                const cat = getAgeCategory(v.age, age);
                return (
                  <div key={i} className="rounded-2xl border border-navy-100 p-4 transition hover:border-aqua-200 sm:p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="flex items-center gap-2 text-sm font-semibold text-navy-800">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-aqua-50 text-aqua-600"><UserRound className="h-4 w-4" /></span>
                        Visitor {i + 1}{i === 0 && <span className="font-normal text-navy-400">(lead guest)</span>}
                      </p>
                      {cat && <Badge tone={cat === 'child' ? 'violet' : cat === 'adult' ? 'aqua' : 'red'}>{categoryLabel(cat)}</Badge>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-12">
                      <Input className="sm:col-span-5" label="Full name" required placeholder="As per ID" value={v.name} error={e.name} onChange={(ev) => updateVisitor(i, { name: ev.target.value })} autoComplete={i === 0 ? 'name' : 'off'} />
                      <Input className="sm:col-span-2" label="Age" required type="number" inputMode="numeric" min={age.minAge} max={age.maxAge} placeholder="Yrs" value={v.age} error={e.age} onChange={(ev) => updateVisitor(i, { age: ev.target.value === '' ? '' : ev.target.value.replace(/\D/g, '').slice(0, 2) })} />
                      <div className="sm:col-span-5" data-error={!!e.gender}>
                        <span className="mb-1.5 block text-sm font-medium text-navy-700">Gender <span className="text-coral-500">*</span></span>
                        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-navy-50/70 p-1">
                          {GENDERS.map((g) => (
                            <button key={g.value} type="button" onClick={() => updateVisitor(i, { gender: g.value })} className={cn('rounded-lg py-2 text-sm font-medium transition', v.gender === g.value ? 'bg-white text-navy-900 shadow-card' : 'text-navy-500 hover:text-navy-800')}>{g.label}</button>
                          ))}
                        </div>
                        {e.gender && <p className="mt-1.5 text-xs font-medium text-red-600">{e.gender}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <BillSummary plan={plan} draft={draft} bill={bill} taxRate={park.taxRate}>
              <Button size="lg" className="w-full" onClick={onContinue}>Continue to checkout<ArrowRight className="h-4 w-4" /></Button>
              {submitted && !valid && <p className="text-center text-xs font-medium text-red-600">Please fix the highlighted fields.</p>}
              <p className="text-center text-xs text-navy-400">Final amount is confirmed at checkout.</p>
            </BillSummary>
          </div>
        </aside>
      </div>
    </>
  );
}

function StepTitle({ n, icon: Icon, title, error, className }) {
  return (
    <div className={cn('mb-5', className)}>
      <h2 className="flex items-center gap-3 text-lg font-semibold text-navy-900">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-navy-900 text-sm font-bold text-white">{n}</span>
        <Icon className="h-5 w-5 text-aqua-500" />{title}
      </h2>
      {error && <p className="ml-11 mt-1 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
