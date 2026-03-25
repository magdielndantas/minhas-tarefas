import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'minhas-tarefas',
  description: 'Personal task manager for Claude Code',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-bg text-tx antialiased">
        {children}
      </body>
    </html>
  )
}
