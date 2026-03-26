# Roadmap — minhas-tarefas

Estado atual: v1 funcional e completo para uso pessoal diário.

---

## Próximos passos (v1.x — pequenas melhorias)

### Ações de contexto — abrir arquivos e projetos

A ideia: tarefas criadas via `todo-scan` ou `slash-command` deveriam ter botões de ação rápida diretamente na UI.

**O que falta:**
- Botão "abrir projeto" → copia `code /path/to/project` para clipboard (não podemos abrir diretamente do browser)
- Botão "abrir arquivo" → para tarefas do `todo-scan`, mostrar `arquivo:linha` e copiar o caminho
- Campo `filePath` no modelo de dados — armazenar `src/components/Foo.tsx:42` na tarefa de scan
- No `tarefa.md`: `/tarefa abrir <id>` → orienta o usuário a rodar `code <path>`

**Implementação estimada:** 1 sessão
- Adicionar `filePath?: string` em `types.ts`
- Atualizar `scan.mjs` para popular o campo
- Botão de clipboard na `TaskCard` e na página de detalhe

---

### Atalhos de teclado avançados

Já temos `j/k/space/e/x/n/⌘K`. O que falta:

- `r` — reabrir tarefa focada
- `p` — editar prioridade inline (cicla: alta → média → baixa)
- `d` — editar prazo inline (abre datepicker na própria linha)
- `g g` — ir para primeira tarefa (vim-style)
- `G` — ir para última tarefa
- `?` — mostrar modal de atalhos

**Implementação estimada:** 1 sessão

---

### Filtros persistentes

Hoje os filtros resetam ao recarregar a página. Salvar em `localStorage` para que o usuário sempre volte ao estado que deixou.

**Implementação estimada:** 30min

---

### Tarefas recentes no remind

`npm run remind` poderia mostrar também as tarefas criadas nas últimas 24h (contexto do que está chegando).

---

## Médio prazo (v2 — funcionalidades novas)

### Integração com editor

**O que seria:**
- Extensão VS Code (ou script) que detecta qual projeto está aberto e pré-filtra as tarefas locais
- `code --goto` para abrir arquivo na linha certa a partir de tarefas de scan
- Quick pick no VS Code para criar tarefas sem sair do editor

**Por que vale:**
A maioria das tarefas locais nasce dentro do editor. Ter o ciclo completo (criar → ver → resolver → fechar) sem trocar de contexto seria muito útil.

---

### Histórico de alterações

Registrar quando o status/prioridade de uma tarefa muda, com timestamp. Útil para entender quanto tempo uma tarefa ficou aberta.

**Modelo de dados:**
```typescript
history?: Array<{
  field: string
  from: string
  to: string
  at: string
}>
```

---

### Agrupamento por projeto na web UI

Hoje é possível filtrar por projeto, mas não há uma view que mostre todos os projetos com suas tarefas agrupadas. Seria útil para uma visão de "o que está pendente em cada projeto".

---

### `npm run weekly`

Relatório semanal no terminal: tarefas concluídas na semana, vencidas, criadas. Útil como retrospectiva rápida de sexta.

---

## Longo prazo (v3 — mudanças arquiteturais)

### Múltiplos arquivos de storage

Hoje tudo vai para `data/tasks.json`. Com o tempo:
- `data/tasks-global.json` para tarefas globais
- `data/tasks-<projeto>.json` por projeto
- Mantém o arquivo menor e mais rápido de ler

### Sincronização opcional via Git

Para quem quer ter as tarefas em múltiplas máquinas sem servidor:
- `tasks-global.json` em `~/.minhas-tarefas/` (fora do repo)
- Script que faz `git pull/push` de um repo privado dedicado a tarefas

### Modo colaborativo (opt-in)

Compartilhar tarefas de um projeto com o time via arquivo no próprio repositório:
- `data/tasks-shared.json` commitado no repo (não no `.gitignore`)
- Cada pessoa vê suas tarefas isoladas + as compartilhadas

---

## Fora do escopo (por design)

- Notificações push / email
- Backend remoto / conta de usuário
- App mobile
- Integração com Jira, Linear, GitHub Issues como fonte primária (pode ser destino de export, não origem)

O projeto é intencionalmente local, offline e sem dependências externas. Qualquer feature que quebre esses princípios deve ser opcional e opt-in.
