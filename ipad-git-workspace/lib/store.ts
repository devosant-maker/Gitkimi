import { create } from 'zustand'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

export interface OpenFile {
  path: string
  content: string
  originalContent: string
  isDirty: boolean
}

export interface ToastMessage {
  message: string
  type: 'success' | 'error' | 'info'
}

interface WorkspaceState {
  repoDir: string | null
  repoUrl: string | null
  repoName: string | null
  fileTree: FileNode[]
  openFiles: OpenFile[]
  activeFilePath: string | null
  gitStatus: any[]
  currentBranch: string
  branches: string[]
  isLoading: boolean
  loadingMessage: string
  toast: ToastMessage | null
  showTerminal: boolean

  setRepo: (dir: string, url: string, name: string) => void
  clearRepo: () => void
  setFileTree: (tree: FileNode[]) => void
  openFile: (path: string, content: string) => void
  updateFileContent: (path: string, content: string) => void
  saveFile: (path: string) => void
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  setGitStatus: (status: any[]) => void
  setBranch: (branch: string) => void
  setBranches: (branches: string[]) => void
  setLoading: (loading: boolean, message?: string) => void
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
  clearToast: () => void
  toggleTerminal: () => void
  setShowTerminal: (show: boolean) => void
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  repoDir: null,
  repoUrl: null,
  repoName: null,
  fileTree: [],
  openFiles: [],
  activeFilePath: null,
  gitStatus: [],
  currentBranch: 'main',
  branches: [],
  isLoading: false,
  loadingMessage: '',
  toast: null,
  showTerminal: true,

  setRepo: (dir, url, name) => set({ repoDir: dir, repoUrl: url, repoName: name }),

  clearRepo: () => set({ 
    repoDir: null, repoUrl: null, repoName: null, 
    fileTree: [], openFiles: [], activeFilePath: null,
    gitStatus: [], currentBranch: 'main', branches: [] 
  }),

  setFileTree: (tree) => set({ fileTree: tree }),

  openFile: (path, content) => {
    const { openFiles } = get()
    const existing = openFiles.find(f => f.path === path)
    if (!existing) {
      set({ 
        openFiles: [...openFiles, { path, content, originalContent: content, isDirty: false }],
        activeFilePath: path 
      })
    } else {
      set({ activeFilePath: path })
    }
  },

  updateFileContent: (path, content) => {
    const { openFiles } = get()
    set({
      openFiles: openFiles.map(f => 
        f.path === path ? { ...f, content, isDirty: content !== f.originalContent } : f
      )
    })
  },

  saveFile: (path) => {
    const { openFiles } = get()
    const file = openFiles.find(f => f.path === path)
    if (!file) return
    set({
      openFiles: openFiles.map(f => 
        f.path === path ? { ...f, originalContent: file.content, isDirty: false } : f
      )
    })
  },

  closeFile: (path) => {
    const { openFiles, activeFilePath } = get()
    const filtered = openFiles.filter(f => f.path !== path)
    set({ 
      openFiles: filtered,
      activeFilePath: activeFilePath === path ? (filtered[0]?.path || null) : activeFilePath
    })
  },

  setActiveFile: (path) => set({ activeFilePath: path }),
  setGitStatus: (status) => set({ gitStatus: status }),
  setBranch: (branch) => set({ currentBranch: branch }),
  setBranches: (branches) => set({ branches }),

  setLoading: (loading, message = '') => set({ isLoading: loading, loadingMessage: message }),

  showToast: (message, type) => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
  toggleTerminal: () => set(state => ({ showTerminal: !state.showTerminal })),
  setShowTerminal: (show) => set({ showTerminal: show })
}))