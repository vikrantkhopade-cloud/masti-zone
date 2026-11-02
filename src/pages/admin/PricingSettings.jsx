import { Clock, RotateCcw, Star } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminUI.jsx';
import SaveBar from '../../components/admin/SaveBar.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, Toggle } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useSettingsForm } from '../../hooks/useSettingsForm.js';
import { DEFAULT_TICKET_PLANS } from '../../data/defaults.js';
import { cn, formatINR } from '../../utils/format.js';

export default function PricingSettings() {
  const { plans, savePlans, park } = useSettings();
  const { form, setForm, dirty, saving, status, save, discard } = useSettingsForm(plans, savePlans);
  const edit = (id, patch) => setForm(form.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const setPopular = (id) => setForm(form.map((p) => ({ ...p, popular: p.id === id })));

  return (
    <>
      <AdminPageHeader demo={false} title="Ticket Pricing" subtitle="Set the per-person price for each ticket duration." actions={<Button variant="outline" size="sm" onClick={() => setForm(DEFAULT_TICKET_PLANS)}><RotateCcw className="h-4 w-4" />Restore initial prices</Button>} />
      <Notice className="mb-6">Prices are stored on the server and used immediately by the customer website for new bookings.</Notice>

      <div className="grid gap-5 lg:grid-cols-2">
        {form.map((p) => (
          <Card key={p.id} className={cn('transition', !p.active && 'opacity-60')}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-aqua-50 text-aqua-600"><Clock className="h-5 w-5" /></span>
                <div>
                  <p className="font-semibold text-navy-900">{p.label || 'Untitled plan'}</p>
                  <p className="text-sm text-navy-400">Customer pays {formatINR(p.price)}{park.taxRate ? ` + ${park.taxRate}% GST` : ''}</p>
                </div>
              </div>
              <Toggle checked={p.active} onChange={(v) => edit(p.id, { active: v })} label="" />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Input label="Display name" value={p.label} onChange={(e) => edit(p.id, { label: e.target.value })} error={!p.label.trim() ? 'Required' : undefined} />
              <Input label="Duration (hours)" type="number" min={1} max={12} value={p.hours} onChange={(e) => edit(p.id, { hours: Number(e.target.value) })} />
              <Input label="Price per person (₹)" type="number" min={1} value={p.price} onChange={(e) => edit(p.id, { price: e.target.value === '' ? '' : Number(e.target.value) })} error={!(Number(p.price) > 0) ? 'Must be > 0' : undefined} />
              <Input className="sm:col-span-3" label="Short description" value={p.description} onChange={(e) => edit(p.id, { description: e.target.value })} />
            </div>
            <button onClick={() => setPopular(p.id)} className={cn('mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition', p.popular ? 'bg-amber-50 text-amber-700' : 'text-navy-400 hover:bg-navy-50')}>
              <Star className={cn('h-3.5 w-3.5', p.popular && 'fill-amber-400 text-amber-400')} />{p.popular ? 'Highlighted as “Most popular”' : 'Mark as most popular'}
            </button>
          </Card>
        ))}
      </div>

      <SaveBar dirty={dirty} saving={saving} status={status} onSave={save} onDiscard={discard} />
    </>
  );
}
