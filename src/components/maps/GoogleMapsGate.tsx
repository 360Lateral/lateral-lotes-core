import { ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";

const GOOGLE_MAPS_LOADER_ID = "google-map-script";
const GOOGLE_MAPS_LIBRARIES: ("maps")[] = ["maps"];

interface GoogleMapsGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface GoogleMapsScriptLoaderProps {
  apiKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

const GoogleMapsScriptLoader = ({ apiKey, children, fallback = null }: GoogleMapsScriptLoaderProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  if (loadError || !isLoaded) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

const GoogleMapsGate = ({ children, fallback = null }: GoogleMapsGateProps) => {
  const { data: mapsKey, isLoading } = useGoogleMapsKey();

  if (isLoading || !mapsKey) {
    return <>{fallback}</>;
  }

  return (
    <GoogleMapsScriptLoader apiKey={mapsKey} fallback={fallback}>
      {children}
    </GoogleMapsScriptLoader>
  );
};

export default GoogleMapsGate;
