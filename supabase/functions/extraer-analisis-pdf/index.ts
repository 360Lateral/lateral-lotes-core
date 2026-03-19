import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPTS: Record<string, string> = {
  normativo: `Eres un experto en análisis normativo de lotes en Colombia. Analiza este informe normativo y extrae ÚNICAMENTE los datos que encuentres explícitamente en el documento. NO inventes ni asumas datos. Si un dato no está en el documento, devuelve null para ese campo.

Devuelve SOLO un JSON con esta estructura:
{
  "uso_principal": string | null,
  "usos_compatibles": string | null,
  "indice_construccion": number | null,
  "indice_ocupacion": number | null,
  "altura_max_pisos": number | null,
  "altura_max_metros": number | null,
  "aislamiento_frontal_m": number | null,
  "aislamiento_posterior_m": number | null,
  "aislamiento_lateral_m": number | null,
  "zona_pot": string | null,
  "tratamiento": string | null,
  "norma_vigente": string | null,
  "cesion_tipo_a_pct": number | null,
  "plan_parcial": string | null,
  "observaciones": string | null
}`,

  juridico: `Eres un experto en análisis jurídico de predios en Colombia. Analiza este informe y extrae ÚNICAMENTE los datos explícitos. NO inventes datos. Null si no existe.

Devuelve SOLO un JSON:
{
  "cadena_tradicion": "completa"|"incompleta"|"interrumpida"|null,
  "anos_tradicion": number | null,
  "gravamenes": boolean | null,
  "hipoteca_activa": boolean | null,
  "servidumbres": boolean | null,
  "deuda_predial": boolean | null,
  "discrepancia_areas": boolean | null,
  "litigio_activo": boolean | null,
  "proceso_sucesion": boolean | null,
  "num_copropietarios": number | null,
  "observaciones": string | null
}`,

  ambiental: `Eres un experto ambiental en Colombia. Extrae solo datos explícitos. Null si no existe.

Devuelve SOLO un JSON:
{
  "ronda_hidrica": boolean | null,
  "distancia_ronda_m": number | null,
  "reserva_forestal": boolean | null,
  "amenaza_inundacion": "alta"|"media"|"baja"|"sin_amenaza"|null,
  "amenaza_remocion": "alta"|"media"|"baja"|"sin_amenaza"|null,
  "pasivo_ambiental": boolean | null,
  "requiere_licencia_ambiental": boolean | null,
  "observaciones": string | null
}`,

  sspp: `Eres experto en servicios públicos. Extrae solo datos explícitos. Null si no existe.

Devuelve SOLO un JSON:
{
  "acueducto_disponible": boolean|null,
  "alcantarillado_disponible": boolean|null,
  "energia_disponible": boolean|null,
  "gas_disponible": boolean|null,
  "capacidad_red_kva": number|null,
  "distancia_red_matriz_m": number|null,
  "costo_extension_estimado": number|null,
  "via_pavimentada": boolean|null,
  "observaciones": string|null
}`,

  geotecnico: `Eres experto en geotecnia. Extrae solo datos explícitos. Null si no existe.

Devuelve SOLO un JSON:
{
  "tipo_suelo": "cohesivo"|"granular"|"roca"|"mixto"|null,
  "capacidad_portante_ton_m2": number|null,
  "nivel_freatico_m": number|null,
  "pendiente_pct": number|null,
  "sistema_cimentacion": "superficial"|"profunda"|"pilotes"|"especial"|null,
  "sobrecosto_cimentacion_estimado": number|null,
  "observaciones": string|null
}`,

  mercado: `Eres experto en mercado inmobiliario colombiano. Extrae solo datos explícitos. Null si no existe.

Devuelve SOLO un JSON:
{
  "precio_venta_m2_zona": number|null,
  "proyectos_competidores": number|null,
  "velocidad_absorcion_unidades_mes": number|null,
  "perfil_comprador": "VIS"|"No VIS"|"mixto"|null,
  "valorizacion_anual_pct": number|null,
  "tendencia_precios": "Subiendo"|"Estable"|"Bajando"|null,
  "observaciones": string|null
}`,

  arquitectonico: `Eres experto en arquitectura y urbanismo. Extrae solo datos explícitos. Null si no existe.

Devuelve SOLO un JSON:
{
  "m2_construibles_total": number|null,
  "unidades_estimadas": number|null,
  "area_vendible_pct": number|null,
  "tipologias": string|null,
  "eficiencia_lote_pct": number|null,
  "forma_lote": "regular"|"irregular"|"esquinero"|null,
  "permite_sotano": boolean|null,
  "observaciones": string|null
}`,

  financiero: `Eres experto financiero inmobiliario en Colombia. Extrae solo datos explícitos. Null si no existe.

Devuelve SOLO un JSON:
{
  "costo_construccion_m2": number|null,
  "ingresos_proyectados": number|null,
  "margen_bruto_pct": number|null,
  "tir_pct": number|null,
  "vpn": number|null,
  "punto_equilibrio_pct": number|null,
  "precio_estimado_min": number|null,
  "precio_estimado_promedio": number|null,
  "precio_estimado_max": number|null,
  "observaciones": string|null
}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, pdf_url, lote_context } = await req.json();

    if (!area || !pdf_url) {
      return new Response(
        JSON.stringify({ success: false, error: "Faltan campos requeridos: area y pdf_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "ANTHROPIC_API_KEY no está configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Download PDF from Google Drive
    const fileId = pdf_url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (!fileId) {
      return new Response(
        JSON.stringify({ success: false, error: "No se pudo extraer el ID del archivo de Google Drive" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const pdfResponse = await fetch(downloadUrl);
    if (!pdfResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Error descargando PDF: ${pdfResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Convert to base64 in chunks to avoid stack overflow
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < pdfBytes.length; i += chunkSize) {
      const chunk = pdfBytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const pdfBase64 = btoa(binary);

    // Step 2: Get prompt for the area
    const systemPrompt = PROMPTS[area];
    if (!systemPrompt) {
      return new Response(
        JSON.stringify({ success: false, error: `Área no soportada: ${area}. Áreas válidas: ${Object.keys(PROMPTS).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Call Claude API with PDF
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              {
                type: "text",
                text: `Extrae los datos de este informe ${area} para el lote: ${JSON.stringify(lote_context)}. Responde SOLO con el JSON, sin texto adicional, sin bloques de código.`,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Error de Claude API [${claudeResponse.status}]: ${errorText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await claudeResponse.json();

    const rawText = result.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    const clean = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let datos;
    try {
      datos = JSON.parse(clean);
    } catch {
      console.error("Failed to parse Claude response:", clean);
      return new Response(
        JSON.stringify({ success: false, error: "No se pudo parsear la respuesta de Claude", raw: clean }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Return extracted data
    return new Response(
      JSON.stringify({
        success: true,
        area,
        datos,
        advertencia: "Revisa los datos antes de guardar",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extraer-analisis-pdf error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
