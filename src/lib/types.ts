export type TaskStatus   = 'open' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskScope    = 'local' | 'global'
export type Author       = 'user' | 'claude'

export interface Comment {
  id: number
  author: Author
  body: string
  createdAt: string
}

export interface ActivityEntry {
  at: string
  author: Author
  action: string   // ex: "status: open → done", "created", "added comment"
}

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
  comments: Comment[]
  activity: ActivityEntry[]
}

export interface TaskStore {
  tasks: Task[]
  lastUpdated: string
}
