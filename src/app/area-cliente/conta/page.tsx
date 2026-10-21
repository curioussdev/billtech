import type { Metadata } from 'next'
import { ChangePasswordButton } from '@/components/portal/change-password-button'
import { ProfileForm } from '@/components/portal/forms'
import { SensitiveField } from '@/components/portal/sensitive-field'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'A minha conta' }

export default async function PortalAccountPage() {
  const profile = await requireUser()
  const supabase = await createClient()
  const { data: pending } = await supabase
    .from('profile_change_requests')
    .select('field, requested_value, created_at')
    .eq('client_id', profile.id)
    .eq('status', 'pendente')

  const pendingNif = pending?.find((r) => r.field === 'nif')
  const pendingEmail = pending?.find((r) => r.field === 'email')

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">A minha conta</h1>
        <p className="mt-2 text-muted-foreground">Os seus dados de contacto na BillTech.</p>
      </header>
      <div className="grid max-w-lg gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <ProfileForm fullName={profile.full_name} company={profile.company} />
        <SensitiveField field="email" currentValue={profile.email} pendingRequest={pendingEmail ? { requestedValue: pendingEmail.requested_value, createdAt: pendingEmail.created_at } : undefined} />
        <SensitiveField
          field="nif"
          currentValue={profile.nif}
          allowFirstFill
          pendingRequest={pendingNif ? { requestedValue: pendingNif.requested_value, createdAt: pendingNif.created_at } : undefined}
        />
      </div>
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-bold">Segurança</h2>
        <p className="text-sm text-muted-foreground">Por segurança, a alteração de password é sempre confirmada por email.</p>
        <ChangePasswordButton />
      </div>
    </div>
  )
}
