import { ReactNode } from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';

// Stable, module-level libraries array. Passing a new array on every render
// makes the loader think the options changed and reload the script.
const LIBRARIES: Libraries = [];

interface MapCanvasProps {
  apiKey: string;
  /** Shown while the Google Maps script is loading. */
  loadingFallback: ReactNode;
  /** Shown if the script fails to load (bad key, API/billing disabled, etc). */
  errorFallback: ReactNode;
  children: ReactNode;
}

/**
 * Loads the Google Maps JS API exactly once for the whole app via
 * useJsApiLoader (a singleton). Using a single loader avoids the
 * "stuck on Loading…" hang you get when multiple <LoadScript> elements try to
 * inject the script more than once, and it surfaces a real error instead of
 * spinning forever. Only mount this once an API key is available.
 */
export function MapCanvas({ apiKey, loadingFallback, errorFallback, children }: MapCanvasProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  if (loadError) return <>{errorFallback}</>;
  if (!isLoaded) return <>{loadingFallback}</>;
  return <>{children}</>;
}
