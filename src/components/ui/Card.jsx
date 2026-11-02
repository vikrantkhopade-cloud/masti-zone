import { cn } from '../../utils/format.js';

export default function Card({ className, children, padded = true, ...rest }) {
  return (
    <div className={cn('rounded-2xl border border-navy-100/70 bg-white shadow-card', padded && 'p-5 sm:p-6', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-aqua-50 text-aqua-600"><Icon className="h-[18px] w-[18px]" /></span>
        )}
        <div>
          <h3 className="text-base font-semibold text-navy-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-navy-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
