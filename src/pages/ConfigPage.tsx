import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ShieldCheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth } from '@/lib/auth'
import { humanize } from '@/lib/format'
import { api, type BusinessConfig } from '@/lib/api'

// Owner-only. Edits the axes issue #17 scopes for config CRUD: persona/
// tone/context/tool enable-disable/LLM provider. Adding a wholly new tool
// (not just toggling one that's already wired into a ToolProvider) is a
// v-next concern — see the "generic CRUD tool" idea in ADR 0008.
type Editable = Pick<BusinessConfig, 'display_name' | 'llm' | 'business_logic' | 'tools'>

function editable(config: BusinessConfig): Editable {
  return {
    display_name: config.display_name,
    llm: config.llm,
    business_logic: config.business_logic,
    tools: config.tools,
  }
}

export function ConfigPage() {
  const { user } = useAuth()
  const businessId = user!.businessId!
  const token = user!.token

  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .getConfig(token, businessId)
      .then((loaded) => {
        setConfig(loaded)
        setSaved(JSON.stringify(editable(loaded)))
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : String(err)))
  }, [token, businessId])

  const dirty = config !== null && saved !== null && JSON.stringify(editable(config)) !== saved

  async function save() {
    if (!config) return
    setSaving(true)
    try {
      const updated = await api.patchConfig(token, businessId, {
        display_name: config.display_name,
        llm: { provider: config.llm.provider, model: config.llm.model },
        business_logic: {
          persona: config.business_logic.persona,
          scope_instructions: config.business_logic.scope_instructions,
          tone: config.business_logic.tone,
          out_of_scope_response: config.business_logic.out_of_scope_response,
        },
        tools: config.tools,
      })
      setConfig(updated)
      setSaved(JSON.stringify(editable(updated)))
      toast.success('Changes saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    if (!saved) return
    setConfig((current) => (current ? { ...current, ...(JSON.parse(saved) as Editable) } : current))
  }

  if (!config) return <ConfigSkeleton />

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Agent settings"
        description="How your assistant introduces itself, what it will talk about, and which parts of your data it is allowed to touch."
      />

      <Section
        title="Identity"
        hint="The name customers see, and the model doing the answering."
      >
        <Field
          label="Business name"
          help="What the assistant calls your business when it introduces itself."
          value={config.display_name}
          onChange={(v) => setConfig({ ...config, display_name: v })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Model provider"
            help="e.g. anthropic"
            value={config.llm.provider}
            onChange={(v) => setConfig({ ...config, llm: { ...config.llm, provider: v } })}
          />
          <Field
            label="Model"
            help="The provider's own model ID."
            value={config.llm.model}
            onChange={(v) => setConfig({ ...config, llm: { ...config.llm, model: v } })}
          />
        </div>
      </Section>

      <Section
        title="Voice & scope"
        hint="The instructions the assistant is given before it reads a single customer message."
      >
        <TextField
          label="Persona"
          help="Who it is. A couple of sentences on its role and manner — “You are the front-desk assistant for a small hotel.”"
          rows={4}
          value={config.business_logic.persona}
          onChange={(v) =>
            setConfig({ ...config, business_logic: { ...config.business_logic, persona: v } })
          }
        />
        <TextField
          label="What it can help with"
          help="Anything outside this gets the fallback reply below instead of an answer."
          rows={4}
          value={config.business_logic.scope_instructions}
          onChange={(v) =>
            setConfig({
              ...config,
              business_logic: { ...config.business_logic, scope_instructions: v },
            })
          }
        />
        <Field
          label="Tone"
          optional
          help="A short steer — “warm and brief”, “formal”."
          value={config.business_logic.tone ?? ''}
          onChange={(v) =>
            setConfig({ ...config, business_logic: { ...config.business_logic, tone: v || null } })
          }
        />
        <TextField
          label="Fallback reply"
          optional
          help="What it says when a question falls outside the scope above."
          rows={2}
          value={config.business_logic.out_of_scope_response ?? ''}
          onChange={(v) =>
            setConfig({
              ...config,
              business_logic: { ...config.business_logic, out_of_scope_response: v || null },
            })
          }
        />
      </Section>

      <Section
        title="What it can do"
        hint="Each of your tables gives the assistant four abilities. Turn off anything you'd rather handle yourself."
      >
        <ToolGroups
          tools={config.tools}
          onToggle={(name, enabled) =>
            setConfig({
              ...config,
              tools: config.tools.map((tool) => (tool.name === name ? { ...tool, enabled } : tool)),
            })
          }
        />
      </Section>

      {/* Save used to live only in the page header, three viewports above
          the last field on this form. It follows the edits down instead. */}
      {dirty && (
        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl bg-card p-3 shadow-lg ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between sm:pl-4">
          <span className="text-sm text-muted-foreground">You have unsaved changes.</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={discard} disabled={saving}>
              Discard
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Section label and its explanation sit beside the fields on a wide screen
// rather than stacked above them — it keeps the form itself at a readable
// measure without capping the whole page narrower than every other screen
// in the app, which is what `max-w-2xl` on the outer container used to do.
function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    // `minmax(0,1fr)`, never a bare `1fr`: an auto/`1fr` grid track is
    // floored at its content's min-content width, and the tool rows below
    // contain `truncate` (i.e. `white-space: nowrap`) description lines
    // whose min-content is the whole string. On a phone that floor was
    // 576px inside a 390px viewport — the entire page scrolled sideways.
    <section className="grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-border pt-8 first:border-0 first:pt-0 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground text-pretty">{hint}</p>
      </div>
      <div className="flex max-w-xl flex-col gap-5">{children}</div>
    </section>
  )
}

const VERB_LABEL: Record<string, string> = {
  list: 'Look things up',
  create: 'Add new entries',
  update: 'Change existing entries',
  delete: 'Delete entries',
}

// Tool names arrive as `list_room_types` / `create_room_types` — four per
// table, in whatever order the backend built them. Flat, that is twenty
// identical-looking checkboxes; grouped by the table they act on, it is
// five short lists an owner can actually reason about.
function ToolGroups({
  tools,
  onToggle,
}: {
  tools: BusinessConfig['tools']
  onToggle: (name: string, enabled: boolean) => void
}) {
  const groups = useMemo(() => {
    const byGroup = new Map<string, { verb: string | null; tool: BusinessConfig['tools'][number] }[]>()
    for (const tool of tools) {
      const match = /^(list|create|update|delete)_(.+)$/.exec(tool.name)
      const key = match ? humanize(match[2]) : 'Other'
      const entry = { verb: match ? match[1] : null, tool }
      byGroup.set(key, [...(byGroup.get(key) ?? []), entry])
    }
    const order = ['list', 'create', 'update', 'delete']
    for (const entries of byGroup.values()) {
      entries.sort((a, b) => order.indexOf(a.verb ?? '') - order.indexOf(b.verb ?? ''))
    }
    return [...byGroup.entries()].sort(([a], [b]) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)))
  }, [tools])

  if (tools.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Nothing yet. Create a table under Database and its abilities appear here.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map(([group, entries]) => (
        <div key={group} className="flex flex-col gap-1">
          <span className="px-1 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group}
          </span>
          <div className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            {entries.map(({ verb, tool }) => (
              <div
                key={tool.name}
                className="flex items-center justify-between gap-4 px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {verb ? VERB_LABEL[verb] : humanize(tool.name)}
                    {tool.requires_confirmation && (
                      <span
                        className="flex items-center gap-1 text-xs font-normal text-muted-foreground"
                        title="The assistant must ask the customer to confirm before this runs."
                      >
                        <ShieldCheckIcon className="size-3.5" />
                        asks first
                      </span>
                    )}
                  </span>
                  <span className="truncate text-xs text-muted-foreground" title={tool.description}>
                    {tool.description || tool.name}
                  </span>
                </span>
                <Switch
                  checked={tool.enabled}
                  onCheckedChange={(checked) => onToggle(tool.name, checked)}
                  aria-label={`${verb ? VERB_LABEL[verb] : tool.name} — ${group}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

interface FieldProps {
  label: string
  help?: string
  optional?: boolean
  value: string
  onChange: (v: string) => void
}

function Field({ label, help, optional, value, onChange }: FieldProps) {
  const id = label.toLowerCase().replace(/\W+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">Optional</span>}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      {help && <p className="text-xs text-muted-foreground text-pretty">{help}</p>}
    </div>
  )
}

function TextField({ label, help, optional, rows, value, onChange }: FieldProps & { rows?: number }) {
  const id = label.toLowerCase().replace(/\W+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">Optional</span>}
      </Label>
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      {help && <p className="text-xs text-muted-foreground text-pretty">{help}</p>}
    </div>
  )
}

function ConfigSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
          <Skeleton className="h-5 w-32" />
          <div className="flex max-w-xl flex-col gap-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
