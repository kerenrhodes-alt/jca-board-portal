import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Shared Supabase project with the Employee Task Manager. The Board
// Portal uses a unique localStorage key so the two apps don't share
// or overwrite each other's sessions on the same browser.
const STORAGE_KEY = 'jca-board-auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Add both to .env.local at the project root.',
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    // Critical for the Google OAuth callback: Supabase reads the
    // session out of the URL hash on first load and signs the user
    // in automatically. Default is true; set explicitly for clarity.
    detectSessionInUrl: true,
    // PKCE works for both magic link and OAuth and is the safer
    // default for browser apps.
    flowType: 'pkce',
  },
});
