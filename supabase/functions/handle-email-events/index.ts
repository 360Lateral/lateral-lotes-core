import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Records bounce/complaint/unsubscribe outcomes (notification only — Lovable
// enforces suppression at send time). Idempotent: upsert + append-only log.
async function record(
  event: { event_id: string; data: { recipient: string; message_id?: string } },
  reason: 'bounce' | 'complaint' | 'unsubscribe',
  status: 'bounced' | 'complained' | 'suppressed',
  message: string
) {
  const email = String(event.data.recipient ?? '').toLowerCase()
  if (!email) return

  const { error: supErr } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (supErr) {
    console.error('suppressed_emails upsert failed', { code: supErr.code, message: supErr.message, event_id: event.event_id })
    throw new Error('Failed to write suppression')
  }

  const { error: logErr } = await supabase.from('email_send_log').insert({
    message_id: event.data.message_id ?? null,
    template_name: 'system',
    recipient_email: email,
    status,
    error_message: message,
    metadata: null,
  })
  if (logErr) {
    console.error('email_send_log insert failed', { code: logErr.code, message: logErr.message, event_id: event.event_id })
    throw new Error('Failed to write send log')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event: any) => {
      await record(event, 'bounce', 'bounced', 'Permanent bounce — email address is invalid or rejected')
    },
    'email.complaint': async (event: any) => {
      await record(event, 'complaint', 'complained', 'Spam complaint — recipient marked email as spam')
    },
    'email.unsubscribed': async (event: any) => {
      await record(event, 'unsubscribe', 'suppressed', 'Recipient unsubscribed')
    },
  },
})

Deno.serve((req) => handler(req))
