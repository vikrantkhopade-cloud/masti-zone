import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';
import { cn } from '../../utils/format.js';

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-aqua-500', className)} aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-navy-400">
        <div className="relative h-12 w-12">
          <span className="absolute inset-0 animate-ping rounded-full bg-aqua-200" />
          <span className="relative grid h-12 w-12 place-items-center rounded-full bg-aqua-gradient text-white"><Loader2 className="h-5 w-5 animate-spin" /></span>
        </div>
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-100 bg-navy-50/40 px-6 py-14 text-center', className)}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-aqua-500 shadow-card"><Icon className="h-6 w-6" /></span>
      <h3 className="mt-4 text-base font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-navy-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong', className }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center', className)}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-red-500 shadow-card"><AlertTriangle className="h-5 w-5" /></span>
      <h3 className="mt-4 font-semibold text-navy-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-navy-500">{error?.message || 'Please try again in a moment.'}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}><RefreshCw className="h-4 w-4" />Try again</Button>}
    </div>
  );
}

/** Convenience wrapper: renders loading / error / empty / content. */
export function AsyncView({ loading, error, onRetry, isEmpty, empty, skeleton, children }) {
  if (loading) return skeleton || <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return empty || <EmptyState />;
  return children;
}
