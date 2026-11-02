import { Quote } from 'lucide-react';
import { DemoBadge, Reveal, SectionHeading, Stars } from '../../ui/Misc.jsx';
import { REVIEWS } from '../../../data/content.js';

export default function Reviews() {
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
  return (
    <section id="reviews" className="scroll-mt-20 bg-gradient-to-b from-white to-aqua-50/60 py-20 sm:py-28">
      <div className="container-x">
        <SectionHeading eyebrow="Guest reviews" title="Smiles you can hear from the slides" />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-navy-500">
          <Stars value={5} /> <span className="font-semibold text-navy-900">{avg} average</span> from sample reviews <DemoBadge label="Sample reviews" />
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {REVIEWS.map((r, i) => (
            <Reveal key={r.id} delay={i * 80} as="figure" className="relative flex flex-col rounded-3xl bg-white p-6 shadow-card ring-1 ring-navy-100/70 transition hover:-translate-y-1 hover:shadow-soft">
              <Quote className="absolute right-5 top-5 h-8 w-8 text-aqua-100" />
              <Stars value={r.rating} />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-navy-700">“{r.text}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-navy-50 pt-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-aqua-gradient text-sm font-bold text-white">{r.name.charAt(0)}</span>
                <span>
                  <span className="block text-sm font-semibold text-navy-900">{r.name}</span>
                  <span className="block text-xs text-navy-400">{r.location} · {r.date}</span>
                </span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
