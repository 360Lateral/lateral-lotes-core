// Sincroniza (solo lectura) los diagnósticos VID desde Google Drive,
// extrae datos con IA descartando datos personales y consolida un
// diagnóstico por activo. Nunca escribe en Drive: solo usa GET.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import * as XLSX from "npm:xlsx@0.18.5";
import mammoth from "npm:mammoth@1.8.0";
import { Buffer } from "node:buffer";

const ROOT_FOLDER = "17G1Limc60i96VSyMvXerXbamsJQjOyuE";
const DRIVE = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const AI_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";
const MAX_BYTES = 18 * 1024 * 1024;
const MAX_TEXT = 90_000;

// Cuenta de propietario de la Fundación Organización VID (cliente).
const CLIENTE_VID_ID = "433c44c9-a5db-4405-833d-4453de3ccb9f";
// Código del activo -> lote en la plataforma.
const LOTES: Record<string, string> = {
  E1: "858162da-dbbc-402e-b95f-131615a525a1",
  E2: "cb55f7a0-9780-46c5-8f4f-2926baac7ccb",
  E3: "1c9e9a35-2323-45b3-8167-7d376f6b7523",
  E4: "ae6bae06-4f39-42e5-9a1c-3af188659e17",
  E5: "90168c0a-2c70-441f-bae0-2ea5b3a2b7b2",
  E6: "52037425-2c70-4eba-8841-32bb0d906216",
  E7: "1a70f0ec-9f49-434c-b8da-b86a1470bc29",
  E8: "47d03864-c2e6-459a-80fa-683292e5eb19",
  E9: "62b49ee5-fdfd-4861-9998-3ec6a252fb73",
  A1: "6689ce9e-f57d-4e4d-963e-55de990217dc",
  A2: "f270662b-b429-4a38-bb7d-339895cb0511",
  A3: "e3ae0919-2014-407a-a652-bc587c556659",
  A4: "33ac2009-67f2-4a3c-b9ee-9ae343d528c7",
  A5: "f9947c41-b4e3-4100-bdb3-28bb4c242ab8",
  CB8: "5d747c68-6f05-4e65-9e47-e3b7c04c56a3",
  CB9: "0eac796e-4d96-48b4-9c23-aef18d640fe5",
  CB10: "e0183c22-cdce-4596-ac51-755069c6f9df",
};

const LEIBLES = new Set([
  "application/pdf",
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.binary.macroenabled.12",
  "text/markdown",
  "text/html",
  "text/plain",
  "text/csv",
]);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function driveHeaders() {
  return {
    Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
    "X-Connection-Api-Key": Deno.env.get("GOOGLE_DRIVE_API_KEY")!,
  };
}

