'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

/** Marca o tour de boas-vindas como concluído — nunca mais volta a aparecer para este utilizador. */
export async function completeOnboarding(): Promise<void> {
  const user = await requireUser()
  await createAdminClient().from('profiles').update({ onboarding_completed_at: new Date().toISOString() }).eq('id', user.id)
  revalidatePath('/area-cliente', 'layout')
}
