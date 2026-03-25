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

---

## Comandos disponíveis

| Comando | O que faz |
|---|---|
| `/tarefa <descrição>` | Cria uma tarefa local (projeto atual) |
| `/tarefa <descrição> --global` | Cria uma tarefa global |
| `/tarefa <descrição> --alta` | Força prioridade alta |
| `/tarefa <descrição> --até <data>` | Define prazo |
| `/tarefas listar` | Lista tarefas abertas do projeto atual |
| `/tarefas listar --all` | Lista todas (local + global, todos os status) |
| `/tarefas o que vence?` | Filtra por prazo da semana atual |
| `/tarefas concluir <id>` | Marca tarefa como concluída |
| `/tarefas cancelar <id>` | Cancela uma tarefa |
| `/tarefas reabrir <id>` | Reabre uma tarefa concluída ou cancelada |
| `/tarefas abrir painel` | Instrução para abrir a web UI |

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

## Contribuindo

Issues e PRs são bem-vindos. Algumas ideias para o roadmap:

- [ ] Modo colaborativo opcional (compartilhar tarefas de um projeto com o time)
- [ ] Integração com GitHub Issues
- [ ] Notificações de prazo via terminal
- [ ] Exportar para CSV / Markdown
- [ ] Scan automático de `TODO` no código

---

## Licença

MIT