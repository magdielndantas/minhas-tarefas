'use client'

import type { Task } from '@/lib/types'

interface Props {
  tasks: Task[]
}

export default function StatsBar({ tasks }: Props) {
  const open      = tasks.filter((t) => t.status === 'open' && !t.deletedAt)
  const highPri   = open.filter((t) => t.priority === 'high')
  const today     = new Date().toISOString().slice(0, 10)
  const doneToday = tasks.filter((t) => t.doneAt?.slice(0, 10) === today)
  const local     = open.filter((t) => t.scope === 'local')
  const global    = open.filter((t) => t.scope === 'global')

  return (
    <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 py-2 border-b border-zinc-800">
      <span><span className="text-zinc-300">{open.length}</span> abertas</span>
      <span className="text-zinc-700">|</span>
      <span className={highPri.length > 0 ? 'text-red-400' : ''}>
        <span className={highPri.length > 0 ? 'text-red-400' : 'text-zinc-300'}>{highPri.length}</span> alta prioridade
      </span>
      <span className="text-zinc-700">|</span>
      <span><span className="text-zinc-300">{doneToday.length}</span> concluídas hoje</span>
      <span className="text-zinc-700">|</span>
      <span><span className="text-zinc-300">{local.length}</span> local</span>
      <span className="text-zinc-700">|</span>
      <span><span className="text-zinc-300">{global.length}</span> global</span>
    </div>
  )
}
