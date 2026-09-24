import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { id } = await req.json().catch(() => ({}))
    if (typeof id !== 'string' || !UUID.test(id)) return json({ error: 'id inválido' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    // Solo diagnósticos recién creados (10 min) y aún no notificados: evita abuso.
    const desde = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: d, error } = await admin
      .from('diagnosticos')
      .update({ notificado_at: new Date().toISOString() })
      .eq('id', id)
      .is('notificado_at', null)
      .gte('created_at', desde)
      .select('*')
      .maybeSingle()
    if (error) return json({ error: error.message }, 500)
    if (!d) return json({ ok: true, skipped: true })

    const ubicacion = [d.ciudad, d.departamento].filter(Boolean).join(', ')
    const area = d.area_m2 ? `${Math.round(Number(d.area_m2)).toLocaleString('es-CO')} m²` : ''
    const mapaUrl = d.latitud && d.longitud
      ? `https://www.google.com/maps?q=${d.latitud},${d.longitud}` : ''

    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const enviar = (body: unknown) => fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const envios: Promise<Response>[] = []
    if (d.email) {
      envios.push(enviar({
          templateName: 'diagnostico-confirmacion',
          recipientEmail: d.email,
          idempotencyKey: `diagnostico-confirmacion-${d.id}`,
          templateData: { nombre: d.nombre, ubicacion, area },
        }))
    }
    envios.push(enviar({
        templateName: 'diagnostico-nuevo-admin',
        idempotencyKey: `diagnostico-nuevo-admin-${d.id}`,
        templateData: {
          nombre: d.nombre, email: d.email, telefono: d.telefono, ubicacion, area,
          tipo: d.tipo_lote, objetivo: d.objetivo, mapaUrl,
        },
      }))
    const res = await Promise.all(envios)
    for (const r of res) if (!r.ok) console.error('Envio falló', r.status, await r.text())
    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return json({ error: String(e) }, 500)
  }
})
