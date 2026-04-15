/**
 * Edge Function: mapgis-consulta
 *
 * Consulta datos urbanísticos de MapGIS Medellín.
 * Soporta 4 tipos de entrada:
 *   - cbml       → código de 11 dígitos
 *   - matricula  → número de matrícula inmobiliaria
 *   - direccion  → dirección textual (ej: "CL 50 # 30-20")
 *   - ubicacion  → coordenadas "lat,lng" (ej: "6.2442,-75.5812")
 *
 * Inspirado en el scraping de Nodo Eafit / Análisis de Lotes
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ──────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── MapGIS endpoints ──────────────────────────────────────────────────────
const BASE = "https://www.medellin.gov.co";
const EP = {
  sesion:       `${BASE}/mapgis_seg/ValidarSessionMapgis.do`,
  porCBML:      `${BASE}/site_consulta_pot/buscarFichaCBML.hyg`,
  porMatricula: `${BASE}/site_consulta_pot/buscarFichaMat.hyg`,
  porDireccion: `${BASE}/site_consulta_pot/buscarFichaDireccion.hyg`,
  porPunto:     `${BASE}/site_consulta_pot/consultarLotesPorPunto.hyg`,
  consultas:    `${BASE}/site_consulta_pot/consultas.hyg`,
};

const BASE_HEADERS: Record<string, string> = {
  "Accept":           "application/json, text/javascript, */*; q=0.01",
  "Accept-Language":  "es-ES,es;q=0.9",
  "Content-Type":     "application/x-www-form-urlencoded; charset=UTF-8",
  "Origin":           BASE,
  "Referer":          `${BASE}/site_consulta_pot/ConsultaPot.hyg`,
  "User-Agent":       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
};

// ─── Tipos ────────────────────────────────────────────────────────────────
type TipoEntrada = "cbml" | "matricula" | "direccion" | "ubicacion";

interface ConsultaRequest {
  tipo: TipoEntrada;
  valor: string;
  lote_id?: string;
}

interface MapGISData {
  cbml: string;
  clasificacion_suelo: string | null;
  es_urbano: boolean;
  uso_suelo: {
    categoria: string | null;
    subcategoria: string | null;
    codigo: string | null;
    porcentaje: string | null;
  } | null;
  aprovechamiento_urbano: {
    tratamiento: string | null;
    codigo_tratamiento: string | null;
    indice_construccion_max: string | null;
    densidad_habitacional_max: string | null;
    altura_normativa: string | null;
    identificador: string | null;
  } | null;
  restricciones: {
    amenaza_riesgo: string | null;
    retiros_rios: string;
  };
  fuente: string;
  fecha_consulta: string;
}

// ─── Manejo de cookies ────────────────────────────────────────────────────
function extraerCookies(response: Response): string {
  const cookies: string[] = [];
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      const cookiePart = value.split(";")[0].trim();
      if (cookiePart) cookies.push(cookiePart);
    }
  });
  return cookies.join("; ");
}

// ─── Sesión MapGIS ────────────────────────────────────────────────────────
async function inicializarSesion(): Promise<string> {
  try {
    const resp = await fetch(EP.sesion, {
      method: "POST",
      headers: BASE_HEADERS,
      body: "acepta_terminos=true",
    });
    const cookies = extraerCookies(resp);
    console.log("[MapGIS] Sesión inicializada. Cookies:", cookies ? "OK" : "vacías");
    return cookies;
  } catch (e) {
    console.error("[MapGIS] Error inicializando sesión:", e);
    return "";
  }
}

