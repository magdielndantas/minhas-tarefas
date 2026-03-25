'use client'

import { useState } from 'react'
import type { TaskPriority, TaskStatus } from '@/lib/types'

interface Props {
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  search: string
  availableTags: string[]
  selectedTags: string[]
  onStatusChange: (v: TaskStatus | 'all') => void
  onPriorityChange: (v: TaskPriority | 'all') => void
  onSearchChange: (v: string) => void
  onTagToggle: (tag: string) => void
  onClear: () => void
}

export default function FilterBar({
  status, priority, search, availableTags, selectedTags,
  onStatusChange, onPriorityChange, onSearchChange, onTagToggle, onClear,
}: Props) {
  const [open, setOpen] = useState(false)
  const hasFilters = status !== 'all' || priority !== 'all' || search || selectedTags.length > 0

  const pill = (label: string, active: boolean, onClick: () => void, color?: string) => (
    <button
      key={label}
      onClick={onClick}
      className={`px-2.5 py-1 text-xs rounded-full font-mono transition-colors border ${
        active
          ? `${color ?? 'bg-violet-600 border-violet-500'} text-white`
          : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status */}
        {(['all', 'open', 'done', 'cancelled'] as const).map((s) =>
          pill(s === 'all' ? 'Todos' : s, status === s, () => onStatusChange(s))
        )}
        <span className="text-zinc-700 text-xs">·</span>
        {/* Priority */}
        {(['all', 'high', 'medium', 'low'] as const).map((p) =>
          pill(
            p === 'all' ? 'Qualquer' : p,
            priority === p,
            () => onPriorityChange(p),
            p === 'high' ? 'bg-red-600 border-red-500' : p === 'medium' ? 'bg-amber-600 border-amber-500' : undefined
          )
        )}

        {/* Search */}
        <div className="ml-auto flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="buscar..."
            className="bg-transparent text-xs text-zinc-300 placeholder-zinc-600 outline-none w-32"
          />
          <span className="text-zinc-700 text-[10px] font-mono">⌘K</span>
        </div>

        {/* Tags toggle */}
        {availableTags.length > 0 && (
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
          >
            tags {open ? '▲' : '▼'}
          </button>
        )}

        {/* Clear */}
        {hasFilters && (
          <button onClick={onClear} className="text-xs text-zinc-500 hover:text-red-400 font-mono">
            ✕ limpar
          </button>
        )}
      </div>

      {/* Tags */}
      {open && availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((tag) =>
            pill(tag, selectedTags.includes(tag), () => onTagToggle(tag))
          )}
        </div>
      )}
    </div>
  )
}
