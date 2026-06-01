// src/lib/site-url.ts
// Resolves the base URL for auth redirects and SEO/canonical tags.
// Always use the canonical production domain so auth emails, OAuth callbacks,
// and SEO tags never point to a Vercel preview URL or stale deploy.

const PRODUCTION_DOMAIN = 'https://toledolokal.com';

const baseUrl = PRODUCTION_DOMAIN;

export function siteUrl(path?: string): string {
  if (!path) return baseUrl;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

// Alias for files that import it as SITE_URL (e.g. SEOHead.tsx).
export const SITE_URL = baseUrl;

// Alias for any file that imports a getter function.
export const getSiteUrl = () => baseUrl;
