'use client'

import { useState } from 'react'
import type { Task } from '@/lib/types'

interface Props {
  task: Task
  onUpdate: (id: number, patch: Partial<Task>) => void
  index?: number
}

const priorityLine: Record<Task['priority'], string> = {
  high:   'bg-hi',
  medium: 'bg-amber',
  low:    'bg-border2',
}

const priorityLabel: Record<Task['priority'], string> = {
  high:   'HI',
  medium: 'MD',
  low:    'LO',
}

const priorityText: Record<Task['priority'], string> = {
  high:   'text-hi',
  medium: 'text-amber',
  low:    'text-muted',
}

function formatDate(iso?: string) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export default function TaskCard({ task, onUpdate, index = 0 }: Props) {
  const [expanded, setExpanded] = useState(false)

  const isDone      = task.status === 'done'
  const isCancelled = task.status === 'cancelled'

  return (
    <div
      className={`
        group relative flex flex-col border-b border-border last:border-b-0
        transition-colors duration-150 hover:bg-s2
        row-enter
        ${isCancelled ? 'opacity-20' : isDone ? 'opacity-40' : ''}
      `}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Priority accent line — always thin, thick on hover */}
      <div className={`
        absolute left-0 top-0 bottom-0 transition-all duration-200
        w-px group-hover:w-[3px] ${priorityLine[task.priority]}
        opacity-30 group-hover:opacity-100
      `} />

      {/* Main row */}
      <div className="flex items-center gap-3 px-5 py-3 min-h-[44px]">

        {/* ID */}
        <span className="text-[11px] font-mono text-muted w-6 text-right flex-shrink-0 tabular-nums leading-none">
          #{task.id}
        </span>

        {/* Title — sans-serif para legibilidade */}
        <span
          onClick={() => setExpanded(!expanded)}
          className={`
            flex-1 font-sans text-[15px] font-medium cursor-pointer leading-snug
            transition-colors duration-100
            ${isDone
              ? 'line-through text-muted decoration-muted/60'
              : 'text-tx group-hover:text-white'
            }
          `}
        >
          {task.title}
        </span>

        {/* Tags — aparecem no hover */}
        <div className="
          flex items-center gap-1 flex-shrink-0
          opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0
          transition-all duration-150
        ">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] font-mono px-1.5 py-px bg-faint text-muted rounded leading-none">
              {tag}
            </span>
          ))}
        </div>

        {/* Scope */}
        <span className={`
          hidden sm:inline text-[11px] font-mono px-1.5 py-px rounded flex-shrink-0 leading-none
          transition-colors duration-150
          ${task.scope === 'global'
            ? 'text-accent bg-accent/10 border border-accent/20'
            : 'text-muted bg-faint'
          }
        `}>
          {task.scope === 'local' && task.project ? task.project : task.scope}
        </span>

        {/* Due date */}
        <span className="text-[11px] font-mono w-16 text-right flex-shrink-0 tabular-nums leading-none">
          {task.dueDate
            ? <span className={new Date(task.dueDate) < new Date() ? 'text-hi font-medium' : 'text-tx'}>
                {formatDate(task.dueDate)}
              </span>
            : <span className="text-border2">——</span>
          }
        </span>

        {/* Priority */}
        <span className={`text-[11px] font-mono font-medium w-5 text-center flex-shrink-0 leading-none ${priorityText[task.priority]}`}>
          {priorityLabel[task.priority]}
        </span>
      </div>

      {/* Action buttons — animação de entrada com grid trick */}
      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-out">
        <div className="overflow-hidden min-h-0">
          <div className="flex items-center gap-5 px-5 pb-2.5 ml-9
            opacity-0 group-hover:opacity-100
            -translate-y-1 group-hover:translate-y-0
            transition-all duration-150 delay-75
          ">
            {task.status !== 'done' && (
              <button
                onClick={() => onUpdate(task.id, { status: 'done', doneAt: new Date().toISOString() })}
                className="text-[12px] font-mono text-muted hover:text-ok active:scale-95 transition-all duration-100"
              >
                ✓ concluir
              </button>
            )}
            {task.status !== 'cancelled' && (
              <button
                onClick={() => onUpdate(task.id, { status: 'cancelled' })}
                className="text-[12px] font-mono text-muted hover:text-hi active:scale-95 transition-all duration-100"
              >
                ✗ cancelar
              </button>
            )}
            {task.status !== 'open' && (
              <button
                onClick={() => onUpdate(task.id, { status: 'open', doneAt: undefined })}
                className="text-[12px] font-mono text-muted hover:text-amber active:scale-95 transition-all duration-100"
              >
                ↩ reabrir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {expanded && (task.notes || task.dueDate) && (
        <div className="px-5 pb-3 ml-9 space-y-1 animate-fade-in">
          {task.notes && (
            <p className="text-sm font-sans text-muted italic leading-relaxed">{task.notes}</p>
          )}
          {task.dueDate && (
            <p className="text-[11px] font-mono text-muted">prazo: {formatDate(task.dueDate)}</p>
          )}
        </div>
      )}
    </div>
  )
}
