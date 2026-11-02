import { useEffect, useState } from 'react';
import { Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import PageHero from '../../components/customer/PageHero.jsx';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/StateViews.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { authService } from '../../services/authService.js';
import { IMAGES } from '../../config/images.js';

const NOT_SIGNED_IN = 'NOT_SIGNED_IN';

async function loadProfile() {
  const session = await authService.getSession();
  if (!session || session.user.is_anonymous) {
    const err = new Error('Sign in to view your profile.');
    err.code = NOT_SIGNED_IN;
    throw err;
  }
  return authService.getProfile(session.user.id);
}

const toForm = (p) => ({ full_name: p?.full_name || '', phone: p?.phone || '' });

export default function Profile() {
  const { data: profile, loading, error, reload, setData } = useAsync(loadProfile, []);
  const [form, setForm] = useState(toForm());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => { if (profile) setForm(toForm(profile)); }, [profile]);

  const errors = {
    full_name: form.full_name.trim().length >= 2 ? null : 'Enter your full name',
    phone: /^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10)) ? null : 'Enter a valid 10-digit mobile number',
  };
  const dirty = !!profile && (form.full_name !== (profile.full_name || '') || form.phone !== (profile.phone || ''));

  const onSave = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setStatus(null);
    if (errors.full_name || errors.phone) return;
    setSaving(true);
    try {
      const updated = await authService.updateProfile(profile.id, {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
      });
      setData(updated);
      setStatus({ type: 'success', message: 'Your profile has been updated.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Could not update your profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => { setForm(toForm(profile)); setStatus(null); setSubmitted(false); };

  return (
    <>
      <PageHero eyebrow="My Profile" title="Your account details" subtitle="Keep your name and mobile number up to date." image={IMAGES.cabana} />
      <div className="container-x pb-24 pt-6">
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <Card><Skeleton className="h-6 w-40" /><Skeleton className="mt-6 h-11 w-full" /><Skeleton className="mt-4 h-11 w-full" /><Skeleton className="mt-4 h-11 w-full" /></Card>
          ) : error?.code === NOT_SIGNED_IN ? (
            <EmptyState icon={UserRound} title="Sign in to view your profile" description="Create an account or sign in to see and update your contact details." action={<div className="flex gap-2"><Button to="/login">Sign in</Button><Button to="/register" variant="outline">Create account</Button></div>} />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : (
            <Card>
              <CardHeader icon={UserRound} title="Profile details" subtitle="Visible only to you and park staff." />

              {status?.type === 'success' && <Notice tone="info" className="mb-5">{status.message}</Notice>}
              {status?.type === 'error' && <Notice tone="warn" className="mb-5">{status.message}</Notice>}

              <form onSubmit={onSave} noValidate className="space-y-4">
                <Input
                  label="Full name" required icon={UserRound} autoComplete="name"
                  value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  error={submitted ? errors.full_name : undefined}
                />
                <Input
                  label="Email address" icon={Mail} value={profile.email || ''} disabled readOnly
                  hint="Changing your registered email isn't available yet — contact us if you need it updated."
                />
                <Input
                  label="Mobile number" required type="tel" inputMode="tel" icon={Phone} autoComplete="tel"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  error={submitted ? errors.phone : undefined} hint="OTP verification will be added soon."
                />

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button type="submit" loading={saving} disabled={!dirty}>Save changes</Button>
                  <Button type="button" variant="ghost" disabled={!dirty || saving} onClick={discard}>Discard</Button>
                </div>
              </form>
            </Card>
          )}

          {!loading && !error && (
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-navy-400">
              <ShieldCheck className="h-4 w-4 text-aqua-500" />Only you can view or edit these details.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
