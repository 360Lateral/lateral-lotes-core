// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}


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

    return timingSafeEqual(hashHex, expectedChecksum);
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

    // 1) Validar firma ANTES de persistir (evita inflar eventos_wompi con basura)
    const firmaOk = await verificarFirmaWompi(payload, WOMPI_EVENTS_KEY);
    if (!firmaOk) {
      console.warn("Firma inválida para evento (no se persiste):", eventId);
      return new Response(JSON.stringify({ error: "Firma inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Idempotencia: insertar solo si firma válida
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
      const tipoPago = (transData as any).tipo_pago ?? "diagnostico";
      const rpcName =
        tipoPago === "suscripcion"
          ? "activar_suscripcion_post_pago"
          : tipoPago === "pay_per_view"
          ? "activar_acceso_lote_post_pago"
          : "activar_engagement_post_pago";
      const { error: rpcErr } = await admin.rpc(rpcName, {
        p_transaccion_id: transaccionLocalId,
      });
      if (rpcErr) {
        // Persistir el error para visibilidad en el panel admin
        await admin
          .from("transacciones")
          .update({ error_msg: rpcErr.message })
          .eq("id", transaccionLocalId);
        throw rpcErr;
      }

      // Enviar email de activación (best-effort; no rompe el webhook si falla)
      try {
        await enviarEmailActivacion(admin, transaccionLocalId, tipoPago);
      } catch (emailErr) {
        console.error("Email activación falló (no bloquea):", emailErr);
      }
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

/**
 * Envía el email de activación correspondiente al tipo de pago.
 * Best-effort: si falla, se loguea pero NO rompe el webhook.
 * Idempotencia: el send-transactional-email no deduplica por sí mismo, pero el
 * webhook ya garantiza que esta ruta no se ejecuta dos veces para el mismo evento
 * (eventos_wompi.evento_id_externo UNIQUE) y la RPC de activación es idempotente
 * (short-circuit si ya está activa), así que el email solo se envía cuando la
 * activación realmente ocurre por primera vez.
 */
async function enviarEmailActivacion(
  admin: any,
  transaccionId: string,
  tipoPago: string,
) {
  const fmtFecha = (s: string | null | undefined) =>
    s
      ? new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })
      : "";

  if (tipoPago === "diagnostico") {
    const { data } = await admin
      .from("transacciones")
      .select(`
        id,
        engagement:engagements_lote(
          id,
          lote:lotes(id, nombre_lote, propietario_id),
          plan:planes_diagnostico(nombre, dias_sla)
        ),
        propietario:perfiles!transacciones_propietario_id_fkey(nombre, email)
      `)
      .eq("id", transaccionId)
      .single();

    const email = data?.propietario?.email;
    if (!email) return;

    const planId = data?.engagement?.plan?.id ?? data?.engagement?.plan_id;
    let analisis: string[] = [];
    if (data?.engagement?.plan) {
      const { data: paList } = await admin
        .from("planes_analisis")
        .select("tipo_analisis:tipos_analisis(nombre)")
        .eq("plan_id", planId ?? "")
        .eq("incluido", true);
      analisis = (paList ?? [])
        .map((r: any) => r?.tipo_analisis?.nombre)
        .filter(Boolean);
    }

    await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "engagement-activado",
        recipientEmail: email,
        idempotencyKey: `engagement-activado-${transaccionId}`,
        templateData: {
          nombrePropietario: data?.propietario?.nombre ?? "Cliente",
          nombreLote: data?.engagement?.lote?.nombre_lote ?? "tu lote",
          nombrePlan: data?.engagement?.plan?.nombre ?? "",
          slaDias: data?.engagement?.plan?.dias_sla ?? 7,
          analisisIncluidos: analisis,
          loteUrl: `https://urbanix360.com/lotes/${data?.engagement?.lote?.id ?? ""}`,
        },
      },
    });
    return;
  }

  if (tipoPago === "suscripcion") {
    const { data } = await admin
      .from("transacciones")
      .select(`
        id,
        suscripcion:suscripciones_desarrollador(nivel, periodo_meses, fecha_fin, desarrollador_id)
      `)
      .eq("id", transaccionId)
      .single();

    const desId = data?.suscripcion?.desarrollador_id;
    if (!desId) return;

    const { data: perfil } = await admin
      .from("perfiles")
      .select("nombre, email")
      .eq("id", desId)
      .single();
    if (!perfil?.email) return;

    await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "suscripcion-activada",
        recipientEmail: perfil.email,
        idempotencyKey: `suscripcion-activada-${transaccionId}`,
        templateData: {
          nombreDesarrollador: perfil.nombre ?? "Desarrollador",
          nivel: data?.suscripcion?.nivel ?? "",
          periodoMeses: data?.suscripcion?.periodo_meses ?? 1,
          fechaVencimiento: fmtFecha(data?.suscripcion?.fecha_fin),
          marketplaceUrl: "https://urbanix360.com/lotes",
        },
      },
    });
    return;
  }

  if (tipoPago === "pay_per_view") {
    const { data } = await admin
      .from("transacciones")
      .select(`
        id,
        acceso:accesos_lote(
          desarrollador_id, lote_id, fecha_expiracion,
          lote:lotes(id, nombre_lote)
        )
      `)
      .eq("id", transaccionId)
      .single();

    const desId = data?.acceso?.desarrollador_id;
    if (!desId) return;

    const { data: perfil } = await admin
      .from("perfiles")
      .select("nombre, email")
      .eq("id", desId)
      .single();
    if (!perfil?.email) return;

    const expira = data?.acceso?.fecha_expiracion
      ? new Date(data.acceso.fecha_expiracion)
      : null;
    const dias = expira
      ? Math.max(1, Math.round((expira.getTime() - Date.now()) / 86400000))
      : 30;

    await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "acceso-lote-activado",
        recipientEmail: perfil.email,
        idempotencyKey: `acceso-lote-${transaccionId}`,
        templateData: {
          nombreDesarrollador: perfil.nombre ?? "Desarrollador",
          nombreLote: data?.acceso?.lote?.nombre_lote ?? "el lote",
          diasAcceso: dias,
          fechaExpiracion: fmtFecha(data?.acceso?.fecha_expiracion),
          loteUrl: `https://urbanix360.com/lotes/${data?.acceso?.lote?.id ?? ""}`,
        },
      },
    });
  }
}
