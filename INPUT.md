# minhas-tarefas — Prompt para Claude Code

Repositório: https://github.com/magdielndantas/minhas-tarefas.git

---

## Visão geral

Crie o projeto **minhas-tarefas**: um sistema pessoal de gestão de tarefas que funciona dentro do Claude Code via comandos slash, com uma web UI em Next.js para visualização e gestão.

O sistema tem dois modos de uso que se complementam:

**Modo 1 — Dentro do Claude Code (uso principal)**
O usuário digita um comando durante qualquer sessão de trabalho:
```
/tarefa revisar as páginas HTML do projeto
/tarefa estudar React Server Components --global
/tarefas o que está vencendo essa semana?
/tarefas concluir 3
```
O Claude interpreta, infere contexto (prioridade, prazo, scope), confirma em uma linha e continua o trabalho.

**Modo 2 — Web UI (gestão visual)**
O usuário roda `npm run dev` e acessa `http://localhost:3000` para ver, filtrar e gerenciar todas as tarefas visualmente.

---

## Princípios do projeto

- **Zero config para instalar** — `git clone` + `npm install` + `npm run dev` já funciona
- **Zero dependências de banco** — tudo em arquivos JSON locais
- **Offline-first** — funciona sem internet
- **Open source** — qualquer pessoa clona e usa com as próprias tarefas isoladas
- **TypeScript strict** — sem `any`

---

## Stack

- **Next.js 14+** com App Router
- **TypeScript** (strict mode)
- **Tailwind CSS**
- **Runtime:** Node.js 18+
- **Storage:** `data/tasks.json` na raiz do projeto (criado automaticamente)
- **Sem banco de dados, sem auth, sem serviço externo**

---

## Estrutura de arquivos

```
minhas-tarefas/
├── .claude/
│   └── commands/
│       └── tarefa.md          # comando slash /tarefa e /tarefas
├── src/
│   ├── app/
│   │   ├── page.tsx            # dashboard principal
│   │   ├── layout.tsx
│   │   └── api/
│   │       └── tasks/
│   │           ├── route.ts              # GET, POST
│   │           └── [id]/
│   │               └── route.ts          # PATCH, DELETE
│   ├── components/
│   │   ├── TaskCard.tsx
│   │   ├── FilterBar.tsx
│   │   ├── StatsBar.tsx
│   │   ├── ScopeToggle.tsx
│   │   └── EmptyState.tsx
│   └── lib/
│       ├── types.ts            # interfaces compartilhadas
│       └── storage.ts          # leitura/escrita do JSON
├── data/
│   └── tasks.json              # criado automaticamente, ignorado no git
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── .gitignore
└── README.md
```

---

## Modelo de dados — `src/lib/types.ts`

```typescript
export type TaskStatus   = 'open' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskScope    = 'local' | 'global'

export interface Task {
  id: number                  // auto-incremento
  title: string
  status: TaskStatus
  priority: TaskPriority
  scope: TaskScope
  project?: string            // nome do diretório de origem — ex: "processo-agil"
  tags: string[]
  notes?: string
  dueDate?: string            // ISO 8601
  source: 'manual' | 'slash-command' | 'todo-scan'
  createdAt: string           // ISO 8601
  doneAt?: string             // ISO 8601
  deletedAt?: string          // soft delete
}

export interface TaskStore {
  tasks: Task[]
  lastUpdated: string
}
```

---

## Storage — `src/lib/storage.ts`

```typescript
// Implementar estas funções:
export function readTasks(): TaskStore
export function writeTasks(store: TaskStore): void
export function getNextId(tasks: Task[]): number

// Caminho: <project-root>/data/tasks.json
// Se não existir, criar com { tasks: [], lastUpdated: "" }
// Nunca lançar erro se arquivo ausente — criar automaticamente
// Usar fs.readFileSync / writeFileSync (Next.js API routes rodam em Node)
```

---

## Comando slash — `.claude/commands/tarefa.md`

Este é o arquivo mais importante do projeto. Ele define o comportamento do Claude Code quando o usuário digita `/tarefa` ou `/tarefas`.

O arquivo deve conter as seguintes instruções para o Claude:

### Gatilhos

O comando `/tarefa` cria ou gerencia uma tarefa. Exemplos:
```
/tarefa revisar as páginas HTML
/tarefa estudar generics do TypeScript --global
/tarefa corrigir bug no login --alta --até sexta
/tarefas listar
/tarefas o que está vencendo?
/tarefas concluir 3
/tarefas abrir painel
```

