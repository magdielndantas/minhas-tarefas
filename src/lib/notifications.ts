import type { Task } from './types'

export function markTaskRead(taskId: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`task-read-${taskId}`, new Date().toISOString())
}

export function hasUnreadClaudeComment(task: Task): boolean {
  if (typeof window === 'undefined') return false
  const lastRead = localStorage.getItem(`task-read-${task.id}`)
  if (!lastRead) return task.comments.some((c) => c.author === 'claude')
  return task.comments.some(
    (c) => c.author === 'claude' && new Date(c.createdAt) > new Date(lastRead)
  )
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export function sendTaskNotification(task: Task): void {
  if (typeof window === 'undefined') return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification('minhas-tarefas — nova resposta', {
    body: `#${task.id} ${task.title.slice(0, 80)}`,
    tag: `task-${task.id}-reply`,
  })
}
