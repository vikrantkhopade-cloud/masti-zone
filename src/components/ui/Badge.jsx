import { cn } from '../../utils/format.js';

const TONES = {
  aqua: 'bg-aqua-50 text-aqua-700 ring-aqua-100',
  navy: 'bg-navy-50 text-navy-700 ring-navy-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
};

export default function Badge({ tone = 'aqua', className, children, dot = false }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const STATUS = {
  confirmed: ['green', 'Confirmed'],
  pending: ['amber', 'Pending'],
  cancelled: ['red', 'Cancelled'],
  abandoned: ['gray', 'Abandoned'],
};
const PAYMENT = {
  paid: ['green', 'Paid'],
  pending: ['amber', 'Pending'],
  failed: ['red', 'Failed'],
  refunded: ['violet', 'Refunded'],
  refund_pending: ['amber', 'Refund pending'],
  not_initiated: ['gray', 'Not initiated'],
  not_charged: ['gray', 'Not charged'],
};

export function StatusBadge({ status }) {
  const [tone, label] = STATUS[status] || ['gray', status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

export function PaymentBadge({ status }) {
  const [tone, label] = PAYMENT[status] || ['gray', status];
  return <Badge tone={tone}>{label}</Badge>;
}
