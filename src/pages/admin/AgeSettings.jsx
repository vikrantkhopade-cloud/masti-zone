import { Baby, UserRound } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminUI.jsx';
import SaveBar from '../../components/admin/SaveBar.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useSettingsForm } from '../../hooks/useSettingsForm.js';
import { unitPriceFor } from '../../utils/pricing.js';
import { formatINR } from '../../utils/format.js';

export default function AgeSettings() {
  const { age, saveAge, plans } = useSettings();
  const { form, setForm, dirty, saving, status, save, discard } = useSettingsForm(age, saveAge);
  const num = (k) => (e) => setForm({ ...form, [k]: e.target.value === '' ? '' : Number(e.target.value) });
  const n = (v) => Number(v) || 0;
  const valid = n(form.childMaxAge) > n(form.minAge) && n(form.maxAge) > n(form.childMaxAge);

  return (
    <>
      <AdminPageHeader demo={false} title="Age Categories" subtitle="Define who is a child and who is an adult, plus optional category discounts." />

      {/* Visual age scale */}
      <Card className="mb-6">
        <p className="text-sm font-semibold text-navy-500">Age scale preview</p>
        <div className="mt-4 flex h-12 overflow-hidden rounded-xl text-xs font-semibold">
          <div className="grid place-items-center bg-navy-100 text-navy-500" style={{ flex: Math.max(n(form.minAge), 0.5) }}>Free</div>
          <div className="grid place-items-center bg-violet-500 text-white" style={{ flex: Math.max(n(form.childMaxAge) - n(form.minAge) + 1, 1) }}>Child {form.minAge}–{form.childMaxAge}</div>
          <div className="grid place-items-center bg-aqua-500 text-white" style={{ flex: Math.max(n(form.maxAge) - n(form.childMaxAge), 1) / 3 }}>Adult {n(form.childMaxAge) + 1}–{form.maxAge}</div>
        </div>
        {!valid && <p className="mt-3 text-sm font-medium text-red-600">Child upper age must be above minimum age, and maximum age must be above child upper age.</p>}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader icon={Baby} title="Child" subtitle="Applies to visitors in this age range" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Minimum age to book" type="number" min={0} value={form.minAge} onChange={num('minAge')} hint="Younger visitors enter free with an adult" />
            <Input label="Child up to age" type="number" min={1} value={form.childMaxAge} onChange={num('childMaxAge')} />
            <Input label="Child discount (%)" type="number" min={0} max={100} value={form.childDiscountPct} onChange={num('childDiscountPct')} hint="0 = same price as adult" />
          </div>
        </Card>
        <Card>
          <CardHeader icon={UserRound} title="Adult" subtitle={`Ages ${n(form.childMaxAge) + 1} and above`} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Maximum age allowed" type="number" min={1} value={form.maxAge} onChange={num('maxAge')} />
            <Input label="Adult discount (%)" type="number" min={0} max={100} value={form.adultDiscountPct} onChange={num('adultDiscountPct')} />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <p className="mb-4 font-semibold">Resulting prices per person</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-navy-400"><tr><th className="pb-2">Ticket</th><th className="pb-2 text-right">Child</th><th className="pb-2 text-right">Adult</th></tr></thead>
            <tbody className="divide-y divide-navy-50">
              {plans.filter((p) => p.active).map((p) => (
                <tr key={p.id}><td className="py-2.5 font-medium">{p.label}</td><td className="py-2.5 text-right">{formatINR(unitPriceFor(p, 'child', { ...form, childDiscountPct: n(form.childDiscountPct) }))}</td><td className="py-2.5 text-right">{formatINR(unitPriceFor(p, 'adult', { ...form, adultDiscountPct: n(form.adultDiscountPct) }))}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Notice className="mt-6">Every visitor's age is captured during booking, so changing these limits also updates child/adult splits in analytics.</Notice>
      <SaveBar dirty={dirty} saving={saving} status={status} onSave={save} onDiscard={discard} />
    </>
  );
}
