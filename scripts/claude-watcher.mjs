#!/usr/bin/env node
/**
 * claude-watcher — monitora tasks.json e responde @Claude automaticamente
 *
 * Detecção:
 *   - Título com @claude sem nenhum comentário do Claude
 *   - Comentário do usuário com @claude sem resposta posterior do Claude
 *
 * Uso: node scripts/claude-watcher.mjs
 * PM2:  pm2 start scripts/claude-watcher.mjs --name claude-watcher
 */

import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.join(__dirname, '..')
const DATA_FILE  = path.join(ROOT, 'data', 'tasks.json')
const API_BASE   = process.env.API_BASE  ?? 'http://localhost:3001'
const INTERVAL   = Number(process.env.WATCHER_INTERVAL ?? 10_000)  // ms

// IDs já processados nesta sessão (evita double-dispatch)
const processed = new Set()

// ─── leitura ─────────────────────────────────────────────────────────────────

function readTasks() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw).tasks ?? []
  } catch {
    return []
  }
}

// ─── detecção ────────────────────────────────────────────────────────────────

function getPendingMentions(tasks) {
  const pending = []

  for (const task of tasks) {
    if (task.deletedAt || task.status !== 'open') continue

    // 1. Título com @claude
    if (/@claude/i.test(task.title)) {
      const key = `title-${task.id}`
      if (!processed.has(key)) {
        const claudeReplied = task.comments.some((c) => c.author === 'claude')
        if (claudeReplied) {
          processed.add(key) // já respondido, ignorar
        } else {
          pending.push({ type: 'title', task, key })
        }
      }
    }

    // 2. Comentários do usuário com @claude
    for (const comment of task.comments) {
      if (comment.author !== 'user' || !/@claude/i.test(comment.body)) continue
      const key = `comment-${comment.id}`
      if (processed.has(key)) continue

      const repliedAfter = task.comments.some(
        (c) => c.author === 'claude' && new Date(c.createdAt) > new Date(comment.createdAt)
      )
      if (repliedAfter) {
        processed.add(key)
      } else {
        pending.push({ type: 'comment', task, comment, key })
      }
    }
  }

  return pending
}

// ─── prompt ──────────────────────────────────────────────────────────────────

function buildPrompt(mention) {
  const { type, task, comment } = mention

  const history = task.comments.map((c) => {
    const author = c.author === 'claude' ? 'Claude' : 'usuário'
    const date   = new Date(c.createdAt).toLocaleString('pt-BR')
    return `[${author} — ${date}]\n${c.body}`
  }).join('\n\n')

  return `Você é um assistente integrado ao sistema de gerenciamento de tarefas "minhas-tarefas".
O usuário mencionou você ${type === 'title' ? 'no título da tarefa' : 'em um comentário'}.

━━━ TAREFA #${task.id} ━━━
Título:    ${task.title}
Projeto:   ${task.project || '(sem projeto)'}
Status:    ${task.status} | Prioridade: ${task.priority}
${task.notes    ? `Notas:     ${task.notes}` : ''}
${task.dueDate  ? `Prazo:     ${task.dueDate.slice(0, 10)}` : ''}

━━━ HISTÓRICO ━━━
${history || '(sem comentários anteriores)'}

━━━ INSTRUÇÃO ━━━
${type === 'comment'
  ? `O usuário perguntou/comentou: "${comment.body}"`
  : 'O usuário mencionou você no título. Apresente-se e ofereça ajuda com esta tarefa.'}

Responda em português, de forma concisa e direta.
Retorne APENAS o texto da resposta — sem prefixos, sem metadados.`
}

// ─── execução do Claude ───────────────────────────────────────────────────────

function runClaude(prompt) {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => {
      child.kill()
      console.error('[watcher] ⏱ timeout ao chamar claude')
      resolve(null)
    }, 120_000)

    const child = spawn('claude', ['--print', prompt], { env: process.env })

    child.stdout.on('data', (d) => { stdout += d })
    child.stderr.on('data', (d) => { stderr += d })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0) {
        console.error(`[watcher] claude saiu com código ${code}:`, stderr.slice(0, 300))
        resolve(null)
        return
      }
      resolve(stdout.trim() || null)
    })

    child.on('error', (err) => {
      clearTimeout(timer)
      console.error('[watcher] erro ao iniciar claude:', err.message)
      resolve(null)
    })
  })
}

// ─── post do comentário ───────────────────────────────────────────────────────

async function postComment(taskId, body) {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: 'claude', body }),
    })
    return res.ok
  } catch (err) {
    console.error('[watcher] falha ao postar comentário:', err.message)
    return false
  }
}

// ─── loop principal ───────────────────────────────────────────────────────────

async function tick() {
  const tasks   = readTasks()
  const pending = getPendingMentions(tasks)

  if (pending.length === 0) return

  console.log(`[watcher] ${pending.length} menção(ões) pendente(s)`)

  for (const mention of pending) {
    const { task, key } = mention
    console.log(`[watcher] → tarefa #${task.id}: "${task.title.slice(0, 60)}"`)

    processed.add(key) // marcar antes de chamar (evita disparo duplo)

    const prompt   = buildPrompt(mention)
    const response = await runClaude(prompt)

    if (!response) {
      processed.delete(key) // falhou — tentar novamente no próximo ciclo
      continue
    }

    const ok = await postComment(task.id, response)
    if (ok) {
      console.log(`[watcher] ✓ respondido #${task.id}`)
    } else {
      processed.delete(key) // falha de rede — tentar novamente
    }
  }
}

// ─── start ────────────────────────────────────────────────────────────────────

console.log(`[watcher] iniciado`)
console.log(`[watcher] arquivo: ${DATA_FILE}`)
console.log(`[watcher] API:     ${API_BASE}`)
console.log(`[watcher] intervalo: ${INTERVAL / 1000}s`)

tick()
setInterval(tick, INTERVAL)