async function driveGet(path: string, params: Record<string, string> = {}) {
  const u = new URL(DRIVE + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("supportsAllDrives", "true");
  const r = await fetch(u, { headers: driveHeaders() });
  if (!r.ok) throw new Error(`Drive [${r.status}]: ${(await r.text()).slice(0, 300)}`);
  return r;
}

type DFile = { id: string; name: string; mimeType: string; size?: string; modifiedTime?: string };

async function listar(parent: string): Promise<DFile[]> {
  const out: DFile[] = [];
  let token: string | undefined;
  do {
    const p: Record<string, string> = {
      q: `'${parent}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime)",
      pageSize: "1000",
      includeItemsFromAllDrives: "true",
    };
    if (token) p.pageToken = token;
    const j = await (await driveGet("/files", p)).json();
    out.push(...(j.files ?? []));
    token = j.nextPageToken;
  } while (token);
  return out;
}

// ---------- Protección de datos personales ----------
const PII = [
  /[\w.+-]+@[\w-]+\.[\w.]+/,                                   // correo
  /(?<!\d)3\d{2}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/,                  // celular CO
  /\b(C\.?\s?C\.?|c[ée]dula|NIT|documento de identidad)\s*(No\.?|n[úu]mero|#)?\s*:?\s*\d[\d.\s]{5,}/i,
];
export function contienePII(texto: string) {
  return PII.some((r) => r.test(texto));
}

// ---------- IA ----------
async function llamarIA(instructions: string, content: unknown[], schemaName: string, schema: unknown) {
  const r = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY")!,
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions,
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: schemaName, strict: true, schema } },
    }),
  });
  if (!r.ok || !r.body) {
    const t = await r.text();
    const err = new Error(`IA [${r.status}]: ${t.slice(0, 400)}`) as Error & { status?: number };
    err.status = r.status;
    throw err;
  }
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") out += ev.delta;
        if (ev.type === "response.refusal.delta" || ev.type === "error" || ev.type === "response.failed") {
          throw new Error("La IA no pudo procesar el documento.");
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  if (!out.trim()) throw new Error("La IA devolvió una respuesta vacía.");
  return JSON.parse(out);
}

const S = (d = "") => ({ type: ["string", "null"], description: d });
const KV = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["campo", "valor"],
    properties: { campo: { type: "string" }, valor: { type: "string" } },
  },
};
const HALLAZGO = {
  type: "object",
  additionalProperties: false,
  required: ["titulo", "descripcion", "criticidad", "area"],
  properties: {
    titulo: { type: "string" },
    descripcion: { type: "string" },
    criticidad: { type: "string", enum: ["alto", "medio", "bajo"] },
    area: S("Jurídico, Normativo, Financiero, Ambiental, Suelos, Servicios públicos, Mercado, Cabida, Técnico u Otro"),
  },
};

const SCHEMA_DOC = {
  type: "object",
  additionalProperties: false,
  required: ["legible", "tipo_documento", "area", "fecha_documento", "resumen", "datos_clave", "hallazgos", "contiene_datos_sensibles_inesperados"],
  properties: {
    legible: { type: "boolean" },
    tipo_documento: S(),
    area: S(),
    fecha_documento: S("YYYY-MM-DD si aparece"),
    resumen: S(),
    datos_clave: KV,
    hallazgos: { type: "array", items: HALLAZGO },
    contiene_datos_sensibles_inesperados: { type: "boolean" },
  },
};

const REGLAS = `Reglas obligatorias:
- Escribe en español claro, sin jerga técnica innecesaria.
- No inventes nada. Usa solo lo que dice el documento; si un dato no aparece, usa null.
- NUNCA incluyas datos personales de propietarios ni de personas naturales: nombres de personas, números de cédula o documento, teléfonos, correos ni direcciones personales. Omítelos por completo. Sí puedes incluir la dirección y matrícula del inmueble y nombres de entidades públicas.
- Si el documento contiene información sensible inesperada (datos de salud, bancarios, de menores, etc.), marca contiene_datos_sensibles_inesperados = true y no la transcribas.`;

async function extraerContenido(f: { drive_file_id: string; mime_type: string; tamano: number | null; nombre: string }) {
  const mt = f.mime_type;
  if (mt === "application/vnd.google-apps.document") {
    const t = await (await driveGet(`/files/${f.drive_file_id}/export`, { mimeType: "text/plain" })).text();
    return { texto: t };
  }
  if (mt === "application/vnd.google-apps.spreadsheet") {
    const t = await (await driveGet(`/files/${f.drive_file_id}/export`, { mimeType: "text/csv" })).text();
    return { texto: t };
  }
  if ((f.tamano ?? 0) > MAX_BYTES) return { error: "Archivo demasiado grande para leerlo automáticamente" };
  const bytes = new Uint8Array(await (await driveGet(`/files/${f.drive_file_id}`, { alt: "media" })).arrayBuffer());
  if (mt === "application/pdf") return { pdf: Buffer.from(bytes).toString("base64") };
  if (mt.includes("wordprocessingml")) {
    const r = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return { texto: r.value };
  }
  if (mt.includes("spreadsheet") || mt.includes("ms-excel")) {
    const wb = XLSX.read(bytes, { type: "array" });
    const partes = wb.SheetNames.map((n) => `### Hoja: ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n], { blankrows: false })}`);
    return { texto: partes.join("\n\n") };
  }
  return { texto: new TextDecoder().decode(bytes) };
}

// ---------- Acciones ----------
async function sincronizar(sb: ReturnType<typeof createClient>, userId: string) {
  const raiz = await listar(ROOT_FOLDER);
  const carpetas = raiz.filter((f) => f.mimeType.endsWith("folder") && /^(E|A|CB)\d+-/.test(f.name));
  let nuevos = 0, actualizados = 0, total = 0;

  for (const c of carpetas) {
    const codigo = c.name.split("-")[0].trim();
    const nombreActivo = c.name.slice(codigo.length + 1).trim();
    await sb.from("vid_diagnosticos").upsert(
      { codigo_activo: codigo, nombre_activo: nombreActivo, drive_folder_id: c.id, lote_id: LOTES[codigo] ?? null, cliente_id: CLIENTE_VID_ID },
      { onConflict: "codigo_activo", ignoreDuplicates: false },
    );

    const archivos: (DFile & { ruta: string })[] = [];
    const recorrer = async (id: string, ruta: string) => {
      for (const f of await listar(id)) {
        if (f.mimeType.endsWith("folder")) await recorrer(f.id, `${ruta}/${f.name}`);
        else archivos.push({ ...f, ruta });
      }
    };
    await recorrer(c.id, c.name);

    const { data: existentes } = await sb
      .from("vid_drive_archivos")
      .select("drive_file_id, modified_time")
      .eq("codigo_activo", codigo);
    const mapa = new Map((existentes ?? []).map((e: { drive_file_id: string; modified_time: string | null }) => [e.drive_file_id, e.modified_time]));

    const filas = [];
    for (const f of archivos) {
      total++;
      const prev = mapa.get(f.id);
      const cambio = prev !== undefined && prev && f.modifiedTime && new Date(prev).getTime() !== new Date(f.modifiedTime).getTime();
      if (prev !== undefined && !cambio) continue;
      if (prev === undefined) nuevos++; else actualizados++;
      const leible = LEIBLES.has(f.mimeType);
      filas.push({
        drive_file_id: f.id,
        codigo_activo: codigo,
        nombre: f.name,
        ruta: f.ruta,
        mime_type: f.mimeType,
        tamano: f.size ? Number(f.size) : null,
        modified_time: f.modifiedTime ?? null,
        estado: leible ? "pendiente" : "no_aplica",
        motivo: leible ? null : "Formato no documental (foto, plano, video o comprimido)",
        extracto: null,
      });
    }
    for (let i = 0; i < filas.length; i += 200) {
      const { error } = await sb.from("vid_drive_archivos").upsert(filas.slice(i, i + 200), { onConflict: "drive_file_id" });
      if (error) throw new Error(error.message);
    }
  }
  await sb.from("vid_sync_log").insert({ accion: "sincronizar", usuario_id: userId, nuevos, actualizados, total, detalle: `${carpetas.length} activos` });
  return { activos: carpetas.length, nuevos, actualizados, total };
}

async function procesar(sb: ReturnType<typeof createClient>, limite: number, codigo?: string) {
  let q = sb.from("vid_drive_archivos").select("id, drive_file_id, mime_type, tamano, nombre, ruta, codigo_activo").eq("estado", "pendiente").order("tamano", { ascending: true, nullsFirst: true }).limit(limite);
  if (codigo) q = q.eq("codigo_activo", codigo);
  const { data: pendientes, error } = await q;
  if (error) throw new Error(error.message);

  const resultados = [];
  for (const f of pendientes ?? []) {
    try {
      const c = await extraerContenido(f);
      if ("error" in c && c.error) {
        await sb.from("vid_drive_archivos").update({ estado: "requiere_revision", motivo: c.error, procesado_at: new Date().toISOString() }).eq("id", f.id);
        resultados.push({ nombre: f.nombre, estado: "requiere_revision" });
        continue;
      }
      const contenido: unknown[] = [{ type: "input_text", text: `Activo ${f.codigo_activo}. Archivo: ${f.ruta}/${f.nombre}` }];
      if ("pdf" in c && c.pdf) contenido.push({ type: "input_file", filename: f.nombre, file_data: `data:application/pdf;base64,${c.pdf}` });
      else {
        const texto = (c.texto ?? "").trim();
        if (texto.length < 30) {
          await sb.from("vid_drive_archivos").update({ estado: "requiere_revision", motivo: "No se encontró texto legible", procesado_at: new Date().toISOString() }).eq("id", f.id);
          resultados.push({ nombre: f.nombre, estado: "requiere_revision" });
          continue;
        }
        contenido.push({ type: "input_text", text: texto.slice(0, MAX_TEXT) });
      }
      const ext = await llamarIA(
        `Eres analista inmobiliario de 360Lateral. Lee este documento de un diagnóstico inmobiliario y extrae sus datos del inmueble, un resumen corto y los hallazgos con criticidad (alto, medio, bajo).\n${REGLAS}`,
        contenido, "extracto_documento", SCHEMA_DOC,
      );
      const serial = JSON.stringify(ext);
      if (!ext.legible) {
        await sb.from("vid_drive_archivos").update({ estado: "requiere_revision", motivo: "El documento no se pudo leer bien", procesado_at: new Date().toISOString() }).eq("id", f.id);
      } else if (ext.contiene_datos_sensibles_inesperados || contienePII(serial)) {
        // No se guarda el extracto: queda oculto hasta revisión humana.
        await sb.from("vid_drive_archivos").update({ estado: "requiere_revision", motivo: "Posible información personal o sensible; se ocultó", procesado_at: new Date().toISOString() }).eq("id", f.id);
      } else {
        await sb.from("vid_drive_archivos").update({ estado: "procesado", motivo: null, extracto: ext, procesado_at: new Date().toISOString() }).eq("id", f.id);
      }
      resultados.push({ nombre: f.nombre, estado: "ok" });
    } catch (e) {
      const status = (e as { status?: number }).status;
      // Créditos o permisos de IA: detener todo el lote.
      if (status === 402 || status === 403 || status === 429) throw e;
      await sb.from("vid_drive_archivos").update({ estado: "error", motivo: String((e as Error).message).slice(0, 300), procesado_at: new Date().toISOString() }).eq("id", f.id);
      resultados.push({ nombre: f.nombre, estado: "error" });
    }
  }
  const { count } = await sb.from("vid_drive_archivos").select("id", { count: "exact", head: true }).eq("estado", "pendiente");
  return { procesados: resultados.length, restantes: count ?? 0, resultados };
}

const SCHEMA_DIAG = {
  type: "object",
  additionalProperties: false,
  required: ["ciudad", "tipo_inmueble", "fecha_diagnostico", "direccion_inmueble", "area_lote_m2", "area_construida_m2", "matricula_inmobiliaria", "uso_actual", "estado_fisico", "datos_adicionales", "resumen", "criticidad_general", "hallazgos", "plan_accion"],
  properties: {
    ciudad: S(), tipo_inmueble: S(), fecha_diagnostico: S("YYYY-MM-DD"), direccion_inmueble: S(),
    area_lote_m2: { type: ["number", "null"] }, area_construida_m2: { type: ["number", "null"] },
    matricula_inmobiliaria: S(), uso_actual: S(), estado_fisico: S(),
    datos_adicionales: KV,
    resumen: { type: "string" },
    criticidad_general: { type: "string", enum: ["alto", "medio", "bajo"] },
    hallazgos: { type: "array", items: HALLAZGO },
    plan_accion: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prioridad", "paso", "plazo", "area"],
        properties: { prioridad: { type: "integer" }, paso: { type: "string" }, plazo: S("Inmediato, Corto plazo, Mediano plazo"), area: S() },
      },
    },
  },
};

