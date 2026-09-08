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

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});