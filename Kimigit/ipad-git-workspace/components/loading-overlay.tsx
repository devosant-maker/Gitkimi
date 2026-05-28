'use client'

import { useWorkspace } from '@/lib/store'
import { Loader2 } from 'lucide-react'

export function LoadingOverlay() {
  const { isLoading, loadingMessage } = useWorkspace()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-workspace-sidebar p-6 shadow-2xl border border-workspace-border">
        <Loader2 className="h-8 w-8 animate-spin text-workspace-active" />
        <p className="text-sm font-medium text-workspace-text">
          {loadingMessage || 'Loading...'}
        </p>
      </div>
    </div>
  )
}