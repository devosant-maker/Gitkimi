'use client'

import { useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { X, Save, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/store'
import { getFS } from '@/lib/fs'
import { getLanguageFromPath } from '@/lib/utils'

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-workspace-active border-t-transparent" />
    </div>
  )
})

export function EditorPanel() {
  const { openFiles, activeFilePath, setActiveFile, closeFile, updateFileContent, saveFile, showToast } = useWorkspace()

  const handleSave = useCallback(async () => {
    const file = openFiles.find(f => f.path === activeFilePath)
    if (!file || !file.isDirty) return

    try {
      await getFS().writeFile(file.path, file.content)
      saveFile(file.path)
      showToast('Saved', 'success')
    } catch (e) {
      showToast('Save failed', 'error')
    }
  }, [activeFilePath, openFiles, saveFile, showToast])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        if (activeFilePath) closeFile(activeFilePath)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, activeFilePath, closeFile])

  const activeFile = openFiles.find(f => f.path === activeFilePath)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 overflow-x-auto border-b border-workspace-border bg-workspace-sidebar">
        {openFiles.length === 0 && (
          <div className="flex items-center px-4 text-xs text-workspace-muted">
            <FileCode className="mr-2 h-4 w-4" /> No open editors
          </div>
        )}
        {openFiles.map((file) => (
          <button
            key={file.path}
            onClick={() => setActiveFile(file.path)}
            className={cn(
              'group flex touch-min min-w-[140px] max-w-[220px] shrink-0 items-center gap-2 border-r border-workspace-border px-3 text-xs transition-all',
              activeFilePath === file.path 
                ? 'bg-workspace-bg text-workspace-text' 
                : 'text-workspace-muted hover:bg-workspace-hover hover:text-workspace-text'
            )}
          >
            <span className={cn(
              "h-2 w-2 rounded-full",
              file.isDirty ? "bg-yellow-500" : "bg-green-500"
            )} />
            <span className="flex-1 truncate text-left font-medium">{file.path.split('/').pop()}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeFile(file.path) }}
              className="rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-workspace-hover"
            >
              <X className="h-3 w-3" />
            </button>
          </button>
        ))}
      </div>

      <div className="relative flex-1 overflow-hidden">
        {activeFile ? (
          <>
            <div className="absolute right-4 top-4 z-10">
              <button
                onClick={handleSave}
                disabled={!activeFile.isDirty}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg transition-all",
                  activeFile.isDirty 
                    ? "bg-workspace-active text-white hover:bg-workspace-active/90" 
                    : "bg-workspace-sidebar text-workspace-muted"
                )}
              >
                <Save className="h-3.5 w-3.5" />
                {activeFile.isDirty ? 'Save' : 'Saved'}
              </button>
            </div>
            <Editor
              height="100%"
              path={activeFile.path}
              defaultLanguage={getLanguageFromPath(activeFile.path)}
              value={activeFile.content}
              theme="vs-dark"
              options={{
                minimap: { enabled: true, scale: 1 },
                fontSize: 14,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                multiCursorModifier: 'ctrlCmd',
                formatOnPaste: true,
                formatOnType: true,
                smoothScrolling: true,
                cursorSmoothCaretAnimation: 'on',
                renderWhitespace: 'selection'
              }}
              onChange={(value) => {
                if (value !== undefined && activeFilePath) {
                  updateFileContent(activeFilePath, value)
                }
              }}
              onMount={(editor, monaco) => {
                editor.focus()

                monaco.editor.defineTheme('git-workspace', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [],
                  colors: {
                    'editor.background': '#0d1117',
                    'editor.lineHighlightBackground': '#161b22',
                    'editor.selectionBackground': '#1f6feb40',
                    'editor.inactiveSelectionBackground': '#1f6feb20'
                  }
                })
                monaco.editor.setTheme('git-workspace')
              }}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-workspace-muted">
            <FileCode className="mb-4 h-16 w-16 opacity-20" />
            <p className="mb-1 text-lg font-medium text-workspace-text">Git Workspace</p>
            <p className="mb-6 text-sm">Open a file to start editing</p>
            <div className="flex gap-4 text-xs text-workspace-muted/60">
              <span>⌘S Save</span>
              <span>⌘W Close</span>
              <span>⌘P Quick Open</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}