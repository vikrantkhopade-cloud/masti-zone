// ─────────────────────────────────────────────────────────────────────────────
//  DEMO DATA — generated locally for the Phase 1 admin dashboard.
//  Nothing here is real. It is deterministic (seeded) so numbers stay stable
//  between reloads. Replace with API responses in Phase 2 (see services/).
// ─────────────────────────────────────────────────────────────────────────────
import { addDays, todayISO } from '../../utils/dates.js';
import { DEFAULT_TICKET_PLANS } from '../defaults.js';

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_M = ['Aarav', 'Vihaan', 'Arjun', 'Rohan', 'Kabir', 'Aditya', 'Rahul', 'Siddharth', 'Yash', 'Omkar', 'Pranav', 'Nikhil', 'Sahil', 'Tanmay', 'Vikram', 'Harsh', 'Karan', 'Ishaan', 'Manish', 'Suresh'];
const FIRST_F = ['Ananya', 'Diya', 'Priya', 'Sneha', 'Aditi', 'Kavya', 'Ishita', 'Pooja', 'Neha', 'Riya', 'Sakshi', 'Tanvi', 'Meera', 'Shruti', 'Anjali', 'Gauri', 'Nisha', 'Pallavi', 'Swati', 'Komal'];
const LAST = ['Patil', 'Sharma', 'Deshmukh', 'Kulkarni', 'Joshi', 'Shinde', 'Pawar', 'Jadhav', 'Mehta', 'Gupta', 'Iyer', 'Reddy', 'Nair', 'Verma', 'Chavan', 'Bhosale', 'More', 'Gaikwad', 'Singh', 'Khan'];
const CITIES = ['Pune', 'Mumbai', 'Nashik', 'Satara', 'Kolhapur', 'Thane', 'Aurangabad', 'Nagpur', 'Solapur', 'Ahmednagar'];

function pickWeighted(rand, items) {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of items) { if ((r -= w) <= 0) return v; }
  return items[items.length - 1][0];
}

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

