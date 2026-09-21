'use server'

import { z } from 'zod'
import { deliverLead } from '@/lib/contact-delivery'
import { contactSchema, type ContactField, type ContactState } from '@/lib/validations/contact'

const read = (formData: FormData, key: string) => {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: campo invisível que humanos não preenchem. Finge sucesso para não dar pistas a bots.
  if (read(formData, 'website') !== '') {
    return { status: 'success', message: 'Mensagem enviada com sucesso.' }
  }

  const values = {
    name: read(formData, 'name'),
    email: read(formData, 'email'),
    whatsapp: read(formData, 'whatsapp'),
    challenge: read(formData, 'challenge'),
  }

  const parsed = contactSchema.safeParse(values)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ContactField, string>> = {}
    for (const [field, errors] of Object.entries(z.flattenError(parsed.error).fieldErrors)) {
      fieldErrors[field as ContactField] = (errors as string[])[0]
    }
    return { status: 'error', message: 'Corrija os campos assinalados.', fieldErrors, values }
  }

  try {
    await deliverLead(parsed.data)
  } catch (error) {
    console.error('[contact] Falha ao entregar lead:', error)
    return {
      status: 'error',
      message: 'Não foi possível enviar agora. Tente novamente ou contacte-nos por WhatsApp.',
      values,
    }
  }

  return { status: 'success', message: 'Obrigado! Recebemos o seu pedido e responderemos em breve.' }
}
