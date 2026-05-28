import { create } from 'zustand';

// ==========================================
// INTERFACES & TYPES (Strict Typing)
// ==========================================

export interface FileNode {
  path: string;
  name: string;
  content?: string;
  isDirectory: boolean;
}

export interface GitFileStatus {
  filepath: string;
  status: 'modified' | 'added' | 'deleted' | 'unmodified' | 'staged' | string;
  stage: number;
}

interface AppState {
  // --- File Editor State ---
  openFiles: FileNode[];
  activeFilePath: string | null;
  
  // --- Git State ---
  gitStatus: GitFileStatus[];
  currentBranch: string | null;
  
  // --- UI State ---
  isLoading: boolean;
  sidebarOpen: boolean;

  // --- Actions ---
  openFile: (file: FileNode) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  
  setGitStatus: (status: GitFileStatus[]) => void;
  setCurrentBranch: (branch: string | null) => void;
  
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
}

// ==========================================
// ZUSTAND STORE
// ==========================================

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  openFiles: [],
  activeFilePath: null,
  gitStatus: [],
  currentBranch: null,
  isLoading: false,
  sidebarOpen: true,

  // --- File Actions ---
  openFile: (file) => {
    const { openFiles } = get();
    const isAlreadyOpen = openFiles.some((f) => f.path === file.path);
    
    set({
      openFiles: isAlreadyOpen ? openFiles : [...openFiles, file],
      activeFilePath: file.path,
    });
  },

  // ✅ FIXED: Logika closeFile agar fokus ke tab sebelah, bukan lompat ke kiri
  closeFile: (path) => {
    const { openFiles, activeFilePath } = get();
    const closedIndex = openFiles.findIndex((f) => f.path === path);
    if (closedIndex === -1) return;

    const filtered = openFiles.filter((f) => f.path !== path);
    
    let newActivePath = activeFilePath;
    if (activeFilePath === path) {
      if (filtered.length === 0) {
        newActivePath = null;
      } else if (closedIndex < filtered.length) {
        newActivePath = filtered[closedIndex].path;
      } else {
        newActivePath = filtered[closedIndex - 1].path;
      }
    }

    set({
      openFiles: filtered,
      activeFilePath: newActivePath,
    });
  },

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateFileContent: (path, content) => {
    const { openFiles } = get();
    const updatedFiles = openFiles.map((f) =>
      f.path === path ? { ...f, content } : f
    );
    set({ openFiles: updatedFiles });
  },

  // --- Git Actions ---
  setGitStatus: (status) => set({ gitStatus: status }),
  setCurrentBranch: (branch) => set({ currentBranch: branch }),

  // --- UI Actions ---
  setLoading: (loading) => set({ isLoading: loading }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
