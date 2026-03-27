import { NextRequest, NextResponse } from 'next/server'
import { readTasks, writeTasks } from '@/lib/storage'
import type { Author, Comment } from '@/lib/types'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

  const store = readTasks()
  const task = store.tasks.find((t) => t.id === id)
  if (!task) return NextResponse.json({ error: 'task not found' }, { status: 404 })

  return NextResponse.json(task.comments ?? [])
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) return NextResponse.json({ error: 'invalid id' }, { status: 400 })

    const body = await req.json() as { body: string; author?: Author }
    if (!body.body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

    const author: Author = body.author ?? 'user'
    const store = readTasks()
    const idx = store.tasks.findIndex((t) => t.id === id)
    if (idx === -1) return NextResponse.json({ error: 'task not found' }, { status: 404 })

    const now = new Date().toISOString()
    const task = store.tasks[idx]
    const comments = task.comments ?? []

    const comment: Comment = {
      id: comments.length === 0 ? 1 : Math.max(...comments.map((c) => c.id)) + 1,
      author,
      body: body.body.trim(),
      createdAt: now,
    }

    store.tasks[idx] = {
      ...task,
      comments: [...comments, comment],
      activity: [
        ...(task.activity ?? []),
        { at: now, author, action: 'added comment' },
      ],
    }
    store.lastUpdated = now
    writeTasks(store)

    return NextResponse.json(comment, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
