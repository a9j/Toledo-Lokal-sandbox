// Feature flags. The raw values are injected at build time by vite.config.ts
// (`define`), which reads the NEXT_PUBLIC_* env vars so the names match what is
// configured in Vercel. Vite only exposes VITE_-prefixed vars on
// import.meta.env, so these are shimmed in as global constants instead.
declare const __NEXT_PUBLIC_LP_ENABLED__: string;
declare const __NEXT_PUBLIC_HOME_VARIANT__: string;
declare const __NEXT_PUBLIC_TODAY_TAB_ENABLED__: string;
declare const __BETA_WINDOW_ENABLED__: string;

// Loop Points UI (Loop tab, ∞ Loop badges, wallet routes). Off unless
// explicitly enabled.
export const LP_ENABLED = __NEXT_PUBLIC_LP_ENABLED__ === "true";

// During the soft launch, Pulse and Trucks surfaces are hidden.
export const SOFT_LAUNCH = __NEXT_PUBLIC_HOME_VARIANT__ === "soft_launch";

// The Today tab stays locked (Coming Soon) until this flips to true.
export const TODAY_TAB_ENABLED = __NEXT_PUBLIC_TODAY_TAB_ENABLED__ === "true";

// Circles tab landing mode. Cohort-first (false, today): the only community is
// the Charter 100 cohort, so the Circles tab lands directly on the cohort page
// — never a one-item directory. Directory-later (true): once multiple Circles
// exist, the tab lands on a directory with the user's cohort shown as "your
// cohort." Moving between the two is this one-line config change, not a rebuild.
export const CIRCLES_DIRECTORY_ENABLED = false;

// One-month beta window: when true, only beta-eligible users (Charter 100
// members or Founding 5/25 business owners) reach the app; everyone else sees
// the waitlist. Off by default. Flip via the VITE_BETA_WINDOW_ENABLED env var
// in Vercel and redeploy — there is no DB-backed runtime flag by design.
export const BETA_WINDOW_ENABLED = __BETA_WINDOW_ENABLED__ === "true";
