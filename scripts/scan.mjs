#!/usr/bin/env node
/**
 * npm run scan [-- --dir /path/to/project]
 * Varre o diretório em busca de TODO/FIXME e importa como tarefas.
 */
import fs from 'fs'
import path from 'path'

const TASKS_FILE = new URL('../data/tasks.json', import.meta.url).pathname
const DATA_DIR   = path.dirname(TASKS_FILE)

// Diretório a varrer: --dir ou cwd
const dirArgIdx = process.argv.indexOf('--dir')
const TARGET_DIR = dirArgIdx !== -1 ? process.argv[dirArgIdx + 1] : process.cwd()
const PROJECT    = path.basename(TARGET_DIR)

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.md']
const TODO_PATTERN = /\/\/\s*(TODO|FIXME)[:\s]+(.+)|#\s*(TODO|FIXME)[:\s]+(.+)/i

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (EXTENSIONS.includes(path.extname(entry.name))) files.push(full)
  }
  return files
}

function readStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(TASKS_FILE)) return { tasks: [], lastUpdated: '' }
  try {
    const parsed = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'))
    return Array.isArray(parsed?.tasks) ? parsed : { tasks: [], lastUpdated: '' }
  } catch { return { tasks: [], lastUpdated: '' } }
}

function writeStore(store) {
  const tmp = TASKS_FILE + '.tmp'
  if (fs.existsSync(TASKS_FILE)) fs.copyFileSync(TASKS_FILE, TASKS_FILE.replace('.json', '.backup.json'))
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf-8')
  fs.renameSync(tmp, TASKS_FILE)
}

function getNextId(tasks) {
  if (!tasks.length) return 1
  return Math.max(...tasks.map(t => t.id)) + 1
}

const store    = readStore()
const existing = new Set(store.tasks.map(t => t.notes).filter(Boolean))

let added = 0
for (const file of walk(TARGET_DIR)) {
  const rel   = path.relative(TARGET_DIR, file)
  const lines = fs.readFileSync(file, 'utf-8').split('\n')

  lines.forEach((line, idx) => {
    const match = line.match(TODO_PATTERN)
    if (!match) return

    const kind  = (match[1] || match[3] || 'TODO').toUpperCase()
    const text  = (match[2] || match[4] || '').trim()
    if (!text) return

    const note = `${kind} em ${rel}:${idx + 1}`
    if (existing.has(note)) return  // já importado

    const task = {
      id:        getNextId(store.tasks),
      title:     text.slice(0, 120),
      status:    'open',
      priority:  kind === 'FIXME' ? 'high' : 'medium',
      scope:     'local',
      project:   PROJECT,
      tags:      [kind.toLowerCase(), PROJECT],
      notes:     note,
      filePath:  `${file}:${idx + 1}`,
      source:    'todo-scan',
      createdAt: new Date().toISOString(),
    }

    store.tasks.push(task)
    existing.add(note)
    added++
    console.log(`  + #${task.id}  [${kind}] ${task.title}`)
  })
}

if (added > 0) {
  store.lastUpdated = new Date().toISOString()
  writeStore(store)
  console.log(`\n✓ ${added} tarefa${added > 1 ? 's' : ''} importada${added > 1 ? 's' : ''} de "${PROJECT}"`)
} else {
  console.log(`✓ Nenhum TODO/FIXME novo encontrado em "${PROJECT}"`)
}
