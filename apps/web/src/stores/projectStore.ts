import { create } from 'zustand'
import { projectsApi, Project, CreateProjectDto } from '@/lib/api'

interface ProjectStore {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null

  loadProjects: () => Promise<void>
  selectProject: (id: string) => Promise<void>
  createProject: (data: CreateProjectDto) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  refreshCurrentProject: () => Promise<void>

  // Project actions
  installDependencies: () => Promise<string>
  buildProject: () => Promise<string>
  startProject: () => Promise<number>
  stopProject: () => Promise<void>
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const projects = await projectsApi.getAll()
      set({ projects, isLoading: false })

      // Auto-select first project if none selected
      if (projects.length > 0 && !get().currentProject) {
        await get().selectProject(projects[0].id)
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  selectProject: async (id: string) => {
    set({ isLoading: true })
    try {
      const project = await projectsApi.getOne(id)
      set({ currentProject: project, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createProject: async (data: CreateProjectDto) => {
    set({ isLoading: true })
    try {
      const project = await projectsApi.create(data)
      set((state) => ({
        projects: [...state.projects, project],
        currentProject: project,
        isLoading: false,
      }))
      return project
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  deleteProject: async (id: string) => {
    try {
      await projectsApi.delete(id)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }))
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  refreshCurrentProject: async () => {
    const current = get().currentProject
    if (current) {
      try {
        const project = await projectsApi.getOne(current.id)
        set({ currentProject: project })
      } catch (error: any) {
        set({ error: error.message })
      }
    }
  },

  installDependencies: async () => {
    const project = get().currentProject
    if (!project) throw new Error('No project selected')

    const result = await projectsApi.install(project.id)
    return result.output
  },

  buildProject: async () => {
    const project = get().currentProject
    if (!project) throw new Error('No project selected')

    const result = await projectsApi.build(project.id)
    return result.output
  },

  startProject: async () => {
    const project = get().currentProject
    if (!project) throw new Error('No project selected')

    const result = await projectsApi.start(project.id)
    await get().refreshCurrentProject()
    return result.port
  },

  stopProject: async () => {
    const project = get().currentProject
    if (!project) throw new Error('No project selected')

    await projectsApi.stop(project.id)
    await get().refreshCurrentProject()
  },
}))
