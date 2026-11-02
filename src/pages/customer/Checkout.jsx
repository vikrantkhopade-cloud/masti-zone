import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Lock, Mail, Pencil, Phone, ShieldCheck, Ticket, UserRound } from 'lucide-react';
import PageHero from '../../components/customer/PageHero.jsx';
import BookingSteps from '../../components/customer/booking/BookingSteps.jsx';
import BillSummary from '../../components/customer/booking/BillSummary.jsx';
import UpiPayment from '../../components/customer/UpiPayment.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { EmptyState } from '../../components/ui/StateViews.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useBooking } from '../../context/BookingContext.jsx';
import { bookingService, generateBookingReference } from '../../services/bookingService.js';
import { validateContact, validateTicketStep } from '../../utils/bookingRules.js';
import { calculateBill, categoryLabel, getAgeCategory } from '../../utils/pricing.js';
import { IMAGES } from '../../config/images.js';

export default function Checkout() {
  const navigate = useNavigate();
  const { activePlans, park, age } = useSettings();
  const { draft, update, reset } = useBooking();
  const [submitted, setSubmitted] = useState(false);
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // Pre-generated so the UPI QR shown below (before the booking exists)
  // carries the SAME reference the booking row will actually get. Reused
  // from (and persisted into) the sessionStorage-backed draft so a page
  // reload between paying via the QR and clicking "Reserve booking"
  // doesn't swap in a new reference and orphan the one already paid against.
  const [reservationId] = useState(() => draft.reservationId || generateBookingReference());
  useEffect(() => {
    if (!draft.reservationId) update({ reservationId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = activePlans.find((p) => p.id === draft.planId);
  const step1 = validateTicketStep(draft, { park, age, plan });
  const bill = calculateBill({ plan, visitors: draft.visitors, quantity: draft.quantity, ageSettings: age, taxRate: park.taxRate });
  const contact = draft.contact;
  const contactErrors = validateContact(contact);
  const setContact = (patch) => update({ contact: { ...contact, ...patch } });

  if (!step1.valid) {
    return (
      <>
        <PageHero eyebrow="Checkout" title="Let's finish your ticket selection" image={IMAGES.palmPool}><div className="mt-10 max-w-2xl"><BookingSteps current={1} /></div></PageHero>
        <div className="container-x py-12">
          <EmptyState icon={Ticket} title="Your booking details are incomplete" description="Choose a date, entry time, ticket and enter every visitor's details before checking out." action={<Button to="/book"><ArrowLeft className="h-4 w-4" />Back to ticket selection</Button>} />
        </div>
      </>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (Object.keys(contactErrors).length || !agree) return;
    setSaving(true);
    try {
      const visitors = draft.visitors.slice(0, draft.quantity).map((v) => ({ name: v.name.trim(), age: Number(v.age), gender: v.gender, category: getAgeCategory(v.age, age) }));
      const booking = await bookingService.createBooking({
        visitDate: draft.visitDate,
        entryTime: draft.entryTime,
        planId: plan.id,
        planLabel: plan.label,
        hours: plan.hours,
        quantity: draft.quantity,
        visitors,
        childCount: bill.counts.child,
        adultCount: bill.counts.adult,
        contact: { name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() },
        unitPrice: plan.price,
        lines: bill.lines,
        subtotal: bill.subtotal,
        taxRate: park.taxRate,
        tax: bill.tax,
        total: bill.total,
      }, { id: reservationId });
      reset();
      navigate(`/booking/${booking.id}`, { replace: true });
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  return (
    <>
      <PageHero eyebrow="Checkout" title="Review & confirm your booking" subtitle="Check your details and tell us where to send your booking information." image={IMAGES.palmPool}>
        <div className="mt-10 max-w-2xl"><BookingSteps current={1} /></div>
      </PageHero>

      <form onSubmit={onSubmit} noValidate className="container-x grid gap-8 pb-24 pt-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card>
            <CardHeader icon={UserRound} title="Contact details" subtitle="Your booking details will be shared here." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input className="sm:col-span-2" label="Full name" required icon={UserRound} autoComplete="name" value={contact.name} onChange={(e) => setContact({ name: e.target.value })} error={submitted ? contactErrors.name : undefined} placeholder={draft.visitors[0]?.name || 'Your name'} />
              <Input label="Email" type="email" required icon={Mail} autoComplete="email" value={contact.email} onChange={(e) => setContact({ email: e.target.value })} error={submitted ? contactErrors.email : undefined} placeholder="you@example.com" />
              <Input label="Mobile number" type="tel" required icon={Phone} autoComplete="tel" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ phone: e.target.value })} error={submitted ? contactErrors.phone : undefined} placeholder="10-digit mobile" hint="OTP verification will be added soon." />
            </div>
          </Card>

          <Card>
            <CardHeader icon={Ticket} title="Visitors" subtitle={`${draft.quantity} ${draft.quantity === 1 ? 'ticket' : 'tickets'} · ${plan.label}`} action={<Button to="/book" variant="ghost" size="sm"><Pencil className="h-4 w-4" />Edit</Button>} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-navy-400"><th className="pb-2 font-semibold">#</th><th className="pb-2 font-semibold">Name</th><th className="pb-2 font-semibold">Age</th><th className="pb-2 font-semibold">Gender</th><th className="pb-2 font-semibold">Category</th></tr></thead>
                <tbody className="divide-y divide-navy-50">
                  {draft.visitors.slice(0, draft.quantity).map((v, i) => {
                    const cat = getAgeCategory(v.age, age);
                    return (
                      <tr key={i}><td className="py-3 text-navy-400">{i + 1}</td><td className="py-3 font-medium text-navy-800">{v.name}</td><td className="py-3">{v.age}</td><td className="py-3 capitalize">{v.gender}</td><td className="py-3"><Badge tone={cat === 'child' ? 'violet' : 'aqua'}>{categoryLabel(cat)}</Badge></td></tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader icon={CreditCard} title="Payment" subtitle="Pay directly via UPI — verified manually by our team, no gateway involved." />
            <Notice tone="warn" title="Payment is verified manually, not automatically">
              We don't use a payment gateway yet, so UPI payments aren't confirmed instantly. Pay the amount below if you like, then click <strong>Reserve booking</strong> — you can submit your payment reference from the confirmation page that follows. Your booking stays <strong>“Payment pending”</strong> until a staff member manually verifies the real bank transaction.
            </Notice>
            <div className="mt-5">
              <UpiPayment amount={bill.total} reference={reservationId} />
            </div>
          </Card>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-navy-100 bg-white p-4 text-sm text-navy-600">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-navy-200 text-aqua-500 focus:ring-aqua-300" />
            <span>I agree to the park rules, safety guidelines and <Link to="/contact#faq" className="font-semibold text-aqua-600 hover:underline">cancellation policy</Link>. Visitors' details are correct.</span>
          </label>
          {submitted && !agree && <p className="-mt-4 text-xs font-medium text-red-600">Please accept the terms to continue.</p>}
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-24">
            <BillSummary plan={plan} draft={draft} bill={bill} taxRate={park.taxRate}>
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error.message}</p>}
              <Button type="submit" size="lg" className="w-full" loading={saving}><Lock className="h-4 w-4" />Reserve booking</Button>
              <p className="text-center text-xs text-navy-400">Reserved as “Payment pending” — no charge today.</p>
            </BillSummary>
            <p className="flex items-center justify-center gap-2 text-xs text-navy-400"><ShieldCheck className="h-4 w-4 text-aqua-500" />Your details are only used for this booking.</p>
          </div>
        </aside>
      </form>
    </>
  );
}
