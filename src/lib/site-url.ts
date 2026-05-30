// src/lib/site-url.ts
// Resolves the base URL used for Supabase auth redirects (emailRedirectTo, etc.)
// Browser: use the real origin the user is on (toledolokal.com in prod, localhost in dev).
// Build/SSR fallback: hardcoded production domain — never Vercel's VERCEL_URL,
// which resolves to the protected *.vercel.app deployment URL and triggers the login wall.

export const siteUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://toledolokal.com';
