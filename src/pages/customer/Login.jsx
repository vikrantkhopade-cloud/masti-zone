import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import AuthShell from '../../components/customer/AuthShell.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { authService } from '../../services/authService.js';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    authService.getSession()
      .then((s) => setIsGuest(!!s && s.user?.is_anonymous === true))
      .catch(() => setIsGuest(false));
  }, []);

  const errors = {
    email: /^\S+@\S+\.\S{2,}$/.test(form.email) ? null : 'Enter a valid email address',
    password: form.password.length >= 6 ? null : 'Password must be at least 6 characters',
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (errors.email || errors.password) return;
    setLoading(true);
    try {
      await authService.signIn({ email: form.email.trim(), password: form.password });
      navigate('/my-bookings');
    } catch (err) {
      setError(err.message || 'Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your bookings." footer={<>New to MASTI ZONE? <Link to="/register" className="font-semibold text-aqua-600 hover:underline">Create an account</Link></>}>
      {error && <Notice tone="warn" title="Sign-in failed" className="mb-6">{error}</Notice>}
      {notice && <Notice tone="warn" title="Coming soon" className="mb-6">{notice}</Notice>}
      {isGuest && !notice && !error && (
        <Notice className="mb-6">Signing in to an existing account here won't carry over bookings made as a guest in this browser. To keep them, <Link to="/register" className="font-semibold text-aqua-600 hover:underline">create your account</Link> instead.</Notice>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Input label="Email" icon={Mail} type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={submitted ? errors.email : undefined} placeholder="you@example.com" />
        <div className="relative">
          <Input label="Password" icon={Lock} type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={submitted ? errors.password : undefined} placeholder="••••••••" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-[34px] p-1 text-navy-300 hover:text-navy-600" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-navy-600"><input type="checkbox" className="rounded border-navy-200 text-aqua-500" />Remember me</label>
          <button type="button" onClick={() => setNotice('Password reset emails are not set up yet. Please contact us if you are locked out.')} className="font-semibold text-aqua-600 hover:underline">Forgot password?</button>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
        <div className="relative py-2 text-center text-xs text-navy-300"><span className="relative z-10 bg-white px-3">or</span><span className="absolute inset-x-0 top-1/2 h-px bg-navy-100" /></div>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setNotice('Mobile OTP sign-in will be enabled once SMS verification is set up. Please sign in with your email and password for now.')}>Sign in with mobile OTP</Button>
        <Button to="/book" variant="ghost" className="w-full">Continue as guest</Button>
      </form>
    </AuthShell>
  );
}
