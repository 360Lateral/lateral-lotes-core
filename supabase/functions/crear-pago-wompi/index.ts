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
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY")!;
    const WOMPI_INTEGRITY_KEY = Deno.env.get("WOMPI_INTEGRITY_KEY")!;
    const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") ?? "https://urbanix360.com";

    if (!WOMPI_PUBLIC_KEY || !WOMPI_INTEGRITY_KEY) {
      return new Response(JSON.stringify({ error: "Wompi keys no configuradas" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json();
    const { engagement_id } = body as { engagement_id?: string };
    if (!engagement_id) {
      return new Response(JSON.stringify({ error: "engagement_id requerido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: engagement, error: engErr } = await admin
      .from("engagements_lote")
      .select("id, plan_id, cliente_id, estado, estado_activacion, lote_id")
      .eq("id", engagement_id)
      .single();

    if (engErr || !engagement) {
      return new Response(JSON.stringify({ error: "Engagement no encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (engagement.estado_activacion === "activo") {
      return new Response(JSON.stringify({
        error: "Engagement ya está activo. Si necesitas un nuevo cobro, crea un engagement nuevo.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!engagement.plan_id) {
      return new Response(JSON.stringify({ error: "Engagement sin plan asignado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const rolesList = (roles ?? []).map((r: any) => r.role);
    const esAdmin = rolesList.some((r: string) => ["admin", "super_admin"].includes(r));

    const { data: lote } = await admin
      .from("lotes")
      .select("propietario_id")
      .eq("id", engagement.lote_id)
      .single();

    const esPropietario = lote?.propietario_id === caller.id;
    const esClienteEngagement = engagement.cliente_id === caller.id;

    if (!esAdmin && !esPropietario && !esClienteEngagement) {
      return new Response(JSON.stringify({
        error: "No tienes permiso para generar pago de este engagement",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: planConPrecio, error: planErr } = await admin
      .from("vw_planes_con_precio")
      .select("id, codigo, nombre, precio_cop_actual, precio_smlmv, moneda, smlmv_referencia")
      .eq("id", engagement.plan_id)
      .single();

    if (planErr || !planConPrecio) {
      return new Response(JSON.stringify({ error: "Plan no encontrado o inactivo" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (Number(planConPrecio.precio_cop_actual) === 0) {
      return new Response(JSON.stringify({
        error: "El plan gratuito no requiere pago. Activa el engagement directamente.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      console.log("Reusing pending transaction", pendientes[0].id);
      return new Response(JSON.stringify({
        ok: true,
        reused: true,
        transaccion_id: pendientes[0].id,
        payment_url: pendientes[0].wompi_payment_link_url,
        amount_cop: planConPrecio.precio_cop_actual,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const reference = `eng_${engagement_id.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;
    const amountInCents = Math.round(Number(planConPrecio.precio_cop_actual) * 100);
    const currency = planConPrecio.moneda || "COP";

    const integrityHash = await computarHashIntegridad(
      reference, amountInCents, currency, WOMPI_INTEGRITY_KEY,
    );

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
        engagement_id: engagement_id,
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
      })
      .select("id")
      .single();

    if (transErr) {
      console.error("Error creando transacción:", transErr);
      return new Response(JSON.stringify({ error: "No se pudo crear la transacción: " + transErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (engagement.estado_activacion === "borrador") {
      await admin
        .from("engagements_lote")
        .update({ estado_activacion: "pendiente_pago", updated_at: new Date().toISOString() })
        .eq("id", engagement_id);
    }

    console.log("Pago Wompi generado", { transaccion_id: trans.id, reference });

    return new Response(JSON.stringify({
      ok: true,
      transaccion_id: trans.id,
      payment_url: paymentUrl,
      amount_cop: planConPrecio.precio_cop_actual,
      reference: reference,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    console.error("crear-pago-wompi error:", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
