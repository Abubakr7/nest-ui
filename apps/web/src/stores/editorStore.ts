import { create } from 'zustand'
import { filesApi, FileTreeNode } from '@/lib/api'

interface OpenFile {
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
  originalContent: string
}

interface EditorStore {
  fileTree: FileTreeNode | null
  openFiles: OpenFile[]
  activeFile: string | null
  isLoading: boolean

  loadFileTree: (projectId: string) => Promise<void>
  openFile: (projectId: string, path: string) => Promise<void>
  closeFile: (path: string) => void
  setActiveFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  saveFile: (projectId: string, path: string) => Promise<void>
  saveAllFiles: (projectId: string) => Promise<void>
  createFile: (projectId: string, path: string, content?: string) => Promise<void>
  deleteFile: (projectId: string, path: string) => Promise<void>
  createFolder: (projectId: string, path: string) => Promise<void>
  refreshFileTree: (projectId: string) => Promise<void>
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  fileTree: null,
  openFiles: [],
  activeFile: null,
  isLoading: false,

  loadFileTree: async (projectId: string) => {
    set({ isLoading: true })
    try {
      const tree = await filesApi.getTree(projectId)
      set({ fileTree: tree, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to load file tree:', error)
    }
  },

  openFile: async (projectId: string, path: string) => {
    // Check if file is already open
    const existing = get().openFiles.find((f) => f.path === path)
    if (existing) {
      set({ activeFile: path })
      return
    }

    set({ isLoading: true })
    try {
      const { content, language } = await filesApi.getContent(projectId, path)
      const name = path.split('/').pop() || path

      set((state) => ({
        openFiles: [
          ...state.openFiles,
          { path, name, content, language, isDirty: false, originalContent: content },
        ],
        activeFile: path,
        isLoading: false,
      }))
    } catch (error) {
      set({ isLoading: false })
      console.error('Failed to open file:', error)
    }
  },

  closeFile: (path: string) => {
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f.path !== path)
      let newActiveFile = state.activeFile

      if (state.activeFile === path) {
        const index = state.openFiles.findIndex((f) => f.path === path)
        if (newOpenFiles.length > 0) {
          newActiveFile = newOpenFiles[Math.min(index, newOpenFiles.length - 1)].path
        } else {
          newActiveFile = null
        }
      }

      return { openFiles: newOpenFiles, activeFile: newActiveFile }
    })
  },

  setActiveFile: (path: string) => {
    set({ activeFile: path })
  },

  updateFileContent: (path: string, content: string) => {
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path
          ? { ...f, content, isDirty: content !== f.originalContent }
          : f
      ),
    }))
  },

  saveFile: async (projectId: string, path: string) => {
    const file = get().openFiles.find((f) => f.path === path)
    if (!file) return

    try {
      await filesApi.update(projectId, { path, content: file.content })
      set((state) => ({
        openFiles: state.openFiles.map((f) =>
          f.path === path
            ? { ...f, isDirty: false, originalContent: f.content }
            : f
        ),
      }))
    } catch (error) {
      console.error('Failed to save file:', error)
      throw error
    }
  },

  saveAllFiles: async (projectId: string) => {
    const dirtyFiles = get().openFiles.filter((f) => f.isDirty)
    await Promise.all(dirtyFiles.map((f) => get().saveFile(projectId, f.path)))
  },

  createFile: async (projectId: string, path: string, content = '') => {
    await filesApi.create(projectId, { path, content })
    await get().loadFileTree(projectId)
    await get().openFile(projectId, path)
  },

  deleteFile: async (projectId: string, path: string) => {
    await filesApi.delete(projectId, path)
    get().closeFile(path)
    await get().loadFileTree(projectId)
  },

  createFolder: async (projectId: string, path: string) => {
    await filesApi.createFolder(projectId, path)
    await get().loadFileTree(projectId)
  },

  refreshFileTree: async (projectId: string) => {
    await get().loadFileTree(projectId)
  },
}))
