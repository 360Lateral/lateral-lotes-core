import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail, type SendTemplateEmailOptions, type SendTemplateEmailResult } from './send-email.ts'
import { TEMPLATES } from './registry.ts'

// Sends a registered template and records the outcome in email_send_log.
// A log write never decides the send result.
export async function sendTemplateEmailLogged(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const recipient = TEMPLATES[templateName]?.to || to
  const log = async (row: Record<string, unknown>) => {
    const { error } = await supabase.from('email_send_log').insert({
      message_id: null,
      template_name: templateName,
      recipient_email: recipient,
      ...row,
    })
    if (error) console.error('email_send_log insert failed', { code: error.code, message: error.message })
  }

  try {
    const result = await sendTemplateEmail(templateName, to, options)
    await log(result.sent ? { status: 'sent' } : { status: 'suppressed' })
    return result
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    await log({ status: 'failed', error_message: msg.slice(0, 1000) })
    throw error
  }
}
