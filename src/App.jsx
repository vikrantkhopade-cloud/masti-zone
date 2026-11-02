import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout.jsx';
import { PageLoader } from './components/ui/StateViews.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';

// Customer site
import Home from './pages/customer/Home.jsx';
import Login from './pages/customer/Login.jsx';
import Register from './pages/customer/Register.jsx';
import AuthCallback from './pages/customer/AuthCallback.jsx';
import BookTickets from './pages/customer/BookTickets.jsx';
import Checkout from './pages/customer/Checkout.jsx';
import Confirmation from './pages/customer/Confirmation.jsx';
import MyBookings from './pages/customer/MyBookings.jsx';
import Profile from './pages/customer/Profile.jsx';
import Contact from './pages/customer/Contact.jsx';
import NotFound from './pages/customer/NotFound.jsx';

// Admin panel — lazy loaded so customers never download admin code/charts.
const RequireAdmin = lazy(() => import('./components/admin/RequireAdmin.jsx'));
const RequireSection = lazy(() => import('./components/admin/RequireSection.jsx'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AllBookings = lazy(() => import('./pages/admin/AllBookings.jsx'));
const Customers = lazy(() => import('./pages/admin/Customers.jsx'));
const VisitorAnalytics = lazy(() => import('./pages/admin/VisitorAnalytics.jsx'));
const RevenueAnalytics = lazy(() => import('./pages/admin/RevenueAnalytics.jsx'));
const AbandonedBookings = lazy(() => import('./pages/admin/AbandonedBookings.jsx'));
const CancelledBookings = lazy(() => import('./pages/admin/CancelledBookings.jsx'));
const Payments = lazy(() => import('./pages/admin/Payments.jsx'));
const Reports = lazy(() => import('./pages/admin/Reports.jsx'));
const PricingSettings = lazy(() => import('./pages/admin/PricingSettings.jsx'));
const AgeSettings = lazy(() => import('./pages/admin/AgeSettings.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const ParkSettings = lazy(() => import('./pages/admin/ParkSettings.jsx'));
const VerifyTicket = lazy(() => import('./pages/admin/VerifyTicket.jsx'));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return; }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <>
      <ScrollToTop />
      <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="auth/callback" element={<AuthCallback />} />
            <Route path="book" element={<BookTickets />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="booking/:bookingId" element={<Confirmation />} />
            <Route path="my-bookings" element={<MyBookings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route element={<RequireSection section="dashboard" />}>
                <Route path="dashboard" element={<Dashboard />} />
              </Route>
              <Route element={<RequireSection section="bookings" />}>
                <Route path="bookings" element={<AllBookings />} />
                <Route path="bookings/abandoned" element={<AbandonedBookings />} />
                <Route path="bookings/cancelled" element={<CancelledBookings />} />
                <Route path="verify" element={<VerifyTicket />} />
                <Route path="verify/:bookingId" element={<VerifyTicket />} />
              </Route>
              <Route element={<RequireSection section="customers" />}>
                <Route path="customers" element={<Customers />} />
              </Route>
              <Route element={<RequireSection section="analytics" />}>
                <Route path="analytics/visitors" element={<VisitorAnalytics />} />
              </Route>
              <Route element={<RequireSection section="revenue" />}>
                <Route path="analytics/revenue" element={<RevenueAnalytics />} />
              </Route>
              <Route element={<RequireSection section="payments" />}>
                <Route path="payments" element={<Payments />} />
              </Route>
              <Route element={<RequireSection section="reports" />}>
                <Route path="reports" element={<Reports />} />
              </Route>
              <Route element={<RequireSection section="settings" />}>
                <Route path="settings/pricing" element={<PricingSettings />} />
                <Route path="settings/age-categories" element={<AgeSettings />} />
                <Route path="settings/park" element={<ParkSettings />} />
              </Route>
              <Route element={<RequireSection section="staff" />}>
                <Route path="settings/admins" element={<AdminUsers />} />
              </Route>
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}
