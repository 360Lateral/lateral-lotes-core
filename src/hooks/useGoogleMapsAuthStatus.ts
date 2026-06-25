import { useEffect, useState } from "react";

/**
 * Detects Google Maps auth failures (e.g. RefererNotAllowedMapError) that occur
 * AFTER the script loads. Google calls window.gm_authFailure when the API key
 * is rejected. We expose a boolean so consumers can render a friendly fallback
 * instead of Google's full-bleed "Oops!" overlay.
 */
let authFailed = false;
const listeners = new Set<(v: boolean) => void>();

if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gm_authFailure = () => {
    authFailed = true;
    listeners.forEach((l) => l(true));
  };
}

export const useGoogleMapsAuthStatus = () => {
  const [failed, setFailed] = useState(authFailed);
  useEffect(() => {
    listeners.add(setFailed);
    return () => {
      listeners.delete(setFailed);
    };
  }, []);
  return failed;
};
