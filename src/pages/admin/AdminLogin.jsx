import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { Logo, Notice } from '../../components/ui/Misc.jsx';
import { IMAGES } from '../../config/images.js';
import { authService } from '../../services/authService.js';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const errors = {
    email: /^\S+@\S+\.\S{2,}$/.test(form.email) ? null : 'Enter your work email',
    password: form.password.length >= 8 ? null : 'Password must be at least 8 characters',
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (errors.email || errors.password) return;
    setLoading(true);
    try {
      const { user } = await authService.signIn({ email: form.email.trim(), password: form.password });
      const profile = await authService.getProfile(user.id);
      if (profile.role !== 'admin' || profile.status !== 'active') {
        await authService.signOut();
        throw new Error('This account is not an authorized admin.');
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-navy-950 px-4 py-10">
      <img src={IMAGES.underwater} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 to-navy-950" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo light /></div>
        <div className="rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
          <span className="eyebrow"><ShieldCheck className="h-3.5 w-3.5" />Staff only</span>
          <h1 className="mt-4 text-2xl font-bold">Admin console sign in</h1>
          <p className="mt-1 text-sm text-navy-500">Manage bookings, pricing and park operations.</p>
          {error && (
            <Notice tone="warn" className="mt-5" title="Sign-in failed">
              {error}
            </Notice>
          )}
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <Input label="Work email" icon={Mail} type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={submitted ? errors.email : undefined} />
            <Input label="Password" icon={Lock} type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={submitted ? errors.password : undefined} />
            <Button type="submit" size="lg" variant="navy" className="w-full" loading={loading}>Sign in</Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-navy-300"><Link to="/" className="hover:text-white">← Back to website</Link></p>
      </div>
    </div>
  );
}
