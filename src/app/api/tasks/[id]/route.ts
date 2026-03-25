import { NextRequest, NextResponse } from 'next/server'
import { readTasks, writeTasks } from '@/lib/storage'
import type { Task } from '@/lib/types'

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }

    const body = await req.json() as Partial<Task>
    const store = readTasks()
    const idx = store.tasks.findIndex((t) => t.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'task not found' }, { status: 404 })
    }

    store.tasks[idx] = { ...store.tasks[idx], ...body }
    store.lastUpdated = new Date().toISOString()
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
