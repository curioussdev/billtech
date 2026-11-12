'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { AlertTriangle, Loader2, RotateCcw, Save } from 'lucide-react'
import { resetThemePalette, saveThemePalette } from '@/actions/theme'
import { Button } from '@/components/ui/button'
import { cssVarName, deriveFullTokens, type BaseTokens, type FullTokens } from '@/lib/theme/derive'
import { DEFAULT_DARK_BASE, DEFAULT_LIGHT_BASE } from '@/lib/theme/defaults'
import { contrastRatio, isValidHex } from '@/lib/theme/oklch'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark'
type Role = 'background' | 'foreground' | 'primary' | 'accent' | 'mutedForeground' | 'border'

const ROLES: { key: Role; label: string }[] = [
  { key: 'background', label: 'Fundo' },
  { key: 'foreground', label: 'Texto' },
  { key: 'primary', label: 'Cor principal da marca' },
  { key: 'accent', label: 'Cor de destaque' },
  { key: 'mutedForeground', label: 'Texto secundário' },
  { key: 'border', label: 'Contornos' },
]

function ColorField({ label, value, onCommit, placeholder, allowEmpty = false }: { label: string; value: string; onCommit: (hex: string) => void; placeholder?: string; allowEmpty?: boolean }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  const invalid = draft !== '' && !isValidHex(draft)

  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValidHex(draft) ? draft : value}
          onChange={(e) => {
            setDraft(e.target.value)
            onCommit(e.target.value)
          }}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-0.5"
          aria-label={`${label} — amostra`}
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            const next = e.target.value
            setDraft(next)
            if (isValidHex(next) || (allowEmpty && next === '')) onCommit(next)
          }}
          maxLength={7}
          spellCheck={false}
          aria-label={label}
          placeholder={placeholder}
          className={cn('h-9 w-24 rounded-lg border bg-background px-2.5 font-mono text-sm uppercase placeholder:normal-case placeholder:text-muted-foreground', invalid ? 'border-destructive text-destructive' : 'border-input')}
        />
      </div>
    </div>
  )
}

function PreviewCard({ tokens, dark, label }: { tokens: FullTokens; dark: boolean; label: string }) {
  const varStyle = Object.fromEntries((Object.keys(tokens) as (keyof FullTokens)[]).map((k) => [cssVarName(k), tokens[k]])) as React.CSSProperties

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-background p-5 text-foreground', dark && 'dark')} style={varStyle}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <h3 className="mt-2 text-lg font-bold">Exemplo de título</h3>
      <p className="mt-1 text-sm text-muted-foreground">Um parágrafo normal de texto, para ver como fica a leitura no dia a dia.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Botão principal</span>
        <span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Destaque</span>
      </div>
      <div className="mt-4 rounded-xl border border-border bg-card p-3 text-sm text-card-foreground">Um cartão com contorno, como os que aparecem em todo o site.</div>
    </div>
  )
}

function ContrastWarnings({ base, resolved }: { base: BaseTokens; resolved: FullTokens }) {
  const checks = [
    { label: 'Texto sobre o fundo', ratio: contrastRatio(base.foreground, base.background) },
    { label: 'Texto secundário sobre o fundo', ratio: contrastRatio(base.mutedForeground, base.background) },
    { label: 'Texto do botão principal', ratio: contrastRatio(resolved.primaryForeground, resolved.primary) },
    { label: 'Texto do botão de destaque', ratio: contrastRatio(resolved.accentForeground, resolved.accent) },
  ].filter((c) => c.ratio < 4.5)

  if (checks.length === 0) return null
  return (
    <ul className="grid gap-1.5">
      {checks.map((c) => (
        <li key={c.label} className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-300">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          Contraste baixo em &quot;{c.label}&quot; ({c.ratio.toFixed(1)}:1 — recomendado 4.5:1). Pode ser difícil de ler.
        </li>
      ))}
    </ul>
  )
}

function ThemeColumn({ title, base, onChange }: { title: string; base: BaseTokens; onChange: (next: BaseTokens) => void }) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  function setField(key: keyof BaseTokens) {
    return (hex: string) => onChange({ ...base, [key]: hex })
  }

  return (
    <div className="grid gap-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {ROLES.map((role) => (
          <ColorField key={role.key} label={role.label} value={base[role.key]} onCommit={setField(role.key)} />
        ))}
      </div>
      <details open={advancedOpen} onToggle={(e) => setAdvancedOpen(e.currentTarget.open)} className="rounded-xl border border-border/60 bg-muted/10 text-sm">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">Avançado — cor do texto dentro dos botões</summary>
        <div className="grid gap-4 border-t border-border/60 px-3 py-3 sm:grid-cols-2">
          <ColorField label="Texto do botão principal" placeholder="automático" allowEmpty value={base.primaryForeground ?? ''} onCommit={setField('primaryForeground')} />
          <ColorField label="Texto do botão de destaque" placeholder="automático" allowEmpty value={base.accentForeground ?? ''} onCommit={setField('accentForeground')} />
        </div>
      </details>
    </div>
  )
}

export function ThemePaletteEditor({ initialLight, initialDark }: { initialLight: BaseTokens; initialDark: BaseTokens }) {
  const [light, setLight] = useState<BaseTokens>(initialLight)
  const [dark, setDark] = useState<BaseTokens>(initialDark)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const resolvedLight = useMemo(() => deriveFullTokens(light), [light])
  const resolvedDark = useMemo(() => deriveFullTokens(dark), [dark])

  function save() {
    if (!window.confirm('Aplicar esta paleta a todo o site — landing, área de cliente e administração? Fica visível de imediato para todos.')) return
    setMessage(null)
    startTransition(async () => {
      const res = await saveThemePalette({ light, dark })
      setMessage({ ok: res.ok, text: res.ok ? 'Paleta guardada e aplicada a todo o site.' : res.message })
    })
  }

  function reset() {
    if (!window.confirm('Repor as cores predefinidas em todo o site? A personalização atual é perdida.')) return
    setMessage(null)
    startTransition(async () => {
      const res = await resetThemePalette()
      if (res.ok) {
        setLight(DEFAULT_LIGHT_BASE)
        setDark(DEFAULT_DARK_BASE)
      }
      setMessage({ ok: res.ok, text: res.ok ? 'Reposto para as cores predefinidas.' : res.message })
    })
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ThemeColumn title="Modo claro" base={light} onChange={setLight} />
        <ThemeColumn title="Modo escuro" base={dark} onChange={setDark} />
      </div>

      <div className="grid gap-4">
        <h3 className="text-sm font-bold">Pré-visualização — assim ficará antes de guardar</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <PreviewCard tokens={resolvedLight} dark={false} label="Modo claro" />
          <PreviewCard tokens={resolvedDark} dark={true} label="Modo escuro" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ContrastWarnings base={light} resolved={resolvedLight} />
          <ContrastWarnings base={dark} resolved={resolvedDark} />
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:flex-row sm:items-center sm:px-8">
        <Button type="button" onClick={save} disabled={pending} className="h-11 w-fit rounded-xl px-6">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Guardar e aplicar a todo o site
        </Button>
        <Button type="button" variant="outline" onClick={reset} disabled={pending} className="h-11 w-fit rounded-xl px-6">
          <RotateCcw aria-hidden /> Repor predefinições
        </Button>
        {message && (
          <p role="status" className={cn('text-sm font-medium', message.ok ? 'text-primary' : 'text-destructive')}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
