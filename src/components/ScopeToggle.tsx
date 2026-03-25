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

  const btn = (v: ScopeFilter, label: string) => (
    <button
      key={v}
      onClick={() => onChange(v)}
      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
        value === v
          ? 'bg-violet-600 text-white'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
      }`}
    >
      {label}
      <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
        value === v ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-500'
      }`}>
        {counts[v]}
      </span>
    </button>
  )

  return (
    <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1">
      {btn('all', 'Todas')}
      {btn('local', project ? `Local · ${project}` : 'Local')}
      {btn('global', 'Global')}
    </div>
  )
}
