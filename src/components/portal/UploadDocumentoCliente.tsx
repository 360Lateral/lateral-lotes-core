import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { useSubirDocumentoEngagement } from "@/hooks/portal/useSubirDocumentoEngagement";

interface Props {
  engagementId: string;
  requeridoId: string | null;
  label?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

const UploadDocumentoCliente = ({
  engagementId,
  requeridoId,
  label = "Subir",
  size = "sm",
  variant = "outline",
}: Props) => {
  const subir = useSubirDocumentoEngagement();
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    subir.mutate({ engagementId, requeridoId, file });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onChange}
      />
      <Button
        size={size}
        variant={variant}
        onClick={() => inputRef.current?.click()}
        disabled={subir.isPending}
        type="button"
      >
        {subir.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {label}
      </Button>
    </>
  );
};

export default UploadDocumentoCliente;
