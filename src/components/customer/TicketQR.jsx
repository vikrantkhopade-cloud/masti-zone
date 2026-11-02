import { useEffect, useRef, useState } from 'react';
import { Download, QrCode } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { buildTicketPng, downloadBlob, renderQrToCanvas } from '../../utils/ticket.js';

/** The full digital ticket block shown on the Confirmation page — live QR
 * plus a "Download ticket" action that composes a standalone PNG. */
export default function TicketQR({ booking }) {
  const canvasRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (canvasRef.current && booking?.id) renderQrToCanvas(canvasRef.current, booking.id, 180).catch(() => {});
  }, [booking?.id]);

  const onDownload = async () => {
    setDownloading(true);
    try {
      const blob = await buildTicketPng(booking);
      downloadBlob(blob, `${booking.id}-ticket.png`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-navy-50/60 p-6 text-center print:bg-white">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-navy-400"><QrCode className="h-3.5 w-3.5" />Entry QR code</span>
      <canvas ref={canvasRef} width={180} height={180} className="rounded-xl bg-white p-2 shadow-card" aria-label={`QR code for booking ${booking?.id}`} />
      <p className="max-w-[240px] text-xs text-navy-500">Show this at the entry gate — staff scan or enter the booking ID to verify it.</p>
      {booking.paymentStatus !== 'paid' && (
        <p className="text-xs font-semibold text-amber-600">Not a valid entry pass until payment is confirmed.</p>
      )}
      <Button size="sm" variant="outline" loading={downloading} onClick={onDownload} className="print:hidden"><Download className="h-4 w-4" />Download ticket</Button>
    </div>
  );
}
