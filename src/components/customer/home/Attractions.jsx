import { useState } from 'react';
import { ArrowUpRight, Zap } from 'lucide-react';
import { SectionHeading, Reveal } from '../../ui/Misc.jsx';
import { ATTRACTIONS } from '../../../data/content.js';
import { cn } from '../../../utils/format.js';

const FILTERS = ['All', 'Thrill', 'Family', 'Relax', 'Kids'];

export default function Attractions() {
  const [filter, setFilter] = useState('All');
  const items = filter === 'All' ? ATTRACTIONS : ATTRACTIONS.filter((a) => a.category === filter);

  return (
    <section id="attractions" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading align="left" eyebrow="Attractions" title="Something for every kind of splash" subtitle="From heart-racing rides to lazy floats under the palms — explore the zones that make MASTI ZONE special." />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn('rounded-full px-4 py-2 text-sm font-semibold transition', filter === f ? 'bg-navy-900 text-white shadow-soft' : 'bg-navy-50 text-navy-600 hover:bg-navy-100')}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a, i) => (
            <Reveal key={a.id} delay={i * 70} as="article" className="group relative h-[420px] overflow-hidden rounded-3xl bg-navy-900 shadow-soft">
              <img src={a.image} alt={a.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent" />
              <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy-900 backdrop-blur">{a.category}</span>
                <span className="flex items-center gap-0.5 rounded-full bg-navy-950/50 px-2.5 py-1 backdrop-blur" title={`Thrill level ${a.thrill}/3`}>
                  {[1, 2, 3].map((n) => <Zap key={n} className={cn('h-3.5 w-3.5', n <= a.thrill ? 'fill-amber-300 text-amber-300' : 'text-white/30')} />)}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="text-2xl font-bold text-white">{a.name}</h3>
                <p className="mt-2 max-h-0 overflow-hidden text-sm leading-relaxed text-navy-100 opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100 max-lg:max-h-24 max-lg:opacity-100">{a.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-aqua-300">Included with every ticket <ArrowUpRight className="h-4 w-4" /></span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
