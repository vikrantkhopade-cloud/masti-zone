import { useEffect } from 'react';
import { FlaskConical, Info, X } from 'lucide-react';
import { cn } from '../../utils/format.js';
import { useReveal } from '../../hooks/useReveal.js';

export function Logo({ light = false, compact = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden>
        <defs><linearGradient id="lg-mz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#22cbe6" /><stop offset="1" stopColor="#0a8bab" /></linearGradient></defs>
        <rect width="64" height="64" rx="16" fill={light ? '#ffffff' : '#0a1a3a'} />
        <path d="M10 42c6 0 6-5 11-5s5 5 11 5 6-5 11-5 5 5 11 5" stroke="url(#lg-mz)" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M14 31 22 15l10 14 10-14 8 16" stroke={light ? '#0a1a3a' : '#fff'} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className={cn('block font-display text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-navy-900')}>MASTI<span className="text-aqua-400">ZONE</span></span>
          <span className={cn('block text-[10px] font-semibold uppercase tracking-[0.28em]', light ? 'text-aqua-200' : 'text-navy-400')}>Water Park</span>
        </span>
      )}
    </span>
  );
}

export function DemoBadge({ className, label = 'Demo data' }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200', className)}>
      <FlaskConical className="h-3.5 w-3.5" />{label}
    </span>
  );
}

export function Notice({ tone = 'info', title, children, className }) {
  const tones = {
    info: 'bg-aqua-50 text-aqua-800 ring-aqua-100',
    warn: 'bg-amber-50 text-amber-800 ring-amber-200',
  };
  return (
    <div className={cn('flex gap-3 rounded-xl px-4 py-3 text-sm ring-1', tones[tone], className)}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{title && <p className="font-semibold">{title}</p>}<div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div></div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', light = false }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={cn('reveal max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <span className={cn('eyebrow', light && 'bg-white/10 text-aqua-200 ring-white/15')}>{eyebrow}</span>}
      <h2 className={cn('mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-[44px]', light ? 'text-white' : 'text-navy-900')}>{title}</h2>
      {subtitle && <p className={cn('mt-4 text-base leading-relaxed sm:text-lg', light ? 'text-navy-200' : 'text-navy-500')}>{subtitle}</p>}
    </div>
  );
}

export function Reveal({ as: Comp = 'div', className, delay = 0, children, ...rest }) {
  const ref = useReveal();
  return <Comp ref={ref} className={cn('reveal', className)} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</Comp>;
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full animate-fade-up rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl', size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between border-b border-navy-50 px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-navy-50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Stars({ value = 5, className }) {
  return (
    <span className={cn('inline-flex gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={cn('h-4 w-4', i < value ? 'fill-amber-400' : 'fill-navy-100')}><path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" /></svg>
      ))}
    </span>
  );
}
