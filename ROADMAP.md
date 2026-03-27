# Roadmap — minhas-tarefas

Estado atual: v1.1 — melhorias de UX e novos scripts implementados.

---

## Concluído (v1.1)

- ✅ **Filtros persistentes** — scope, status, prioridade, tags e projeto salvos em `localStorage`
- ✅ **Modal de atalhos `?`** — pressione `?` ou clique em "atalhos" no rodapé
- ✅ **`npm run weekly`** — relatório semanal: concluídas, criadas, vencidas nos últimos 7 dias
- ✅ **`filePath` no todo-scan** — tarefas de scan armazenam o caminho absoluto do arquivo e linha
- ✅ **Botão `⎘ abrir` no TaskCard** — copia `code --goto /caminho/arquivo.ts:42` para o clipboard

---

## Próximos passos (v1.x — pequenas melhorias)

### Atalhos de teclado avançados

Já temos `j/k/space/e/x/n/⌘K/?`. O que falta:

- `r` — reabrir tarefa focada
- `p` — editar prioridade inline (cicla: alta → média → baixa)
- `d` — editar prazo inline (abre datepicker na própria linha)
- `g g` — ir para primeira tarefa (vim-style)
- `G` — ir para última tarefa

**Implementação estimada:** 1 sessão

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
