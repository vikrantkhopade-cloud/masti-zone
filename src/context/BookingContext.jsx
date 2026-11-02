import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Holds the in-progress booking (ticket selection → checkout) for this tab.
const BookingContext = createContext(null);
const KEY = 'mastizone.v1.draft';

export const emptyVisitor = () => ({ name: '', age: '', gender: '' });

const initialDraft = () => ({
  visitDate: '',
  entryTime: '',
  planId: '',
  quantity: 1,
  visitors: [emptyVisitor()],
  contact: { name: '', email: '', phone: '' },
  // Pre-generated on Checkout so a pre-booking UPI QR has a stable
  // reference; persisted here (not local useState) so a reload between
  // paying and clicking "Reserve booking" doesn't orphan that reference
  // under a since-replaced id. Cleared by reset() after booking succeeds.
  reservationId: '',
});

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...initialDraft(), ...JSON.parse(raw) } : initialDraft();
  } catch {
    return initialDraft();
  }
}

export function BookingProvider({ children }) {
  const [draft, setDraft] = useState(load);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, [draft]);

  const update = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);

  const setQuantity = useCallback((q) => setDraft((d) => {
    const quantity = Math.max(1, q);
    const visitors = [...d.visitors];
    while (visitors.length < quantity) visitors.push(emptyVisitor());
    return { ...d, quantity, visitors: visitors.slice(0, quantity) };
  }), []);

  const updateVisitor = useCallback((index, patch) => setDraft((d) => ({
    ...d,
    visitors: d.visitors.map((v, i) => (i === index ? { ...v, ...patch } : v)),
  })), []);

  const reset = useCallback(() => setDraft(initialDraft()), []);

  const value = useMemo(() => ({ draft, update, setQuantity, updateVisitor, reset }), [draft, update, setQuantity, updateVisitor, reset]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
}
