import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';
import { Reveal, SectionHeading } from '../../ui/Misc.jsx';
import Button from '../../ui/Button.jsx';
import { useSettings } from '../../../context/SettingsContext.jsx';
import { formatTime } from '../../../utils/format.js';

export function MapPanel({ className = '' }) {
  const { park } = useSettings();
  if (park.mapEmbedUrl) {
    return <iframe title="MASTI ZONE location map" src={park.mapEmbedUrl} className={`h-full min-h-[320px] w-full rounded-3xl border-0 ${className}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />;
  }
  // Styled placeholder until a Google Maps embed URL is configured.
  return (
    <div className={`relative h-full min-h-[320px] overflow-hidden rounded-3xl bg-aqua-50 ${className}`}>
      <svg className="absolute inset-0 h-full w-full text-aqua-200" aria-hidden>
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <path d="M-20 260 C 120 200, 220 320, 380 230 S 640 120, 900 200" stroke="#a1effa" strokeWidth="26" fill="none" />
        <path d="M120 -10 L 260 520" stroke="#ffffff" strokeWidth="14" fill="none" />
        <path d="M-10 120 L 900 60" stroke="#ffffff" strokeWidth="10" fill="none" />
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <span className="relative mx-auto grid h-14 w-14 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-aqua-400/40" />
          <span className="relative grid h-14 w-14 place-items-center rounded-full bg-navy-900 text-white shadow-soft"><MapPin className="h-6 w-6" /></span>
        </span>
        <p className="mt-3 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-navy-800 shadow-card">{park.name} Water Park</p>
        <p className="mt-2 text-xs text-navy-400">Interactive map will appear once the map link is configured</p>
      </div>
    </div>
  );
}

export default function LocationContact() {
  const { park } = useSettings();
  const items = [
    { icon: MapPin, label: 'Address', value: park.address || 'To be announced', href: park.address ? `https://maps.google.com/?q=${encodeURIComponent(park.address)}` : null },
    { icon: Clock, label: 'Park hours', value: `${formatTime(park.openTime)} – ${formatTime(park.closeTime)}, all days` },
    { icon: Phone, label: 'Call us', value: park.phone || 'Phone number coming soon', href: park.phone ? `tel:${park.phone}` : null },
    { icon: Mail, label: 'Email', value: park.email || 'Email coming soon', href: park.email ? `mailto:${park.email}` : null },
  ];

  return (
    <section id="location" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading align="left" eyebrow="Plan your visit" title="Getting here is half the fun" subtitle="Easy highway access, free parking and friendly staff to welcome you at the gate." />
          <div className="mt-8 space-y-3">
            {items.map(({ icon: Icon, label, value, href }, i) => {
              const content = (
                <>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-aqua-50 text-aqua-600 transition group-hover:bg-aqua-500 group-hover:text-white"><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-navy-400">{label}</span>
                    <span className="block break-words text-[15px] font-medium text-navy-800">{value}</span>
                  </span>
                </>
              );
              return (
                <Reveal key={label} delay={i * 60}>
                  {href ? (
                    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="group flex items-center gap-4 rounded-2xl border border-navy-100 p-4 transition hover:border-aqua-200 hover:shadow-card">{content}</a>
                  ) : (
                    <div className="group flex items-center gap-4 rounded-2xl border border-navy-100 p-4">{content}</div>
                  )}
                </Reveal>
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {park.address && <Button href={`https://maps.google.com/?q=${encodeURIComponent(park.address)}`} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" />Get directions</Button>}
            {park.whatsapp && <Button href={`https://wa.me/${park.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" variant="outline"><MessageCircle className="h-4 w-4" />WhatsApp</Button>}
            <Button to="/contact" variant="secondary">Send a message</Button>
          </div>
        </div>
        <Reveal className="lg:col-span-7"><MapPanel className="shadow-soft" /></Reveal>
      </div>
    </section>
  );
}
