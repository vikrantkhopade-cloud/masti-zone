import { Accessibility, Car, HeartPulse, Lock, Shirt, ShieldCheck, Sparkles, UtensilsCrossed } from 'lucide-react';
import { SectionHeading, Reveal } from '../../ui/Misc.jsx';
import { FACILITIES } from '../../../data/content.js';
import { IMAGES } from '../../../config/images.js';

const ICONS = { Accessibility, Car, HeartPulse, Lock, Shirt, ShieldCheck, Sparkles, UtensilsCrossed };

export default function Facilities() {
  return (
    <section id="facilities" className="relative scroll-mt-20 overflow-hidden bg-navy-950 py-20 sm:py-28">
      <img src={IMAGES.underwater} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy-950/85 to-navy-950" />
      <div className="container-x relative">
        <SectionHeading light eyebrow="Facilities" title="Everything taken care of, so you just play" subtitle="Thoughtful amenities and strict safety standards — the details that make a great day effortless." />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FACILITIES.map((f, i) => {
            const Icon = ICONS[f.icon];
            return (
              <Reveal key={f.title} delay={i * 50} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-aqua-400/40 hover:bg-white/[0.08]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-aqua-gradient text-white shadow-glow transition group-hover:scale-110"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-300">{f.text}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
