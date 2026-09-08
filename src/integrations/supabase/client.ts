import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Build-time constants injected by vite.config.ts. They resolve to whichever
// env var name is actually set — VITE_SUPABASE_URL (this codebase's original
// convention) or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (what
// the Supabase ↔ Vercel integration sets). See vite.config.ts.
declare const __SUPABASE_URL__: string;
declare const __SUPABASE_KEY__: string;

// Exported so pages that show the project URL to people (the API docs) use
// the same value the client connects to, never a hardcoded one.
export const SUPABASE_URL = __SUPABASE_URL__;
const SUPABASE_PUBLISHABLE_KEY = __SUPABASE_KEY__;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// True only when the build actually had the settings. vite.config.ts falls
// back to an empty string when neither VITE_* nor NEXT_PUBLIC_* is set, which
// is what happens on a host that has no environment variables configured.
export const isSupabaseConfigured =
  typeof SUPABASE_URL === 'string' && SUPABASE_URL.length > 0 &&
  typeof SUPABASE_PUBLISHABLE_KEY === 'string' && SUPABASE_PUBLISHABLE_KEY.length > 0;

// createClient throws on an empty url. That throw happens while this module is
// still being imported, so it takes the whole app down before React renders:
// the page stays blank, the DOM stays empty, and the console error names a
// library rather than the missing setting. A placeholder keeps the import
// harmless, and App refuses to render anything real while
// isSupabaseConfigured is false, so nothing ever calls through this client.
export const supabase = createClient<Database>(
  isSupabaseConfigured ? SUPABASE_URL : 'https://not-configured.invalid',
  isSupabaseConfigured ? SUPABASE_PUBLISHABLE_KEY : 'not-configured',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  },
);