import { Building2, CalendarDays, Clock, Globe, Megaphone, Receipt } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminUI.jsx';
import SaveBar from '../../components/admin/SaveBar.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import { Input, Textarea, Toggle } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useSettingsForm } from '../../hooks/useSettingsForm.js';
import { WEEKDAYS } from '../../utils/dates.js';
import { cn } from '../../utils/format.js';

export default function ParkSettings() {
  const { park, savePark } = useSettings();
  const { form, setForm, dirty, saving, status, save, discard } = useSettingsForm(park, savePark);
  const set = (k, numeric = false) => (e) => setForm({ ...form, [k]: numeric ? Number(e.target.value) : e.target.value });
  const toggleDay = (d) => setForm({ ...form, weeklyOff: form.weeklyOff.includes(d) ? form.weeklyOff.filter((x) => x !== d) : [...form.weeklyOff, d] });

  return (
    <>
      <AdminPageHeader demo={false} title="Water Park Settings" subtitle="Park details, timings, booking rules and website announcement." />
      <Notice className="mb-6">Contact defaults come from environment variables (<code>.env.local</code>). Changes saved here are stored on the server and override them across the website.</Notice>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader icon={Building2} title="Park details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Park name" value={form.name} onChange={set('name')} />
            <Input label="Instagram handle" value={form.instagramHandle} onChange={set('instagramHandle')} />
            <Input label="Phone" value={form.phone} onChange={set('phone')} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={set('whatsapp')} />
            <Input className="sm:col-span-2" label="Email" type="email" value={form.email} onChange={set('email')} />
            <Textarea className="sm:col-span-2" label="Address" value={form.address} onChange={set('address')} rows={2} />
          </div>
        </Card>

        <Card>
          <CardHeader icon={Clock} title="Timings" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Opening time" type="time" step={3600} value={form.openTime} onChange={set('openTime')} />
            <Input label="Closing time" type="time" step={3600} value={form.closeTime} onChange={set('closeTime')} />
          </div>
          <p className="mb-2 mt-5 text-sm font-medium text-navy-700">Weekly closed days</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d, i) => (
              <button key={d} type="button" onClick={() => toggleDay(i)} className={cn('h-10 w-12 rounded-xl text-sm font-semibold transition', form.weeklyOff.includes(i) ? 'bg-red-500 text-white' : 'bg-navy-50 text-navy-600 hover:bg-navy-100')}>{d}</button>
            ))}
          </div>
          <p className="mt-2 text-xs text-navy-400">Selected days are blocked for online booking.</p>
        </Card>

        <Card>
          <CardHeader icon={CalendarDays} title="Booking rules" />
          <div className="space-y-5">
            <Toggle checked={form.bookingsOpen} onChange={(v) => setForm({ ...form, bookingsOpen: v })} label="Accept online bookings" description="Turn off to pause bookings on the website." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Max tickets per booking" type="number" min={1} max={50} value={form.maxTicketsPerBooking} onChange={set('maxTicketsPerBooking', true)} />
              <Input label="Advance booking window (days)" type="number" min={1} max={365} value={form.advanceBookingDays} onChange={set('advanceBookingDays', true)} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader icon={Receipt} title="Tax" />
          <Input label="GST rate (%)" type="number" min={0} max={28} value={form.taxRate} onChange={set('taxRate', true)} hint="Applied on top of ticket prices at checkout. Set 0 if prices are tax-inclusive." />
        </Card>

        <Card>
          <CardHeader icon={Megaphone} title="Website announcement" />
          <Input label="Hero banner text" value={form.announcement} onChange={set('announcement')} hint="Leave empty to hide the banner." />
        </Card>

        <Card>
          <CardHeader icon={Globe} title="Social & map links" />
          <div className="grid gap-4">
            <Input label="Instagram URL" value={form.instagram} onChange={set('instagram')} />
            <Input label="Facebook URL" value={form.facebook} onChange={set('facebook')} />
            <Input label="YouTube URL" value={form.youtube} onChange={set('youtube')} />
            <Input label="Google Maps embed URL" value={form.mapEmbedUrl} onChange={set('mapEmbedUrl')} hint="From Google Maps → Share → Embed a map → copy the src link." />
          </div>
        </Card>
      </div>

      <SaveBar dirty={dirty} saving={saving} status={status} onSave={save} onDiscard={discard} />
    </>
  );
}
