'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, 
  Plus, Upload, RefreshCw, GitBranch, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/store'
import { getFS, readDirSafe, ensureDir, writeFileSafe, deleteFileSafe } from '@/lib/fs'
import { gitClone, gitStatus, gitCurrentBranch, gitInit } from '@/lib/git-engine'

interface TreeNodeProps {
  node: any
  level: number
  onSelect: (path: string, type: string) => void
  expanded: Set<string>
  onToggle: (path: string) => void
  onContextMenu: (e: React.MouseEvent, node: any) => void
}

function TreeNode({ node, level, onSelect, expanded, onToggle, onContextMenu }: TreeNodeProps) {
  const isExpanded = expanded.has(node.path)
  const isDir = node.type === 'dir'

  return (
    <div>
      <div
        className={cn(
          'group flex touch-min cursor-pointer items-center gap-1.5 py-1 pr-2 text-sm select-none',
          'hover:bg-workspace-hover active:bg-workspace-hover/80'
        )}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
        onClick={() => isDir ? onToggle(node.path) : onSelect(node.path, 'file')}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {isDir ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(node.path) }}
            className="flex h-4 w-4 items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-workspace-muted" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-workspace-muted" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {isDir ? (
          isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-workspace-active" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-workspace-active" />
          )
        ) : (
          <FileCode className="h-4 w-4 shrink-0 text-workspace-muted" />
        )}

        <span className="truncate text-workspace-text">{node.name}</span>
      </div>

      {isDir && isExpanded && node.children?.map((child: any) => (
        <TreeNode 
          key={child.path} 
          node={child} 
          level={level + 1} 
          onSelect={onSelect}
          expanded={expanded}
          onToggle={onToggle}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  )
}

export function FileExplorer() {
  const { data: session } = useSession()
  const { 
    repoDir, repoName, fileTree, setFileTree, openFile, 
    setRepo, setGitStatus, setBranch, showToast, setLoading 
  } = useWorkspace()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [repoUrl, setRepoUrl] = useState('')
  const [showCloneInput, setShowCloneInput] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: any } | null>(null)
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileParent, setNewFileParent] = useState<string | null>(null)

  const buildTree = useCallback(async (path: string): Promise<any[]> => {
    const entries = await readDirSafe(path)
    const nodes = await Promise.all(
      entries.map(async (name) => {
        if (name === '.git') return null
        const fullPath = `${path}/${name}`.replace(/\/+/g, '/')
        const stat = await getFS().stat(fullPath).catch(() => null)
        if (!stat) return null

        if (stat.isDirectory()) {
          const children = await buildTree(fullPath)
          return { name, path: fullPath, type: 'dir', children }
        }
        return { name, path: fullPath, type: 'file' }
      })
    )
    return nodes.filter(Boolean).sort((a: any, b: any) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'dir' ? -1 : 1
    })
  }, [])

  const loadFileTree = useCallback(async (dir: string) => {
    try {
      const tree = await buildTree(dir)
      setFileTree(tree)
      const status = await gitStatus(dir)
      setGitStatus(status)
      const branch = await gitCurrentBranch(dir)
      setBranch(branch)
    } catch (e) {
      console.error('Load tree error:', e)
    }
  }, [buildTree, setFileTree, setGitStatus, setBranch])

  useEffect(() => {
    if (repoDir) loadFileTree(repoDir)
  }, [repoDir, loadFileTree])

  const handleClone = async () => {
    if (!repoUrl.trim()) return
    setLoading(true, 'Cloning repository...')
    try {
      const token = (session as any)?.accessToken
      const url = repoUrl.trim().replace(/\/$/, '')
      const name = url.split('/').pop()?.replace('.git', '') || 'repo'
      const dir = `/repos/${name}`

      await gitClone(url, dir, token)
      setRepo(dir, url, name)
      await loadFileTree(dir)
      setExpanded(new Set([dir, '/repos']))
      showToast('Repository cloned successfully', 'success')
      setShowCloneInput(false)
      setRepoUrl('')
    } catch (e: any) {
      showToast(e.message || 'Clone failed. Check CORS proxy or repo URL.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInitRepo = async () => {
    setLoading(true, 'Creating repository...')
    try {
      const name = `project-${Date.now()}`
      const dir = `/repos/${name}`
      await gitInit(dir)
      await writeFileSafe(`${dir}/README.md`, `# ${name}\n\nCreated with Git Workspace iPad`)
      setRepo(dir, '', name)
      await loadFileTree(dir)
      setExpanded(new Set([dir, '/repos']))
      showToast('Repository created', 'success')
    } catch (e: any) {
      showToast(e.message || 'Failed to create repo', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (path: string, type: string) => {
    if (type !== 'file') return
    try {
      const content = await getFS().readFile(path, { encoding: 'utf8' })
      openFile(path, content as string)
    } catch (e) {
      showToast('Failed to open file', 'error')
    }
  }

  const handleUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.multiple = true

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS && !('webkitdirectory' in input)) {
      input.removeAttribute('webkitdirectory')
      input.multiple = true
    }

    input.onchange = async () => {
      if (!input.files?.length) return
      setLoading(true, 'Uploading files...')
      try {
        const pfs = getFS()
        const dir = repoDir || `/repos/upload-${Date.now()}`
        if (!repoDir) await ensureDir(dir)

        for (const file of Array.from(input.files)) {
          const relativePath = file.webkitRelativePath || file.name
          const fullPath = `${dir}/${relativePath}`
          const folder = fullPath.substring(0, fullPath.lastIndexOf('/'))
          await ensureDir(folder)
          const buffer = await file.arrayBuffer()
          await pfs.writeFile(fullPath, new Uint8Array(buffer))
        }

        if (!repoDir) setRepo(dir, '', 'uploaded-project')
        await loadFileTree(dir)
        showToast(`Uploaded ${input.files.length} files`, 'success')
      } catch (e: any) {
        showToast(e.message || 'Upload failed', 'error')
      } finally {
        setLoading(false)
      }
    }
    input.click()
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !newFileParent) return
    setLoading(true)
    try {
      const path = `${newFileParent}/${newFileName}`.replace(/\/+/g, '/')
      await writeFileSafe(path, '')
      await loadFileTree(repoDir!)
      setShowNewFileInput(false)
      setNewFileName('')
      setNewFileParent(null)
      showToast('File created', 'success')
    } catch (e) {
      showToast('Failed to create file', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (path: string, type: string) => {
    setLoading(true)
    try {
      if (type === 'dir') {
        showToast('Folder delete not yet implemented', 'info')
      } else {
        await deleteFileSafe(path)
        await loadFileTree(repoDir!)
        showToast('File deleted', 'success')
      }
    } catch (e) {
      showToast('Delete failed', 'error')
    } finally {
      setLoading(false)
      setContextMenu(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-workspace-border p-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-workspace-muted truncate">
          {repoName || 'NO FOLDER OPEN'}
        </span>
        <div className="flex gap-0.5">
          <button 
            onClick={handleUpload} 
            className="touch-min rounded-md p-1.5 hover:bg-workspace-hover" 
            title="Upload folder"
          >
            <Upload className="h-4 w-4 text-workspace-muted" />
          </button>
          <button 
            onClick={() => setShowCloneInput(!showCloneInput)} 
            className="touch-min rounded-md p-1.5 hover:bg-workspace-hover" 
            title="Clone repository"
          >
            <Plus className="h-4 w-4 text-workspace-muted" />
          </button>
          {repoDir && (
            <button 
              onClick={() => loadFileTree(repoDir)} 
              className="touch-min rounded-md p-1.5 hover:bg-workspace-hover" 
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-workspace-muted" />
            </button>
          )}
        </div>
      </div>

      {!repoDir && !showCloneInput && (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <GitBranch className="mb-4 h-12 w-12 text-workspace-border" />
          <p className="mb-4 text-sm text-workspace-muted">No folder opened</p>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={handleInitRepo}
              className="w-full rounded-lg bg-workspace-active py-2.5 text-sm font-medium text-white hover:bg-workspace-active/90"
            >
              Initialize Repository
            </button>
            <button
              onClick={() => setShowCloneInput(true)}
              className="w-full rounded-lg border border-workspace-border py-2.5 text-sm font-medium text-workspace-text hover:bg-workspace-hover"
            >
              Clone Repository
            </button>
          </div>
        </div>
      )}

      {showCloneInput && (
        <div className="border-b border-workspace-border p-3 space-y-2">
          <input
            type="text"
            placeholder="https://github.com/user/repo.git"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleClone()}
            className="w-full rounded-lg bg-workspace-hover px-3 py-2 text-xs text-workspace-text placeholder-workspace-muted outline-none border border-transparent focus:border-workspace-active"
          />
          <div className="flex gap-2">
            <button
              onClick={handleClone}
              className="flex-1 rounded-lg bg-workspace-active py-2 text-xs font-medium text-white hover:bg-workspace-active/90"
            >
              Clone
            </button>
            <button
              onClick={() => { setShowCloneInput(false); setRepoUrl('') }}
              className="rounded-lg border border-workspace-border px-3 py-2 text-xs text-workspace-text hover:bg-workspace-hover"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.length === 0 && repoDir ? (
          <div className="p-4 text-center text-xs text-workspace-muted">Empty repository</div>
        ) : (
          fileTree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              level={0}
              onSelect={handleFileSelect}
              expanded={expanded}
              onToggle={(path) => {
                const next = new Set(expanded)
                if (next.has(path)) next.delete(path)
                else next.add(path)
                setExpanded(next)
              }}
              onContextMenu={(e, node) => {
                e.preventDefault()
                setContextMenu({ x: e.clientX, y: e.clientY, node })
              }}
            />
          ))
        )}
      </div>

      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setContextMenu(null)} 
          />
          <div
            className="fixed z-50 min-w-[160px] rounded-lg border border-workspace-border bg-workspace-sidebar py-1 shadow-xl"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                setNewFileParent(contextMenu.node.type === 'dir' ? contextMenu.node.path : contextMenu.node.path.substring(0, contextMenu.node.path.lastIndexOf('/')))
                setShowNewFileInput(true)
                setContextMenu(null)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-workspace-text hover:bg-workspace-hover"
            >
              <Plus className="h-4 w-4" /> New File
            </button>
            <button
              onClick={() => handleDelete(contextMenu.node.path, contextMenu.node.type)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      )}

      {showNewFileInput && (
        <div className="border-t border-workspace-border p-3">
          <input
            type="text"
            placeholder="filename.ext"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            autoFocus
            className="w-full rounded-lg bg-workspace-hover px-3 py-2 text-xs text-workspace-text placeholder-workspace-muted outline-none border border-transparent focus:border-workspace-active"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={handleCreateFile} className="flex-1 rounded bg-workspace-active py-1.5 text-xs text-white">Create</button>
            <button onClick={() => { setShowNewFileInput(false); setNewFileName('') }} className="rounded border border-workspace-border px-3 py-1.5 text-xs text-workspace-text">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}