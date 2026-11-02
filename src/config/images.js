// Central image registry.
// PLACEHOLDER stock photography (Unsplash) — replace with real MASTI ZONE photos
// by changing the URLs here (or pointing them at /public/images/...).
const u = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const IMAGES = {
  hero: u('1540541338287-41700207dee6', 2000),
  heroAlt: u('1530053969600-caed2596d242', 1600),
  underwater: u('1530053969600-caed2596d242', 1200),
  wavePool: u('1471922694854-ff1b63b20054'),
  lazyRiver: u('1563911302283-d2bc129e7570'),
  splashZone: u('1504309092620-4d0ec726efa4'),
  racingPool: u('1560090995-01632a28895b'),
  surf: u('1530870110042-98b2cb110834'),
  infinity: u('1575429198097-0414ec08e8cd'),
  nightPool: u('1571896349842-33c89424de2d'),
  palmPool: u('1600011689032-8b628b8a8747'),
  deckPool: u('1584132967334-10e028bd69f7'),
  sunsetPool: u('1572331165267-854da2b10ccc'),
  cabana: u('1566073771259-6a8506099945'),
  gardenPool: u('1576013551627-0cc20b96c2a7'),
  villaPool: u('1582610116397-edb318620f90'),
  auth: u('1600011689032-8b628b8a8747', 1400),
  contact: u('1540541338287-41700207dee6', 1600),
};
