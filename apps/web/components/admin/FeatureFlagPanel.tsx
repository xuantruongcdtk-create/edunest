'use client'
import { forwardRef, useState, type HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Card } from '../primitives/Card'
import { Badge } from '../primitives/Badge'

interface FeatureFlag {
  key:         string
  enabled:     boolean
  description: string | null
  rollout_pct: number
}

interface FeatureFlagPanelProps extends HTMLAttributes<HTMLDivElement> {
  flags: FeatureFlag[]
}

export const FeatureFlagPanel = forwardRef<HTMLDivElement, FeatureFlagPanelProps>(
  ({ className, flags, ...props }, ref) => {
    const [states, setStates] = useState<Record<string, boolean>>(
      Object.fromEntries(flags.map((f) => [f.key, f.enabled])),
    )
    const [saving, setSaving] = useState<string | null>(null)

    const toggle = async (key: string) => {
      const next = !states[key]
      setSaving(key)
      setStates((s) => ({ ...s, [key]: next }))
      try {
        await fetch('/api/v1/admin/flags', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ key, enabled: next }),
        })
      } catch {
        setStates((s) => ({ ...s, [key]: !next })) // rollback
      } finally {
        setSaving(null)
      }
    }

    return (
      <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-display font-semibold text-gray-800">Feature Flags</h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {flags.map((flag) => (
            <li key={flag.key} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-medium text-gray-800">{flag.key}</code>
                  {flag.rollout_pct < 100 && (
                    <Badge variant="warning">{flag.rollout_pct}%</Badge>
                  )}
                </div>
                {flag.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{flag.description}</p>
                )}
              </div>
              <button
                onClick={() => toggle(flag.key)}
                disabled={saving === flag.key}
                aria-checked={states[flag.key]}
                role="switch"
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ml-4',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  'disabled:opacity-50',
                  states[flag.key] ? 'bg-primary' : 'bg-gray-200',
                )}
              >
                <span className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  states[flag.key] ? 'translate-x-5' : 'translate-x-0.5',
                )} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    )
  },
)
FeatureFlagPanel.displayName = 'FeatureFlagPanel'
