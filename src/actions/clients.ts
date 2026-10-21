'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendEmail } from '@/lib/contact-delivery'
import { logAudit } from '@/lib/audit'
import { requireAdmin } from '@/lib/auth'
import { emailLayout, escapeHtml } from '@/lib/email-template'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Server Action para o admin criar a conta de um cliente diretamente a partir de `/admin/clientes`
 * — ex.: quando José fecha um contrato offline e quer dar acesso ao portal de imediato, sem esperar
 * que o cliente se autorregiste em «Entrar → Criar conta».
 */

const createClientSchema = z.object({
  email: z.email('Indique um email válido.'),
  fullName: z.string().trim().min(2, 'Indique o nome completo.').max(160),
  company: z.string().trim().max(160).optional(),
})

export type CreateClientResult = { ok: true; clientId: string } | { ok: false; message: string }

/**
 * A Supabase Auth sinaliza "email já registado" de formas diferentes consoante a versão do GoTrue:
 * nas mais recentes vem um `code` estável (`email_exists` / `user_already_exists`); em instalações
 * mais antigas só vem a mensagem em inglês. Verificamos os dois para não depender só de uma string frágil.
 */
function isAlreadyRegisteredError(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!error) return false
  if (error.code === 'email_exists' || error.code === 'user_already_exists') return true
  return /already (been )?registered|already exists/i.test(error.message ?? '')
}

/**
 * Cria a conta do cliente via Supabase Admin API (`generateLink` com `type: 'invite'`): isto cria a
 * linha em `auth.users` (o trigger `handle_new_user` trata do `profiles` sozinho) e devolve um
 * `action_link` seguro para o cliente definir a própria password — nunca geramos nem vemos essa
 * password. O email de convite é o nosso próprio (Resend), não o template por omissão da Supabase.
 */
export async function createClientAccount(input: unknown): Promise<CreateClientResult> {
  const admin = await requireAdmin()
  const parsed = createClientSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const { email, fullName } = parsed.data
  const company = parsed.data.company || ''

  const db = createAdminClient()
  const { data, error } = await db.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { data: { full_name: fullName, company } },
  })

  if (error) {
    if (isAlreadyRegisteredError(error)) return { ok: false, message: 'Já existe uma conta com este email.' }
    console.error('[clients] createClientAccount generateLink:', error)
    return { ok: false, message: 'Não foi possível criar a conta do cliente.' }
  }

  const clientId = data.user.id
  const firstName = fullName.split(/\s+/)[0]

  // Falha no envio do email nunca desfaz a criação da conta — é apenas "best effort"
  // (o admin pode sempre reencaminhar o link manualmente depois, a partir da ficha do cliente).
  try {
    await sendEmail({
      to: email,
      subject: 'Bem-vindo à BillTech — defina a sua password',
      html: emailLayout({
        title: `Bem-vindo à BillTech, ${escapeHtml(firstName)}`,
        bodyHtml: `<p style="margin:0 0 12px">A nossa equipa criou a sua conta no portal de clientes da BillTech${company ? ` para <strong>${escapeHtml(company)}</strong>` : ''}.</p>
<p style="margin:0 0 12px">Para aceder, defina a sua password pessoal clicando no botão abaixo.</p>`,
        cta: { label: 'Definir password e entrar', href: data.properties.action_link },
        footer: 'Recebeu este email porque a equipa BillTech criou uma conta de cliente para si. Se não esperava este email, contacte-nos.',
      }),
    })
  } catch (emailError) {
    console.error('[clients] Falha ao enviar o email de boas-vindas:', emailError)
  }

  await logAudit({ admin, action: 'CREATE_CLIENT', resource: 'clientes', targetId: clientId, details: { email, company: company || null } })
  revalidatePath('/admin/clientes')
  return { ok: true, clientId }
}
