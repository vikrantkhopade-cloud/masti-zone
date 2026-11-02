import { useState } from 'react';
import { CheckCircle2, ChevronDown, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import PageHero from '../../components/customer/PageHero.jsx';
import { MapPanel } from '../../components/customer/home/LocationContact.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { contactService } from '../../services/bookingService.js';
import { formatTime } from '../../utils/format.js';
import { IMAGES } from '../../config/images.js';

const FAQ = [
  ['What should I wear?', 'Nylon or lycra swimwear is mandatory in all pools and on slides. Costumes are available for purchase at the park store.'],
  ['Can I bring outside food?', 'Outside food and beverages are not permitted. Our food court serves a wide range of veg and non-veg meals and snacks.'],
  ['What is the cancellation policy?', 'Paid bookings can be cancelled up to 24 hours before the visit date for a 90% refund. Reserved (unpaid) bookings can be cancelled anytime at no cost.'],
  ['Are lockers available?', 'Yes — digital lockers are available near every zone for a small fee.'],
  ['Do children need a ticket?', 'Children below the minimum age shown on the ticket page enter free with a paying adult. All others need a Child or Adult ticket.'],
];

export default function Contact() {
  const { park } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', topic: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [state, setState] = useState('idle');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const errors = {
    name: form.name.trim().length >= 2 ? null : 'Enter your name',
    email: /^\S+@\S+\.\S{2,}$/.test(form.email) ? null : 'Enter a valid email',
    topic: form.topic ? null : 'Choose a topic',
    message: form.message.trim().length >= 10 ? null : 'Message should be at least 10 characters',
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    setState('sending');
    try {
      await contactService.sendMessage(form);
      setState('sent');
    } catch {
      setState('error');
    }
  };
  const err = (k) => (submitted ? errors[k] || undefined : undefined);

  const info = [
    { icon: Phone, label: 'Phone', value: park.phone || 'Coming soon', href: park.phone && `tel:${park.phone}` },
    { icon: Mail, label: 'Email', value: park.email || 'Coming soon', href: park.email && `mailto:${park.email}` },
    { icon: MapPin, label: 'Address', value: park.address || 'To be announced' },
    { icon: Clock, label: 'Hours', value: `${formatTime(park.openTime)} – ${formatTime(park.closeTime)}` },
  ];

  return (
    <>
      <PageHero eyebrow="Contact" title="We're here to help" subtitle="Questions about tickets, group bookings or events? Send us a message and our team will get back to you." image={IMAGES.contact} />
      <div className="container-x grid gap-8 pb-16 pt-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          {info.map(({ icon: Icon, label, value, href }) => (
            <Card key={label} className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-aqua-gradient text-white shadow-glow"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">{label}</p>
                {href ? <a href={href} className="break-words font-semibold text-navy-900 hover:text-aqua-600">{value}</a> : <p className="break-words font-semibold text-navy-900">{value}</p>}
              </div>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-8">
          {state === 'sent' ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500"><CheckCircle2 className="h-8 w-8" /></span>
              <h2 className="mt-5 text-2xl font-bold">Thanks, {form.name.split(' ')[0]}!</h2>
              <p className="mt-2 max-w-md text-navy-500">Your message has been recorded and our team will get back to you soon.</p>
              <Button className="mt-6" variant="outline" onClick={() => { setForm({ name: '', email: '', phone: '', topic: '', message: '' }); setSubmitted(false); setState('idle'); }}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><h2 className="text-2xl font-bold">Send us a message</h2><p className="mt-1 text-sm text-navy-500">We usually reply within one working day.</p></div>
              <Input label="Name" required value={form.name} onChange={set('name')} error={err('name')} autoComplete="name" />
              <Input label="Email" type="email" required value={form.email} onChange={set('email')} error={err('email')} autoComplete="email" />
              <Input label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
              <Select label="Topic" required value={form.topic} onChange={set('topic')} error={err('topic')} placeholder="Select a topic" options={[{ value: 'booking', label: 'Booking help' }, { value: 'group', label: 'Group / school booking' }, { value: 'event', label: 'Birthday & corporate events' }, { value: 'feedback', label: 'Feedback' }, { value: 'other', label: 'Other' }]} />
              <Textarea className="sm:col-span-2" label="Message" required value={form.message} onChange={set('message')} error={err('message')} placeholder="How can we help?" />
              {state === 'error' && <p className="text-sm text-red-600 sm:col-span-2">Could not send your message. Please try again.</p>}
              <div className="sm:col-span-2"><Button type="submit" size="lg" loading={state === 'sending'}><Send className="h-4 w-4" />Send message</Button></div>
            </form>
          )}
        </Card>
      </div>

      <div className="container-x grid gap-8 pb-24 lg:grid-cols-12">
        <section id="faq" className="scroll-mt-24 lg:col-span-6">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-5 space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-navy-100 bg-white p-5 transition open:shadow-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-navy-900">{q}<ChevronDown className="h-5 w-5 shrink-0 text-navy-300 transition group-open:rotate-180" /></summary>
                <p className="mt-3 text-sm leading-relaxed text-navy-500">{a}</p>
              </details>
            ))}
          </div>
        </section>
        <div className="lg:col-span-6"><MapPanel className="min-h-[420px] shadow-soft" /></div>
      </div>
    </>
  );
}