function buildDemo() {
  const rand = mulberry32(20261101);
  const today = todayISO();
  const PAST_DAYS = 150;
  const FUTURE_DAYS = 10;

  // Customers
  const customers = Array.from({ length: 640 }, (_, i) => {
    const female = rand() < 0.47;
    const first = pick(rand, female ? FIRST_F : FIRST_M);
    const last = pick(rand, LAST);
    return {
      id: `CUS-${String(10001 + i)}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}`.toLowerCase() + '@demo.mail',
      phone: `+91 9${String(Math.floor(rand() * 1e9)).padStart(9, '0')}`,
      city: pick(rand, CITIES),
      joinedAt: addDays(today, -Math.floor(rand() * 400) - 5),
      gender: female ? 'female' : 'male',
    };
  });

  const bookings = [];
  let seq = 1;
  for (let offset = -PAST_DAYS; offset <= FUTURE_DAYS; offset++) {
    const date = addDays(today, offset);
    const dow = new Date(`${date}T00:00:00`).getDay();
    const weekend = dow === 0 || dow === 6;
    const season = 1 + 0.25 * Math.sin((offset + PAST_DAYS) / 18);
    const future = offset > 0;
    const base = (weekend ? 46 : 24) * season * (future ? 0.35 / Math.max(1, offset / 3) + 0.15 : 1);
    const count = Math.max(2, Math.round(base + (rand() - 0.5) * 12));

    for (let i = 0; i < count; i++) {
      const customer = pick(rand, customers);
      const plan = pickWeighted(rand, [[DEFAULT_TICKET_PLANS[0], 15], [DEFAULT_TICKET_PLANS[1], 35], [DEFAULT_TICKET_PLANS[2], 25], [DEFAULT_TICKET_PLANS[3], 25]]);
      const hour = pickWeighted(rand, [[10, 20], [11, 22], [12, 16], [13, 10], [14, 10], [15, 10], [16, 8], [17, 4]]);
      const quantity = pickWeighted(rand, [[1, 12], [2, 28], [3, 18], [4, 22], [5, 10], [6, 6], [8, 3], [10, 1]]);
      const visitors = Array.from({ length: quantity }, (_, vi) => {
        const isChild = vi > 0 && rand() < 0.32;
        const age = isChild ? 2 + Math.floor(rand() * 11) : 16 + Math.floor(Math.pow(rand(), 1.6) * 50);
        const g = pickWeighted(rand, [['male', 50], ['female', 46], ['other', 4]]);
        return { name: vi === 0 ? customer.name : `${pick(rand, g === 'female' ? FIRST_F : FIRST_M)} ${customer.name.split(' ')[1]}`, age, gender: vi === 0 ? customer.gender : g };
      });
      const childCount = visitors.filter((v) => v.age <= 12).length;
      const subtotal = plan.price * quantity;
      const tax = Math.round(subtotal * 0.18);
      const total = subtotal + tax;

      let status;
      let paymentStatus;
      if (future) {
        status = pickWeighted(rand, [['confirmed', 84], ['pending', 10], ['cancelled', 6]]);
      } else {
        status = pickWeighted(rand, [['confirmed', 81], ['abandoned', 10], ['cancelled', 6], ['pending', 3]]);
      }
      if (status === 'confirmed') paymentStatus = 'paid';
      else if (status === 'pending') paymentStatus = 'pending';
      else if (status === 'cancelled') paymentStatus = rand() < 0.8 ? 'refunded' : 'refund_pending';
      else paymentStatus = rand() < 0.55 ? 'not_initiated' : 'failed';

      const createdOffset = Math.floor(Math.pow(rand(), 2) * 6);
      const createdAt = new Date(`${addDays(date, -createdOffset)}T${String(7 + Math.floor(rand() * 15)).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}:00`).toISOString();
      const method = pickWeighted(rand, [['UPI', 62], ['Card', 22], ['Net Banking', 10], ['Wallet', 6]]);

      bookings.push({
        id: `MZ-D${String(seq++).padStart(6, '0')}`,
        isDemo: true,
        customerId: customer.id,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        visitDate: date,
        entryTime: `${String(hour).padStart(2, '0')}:00`,
        planId: plan.id,
        planLabel: plan.label,
        quantity,
        childCount,
        adultCount: quantity - childCount,
        visitors,
        unitPrice: plan.price,
        subtotal,
        tax,
        total,
        status,
        paymentStatus,
        paymentMethod: status === 'abandoned' && paymentStatus === 'not_initiated' ? null : method,
        transactionId: paymentStatus === 'not_initiated' ? null : `DEMO-TXN-${Math.floor(rand() * 1e10).toString(36).toUpperCase()}`,
        createdAt,
        abandonedStage: status === 'abandoned' ? pickWeighted(rand, [['Visitor details', 35], ['Checkout review', 40], ['Payment', 25]]) : null,
        cancelReason: status === 'cancelled' ? pick(rand, ['Change of plans', 'Weather', 'Health issue', 'Booked wrong date', 'Duplicate booking']) : null,
        refundAmount: status === 'cancelled' ? Math.round(total * 0.9) : 0,
      });
    }
  }

  const admins = [
    { id: 'ADM-1', name: 'Park Owner', email: 'owner@demo.mail', role: 'Super Admin', status: 'active', lastActive: addDays(today, 0) },
    { id: 'ADM-2', name: 'Operations Manager', email: 'ops@demo.mail', role: 'Manager', status: 'active', lastActive: addDays(today, -1) },
    { id: 'ADM-3', name: 'Front Desk 1', email: 'desk1@demo.mail', role: 'Ticket Counter', status: 'active', lastActive: addDays(today, -2) },
    { id: 'ADM-4', name: 'Accounts', email: 'accounts@demo.mail', role: 'Finance', status: 'active', lastActive: addDays(today, -4) },
    { id: 'ADM-5', name: 'Front Desk 2', email: 'desk2@demo.mail', role: 'Ticket Counter', status: 'disabled', lastActive: addDays(today, -32) },
  ];

  return { customers, bookings, admins };
}

let cache = null;
export function getDemoData() {
  if (!cache) cache = buildDemo();
  return cache;
}
