import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmailLogged } from '../_shared/transactional-email-templates/send-and-log.ts'

const UUID = /^[0-9a-f-]{36}$/i
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

// Envía el aviso de acceso de cortesía al desarrollador. Solo administradores.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = req.headers.get('Authorization') ?? ''
    const token = auth.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'No autenticado' }, 401)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: u, error: uErr } = await admin.auth.getUser(token)
    if (uErr || !u?.user) return json({ error: 'No autenticado' }, 401)

    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', u.user.id)
    const esAdmin = (roles ?? []).some((r: any) => r.role === 'admin' || r.role === 'super_admin')
    if (!esAdmin) return json({ error: 'Prohibido' }, 403)

    const { acceso_id, origin } = await req.json().catch(() => ({}))
    if (typeof acceso_id !== 'string' || !UUID.test(acceso_id)) return json({ error: 'acceso_id inválido' }, 400)

    const { data: acc, error } = await admin
      .from('accesos_lote')
      .select('id, lote_id, desarrollador_id, fecha_inicio, fecha_expiracion, lote:lotes(nombre_lote)')
      .eq('id', acceso_id)
      .maybeSingle()
    if (error || !acc) return json({ error: 'Acceso no encontrado' }, 404)

    const { data: perfil } = await admin.from('perfiles').select('nombre, email').eq('id', acc.desarrollador_id).maybeSingle()
    if (!perfil?.email) return json({ ok: true, skipped: 'sin_email' })

    const exp = acc.fecha_expiracion ? new Date(acc.fecha_expiracion) : null
    const dias = exp ? Math.max(1, Math.round((exp.getTime() - Date.now()) / 86400000)) : 30
    const base = typeof origin === 'string' && /^https:\/\/[a-z0-9.-]+$/i.test(origin) ? origin : 'https://urbanix360.com'

    const result = await sendTemplateEmailLogged('acceso-manual-otorgado', perfil.email, {
      idempotencyKey: `acceso-manual-otorgado-${acc.id}`,
      templateData: {
        nombreDesarrollador: perfil.nombre ?? 'Desarrollador',
        nombreLote: (acc as any).lote?.nombre_lote ?? 'el lote',
        diasAcceso: dias,
        fechaExpiracion: exp ? exp.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        loteUrl: `${base}/lotes/${acc.lote_id}`,
      },
    })
    return json({ ok: true, sent: result.sent })
  } catch (e) {
    console.error(e)
    return json({ error: 'Error enviando correo' }, 500)
  }
})
