import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TextOverlay — Gerador de Texto em Imagens',
  description: 'Adicione textos em imagens com posicionamento livre',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
