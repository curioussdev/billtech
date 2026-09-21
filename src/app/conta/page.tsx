import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'

export const metadata = { robots: { index: false } }

/** Atalho: envia cada utilizador para a sua área (dashboard ou área de cliente). */
export default async function AccountRedirect() {
  const profile = await requireUser()
  redirect(profile.role === 'admin' ? '/admin' : '/area-cliente')
}
