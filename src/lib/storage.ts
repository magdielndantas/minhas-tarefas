import fs from 'fs'
import path from 'path'
import type { Task, TaskStore } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'tasks.json')

const EMPTY_STORE: TaskStore = { tasks: [], lastUpdated: '' }

export function readTasks(): TaskStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(DATA_FILE)) {
      writeTasks(EMPTY_STORE)
      return { ...EMPTY_STORE }
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as TaskStore
  } catch {
    return { ...EMPTY_STORE }
  }
}

export function writeTasks(store: TaskStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

export function getNextId(tasks: Task[]): number {
  if (tasks.length === 0) return 1
  return Math.max(...tasks.map((t) => t.id)) + 1
}