async function consolidar(sb: ReturnType<typeof createClient>, codigo: string) {
  const { data: diag } = await sb.from("vid_diagnosticos").select("*").eq("codigo_activo", codigo).single();
  if (!diag) throw new Error("Activo no encontrado");
  const { data: docs } = await sb.from("vid_drive_archivos").select("nombre, ruta, extracto").eq("codigo_activo", codigo).eq("estado", "procesado");
  if (!docs?.length) throw new Error("Aún no hay documentos procesados para este activo");

  let lote: Record<string, unknown> | null = null;
  if (diag.lote_id) {
    const { data } = await sb.from("lotes").select("ciudad, direccion, area_total_m2").eq("id", diag.lote_id).maybeSingle();
    lote = data;
  }
  const material = docs.map((d: { ruta: string; nombre: string; extracto: unknown }) => `## ${d.ruta}/${d.nombre}\n${JSON.stringify(d.extracto)}`).join("\n\n").slice(0, 250_000);
  const r = await llamarIA(
    `Eres analista inmobiliario senior de 360Lateral. A partir de los extractos de todos los documentos de un activo, redacta su diagnóstico consolidado para el cliente: datos clave, un resumen ejecutivo (máx. 150 palabras), los hallazgos principales sin repetir (máx. 12, ordenados del más crítico al menos) y un plan de acción con pasos concretos, numerados por prioridad (1 = más urgente).\n${REGLAS}`,
    [{ type: "input_text", text: `Activo ${codigo} – ${diag.nombre_activo}\nDatos registrados en la plataforma: ${JSON.stringify(lote)}\n\nExtractos:\n${material}` }],
    "diagnostico_activo", SCHEMA_DIAG,
  );
  const sospechoso = contienePII(JSON.stringify(r));
  const fecha = r.fecha_diagnostico && /^\d{4}-\d{2}-\d{2}$/.test(r.fecha_diagnostico) ? r.fecha_diagnostico : null;
  const { error } = await sb.from("vid_diagnosticos").update({
    ciudad: r.ciudad, tipo_inmueble: r.tipo_inmueble, fecha_diagnostico: fecha, criticidad: r.criticidad_general,
    datos: {
      direccion_inmueble: r.direccion_inmueble, area_lote_m2: r.area_lote_m2, area_construida_m2: r.area_construida_m2,
      matricula_inmobiliaria: r.matricula_inmobiliaria, uso_actual: r.uso_actual, estado_fisico: r.estado_fisico,
      adicionales: r.datos_adicionales,
    },
    resumen: sospechoso ? null : r.resumen,
    hallazgos: sospechoso ? [] : r.hallazgos,
    plan_accion: sospechoso ? [] : r.plan_accion,
    requiere_revision: sospechoso,
    motivo_revision: sospechoso ? "Posible información personal detectada; revisar antes de mostrar" : null,
    documentos_procesados: docs.length,
    generado_at: new Date().toISOString(),
  }).eq("codigo_activo", codigo);
  if (error) throw new Error(error.message);
  return { codigo, documentos: docs.length, requiere_revision: sospechoso };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser(auth.replace("Bearer ", ""));
    if (!u?.user) return json({ error: "Debes iniciar sesión" }, 401);
    const sb = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: ok } = await sb.rpc("is_admin_or_experto", { _user_id: u.user.id });
    if (!ok) return json({ error: "Sin permisos" }, 403);

    const body = await req.json().catch(() => ({}));
    const accion = String(body.accion ?? "");
    const codigo = typeof body.codigo === "string" && /^(E|A|CB)\d{1,2}$/.test(body.codigo) ? body.codigo : undefined;

    if (accion === "sincronizar") return json(await sincronizar(sb, u.user.id));
    if (accion === "procesar") {
      const limite = Math.min(Math.max(Number(body.limite) || 2, 1), 5);
      return json(await procesar(sb, limite, codigo));
    }
    if (accion === "consolidar") {
      if (!codigo) return json({ error: "Código de activo inválido" }, 400);
      return json(await consolidar(sb, codigo));
    }
    return json({ error: "Acción no válida" }, 400);
  } catch (e) {
    const status = (e as { status?: number }).status;
    console.error("vid-drive-sync", e);
    return json({ error: (e as Error).message }, status && status >= 400 ? status : 500);
  }
});
