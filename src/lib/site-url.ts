// src/lib/site-url.ts
// Resolves the base URL for auth redirects and SEO/canonical tags.
// Browser: real origin the user is on. Build/SSR fallback: production domain —
// never VERCEL_URL (it resolves to the protected *.vercel.app URL).

const baseUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://toledolokal.com';

export function siteUrl(path?: string): string {
  if (!path) return baseUrl;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

// Alias for files that import it as SITE_URL (e.g. SEOHead.tsx).
export const SITE_URL = baseUrl;

// Alias for any file that imports a getter function.
export const getSiteUrl = () => baseUrl;
