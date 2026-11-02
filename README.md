# MASTI ZONE — Water Park Booking & Management

Phase 1: **frontend UI and navigation only**. There is no backend, authentication, OTP, payment gateway or Instagram API yet. All admin numbers are **demo data**.

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (customer site)
                   # http://localhost:5173/admin  (admin panel)
npm run build      # production build → dist/
```

Copy `.env.example` to `.env.local` to set the park's public phone, email, address and map link.

## Structure

```
src/
  config/        park defaults (from env) and the image registry (swap stock photos here)
  data/          default pricing/age rules, marketing content, mock/demoData.js (seeded DEMO data)
  services/      API layer. Swap these function bodies for real calls in Phase 2
  context/       SettingsContext (pricing, age, park), BookingContext (in-progress booking)
  hooks/         useAsync, useAnalytics, useSettingsForm, useReveal
  utils/         pricing, booking rules, analytics aggregation, dates, CSV export, formatting
  components/
    ui/          Button, Card, Badge, Form fields, Modal, loading/empty/error states, ErrorBoundary
    customer/    Navbar, Footer, PageHero, home sections, booking widgets
    admin/       Sidebar nav, StatCard, DateRangeFilter, ChartCard, DataTable, DonutChart, SaveBar
  layouts/       CustomerLayout, AdminLayout (lazy-loaded, completely separate)
  pages/customer Home, Login, Register, BookTickets, Checkout, Confirmation, MyBookings, Contact
  pages/admin    Dashboard + 12 management pages + AdminLogin
```

## Phase 1 behaviour

| Area | Now | Phase 2 |
|---|---|---|
| Booking | Saved in this browser with status **Pending / Payment pending**. Never marked paid | Server booking + payment gateway + webhook verification |
| Login / Register / OTP | Validated forms; shows a "coming soon" notice | Real auth (e.g. Supabase) |
| Pricing, age and park settings | Admin edits saved in localStorage and used by the customer site in the same browser | Settings table on the server |
| Admin analytics | Seeded **DEMO** bookings plus website test bookings | SQL views / API |
| Excel reports | Excel-compatible CSV download (rows tagged DEMO) | Optional native .xlsx |
| Instagram & reviews | Labelled preview / sample content | Instagram Graph API, verified reviews |

Images are placeholder Unsplash stock photos. Replace them in `src/config/images.js`.
