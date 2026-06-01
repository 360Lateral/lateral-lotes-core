// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Verifica la firma SHA256 que Wompi envía con cada webhook.
 */
async function verificarFirmaWompi(payload: any, eventsKey: string): Promise<boolean> {
  try {
    const sigProps: string[] = payload.signature?.properties ?? [];
    const expectedChecksum: string = payload.signature?.checksum;
    const timestamp: number = payload.timestamp;

    if (!sigProps.length || !expectedChecksum || !timestamp) {
      return false;
    }

    const valores: string[] = sigProps.map((path) => {
      const partes = path.split(".");
      let valor: any = payload.data;
      for (const p of partes) {
        valor = valor?.[p];
        if (valor === undefined) return "";
      }
      return String(valor);
    });

    const concatenado = valores.join("") + timestamp + eventsKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(concatenado);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return hashHex === expectedChecksum;
  } catch (e) {
    console.error("Error verificando firma:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const WOMPI_EVENTS_KEY = Deno.env.get("WOMPI_EVENTS_KEY");

    if (!WOMPI_EVENTS_KEY) {
      console.error("WOMPI_EVENTS_KEY no configurada");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const payload = await req.json();
    const eventType = payload.event;
    const eventId = `${payload.event}-${payload.data?.transaction?.id ?? "unknown"}-${payload.timestamp ?? "unknown"}`;

    console.log("Webhook recibido:", eventType, "id_externo:", eventId);

    // Idempotencia
    const { error: insertErr } = await admin.from("eventos_wompi").insert({
      evento_id_externo: eventId,
      tipo_evento: eventType,
      payload,
    });

    if (insertErr) {
      if ((insertErr as any).code === "23505") {
        console.log("Evento ya procesado anteriormente:", eventId);
        return new Response(JSON.stringify({ ok: true, duplicate: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertErr;
    }

    // Firma
    const firmaOk = await verificarFirmaWompi(payload, WOMPI_EVENTS_KEY);
    if (!firmaOk) {
      console.error("Firma inválida para evento:", eventId);
      await admin
        .from("eventos_wompi")
        .update({
          procesado: true,
          procesado_en: new Date().toISOString(),
          error_procesamiento: "Firma inválida",
        })
        .eq("evento_id_externo", eventId);
      return new Response(JSON.stringify({ error: "Firma inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (eventType !== "transaction.updated") {
      await admin
        .from("eventos_wompi")
        .update({
          procesado: true,
          procesado_en: new Date().toISOString(),
          error_procesamiento: "Tipo de evento no procesado",
        })
        .eq("evento_id_externo", eventId);
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transaction = payload.data?.transaction;
    const reference = transaction?.reference;
    const wompiStatus = transaction?.status;
    const wompiTxId = transaction?.id;

    if (!reference || !wompiStatus) {
      throw new Error("Payload Wompi incompleto");
    }

    const { data: transData, error: transErr } = await admin
      .from("transacciones")
      .select("id, estado, engagement_id, propietario_id, tipo_pago")
      .eq("wompi_reference", reference)
      .single();

    if (transErr || !transData) {
      console.error("Transacción no encontrada para reference:", reference);
      await admin
        .from("eventos_wompi")
        .update({
          procesado: true,
          procesado_en: new Date().toISOString(),
          error_procesamiento: "Transacción local no encontrada",
        })
        .eq("evento_id_externo", eventId);
      return new Response(JSON.stringify({ error: "Transacción no encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transaccionLocalId = transData.id;

    if (transData.estado === "aprobada" && wompiStatus === "APPROVED") {
      await admin
        .from("eventos_wompi")
        .update({
          procesado: true,
          procesado_en: new Date().toISOString(),
          transaccion_id: transaccionLocalId,
          error_procesamiento: "Transacción ya aprobada previamente",
        })
        .eq("evento_id_externo", eventId);
      return new Response(JSON.stringify({ ok: true, alreadyApproved: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("transacciones")
      .update({
        wompi_transaction_id: wompiTxId,
        wompi_status: wompiStatus,
        metadata: { last_payload: transaction },
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaccionLocalId);

    if (wompiStatus === "APPROVED") {
      const { error: rpcErr } = await admin.rpc("activar_engagement_post_pago", {
        p_transaccion_id: transaccionLocalId,
      });
      if (rpcErr) throw rpcErr;
    } else if (
      wompiStatus === "DECLINED" ||
      wompiStatus === "VOIDED" ||
      wompiStatus === "ERROR"
    ) {
      const estadoNuevo =
        wompiStatus === "DECLINED"
          ? "declinada"
          : wompiStatus === "VOIDED"
          ? "expirada"
          : "error";
      const { error: rpcErr } = await admin.rpc("marcar_transaccion_fallida", {
        p_transaccion_id: transaccionLocalId,
        p_estado_nuevo: estadoNuevo,
        p_error_msg: `Wompi devolvió status ${wompiStatus}`,
        p_wompi_status: wompiStatus,
      });
      if (rpcErr) throw rpcErr;
    }
    // PENDING: solo registramos sin acción.

    await admin
      .from("eventos_wompi")
      .update({
        procesado: true,
        procesado_en: new Date().toISOString(),
        transaccion_id: transaccionLocalId,
      })
      .eq("evento_id_externo", eventId);

    return new Response(JSON.stringify({ ok: true, processed: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    console.error("wompi-webhook error:", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
