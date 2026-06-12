import { useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignedFotoUrl } from "@/hooks/useSignedFotoUrl";

interface FotoLoteProps {
  /** URL pública existente o path del objeto en el bucket fotos-lotes */
  url: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "lazy" | "eager";
}

export const FotoLote = ({
  url,
  alt,
  className,
  fallbackClassName,
  loading = "lazy",
}: FotoLoteProps) => {
  const { data: signedUrl, isLoading } = useSignedFotoUrl(url);
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName ?? className,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin opacity-60" />
      </div>
    );
  }

  if (!signedUrl || imgError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName ?? className,
        )}
      >
        <ImageOff className="h-6 w-6 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setImgError(true)}
    />
  );
};

export default FotoLote;
