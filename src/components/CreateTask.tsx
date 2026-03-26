'use client'

import { useState, useRef, useEffect } from 'react'
import type { Task, TaskPriority, TaskScope } from '@/lib/types'

interface Props {
  onCreated: () => void
  defaultProject?: string
}

export default function CreateTask({ onCreated, defaultProject }: Props) {
  const [open, setOpen]         = useState(false)
  const [title, setTitle]       = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [scope, setScope]       = useState<TaskScope>('local')
  const [dueDate, setDueDate]   = useState('')
  const [saving, setSaving]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const reset = () => {
    setTitle(''); setPriority('medium'); setScope('local'); setDueDate(''); setOpen(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          status: 'open',
          priority,
          scope,
          project: scope === 'local' ? defaultProject : undefined,
          tags: scope === 'local' && defaultProject ? [defaultProject] : [],
          dueDate: dueDate || undefined,
          source: 'manual',
        } satisfies Partial<Task>),
      })
      reset()
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  const priorityColors: Record<TaskPriority, string> = {
    high:   'text-hi border-hi/40 bg-hi/10',
    medium: 'text-amber border-amber/40 bg-amber/10',
    low:    'text-muted border-border',
  }

  if (!open) {
    return (
      <button
        data-create
        onClick={() => setOpen(true)}
        className="
          w-full flex items-center gap-2 px-5 py-3 border-b border-border
          text-muted hover:text-tx hover:bg-s2 transition-colors duration-150
          text-sm font-sans group
        "
      >
        <span className="text-border2 group-hover:text-amber transition-colors font-mono text-base leading-none">+</span>
        <span>nova tarefa</span>
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="border-b border-amber/20 bg-s2 animate-slide-in"
    >
      {/* Title input */}
      <div className="flex items-center gap-3 px-5 py-3">
        <span className="text-amber font-mono text-base w-6 text-right leading-none flex-shrink-0">+</span>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="descrição da tarefa..."
          className="flex-1 bg-transparent font-sans text-[15px] font-medium text-tx placeholder-muted outline-none"
          onKeyDown={(e) => e.key === 'Escape' && reset()}
        />
      </div>

      {/* Options row */}
      <div className="flex items-center gap-2 px-5 pb-3 ml-9 flex-wrap">

        {/* Priority */}
        {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
              priority === p ? priorityColors[p] : 'border-border text-muted hover:text-tx'
            }`}
          >
            {p === 'high' ? 'alta' : p === 'medium' ? 'média' : 'baixa'}
          </button>
        ))}

        <span className="text-border2 font-mono">·</span>

        {/* Scope */}
        {(['local', 'global'] as TaskScope[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
              scope === s
                ? s === 'global'
                  ? 'text-accent border-accent/40 bg-accent/10'
                  : 'text-tx border-border2 bg-faint'
                : 'border-border text-muted hover:text-tx'
            }`}
          >
            {s === 'local' && defaultProject ? `local·${defaultProject}` : s}
          </button>
        ))}

        <span className="text-border2 font-mono">·</span>

        {/* Due date */}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="bg-transparent text-[11px] font-mono text-muted hover:text-tx outline-none border-b border-transparent hover:border-border2 transition-colors"
        />

        {/* Actions */}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="text-[11px] font-mono text-muted hover:text-tx transition-colors"
          >
            cancelar
          </button>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="text-[11px] font-mono text-amber hover:text-tx disabled:opacity-40 transition-colors"
          >
            {saving ? '...' : '✓ criar'}
          </button>
        </div>
      </div>
    </form>
  )
}
