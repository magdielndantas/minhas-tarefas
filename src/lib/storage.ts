import fs from 'fs'
import path from 'path'
import type { Task, TaskStore } from './types'

const DATA_DIR  = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'tasks.json')
const BACKUP_FILE = path.join(DATA_DIR, 'tasks.backup.json')
const TMP_FILE  = DATA_FILE + '.tmp'

const EMPTY_STORE: TaskStore = { tasks: [], lastUpdated: '' }

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function isValidStore(data: unknown): data is TaskStore {
  return (
    typeof data === 'object' &&
    data !== null &&
    'tasks' in data &&
    Array.isArray((data as TaskStore).tasks)
  )
}

export function readTasks(): TaskStore {
  ensureDir()
  if (!fs.existsSync(DATA_FILE)) {
    writeTasks({ ...EMPTY_STORE })
    return { ...EMPTY_STORE }
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!isValidStore(parsed)) {
      console.error('[storage] tasks.json malformado — restaurando backup')
      return restoreBackup()
    }
    return parsed
  } catch {
    console.error('[storage] falha ao ler tasks.json — restaurando backup')
    return restoreBackup()
  }
}

function restoreBackup(): TaskStore {
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const raw = fs.readFileSync(BACKUP_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (isValidStore(parsed)) return parsed
    } catch { /* ignore */ }
  }
  return { ...EMPTY_STORE }
}

export function writeTasks(store: TaskStore): void {
  ensureDir()
  // Backup antes de sobrescrever
  if (fs.existsSync(DATA_FILE)) {
    try { fs.copyFileSync(DATA_FILE, BACKUP_FILE) } catch { /* ignore */ }
  }
  // Escrita atômica: tmp → rename
  fs.writeFileSync(TMP_FILE, JSON.stringify(store, null, 2), 'utf-8')
  fs.renameSync(TMP_FILE, DATA_FILE)
}

export function getNextId(tasks: Task[]): number {
  if (tasks.length === 0) return 1
  return Math.max(...tasks.map((t) => t.id)) + 1
}
