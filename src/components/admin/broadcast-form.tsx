'use client'

import { useActionState, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Send } from 'lucide-react'
import { sendBroadcast, type BroadcastState } from '@/actions/broadcast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type ClientOption = { id: string; name: string; email: string; company: string }

const initial: BroadcastState = { status: 'idle' }

export function BroadcastForm({ clients, preselected }: { clients: ClientOption[]; preselected: string[] }) {
  const [state, action, pending] = useActionState(sendBroadcast, initial)
  const [mode, setMode] = useState<'all' | 'selected'>(preselected.length > 0 ? 'selected' : 'all')
  const [selected, setSelected] = useState<Set<string>>(new Set(preselected))
  const [query, setQuery] = useState('')
  const errors = state.fieldErrors ?? {}

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? clients.filter((c) => `${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q)) : clients
  }, [clients, query])

  const recipientCount = mode === 'all' ? clients.length : selected.size

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Envio em massa é irreversível: pede confirmação
    if (recipientCount > 1 && !window.confirm(`Enviar esta mensagem a ${recipientCount} clientes? Esta ação não pode ser desfeita.`)) event.preventDefault()
  }

  if (clients.length === 0) return <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">Ainda não há clientes registados para receber mensagens.</p>

  return (
    <form action={action} onSubmit={onSubmit} className="grid gap-6">
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">Para quem?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['all', `Todos os clientes (${clients.length})`, 'A mensagem chega a todas as contas de cliente.'],
              ['selected', 'Escolher clientes', 'Um cliente ou uma seleção à sua escolha.'],
            ] as const
          ).map(([value, title, hint]) => (
            <label key={value} className="flex cursor-pointer flex-col gap-1 rounded-xl border border-border bg-card p-4 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/70">
              <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => setMode(value)} className="sr-only" />
              <span className="font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </label>
          ))}
        </div>

        {mode === 'selected' && (
          <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="pesquisa" className="sr-only">
                Pesquisar clientes
              </Label>
              <Input id="pesquisa" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por nome, email ou empresa…" className="h-9 max-w-sm" />
              <Button type="button" variant="outline" size="sm" onClick={() => setSelected(new Set([...selected, ...filtered.map((c) => c.id)]))}>
                Selecionar {query ? 'visíveis' : 'todos'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Limpar
              </Button>
              <span className="ml-auto text-sm text-muted-foreground" role="status">
                {selected.size} selecionados
              </span>
            </div>
            <ul className="grid max-h-72 gap-1 overflow-y-auto pr-1" aria-label="Clientes">
              {filtered.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted">
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={selected.has(c.id)} onChange={(e) => toggle(c.id, e.target.checked)} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{c.name || c.email}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.email}
                        {c.company ? ` · ${c.company}` : ''}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
              {filtered.length === 0 && <li className="px-2 py-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</li>}
            </ul>
            {/* Os selecionados seguem no formulário mesmo que estejam fora do filtro de pesquisa */}
            {[...selected].map((id) => (
              <input key={id} type="hidden" name="recipient" value={id} />
            ))}
          </div>
        )}
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="subject">Assunto</Label>
        <Input id="subject" name="subject" required maxLength={150} defaultValue={state.values?.subject} className="h-11 text-base" placeholder="Ex.: Nova funcionalidade disponível na sua conta" aria-invalid={errors.subject ? true : undefined} aria-describedby={errors.subject ? 'subject-error' : undefined} />
        {errors.subject && (
          <p id="subject-error" className="text-sm font-medium text-destructive">
            {errors.subject}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="body">Mensagem</Label>
        <Textarea id="body" name="body" required minLength={10} maxLength={5000} rows={9} defaultValue={state.values?.body} className="text-base" placeholder="Escreva a mensagem. Cada cliente recebe-a com «Olá, {primeiro nome}» no início." aria-invalid={errors.body ? true : undefined} aria-describedby={errors.body ? 'body-error' : undefined} />
        {errors.body && (
          <p id="body-error" className="text-sm font-medium text-destructive">
            {errors.body}
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="sendEmail" defaultChecked className="mt-0.5 size-4 accent-[var(--primary)]" />
        <span>
          <strong>Enviar também por email.</strong> <span className="text-muted-foreground">A mensagem fica sempre disponível no portal do cliente; o email avisa-o de que chegou.</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending || recipientCount === 0} className="h-11 rounded-xl px-6">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />} Enviar a {recipientCount} {recipientCount === 1 ? 'cliente' : 'clientes'}
        </Button>
      </div>

      <div role="status" aria-live="polite">
        {state.status === 'success' && (
          <p className="text-sm font-medium text-primary">
            {state.message}{' '}
            {state.broadcastId && (
              <Link href={`/admin/comunicacoes/${state.broadcastId}`} className="underline underline-offset-2">
                Ver detalhe
              </Link>
            )}
          </p>
        )}
      </div>
      <div role="alert">{state.status === 'error' && <p className="text-sm font-medium text-destructive">{state.message}</p>}</div>
    </form>
  )
}
