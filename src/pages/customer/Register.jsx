import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone, UserRound } from 'lucide-react';
import AuthShell from '../../components/customer/AuthShell.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { authService } from '../../services/authService.js';
import { validateContact } from '../../utils/bookingRules.js';
import { cn } from '../../utils/format.js';

function passwordStrength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', terms: false });
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useEffect(() => {
    authService.getSession()
      .then((s) => setIsGuest(!!s && s.user?.is_anonymous === true))
      .catch(() => setIsGuest(false));
  }, []);

  const base = validateContact(form);
  const strength = passwordStrength(form.password);
  const errors = {
    ...base,
    password: form.password.length < 8 ? 'Use at least 8 characters' : strength < 2 ? 'Add numbers, symbols or mixed case' : null,
    confirm: form.confirm && form.confirm === form.password ? null : 'Passwords do not match',
    terms: form.terms ? null : 'Please accept the terms',
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (hasErrors) {
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"], [data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    setLoading(true);
    try {
      const result = await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      if (!result.needsConfirmation) {
        navigate('/my-bookings');
      } else if (result.linkedGuest) {
        setNotice('Almost there! We emailed you a confirmation link — click it to finish linking your existing guest bookings to this account.');
      } else {
        setNotice('Account created! Check your email for a confirmation link, then sign in.');
      }
    } catch (err) {
      setError(err.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const err = (k) => (submitted ? errors[k] || undefined : undefined);

  return (
    <AuthShell title="Create your account" subtitle="Join MASTI ZONE for faster bookings and member offers." footer={<>Already have an account? <Link to="/login" className="font-semibold text-aqua-600 hover:underline">Sign in</Link></>}>
      {error && <Notice tone="warn" title="Registration failed" className="mb-6">{error}</Notice>}
      {notice && <Notice tone="info" title="Almost there" className="mb-6">{notice}</Notice>}
      {isGuest && !notice && !error && (
        <Notice tone="info" title="Keep your guest bookings" className="mb-6">You have a guest session in this browser. Creating your account here will keep any bookings you've already made linked to it.</Notice>
      )}
      {submitted && hasErrors && !error && (
        <Notice tone="warn" title="Please fix the highlighted fields" className="mb-6">Each problem is explained under the field below.</Notice>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input label="Full name" icon={UserRound} autoComplete="name" value={form.name} onChange={set('name')} error={err('name')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" icon={Mail} autoComplete="email" value={form.email} onChange={set('email')} error={err('email')} />
          <Input label="Mobile" type="tel" icon={Phone} autoComplete="tel" value={form.phone} onChange={set('phone')} error={err('phone')} />
        </div>
        <div>
          <Input label="Password" type="password" icon={Lock} autoComplete="new-password" value={form.password} onChange={set('password')} error={err('password')} />
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => <span key={i} className={cn('h-1.5 flex-1 rounded-full transition', i < strength ? (strength < 2 ? 'bg-red-400' : strength < 4 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-navy-100')} />)}
          </div>
        </div>
        <Input label="Confirm password" type="password" icon={Lock} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={err('confirm')} />
        <label className="flex items-start gap-2.5 text-sm text-navy-600" data-error={!!err('terms')}>
          <input type="checkbox" checked={form.terms} onChange={set('terms')} className="mt-0.5 rounded border-navy-200 text-aqua-500" />
          <span>I agree to the terms of service and privacy policy.{err('terms') && <span className="block text-xs font-medium text-red-600">{errors.terms}</span>}</span>
        </label>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Create account</Button>
      </form>
    </AuthShell>
  );
}
