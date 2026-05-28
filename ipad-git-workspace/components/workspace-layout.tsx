'use client'

import { useState } from 'react'
import { useWorkspace } from '@/lib/store'
import { Sidebar } from './sidebar'
import { FileExplorer } from './file-explorer'
import { EditorPanel } from './editor-panel'
import { GitPanel } from './git-panel'
import { TerminalPanel } from './terminal-panel'
import { Toast } from './toast'
import { LoadingOverlay } from './loading-overlay'

type Tab = 'explorer' | 'git' | 'search' | 'ai'

export function WorkspaceLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('explorer')
  const { showTerminal, repoName } = useWorkspace()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-workspace-bg">
      <LoadingOverlay />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex w-80 flex-col border-r border-workspace-border bg-workspace-sidebar">
        <div className="flex h-12 items-center border-b border-workspace-border px-4">
          <span className="text-sm font-semibold text-workspace-text truncate">
            {repoName || 'EXPLORER'}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeTab === 'explorer' && <FileExplorer />}
          {activeTab === 'git' && <GitPanel />}
          {activeTab === 'search' && (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <p className="mb-2 text-sm font-medium text-workspace-text">Search</p>
                <p className="text-xs text-workspace-muted">Coming in Phase 3</p>
              </div>
            </div>
          )}
          {activeTab === 'ai' && (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <p className="mb-2 text-sm font-medium text-workspace-text">AI Assistant</p>
                <p className="text-xs text-workspace-muted">Coming in Phase 5</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <EditorPanel />

        {showTerminal && (
          <div className="h-52 border-t border-workspace-border">
            <TerminalPanel />
          </div>
        )}
      </div>

      <Toast />
    </div>
  )
}