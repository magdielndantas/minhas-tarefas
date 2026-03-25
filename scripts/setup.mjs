#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import os from 'os'

const src = new URL('../.claude/commands/tarefa.md', import.meta.url).pathname
const dest = path.join(os.homedir(), '.claude', 'commands', 'tarefa.md')
const destDir = path.dirname(dest)

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

fs.copyFileSync(src, dest)
console.log(`✓ Comando instalado em ${dest}`)
console.log(`  /tarefa e /tarefas agora disponíveis em qualquer projeto no Claude Code`)
