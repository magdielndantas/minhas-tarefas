import { NextRequest, NextResponse } from 'next/server'
import { readTasks } from '@/lib/storage'
import type { Task } from '@/lib/types'

function toMarkdown(tasks: Task[]): string {
  const open      = tasks.filter((t) => t.status === 'open'      && !t.deletedAt)
  const done      = tasks.filter((t) => t.status === 'done'      && !t.deletedAt)
  const cancelled = tasks.filter((t) => t.status === 'cancelled' && !t.deletedAt)

  const row = (t: Task) => {
    const due   = t.dueDate ? ` · prazo: ${t.dueDate.slice(0, 10)}` : ''
    const proj  = t.project ? ` · ${t.project}` : ''
    const tags  = t.tags.length ? ` [${t.tags.join(', ')}]` : ''
    return `- [ ] #${t.id} **${t.title}**${tags} · ${t.scope}${proj} · ${t.priority}${due}`
  }
  const doneRow = (t: Task) => `- [x] #${t.id} ~~${t.title}~~`

  const lines: string[] = [
    '# minhas-tarefas',
    `> exportado em ${new Date().toLocaleString('pt-BR')}`,
    '',
  ]

  if (open.length) {
    lines.push('## Abertas', '', ...open.map(row), '')
  }
  if (done.length) {
    lines.push('## Concluídas', '', ...done.map(doneRow), '')
  }
  if (cancelled.length) {
    lines.push('## Canceladas', '', ...cancelled.map(doneRow), '')
  }

  return lines.join('\n')
}

function toCsv(tasks: Task[]): string {
  const header = 'id,title,status,priority,scope,project,tags,dueDate,createdAt,doneAt'
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const rows = tasks
    .filter((t) => !t.deletedAt)
    .map((t) =>
      [
        t.id,
        escape(t.title),
        t.status,
        t.priority,
        t.scope,
        t.project ?? '',
        escape(t.tags.join(', ')),
        t.dueDate ?? '',
        t.createdAt,
        t.doneAt ?? '',
      ].join(',')
    )
  return [header, ...rows].join('\n')
}

export async function GET(req: NextRequest) {
  const format = new URL(req.url).searchParams.get('format') ?? 'markdown'
  const store  = readTasks()

  if (format === 'csv') {
    return new NextResponse(toCsv(store.tasks), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="tarefas.csv"',
      },
    })
  }

  return new NextResponse(toMarkdown(store.tasks), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tarefas.md"',
    },
  })
}
