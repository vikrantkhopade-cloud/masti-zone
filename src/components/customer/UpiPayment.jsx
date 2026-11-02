import { useEffect, useRef } from 'react';
import { ShieldAlert, Smartphone } from 'lucide-react';
import { formatINR } from '../../utils/format.js';
import { buildUpiUri, renderUpiQrToCanvas, UPI_PAYEE } from '../../utils/upi.js';

/**
 * Direct UPI payment section — no gateway, no fee, no API key. Deliberately
 * NOT wrapped in its own Card, so it composes into whatever the caller
 * already has (Checkout's existing "Payment" card, or a standalone card on
 * Confirmation). Reused on Checkout (pre-booking, using a pre-generated
 * reference) and Confirmation (post-booking, using the real booking id).
 * Scanning or paying here never marks anything as paid by itself — see
 * UtrSubmitForm for why.
 */
export default function UpiPayment({ amount, reference }) {
  const canvasRef = useRef(null);
  const uri = buildUpiUri({ amount, note: reference });

  useEffect(() => {
    if (canvasRef.current) renderUpiQrToCanvas(canvasRef.current, uri, 200).catch(() => {});
  }, [uri]);

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <canvas ref={canvasRef} width={200} height={200} className="rounded-xl bg-white p-2 shadow-card" aria-label={`UPI payment QR code for ${formatINR(amount)} to ${UPI_PAYEE.pn}`} />
          <p className="max-w-[200px] text-center text-xs text-navy-400">Scan this QR using another phone's UPI app</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl bg-navy-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Amount payable</p>
            <p className="font-display text-2xl font-bold text-navy-900">{formatINR(amount)}</p>
            <p className="mt-1 text-xs text-navy-500">Payee: {UPI_PAYEE.pn} · UPI ID: <span className="font-mono">{UPI_PAYEE.pa}</span></p>
            <p className="mt-1 text-xs text-navy-400">Reference: <span className="font-mono">{reference}</span></p>
          </div>

          <a href={uri} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-aqua-gradient px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 sm:w-auto">
            <Smartphone className="h-4 w-4" />Pay using UPI App
          </a>

          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-navy-600">
            <li>Open Google Pay, PhonePe, Paytm or another supported UPI app.</li>
            <li>Scan the displayed QR code.</li>
            <li>Verify the beneficiary name and amount in the UPI app.</li>
            <li>Complete payment using your UPI PIN.</li>
            <li>Return to MASTI ZONE and submit your payment reference below.</li>
          </ol>

          <p className="flex items-start gap-1.5 text-xs font-medium text-amber-700"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />Never enter or share your UPI PIN or OTP here — MASTI ZONE staff will never ask for it.</p>
        </div>
      </div>
    </div>
  );
}
