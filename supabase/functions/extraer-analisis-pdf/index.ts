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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY no está configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Download PDF from Google Drive
    const fileId =
      pdf_url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ||
      pdf_url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] ||
      (/^[a-zA-Z0-9_-]{20,}$/.test(pdf_url.trim()) ? pdf_url.trim() : null);
    if (!fileId) {
      return new Response(
        JSON.stringify({ success: false, error: `No se pudo extraer el ID del archivo de Google Drive. URL recibida: ${pdf_url}` }),
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

    // Step 3: Call Lovable AI Gateway with PDF content as base64 text
    // Lovable AI Gateway uses OpenAI-compatible API format
    const userContent = `Aquí está el contenido del PDF en base64 (decodifícalo mentalmente para analizar el documento):

[PDF_BASE64_START]
${pdfBase64}
[PDF_BASE64_END]

Extrae los datos de este informe ${area} para el lote: ${JSON.stringify(lote_context)}. Responde SOLO con el JSON, sin texto adicional, sin bloques de código.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
              {
                type: "text",
                text: `Extrae los datos de este informe ${area} para el lote: ${JSON.stringify(lote_context)}. Responde SOLO con el JSON, sin texto adicional, sin bloques de código.`,
              },
            ],
          },
        ],
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Límite de solicitudes excedido. Por favor intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos de IA agotados. Recarga créditos en la configuración del workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: `Error de IA [${aiResponse.status}]: ${errorText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await aiResponse.json();

    const rawText = result.choices?.[0]?.message?.content ?? "";

    const clean = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let datos;
    try {
      datos = JSON.parse(clean);
    } catch {
      console.error("Failed to parse AI response:", clean);
      return new Response(
        JSON.stringify({ success: false, error: "No se pudo parsear la respuesta de IA", raw: clean }),
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