// ─── Resolver CBML según tipo de entrada ─────────────────────────────────
async function resolverCBML(
  tipo: TipoEntrada,
  valor: string,
  cookies: string,
): Promise<string | null> {
  const headers = { ...BASE_HEADERS, Cookie: cookies };

  if (tipo === "cbml") {
    return valor.trim();
  }

  if (tipo === "matricula") {
    console.log("[MapGIS] Buscando por matrícula:", valor);
    const resp = await fetch(EP.porMatricula, {
      method: "POST",
      headers,
      body: `matricula=${encodeURIComponent(valor.trim())}`,
    });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => null);
    console.log("[MapGIS] Respuesta matrícula:", JSON.stringify(data)?.slice(0, 200));
    // Puede retornar {"cbml":"...","matricula":"..."} o lista
    if (Array.isArray(data) && data.length > 0) return data[0]?.cbml ?? null;
    return data?.cbml ?? null;
  }

  if (tipo === "direccion") {
    console.log("[MapGIS] Buscando por dirección:", valor);
    const resp = await fetch(EP.porDireccion, {
      method: "POST",
      headers,
      body: `direccion=${encodeURIComponent(valor.trim())}`,
    });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => null);
    console.log("[MapGIS] Respuesta dirección:", JSON.stringify(data)?.slice(0, 200));
    if (Array.isArray(data) && data.length > 0) return data[0]?.cbml ?? null;
    return data?.cbml ?? null;
  }

  if (tipo === "ubicacion") {
    // valor esperado: "6.2442,-75.5812" (lat,lng)
    const [lat, lng] = valor.split(",").map((s) => s.trim());
    if (!lat || !lng) return null;
    console.log("[MapGIS] Buscando por ubicación:", lat, lng);
    const resp = await fetch(EP.porPunto, {
      method: "POST",
      headers,
      body: `lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
    });
    if (!resp.ok) return null;
    const data = await resp.json().catch(() => null);
    console.log("[MapGIS] Respuesta ubicación:", JSON.stringify(data)?.slice(0, 200));
    if (Array.isArray(data) && data.length > 0) return data[0]?.cbml ?? null;
    return data?.cbml ?? null;
  }

  return null;
}

// ─── Establecer contexto CBML en la sesión ────────────────────────────────
async function establecerContextoCBML(cbml: string, cookies: string): Promise<void> {
  try {
    await fetch(EP.porCBML, {
      method: "POST",
      headers: { ...BASE_HEADERS, Cookie: cookies },
      body: `cbml=${cbml}`,
    });
    // Pausa mínima para que MapGIS procese
    await new Promise((r) => setTimeout(r, 300));
  } catch (e) {
    console.warn("[MapGIS] No se pudo establecer contexto:", e);
  }
}

// ─── Consulta genérica a una capa ─────────────────────────────────────────
async function consultarCapa(
  cbml: string,
  consulta: string,
  campos: string,
  cookies: string,
): Promise<any> {
  const url = `${EP.consultas}?cbml=${cbml}&consulta=${consulta}&campos=${encodeURIComponent(campos)}`;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...BASE_HEADERS, Cookie: cookies },
      body: "",
    });
    if (!resp.ok) return null;
    const text = await resp.text();
    if (!text?.trim()) return null;
    return JSON.parse(text);
  } catch (e) {
    console.warn(`[MapGIS] Error en capa ${consulta}:`, e);
    return null;
  }
}

// ─── Consulta completa por CBML ───────────────────────────────────────────
async function consultarDatosCompletos(
  cbml: string,
  cookies: string,
): Promise<MapGISData> {
  // Establecer contexto primero (crítico para que funcionen las capas)
  await establecerContextoCBML(cbml, cookies);

  // Consultar todas las capas en paralelo
  const [
    capaClas,
    capaUsos,
    capaAprov,
    capaAmenaza,
    capaRios,
  ] = await Promise.all([
    consultarCapa(cbml, "SQL_CONSULTA_CLASIFICACIONSUELO", "Clasificación del suelo", cookies),
    consultarCapa(cbml, "SQL_CONSULTA_USOSGENERALES", "Categoría de uso,Subcategoría de uso,COD_SUBCAT_USO,porcentaje", cookies),
    consultarCapa(cbml, "SQL_CONSULTA_APROVECHAMIENTOSURBANOS", "TRATAMIENTO,Dens habit max (Viv/ha),IC max,Altura normativa,IDENTIFICADOR", cookies),
    consultarCapa(cbml, "SQL_CONSULTA_RESTRICCIONAMENAZARIESGO", "Condiciones de riesgo y RNM", cookies),
    consultarCapa(cbml, "SQL_CONSULTA_RESTRICCIONRIOSQUEBRADAS", "Restric por retiro a quebrada", cookies),
  ]);

  // Clasificación del suelo
  const clasificacion: string | null =
    capaClas?.resultados?.[0]?.[0]?.valor ?? null;

  // Uso del suelo (primer uso = mayor %)
  let usoSuelo = null;
  if (capaUsos?.resultados?.[0]?.length >= 4) {
    const r = capaUsos.resultados[0];
    usoSuelo = {
      porcentaje:   r[0]?.valor ?? null,
      categoria:    r[1]?.valor ?? null,
      subcategoria: r[2]?.valor ?? null,
      codigo:       r[3]?.valor ?? null,
    };
  }

  // Aprovechamiento urbano
  let aprovechamiento = null;
  if (capaAprov?.resultados?.[0]?.length >= 5) {
    const r = capaAprov.resultados[0];
    aprovechamiento = {
      codigo_tratamiento:       r[0]?.valor ?? null,
      tratamiento:              r[1]?.valor ?? null,
      densidad_habitacional_max: r[2]?.valor ?? null,
      indice_construccion_max:  r[3]?.valor ?? null,
      altura_normativa:         r[4]?.valor ?? null,
      identificador:            r[5]?.valor ?? null,
    };
  }

  // Restricciones
  const amenaza: string | null =
    capaAmenaza?.resultados?.[0]?.[0]?.valor ?? null;
  const rios: string =
    capaRios?.resultados?.[0]?.[0]?.valor || "Sin restricciones";

  return {
    cbml,
    clasificacion_suelo: clasificacion,
    es_urbano: clasificacion?.toLowerCase() === "urbano",
    uso_suelo: usoSuelo,
    aprovechamiento_urbano: aprovechamiento,
    restricciones: { amenaza_riesgo: amenaza, retiros_rios: rios },
    fuente: "MapGIS Medellín",
    fecha_consulta: new Date().toISOString(),
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tipo, valor, lote_id }: ConsultaRequest = await req.json();

    if (!tipo || !valor) {
      return new Response(
        JSON.stringify({ error: "Se requieren los campos 'tipo' y 'valor'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Cliente Supabase (service role para acceso sin RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Obtener user_id del JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    // ── Verificar cache ──────────────────────────────────────────────────
    const { data: cached } = await supabase
      .from("mapgis_cache")
      .select("datos, cbml")
      .eq("tipo_entrada", tipo)
      .eq("valor_entrada", valor.trim())
      .eq("es_valido", true)
      .gte("expira_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      console.log("[MapGIS] Cache hit para:", tipo, valor);
      return new Response(
        JSON.stringify({ ...cached.datos, desde_cache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Consulta en vivo ─────────────────────────────────────────────────
    console.log("[MapGIS] Cache miss, consultando MapGIS:", tipo, valor);

    const cookies = await inicializarSesion();
    if (!cookies) {
      return new Response(
        JSON.stringify({ error: "No se pudo conectar con MapGIS. Intenta de nuevo." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cbml = await resolverCBML(tipo, valor, cookies);
    if (!cbml) {
      return new Response(
        JSON.stringify({
          error: "No se encontró el predio en MapGIS",
          detalle: tipo === "direccion"
            ? "Verifica que la dirección esté en formato Medellín (ej: CL 50 30 20)"
            : tipo === "ubicacion"
            ? "Las coordenadas no corresponden a un predio registrado"
            : `No se encontró información para ${tipo === "matricula" ? "la matrícula" : "el CBML"} indicado`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const datos = await consultarDatosCompletos(cbml, cookies);

    // Verificar que haya datos reales
    const tieneDatos = datos.clasificacion_suelo || datos.uso_suelo || datos.aprovechamiento_urbano;
    if (!tieneDatos) {
      return new Response(
        JSON.stringify({
          error: "El predio no tiene información urbanística disponible en MapGIS",
          cbml,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Guardar en cache ─────────────────────────────────────────────────
    await supabase.from("mapgis_cache").upsert({
      cbml,
      tipo_entrada: tipo,
      valor_entrada: valor.trim(),
      datos,
      consultado_at: new Date().toISOString(),
      expira_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      es_valido: true,
      user_id: user?.id ?? null,
    }, { onConflict: "cbml" });

    // ── Si viene con lote_id, actualizar cbml en el lote ─────────────────
    if (lote_id && cbml) {
      await supabase.from("lotes").update({ cbml }).eq("id", lote_id);
    }

    return new Response(
      JSON.stringify({ ...datos, desde_cache: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("[MapGIS] Error general:", err);
    return new Response(
      JSON.stringify({ error: "Error interno al procesar la consulta" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
