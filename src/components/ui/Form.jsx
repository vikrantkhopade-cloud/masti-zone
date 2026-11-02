import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/format.js';

export function Field({ label, error, hint, required, children, className, htmlFor }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-navy-700">
          {label} {required && <span className="text-coral-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" />{error}</p>
      ) : hint ? (
        <p className="text-xs text-navy-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, required, className, icon: Icon, ...rest }, ref) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id} className={className}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />}
        <input id={id} ref={ref} aria-invalid={!!error} className={cn('input-base', Icon && 'pl-10', error && 'border-red-300 focus:border-red-400 focus:ring-red-100')} {...rest} />
      </div>
    </Field>
  );
});

export function Select({ label, error, hint, required, className, options = [], placeholder, ...rest }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id} className={className}>
      <select id={id} aria-invalid={!!error} className={cn('input-base appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%237c9fcf%27 stroke-width=%272%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-[right_0.8rem_center] bg-no-repeat pr-9', error && 'border-red-300')} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export function Textarea({ label, error, hint, required, className, ...rest }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id} className={className}>
      <textarea id={id} aria-invalid={!!error} className={cn('input-base min-h-[120px] resize-y', error && 'border-red-300')} {...rest} />
    </Field>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-navy-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-navy-400">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-aqua-500' : 'bg-navy-100')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </label>
  );
}
