// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function computarHashIntegridad(
  reference: string,
  amountInCents: number,
  currency: string,
  integrityKey: string,
): Promise<string> {
  const concatenado = `${reference}${amountInCents}${currency}${integrityKey}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(concatenado);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function shortId(uuid: string) {
  return uuid.replace(/-/g, "").slice(0, 12);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY")!;
    const WOMPI_INTEGRITY_KEY = Deno.env.get("WOMPI_INTEGRITY_KEY")!;
    const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") ?? "https://urbanix360.com";

    if (!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_KEY) {
      return jsonResp({ error: "Wompi keys no configuradas" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResp({ error: "No autorizado" }, 401);

    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) return jsonResp({ error: "No autorizado" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const tipo: "diagnostico" | "suscripcion" | "pay_per_view" =
      body.tipo ?? (body.engagement_id ? "diagnostico" : null);

    if (!tipo || !["diagnostico", "suscripcion", "pay_per_view"].includes(tipo)) {
      return jsonResp({ error: "tipo inválido" }, 400);
    }

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const rolesList = (roles ?? []).map((r: any) => r.role);
    const esAdmin = rolesList.some((r: string) => ["admin", "super_admin"].includes(r));
    const esDesarrollador = rolesList.includes("desarrollador");

    // ============================================================
    // CASO DIAGNOSTICO (flujo original)
    // ============================================================
    if (tipo === "diagnostico") {
      const engagement_id: string | undefined = body.engagement_id;
      if (!engagement_id) return jsonResp({ error: "engagement_id requerido" }, 400);

      const { data: engagement, error: engErr } = await admin
        .from("engagements_lote")
        .select("id, plan_id, cliente_id, estado, estado_activacion, lote_id")
        .eq("id", engagement_id)
        .single();
      if (engErr || !engagement) return jsonResp({ error: "Engagement no encontrado" }, 404);
      if (engagement.estado_activacion === "activo") {
        return jsonResp({ error: "Engagement ya está activo. Si necesitas un nuevo cobro, crea un engagement nuevo." }, 400);
      }
      if (!engagement.plan_id) return jsonResp({ error: "Engagement sin plan asignado" }, 400);

      const { data: lote } = await admin
        .from("lotes")
        .select("propietario_id")
        .eq("id", engagement.lote_id)
        .single();

      const esPropietario = lote?.propietario_id === caller.id;
      const esClienteEngagement = engagement.cliente_id === caller.id;
      if (!esAdmin && !esPropietario && !esClienteEngagement) {
        return jsonResp({ error: "No tienes permiso para generar pago de este engagement" }, 403);
      }

      const { data: planConPrecio, error: planErr } = await admin
        .from("vw_planes_con_precio")
        .select("id, codigo, nombre, precio_cop_actual, precio_smlmv, moneda, smlmv_referencia")
        .eq("id", engagement.plan_id)
        .single();
      if (planErr || !planConPrecio) return jsonResp({ error: "Plan no encontrado o inactivo" }, 404);
      if (Number(planConPrecio.precio_cop_actual) === 0) {
        return jsonResp({ error: "El plan gratuito no requiere pago. Activa el engagement directamente." }, 400);
      }

      const propietarioId = lote?.propietario_id ?? engagement.cliente_id ?? null;

      const { data: pendientes } = await admin
        .from("transacciones")
        .select("id, wompi_payment_link_url, estado, fecha_creacion")
        .eq("engagement_id", engagement_id)
        .eq("estado", "pendiente")
        .order("fecha_creacion", { ascending: false })
        .limit(1);

      if (pendientes && pendientes.length > 0) {
        return jsonResp({
          ok: true,
          reused: true,
          transaccion_id: pendientes[0].id,
          payment_url: pendientes[0].wompi_payment_link_url,
          amount_cop: planConPrecio.precio_cop_actual,
        });
      }

      const reference = `eng_${shortId(engagement_id)}_${Date.now()}`;
      const amountInCents = Math.round(Number(planConPrecio.precio_cop_actual) * 100);
      const currency = planConPrecio.moneda || "COP";
      const integrityHash = await computarHashIntegridad(reference, amountInCents, currency, WOMPI_INTEGRITY_KEY);
      const redirectUrl = `${PUBLIC_APP_URL}/portal/pago-completado?ref=${reference}`;
      const checkoutParams = new URLSearchParams({
        "public-key": WOMPI_PUBLIC_KEY,
        "currency": currency,
        "amount-in-cents": String(amountInCents),
        "reference": reference,
        "signature:integrity": integrityHash,
        "redirect-url": redirectUrl,
      });
      const paymentUrl = `https://checkout.wompi.co/p/?${checkoutParams.toString()}`;

      const { data: trans, error: transErr } = await admin
        .from("transacciones")
        .insert({
          engagement_id,
          plan_id: planConPrecio.id,
          propietario_id: propietarioId,
          creada_por: caller.id,
          monto_cop: planConPrecio.precio_cop_actual,
          monto_smlmv: planConPrecio.precio_smlmv,
          smlmv_referencia: planConPrecio.smlmv_referencia,
          moneda: currency,
          wompi_reference: reference,
          wompi_payment_link_url: paymentUrl,
          estado: "pendiente",
          tipo_pago: "diagnostico",
        })
        .select("id")
        .single();
      if (transErr) return jsonResp({ error: "No se pudo crear la transacción: " + transErr.message }, 500);

      if (engagement.estado_activacion === "borrador") {
        await admin
          .from("engagements_lote")
          .update({ estado_activacion: "pendiente_pago", updated_at: new Date().toISOString() })
          .eq("id", engagement_id);
      }

      return jsonResp({
        ok: true,
        transaccion_id: trans.id,
        payment_url: paymentUrl,
        amount_cop: planConPrecio.precio_cop_actual,
        reference,
      });
    }

    // ============================================================
    // CASO SUSCRIPCION
    // ============================================================
    if (tipo === "suscripcion") {
      if (!esDesarrollador) return jsonResp({ error: "Solo desarrolladores pueden comprar suscripciones" }, 403);
      const nivel: string | undefined = body.nivel;
      const periodo_meses: number | undefined = body.periodo_meses;
      if (!nivel || !["basico", "profesional", "premium"].includes(nivel)) {
        return jsonResp({ error: "nivel inválido" }, 400);
      }
      if (!periodo_meses || ![1, 3, 12].includes(Number(periodo_meses))) {
        return jsonResp({ error: "periodo_meses inválido" }, 400);
      }

      const { data: precio, error: precioErr } = await admin
        .from("precios_suscripcion")
        .select("id, precio_cop")
        .eq("nivel", nivel)
        .eq("periodo_meses", periodo_meses)
        .eq("activo", true)
        .maybeSingle();
      if (precioErr || !precio) return jsonResp({ error: "Precio no disponible para ese plan/período" }, 404);

      const { data: susc, error: suscErr } = await admin
        .from("suscripciones_desarrollador")
        .insert({
          desarrollador_id: caller.id,
          nivel,
          periodo_meses,
          precio_cop: precio.precio_cop,
          estado: "pendiente_pago",
        })
        .select("id")
        .single();
      if (suscErr || !susc) return jsonResp({ error: "No se pudo crear suscripción: " + (suscErr?.message ?? "") }, 500);

      const reference = `sub_${shortId(susc.id)}_${Date.now()}`;
      const amountInCents = Math.round(Number(precio.precio_cop) * 100);
      const currency = "COP";
      const integrityHash = await computarHashIntegridad(reference, amountInCents, currency, WOMPI_INTEGRITY_KEY);
      const redirectUrl = `${PUBLIC_APP_URL}/portal/pago-completado?ref=${reference}`;
      const checkoutParams = new URLSearchParams({
        "public-key": WOMPI_PUBLIC_KEY,
        "currency": currency,
        "amount-in-cents": String(amountInCents),
        "reference": reference,
        "signature:integrity": integrityHash,
        "redirect-url": redirectUrl,
      });
      const paymentUrl = `https://checkout.wompi.co/p/?${checkoutParams.toString()}`;

      const { data: trans, error: transErr } = await admin
        .from("transacciones")
        .insert({
          creada_por: caller.id,
          monto_cop: precio.precio_cop,
          moneda: currency,
          wompi_reference: reference,
          wompi_payment_link_url: paymentUrl,
          estado: "pendiente",
          tipo_pago: "suscripcion",
          suscripcion_id: susc.id,
        })
        .select("id")
        .single();
      if (transErr) return jsonResp({ error: "No se pudo crear la transacción: " + transErr.message }, 500);

      return jsonResp({
        ok: true,
        transaccion_id: trans.id,
        suscripcion_id: susc.id,
        payment_url: paymentUrl,
        amount_cop: precio.precio_cop,
        reference,
      });
    }

    // ============================================================
    // CASO PAY-PER-VIEW
    // ============================================================
    if (tipo === "pay_per_view") {
      if (!esDesarrollador) return jsonResp({ error: "Solo desarrolladores pueden comprar acceso a lotes" }, 403);
      const lote_id: string | undefined = body.lote_id;
      if (!lote_id) return jsonResp({ error: "lote_id requerido" }, 400);

      const { data: cfg } = await admin
        .from("config_payperview")
        .select("precio_cop, dias_acceso, activo")
        .eq("id", 1)
        .maybeSingle();
      if (!cfg || !cfg.activo) return jsonResp({ error: "Pay-per-view no está habilitado" }, 400);

      const { data: lote } = await admin
        .from("lotes")
        .select("id, estado_publicacion")
        .eq("id", lote_id)
        .maybeSingle();
      if (!lote) return jsonResp({ error: "Lote no encontrado" }, 404);
      if (lote.estado_publicacion !== "aprobado") {
        return jsonResp({ error: "El lote no está publicado" }, 400);
      }

      const { data: existente } = await admin
        .from("accesos_lote")
        .select("id, fecha_expiracion")
        .eq("desarrollador_id", caller.id)
        .eq("lote_id", lote_id)
        .eq("estado", "activa")
        .gt("fecha_expiracion", new Date().toISOString())
        .limit(1);
      if (existente && existente.length > 0) {
        return jsonResp({ error: "Ya tienes acceso vigente a este lote" }, 400);
      }

      const { data: acc, error: accErr } = await admin
        .from("accesos_lote")
        .insert({
          desarrollador_id: caller.id,
          lote_id,
          precio_cop: cfg.precio_cop,
          estado: "pendiente_pago",
        })
        .select("id")
        .single();
      if (accErr || !acc) return jsonResp({ error: "No se pudo crear acceso: " + (accErr?.message ?? "") }, 500);

      const reference = `ppv_${shortId(acc.id)}_${Date.now()}`;
      const amountInCents = Math.round(Number(cfg.precio_cop) * 100);
      const currency = "COP";
      const integrityHash = await computarHashIntegridad(reference, amountInCents, currency, WOMPI_INTEGRITY_KEY);
      const redirectUrl = `${PUBLIC_APP_URL}/portal/pago-completado?ref=${reference}`;
      const checkoutParams = new URLSearchParams({
        "public-key": WOMPI_PUBLIC_KEY,
        "currency": currency,
        "amount-in-cents": String(amountInCents),
        "reference": reference,
        "signature:integrity": integrityHash,
        "redirect-url": redirectUrl,
      });
      const paymentUrl = `https://checkout.wompi.co/p/?${checkoutParams.toString()}`;

      const { data: trans, error: transErr } = await admin
        .from("transacciones")
        .insert({
          creada_por: caller.id,
          monto_cop: cfg.precio_cop,
          moneda: currency,
          wompi_reference: reference,
          wompi_payment_link_url: paymentUrl,
          estado: "pendiente",
          tipo_pago: "pay_per_view",
          acceso_lote_id: acc.id,
        })
        .select("id")
        .single();
      if (transErr) return jsonResp({ error: "No se pudo crear la transacción: " + transErr.message }, 500);

      return jsonResp({
        ok: true,
        transaccion_id: trans.id,
        acceso_lote_id: acc.id,
        payment_url: paymentUrl,
        amount_cop: cfg.precio_cop,
        reference,
      });
    }

    return jsonResp({ error: "tipo no soportado" }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    console.error("crear-pago-wompi error:", e);
    return jsonResp({ error: msg }, 500);
  }
});
