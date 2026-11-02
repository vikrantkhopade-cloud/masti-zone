import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock3, Ticket, Users } from 'lucide-react';
import PageHero from '../../components/customer/PageHero.jsx';
import QrThumb from '../../components/customer/QrThumb.jsx';
import Button from '../../components/ui/Button.jsx';
import { PaymentBadge, StatusBadge } from '../../components/ui/Badge.jsx';
import { Modal, Notice } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/StateViews.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { authService } from '../../services/authService.js';
import { bookingService } from '../../services/bookingService.js';
import { todayISO } from '../../utils/dates.js';
import { cn, formatDate, formatINR, formatTime } from '../../utils/format.js';
import { IMAGES } from '../../config/images.js';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function MyBookings() {
  const { data, loading, error, reload, setData } = useAsync(() => bookingService.getMyBookings(), []);
  const [tab, setTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState(null);
  const today = todayISO();

  useEffect(() => {
    // An anonymous guest session still counts as "not logged in" here — it
    // is real and synced, but scoped to this browser only, with no way to
    // sign back in on another device.
    authService.getSession()
      .then((s) => setLoggedIn(!!s && s.user?.is_anonymous !== true))
      .catch(() => setLoggedIn(false));
  }, []);

  const filtered = (data || []).filter((b) => {
    if (tab === 'cancelled') return b.status === 'cancelled';
    if (b.status === 'cancelled') return false;
    return tab === 'upcoming' ? b.visitDate >= today : b.visitDate < today;
  });

  const confirmCancel = async () => {
    setBusy(true);
    try {
      const updated = await bookingService.requestCancellation(cancelling.id);
      setData(data.map((b) => (b.id === updated.id ? updated : b)));
      setCancelling(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero eyebrow="My bookings" title="Your splash days" subtitle="View, print or cancel the bookings you've made." image={IMAGES.deckPool} />
      <div className="container-x pb-24 pt-6">
        {loggedIn === false && (
          <Notice className="mb-6">Showing bookings made from this browser as a guest. Sign in to see your bookings on every device.</Notice>
        )}

        <div className="mb-6 inline-flex rounded-2xl bg-navy-50 p-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn('rounded-xl px-4 py-2 text-sm font-semibold transition sm:px-6', tab === t.id ? 'bg-white text-navy-900 shadow-card' : 'text-navy-500 hover:text-navy-800')}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}</div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Ticket} title={tab === 'upcoming' ? 'No upcoming bookings' : tab === 'past' ? 'No past visits yet' : 'No cancelled bookings'} description="When you book tickets, they will appear here." action={<Button to="/book">Book tickets</Button>} />
        ) : (
          <ul className="space-y-4">
            {filtered.map((b) => (
              <li key={b.id} className="group overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-navy-100 transition hover:shadow-soft">
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-aqua-gradient text-white">
                    <span className="text-xs font-semibold uppercase">{formatDate(b.visitDate, { month: 'short' })}</span>
                    <span className="font-display text-3xl font-bold leading-none">{formatDate(b.visitDate, { day: 'numeric' })}</span>
                  </div>
                  {b.status !== 'cancelled' && (
                    <QrThumb bookingId={b.id} size={64} className="hidden shrink-0 rounded-xl bg-white p-1 ring-1 ring-navy-100 sm:block" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-bold text-navy-900">{b.id}</p>
                      <StatusBadge status={b.status} /><PaymentBadge status={b.paymentStatus} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-navy-500">
                      <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(b.visitDate, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{formatTime(b.entryTime)} · {b.planLabel}</span>
                      <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{b.quantity} visitors</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="font-display text-2xl font-bold text-navy-900">{formatINR(b.total)}</p>
                    <div className="flex gap-2">
                      {(b.status === 'pending' || b.status === 'confirmed') && b.visitDate >= today && <Button size="sm" variant="danger" onClick={() => setCancelling(b)}>Cancel</Button>}
                      <Button size="sm" variant="outline" to={`/booking/${b.id}`}>Details<ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-center text-sm text-navy-400">Can't find a booking? <Link to="/contact" className="font-semibold text-aqua-600 hover:underline">Contact our team</Link></p>
      </div>

      <Modal open={!!cancelling} onClose={() => setCancelling(null)} title="Cancel this booking?" footer={<><Button variant="ghost" onClick={() => setCancelling(null)}>Keep booking</Button><Button variant="danger" loading={busy} onClick={confirmCancel}>Yes, cancel</Button></>}>
        <p className="text-sm text-navy-600">
          Booking <strong>{cancelling?.id}</strong> for {cancelling && formatDate(cancelling.visitDate)} will be cancelled.{' '}
          {cancelling?.paymentStatus === 'paid'
            ? 'Since this booking was paid, refunds follow our standard policy (90% refund up to 24 hours before your visit) — our team will process it separately.'
            : 'Since payment has not been made, nothing will be charged.'}
        </p>
      </Modal>
    </>
  );
}
