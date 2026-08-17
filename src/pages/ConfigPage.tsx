import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { api, type BusinessConfig } from '@/lib/api'

// Owner-only. Edits the axes issue #17 scopes for config CRUD: persona/
// tone/context/tool enable-disable/LLM provider. Adding a wholly new tool
// (not just toggling one that's already wired into a ToolProvider) is a
// v-next concern — see the "generic CRUD tool" idea in ADR 0008.
export function ConfigPage() {
  const { user } = useAuth()
  const businessId = user!.businessId!
  const token = user!.token

  const [config, setConfig] = useState<BusinessConfig | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .getConfig(token, businessId)
      .then(setConfig)
      .catch((err) => toast.error(err instanceof Error ? err.message : String(err)))
  }, [token, businessId])

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
      toast.success('Config saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (!config) return <p className="text-muted-foreground">Loading…</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Business Config</h1>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <div className="flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field label="Display name" value={config.display_name}
              onChange={(v) => setConfig({ ...config, display_name: v })} />
            <Field label="LLM provider" value={config.llm.provider}
              onChange={(v) => setConfig({ ...config, llm: { ...config.llm, provider: v } })} />
            <Field label="LLM model" value={config.llm.model}
              onChange={(v) => setConfig({ ...config, llm: { ...config.llm, model: v } })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Persona &amp; scope</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <TextField label="Persona" value={config.business_logic.persona}
              onChange={(v) => setConfig({ ...config, business_logic: { ...config.business_logic, persona: v } })} />
            <TextField label="Scope instructions" value={config.business_logic.scope_instructions}
              onChange={(v) => setConfig({ ...config, business_logic: { ...config.business_logic, scope_instructions: v } })} />
            <Field label="Tone" value={config.business_logic.tone ?? ''}
              onChange={(v) => setConfig({ ...config, business_logic: { ...config.business_logic, tone: v || null } })} />
            <TextField label="Out-of-scope response" value={config.business_logic.out_of_scope_response ?? ''}
              onChange={(v) => setConfig({ ...config, business_logic: { ...config.business_logic, out_of_scope_response: v || null } })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tools</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {config.tools.length === 0 && <p className="text-sm text-muted-foreground">No tools configured.</p>}
            {config.tools.map((t) => (
              <label key={t.name} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-input"
                  checked={t.enabled}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      tools: config.tools.map((tool) =>
                        tool.name === t.name ? { ...tool, enabled: e.target.checked } : tool,
                      ),
                    })
                  }
                />
                <Badge variant={t.enabled ? 'secondary' : 'outline'}>
                  {t.name}
                  {t.requires_confirmation ? ' (confirm)' : ''}
                </Badge>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <textarea
        className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
