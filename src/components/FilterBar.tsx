'use client'

import { useState, type RefObject } from 'react'
import type { TaskPriority, TaskStatus } from '@/lib/types'

interface Props {
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  search: string
  availableTags: string[]
  selectedTags: string[]
  searchRef?: RefObject<HTMLInputElement>
  onStatusChange: (v: TaskStatus | 'all') => void
  onPriorityChange: (v: TaskPriority | 'all') => void
  onSearchChange: (v: string) => void
  onTagToggle: (tag: string) => void
  onClear: () => void
}

const statusLabels: Record<TaskStatus | 'all', string> = {
  all: 'todos',
  open: 'aberta',
  done: 'concluída',
  cancelled: 'cancelada',
}

const priorityLabels: Record<TaskPriority | 'all', string> = {
  all: 'qualquer',
  high: 'alta',
  medium: 'média',
  low: 'baixa',
}

const priorityColors: Record<TaskPriority, string> = {
  high:   'text-hi border-hi/40 bg-hi/10',
  medium: 'text-amber border-amber/40 bg-amber/10',
  low:    'text-muted border-border',
}

export default function FilterBar({
  status, priority, search, availableTags, selectedTags, searchRef,
  onStatusChange, onPriorityChange, onSearchChange, onTagToggle, onClear,
}: Props) {
  const [tagsOpen, setTagsOpen] = useState(false)
  const hasFilters = status !== 'all' || priority !== 'all' || search || selectedTags.length > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">

        {/* Status pills */}
        <div className="flex items-center border border-border rounded overflow-hidden">
          {(['all', 'open', 'done', 'cancelled'] as const).map((s, i) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`
                px-2.5 py-1 text-xs font-mono transition-colors
                ${i !== 0 ? 'border-l border-border' : ''}
                ${status === s
                  ? 'bg-s2 text-tx'
                  : 'bg-surface text-muted hover:text-tx'
                }
              `}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>

        {/* Priority pills */}
        <div className="flex items-center border border-border rounded overflow-hidden">
          {(['all', 'high', 'medium', 'low'] as const).map((p, i) => (
            <button
              key={p}
              onClick={() => onPriorityChange(p)}
              className={`
                px-2.5 py-1 text-xs font-mono transition-colors
                ${i !== 0 ? 'border-l border-border' : ''}
                ${priority === p
                  ? p === 'all'
                    ? 'bg-s2 text-tx'
                    : `bg-s2 ${priorityColors[p as TaskPriority]}`
                  : 'bg-surface text-muted hover:text-tx'
                }
              `}
            >
              {priorityLabels[p]}
            </button>
          ))}
        </div>

        {/* Tags toggle */}
        {availableTags.length > 0 && (
          <button
            onClick={() => setTagsOpen(!tagsOpen)}
            className={`px-2.5 py-1 text-xs font-mono border rounded transition-colors ${
              tagsOpen || selectedTags.length > 0
                ? 'border-amber/40 text-amber bg-amber/5'
                : 'border-border text-muted hover:text-tx'
            }`}
          >
            tags {selectedTags.length > 0 ? `(${selectedTags.length})` : tagsOpen ? '▲' : '▼'}
          </button>
        )}

        {/* Search */}
        <div className="ml-auto flex items-center gap-2 bg-surface border border-border rounded px-2.5 py-1 focus-within:border-amber/40 transition-colors">
          <span className="text-muted text-xs">_</span>
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="buscar"
            className="bg-transparent text-xs text-tx placeholder-muted outline-none w-28 font-mono"
          />
          <kbd className="text-[10px] text-muted font-mono">⌘K</kbd>
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs font-mono text-muted hover:text-hi transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tag pills */}
      {tagsOpen && availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 animate-slide-in">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                selectedTags.includes(tag)
                  ? 'border-amber/50 text-amber bg-amber/10'
                  : 'border-border text-muted hover:text-tx hover:border-border2'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
