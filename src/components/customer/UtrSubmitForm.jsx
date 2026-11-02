import { useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { Input } from '../ui/Form.jsx';
import { Notice } from '../ui/Misc.jsx';
import { bookingService } from '../../services/bookingService.js';
import { storage } from '../../services/storage.js';

const submittedKey = (bookingId) => `upiSubmitted.${bookingId}`;

export function hasSubmittedUtr(bookingId) {
  return storage.get(submittedKey(bookingId), false);
}

/**
 * Lets the customer record their UPI transaction reference. This never
 * marks the booking paid — payment_status stays exactly as Supabase has
 * it (still "pending"). The submission is stored as a contact_messages row
 * (the only table a customer/guest can insert into under existing RLS —
 * bookings.transaction_id / payment_method are explicitly admin-only per
 * guard_booking_updates() in 001_initial_schema.sql, so writing there
 * directly from the customer side is not possible without weakening that
 * trigger, which was explicitly ruled out). The "Pending Verification"
 * state shown below is a client-side/local flag only, for this device —
 * the authoritative payment status always comes from the database.
 */
export default function UtrSubmitForm({ booking }) {
  const [utr, setUtr] = useState('');
  const [submitted, setSubmitted] = useState(() => hasSubmittedUtr(booking.id));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!utr.trim() || utr.trim().length < 6) { setError('Enter a valid UPI Transaction ID / UTR number.'); return; }
    setSaving(true);
    try {
      await bookingService.submitPaymentReference(booking, utr.trim());
      storage.set(submittedKey(booking.id), true);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Could not submit your payment reference. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <Notice tone="info" title="Pending Verification">
        We've received your payment reference for review. Our team verifies it against the actual bank/UPI transaction before marking this booking as paid — this isn't automatic. Your booking stays "Payment pending" until then.
      </Notice>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && <Notice tone="warn">{error}</Notice>}
      <Input label="UPI Transaction ID / UTR number" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 123456789012" hint="Found in your UPI app's transaction history after payment. Never share your UPI PIN or OTP — only the transaction ID." />
      <Button type="submit" size="sm" loading={saving}><Send className="h-4 w-4" />Submit payment reference</Button>
    </form>
  );
}
