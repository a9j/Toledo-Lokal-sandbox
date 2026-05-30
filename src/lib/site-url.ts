export const getSiteUrl = () => {
     // In the browser, use the actual domain the user is on
     if (typeof window !== 'undefined') {
       return window.location.origin;
     }
     // Server/build fallback — your real domain, never VERCEL_URL
     return 'https://toledolokal.com';
   };
