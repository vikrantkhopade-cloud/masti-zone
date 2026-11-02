import { Check } from 'lucide-react';
import { cn } from '../../../utils/format.js';

const STEPS = ['Tickets & visitors', 'Review & checkout', 'Confirmation'];

export default function BookingSteps({ current = 0 }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition', done && 'bg-aqua-400 text-navy-950', active && 'bg-white text-navy-950 ring-4 ring-aqua-400/40', !done && !active && 'bg-white/10 text-navy-200 ring-1 ring-white/20')}>
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn('hidden text-sm font-medium sm:block', active ? 'text-white' : 'text-navy-300')}>{label}</span>
            {i < STEPS.length - 1 && <span className={cn('h-px flex-1', done ? 'bg-aqua-400' : 'bg-white/15')} />}
          </li>
        );
      })}
    </ol>
  );
}
