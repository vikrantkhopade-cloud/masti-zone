// Supabase client — uses only the public URL + anon/publishable key.
// Never import a service_role key here; that key must stay server-side only.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.startsWith('REPLACE_WITH')) {
  // eslint-disable-next-line no-console
  console.warn('Supabase is not configured yet — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(
  supabaseUrl && !supabaseUrl.startsWith('REPLACE_WITH') ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey && !supabaseAnonKey.startsWith('REPLACE_WITH') ? supabaseAnonKey : 'placeholder-anon-key',
);
