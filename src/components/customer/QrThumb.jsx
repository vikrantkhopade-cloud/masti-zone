import { useEffect, useRef } from 'react';
import { renderQrToCanvas } from '../../utils/ticket.js';

/** Small inline QR thumbnail for a booking — used on My Bookings cards. */
export default function QrThumb({ bookingId, size = 56, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && bookingId) renderQrToCanvas(ref.current, bookingId, size).catch(() => {});
  }, [bookingId, size]);
  return <canvas ref={ref} width={size} height={size} className={className} aria-label={`QR code for booking ${bookingId}`} />;
}
