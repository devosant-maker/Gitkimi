import type { Metadata, Viewport } from 'next'
import { SessionProvider } from 'next-auth/react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Git Workspace iPad',
  description: 'Full development environment for iPad - Git, Code Editor, and Terminal',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Git Workspace'
  },
  icons: {
    apple: '/icon-192.png'
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0d1117" />
      </head>
      <body className="h-screen w-screen overflow-hidden bg-workspace-bg antialiased">
        <SessionProvider refetchInterval={0}>{children}</SessionProvider>
      </body>
    </html>
  )
}