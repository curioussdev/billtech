import type { Metadata } from 'next'
import { ProfileForm } from '@/components/portal/forms'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'A minha conta' }

export default async function PortalAccountPage() {
  const profile = await requireUser()

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">A minha conta</h1>
        <p className="mt-2 text-muted-foreground">Os seus dados de contacto na BillTech.</p>
      </header>
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <ProfileForm fullName={profile.full_name} company={profile.company} email={profile.email} />
      </div>
    </div>
  )
}
