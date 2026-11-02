import { useParams } from 'react-router-dom';
import { CalendarDays, Clock3, CreditCard, Hourglass, Mail, Phone, Printer, Ticket, Users } from 'lucide-react';
import PageHero from '../../components/customer/PageHero.jsx';
import BookingSteps from '../../components/customer/booking/BookingSteps.jsx';
import TicketQR from '../../components/customer/TicketQR.jsx';
import UpiPayment from '../../components/customer/UpiPayment.jsx';
import UtrSubmitForm from '../../components/customer/UtrSubmitForm.jsx';
import Button from '../../components/ui/Button.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Badge, { PaymentBadge, StatusBadge } from '../../components/ui/Badge.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { ErrorState, PageLoader } from '../../components/ui/StateViews.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { bookingService } from '../../services/bookingService.js';
import { formatDate, formatDateTime, formatINR, formatTime } from '../../utils/format.js';
import { calculateBill, categoryLabel } from '../../utils/pricing.js';
import { IMAGES } from '../../config/images.js';

export default function Confirmation() {
  const { bookingId } = useParams();
  const { age } = useSettings();
  const { data: b, loading, error, reload } = useAsync(() => bookingService.getBooking(bookingId), [bookingId]);
  // The database stores totals, not a line-item breakdown, so the Adult/Child
  // split shown below is rebuilt from the saved visitor list and unit price —
  // the stored subtotal/tax/total are always shown as the authoritative amount.
  const taxRate = b && b.subtotal ? Math.round((b.tax / b.subtotal) * 100) : 0;
  const bill = b ? calculateBill({ plan: { price: b.unitPrice }, visitors: b.visitors, quantity: b.quantity, ageSettings: age, taxRate }) : null;

  return (
    <>
      <PageHero eyebrow="Booking" title={b?.status === 'cancelled' ? 'Booking cancelled' : 'Your booking is reserved'} subtitle="Keep your booking ID handy — you'll need it for any help with your visit." image={IMAGES.sunsetPool}>
        <div className="mt-10 max-w-2xl"><BookingSteps current={2} /></div>
      </PageHero>

      <div className="container-x pb-24 pt-6">
        {loading ? <PageLoader label="Fetching your booking…" /> : error ? (
          <ErrorState title="Booking not found" error={error} onRetry={reload} />
        ) : (
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-navy-100 print:shadow-none">
              <div className="flex flex-col gap-4 bg-navy-gradient px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aqua-200">Booking ID</p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-wide sm:text-3xl">{b.id}</p>
                  <p className="mt-1 text-sm text-navy-200">Created {formatDateTime(b.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2"><StatusBadge status={b.status} /><PaymentBadge status={b.paymentStatus} /></div>
              </div>

              <div className="relative border-b border-dashed border-navy-100 px-6 py-6 sm:px-8">
                <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-white ring-1 ring-navy-100" />
                <span className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-white ring-1 ring-navy-100" />
                {b.status === 'pending' && (
                  <Notice tone="warn" title="Payment pending — this is not an entry ticket yet">
                    Pay via UPI below, then submit your payment reference. Your booking is confirmed only after a staff member manually verifies the real bank transaction — nothing is charged or confirmed automatically.
                  </Notice>
                )}
                <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[[CalendarDays, 'Visit date', formatDate(b.visitDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })], [Clock3, 'Entry time', formatTime(b.entryTime)], [Ticket, 'Ticket', b.planLabel], [Users, 'Visitors', `${b.adultCount} adult · ${b.childCount} child`]].map(([Icon, label, value]) => (
                    <div key={label}>
                      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-navy-400"><Icon className="h-3.5 w-3.5" />{label}</dt>
                      <dd className="mt-1 font-semibold text-navy-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="grid gap-8 px-6 py-6 sm:px-8 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-400">Visitors</h3>
                  <ul className="mt-3 divide-y divide-navy-50">
                    {b.visitors.map((v, i) => (
                      <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="font-medium text-navy-800">{v.name}</span>
                        <span className="flex items-center gap-2 text-navy-500">{v.age} yrs · <span className="capitalize">{v.gender}</span> <Badge tone={v.category === 'child' ? 'violet' : 'aqua'}>{categoryLabel(v.category)}</Badge></span>
                      </li>
                    ))}
                  </ul>
                  <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-navy-400">Contact</h3>
                  <p className="mt-2 text-sm font-medium text-navy-800">{b.contact.name}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-navy-500"><Mail className="h-4 w-4" />{b.contact.email}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-navy-500"><Phone className="h-4 w-4" />{b.contact.phone}</p>
                </div>
                <div className="rounded-2xl bg-navy-50/60 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-navy-400">Amount</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {bill.lines.map((l) => <li key={l.label} className="flex justify-between"><span className="text-navy-600">{l.label} × {l.qty}</span><span>{formatINR(l.amount)}</span></li>)}
                    <li className="flex justify-between border-t border-navy-100 pt-2 text-navy-600"><span>Subtotal</span><span>{formatINR(b.subtotal)}</span></li>
                    {taxRate > 0 && <li className="flex justify-between text-navy-600"><span>GST ({taxRate}%)</span><span>{formatINR(b.tax)}</span></li>}
                    <li className="flex justify-between pt-1 text-lg font-bold text-navy-900"><span>Total</span><span>{formatINR(b.total)}</span></li>
                  </ul>
                  <div className="mt-5 flex items-center gap-3 rounded-xl bg-white p-3 text-sm text-navy-500 ring-1 ring-navy-100">
                    <Hourglass className="h-5 w-5 shrink-0 text-amber-500" />
                    <span>Amount due: <strong className="text-navy-900">{b.paymentStatus === 'pending' ? formatINR(b.total) : formatINR(0)}</strong></span>
                  </div>
                </div>
              </div>

              {b.status !== 'cancelled' && (
                <div className="border-t border-dashed border-navy-100 px-6 py-6 sm:px-8">
                  <TicketQR booking={b} />
                </div>
              )}
            </div>

            {b.status !== 'cancelled' && b.paymentStatus !== 'paid' && (
              <Card className="mt-6 print:hidden">
                <CardHeader icon={CreditCard} title="Pay via UPI" subtitle="Verified manually by our team — no gateway, no automatic confirmation." />
                <UpiPayment amount={b.total} reference={b.id} />
                <div className="mt-6 border-t border-dashed border-navy-100 pt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy-400">Already paid? Submit your reference</h3>
                  <UtrSubmitForm booking={b} />
                </div>
              </Card>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" />Print summary</Button>
              <Button to="/my-bookings" variant="navy">View my bookings</Button>
              <Button to="/" variant="ghost">Back to home</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
