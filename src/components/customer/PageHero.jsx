import { IMAGES } from '../../config/images.js';

/** Compact banner used at the top of inner customer pages. */
export default function PageHero({ eyebrow, title, subtitle, image = IMAGES.heroAlt, children }) {
  return (
    <section className="relative overflow-hidden bg-navy-950 pb-16 pt-32 sm:pb-20 sm:pt-36">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/60 to-navy-950" />
      <div className="container-x relative">
        {eyebrow && <span className="eyebrow bg-white/10 text-aqua-200 ring-white/15">{eyebrow}</span>}
        <h1 className="mt-4 max-w-3xl text-3xl font-bold text-white sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base text-navy-200 sm:text-lg">{subtitle}</p>}
        {children}
      </div>
      <Wave className="absolute -bottom-px left-0 right-0 text-white" />
    </section>
  );
}

export function Wave({ className, fill = 'currentColor' }) {
  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block h-8 w-full sm:h-12"><path fill={fill} d="M0 40c120 18 240 18 360 0S600 4 720 22s240 34 360 16 240-36 360-18v40H0z" /></svg>
    </div>
  );
}
