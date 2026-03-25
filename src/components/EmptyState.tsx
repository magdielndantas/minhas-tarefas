'use client'

interface Props {
  hasFilters: boolean
  onClear: () => void
}

export default function EmptyState({ hasFilters, onClear }: Props) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-zinc-600">
        <p className="text-sm">Nenhuma tarefa encontrada</p>
        <button onClick={onClear} className="text-xs font-mono text-violet-500 hover:text-violet-400">
          Limpar filtros
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 py-16 text-zinc-600">
      <p className="text-sm">Tudo limpo por aqui</p>
      <p className="text-xs font-mono text-zinc-700">
        Crie tarefas com <span className="text-violet-600">/tarefa</span> no Claude Code
      </p>
    </div>
  )
}
