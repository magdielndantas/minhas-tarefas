export type TaskStatus   = 'open' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskScope    = 'local' | 'global'

export interface Task {
  id: number
  title: string
  status: TaskStatus
  priority: TaskPriority
  scope: TaskScope
  project?: string
  tags: string[]
  notes?: string
  dueDate?: string
  source: 'manual' | 'slash-command' | 'todo-scan'
  createdAt: string
  doneAt?: string
  deletedAt?: string
}

export interface TaskStore {
  tasks: Task[]
  lastUpdated: string
}
