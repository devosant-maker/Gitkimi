'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  GitCommit, GitPull, GitPush, Check, 
  MessageSquare, GitBranch, Plus, History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/store'
import { gitAdd, gitRemove, gitCommit, gitPush, gitPull, gitStatus, gitCurrentBranch, gitCreateBranch } from '@/lib/git-engine'

export function GitPanel() {
  const { data: session } = useSession()
  const { 
    repoDir, gitStatus: status, currentBranch, branches,
    setGitStatus, setBranch, setBranches, showToast, setLoading, isLoading 
  } = useWorkspace()

  const [commitMessage, setCommitMessage] = useState('')
  const [showBranchInput, setShowBranchInput] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [activeSection, setActiveSection] = useState<'changes' | 'history'>('changes')

  if (!repoDir) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <GitBranch className="mb-3 h-10 w-10 text-workspace-border" />
        <p className="text-sm text-workspace-muted">Open a repository to see Git status</p>
      </div>
    )
  }

  const changedFiles = status.filter((f: any) => f.status !== 'unmodified')
  const stagedCount = changedFiles.filter((f: any) => f.stage !== 0).length

  const toggleStage = async (filepath: string, currentStage: number) => {
    try {
      if (currentStage === 0) {
        await gitAdd(repoDir, filepath)
      } else {
        await gitRemove(repoDir, filepath)
      }
      const newStatus = await gitStatus(repoDir)
      setGitStatus(newStatus)
    } catch (e: any) {
      showToast(e.message, 'error')
    }
  }

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      showToast('Please enter a commit message', 'error')
      return
    }
    if (stagedCount === 0) {
      showToast('No staged files to commit', 'error')
      return
    }
    setLoading(true, 'Committing...')
    try {
      await gitCommit(repoDir, commitMessage, {
        name: session?.user?.name || 'iPad User',
        email: session?.user?.email || 'user@ipad.dev'
      })
      setCommitMessage('')
      const newStatus = await gitStatus(repoDir)
      setGitStatus(newStatus)
      showToast('Committed successfully', 'success')
    } catch (e: any) {
      showToast(e.message || 'Commit failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePush = async () => {
    const token = (session as any)?.accessToken
    if (!token) {
      showToast('GitHub token not available. Re-login.', 'error')
      return
    }
    setLoading(true, 'Pushing to origin...')
    try {
      await gitPush(repoDir, token)
      showToast('Pushed to origin', 'success')
    } catch (e: any) {
      showToast(e.message || 'Push failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePull = async () => {
    const token = (session as any)?.accessToken
    if (!token) {
      showToast('GitHub token not available. Re-login.', 'error')
      return
    }
    setLoading(true, 'Pulling from origin...')
    try {
      await gitPull(repoDir, token)
      const newStatus = await gitStatus(repoDir)
      setGitStatus(newStatus)
      showToast('Pulled latest changes', 'success')
    } catch (e: any) {
      showToast(e.message || 'Pull failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return
    setLoading(true)
    try {
      await gitCreateBranch(repoDir, newBranchName, true)
      const branch = await gitCurrentBranch(repoDir)
      setBranch(branch)
      setNewBranchName('')
      setShowBranchInput(false)
      showToast(`Switched to branch ${newBranchName}`, 'success')
    } catch (e: any) {
      showToast(e.message || 'Branch creation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center justify-between border-b border-workspace-border px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <GitBranch className="h-4 w-4 shrink-0 text-workspace-active" />
          <span className="truncate text-sm font-medium text-workspace-text">{currentBranch}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={handlePull} disabled={isLoading} className="touch-min rounded-md p-1.5 hover:bg-workspace-hover disabled:opacity-50" title="Pull">
            <GitPull className="h-4 w-4 text-workspace-muted" />
          </button>
          <button onClick={handlePush} disabled={isLoading} className="touch-min rounded-md p-1.5 hover:bg-workspace-hover disabled:opacity-50" title="Push">
            <GitPush className="h-4 w-4 text-workspace-muted" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-workspace-border">
        <button
          onClick={() => setActiveSection('changes')}
          className={cn(
            'flex-1 py-2 text-xs font-medium transition-colors',
            activeSection === 'changes' ? 'text-workspace-text border-b-2 border-workspace-active' : 'text-workspace-muted hover:text-workspace-text'
          )}
        >
          Changes ({changedFiles.length})
        </button>
        <button
          onClick={() => setActiveSection('history')}
          className={cn(
            'flex-1 py-2 text-xs font-medium transition-colors',
            activeSection === 'history' ? 'text-workspace-text border-b-2 border-workspace-active' : 'text-workspace-muted hover:text-workspace-text'
          )}
        >
          History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeSection === 'changes' ? (
          <>
            {changedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Check className="mb-2 h-8 w-8 text-green-500/50" />
                <p className="text-sm text-workspace-muted">All changes committed</p>
              </div>
            ) : (
              <div className="py-1">
                {changedFiles.map((file: any) => (
                  <div
                    key={file.filepath}
                    className="flex touch-min items-center gap-2 px-3 py-1.5 hover:bg-workspace-hover"
                  >
                    <button
                      onClick={() => toggleStage(file.filepath, file.stage)}
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        file.stage !== 0 
                          ? 'border-workspace-active bg-workspace-active' 
                          : 'border-workspace-muted hover:border-workspace-text'
                      )}
                    >
                      {file.stage !== 0 && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <span className={cn(
                      'flex-1 truncate text-xs',
                      file.status === 'deleted' ? 'text-red-400 line-through' : 'text-workspace-text'
                    )}>
                      {file.filepath}
                    </span>
                    <span className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      file.status === 'modified' && 'bg-yellow-500/15 text-yellow-500',
                      file.status === 'added' && 'bg-green-500/15 text-green-500',
                      file.status === 'deleted' && 'bg-red-500/15 text-red-500',
                      file.status === 'staged' && 'bg-workspace-active/15 text-workspace-active'
                    )}>
                      {file.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-xs text-workspace-muted">
            <History className="mx-auto mb-2 h-8 w-8 opacity-20" />
            History view coming soon
          </div>
        )}
      </div>

      <div className="border-t border-workspace-border p-3">
        {showBranchInput ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="new-branch-name"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
              className="w-full rounded-lg bg-workspace-hover px-3 py-2 text-xs text-workspace-text placeholder-workspace-muted outline-none border border-transparent focus:border-workspace-active"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleCreateBranch} className="flex-1 rounded bg-workspace-active py-1.5 text-xs text-white">Create</button>
              <button onClick={() => { setShowBranchInput(false); setNewBranchName('') }} className="rounded border border-workspace-border px-3 py-1.5 text-xs text-workspace-text">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowBranchInput(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-workspace-border px-3 py-2 text-xs text-workspace-muted hover:bg-workspace-hover hover:text-workspace-text"
          >
            <Plus className="h-3.5 w-3.5" /> Create new branch
          </button>
        )}
      </div>

      <div className="border-t border-workspace-border p-3">
        <div className="relative mb-2">
          <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-workspace-muted" />
          <input
            type="text"
            placeholder="Commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
            className="w-full rounded-lg bg-workspace-hover py-2.5 pl-9 pr-3 text-xs text-workspace-text placeholder-workspace-muted outline-none border border-transparent focus:border-workspace-active"
          />
        </div>
        <button
          onClick={handleCommit}
          disabled={isLoading || stagedCount === 0}
          className={cn(
            "flex w-full touch-min items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
            stagedCount > 0 && !isLoading
              ? "bg-workspace-active text-white hover:bg-workspace-active/90"
              : "bg-workspace-hover text-workspace-muted cursor-not-allowed"
          )}
        >
          <GitCommit className="h-4 w-4" />
          Commit {stagedCount > 0 && `(${stagedCount})`}
        </button>
      </div>
    </div>
  )
}