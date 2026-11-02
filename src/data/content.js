// Marketing content for the customer website (static, editable).
import { IMAGES } from '../config/images.js';

export const ATTRACTIONS = [
  { id: 'tsunami', name: 'Tsunami Wave Pool', category: 'Family', thrill: 2, image: IMAGES.wavePool, description: 'Ocean-style waves rolling in every 15 minutes — bring the whole gang.' },
  { id: 'lazy', name: 'Lazy River Lagoon', category: 'Relax', thrill: 1, image: IMAGES.lazyRiver, description: 'A 400 m tube ride past palms, mist curtains and hidden caves.' },
  { id: 'surf', name: 'FlowRider Surf', category: 'Thrill', thrill: 3, image: IMAGES.surf, description: 'Catch a standing wave on our surf simulator with trained coaches.' },
  { id: 'splash', name: 'Kids Splash Island', category: 'Kids', thrill: 1, image: IMAGES.splashZone, description: 'Shallow pools, mini slides and a giant tipping bucket for little ones.' },
  { id: 'racer', name: 'Aqua Racer Lanes', category: 'Thrill', thrill: 3, image: IMAGES.racingPool, description: 'Race your friends head-to-head across six competition lanes.' },
  { id: 'infinity', name: 'Skyline Infinity Pool', category: 'Relax', thrill: 1, image: IMAGES.infinity, description: 'Adults-preferred chill zone with loungers and sunset views.' },
];

export const FACILITIES = [
  { icon: 'ShieldCheck', title: 'Certified Lifeguards', text: 'Trained lifeguards at every pool and slide, all day.' },
  { icon: 'Lock', title: 'Digital Lockers', text: 'Secure lockers with wristband access near every zone.' },
  { icon: 'UtensilsCrossed', title: 'Food Court', text: 'Hygienic veg & non-veg food court with poolside snacks.' },
  { icon: 'Shirt', title: 'Changing Rooms', text: 'Clean, separate changing rooms with hot showers.' },
  { icon: 'Car', title: 'Free Parking', text: 'Spacious parking for cars, bikes and buses.' },
  { icon: 'HeartPulse', title: 'First Aid Center', text: 'On-site medical room with a qualified attendant.' },
  { icon: 'Accessibility', title: 'Accessible Park', text: 'Ramps and assisted entry for elderly and differently-abled guests.' },
  { icon: 'Sparkles', title: 'Filtered Water', text: 'Multi-stage filtration with hourly water quality checks.' },
];

// DEMO reviews — replace with verified reviews (e.g. Google Reviews) in a later phase.
export const REVIEWS = [
  { id: 1, name: 'Priya S.', location: 'Pune', rating: 5, text: 'Super clean pools and the wave pool is unreal. Lifeguards were attentive the whole time — felt very safe with my kids.', date: 'Oct 2026' },
  { id: 2, name: 'Rahul M.', location: 'Mumbai', rating: 5, text: 'Booked the full-day ticket online in two minutes. FlowRider surf was the highlight of our college trip!', date: 'Sep 2026' },
  { id: 3, name: 'Ananya K.', location: 'Nashik', rating: 4, text: 'Great food court and plenty of shade. Lazy river is perfect after lunch. Weekends get busy — go early.', date: 'Sep 2026' },
  { id: 4, name: 'Vikram & family', location: 'Satara', rating: 5, text: 'Kids Splash Island kept our 5-year-old busy for hours. Changing rooms were spotless.', date: 'Aug 2026' },
];

// DEMO Instagram tiles — the real Instagram API will be connected in a later phase.
export const INSTAGRAM_POSTS = [
  { id: 'p1', image: IMAGES.palmPool, likes: 1284, caption: 'Golden hour at the lagoon 🌴' },
  { id: 'p2', image: IMAGES.underwater, likes: 932, caption: 'Dive into the weekend 💙' },
  { id: 'p3', image: IMAGES.surf, likes: 2201, caption: 'Who is riding the FlowRider today? 🏄' },
  { id: 'p4', image: IMAGES.nightPool, likes: 1576, caption: 'Night splash party is back ✨' },
  { id: 'p5', image: IMAGES.splashZone, likes: 811, caption: 'Little splashers, big smiles' },
  { id: 'p6', image: IMAGES.sunsetPool, likes: 1047, caption: 'Sunsets hit different here 🌅' },
];

export const STATS = [
  { value: '18+', label: 'Rides & slides' },
  { value: '12 acres', label: 'Of water fun' },
  { value: '4.8★', label: 'Guest rating' },
  { value: '50+', label: 'Lifeguards on duty' },
];