### Inferência de contexto

Quando o usuário não especifica campos, o Claude deve inferir:

**Scope (local vs global):**
- Contexto técnico do projeto atual → `local` + `project: <nome do diretório>`
- Aprendizado, infra pessoal, sem código → `global`
- Ambíguo → perguntar antes de salvar

**Prioridade:**
- Palavras como "urgente", "crítico", "bloqueando", "antes do deploy" → `high`
- Palavras como "quando puder", "depois", "em algum momento" → `low`
- Padrão quando não há indicação → `medium`
- Contexto da conversa atual também conta — se o usuário acabou de falar sobre um bug em produção, a tarefa relacionada é `high`

**Prazo (dueDate):**
- "hoje" → fim do dia atual
- "amanhã" → próximo dia
- "essa semana" / "até sexta" → próxima sexta
- "semana que vem" → próxima segunda
- "em 3 dias" → hoje + 3 dias
- Se não mencionado → deixar `undefined` (não inventar prazo)

**Tags:**
- Extrair do título: "testes", "deploy", "auth", "bug", "refactor", "docs", "design", "marketing"
- Adicionar tag do projeto quando scope for local: ex: `processo-agil`

### Como executar

Para todas as operações, fazer POST/PATCH/GET na API do Next.js:
- Se servidor estiver rodando (`http://localhost:3000`): usar a API REST
- Se não estiver: ler/escrever diretamente em `data/tasks.json` via leitura de arquivo

### Ações disponíveis

**Criar tarefa:**
```
POST /api/tasks
body: { title, status: "open", priority, scope, project?, tags, dueDate?, notes?, source: "slash-command" }
```

**Listar tarefas:**
```
GET /api/tasks?scope=local&status=open
```
Apresentar em formato legível, agrupado por scope se `--all`.

**Concluir tarefa:**
```
PATCH /api/tasks/:id
body: { status: "done", doneAt: new Date().toISOString() }
```

**Cancelar / reabrir:**
```
PATCH /api/tasks/:id
body: { status: "cancelled" } ou { status: "open", doneAt: undefined }
```

**Abrir painel web:**
Orientar o usuário a rodar `npm run dev` na pasta `minhas-tarefas` e acessar `http://localhost:3000`.

### Tom e confirmação

Breve e natural — uma linha apenas:
```
✓ Tarefa #7 criada  ·  local · processo-agil  ·  alta prioridade  ·  "revisar HTML"
✓ Tarefa #3 concluída
```

Nunca verbose. Nunca "Claro! Acabei de registrar sua tarefa com sucesso no sistema..."

### Comportamento proativo

Se durante uma conversa o Claude identificar débito técnico, decisão adiada ou algo que vai ficar pendente, DEVE sugerir:
> *"Isso vai precisar de atenção — quer que eu registre como tarefa?"*

### Final de sessão

Quando o usuário disser "vou parar", "por hoje é isso", "encerrando":
1. Listar tarefas abertas do projeto atual
2. Perguntar: *"Quer abrir o painel antes de sair? `npm run dev` em minhas-tarefas"*

---

## API Routes

### `GET /api/tasks`

Query params:
| Param | Valores | Padrão |
|---|---|---|
| `scope` | `local` \| `global` \| `all` | `all` |
| `status` | `open` \| `done` \| `cancelled` \| `all` | `open` |
| `priority` | `low` \| `medium` \| `high` | — |
| `project` | string | — |
| `tags` | string separado por vírgula | — |
| `search` | string | — |
| `includeDeleted` | `true` \| `false` | `false` |

Retorna `Task[]` filtrado e ordenado: `high` primeiro, depois por `createdAt` desc.

### `POST /api/tasks`
Body: `Omit<Task, 'id' | 'createdAt'>` — retorna a tarefa criada com id e createdAt preenchidos.

### `PATCH /api/tasks/:id`
Body: `Partial<Task>` — retorna tarefa atualizada. Retorna 404 se não encontrar.

### `DELETE /api/tasks/:id`
Soft delete — preenche `deletedAt`. Retorna tarefa atualizada.

Todos os endpoints devem retornar erros com status code correto (400, 404, 500) e `{ error: string }`.

---

## Web UI

**Design:** developer tool — clean, denso, sem floreios. Referência: Linear, Raycast.

