import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FotoLote } from "@/components/lotes/FotoLote";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Foto {
  id: string;
  url: string;
  orden: number;
}

export const GaleriaFotosLote = ({ loteId, fallbackUrl }: { loteId: string; fallbackUrl?: string | null }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data: fotos } = useQuery({
    queryKey: ["fotos-lote", loteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fotos_lotes" as any)
        .select("id, url, orden")
        .eq("lote_id", loteId)
        .order("orden", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Foto[];
    },
  });

  const lista: Foto[] =
    fotos && fotos.length > 0
      ? fotos
      : fallbackUrl
      ? [{ id: "fallback", url: fallbackUrl, orden: 0 }]
      : [];

  if (lista.length === 0) return null;

  const [principal, ...resto] = lista;
  const thumbs = resto.slice(0, 4);

  return (
    <Card className="p-3 space-y-2 overflow-hidden">
      <button
        type="button"
        onClick={() => setLightboxUrl(principal.url)}
        className="block w-full"
      >
        <FotoLote
          url={principal.url}
          alt="Foto principal del lote"
          className="w-full h-72 object-cover rounded-md"
          fallbackClassName="w-full h-72 rounded-md"
        />
      </button>
      {thumbs.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {thumbs.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setLightboxUrl(f.url)}
              className="block"
            >
              <FotoLote
                url={f.url}
                alt={`Foto ${f.orden}`}
                className="w-full h-20 object-cover rounded-md hover:opacity-90 transition"
                fallbackClassName="w-full h-20 rounded-md"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!lightboxUrl} onOpenChange={(o) => !o && setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          {lightboxUrl && (
            <FotoLote
              url={lightboxUrl}
              alt="Foto ampliada"
              className="w-full max-h-[80vh] object-contain rounded-md"
              fallbackClassName="w-full h-96 rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GaleriaFotosLote;
