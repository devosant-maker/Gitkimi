'use client'

import { FolderGit, Search, Bot, LogOut, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { useWorkspace } from '@/lib/store'

type Tab = 'explorer' | 'git' | 'search' | 'ai'

interface SidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs = [
  { id: 'explorer' as Tab, icon: FolderGit, label: 'Explorer' },
  { id: 'git' as Tab, icon: FolderGit, label: 'Source Control' },
  { id: 'search' as Tab, icon: Search, label: 'Search' },
  { id: 'ai' as Tab, icon: Bot, label: 'AI' },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { toggleTerminal, showTerminal } = useWorkspace()

  return (
    <div className="flex w-14 flex-col items-center border-r border-workspace-border bg-workspace-sidebar py-3">
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-workspace-active/20">
        <span className="text-xs font-bold text-workspace-active">GW</span>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex touch-min items-center justify-center rounded-lg p-2.5 transition-all relative',
              activeTab === tab.id 
                ? 'bg-workspace-active/20 text-workspace-active' 
                : 'text-workspace-muted hover:bg-workspace-hover hover:text-workspace-text'
            )}
            title={tab.label}
          >
            <tab.icon className="h-5 w-5" />
            {activeTab === tab.id && (
              <div className="absolute left-0 h-8 w-0.5 rounded-r bg-workspace-active" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <button
          onClick={toggleTerminal}
          className={cn(
            'flex touch-min items-center justify-center rounded-lg p-2.5 transition-all',
            showTerminal ? 'text-workspace-active' : 'text-workspace-muted hover:text-workspace-text'
          )}
          title="Toggle Terminal"
        >
          <Terminal className="h-5 w-5" />
        </button>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex touch-min items-center justify-center rounded-lg p-2.5 text-workspace-muted transition-all hover:bg-red-500/10 hover:text-red-400"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}