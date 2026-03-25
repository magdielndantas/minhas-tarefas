# O que foi construído — minhas-tarefas

## Visão geral

Sistema pessoal de gestão de tarefas com dois modos de uso: comandos slash dentro do Claude Code e uma web UI em Next.js para visualização.

---

## Estrutura criada

```
minhas-tarefas/
├── .claude/
│   └── commands/
│       └── tarefa.md           ← comando slash /tarefa e /tarefas
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← layout base com dark mode
│   │   ├── page.tsx            ← dashboard principal (client-side)
│   │   ├── globals.css         ← Tailwind + Google Fonts
│   │   └── api/tasks/
│   │       ├── route.ts        ← GET (com filtros) + POST
│   │       └── [id]/route.ts   ← PATCH + DELETE (soft delete)
│   ├── components/
│   │   ├── StatsBar.tsx        ← 5 métricas no topo
│   │   ├── ScopeToggle.tsx     ← segmented control local/global/todas
│   │   ├── FilterBar.tsx       ← pills de status/prioridade/tags + busca
│   │   ├── TaskCard.tsx        ← card com ações no hover
│   │   └── EmptyState.tsx      ← estado vazio com/sem filtros
│   └── lib/
│       ├── types.ts            ← interfaces Task, TaskStore e tipos
│       └── storage.ts          ← leitura/escrita do JSON
├── package.json
├── tsconfig.json               ← strict mode
├── tailwind.config.ts
├── next.config.ts
├── postcss.config.js
├── .gitignore                  ← exclui data/ do git
└── README.md
```

---

## Camadas do sistema

### 1. Modelo de dados (`src/lib/types.ts`)

```typescript
Task {
  id, title, status, priority, scope,
  project?, tags, notes?, dueDate?,
  source, createdAt, doneAt?, deletedAt?
}
```

- `status`: `open | done | cancelled`
- `priority`: `low | medium | high`
- `scope`: `local | global`
- Soft delete via `deletedAt`

### 2. Storage (`src/lib/storage.ts`)

- Lê e escreve `data/tasks.json` na raiz do projeto
- Cria o arquivo automaticamente se não existir
- Usa `fs.readFileSync` / `writeFileSync` (compatível com Next.js API routes)
- Nunca lança erro se arquivo ausente

### 3. API REST (`src/app/api/`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/tasks` | Lista com filtros: scope, status, priority, project, tags, search, includeDeleted |
| POST | `/api/tasks` | Cria tarefa, auto-incrementa id e createdAt |
| PATCH | `/api/tasks/:id` | Atualiza campos parcialmente |
| DELETE | `/api/tasks/:id` | Soft delete (preenche deletedAt) |

Ordenação: `high` primeiro, depois por `createdAt` desc.
Erros retornam status correto (400, 404, 500) com `{ error: string }`.

### 4. Web UI (`src/app/page.tsx` + componentes)

- Fetch client-side com `useEffect`
- Loading state: skeleton de 3 cards (sem spinner)
- Filtros combinados: scope + status + prioridade + tags + busca por texto
- Toggle dark/light no header
- `max-w-2xl` centralizado

**Design:** developer tool — dark por padrão, cores baseadas em zinc/violet/red/amber, tipografia JetBrains Mono para IDs e badges, Geist Sans para o restante.

### 5. Comando slash (`.claude/commands/tarefa.md`)

O arquivo mais importante. Define o comportamento do Claude ao receber `/tarefa` ou `/tarefas`.

**Inferência automática de contexto:**
- **Scope:** código do projeto atual → `local`; aprendizado/pessoal → `global`; ambíguo → pergunta
- **Prioridade:** detecta palavras como "urgente", "bloqueando", flags `--alta/--baixa`
- **Prazo:** interpreta "hoje", "amanhã", "até sexta", "em 3 dias" → ISO 8601
- **Tags:** extrai automaticamente do título (bug, deploy, docs, refactor, etc.)

**Ações disponíveis via slash:**
```
/tarefa <descrição>          → cria tarefa
/tarefas listar              → lista abertas do projeto atual
/tarefas listar --all        → lista todas
/tarefas o que vence?        → filtra por dueDate da semana
/tarefas concluir <id>       → marca como done
/tarefas cancelar <id>       → marca como cancelled
/tarefas reabrir <id>        → marca como open
/tarefas abrir painel        → orienta a rodar npm run dev
```

**Comportamento proativo:** se o Claude identificar débito técnico ou decisão adiada durante a conversa, sugere registrar como tarefa.

**Final de sessão:** ao detectar "vou parar" / "por hoje é isso", lista as tarefas abertas e pergunta se quer abrir o painel.

---

## Princípios respeitados

- Zero config: `git clone` + `npm install` + `npm run dev` já funciona
- Zero banco de dados: tudo em `data/tasks.json`
- Offline-first: funciona sem internet
- Open source: cada pessoa tem suas próprias tarefas isoladas (data/ ignorada no git)
- TypeScript strict: sem `any`
