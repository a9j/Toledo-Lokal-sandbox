// src/lib/city.ts
// Single source of truth for city context used by public marketing copy.
// The platform is single-city today; keeping the name here avoids scattering
// hardcoded city names through components and makes a future swap one edit.

export const CITY = {
  name: 'Toledo',
  // How residents refer to the wider area in copy ("the metro").
  metro: 'the Toledo metro',
} as const;

export type City = typeof CITY;
