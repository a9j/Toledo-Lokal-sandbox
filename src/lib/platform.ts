import { Capacitor } from '@capacitor/core';

// True only inside the native iOS/Android Capacitor shell (not web/PWA).
// Used to hide flows that Apple/Google app-store guidelines disallow in the
// native build — e.g. external Stripe checkout (must use IAP) and the PWA
// "Add to Home Screen" prompt (meaningless once the app is installed).
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();
