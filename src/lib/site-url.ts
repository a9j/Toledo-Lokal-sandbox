// src/lib/site-url.ts
// Resolves the base URL for auth redirects and SEO/canonical tags.
// Browser: real origin the user is on. Build/SSR fallback: production domain —
// never VERCEL_URL (it resolves to the protected *.vercel.app URL).

export const siteUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://toledolokal.com';

// Alias for files that import it as SITE_URL (e.g. SEOHead.tsx).
export const SITE_URL = siteUrl;

// Alias for any file that imports a getter function.
export const getSiteUrl = () => siteUrl;
