// Initial business configuration. Admin can change all of this from the
// Admin Panel; changes are persisted by settingsService.

export const DEFAULT_TICKET_PLANS = [
  { id: '1h', label: '1 Hour', hours: 1, price: 200, active: true, description: 'Quick dip — perfect for a cool-down break.' },
  { id: '3h', label: '3 Hours', hours: 3, price: 300, active: true, description: 'Slides, wave pool and a snack break.', popular: true },
  { id: '5h', label: '5 Hours', hours: 5, price: 500, active: true, description: 'Explore every zone at a relaxed pace.' },
  { id: 'full', label: 'Full Day', hours: 8, price: 700, active: true, description: 'Opening to closing — the complete MASTI experience.' },
];

// Child / Adult age limits (Admin configurable).
export const DEFAULT_AGE_SETTINGS = {
  minAge: 2, // visitors younger than this cannot be booked online
  childMaxAge: 12, // minAge..childMaxAge = Child, above = Adult
  childDiscountPct: 0, // optional discount for children
  adultDiscountPct: 0,
  maxAge: 90,
};

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
