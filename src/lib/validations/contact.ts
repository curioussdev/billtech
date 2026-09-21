import { z } from 'zod'

export const contactFields = ['name', 'email', 'whatsapp', 'challenge'] as const
export type ContactField = (typeof contactFields)[number]

const PHONE_REGEX = /^\+?[0-9 ()-]{7,20}$/

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Indique o seu nome.').max(100, 'O nome é demasiado longo.'),
  email: z.email('Indique um email válido.').max(254, 'O email é demasiado longo.'),
  // Opcional: aceita vazio ou um número em formato internacional/local
  whatsapp: z
    .string()
    .trim()
    .refine((v) => v === '' || PHONE_REGEX.test(v), 'Indique um número válido, ex.: +351 912 345 678.'),
  challenge: z
    .string()
    .trim()
    .min(10, 'Conte-nos um pouco mais (mínimo 10 caracteres).')
    .max(2000, 'Máximo de 2000 caracteres.'),
})

export type ContactInput = z.infer<typeof contactSchema>

export type ContactState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Partial<Record<ContactField, string>>
  /** Valores submetidos, para repor o formulário quando há erros */
  values?: Partial<Record<ContactField, string>>
}
