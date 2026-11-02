import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/customer/AuthShell.jsx';
import Button from '../../components/ui/Button.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { PageLoader } from '../../components/ui/StateViews.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { authService } from '../../services/authService.js';

function readUrlError() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const search = new URLSearchParams(window.location.search);
  const description = hash.get('error_description') || search.get('error_description') || hash.get('error') || search.get('error');
  return description ? description.replace(/\+/g, ' ') : null;
}

// Supabase redirects the email confirmation link here with the new
// session in the URL. supabase-js reads and clears it automatically on
// load — we just wait for that and then move the visitor into the app.
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('working');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlError = readUrlError();
    if (urlError) {
      setStatus('error');
      setMessage(urlError);
      return undefined;
    }

    let active = true;
    const proceed = (session) => {
      if (!active || !session) return;
      authService.syncProfileFromUser(session.user).catch(() => {});
      navigate('/my-bookings', { replace: true });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => proceed(session));

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) { setStatus('error'); setMessage(error.message); return; }
      proceed(data.session);
    });

    const timeout = setTimeout(() => {
      if (active) { setStatus('error'); setMessage('This confirmation link has expired or was already used.'); }
    }, 6000);

    return () => { active = false; sub.subscription.unsubscribe(); clearTimeout(timeout); };
  }, [navigate]);

  if (status === 'working') {
    return (
      <AuthShell title="Confirming your email" subtitle="Hang tight, this only takes a moment.">
        <PageLoader label="Verifying your account…" />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Confirmation link issue" footer={<>Need a new link? <Link to="/register" className="font-semibold text-aqua-600 hover:underline">Create your account again</Link></>}>
      <Notice tone="warn" title="Could not confirm your email">{message || 'This link is invalid or has expired.'}</Notice>
      <Button to="/login" variant="outline" size="lg" className="mt-6 w-full">Go to sign in</Button>
    </AuthShell>
  );
}