**Tema:** dark por padrão com toggle light/dark no header.

**Cores (usar CSS variables no Tailwind):**
- Background: `zinc-950` · superfícies: `zinc-900`
- Texto: `zinc-100` · muted: `zinc-500`
- Accent: `violet-600`
- Prioridade alta: `red-500` · média: `amber-500` · baixa: `zinc-500`

**Tipografia:** `JetBrains Mono` (Google Fonts) para IDs, tags e badges · `Geist Sans` para o resto.

### Componentes

**`StatsBar`** — linha compacta no topo:
- 5 métricas separadas por `|`: total abertas · alta prioridade (vermelho se > 0) · concluídas hoje · local · global
- Fonte mono para números

**`ScopeToggle`** — segmented control:
- `Local · processo-agil` / `Global` / `Todas`
- Badge de contagem em cada opção

**`FilterBar`** — linha de pills clicáveis:
- Status · Prioridade · Tags disponíveis (dinâmicas)
- Campo de busca com hint `⌘K` à direita
- Em mobile: accordion

**`TaskCard`** — card de tarefa:
- Borda esquerda: vermelho / âmbar / zinc por prioridade
- Layout: `[dot] [título] [tags] [scope badge] [timestamp]`
- Ações no hover: `✓ Concluir` · `✗ Cancelar` · `↩ Reabrir`
- Expansível para `notes` e `dueDate`
- `done`: linha no título + opacidade reduzida
- `cancelled`: opacidade mínima

**`EmptyState`** — estado vazio:
- Com filtros ativos: "Nenhuma tarefa encontrada" + "Limpar filtros"
- Sem filtros: "Tudo limpo por aqui · Crie tarefas com `/tarefa` no Claude Code"

**`page.tsx`** — dashboard:
- Fetch client-side com `useEffect`
- Loading: skeleton de 3 cards (não spinner)
- `max-w-2xl` centralizado com padding lateral
- Header: `minhas-tarefas` em mono (pequeno) + toggle dark/light

Todos os componentes: `'use client'`, `default export`, sem libs externas além do Tailwind.

---

## README.md

O README deve ser direto e ter estas seções:

### Instalação (3 passos)
```bash
git clone https://github.com/magdielndantas/minhas-tarefas.git
cd minhas-tarefas && npm install
npm run dev  # abre http://localhost:3000
```

### Ativar no Claude Code
```bash
# Na raiz de qualquer projeto, dizer ao Claude Code:
# "Use as instruções em ~/.../minhas-tarefas/.claude/commands/tarefa.md"
# Ou copiar o arquivo para o projeto atual:
cp /caminho/para/minhas-tarefas/.claude/commands/tarefa.md .claude/commands/tarefa.md
```

### Uso rápido
```
/tarefa revisar os testes antes do deploy
/tarefa estudar Docker --global --baixa
/tarefas listar
/tarefas o que vence essa semana?
/tarefas concluir 5
/tarefas abrir painel
```

### Como funciona
- Tarefas locais ficam em `data/tasks.json` — ignorado no git, só seu
- Tarefas globais ficam no mesmo arquivo com `scope: "global"`
- A web UI lê o mesmo arquivo via API — sem sync necessário
- Cada pessoa que clonar o repo tem suas próprias tarefas isoladas

---

## .gitignore — obrigatório incluir

```
/data/tasks.json
/data/
.env*.local
node_modules/
.next/
```

---

## Ordem de implementação

1. `src/lib/types.ts`
2. `src/lib/storage.ts`
3. `src/app/api/tasks/route.ts` + `[id]/route.ts`
4. `src/components/` — todos os componentes
5. `src/app/page.tsx`
6. **`.claude/commands/tarefa.md`** ← mais importante
7. `README.md`
8. Verificar `.gitignore`

---

## Critério de sucesso

Este fluxo deve funcionar sem fricção:

```
# Usuário trabalhando no projeto "processo-agil" no Claude Code
/tarefa revisar as páginas HTML antes do deploy de quinta

# Claude responde:
✓ Tarefa #4 criada  ·  local · processo-agil  ·  alta prioridade  ·  prazo: qui  ·  "revisar páginas HTML"

# Mais tarde:
/tarefas o que vence essa semana?

# Claude responde listando as tarefas com prazo até domingo

# Ao encerrar:
/tarefas abrir painel
# Claude orienta a rodar npm run dev e abre http://localhost:3000
```