import { NextRequest, NextResponse } from 'next/server'
import { readTasks, writeTasks } from '@/lib/storage'
import type { ActivityEntry, Author, Task } from '@/lib/types'

type Params = { params: { id: string } }

const TRACKED_FIELDS: (keyof Task)[] = ['status', 'priority', 'title', 'notes', 'dueDate', 'scope', 'project', 'tags']

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }

    const body = await req.json() as Partial<Task> & { _author?: Author }
    const author: Author = body._author ?? 'user'
    delete body._author

    const store = readTasks()
    const idx = store.tasks.findIndex((t) => t.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'task not found' }, { status: 404 })
    }

    const prev = store.tasks[idx]
    const now = new Date().toISOString()

    // Build activity entries for changed tracked fields
    const newEntries: ActivityEntry[] = []
    for (const field of TRACKED_FIELDS) {
      if (!(field in body)) continue
      const from = JSON.stringify(prev[field])
      const to = JSON.stringify(body[field])
      if (from !== to) {
        newEntries.push({ at: now, author, action: `${field}: ${from} → ${to}` })
      }
    }

    store.tasks[idx] = {
      ...prev,
      ...body,
      activity: [...(prev.activity ?? []), ...newEntries],
    }
    store.lastUpdated = now
    writeTasks(store)

    return NextResponse.json(store.tasks[idx])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }

    const store = readTasks()
    const idx = store.tasks.findIndex((t) => t.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'task not found' }, { status: 404 })
    }

    store.tasks[idx].deletedAt = new Date().toISOString()
    store.lastUpdated = new Date().toISOString()
    writeTasks(store)

    return NextResponse.json(store.tasks[idx])
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
