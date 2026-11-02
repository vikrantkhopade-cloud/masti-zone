import Hero from '../../components/customer/home/Hero.jsx';
import Attractions from '../../components/customer/home/Attractions.jsx';
import Pricing from '../../components/customer/home/Pricing.jsx';
import Facilities from '../../components/customer/home/Facilities.jsx';
import InstagramFeed from '../../components/customer/home/InstagramFeed.jsx';
import Reviews from '../../components/customer/home/Reviews.jsx';
import LocationContact from '../../components/customer/home/LocationContact.jsx';
import CtaBanner from '../../components/customer/home/CtaBanner.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <Attractions />
      <Pricing />
      <Facilities />
      <Reviews />
      <InstagramFeed />
      <LocationContact />
      <CtaBanner />
    </>
  );
}
