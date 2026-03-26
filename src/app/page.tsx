'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'
import StatsBar from '@/components/StatsBar'
import ScopeToggle from '@/components/ScopeToggle'
import FilterBar from '@/components/FilterBar'
import TaskCard from '@/components/TaskCard'
import CreateTask from '@/components/CreateTask'
import EmptyState from '@/components/EmptyState'

type ScopeFilter = 'all' | 'local' | 'global'

const SKELETON_WIDTHS = ['max-w-xs', 'max-w-sm', 'max-w-[200px]']

function SkeletonRow({ i }: { i: number }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3 min-h-[44px] border-b border-border"
      style={{ animationDelay: `${i * 0.08}s` }}
    >
      <div className="w-6 h-2 skeleton-shimmer rounded" />
      <div className={`flex-1 h-3 skeleton-shimmer rounded ${SKELETON_WIDTHS[i % 3]}`} />
      <div className="w-12 h-2 skeleton-shimmer rounded" />
      <div className="w-5 h-2 skeleton-shimmer rounded" />
    </div>
  )
}

export default function Home() {
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [loading, setLoading]   = useState(true)
  const [theme, setTheme]       = useState<'dark' | 'light'>('dark')

  const [scope, setScope]             = useState<ScopeFilter>('all')
  const [status, setStatus]           = useState<TaskStatus | 'all'>('open')
  const [priority, setPriority]       = useState<TaskPriority | 'all'>('all')
  const [search, setSearch]           = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [projectFilter, setProjectFilter] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex]   = useState<number | null>(null)
  const searchRef    = useRef<HTMLInputElement>(null)
  const filteredRef  = useRef<Task[]>([])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?status=all&scope=all')
      const data = await res.json() as Task[]
      setAllTasks(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  // Initial fetch
  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Auto-refresh a cada 5s
  useEffect(() => {
    const id = setInterval(fetchTasks, 5000)
    return () => clearInterval(id)
  }, [fetchTasks])

  // Light mode
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  // Atalhos de teclado globais
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA'

      // ⌘K — focar busca (sempre)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
        setFocusedIndex(null)
        return
      }

      // Não interceptar j/k/etc enquanto usuário digita
      if (typing) return

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((i) => Math.min((i ?? -1) + 1, filteredRef.current.length - 1))
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((i) => Math.max((i ?? filteredRef.current.length) - 1, 0))
      } else if (e.key === 'Escape') {
        setFocusedIndex(null)
      } else if ((e.key === 'Enter' || e.key === ' ') && focusedIndex !== null) {
        e.preventDefault()
        const t = filteredRef.current[focusedIndex]
        if (!t) return
        if (t.status === 'open') updateTask(t.id, { status: 'done', doneAt: new Date().toISOString() })
        else updateTask(t.id, { status: 'open', doneAt: undefined })
      } else if (e.key === 'x' && focusedIndex !== null) {
        const t = filteredRef.current[focusedIndex]
        if (t?.status !== 'cancelled') updateTask(t.id, { status: 'cancelled' })
      } else if (e.key === 'e' && focusedIndex !== null) {
        const t = filteredRef.current[focusedIndex]
        if (t) window.location.href = `/tasks/${t.id}`
      } else if (e.key === 'n') {
        // foca no input de criação
        document.querySelector<HTMLButtonElement>('button[data-create]')?.click()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focusedIndex])  // filteredRef sempre atualizado, não precisa na dep array

  // Título dinâmico
  useEffect(() => {
    const open = allTasks.filter((t) => t.status === 'open' && !t.deletedAt).length
    document.title = open > 0 ? `(${open}) minhas-tarefas` : 'minhas-tarefas'
  }, [allTasks])

  // Optimistic update + sync em background
  const updateTask = async (id: number, patch: Partial<Task>) => {
    setAllTasks((prev) =>
      prev.map((t) => t.id === id ? { ...t, ...patch } : t)
    )
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    fetchTasks()
  }

  const availableTags  = Array.from(new Set(allTasks.flatMap((t) => t.tags))).sort()
  const allProjects    = Array.from(new Set(allTasks.filter((t) => t.project).map((t) => t.project!))).sort()
  const currentProject = allTasks.find((t) => t.scope === 'local' && t.project)?.project

  const hasFilters = scope !== 'all' || status !== 'open' || priority !== 'all' || search !== '' || selectedTags.length > 0 || projectFilter !== null

  const clearFilters = () => {
    setScope('all'); setStatus('open'); setPriority('all')
    setSearch(''); setSelectedTags([]); setProjectFilter(null)
  }

  const filtered = filteredRef.current = allTasks
    .filter((t) => !t.deletedAt)
    .filter((t) => scope === 'all' || t.scope === scope)
    .filter((t) => status === 'all' || t.status === status)
    .filter((t) => priority === 'all' || t.priority === priority)
    .filter((t) => !projectFilter || t.project === projectFilter)
    .filter((t) =>
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes?.toLowerCase().includes(search.toLowerCase()) ?? false)
    )
    .filter((t) => selectedTags.length === 0 || selectedTags.some((tag) => t.tags.includes(tag)))

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-xl tracking-tight text-tx leading-none">
              minhas<span className="text-amber">-</span>tarefas
            </h1>
            <StatsBar tasks={allTasks} />
          </div>
          <div className="flex items-center gap-4 mt-0.5">
            {/* Export */}
            <div className="flex items-center gap-2">
              <a
                href="/api/tasks/export?format=markdown"
                className="text-[11px] font-mono text-muted hover:text-tx transition-colors"
                title="exportar Markdown"
              >
                ↓ md
              </a>
              <a
                href="/api/tasks/export?format=csv"
                className="text-[11px] font-mono text-muted hover:text-tx transition-colors"
                title="exportar CSV"
              >
                ↓ csv
              </a>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-[11px] font-mono text-muted hover:text-tx transition-colors"
              aria-label="toggle theme"
            >
              {theme === 'dark' ? '◐ light' : '◑ dark'}
            </button>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <ScopeToggle
              value={scope}
              onChange={(v) => { setScope(v); setProjectFilter(null) }}
              tasks={allTasks}
              project={currentProject}
            />
            {/* Project filter — só aparece se houver mais de um projeto */}
            {allProjects.length > 1 && (
              <div className="flex items-center gap-1 flex-wrap">
                {allProjects.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProjectFilter(projectFilter === p ? null : p)}
                    className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
                      projectFilter === p
                        ? 'border-amber/40 text-amber bg-amber/10'
                        : 'border-border text-muted hover:text-tx hover:border-border2'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FilterBar
            status={status}
            priority={priority}
            search={search}
            availableTags={availableTags}
            selectedTags={selectedTags}
            searchRef={searchRef}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onSearchChange={setSearch}
            onTagToggle={(tag) =>
              setSelectedTags((prev) =>
                prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
              )
            }
            onClear={clearFilters}
          />
        </div>
      </div>

      {/* Column headers */}
      {!loading && filtered.length > 0 && (
        <div className="max-w-3xl mx-auto w-full border-b border-border">
          <div className="flex items-center gap-3 px-5 py-1.5 text-[10px] font-mono text-muted uppercase tracking-widest">
            <span className="w-6 text-right">#</span>
            <span className="flex-1">título</span>
            <span className="hidden sm:inline w-20 text-right">prazo</span>
            <span className="w-5 text-center">pr</span>
          </div>
        </div>
      )}

      {/* Task list */}
      <main className="max-w-3xl mx-auto w-full flex-1">
        <div className="border-x border-border min-h-full">
          <CreateTask onCreated={fetchTasks} defaultProject={currentProject} />
          {loading ? (
            [0, 1, 2].map((i) => <SkeletonRow key={i} i={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            filtered.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                index={i}
                focused={focusedIndex === i}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto w-full px-6 py-3 border-t border-border mt-auto">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-muted">
            {filtered.length} {filtered.length === 1 ? 'tarefa' : 'tarefas'}
            {hasFilters && ' filtradas'}
          </p>
          <div className="flex items-center gap-3 text-[10px] font-mono text-border2">
            <span><kbd className="text-muted">j/k</kbd> navegar</span>
            <span><kbd className="text-muted">space</kbd> concluir</span>
            <span><kbd className="text-muted">e</kbd> detalhe</span>
            <span><kbd className="text-muted">x</kbd> cancelar</span>
            <span><kbd className="text-muted">n</kbd> nova</span>
            <span><kbd className="text-muted">⌘K</kbd> buscar</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
