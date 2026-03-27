'use client'

import { useState } from 'react'
import type { Comment } from '@/lib/types'

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface CommentsProps {
  taskId: number
  comments: Comment[]
  onAdded: () => void
}

export default function Comments({ taskId, comments, onAdded }: CommentsProps) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const body = draft.trim()
    if (!body) return
    setSaving(true)
    try {
      await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, author: 'user' }),
      })
      setDraft('')
      onAdded()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-xs font-mono text-muted italic">nenhum comentário ainda</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded border px-4 py-3 space-y-1.5 ${
                c.author === 'claude'
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-border bg-faint'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    c.author === 'claude'
                      ? 'text-accent border-accent/40 bg-accent/10'
                      : 'text-muted border-border'
                  }`}
                >
                  {c.author === 'claude' ? '⬡ claude' : '◎ você'}
                </span>
                <span className="text-[10px] font-mono text-muted">{fmtFull(c.createdAt)}</span>
              </div>
              <p className="text-sm font-sans text-tx whitespace-pre-wrap leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
          }}
          placeholder="adicionar comentário... (⌘↵ para enviar)"
          rows={3}
          className="w-full bg-s2 border border-border focus:border-amber/40 rounded px-3 py-2 text-sm font-sans text-tx outline-none resize-none placeholder:text-muted transition-colors"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted">⌘↵ para enviar</span>
          <button
            onClick={submit}
            disabled={!draft.trim() || saving}
            className="text-xs font-mono px-3 py-1.5 rounded border border-amber/30 text-amber hover:bg-amber/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
          >
            {saving ? 'enviando...' : 'comentar'}
          </button>
        </div>
      </div>
    </div>
  )
}
