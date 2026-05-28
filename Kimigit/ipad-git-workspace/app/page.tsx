'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import { initFS } from '@/lib/fs'
import { useWorkspace } from '@/lib/store'

const LoginScreen = dynamic(() => import('@/components/login-screen').then(m => m.LoginScreen), {
  ssr: false,
  loading: () => <LoadingScreen />
})

const WorkspaceLayout = dynamic(() => import('@/components/workspace-layout').then(m => m.WorkspaceLayout), {
  ssr: false,
  loading: () => <LoadingScreen />
})

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-workspace-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-workspace-active border-t-transparent" />
        <p className="text-sm text-workspace-muted">Initializing workspace...</p>
      </div>
    </div>
  )
}

export default function Home() {
  const { status } = useSession()
  const { showToast } = useWorkspace()
  const [fsReady, setFsReady] = useState(false)

  useEffect(() => {
    let mounted = true
    initFS()
      .then(() => { if (mounted) setFsReady(true) })
      .catch((err) => {
        if (mounted) {
          console.error('FS init failed:', err)
          showToast('Failed to initialize file system', 'error')
        }
      })
    return () => { mounted = false }
  }, [showToast])

  if (status === 'loading' || !fsReady) {
    return <LoadingScreen />
  }

  if (status === 'unauthenticated') {
    return <LoginScreen />
  }

  return <WorkspaceLayout />
}