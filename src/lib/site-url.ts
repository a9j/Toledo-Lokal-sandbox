// Canonical, public-facing URL for ToledoLokal.
//
// Auth confirmation / password-reset links MUST point here rather than at
// `window.location.origin`. Signups frequently happen on a raw Vercel
// deployment URL (e.g. *.vercel.app) that sits behind Vercel Deployment
// Protection — using that origin sends users to the "Log in to Vercel" wall
// when they click the email link. Always redirect to the real domain instead.
//
// Override per-environment with VITE_SITE_URL (e.g. a preview domain) if needed.
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://toledolokal.com'
).replace(/\/$/, '');

/** Build an absolute URL on the canonical site for the given path. */
export function siteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
