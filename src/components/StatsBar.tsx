'use client'

import type { Task } from '@/lib/types'

interface Props { tasks: Task[] }

export default function StatsBar({ tasks }: Props) {
  const open      = tasks.filter((t) => t.status === 'open' && !t.deletedAt)
  const high      = open.filter((t) => t.priority === 'high')
  const today     = new Date().toISOString().slice(0, 10)
  const doneToday = tasks.filter((t) => t.doneAt?.slice(0, 10) === today)
  const local     = open.filter((t) => t.scope === 'local')
  const global    = open.filter((t) => t.scope === 'global')

  const stat = (value: number, label: string, highlight?: boolean) => (
    <span key={label} className="flex items-baseline gap-1">
      <span className={`text-sm font-mono font-medium tabular-nums ${highlight && value > 0 ? 'text-hi' : 'text-amber'}`}>
        {value}
      </span>
      <span className="text-muted text-xs">{label}</span>
    </span>
  )

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {stat(open.length,      'abertas')}
      <span className="text-border2">·</span>
      {stat(high.length,      'alta',        true)}
      <span className="text-border2">·</span>
      {stat(doneToday.length, 'concluídas hoje')}
      <span className="text-border2">·</span>
      {stat(local.length,     'local')}
      <span className="text-border2">·</span>
      {stat(global.length,    'global')}
    </div>
  )
}
