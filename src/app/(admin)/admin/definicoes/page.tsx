import type { Metadata } from 'next'
import { ContactEmailForm } from '@/components/admin/editor/contact-email-form'
import { DEFAULT_CONTACT_EMAIL } from '@/data/site'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Definições' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('private_settings').select('value').eq('key', 'contact_email').maybeSingle()
  const current = typeof data?.value === 'string' ? data.value : process.env.CONTACT_TO_EMAIL || DEFAULT_CONTACT_EMAIL

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-black tracking-tight">Definições</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Configurações privadas — nunca aparecem no site.</p>
      <ContactEmailForm current={current} />
    </div>
  )
}
