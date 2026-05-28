'use client'

import { signIn } from 'next-auth/react'
import { Github, Code2, Tablet, ArrowRight } from 'lucide-react'

export function LoginScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-workspace-bg px-6">
      <div className="mb-10 flex flex-col items-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-workspace-active to-blue-600 shadow-lg shadow-workspace-active/20">
          <Code2 className="h-12 w-12 text-white" />
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">Git Workspace</h1>
        <p className="max-w-md text-center text-lg text-workspace-muted">
          Full development environment for iPad
        </p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Github, label: 'GitHub' },
          { icon: Code2, label: 'Code Editor' },
          { icon: Tablet, label: 'Touch Native' },
          { icon: ArrowRight, label: 'Git Push/Pull' }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-xl bg-workspace-sidebar p-4">
            <item.icon className="h-6 w-6 text-workspace-active" />
            <span className="text-xs text-workspace-muted">{item.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => signIn('github', { callbackUrl: '/' })}
        className="flex touch-min items-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-semibold text-black shadow-lg transition-all active:scale-95 hover:bg-gray-100"
      >
        <Github className="h-5 w-5" />
        Sign in with GitHub
      </button>

      <p className="mt-8 max-w-sm text-center text-xs text-workspace-muted/60">
        Requires GitHub OAuth App. Your token is stored securely and never leaves your device.
      </p>
    </div>
  )
}