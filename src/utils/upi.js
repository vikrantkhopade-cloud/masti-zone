// Direct UPI payment helpers — intentionally kept separate from
// src/utils/ticket.js (booking-verification QR). Same underlying `qrcode`
// library (already installed, free, fully offline), different purpose:
// this one encodes a standard `upi://pay` deep link, never a booking
// reference URL, so the two QR codes can never be confused with each other.
import QRCode from 'qrcode';

export const UPI_PAYEE = {
  pa: 'vikrantkhopade-1@okhdfcbank',
  pn: 'Vikrant Khopade',
  cu: 'INR',
};

/** Standard UPI deep-link URI (BHIM/NPCI spec): upi://pay?pa=...&pn=...&am=...&cu=...&tn=... */
export function buildUpiUri({ amount, note }) {
  const qs = [
    `pa=${encodeURIComponent(UPI_PAYEE.pa)}`,
    `pn=${encodeURIComponent(UPI_PAYEE.pn)}`,
    `am=${encodeURIComponent(Number(amount).toFixed(2))}`,
    `cu=${UPI_PAYEE.cu}`,
    `tn=${encodeURIComponent(note)}`,
  ].join('&');
  return `upi://pay?${qs}`;
}

export async function renderUpiQrToCanvas(canvas, uri, size = 200) {
  await QRCode.toCanvas(canvas, uri, { width: size, margin: 1, color: { dark: '#0a1a3a', light: '#ffffff' } });
}
