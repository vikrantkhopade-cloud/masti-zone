import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/format.js';

const VARIANTS = {
  primary: 'bg-aqua-gradient text-white shadow-glow hover:brightness-110 hover:-translate-y-0.5',
  navy: 'bg-navy-900 text-white hover:bg-navy-800 shadow-soft hover:-translate-y-0.5',
  secondary: 'bg-aqua-50 text-aqua-700 hover:bg-aqua-100',
  outline: 'border border-navy-100 bg-white text-navy-800 hover:border-aqua-300 hover:text-aqua-700',
  ghost: 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
  white: 'bg-white text-navy-900 hover:bg-aqua-50 shadow-soft hover:-translate-y-0.5',
  glass: 'glass text-white hover:bg-white/20',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-[52px] px-7 text-base gap-2.5',
  icon: 'h-10 w-10',
};

export default function Button({ as, to, href, variant = 'primary', size = 'md', loading = false, className, children, disabled, ...rest }) {
  const classes = cn(
    'inline-flex select-none items-center justify-center rounded-xl font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-aqua-200 disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant], SIZES[size], className,
  );
  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </>
  );
  if (to) return <Link to={to} className={classes} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={classes} {...rest}>{content}</a>;
  const Comp = as || 'button';
  return <Comp className={classes} disabled={disabled || loading} {...rest}>{content}</Comp>;
}
