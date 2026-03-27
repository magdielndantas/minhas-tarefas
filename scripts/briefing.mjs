#!/usr/bin/env node
/**
 * briefing.mjs — SessionStart hook
 * Fetches /api/tasks/summary and prints a concise briefing for Claude.
 * Output is injected as context at the start of every Claude Code session.
 */

const PORT_CANDIDATES = [3001, 3000, 3002]

async function findBase() {
  for (const port of PORT_CANDIDATES) {
    try {
      const r = await fetch(`http://localhost:${port}/api/tasks/summary`, {
        signal: AbortSignal.timeout(1500),
      })
      if (r.ok) return { base: `http://localhost:${port}`, port }
    } catch {}
  }
  return null
}

async function main() {
  const found = await findBase()
  if (!found) {
    // App offline — exit silently, don't block session
    process.exit(0)
  }

  const summary = await fetch(`${found.base}/api/tasks/summary`).then(r => r.json())
  const { stats, openTasks, recentlyClosed, recentActivity } = summary

  const lines = []
  lines.push('## minhas-tarefas — briefing')
  lines.push('')

  // Stats
  lines.push(`**Status:** ${stats.open} abertas · ${stats.done} concluídas · ${stats.cancelled} canceladas${stats.overdue > 0 ? ` · ⚠ ${stats.overdue} vencidas` : ''}`)
  lines.push('')

  // Overdue
  const overdue = openTasks.filter(t => t.overdue)
  if (overdue.length > 0) {
    lines.push(`**Vencidas (${overdue.length}):**`)
    overdue.forEach(t => lines.push(`- #${t.id} [${t.priority}] ${t.title} — venceu ${t.dueDate?.slice(0, 10)}`))
    lines.push('')
  }

  // High priority open
  const highPriority = openTasks.filter(t => t.priority === 'high' && !t.overdue)
  if (highPriority.length > 0) {
    lines.push(`**Alta prioridade (${highPriority.length}):**`)
    highPriority.slice(0, 5).forEach(t => {
      const lastComment = t.comments.at(-1)
      const commentHint = lastComment ? ` — último comentário [${lastComment.author}]: "${lastComment.body.slice(0, 60)}${lastComment.body.length > 60 ? '…' : ''}"` : ''
      lines.push(`- #${t.id} ${t.title}${t.project ? ` (${t.project})` : ''}${commentHint}`)
    })
    if (highPriority.length > 5) lines.push(`  … +${highPriority.length - 5} outras`)
    lines.push('')
  }

  // Tasks waiting for Claude
  const waitingClaude = openTasks.filter(t =>
    t.comments.some(c => c.author === 'user' && c.body.includes('@claude'))
  )
  if (waitingClaude.length > 0) {
    lines.push(`**Aguardando sua análise (${waitingClaude.length}):**`)
    waitingClaude.forEach(t => {
      const mention = t.comments.filter(c => c.author === 'user' && c.body.includes('@claude')).at(-1)
      lines.push(`- #${t.id} ${t.title} — "${mention?.body.slice(0, 80)}${(mention?.body.length ?? 0) > 80 ? '…' : ''}"`)
    })
    lines.push('')
  }

  // Recent activity (last 5, non-trivial)
  const interesting = recentActivity
    .filter(a => a.action !== 'created')
    .slice(0, 5)
  if (interesting.length > 0) {
    lines.push('**Atividade recente:**')
    interesting.forEach(a => {
      const at = new Date(a.at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      lines.push(`- [${a.author}] #${a.taskId} "${a.taskTitle?.slice(0, 40)}…" → ${a.action} (${at})`)
    })
    lines.push('')
  }

  // Recently closed
  if (recentlyClosed.length > 0) {
    lines.push(`**Fechadas nos últimos 7 dias (${recentlyClosed.length}):** ${recentlyClosed.slice(0, 3).map(t => `#${t.id}`).join(', ')}${recentlyClosed.length > 3 ? ` +${recentlyClosed.length - 3}` : ''}`)
    lines.push('')
  }

  lines.push(`_Use \`GET ${found.base}/api/tasks/summary\` para o JSON completo. Use \`POST /api/tasks/:id/comments\` com \`author: "claude"\` para comentar._`)

  console.log(lines.join('\n'))
}

main().catch(() => process.exit(0))
