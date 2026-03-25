import { NextRequest, NextResponse } from 'next/server'
import { readTasks, writeTasks, getNextId } from '@/lib/storage'
import type { Task, TaskPriority, TaskScope, TaskStatus } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const scope     = searchParams.get('scope') ?? 'all'
    const status    = searchParams.get('status') ?? 'open'
    const priority  = searchParams.get('priority')
    const project   = searchParams.get('project')
    const tags      = searchParams.get('tags')
    const search    = searchParams.get('search')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const store = readTasks()
    let tasks = store.tasks

    if (!includeDeleted) {
      tasks = tasks.filter((t) => !t.deletedAt)
    }

    if (scope !== 'all') {
      tasks = tasks.filter((t) => t.scope === scope)
    }

    if (status !== 'all') {
      tasks = tasks.filter((t) => t.status === status)
    }

    if (priority) {
      tasks = tasks.filter((t) => t.priority === priority)
    }

    if (project) {
      tasks = tasks.filter((t) => t.project === project)
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim())
      tasks = tasks.filter((t) => tagList.some((tag) => t.tags.includes(tag)))
    }

    if (search) {
      const q = search.toLowerCase()
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes?.toLowerCase().includes(q) ?? false) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }
    tasks = tasks.sort((a, b) => {
      const p = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (p !== 0) return p
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json(tasks)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Omit<Task, 'id' | 'createdAt'>

    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const validStatuses: TaskStatus[] = ['open', 'done', 'cancelled']
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high']
    const validScopes: TaskScope[] = ['local', 'global']

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 })
    }
    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json({ error: 'invalid priority' }, { status: 400 })
    }
    if (body.scope && !validScopes.includes(body.scope)) {
      return NextResponse.json({ error: 'invalid scope' }, { status: 400 })
    }

    const store = readTasks()
    const newTask: Task = {
      id: getNextId(store.tasks),
      title: body.title,
      status: body.status ?? 'open',
      priority: body.priority ?? 'medium',
      scope: body.scope ?? 'local',
      project: body.project,
      tags: body.tags ?? [],
      notes: body.notes,
      dueDate: body.dueDate,
      source: body.source ?? 'manual',
      createdAt: new Date().toISOString(),
      doneAt: body.doneAt,
    }

    store.tasks.push(newTask)
    store.lastUpdated = new Date().toISOString()
    writeTasks(store)

    return NextResponse.json(newTask, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
