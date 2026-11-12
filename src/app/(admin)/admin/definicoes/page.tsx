import type { Metadata } from 'next'
import Link from 'next/link'
import { Palette } from 'lucide-react'
import { ContactEmailForm } from '@/components/admin/editor/contact-email-form'
import { DEFAULT_CONTACT_EMAIL } from '@/data/site'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Definições' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('private_settings').select('value').eq('key', 'contact_email').maybeSingle()
  const current = typeof data?.value === 'string' ? data.value : process.env.CONTACT_TO_EMAIL || DEFAULT_CONTACT_EMAIL

  return (
    <div className="max-w-3xl grid gap-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Definições</h1>
        <p className="mb-8 mt-2 text-muted-foreground">Configurações privadas — nunca aparecem no site.</p>
        <ContactEmailForm current={current} />
      </div>

      <Link href="/admin/definicoes/cores" className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Palette aria-hidden />
        </span>
        <span>
          <span className="block font-semibold">Cores do sistema</span>
          <span className="block text-sm text-muted-foreground">Personalize a paleta de cores de todo o site, claro e escuro, com pré-visualização. Reservado a Super Admins.</span>
        </span>
      </Link>
    </div>
  )
}
