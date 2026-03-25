'use client'

import type { Task } from '@/lib/types'

type ScopeFilter = 'all' | 'local' | 'global'

interface Props {
  value: ScopeFilter
  onChange: (v: ScopeFilter) => void
  tasks: Task[]
  project?: string
}

export default function ScopeToggle({ value, onChange, tasks, project }: Props) {
  const open = tasks.filter((t) => t.status === 'open' && !t.deletedAt)
  const counts = {
    all:    open.length,
    local:  open.filter((t) => t.scope === 'local').length,
    global: open.filter((t) => t.scope === 'global').length,
  }

  const options: { key: ScopeFilter; label: string }[] = [
    { key: 'all',    label: 'todas' },
    { key: 'local',  label: project ? `local·${project}` : 'local' },
    { key: 'global', label: 'global' },
  ]

  return (
    <div className="flex items-center gap-0 border border-border rounded overflow-hidden">
      {options.map(({ key, label }, i) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors
            ${i !== 0 ? 'border-l border-border' : ''}
            ${value === key
              ? 'bg-s2 text-amber'
              : 'bg-surface text-muted hover:text-tx hover:bg-s2'
            }
          `}
        >
          {label}
          <span className={`
            text-[10px] px-1 py-0 rounded tabular-nums
            ${value === key ? 'bg-faint text-amber' : 'bg-faint text-muted'}
          `}>
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  )
}
