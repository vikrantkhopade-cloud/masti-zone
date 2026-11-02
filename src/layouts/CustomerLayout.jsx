import { Outlet } from 'react-router-dom';
import Navbar from '../components/customer/Navbar.jsx';
import Footer from '../components/customer/Footer.jsx';

export default function CustomerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
