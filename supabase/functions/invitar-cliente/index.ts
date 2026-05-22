import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .in("role", ["super_admin", "admin"]);
    if (!roleCheck || roleCheck.length === 0) {
      return new Response(
        JSON.stringify({ error: "Solo admin/super_admin pueden invitar clientes" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { email, nombre_completo, telefono, engagement_id } = body;
    if (!email || !nombre_completo) {
      return new Response(
        JSON.stringify({ error: "email y nombre_completo son obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const emailNorm = String(email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailNorm)) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (String(nombre_completo).trim().length < 2) {
      return new Response(JSON.stringify({ error: "Nombre demasiado corto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar email único
    const { data: existing } = await adminClient.auth.admin.listUsers();
    const ya = existing?.users?.find(
      (u: { email?: string | null }) => u.email?.toLowerCase() === emailNorm,
    );
    if (ya) {
      return new Response(
        JSON.stringify({ error: "Ya existe un usuario con ese email" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Crear auth user
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: emailNorm,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        nombre_completo,
        invitado_por: caller.id,
        user_type: "inversor",
      },
    });
    if (createErr || !created.user) {
      return new Response(
        JSON.stringify({ error: createErr?.message ?? "No se pudo crear el usuario" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const newUserId = created.user.id;

    // Upsert perfil (handle_new_user trigger puede haber creado fila)
    const { error: perfilErr } = await adminClient
      .from("perfiles")
      .upsert(
        {
          id: newUserId,
          nombre: nombre_completo,
          email: emailNorm,
          telefono: telefono ?? null,
          user_type: "inversor",
          activo: true,
        },
        { onConflict: "id" },
      );
    if (perfilErr) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: "No se pudo crear el perfil: " + perfilErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Asegurar rol inversor (trigger pudo ya insertarlo)
    const { error: rolErr } = await adminClient
      .from("user_roles")
      .upsert(
        { user_id: newUserId, role: "inversor" },
        { onConflict: "user_id,role" },
      );
    if (rolErr) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: "No se pudo asignar el rol: " + rolErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Asignar engagement opcional
    let engagementAsignado: string | null = null;
    if (engagement_id) {
      const { error: engErr } = await adminClient
        .from("engagements_lote")
        .update({ cliente_id: newUserId })
        .eq("id", engagement_id)
        .is("cliente_id", null);
      if (engErr) {
        console.warn("No se pudo asignar engagement:", engErr.message);
      } else {
        engagementAsignado = engagement_id;
      }
    }

    // Generar recovery link
    const origin = req.headers.get("origin") || "https://360lateral.com";
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: emailNorm,
      options: { redirectTo: `${origin}/login?cuenta_nueva=1` },
    });
    if (linkErr || !linkData?.properties?.action_link) {
      return new Response(
        JSON.stringify({
          ok: true,
          warning:
            "Cliente creado pero no se pudo generar link de invitación. Pídele que use 'Olvidé mi contraseña' en /login.",
          user_id: newUserId,
          engagement_asignado: engagementAsignado,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const inviteLink = linkData.properties.action_link;

    // Email
    const BREVO_KEY = Deno.env.get("BREVO_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "notificaciones@360lateral.com";
    const FROM_NAME = Deno.env.get("FROM_NAME") || "360Lateral";
    const MODO_SECO = !BREVO_KEY;

    const subject = "Tu acceso al portal de clientes de 360Lateral está listo";
    const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#1a2744;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:24px;color:#1a2744;">Bienvenido a 360Lateral</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">Hola ${escapeHtml(nombre_completo)},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;">Tu acceso al portal de clientes de 360Lateral está listo. Desde allí podrás seguir en tiempo real el avance de tu diagnóstico y descargar los entregables que tu asesor publique.</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">Para activar tu cuenta y establecer tu contraseña, haz click en el siguiente botón:</p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${inviteLink}" style="display:inline-block;background:#F49D15;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;font-size:15px;">Activar mi cuenta</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#555;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="margin:0 0 24px;font-size:12px;line-height:1.4;word-break:break-all;color:#1a2744;"><a href="${inviteLink}" style="color:#1a2744;">${inviteLink}</a></p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
          <p style="margin:0;font-size:12px;line-height:1.5;color:#777;">Este enlace caduca en 1 hora. Si tienes problemas, responde este email o contacta a tu asesor.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    if (MODO_SECO) {
      console.log(`[MODO SECO] Invitación a ${emailNorm}. Link: ${inviteLink}`);
      return new Response(
        JSON.stringify({
          ok: true,
          modo_seco: true,
          user_id: newUserId,
          invite_link: inviteLink,
          engagement_asignado: engagementAsignado,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const brevoResp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_KEY!,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: emailNorm, name: nombre_completo }],
        subject,
        htmlContent: html,
      }),
    });
    const emailEnviado = brevoResp.ok;
    if (!emailEnviado) {
      const err = await brevoResp.text();
      console.error("Error Brevo:", err);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        user_id: newUserId,
        email_enviado: emailEnviado,
        engagement_asignado: engagementAsignado,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    console.error("invitar-cliente error:", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
