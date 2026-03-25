'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'
import StatsBar from '@/components/StatsBar'
import ScopeToggle from '@/components/ScopeToggle'
import FilterBar from '@/components/FilterBar'
import TaskCard from '@/components/TaskCard'
import EmptyState from '@/components/EmptyState'

type ScopeFilter = 'all' | 'local' | 'global'

function SkeletonCard() {
  return (
    <div className="border-l-2 border-l-zinc-700 bg-zinc-900 rounded-r px-3 py-2.5 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        <div className="h-3 bg-zinc-700 rounded w-48" />
        <div className="ml-auto h-3 bg-zinc-800 rounded w-12" />
      </div>
    </div>
  )
}

export default function Home() {
  const [allTasks, setAllTasks]       = useState<Task[]>([])
  const [loading, setLoading]         = useState(true)
  const [theme, setTheme]             = useState<'dark' | 'light'>('dark')

  const [scope, setScope]             = useState<ScopeFilter>('all')
  const [status, setStatus]           = useState<TaskStatus | 'all'>('open')
  const [priority, setPriority]       = useState<TaskPriority | 'all'>('all')
  const [search, setSearch]           = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?status=all&scope=all')
      const data = await res.json() as Task[]
      setAllTasks(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
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

  const availableTags = Array.from(
    new Set(allTasks.flatMap((t) => t.tags))
  ).sort()

  const hasFilters = scope !== 'all' || status !== 'open' || priority !== 'all' || search !== '' || selectedTags.length > 0

  const clearFilters = () => {
    setScope('all')
    setStatus('open')
    setPriority('all')
    setSearch('')
    setSelectedTags([])
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
    .filter((t) =>
      selectedTags.length === 0 ||
      selectedTags.some((tag) => t.tags.includes(tag))
    )

  const currentProject = allTasks
    .filter((t) => t.scope === 'local' && t.project)
    .map((t) => t.project!)[0]

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-500">minhas-tarefas</span>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {theme === 'dark' ? '☀ light' : '☾ dark'}
        </button>
      </div>

      {/* Stats */}
      <StatsBar tasks={allTasks} />

      {/* Scope */}
      <ScopeToggle
        value={scope}
        onChange={setScope}
        tasks={allTasks}
        project={currentProject}
      />

      {/* Filters */}
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

      {/* Task list */}
      <div className="space-y-1.5">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          filtered.map((task) => (
            <TaskCard key={task.id} task={task} onUpdate={updateTask} />
          ))
        )}
      </div>
    </main>
  )
}
