'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types'

interface Props {
  task: Task
  onUpdate: (id: number, patch: Partial<Task>) => void
}

const priorityBorder: Record<Task['priority'], string> = {
  high:   'border-l-red-500',
  medium: 'border-l-amber-500',
  low:    'border-l-zinc-600',
}

const priorityDot: Record<Task['priority'], string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-500',
  low:    'bg-zinc-500',
}

function formatDate(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function TaskCard({ task, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false)

  const isDone      = task.status === 'done'
  const isCancelled = task.status === 'cancelled'

  const baseOpacity = isCancelled ? 'opacity-30' : isDone ? 'opacity-50' : ''

  return (
    <div
      className={`border-l-2 ${priorityBorder[task.priority]} bg-zinc-900 rounded-r px-3 py-2.5 group transition-opacity ${baseOpacity}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[task.priority]}`} />

        <span
          className={`flex-1 text-sm cursor-pointer ${isDone ? 'line-through text-zinc-500' : 'text-zinc-100'}`}
          onClick={() => setExpanded(!expanded)}
        >
          {task.title}
        </span>

        {/* Tags */}
        <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
              {tag}
            </span>
          ))}
        </div>

        {/* Scope badge */}
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
          task.scope === 'local' ? 'bg-zinc-800 text-zinc-400' : 'bg-violet-950 text-violet-400'
        }`}>
          {task.scope === 'local' && task.project ? task.project : task.scope}
        </span>

        {/* Timestamp */}
        <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0">
          {task.dueDate ? `prazo: ${formatDate(task.dueDate)}` : formatDate(task.createdAt)}
        </span>

        {/* ID */}
        <span className="text-[10px] font-mono text-zinc-700 flex-shrink-0">#{task.id}</span>
      </div>

      {/* Hover actions */}
      <div className="hidden group-hover:flex items-center gap-3 mt-1.5 ml-3.5">
        {task.status !== 'done' && (
          <button
            onClick={() => onUpdate(task.id, { status: 'done', doneAt: new Date().toISOString() })}
            className="text-[11px] text-zinc-500 hover:text-green-400 font-mono transition-colors"
          >
            ✓ Concluir
          </button>
        )}
        {task.status !== 'cancelled' && (
          <button
            onClick={() => onUpdate(task.id, { status: 'cancelled' })}
            className="text-[11px] text-zinc-500 hover:text-red-400 font-mono transition-colors"
          >
            ✗ Cancelar
          </button>
        )}
        {task.status !== 'open' && (
          <button
            onClick={() => onUpdate(task.id, { status: 'open', doneAt: undefined })}
            className="text-[11px] text-zinc-500 hover:text-violet-400 font-mono transition-colors"
          >
            ↩ Reabrir
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (task.notes || task.dueDate) && (
        <div className="mt-2 ml-3.5 space-y-1">
          {task.notes && (
            <p className="text-xs text-zinc-400">{task.notes}</p>
          )}
          {task.dueDate && (
            <p className="text-xs font-mono text-zinc-500">prazo: {formatDate(task.dueDate)}</p>
          )}
        </div>
      )}
    </div>
  )
}
