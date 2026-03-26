#!/usr/bin/env node
/**
 * npm run remind
 * Lista tarefas vencidas e com prazo hoje no terminal.
 * Ideal como alias no .zshrc / .bashrc.
 */
import fs from 'fs'
import path from 'path'

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

const today   = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

const tasks  = readTasks().filter((t) => t.status === 'open' && !t.deletedAt && t.dueDate)
const overdue = tasks.filter((t) => new Date(t.dueDate) < today)
const dueToday = tasks.filter((t) => {
  const d = new Date(t.dueDate)
  d.setHours(0,0,0,0)
  return d.getTime() === today.getTime()
})
const dueSoon = tasks.filter((t) => {
  const d = new Date(t.dueDate)
  d.setHours(0,0,0,0)
  return d > today && d < new Date(today.getTime() + 3 * 86400000)
})

const open = readTasks().filter((t) => t.status === 'open' && !t.deletedAt)

console.log(`\n${BOLD}minhas-tarefas${RESET}  ${GRAY}${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}${RESET}\n`)

if (overdue.length === 0 && dueToday.length === 0 && dueSoon.length === 0) {
  console.log(`${GREEN}✓${RESET} Nenhuma tarefa urgente\n`)
} else {
  if (overdue.length > 0) {
    console.log(`${RED}${BOLD}Vencidas (${overdue.length})${RESET}`)
    overdue.forEach((t) => {
      console.log(`  ${priorityIcon(t.priority)} ${RED}#${t.id}${RESET}  ${t.title}  ${DIM}${fmt(t.dueDate)}${RESET}`)
    })
    console.log()
  }

  if (dueToday.length > 0) {
    console.log(`${YELLOW}${BOLD}Vencem hoje (${dueToday.length})${RESET}`)
    dueToday.forEach((t) => {
      console.log(`  ${priorityIcon(t.priority)} ${YELLOW}#${t.id}${RESET}  ${t.title}`)
    })
    console.log()
  }

  if (dueSoon.length > 0) {
    console.log(`${CYAN}Vencem em breve (${dueSoon.length})${RESET}`)
    dueSoon.forEach((t) => {
      console.log(`  ${priorityIcon(t.priority)} ${GRAY}#${t.id}${RESET}  ${t.title}  ${DIM}${fmt(t.dueDate)}${RESET}`)
    })
    console.log()
  }
}

console.log(`${GRAY}${open.length} abertas no total  ·  npm run dev para abrir o painel${RESET}\n`)
