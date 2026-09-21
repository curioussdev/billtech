'use server'

import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { deliverLead } from '@/lib/contact-delivery'

export type ClientMessageState = { status: 'idle' | 'success' | 'error'; message?: string }

const schema = z.object({ message: z.string().trim().min(10, 'Escreva pelo menos 10 caracteres.').max(2000, 'Máximo de 2000 caracteres.') })

/** Mensagem de um cliente autenticado: identidade vem da sessão, nunca do formulário. */
export async function sendClientMessage(_prev: ClientMessageState, formData: FormData): Promise<ClientMessageState> {
  const profile = await requireUser()

  const raw = formData.get('message')
  const parsed = schema.safeParse({ message: typeof raw === 'string' ? raw : '' })
  if (!parsed.success) return { status: 'error', message: z.flattenError(parsed.error).fieldErrors.message?.[0] ?? 'Mensagem inválida.' }

  try {
    await deliverLead({
      name: profile.full_name || profile.email,
      email: profile.email,
      whatsapp: '',
      challenge: parsed.data.message,
      userId: profile.id,
    })
  } catch (error) {
    console.error('[client] Falha ao entregar mensagem:', error)
    return { status: 'error', message: 'Não foi possível enviar agora. Tente novamente dentro de instantes.' }
  }
  return { status: 'success', message: 'Mensagem enviada. A equipa BillTech responderá por email.' }
}
