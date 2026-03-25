'use client'

interface Props {
  hasFilters: boolean
  onClear: () => void
}

export default function EmptyState({ hasFilters, onClear }: Props) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 border-b border-border">
        <span className="text-2xl font-mono text-border2">∅</span>
        <p className="text-xs font-mono text-muted">nenhuma tarefa encontrada</p>
        <button
          onClick={onClear}
          className="text-xs font-mono text-muted hover:text-amber underline underline-offset-4 decoration-dotted transition-colors"
        >
          limpar filtros
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-20 border-b border-border">
      <span className="text-2xl font-mono text-border2">_</span>
      <p className="text-xs font-mono text-muted">tudo limpo por aqui</p>
      <p className="text-[11px] font-mono text-border2">
        crie tarefas com{' '}
        <span className="text-amber">/tarefa</span>
        {' '}no claude code
      </p>
    </div>
  )
}
