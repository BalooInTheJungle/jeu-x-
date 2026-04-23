import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kclo Games',
  description: 'Plateforme de jeux de soirée multijoueurs',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
