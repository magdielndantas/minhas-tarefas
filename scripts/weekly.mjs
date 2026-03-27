#!/usr/bin/env node
/**
 * npm run weekly
 * Relatório semanal: tarefas concluídas, criadas e vencidas nos últimos 7 dias.
 */
import fs from 'fs'

const TASKS_FILE = new URL('../data/tasks.json', import.meta.url).pathname

const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'
const DIM    = '\x1b[2m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN  = '\x1b[32m'
const CYAN   = '\x1b[36m'
const GRAY   = '\x1b[90m'

function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'))
    return Array.isArray(parsed?.tasks) ? parsed.tasks : []
  } catch { return [] }
}

function fmt(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function priorityIcon(p) {
  return p === 'high' ? `${RED}●${RESET}` : p === 'medium' ? `${YELLOW}●${RESET}` : `${GRAY}●${RESET}`
}

const now   = new Date()
const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
const tasks = readTasks().filter((t) => !t.deletedAt)

const done    = tasks.filter((t) => t.status === 'done' && t.doneAt && new Date(t.doneAt) >= since)
const created = tasks.filter((t) => new Date(t.createdAt) >= since)
const overdue = tasks.filter((t) => t.status === 'open' && t.dueDate && new Date(t.dueDate) < now)

const weekLabel = `${fmt(since)} – ${fmt(now)}`

console.log(`\n${BOLD}minhas-tarefas  —  retrospectiva semanal${RESET}  ${GRAY}${weekLabel}${RESET}\n`)

// Concluídas
console.log(`${GREEN}${BOLD}Concluídas (${done.length})${RESET}`)
if (done.length === 0) {
  console.log(`  ${GRAY}nenhuma${RESET}`)
} else {
  done.sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt)).forEach((t) => {
    const proj = t.project ? `${GRAY}[${t.project}]${RESET} ` : ''
    console.log(`  ${GREEN}✓${RESET} ${proj}${t.title}  ${DIM}${fmt(t.doneAt)}${RESET}`)
  })
}
console.log()

// Criadas
console.log(`${CYAN}${BOLD}Criadas (${created.length})${RESET}`)
if (created.length === 0) {
  console.log(`  ${GRAY}nenhuma${RESET}`)
} else {
  created.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach((t) => {
    const proj = t.project ? `${GRAY}[${t.project}]${RESET} ` : ''
    const status = t.status === 'done' ? `${GREEN}done${RESET}` : t.status === 'cancelled' ? `${GRAY}cancelada${RESET}` : `${YELLOW}aberta${RESET}`
    console.log(`  ${priorityIcon(t.priority)} ${proj}${t.title}  ${DIM}${fmt(t.createdAt)}${RESET}  ${status}`)
  })
}
console.log()

// Vencidas (acumuladas)
if (overdue.length > 0) {
  console.log(`${RED}${BOLD}Vencidas (${overdue.length})${RESET}`)
  overdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).forEach((t) => {
    const proj = t.project ? `${GRAY}[${t.project}]${RESET} ` : ''
    const dias = Math.floor((now - new Date(t.dueDate)) / 86400000)
    console.log(`  ${priorityIcon(t.priority)} ${proj}${RED}#${t.id}${RESET}  ${t.title}  ${DIM}${fmt(t.dueDate)} (${dias}d atrás)${RESET}`)
  })
  console.log()
}

// Resumo
const openTotal = tasks.filter((t) => t.status === 'open').length
console.log(`${GRAY}${openTotal} abertas no total  ·  ${done.length} concluídas esta semana  ·  ${created.length} criadas${RESET}\n`)
