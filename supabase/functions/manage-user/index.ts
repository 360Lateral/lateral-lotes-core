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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is admin
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .in("role", ["super_admin", "admin"]);

    if (!roleCheck || roleCheck.length === 0) {
      return new Response(JSON.stringify({ error: "Acceso denegado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerIsSuperAdmin = roleCheck.some((r: any) => r.role === "super_admin");

    const body = await req.json();
    const { action, user_id } = body;

    if (!user_id || !action) {
      return new Response(JSON.stringify({ error: "Faltan parámetros" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: update_user_type
    if (action === "update_user_type") {
      const { user_type } = body;
      const { error } = await adminClient
        .from("perfiles")
        .update({ user_type })
        .eq("id", user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: add_owner_association
    if (action === "add_owner") {
      const { owner_id } = body;
      const { error } = await adminClient
        .from("usuario_owner")
        .insert({ user_id, owner_id });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: remove_owner_association
    if (action === "remove_owner") {
      const { owner_id } = body;
      const { error } = await adminClient
        .from("usuario_owner")
        .delete()
        .eq("user_id", user_id)
        .eq("owner_id", owner_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: toggle_activo (activar / desactivar cuenta)
    if (action === "toggle_activo") {
      const activo = body.activo === true;
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "No puedes desactivar tu propia cuenta" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient
        .from("perfiles")
        .update({ activo })
        .eq("id", user_id);
      if (error) throw error;

      if (!activo) {
        // Cierra sesiones activas para que el bloqueo sea inmediato
        try {
          await adminClient.auth.admin.signOut(user_id, "global");
        } catch (_) {
          // no bloquear si falla
        }
      }

      return new Response(JSON.stringify({ ok: true, activo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: preview_delete (conteo de dependencias antes de borrar)
    if (action === "preview_delete") {
      if (!callerIsSuperAdmin) {
        return new Response(JSON.stringify({ error: "Solo el super admin puede eliminar usuarios" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const countOf = async (table: string, column: string) => {
        const { count } = await adminClient
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq(column, user_id);
        return count ?? 0;
      };
      const [lotes, engagements, transacciones, negDev, negOwner] = await Promise.all([
        countOf("lotes", "owner_id"),
        countOf("engagements_lote", "cliente_id"),
        countOf("transacciones", "propietario_id"),
        countOf("negociaciones", "developer_id"),
        countOf("negociaciones", "owner_id"),
      ]);
      return new Response(
        JSON.stringify({
          lotes,
          engagements,
          transacciones,
          negociaciones: negDev + negOwner,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Action: delete_user (borrado definitivo, solo super_admin)
    if (action === "delete_user") {
      if (!callerIsSuperAdmin) {
        return new Response(JSON.stringify({ error: "Solo el super admin puede eliminar usuarios" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "No puedes eliminar tu propia cuenta" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: targetRoles } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id);
      if ((targetRoles ?? []).some((r: any) => r.role === "super_admin")) {
        return new Response(JSON.stringify({ error: "No se puede eliminar a otro super admin" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Confirmación por correo exacto
      const { data: targetUser, error: getErr } = await adminClient.auth.admin.getUserById(user_id);
      if (getErr || !targetUser?.user) {
        return new Response(JSON.stringify({ error: "Usuario no encontrado" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const confirm = typeof body.confirm_email === "string" ? body.confirm_email.trim().toLowerCase() : "";
      if (!confirm || confirm !== (targetUser.user.email ?? "").toLowerCase()) {
        return new Response(JSON.stringify({ error: "El correo de confirmación no coincide" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Desvincular datos que se conservan
      await adminClient.from("lotes").update({ owner_id: null }).eq("owner_id", user_id);
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      await adminClient.from("usuario_owner").delete().eq("user_id", user_id);
      await adminClient.from("perfiles").delete().eq("id", user_id);

      const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id);
      if (delErr) throw delErr;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Acción no válida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
