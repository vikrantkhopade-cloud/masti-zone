// Digital ticket helpers — QR generation (via the free, offline `qrcode`
// npm package; no network call, no paid API) and a canvas-composed,
// downloadable ticket image. Nothing here talks to a server.
import QRCode from 'qrcode';
import { formatDate, formatTime } from './format.js';

const QR_COLORS = { dark: '#0a1a3a', light: '#ffffff' };

/**
 * The QR encodes ONLY a verification URL carrying the booking ID — no
 * customer name, email, phone, or visitor details. The URL itself is
 * behind the admin RequireAdmin/RequireSection guards (role must already
 * have "bookings" access), so scanning it without a staff session just
 * prompts a sign-in; it never exposes booking details publicly.
 */
export function verificationUrlFor(bookingId) {
  return `${window.location.origin}/admin/verify/${encodeURIComponent(bookingId)}`;
}

export async function renderQrToCanvas(canvas, bookingId, size = 180) {
  await QRCode.toCanvas(canvas, verificationUrlFor(bookingId), { width: size, margin: 1, color: QR_COLORS });
}

async function qrAsCanvas(bookingId, size) {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, verificationUrlFor(bookingId), { width: size, margin: 1, color: QR_COLORS });
  return canvas;
}

const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled', abandoned: 'Abandoned' };
const PAYMENT_LABEL = { pending: 'Payment pending', paid: 'Paid', failed: 'Failed', refunded: 'Refunded', refund_pending: 'Refund pending', not_initiated: 'Not initiated', not_charged: 'Not charged' };

/**
 * Draws a self-contained, printable ticket (booking details + QR) onto an
 * offscreen canvas and returns it as a downloadable PNG Blob. Pure Canvas
 * 2D drawing — no paid service, no server round-trip.
 */
export async function buildTicketPng(booking) {
  const visitorLines = booking.visitors.slice(0, 8).map((v) => `${v.name} · ${v.age} yrs · ${v.gender}`);
  const extra = Math.max(0, booking.visitors.length - 8);

  const W = 700;
  const headerH = 120;
  const qrSize = 220;
  const rowH = 46;
  const detailRows = Math.ceil(4 / 2) * rowH;
  const visitorsListH = (visitorLines.length + (extra ? 1 : 0)) * 22;
  const notPaid = booking.paymentStatus !== 'paid';
  const footerH = notPaid ? 56 : 0;
  const H = headerH + 36 + detailRows + 8 + 20 + visitorsListH + 16 + 24 + qrSize + 20 + 20 + (notPaid ? 24 + footerH : 0) + 40;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#0a1a3a');
  grad.addColorStop(1, '#13306b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, headerH);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px Arial, sans-serif';
  ctx.fillText('MASTI ZONE', 32, 48);
  ctx.font = '500 14px Arial, sans-serif';
  ctx.fillStyle = '#9fd7e8';
  ctx.fillText('WATER PARK · ENTRY TICKET', 32, 72);

  ctx.textAlign = 'right';
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(booking.id, W - 32, 48);
  ctx.font = '500 13px Arial, sans-serif';
  ctx.fillStyle = '#9fd7e8';
  ctx.fillText(`${STATUS_LABEL[booking.status] || booking.status} · ${PAYMENT_LABEL[booking.paymentStatus] || booking.paymentStatus}`, W - 32, 72);
  ctx.textAlign = 'left';

  let y = headerH + 36;
  const col1 = 32;
  const col2 = W / 2 + 16;
  const rows = [
    ['Customer', booking.contact?.name || booking.customerName || '—'],
    ['Visit date', formatDate(booking.visitDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })],
    ['Entry time', formatTime(booking.entryTime)],
    ['Duration / Plan', booking.planLabel],
  ];
  rows.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? col1 : col2;
    const rowY = y + Math.floor(i / 2) * rowH;
    ctx.fillStyle = '#8a96ab';
    ctx.font = '600 11px Arial, sans-serif';
    ctx.fillText(label.toUpperCase(), x, rowY);
    ctx.fillStyle = '#0a1a3a';
    ctx.font = '700 17px Arial, sans-serif';
    ctx.fillText(String(value), x, rowY + 22);
  });
  y += detailRows + 8;

  ctx.fillStyle = '#8a96ab';
  ctx.font = '600 11px Arial, sans-serif';
  ctx.fillText(`VISITORS (${booking.visitors.length})`, col1, y);
  y += 20;
  ctx.font = '500 14px Arial, sans-serif';
  ctx.fillStyle = '#1f2b44';
  visitorLines.forEach((line) => { ctx.fillText(line, col1, y); y += 22; });
  if (extra) { ctx.fillStyle = '#8a96ab'; ctx.fillText(`+ ${extra} more`, col1, y); y += 22; }

  y += 16;
  ctx.strokeStyle = '#d7dee8';
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(W - 32, y); ctx.stroke();
  ctx.setLineDash([]);
  y += 24;

  const qrCanvas = await qrAsCanvas(booking.id, qrSize);
  ctx.drawImage(qrCanvas, (W - qrSize) / 2, y, qrSize, qrSize);
  y += qrSize + 20;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a96ab';
  ctx.font = '500 12px Arial, sans-serif';
  ctx.fillText('Present this QR code at the entry gate for staff verification', W / 2, y);
  ctx.textAlign = 'left';

  if (notPaid) {
    y += 24;
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, y, W, footerH);
    ctx.fillStyle = '#92400e';
    ctx.font = '700 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAYMENT PENDING — this is not yet a valid entry pass', W / 2, y + footerH / 2 + 5);
    ctx.textAlign = 'left';
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
