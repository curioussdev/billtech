'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogIn, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

/**
 * Estado de sessão resolvido no cliente para a landing page continuar estática.
 * "/conta" reencaminha para a dashboard (admin) ou para a área de cliente.
 */
export function AuthLink({ className }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured) return null

  return (
    <Button render={<Link href={signedIn ? '/conta' : '/entrar'} />} nativeButton={false} variant="ghost" className={className}>
      {signedIn ? <UserRound data-icon="inline-start" aria-hidden /> : <LogIn data-icon="inline-start" aria-hidden />}
      {signedIn ? 'A minha conta' : 'Entrar'}
    </Button>
  )
}
