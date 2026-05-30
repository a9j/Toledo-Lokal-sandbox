// Resolve the site URL for auth redirects.
   // Browser: use the actual origin the user is on.
   // Build/server fallback: real domain, never VERCEL_URL.
   export const siteUrl =
     typeof window !== 'undefined'
       ? window.location.origin
       : 'https://toledolokal.com';
