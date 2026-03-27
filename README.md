# minhas-tarefas

Sistema pessoal de gestão de tarefas integrado ao Claude Code. Crie tarefas com um comando durante qualquer sessão de trabalho e visualize tudo numa web UI local.

---

## Como funciona

**Dentro do Claude Code** — o jeito principal de usar:

```
/tarefa revisar as páginas HTML antes do deploy
/tarefa estudar Docker --global
/tarefas o que vence essa semana?
/tarefas concluir 3
```

O Claude interpreta, infere prioridade e prazo pelo contexto, confirma em uma linha e continua o trabalho.

**Na web UI** — para visualização e gestão:

```bash
npm run dev
# Abre http://localhost:3000
```

---

## Instalação

```bash
git clone https://github.com/magdielndantas/minhas-tarefas.git
cd minhas-tarefas
npm install
npm run setup    # instala /tarefa e /tarefas globalmente no Claude Code
```

Pronto. Os comandos ficam disponíveis em qualquer projeto aberto no Claude Code.

Para abrir a web UI (opcional):

```bash
npm run dev   # http://localhost:3000
```

### Auto-inicialização no login (opcional)

Para o servidor iniciar automaticamente com o Mac via PM2:

```bash
npm run autostart    # instala e configura PM2
npm run autostatus   # verifica se está rodando
npm run autostop     # remove do autostart
```

---

## Comandos disponíveis

| Comando | O que faz |
|---|---|
| `/tarefa <descrição>` | Cria uma tarefa local (projeto atual) |
| `/tarefa <descrição> --global` | Cria uma tarefa global |
| `/tarefa <descrição> --alta` | Força prioridade alta |
| `/tarefa <descrição> --até <data>` | Define prazo em linguagem natural |
| `/tarefas listar` | Lista tarefas abertas do projeto atual |
| `/tarefas listar --all` | Lista todas (local + global, todos os status) |
| `/tarefas o que vence?` | Filtra por prazo da semana atual |
| `/tarefas concluir <id>` | Marca tarefa como concluída |
| `/tarefas cancelar <id>` | Cancela uma tarefa |
| `/tarefas reabrir <id>` | Reabre uma tarefa concluída ou cancelada |
| `/tarefas buscar <query>` | Busca tarefas pelo título ou notas |
| `/tarefas editar <id> <campo> <valor>` | Edita um campo (título, prazo, prioridade, notas) |
| `/tarefas exportar` | Instrução para exportar em Markdown ou CSV |
| `/tarefas abrir painel` | Instrução para abrir a web UI |

---

## Scripts CLI

```bash
npm run remind     # tarefas vencidas e com prazo hoje/em breve
npm run weekly     # relatório semanal: concluídas, criadas, vencidas nos últimos 7 dias
npm run scan       # importa TODO/FIXME do projeto atual como tarefas
npm run scan -- --dir /caminho/do/projeto   # escanear outro diretório
```

---

## Web UI — atalhos de teclado

| Tecla | Ação |
|---|---|
| `j` / `k` | navegar entre tarefas |
| `space` / `enter` | concluir / reabrir tarefa focada |
| `x` | cancelar tarefa focada |
| `e` | abrir página de detalhes |
| `n` | nova tarefa |
| `⌘K` | focar busca |
| `?` | mostrar todos os atalhos |
| `Esc` | limpar foco / fechar modal |

---

## Inferência automática de contexto

Você não precisa especificar tudo. O Claude infere:

**Scope:**
- Código, bug, deploy, PR → `local` (vinculada ao projeto atual)
- Estudo, infra pessoal, leitura → `global`
- Dúvida → Claude pergunta antes de salvar

**Prioridade:**
- "urgente", "bloqueando", "antes do deploy" → alta
- "quando puder", "depois", "em algum momento" → baixa
- Sem indicação → média

**Prazo:**
- "hoje", "amanhã", "até sexta", "em 3 dias", "semana que vem" → data calculada
- Sem menção → sem prazo (não inventa)

---

## API REST

```
GET    /api/tasks?status=open&scope=local     # listar
POST   /api/tasks                             # criar
PATCH  /api/tasks/:id                         # atualizar campos
DELETE /api/tasks/:id                         # remover (soft delete)
POST   /api/tasks/:id/comments                # comentar
GET    /api/tasks/summary                     # resumo (usado pelo briefing)
GET    /api/tasks/export?format=markdown|csv  # exportar
```

---

## Como suas tarefas ficam isoladas

O arquivo `data/tasks.json` está no `.gitignore`. Cada pessoa que clonar o repositório começa com o arquivo vazio e suas tarefas **nunca vão para o git**.

Não existe conta, login ou sincronização. É local por design.

---

## Stack

- Next.js 14 (App Router)
- TypeScript strict
- Tailwind CSS
- Storage: `data/tasks.json` (criado automaticamente)
- Sem banco de dados · sem auth · sem serviços externos

---

## Perguntas frequentes

**O servidor precisa estar rodando para usar os slash commands?**
Não. Quando offline, o Claude lê e escreve diretamente em `data/tasks.json`.

**Posso usar em vários projetos ao mesmo tempo?**
Sim. O campo `scope` separa tarefas `local` (projeto atual) de `global` (pessoais). O campo `project` é preenchido automaticamente com o nome do diretório.

**Como importar TODOs do meu código?**
Rode `npm run scan` dentro do projeto. O script varre arquivos `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rs`, `.md` em busca de `// TODO:` e `// FIXME:` e cria uma tarefa para cada ocorrência.

**Como abrir o arquivo de um TODO importado?**
Na web UI, passe o mouse sobre uma tarefa de scan e clique em `⎘ abrir`. Isso copia `code --goto /caminho/arquivo.ts:42` para o clipboard — cole no terminal para abrir direto no VS Code na linha correta.

**Os filtros resetam ao recarregar a página?**
Não. Status, prioridade, scope, projeto e tags selecionadas são salvos no `localStorage` e restaurados automaticamente.

**Como o Claude responde às tarefas?**
Na página de detalhes, deixe um comentário com `@claude`. O `claude-watcher` monitora e notifica o Claude Code. Quando ele responde, uma notificação desktop é enviada (se permitida).

**Como exportar as tarefas?**
Acesse `/api/tasks/export?format=markdown` ou `?format=csv`, ou use os links `↓ md` / `↓ csv` no cabeçalho da web UI.

**O `npm run weekly` mostra o quê?**
Tarefas concluídas nos últimos 7 dias, tarefas criadas no período e tarefas abertas com prazo vencido. Ideal para uma retrospectiva rápida de final de semana.

**E o `npm run remind`?**
Mostra tarefas vencidas, com prazo hoje e com prazo nos próximos 3 dias. Use como alias no `.zshrc` para ver ao abrir o terminal.

---

## Licença

MIT
