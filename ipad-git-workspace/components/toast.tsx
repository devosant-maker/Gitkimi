'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import { useWorkspace } from '@/lib/store'
import { cn } from '@/lib/utils'

export function Toast() {
  const { toast, clearToast } = useWorkspace()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(clearToast, 3500)
    return () => clearTimeout(timer)
  }, [toast, clearToast])

  if (!toast) return null

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info
  }

  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-workspace-active text-white'
  }

  const Icon = icons[toast.type]

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={cn(
        'flex items-center gap-2.5 rounded-xl px-5 py-3 shadow-2xl backdrop-blur-md',
        colors[toast.type]
      )}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  )
}