'use server'

import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { siteUrl } from '@/data/site'
import { sendEmail } from '@/lib/contact-delivery'
import { logAudit } from '@/lib/audit'
import { requireAdmin, requireUser } from '@/lib/auth'
import { emailLayout, escapeHtml } from '@/lib/email-template'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Redireciona sempre para a página dedicada de definir password — nunca o Site URL por omissão da
 * Supabase (a landing page), que era a causa do problema reportado. Vai direto à página (sem passar
 * por `/auth/callback`): os links gerados pela Admin API (convite/recuperação) devolvem sempre a
 * sessão por fragmento da URL (`#access_token=...`), nunca por `?code=` — confirmado empiricamente
 * contra o projeto real. O fragmento nunca chega ao servidor, só o browser o vê; por isso quem trata
 * a sessão é o cliente Supabase do browser (`detectSessionInUrl`), não uma Route Handler.
 */
const PASSWORD_REDIRECT = `${siteUrl}/auth/definir-password`

/** 24 carateres alfanuméricos de `crypto.randomBytes` — entropia muito acima do necessário para uma password temporária de uso único. */
function generateTempPassword(): string {
  return randomBytes(18).toString('base64url')
}

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
 * Cria a conta do cliente via Supabase Admin API (`createUser`, com uma password temporária forte
 * gerada no servidor — o admin nunca a escolhe, e ela só existe em claro neste momento, para ir no
 * email). O trigger `handle_new_user` trata do `profiles` sozinho. O email (Resend, nunca o template
 * por omissão da Supabase) mostra a password temporária e inclui também um link de recuperação, para
 * o cliente poder escolher logo a sua própria password em vez de usar a temporária.
 */
export async function createClientAccount(input: unknown): Promise<CreateClientResult> {
  const admin = await requireAdmin()
  const parsed = createClientSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  const { email, fullName } = parsed.data
  const company = parsed.data.company || ''

  const db = createAdminClient()
  const tempPassword = generateTempPassword()
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, company },
  })

  if (error) {
    if (isAlreadyRegisteredError(error)) return { ok: false, message: 'Já existe uma conta com este email.' }
    console.error('[clients] createClientAccount createUser:', error)
    return { ok: false, message: 'Não foi possível criar a conta do cliente.' }
  }

  const clientId = data.user.id
  const firstName = fullName.split(/\s+/)[0]

  // Link para escolher password própria — mesmo sem o cliente nunca usar a temporária.
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: PASSWORD_REDIRECT } })
  if (linkError) console.error('[clients] geração do link de recuperação falhou (a conta foi criada na mesma):', linkError)

  // Falha no envio do email nunca desfaz a criação da conta — é apenas "best effort"
  // (o admin pode sempre reencaminhar os dados manualmente depois, a partir da ficha do cliente).
  try {
    await sendEmail({
      to: email,
      subject: 'Bem-vindo à BillTech — acesso ao portal de clientes',
      html: emailLayout({
        title: `Bem-vindo à BillTech, ${escapeHtml(firstName)}`,
        bodyHtml: `<p style="margin:0 0 12px">A nossa equipa criou a sua conta no portal de clientes da BillTech${company ? ` para <strong>${escapeHtml(company)}</strong>` : ''}.</p>
<p style="margin:0 0 12px">Pode entrar já com esta password temporária:</p>
<p style="margin:0 0 12px"><code style="display:inline-block;background:#f4f5f7;padding:8px 12px;border-radius:8px;font-size:16px;font-weight:bold;letter-spacing:0.5px">${escapeHtml(tempPassword)}</code></p>
<p style="margin:0 0 12px;color:#4b5563">Recomendamos que a substitua por uma à sua escolha assim que entrar — pode fazê-lo agora mesmo, sem precisar da password temporária, clicando no botão abaixo.</p>`,
        cta: linkData?.properties ? { label: 'Escolher a minha própria password', href: linkData.properties.action_link } : undefined,
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

export type RequestPasswordChangeResult = { ok: true } | { ok: false; message: string }

/**
 * O próprio utilizador (cliente ou admin) pede para alterar a password, a partir das suas
 * definições — nunca aceita o email de outra pessoa como destino: usa sempre o email já
 * confirmado da sessão autenticada, para não poder ser usado para atacar a conta de terceiros.
 */
export async function requestPasswordChange(): Promise<RequestPasswordChangeResult> {
  const user = await requireUser()

  const db = createAdminClient()
  const { data, error } = await db.auth.admin.generateLink({ type: 'recovery', email: user.email, options: { redirectTo: PASSWORD_REDIRECT } })
  if (error) {
    console.error('[clients] requestPasswordChange generateLink:', error)
    return { ok: false, message: 'Não foi possível gerar o pedido. Tente novamente.' }
  }

  await sendEmail({
    to: user.email,
    subject: 'BillTech — alterar a sua password',
    html: emailLayout({
      title: 'Pediu para alterar a sua password',
      bodyHtml: `<p style="margin:0 0 12px">Clique no botão abaixo para escolher uma nova password. Se não foi você a pedir, ignore este email — a sua password atual continua válida.</p>`,
      cta: { label: 'Escolher nova password', href: data.properties.action_link },
      footer: 'Recebeu este email porque alguém pediu a alteração da password desta conta na BillTech.',
    }),
  })

  return { ok: true }
}

const MAX_RESET_ATTEMPTS_PER_HOUR = 3

/**
 * "Esqueci a password", a partir do ecrã de login — sem sessão, por isso recebe o email por input.
 * Devolve sempre `{ ok: true }` com a mesma mensagem genérica, exista ou não conta com esse email:
 * nunca confirma nem nega a existência de uma conta a quem não está autenticado (evita que o
 * formulário sirva para descobrir que emails têm conta na BillTech). Limitado a 3 pedidos por email
 * por hora, para não servir para inundar a caixa de correio de outra pessoa.
 */
export async function forgotPassword(email: string): Promise<{ ok: true }> {
  const parsed = z.email().safeParse(email.trim().toLowerCase())
  if (!parsed.success) return { ok: true }

  const db = createAdminClient()
  const since = new Date(Date.now() - 3_600_000).toISOString()
  const { count } = await db.from('password_reset_requests').select('id', { count: 'exact', head: true }).eq('email', parsed.data).gte('requested_at', since)
  if ((count ?? 0) >= MAX_RESET_ATTEMPTS_PER_HOUR) return { ok: true }

  await db.from('password_reset_requests').insert({ email: parsed.data })

  const { data, error } = await db.auth.admin.generateLink({ type: 'recovery', email: parsed.data, options: { redirectTo: PASSWORD_REDIRECT } })
  if (error) return { ok: true } // conta inexistente ou outro erro — nunca revelamos qual ao chamador

  try {
    await sendEmail({
      to: parsed.data,
      subject: 'BillTech — repor a sua password',
      html: emailLayout({
        title: 'Pediu para repor a sua password',
        bodyHtml: `<p style="margin:0 0 12px">Clique no botão abaixo para escolher uma nova password. Se não foi você a pedir, ignore este email — a sua password atual continua válida.</p>`,
        cta: { label: 'Repor password', href: data.properties.action_link },
        footer: 'Recebeu este email porque alguém pediu a reposição da password desta conta na BillTech.',
      }),
    })
  } catch (emailError) {
    console.error('[clients] Falha ao enviar o email de reposição de password:', emailError)
  }

  return { ok: true }
}
