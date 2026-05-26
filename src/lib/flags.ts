// Feature flags. The raw values are injected at build time by vite.config.ts
// (`define`), which reads the NEXT_PUBLIC_* env vars so the names match what is
// configured in Vercel. Vite only exposes VITE_-prefixed vars on
// import.meta.env, so these are shimmed in as global constants instead.
declare const __NEXT_PUBLIC_LP_ENABLED__: string;
declare const __NEXT_PUBLIC_HOME_VARIANT__: string;
declare const __NEXT_PUBLIC_TODAY_TAB_ENABLED__: string;

// Loop Points UI (Loop tab, ∞ Loop badges, wallet routes). Off unless
// explicitly enabled.
export const LP_ENABLED = __NEXT_PUBLIC_LP_ENABLED__ === "true";

// During the soft launch, Pulse and Trucks surfaces are hidden.
export const SOFT_LAUNCH = __NEXT_PUBLIC_HOME_VARIANT__ === "soft_launch";

// The Today tab stays locked (Coming Soon) until this flips to true.
export const TODAY_TAB_ENABLED = __NEXT_PUBLIC_TODAY_TAB_ENABLED__ === "true";
