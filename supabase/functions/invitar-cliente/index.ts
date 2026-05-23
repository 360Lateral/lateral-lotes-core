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

    // Validar rol del caller
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

    // Validar body
    const body = await req.json();
    const { email, nombre_completo, telefono, engagement_id } = body as {
      email?: string;
      nombre_completo?: string;
      telefono?: string;
      engagement_id?: string;
    };
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

    const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL");
    const origin = PUBLIC_APP_URL || req.headers.get("origin") || "https://urbanix360.com";
    const redirectTo = `${origin}/login?cuenta_nueva=1`;

    // Verificar si el email ya existe
    const { data: existing } = await adminClient.auth.admin.listUsers();
    const ya = existing?.users?.find(
      (u: { email?: string | null }) => u.email?.toLowerCase() === emailNorm,
    );

    let newUserId: string;
    let emailEnviado = false;
    let warning: string | undefined;

    if (ya) {
      // Usuario ya existe: validar que solo tenga rol inversor
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", ya.id);
      const rolesList = (roles ?? []).map((r) => r.role);
      const soloInversor =
        rolesList.length === 0 || rolesList.every((r) => r === "inversor");
      if (!soloInversor) {
        return new Response(
          JSON.stringify({
            ok: false,
            conflicto_usuario_existente: true,
            roles: rolesList,
            warning:
              "Ese email ya pertenece a un usuario interno. Usa otro email para crear el cliente o ajusta sus roles desde gestión de usuarios.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      newUserId = ya.id;

      // Re-invitación: generar recovery link dispara el envío del email vía Cloud Emails.
      // El link NO se devuelve al cliente: se entrega únicamente por email para evitar exposición de tokens.
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: emailNorm,
        options: { redirectTo },
      });
      if (linkErr || !linkData?.properties?.action_link) {
        warning =
          "Cliente ya existía, pero no se pudo regenerar el link. Pídele que use 'Olvidé mi contraseña' en /login.";
      } else {
        emailEnviado = true;
      }
    } else {
      // Usuario nuevo: inviteUserByEmail crea el auth user Y dispara la plantilla "Invite" vía Cloud Emails.
      const { data: inviteData, error: inviteErr } = await adminClient.auth.admin
        .inviteUserByEmail(emailNorm, {
          data: {
            nombre_completo,
            telefono: telefono ?? null,
            invitado_por: caller.id,
            user_type: "inversor",
          },
          redirectTo,
        });

      if (inviteErr || !inviteData?.user) {
        return new Response(
          JSON.stringify({ error: inviteErr?.message ?? "No se pudo invitar al usuario" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      newUserId = inviteData.user.id;
      emailEnviado = true;

      // Upsert perfil (trigger handle_new_user puede haber creado fila)
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

      // Asegurar rol inversor
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
    }

    // Asignar engagement opcional (idempotente; aplica a usuario nuevo y reinvitado)
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

    return new Response(
      JSON.stringify({
        ok: true,
        user_id: newUserId,
        email_enviado: emailEnviado,
        engagement_asignado: engagementAsignado,
        reinvitado: Boolean(ya),
        ...(actionLink ? { action_link: actionLink } : {}),
        ...(warning ? { warning } : {}),
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
