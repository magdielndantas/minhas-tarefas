import { NextResponse } from 'next/server'
import { readTasks } from '@/lib/storage'

/**
 * GET /api/tasks/summary
 * Returns a Claude-friendly digest of the current task state:
 * - Overall stats
 * - Open tasks (with comments and recent activity)
 * - Recently completed / cancelled tasks
 * - Overdue tasks
 * - Recent activity across all tasks (last 20 entries)
 *
 * Intended to be called by Claude Code at the start of a session
 * to understand what the user has been working on.
 */
export async function GET() {
  const store = readTasks()
  const now = new Date()

  const active = store.tasks.filter((t) => !t.deletedAt)
  const open = active.filter((t) => t.status === 'open')
  const done = active.filter((t) => t.status === 'done')
  const cancelled = active.filter((t) => t.status === 'cancelled')
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < now)

  // Recent activity across all tasks, sorted newest-first
  const recentActivity = active
    .flatMap((t) =>
      (t.activity ?? []).map((a) => ({ taskId: t.id, taskTitle: t.title, ...a }))
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 20)

  // Open tasks enriched with last comment and activity
  const openTasks = open.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    scope: t.scope,
    project: t.project,
    tags: t.tags,
    notes: t.notes,
    dueDate: t.dueDate,
    overdue: !!(t.dueDate && new Date(t.dueDate) < now),
    createdAt: t.createdAt,
    comments: t.comments ?? [],
    recentActivity: (t.activity ?? []).slice(-5),
  }))

  // Recently done/cancelled (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const recentlyClosed = [...done, ...cancelled]
    .filter((t) => t.doneAt && t.doneAt >= sevenDaysAgo)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      doneAt: t.doneAt,
      comments: t.comments ?? [],
    }))
    .sort((a, b) => new Date(b.doneAt!).getTime() - new Date(a.doneAt!).getTime())

  return NextResponse.json({
    generatedAt: now.toISOString(),
    stats: {
      total: active.length,
      open: open.length,
      done: done.length,
      cancelled: cancelled.length,
      overdue: overdue.length,
    },
    openTasks,
    recentlyClosed,
    recentActivity,
  })
}
