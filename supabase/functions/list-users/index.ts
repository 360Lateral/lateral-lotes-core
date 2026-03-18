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
    // Validate caller is admin/asesor
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller with their JWT
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

    // Check caller is admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
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

    // List all users from auth
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;

    // Get all profiles, roles, comisionista docs, and owner associations
    const [perfilesRes, rolesRes, comDocsRes, ownerAssocRes] = await Promise.all([
      adminClient.from("perfiles").select("*"),
      adminClient.from("user_roles").select("*"),
      adminClient.from("documentos_comisionista").select("user_id, estado"),
      adminClient.from("usuario_owner").select("user_id, owner_id"),
    ]);

    const perfiles = perfilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    const comDocs = comDocsRes.data ?? [];
    const ownerAssocs = ownerAssocRes.data ?? [];

    const perfilesMap = new Map(perfiles.map((p: any) => [p.id, p]));
    const rolesMap = new Map<string, string[]>();
    for (const r of roles) {
      const existing = rolesMap.get(r.user_id) ?? [];
      existing.push(r.role);
      rolesMap.set(r.user_id, existing);
    }

    // Comisionista doc status per user
    const comDocStatus = new Map<string, string>();
    for (const d of comDocs) {
      comDocStatus.set(d.user_id, d.estado);
    }

    // Owner associations per user
    const ownerAssocMap = new Map<string, string[]>();
    for (const a of ownerAssocs) {
      const existing = ownerAssocMap.get(a.user_id) ?? [];
      existing.push(a.owner_id);
      ownerAssocMap.set(a.user_id, existing);
    }

    const result = users.map((u: any) => {
      const perfil = perfilesMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name ?? perfil?.nombre ?? null,
        user_type: perfil?.user_type ?? null,
        activo: perfil?.activo ?? true,
        roles: rolesMap.get(u.id) ?? [],
        comisionista_doc_estado: comDocStatus.get(u.id) ?? null,
        owner_ids: ownerAssocMap.get(u.id) ?? [],
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      };
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
