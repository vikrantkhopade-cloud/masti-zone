import { CalendarDays, Clock3, Receipt, Ticket, Users } from 'lucide-react';
import { formatDate, formatINR, formatTime } from '../../../utils/format.js';

export default function BillSummary({ plan, draft, bill, taxRate, children }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-navy-100">
      <div className="bg-navy-gradient px-6 py-5 text-white">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-aqua-200"><Receipt className="h-4 w-4" />Your bill</p>
        <p className="mt-2 font-display text-4xl font-extrabold">{formatINR(bill.total)}</p>
        <p className="text-sm text-navy-200">{draft.quantity} {draft.quantity === 1 ? 'ticket' : 'tickets'}{taxRate > 0 ? ` · incl. ${taxRate}% GST` : ''}</p>
      </div>
      <div className="space-y-4 px-6 py-5">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Item icon={CalendarDays} label="Date" value={draft.visitDate ? formatDate(draft.visitDate, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Not selected'} />
          <Item icon={Clock3} label="Entry" value={draft.entryTime ? formatTime(draft.entryTime) : 'Not selected'} />
          <Item icon={Ticket} label="Ticket" value={plan?.label || 'Not selected'} />
          <Item icon={Users} label="Visitors" value={`${bill.counts.adult} adult · ${bill.counts.child} child`} />
        </dl>
        <div className="border-t border-dashed border-navy-100 pt-4">
          {bill.lines.length === 0 ? (
            <p className="text-sm text-navy-400">Select a ticket to see your bill.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {bill.lines.map((l) => (
                <li key={l.label} className="flex justify-between gap-3">
                  <span className={l.pending ? 'text-amber-600' : 'text-navy-600'}>{l.label} × {l.qty} <span className="text-navy-300">@ {formatINR(l.unit)}</span></span>
                  <span className="font-medium text-navy-900">{formatINR(l.amount)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-navy-50 pt-2 text-navy-600"><span>Subtotal</span><span>{formatINR(bill.subtotal)}</span></li>
              {taxRate > 0 && <li className="flex justify-between text-navy-600"><span>GST ({taxRate}%)</span><span>{formatINR(bill.tax)}</span></li>}
              <li className="flex justify-between pt-1 text-base font-bold text-navy-900"><span>Total payable</span><span>{formatINR(bill.total)}</span></li>
            </ul>
          )}
          {bill.counts.unassigned > 0 && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Enter every visitor's age to finalise child/adult pricing.</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function Item({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-navy-50/60 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-400"><Icon className="h-3.5 w-3.5" />{label}</dt>
      <dd className="mt-0.5 truncate font-semibold text-navy-800">{value}</dd>
    </div>
  );
}
