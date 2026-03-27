'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Task, TaskPriority, TaskScope, TaskStatus } from '@/lib/types'
import Comments from '@/components/Comments'
import { markTaskRead } from '@/lib/notifications'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(iso?: string, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', opts ?? { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtFull(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const statusLabel: Record<TaskStatus, string> = {
  open: 'aberta', done: 'concluída', cancelled: 'cancelada',
}
const statusColor: Record<TaskStatus, string> = {
  open: 'text-ok border-ok/30 bg-ok/10',
  done: 'text-muted border-border',
  cancelled: 'text-muted border-border',
}
const priorityColor: Record<TaskPriority, string> = {
  high:   'text-hi border-hi/30 bg-hi/10',
  medium: 'text-amber border-amber/30 bg-amber/10',
  low:    'text-muted border-border',
}
const priorityLabel: Record<TaskPriority, string> = {
  high: 'alta', medium: 'média', low: 'baixa',
}

// ─── editable field ──────────────────────────────────────────────────────────

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 py-3 border-b border-border items-start">
      <span className="text-[11px] font-mono text-muted uppercase tracking-widest pt-0.5">{label}</span>
      <div className="text-sm font-sans text-tx">{children}</div>
    </div>
  )
}

function EditableText({
  value, onSave, multiline = false, placeholder,
}: {
  value: string
  onSave: (v: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed) onSave(trimmed)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className="text-left w-full group/edit"
      >
        <span className="font-sans text-sm text-tx group-hover/edit:text-white transition-colors">
          {value || <span className="text-muted italic">{placeholder ?? 'clique para editar'}</span>}
        </span>
        <span className="ml-2 text-[10px] font-mono text-border2 group-hover/edit:text-muted transition-colors">✎</span>
      </button>
    )
  }

  if (multiline) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }}
        rows={4}
        className="w-full bg-s2 border border-amber/30 rounded px-3 py-2 text-sm font-sans text-tx outline-none resize-none"
      />
    )
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') setEditing(false)
      }}
      className="w-full bg-s2 border border-amber/30 rounded px-3 py-1.5 text-sm font-sans text-tx outline-none"
    />
  )
}

