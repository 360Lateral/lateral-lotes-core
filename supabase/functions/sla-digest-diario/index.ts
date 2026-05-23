import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DigestItem {
  engagement_id: string;
  lote_nombre: string;
  plan_nombre: string;
  dias_vencido?: number;
  dias_restantes?: number;
  fecha_sla: string;
}

interface Digest {
  usuario_nombre: string;
  usuario_email: string;
  fecha: string;
  rojos: DigestItem[];
  amarillos: DigestItem[];
  total_rojos: number;
  total_amarillos: number;
}

function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generarHtmlDigest(d: Digest): string {
  const dashboard = "https://urbanix360.com/dashboard";
  const preferencias = "https://urbanix360.com/dashboard/preferencias";
  const itemRow = (color: string, label: string, it: DigestItem) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #E5E7EB;">
        <div style="font-weight:600;color:#111827;font-size:14px;">${it.lote_nombre}</div>
        <div style="font-size:12px;color:#6B7280;">Plan: ${it.plan_nombre}</div>
      </td>
      <td style="padding:10px;border-bottom:1px solid #E5E7EB;text-align:right;">
        <span style="background:${color};color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;">${label}</span>
      </td>
    </tr>`;

  const seccion = (titulo: string, color: string, items: DigestItem[], labelFn: (i: DigestItem) => string) =>
    items.length === 0 ? "" : `
      <h2 style="font-size:16px;color:${color};margin:24px 0 8px;">${titulo} (${items.length})</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fff;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
        ${items.map(i => itemRow(color, labelFn(i), i)).join("")}
      </table>`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr><td style="background:#1a2744;padding:20px 24px;">
          <div style="color:#fff;font-size:18px;font-weight:700;">360Lateral · Resumen diario de SLA</div>
          <div style="color:#cbd5e1;font-size:12px;margin-top:4px;">${d.fecha}</div>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 16px;font-size:14px;">Hola ${d.usuario_nombre},</p>
          <p style="margin:0 0 16px;font-size:14px;">Tienes <strong style="color:#DC2626;">${d.total_rojos}</strong> engagements vencidos y <strong style="color:#F59E0B;">${d.total_amarillos}</strong> próximos a vencer.</p>
          ${seccion("Vencidos", "#DC2626", d.rojos, i => `${i.dias_vencido}d vencido`)}
          ${seccion("Próximos a vencer", "#F59E0B", d.amarillos, i => `${i.dias_restantes}d restantes`)}
          <div style="margin-top:24px;text-align:center;">
            <a href="${dashboard}" style="background:#E8951A;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;display:inline-block;">Ir al dashboard</a>
          </div>
        </td></tr>
        <tr><td style="background:#F3F4F6;padding:16px 24px;font-size:11px;color:#6B7280;text-align:center;">
          Recibes este correo porque tienes notificaciones de SLA habilitadas.<br>
          <a href="${preferencias}" style="color:#6B7280;">Desactívalas aquí</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req) => {
  try {
    const auth = req.headers.get("Authorization");
    const expected = `Bearer ${Deno.env.get("CRON_SECRET")}`;
    if (!Deno.env.get("CRON_SECRET") || auth !== expected) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Disparar detección
    const { error: detErr } = await supabase.rpc("detectar_sla_en_riesgo");
    if (detErr) console.error("detectar_sla_en_riesgo error:", detErr);

    // 2. Usuarios con preferencia activa
    const { data: usuarios, error: usrErr } = await supabase
      .from("preferencias_usuario")
      .select("user_id")
      .eq("email_sla_digest", true);
    if (usrErr) throw usrErr;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "notificaciones@360lateral.com";
    const FROM_NAME = Deno.env.get("FROM_NAME") ?? "360Lateral";
    const MODO_SECO = !LOVABLE_API_KEY || !BREVO_API_KEY;
    const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

    const resultados: Array<Record<string, unknown>> = [];

    for (const u of usuarios ?? []) {
      try {
        const { data: digest, error: digErr } = await supabase.rpc("obtener_digest_sla", {
          p_user_id: u.user_id,
        });
        if (digErr) {
          resultados.push({ user_id: u.user_id, status: "error", error: digErr.message });
          continue;
        }
        if (!digest) continue;

        const d = digest as Digest;
        const html = generarHtmlDigest(d);

        if (MODO_SECO) {
          console.log(`[MODO SECO] -> ${d.usuario_email} (R:${d.total_rojos} A:${d.total_amarillos})`);
          resultados.push({ user_id: u.user_id, status: "logged", email: d.usuario_email });
          continue;
        }

        const resp = await fetch(`${GATEWAY_URL}/smtp/email`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": BREVO_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: FROM_NAME, email: FROM_EMAIL },
            to: [{ email: d.usuario_email, name: d.usuario_nombre }],
            subject: `[360Lateral] ${d.total_rojos} vencidos / ${d.total_amarillos} próximos a vencer`,
            htmlContent: html,
          }),
        });
        const body = await resp.text();
        resultados.push({
          user_id: u.user_id,
          status: resp.ok ? "sent" : "error",
          http: resp.status,
          ...(resp.ok ? {} : { error: body.slice(0, 300) }),
        });
      } catch (e) {
        resultados.push({ user_id: u.user_id, status: "error", error: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, modo: MODO_SECO ? "seco" : "envio", procesados: resultados.length, resultados }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
