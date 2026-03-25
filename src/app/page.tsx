'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'
import StatsBar from '@/components/StatsBar'
import ScopeToggle from '@/components/ScopeToggle'
import FilterBar from '@/components/FilterBar'
import TaskCard from '@/components/TaskCard'
import EmptyState from '@/components/EmptyState'

type ScopeFilter = 'all' | 'local' | 'global'

const SKELETON_WIDTHS = ['max-w-xs', 'max-w-sm', 'max-w-[200px]']

function SkeletonRow({ i }: { i: number }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 min-h-[44px] border-b border-border"
      style={{ animationDelay: `${i * 0.08}s` }}>
      <div className="w-6 h-2 skeleton-shimmer rounded" />
      <div className={`flex-1 h-3 skeleton-shimmer rounded ${SKELETON_WIDTHS[i % 3]}`} />
      <div className="w-12 h-2 skeleton-shimmer rounded" />
      <div className="w-5 h-2 skeleton-shimmer rounded" />
    </div>
  )
}

export default function Home() {
  const [allTasks, setAllTasks]   = useState<Task[]>([])
  const [loading, setLoading]     = useState(true)
  const [theme, setTheme]         = useState<'dark' | 'light'>('dark')

  const [scope, setScope]         = useState<ScopeFilter>('all')
  const [status, setStatus]       = useState<TaskStatus | 'all'>('open')
  const [priority, setPriority]   = useState<TaskPriority | 'all'>('all')
  const [search, setSearch]       = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?status=all&scope=all')
      const data = await res.json() as Task[]
      setAllTasks(data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const updateTask = async (id: number, patch: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    fetchTasks()
  }

  const availableTags = Array.from(new Set(allTasks.flatMap((t) => t.tags))).sort()

  const hasFilters = scope !== 'all' || status !== 'open' || priority !== 'all' || search !== '' || selectedTags.length > 0

  const clearFilters = () => {
    setScope('all'); setStatus('open'); setPriority('all'); setSearch(''); setSelectedTags([])
  }

  const filtered = allTasks
    .filter((t) => !t.deletedAt)
    .filter((t) => scope === 'all' || t.scope === scope)
    .filter((t) => status === 'all' || t.status === status)
    .filter((t) => priority === 'all' || t.priority === priority)
    .filter((t) =>
      search === '' ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes?.toLowerCase().includes(search.toLowerCase()) ?? false)
    )
    .filter((t) => selectedTags.length === 0 || selectedTags.some((tag) => t.tags.includes(tag)))

  const currentProject = allTasks.find((t) => t.scope === 'local' && t.project)?.project

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
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-[11px] font-mono text-muted hover:text-tx transition-colors mt-0.5 flex-shrink-0"
            aria-label="toggle theme"
          >
            {theme === 'dark' ? '◐ light' : '◑ dark'}
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-3 space-y-3">
          <ScopeToggle
            value={scope}
            onChange={setScope}
            tasks={allTasks}
            project={currentProject}
          />
          <FilterBar
            status={status}
            priority={priority}
            search={search}
            availableTags={availableTags}
            selectedTags={selectedTags}
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
        <div className="max-w-3xl mx-auto w-full px-4 border-b border-border">
          <div className="flex items-center gap-3 px-4 py-1.5 text-[10px] font-mono text-muted uppercase tracking-widest">
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
          {loading ? (
            [0,1,2].map((i) => <SkeletonRow key={i} i={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
          ) : (
            filtered.map((task, i) => (
              <TaskCard key={task.id} task={task} onUpdate={updateTask} index={i} />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto w-full px-6 py-3 border-t border-border mt-auto">
        <p className="text-[10px] font-mono text-muted">
          {filtered.length} {filtered.length === 1 ? 'tarefa' : 'tarefas'}
          {hasFilters && ' filtradas'}
        </p>
      </footer>
    </div>
  )
}