function SelectPill<T extends string>({
  value, options, labels, colors, onSelect,
}: {
  value: T
  options: T[]
  labels: Record<T, string>
  colors: Record<T, string>
  onSelect: (v: T) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
            value === opt ? colors[opt] : 'border-border text-muted hover:text-tx hover:border-border2'
          }`}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function TaskDetail() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [task, setTask]           = useState<Task | null>(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetch_ = useCallback(async () => {
    try {
      const res  = await fetch(`/api/tasks?status=all&scope=all&includeDeleted=true`)
      const all  = await res.json() as Task[]
      const found = all.find((t) => t.id === Number(id))
      if (!found) { setNotFound(true); return }
      setTask(found)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetch_() }, [fetch_])

  // Marcar como lida ao abrir
  useEffect(() => { markTaskRead(Number(id)) }, [id])

  // Auto-refresh a cada 5s (mesmo intervalo do dashboard)
  useEffect(() => {
    const id = setInterval(fetch_, 5000)
    return () => clearInterval(id)
  }, [fetch_])

  const patch = async (updates: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    fetch_()
  }

  const deleteTask = async () => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    router.push('/')
  }

  // ── loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-muted font-mono text-sm animate-pulse">carregando...</span>
      </div>
    )
  }

  if (notFound || !task) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3">
        <span className="text-4xl font-mono text-border2">∅</span>
        <p className="text-muted font-mono text-sm">tarefa não encontrada</p>
        <button onClick={() => router.push('/')} className="text-xs font-mono text-amber hover:text-tx transition-colors mt-2">
          ← voltar
        </button>
      </div>
    )
  }

  const isOverdue = task.dueDate && task.status === 'open' && new Date(task.dueDate) < new Date()

  return (
    <div className="min-h-screen bg-bg">

      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-[11px] font-mono text-muted hover:text-tx transition-colors flex items-center gap-1.5"
          >
            ← minhas-tarefas
          </button>
          <span className="text-[11px] font-mono text-border2">#{task.id}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8 row-enter">

        {/* Title */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {/* Status dot */}
            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
              task.status === 'open' ? 'bg-ok' : 'bg-border2'
            }`} />
            <h1 className={`font-display font-bold text-2xl leading-snug flex-1 ${
              task.status === 'done' ? 'line-through text-muted' : 'text-tx'
            }`}>
              <EditableText
                value={task.title}
                onSave={(v) => patch({ title: v })}
              />
            </h1>
          </div>

          {/* Status + Priority badges */}
          <div className="flex items-center gap-2 ml-5">
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${statusColor[task.status]}`}>
              {statusLabel[task.status]}
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${priorityColor[task.priority]}`}>
              {priorityLabel[task.priority]}
            </span>
            {task.scope === 'global' && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border text-accent border-accent/30 bg-accent/10">
                global
              </span>
            )}
            {task.project && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border text-muted border-border bg-faint">
                {task.project}
              </span>
            )}
            {task.source === 'todo-scan' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-muted border border-border">
                todo-scan
              </span>
            )}
          </div>
        </div>

        {/* Status actions */}
        <div className="flex gap-2 flex-wrap">
          {task.status !== 'done' && (
            <button
              onClick={() => patch({ status: 'done', doneAt: new Date().toISOString() })}
              className="px-3 py-1.5 text-xs font-mono border border-ok/30 text-ok hover:bg-ok/10 rounded transition-colors active:scale-95"
            >
              ✓ concluir
            </button>
          )}
          {task.status !== 'cancelled' && (
            <button
              onClick={() => patch({ status: 'cancelled' })}
              className="px-3 py-1.5 text-xs font-mono border border-hi/30 text-hi hover:bg-hi/10 rounded transition-colors active:scale-95"
            >
              ✗ cancelar
            </button>
          )}
          {task.status !== 'open' && (
            <button
              onClick={() => patch({ status: 'open', doneAt: undefined })}
              className="px-3 py-1.5 text-xs font-mono border border-amber/30 text-amber hover:bg-amber/10 rounded transition-colors active:scale-95"
            >
              ↩ reabrir
            </button>
          )}
        </div>

        {/* Fields */}
        <div className="border-t border-border">

          <Field label="prioridade">
            <SelectPill
              value={task.priority}
              options={['high', 'medium', 'low'] as TaskPriority[]}
              labels={{ high: 'alta', medium: 'média', low: 'baixa' }}
              colors={priorityColor}
              onSelect={(v) => patch({ priority: v })}
            />
          </Field>

          <Field label="scope">
            <SelectPill
              value={task.scope}
              options={['local', 'global'] as TaskScope[]}
              labels={{ local: task.project ? `local · ${task.project}` : 'local', global: 'global' }}
              colors={{
                local:  'text-tx border-border2 bg-faint',
                global: 'text-accent border-accent/30 bg-accent/10',
              }}
              onSelect={(v) => patch({ scope: v })}
            />
          </Field>

          <Field label="projeto">
            <EditableText
              value={task.project ?? ''}
              onSave={(v) => patch({ project: v })}
              placeholder="sem projeto"
            />
          </Field>

          <Field label="prazo">
            <div className="flex items-center gap-3">
              <input
                type="date"
                defaultValue={task.dueDate?.slice(0, 10) ?? ''}
                onChange={(e) => patch({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="bg-s2 border border-border rounded px-2.5 py-1 text-sm font-mono text-tx outline-none focus:border-amber/50 transition-colors"
              />
              {task.dueDate && (
                <>
                  <span className={`text-xs font-mono ${isOverdue ? 'text-hi' : 'text-muted'}`}>
                    {isOverdue ? '⚠ vencida' : fmt(task.dueDate)}
                  </span>
                  <button
                    onClick={() => patch({ dueDate: undefined })}
                    className="text-[11px] font-mono text-muted hover:text-hi transition-colors"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          </Field>

          <Field label="tags">
            <EditableText
              value={task.tags.join(', ')}
              onSave={(v) => patch({ tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
              placeholder="tag1, tag2, ..."
            />
          </Field>

          <Field label="notas">
            <EditableText
              value={task.notes ?? ''}
              onSave={(v) => patch({ notes: v })}
              multiline
              placeholder="adicionar notas..."
            />
          </Field>

          <Field label="criada em">
            <span className="text-sm font-mono text-muted">{fmtFull(task.createdAt)}</span>
          </Field>

          {task.doneAt && (
            <Field label="concluída em">
              <span className="text-sm font-mono text-muted">{fmtFull(task.doneAt)}</span>
            </Field>
          )}

          <Field label="origem">
            <span className="text-sm font-mono text-muted">{task.source}</span>
          </Field>

        </div>

        {/* Comments */}
        <div className="space-y-3 pt-2">
          <h2 className="text-[11px] font-mono text-muted uppercase tracking-widest">comentários</h2>
          <Comments taskId={task.id} comments={task.comments ?? []} onAdded={fetch_} />
        </div>

        {/* Activity log */}
        {(task.activity ?? []).length > 0 && (
          <details className="group">
            <summary className="text-[11px] font-mono text-muted uppercase tracking-widest cursor-pointer hover:text-tx transition-colors list-none flex items-center gap-1.5">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              atividade ({task.activity.length})
            </summary>
            <div className="mt-3 space-y-1.5 border-l border-border pl-4">
              {[...task.activity].reverse().map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`text-[10px] font-mono mt-0.5 ${a.author === 'claude' ? 'text-accent' : 'text-muted'}`}>
                    {a.author === 'claude' ? '⬡' : '◎'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-tx">{a.action}</span>
                    <span className="ml-2 text-[10px] font-mono text-muted">{fmtFull(a.at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Danger zone */}
        <div className="pt-4">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[11px] font-mono text-muted hover:text-hi transition-colors border border-transparent hover:border-hi/20 hover:bg-hi/5 px-3 py-1.5 rounded"
            >
              excluir tarefa
            </button>
          ) : (
            <div className="flex items-center gap-3 animate-fade-in">
              <span className="text-[11px] font-mono text-hi">confirmar exclusão?</span>
              <button
                onClick={deleteTask}
                className="text-[11px] font-mono text-hi border border-hi/30 hover:bg-hi/10 px-2.5 py-1 rounded transition-colors active:scale-95"
              >
                sim, excluir
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] font-mono text-muted hover:text-tx transition-colors"
              >
                cancelar
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
