import { Heart, Instagram } from 'lucide-react';
import { DemoBadge, Reveal, SectionHeading } from '../../ui/Misc.jsx';
import Button from '../../ui/Button.jsx';
import { INSTAGRAM_POSTS } from '../../../data/content.js';
import { useSettings } from '../../../context/SettingsContext.jsx';
import { formatNumber } from '../../../utils/format.js';

export default function InstagramFeed() {
  const { park } = useSettings();
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading align="left" eyebrow={<><Instagram className="h-3.5 w-3.5" />{park.instagramHandle}</>} title="Fresh from the splash zone" subtitle="Tag us in your photos for a chance to be featured." />
          <div className="flex items-center gap-3">
            <DemoBadge label="Preview feed" />
            <Button href={park.instagram} target="_blank" rel="noreferrer" variant="outline"><Instagram className="h-4 w-4" />Follow us</Button>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {INSTAGRAM_POSTS.map((p, i) => (
            <Reveal key={p.id} delay={i * 60} as="a" href={park.instagram} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-2xl bg-navy-100">
              <img src={p.image.replace('w=1200', 'w=500')} alt={p.caption} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-navy-950/85 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                <p className="line-clamp-2 text-xs font-medium text-white">{p.caption}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-aqua-200"><Heart className="h-3.5 w-3.5 fill-current" />{formatNumber(p.likes)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
